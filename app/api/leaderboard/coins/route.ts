/**
 * GET /api/leaderboard/coins — Public coin leaderboard.
 *
 * Query params:
 *   limit = number (default 50, max 100)
 *
 * Ranks players by LIFETIME coins earned, not current balance:
 *   earned = balance + everything spent in the shop
 *
 * Every earn path (activities via /api/coins, daily-login rewards) bumps
 * `user_coins.balance`, and every spend path records a `coin_purchase` row,
 * so balance + spend reconciles to lifetime earned with no extra columns.
 * Caveat: coin purchases migrated from localStorage were inserted with
 * amount 0, so spending from before the DB migration is under-counted.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userCoins, users, coinPurchases } from "@/lib/schema";
import { desc, sql } from "drizzle-orm";

export const revalidate = 120;

export async function GET(req: NextRequest) {
  const limit = Math.min(
    Math.max(
      parseInt(req.nextUrl.searchParams.get("limit") ?? "50", 10) || 50,
      1,
    ),
    100,
  );

  // Everything each user has spent in the shop, summed per user
  const spentSub = db
    .select({
      userId: coinPurchases.userId,
      spent: sql<number>`coalesce(sum(${coinPurchases.amount}), 0)::int`.as(
        "spent",
      ),
    })
    .from(coinPurchases)
    .groupBy(coinPurchases.userId)
    .as("coin_spent");

  const earnedExpr = sql<number>`(${userCoins.balance} + coalesce(${spentSub.spent}, 0))`;

  const rows = await db
    .select({
      userId: userCoins.userId,
      name: users.name,
      image: users.image,
      chaosUsername: users.chaosUsername,
      balance: userCoins.balance,
      spent: sql<number>`coalesce(${spentSub.spent}, 0)`,
      earned: earnedExpr,
    })
    .from(userCoins)
    .innerJoin(users, sql`${users.id} = ${userCoins.userId}`)
    .leftJoin(spentSub, sql`${spentSub.userId} = ${userCoins.userId}`)
    .where(sql`${earnedExpr} > 0`)
    .orderBy(desc(earnedExpr), desc(userCoins.balance))
    .limit(limit);

  // Aggregate stats for the page header
  const [coinTotals] = await db
    .select({
      players: sql<number>`count(*) filter (where ${userCoins.balance} > 0)::int`,
      balances: sql<number>`coalesce(sum(${userCoins.balance}), 0)::int`,
    })
    .from(userCoins);
  const [spendTotals] = await db
    .select({
      spent: sql<number>`coalesce(sum(${coinPurchases.amount}), 0)::int`,
    })
    .from(coinPurchases);

  return NextResponse.json(
    {
      entries: rows,
      totals: {
        players: coinTotals?.players ?? 0,
        earned:
          (coinTotals?.balances ?? 0) + (spendTotals?.spent ?? 0),
      },
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
      },
    },
  );
}
