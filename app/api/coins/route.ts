/**
 * /api/coins — Server-authoritative coin economy.
 *
 * GET  → { balance, purchases: string[] }
 * POST → { action: "earn", reason } | { action: "spend", amount, itemId }
 *        Returns { balance, earned?, purchased? }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userCoins, coinPurchases } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

const COIN_REWARDS: Record<string, number> = {
  daily_correct: 10,
  daily_wrong: 3,
  daily_streak: 2,
  study_task: 2,
  scan_complete: 5,
  achievement: 20,
  repertoire_save: 2,
};

/* ------------------------------------------------------------------ */
/*  GET — fetch balance + purchased item IDs                            */
/* ------------------------------------------------------------------ */

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [row] = await db
    .select({ balance: userCoins.balance })
    .from(userCoins)
    .where(eq(userCoins.userId, userId))
    .limit(1);

  const purchases = await db
    .select({ itemId: coinPurchases.itemId })
    .from(coinPurchases)
    .where(eq(coinPurchases.userId, userId));

  return NextResponse.json({
    balance: row?.balance ?? 0,
    purchases: purchases.map((p) => p.itemId),
  });
}

/* ------------------------------------------------------------------ */
/*  POST — earn or spend coins                                          */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await req.json();
  const { action } = body as { action?: string };

  if (action === "earn") {
    const { reason } = body as { reason?: string };
    if (!reason || !(reason in COIN_REWARDS)) {
      return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
    }

    const amount = COIN_REWARDS[reason];

    // Upsert balance (atomic increment)
    await db
      .insert(userCoins)
      .values({ userId, balance: amount })
      .onConflictDoUpdate({
        target: userCoins.userId,
        set: {
          balance: sql`${userCoins.balance} + ${amount}`,
          updatedAt: new Date(),
        },
      });

    // Read back
    const [row] = await db
      .select({ balance: userCoins.balance })
      .from(userCoins)
      .where(eq(userCoins.userId, userId))
      .limit(1);

    return NextResponse.json({ balance: row?.balance ?? 0, earned: amount });
  }

  if (action === "spend") {
    const { amount, itemId } = body as { amount?: number; itemId?: string };
    if (!amount || amount <= 0 || !itemId) {
      return NextResponse.json({ error: "amount and itemId required" }, { status: 400 });
    }

    // Check balance
    const [row] = await db
      .select({ balance: userCoins.balance })
      .from(userCoins)
      .where(eq(userCoins.userId, userId))
      .limit(1);

    const currentBalance = row?.balance ?? 0;
    if (currentBalance < amount) {
      return NextResponse.json({ error: "Insufficient coins", balance: currentBalance }, { status: 400 });
    }

    // Check if already purchased
    const existing = await db
      .select({ itemId: coinPurchases.itemId })
      .from(coinPurchases)
      .where(eq(coinPurchases.userId, userId));

    if (existing.some((p) => p.itemId === itemId)) {
      return NextResponse.json({ balance: currentBalance, purchased: true, alreadyOwned: true });
    }

    // Deduct and record purchase
    const newBalance = currentBalance - amount;
    await db
      .update(userCoins)
      .set({ balance: newBalance, updatedAt: new Date() })
      .where(eq(userCoins.userId, userId));

    await db.insert(coinPurchases).values({ userId, itemId, amount });

    return NextResponse.json({ balance: newBalance, purchased: true });
  }

  // Sync action — set balance to specific value (for initial migration from localStorage)
  if (action === "sync") {
    const { balance, purchases } = body as { balance?: number; purchases?: string[] };
    if (typeof balance !== "number") {
      return NextResponse.json({ error: "balance required" }, { status: 400 });
    }

    // Only sync if user has no existing DB row (first-time migration)
    const [existing] = await db
      .select({ balance: userCoins.balance })
      .from(userCoins)
      .where(eq(userCoins.userId, userId))
      .limit(1);

    if (existing) {
      // DB already has data — return it (DB is authoritative)
      const dbPurchases = await db
        .select({ itemId: coinPurchases.itemId })
        .from(coinPurchases)
        .where(eq(coinPurchases.userId, userId));

      return NextResponse.json({
        balance: existing.balance,
        purchases: dbPurchases.map((p) => p.itemId),
        migrated: false,
      });
    }

    // First time — migrate localStorage data to DB
    await db.insert(userCoins).values({ userId, balance: Math.max(0, balance) });

    if (purchases?.length) {
      await db.insert(coinPurchases).values(
        purchases.map((itemId) => ({ userId, itemId, amount: 0 }))
      );
    }

    return NextResponse.json({
      balance: Math.max(0, balance),
      purchases: purchases ?? [],
      migrated: true,
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
