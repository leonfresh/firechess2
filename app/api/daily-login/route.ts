/**
 * /api/daily-login — Server-authoritative daily login streak.
 *
 * GET  → { state: LoginState, rewards: DayReward[] }
 * POST → { action: "claim" } → { reward, newBalance, state }
 *
 * All streak data lives in the database so users can't exploit it
 * across devices by clearing localStorage.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { dailyLogins, userCoins } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

/* ------------------------------------------------------------------ */
/*  Reward schedule (mirrored from lib/daily-login.ts)                  */
/* ------------------------------------------------------------------ */

const LOGIN_REWARDS = [
  { day: 1, coins: 5,  label: "Welcome back!",     icon: "👋" },
  { day: 2, coins: 8,  label: "On a roll!",         icon: "🔥" },
  { day: 3, coins: 10, label: "Keep going!",        icon: "⚡" },
  { day: 4, coins: 12, label: "Halfway there!",     icon: "🎯" },
  { day: 5, coins: 15, label: "Dedicated player!",  icon: "💪" },
  { day: 6, coins: 20, label: "Almost there!",      icon: "🌟" },
  { day: 7, coins: 30, label: "Weekly reward!",     icon: "🏆" },
];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ */
/*  GET — fetch login state                                             */
/* ------------------------------------------------------------------ */

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [row] = await db
    .select()
    .from(dailyLogins)
    .where(eq(dailyLogins.userId, session.user.id))
    .limit(1);

  const today = todayStr();
  const yesterday = yesterdayStr();

  const state = row
    ? {
        currentDay: row.currentDay,
        lastClaimDate: row.lastClaimDate,
        claimedToday: row.lastClaimDate === today,
        totalDaysLogged: row.totalDaysLogged,
        cyclesCompleted: row.cyclesCompleted,
        streakActive: row.lastClaimDate === today || row.lastClaimDate === yesterday,
      }
    : {
        currentDay: 0,
        lastClaimDate: "",
        claimedToday: false,
        totalDaysLogged: 0,
        cyclesCompleted: 0,
        streakActive: false,
      };

  return NextResponse.json({ state, rewards: LOGIN_REWARDS });
}

/* ------------------------------------------------------------------ */
/*  POST — claim today's reward                                         */
/* ------------------------------------------------------------------ */

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const today = todayStr();
  const yesterday = yesterdayStr();

  // Get current state
  const [row] = await db
    .select()
    .from(dailyLogins)
    .where(eq(dailyLogins.userId, userId))
    .limit(1);

  const currentDay = row?.currentDay ?? 0;
  const lastClaim = row?.lastClaimDate ?? "";
  const totalDays = row?.totalDaysLogged ?? 0;
  const cycles = row?.cyclesCompleted ?? 0;

  // Already claimed today
  if (lastClaim === today) {
    return NextResponse.json({ error: "Already claimed today" }, { status: 400 });
  }

  // Determine next streak day
  let nextDay: number;
  if (lastClaim === yesterday && currentDay < 7) {
    nextDay = currentDay + 1;
  } else {
    nextDay = 1; // Reset streak
  }

  const reward = LOGIN_REWARDS[nextDay - 1];
  const newCycles = cycles + (nextDay === 7 ? 1 : 0);

  // Upsert daily login state
  await db
    .insert(dailyLogins)
    .values({
      userId,
      currentDay: nextDay,
      lastClaimDate: today,
      totalDaysLogged: totalDays + 1,
      cyclesCompleted: newCycles,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: dailyLogins.userId,
      set: {
        currentDay: nextDay,
        lastClaimDate: today,
        totalDaysLogged: totalDays + 1,
        cyclesCompleted: newCycles,
        updatedAt: new Date(),
      },
    });

  // Award coins (atomic increment)
  await db
    .insert(userCoins)
    .values({ userId, balance: reward.coins })
    .onConflictDoUpdate({
      target: userCoins.userId,
      set: {
        balance: sql`${userCoins.balance} + ${reward.coins}`,
        updatedAt: new Date(),
      },
    });

  // Get updated balance
  const [coinRow] = await db
    .select({ balance: userCoins.balance })
    .from(userCoins)
    .where(eq(userCoins.userId, userId))
    .limit(1);

  const newBalance = coinRow?.balance ?? reward.coins;

  return NextResponse.json({
    reward,
    newBalance,
    state: {
      currentDay: nextDay,
      lastClaimDate: today,
      claimedToday: true,
      totalDaysLogged: totalDays + 1,
      cyclesCompleted: newCycles,
      streakActive: true,
    },
  });
}
