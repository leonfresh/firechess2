/**
 * One-off report unlocks (US$9): every finding in one scan, for the buyer, kept permanently.
 * Unlocks bought in the last 30 days count toward Lifetime at checkout.
 */
import { and, eq, gte, sum } from "drizzle-orm";
import { db } from "./db";
import { reportUnlocks } from "./schema";

export const REPORT_UNLOCK_CENTS = 900;
export const LIFETIME_CENTS = 5900;
const CREDIT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
/** Lifetime never drops below half price, however many reports were unlocked. */
const MAX_CREDIT_CENTS = 2900;

export async function hasReportUnlock(userId: string, scanId: string) {
  const [row] = await db.select({ id: reportUnlocks.id }).from(reportUnlocks)
    .where(and(eq(reportUnlocks.userId, userId), eq(reportUnlocks.scanId, scanId))).limit(1);
  return !!row;
}

export async function lifetimeCreditCents(userId: string) {
  const [row] = await db.select({ total: sum(reportUnlocks.amountCents) }).from(reportUnlocks)
    .where(and(eq(reportUnlocks.userId, userId), gte(reportUnlocks.createdAt, new Date(Date.now() - CREDIT_WINDOW_MS))));
  return Math.min(Number(row?.total ?? 0), MAX_CREDIT_CENTS);
}
