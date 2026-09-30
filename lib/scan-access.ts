/**
 * Server-side report entitlement. The report paywall used to be enforced only
 * in the browser, so every finding shipped to every client. These helpers make
 * the server decide: the scan's owner (signed in or guest owner token), Pro /
 * Lifetime, a $9 report unlock, admins and curated samples get the full result;
 * everyone else only the Free allowance.
 */
import { eq } from "drizzle-orm";
import { isAdmin } from "./admin";
import { db } from "./db";
import { subscriptions } from "./schema";
import { hasReportUnlock } from "./report-unlock";
import { SAMPLE_REPORTS } from "./sample-reports";
import type { AnalyzeResponse } from "./types";

/** Findings a Free report shows per category; Pro or a $9 unlock shows all. */
export const FREE_FINDING_LIMIT = 6;

const SAMPLE_REPORT_IDS = new Set(
  SAMPLE_REPORTS.map((r) => r.reportId).filter(Boolean),
);

/** Curated sample reports are public demos and stay complete for everyone. */
export function isSampleReport(scanId: string): boolean {
  return SAMPLE_REPORT_IDS.has(scanId);
}

/** True when this user may receive every finding for this scan. */
export async function hasFullReportAccess(
  userId: string | null | undefined,
  scanId: string,
): Promise<boolean> {
  if (!userId) return false;
  if (await isAdmin(userId)) return true;
  const [sub] = await db
    .select({ plan: subscriptions.plan })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  if (sub?.plan === "pro" || sub?.plan === "lifetime") return true;
  return hasReportUnlock(userId, scanId);
}

/**
 * Whether this request may receive every finding. Full access goes to the
 * scan's owner (signed in, or a matching guest owner token), Pro / Lifetime,
 * a $9 unlock, admins, and curated samples; everyone else gets the Free view.
 */
export async function resolveFullAccess(opts: {
  scanId: string;
  scanUserId: string | null;
  guestToken?: string | null;
  userId?: string | null;
  ownerToken?: string | null;
}): Promise<boolean> {
  if (isSampleReport(opts.scanId)) return true;
  if (opts.userId && opts.scanUserId && opts.userId === opts.scanUserId)
    return true;
  if (opts.ownerToken && opts.guestToken && opts.ownerToken === opts.guestToken)
    return true;
  return hasFullReportAccess(opts.userId, opts.scanId);
}

const cap = <T>(list: T[] | undefined): T[] =>
  (list ?? []).slice(0, FREE_FINDING_LIMIT);

/**
 * The Free view of a stored result: every finding list is capped to the Free
 * allowance, so reading the API or the page's RSC payload cannot reveal the
 * paid findings. Aggregate counts and metadata are unchanged, so the Free
 * report still renders normally.
 */
export function redactScanResultForFree(
  result: AnalyzeResponse | null,
): AnalyzeResponse | null {
  if (!result) return result;
  return {
    ...result,
    leaks: cap(result.leaks),
    oneOffMistakes: cap(result.oneOffMistakes),
    missedTactics: cap(result.missedTactics),
    endgameMistakes: cap(result.endgameMistakes),
    brilliantMoves: cap(result.brilliantMoves),
    positionalFindings: cap(result.positionalFindings),
    timeManagement: result.timeManagement
      ? { ...result.timeManagement, moments: cap(result.timeManagement.moments) }
      : result.timeManagement,
  };
}
