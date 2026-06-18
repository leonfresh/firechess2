/**
 * Weekly email digest — Vercel Cron Job
 *
 * Sends a personalised weekly summary email to each opted-in user:
 *  - Recent scan count & best accuracy
 *  - Study plan streak
 *  - Encouragement to rescan
 *
 * Secured by CRON_SECRET header check.
 *
 * Schedule in vercel.json:  "crons": [{ "path": "/api/cron/weekly-digest", "schedule": "0 14 * * 1" }]
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, subscriptions, reports, studyPlans } from "@/lib/schema";
import { eq, desc, gte, and, sql } from "drizzle-orm";
import type { RepeatedOpeningLeak } from "@/lib/types";
import {
  ratingBracket,
  weeklyWeakness,
  currentWeekIndex,
} from "@/lib/weekly-weakness";

export const runtime = "nodejs";
export const maxDuration = 60; // seconds

export async function GET(req: NextRequest) {
  /* ── Auth ── */
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resendKey = process.env.AUTH_RESEND_KEY;
  const from = process.env.AUTH_RESEND_FROM ?? "FireChess <noreply@firechess.com>";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://firechess.com";

  if (!resendKey) {
    return NextResponse.json({ error: "No RESEND key configured" }, { status: 500 });
  }

  /* ── Gather all opted-in users who have at least 1 report ── */
  const eligibleUsers = await db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .innerJoin(subscriptions, eq(subscriptions.userId, users.id))
    .where(eq(subscriptions.weeklyDigest, true));

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  let sent = 0;

  for (const user of eligibleUsers) {
    if (!user.email) continue;

    /* ─ Reports this week ─ */
    const weekReports = await db
      .select({
        accuracy: reports.estimatedAccuracy,
        rating: reports.estimatedRating,
        gamesAnalyzed: reports.gamesAnalyzed,
        createdAt: reports.createdAt,
      })
      .from(reports)
      .where(and(eq(reports.userId, user.userId), gte(reports.createdAt, oneWeekAgo)))
      .orderBy(desc(reports.estimatedAccuracy));

    /* ─ Latest report ever (for "days since last scan" + top leak) ─ */
    const [latestReport] = await db
      .select({
        id: reports.id,
        createdAt: reports.createdAt,
        leaks: reports.leaks,
        playerRating: reports.playerRating,
        chessUsername: reports.chessUsername,
        source: reports.source,
      })
      .from(reports)
      .where(eq(reports.userId, user.userId))
      .orderBy(desc(reports.createdAt))
      .limit(1);

    if (!latestReport) continue; // never scanned → skip

    /* ─ Active study plan streak ─ */
    const [activePlan] = await db
      .select({
        title: studyPlans.title,
        currentStreak: studyPlans.currentStreak,
        progress: studyPlans.progress,
      })
      .from(studyPlans)
      .where(and(eq(studyPlans.userId, user.userId), eq(studyPlans.active, true)))
      .orderBy(desc(studyPlans.updatedAt))
      .limit(1);

    /* ─ Build email content ─ */
    const daysSince = Math.floor(
      (Date.now() - new Date(latestReport.createdAt!).getTime()) / (1000 * 60 * 60 * 24),
    );
    const scanCount = weekReports.length;
    const bestAcc = weekReports.length > 0 ? weekReports[0].accuracy?.toFixed(1) : null;
    const totalGames = weekReports.reduce((s, r) => s + (r.gamesAnalyzed ?? 0), 0);
    const firstName = (user.name ?? "Chess Player").split(" ")[0];

    const unsubUrl = `${appUrl}/api/email-prefs?action=unsubscribe&uid=${user.userId}`;

    /* ─ Lead card: the user's single biggest leak ─────────────────── */
    // Impact-weighted: a leak that recurs and costs centipawns is the one
    // actually costing rating, not a one-off blunder. Falls back to the
    // universal weakness-of-the-week if the report has no structured leaks.
    const leaks = (latestReport.leaks ?? []) as RepeatedOpeningLeak[];
    const topLeak = leaks
      .map((l) => ({ leak: l, impact: (l.cpLoss ?? 0) * (l.reachCount ?? 1) }))
      .sort((a, b) => b.impact - a.impact)[0]?.leak;

    const reportUrl = `${appUrl}/report/${latestReport.id}`;

    const leakHtml = topLeak
      ? `
        <div style="background: #1a120b; border: 1px solid rgba(249,115,22,0.25); border-radius: 10px; padding: 20px; margin-bottom: 16px;">
          <p style="color: #fb923c; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; margin: 0 0 8px;">
            🔥 Your biggest leak right now
          </p>
          <p style="color: #fff; font-size: 18px; font-weight: 700; margin: 0 0 8px;">
            ${escapeHtml(topLeak.openingName ?? "A recurring position")}
          </p>
          <p style="color: #d4d4d8; font-size: 14px; line-height: 1.5; margin: 0 0 12px;">
            You played <strong style="color:#fff;">${escapeHtml(topLeak.userMove ?? "?")}</strong>
            ${topLeak.bestMove ? ` instead of <strong style="color:#34d399;">${escapeHtml(topLeak.bestMove)}</strong>` : ""}
            in ${topLeak.reachCount ?? 1} game${(topLeak.reachCount ?? 1) > 1 ? "s" : ""},
            dropping about <strong style="color:#fbbf24;">${(topLeak.cpLoss ?? 0).toFixed(1)}cp</strong> each time.
          </p>
          ${
            topLeak.userWins != null || topLeak.userLosses != null
              ? `<p style="color:#71717a; font-size:12px; margin:0 0 14px;">
                  Your record with it: ${topLeak.userWins ?? 0}W ${topLeak.userDraws ?? 0}D ${topLeak.userLosses ?? 0}L
                 </p>`
              : ""
          }
          <a href="${reportUrl}" style="display:inline-block; background: linear-gradient(135deg, #fbbf24, #f97316); color:#1c1917; font-weight:700; font-size:13px; padding:10px 22px; border-radius:8px; text-decoration:none;">
            Drill this position →
          </a>
        </div>`
      : "";

    /* ─ Universal "weakness of the week" — valuable even with no activity ─ */
    const bracket = ratingBracket(latestReport.playerRating ?? undefined);
    const tip = weeklyWeakness(bracket, currentWeekIndex());

    const tipHtml = `
        <div style="background: #18181b; border-left: 3px solid #a78bfa; border-radius: 8px; padding: 18px; margin-bottom: 16px;">
          <p style="color: #c084fc; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; margin: 0 0 6px;">
            📚 Weakness of the week · ${bracket} level
          </p>
          <p style="color: #fff; font-size: 16px; font-weight: 600; margin: 0 0 8px;">
            ${escapeHtml(tip.title)}
          </p>
          <p style="color: #a1a1aa; font-size: 13px; line-height: 1.55; margin: 0 0 10px;">
            ${escapeHtml(tip.blurb)}
          </p>
          <p style="color: #34d399; font-size: 13px; line-height: 1.55; margin: 0;">
            <strong>Fix:</strong> ${escapeHtml(tip.fix)}
          </p>
        </div>`;

    /* ─ Activity footer (demoted — vanity stats no longer lead) ─────── */
    const activityLine =
      scanCount > 0
        ? `${scanCount} scan${scanCount > 1 ? "s" : ""} · ${totalGames} games${
            bestAcc ? ` · best accuracy ${bestAcc}%` : ""
          }`
        : `Last scan ${daysSince} day${daysSince !== 1 ? "s" : ""} ago`;

    // Study plan row
    let planHtml = "";
    if (activePlan) {
      planHtml = `
        <div style="background: #18181b; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <p style="color: #c084fc; font-size: 14px; font-weight: 600; margin: 0 0 4px;">
            📚 Study Plan: ${escapeHtml(activePlan.title ?? "")}
          </p>
          <p style="color: #a1a1aa; font-size: 13px; margin: 0;">
            ${activePlan.currentStreak} day streak · ${activePlan.progress}% complete
          </p>
        </div>`;
    }

    const subject = topLeak
      ? `🔥 Your leak this week: ${truncate(topLeak.openingName ?? "a recurring position", 30)}`
      : `🔥 ${tip.title} — this week's fix`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #e4e4e7;">
        <div style="background: #0a0a0a; border-radius: 12px; padding: 32px; border: 1px solid #27272a;">
          <div style="margin-bottom: 24px;">
            <span style="font-size: 24px; font-weight: 700; color: #fff;">🔥 FireChess</span>
            <span style="color: #52525b; font-size: 13px; margin-left: 8px;">Weekly Leak Report</span>
          </div>

          <p style="color: #fff; font-size: 18px; font-weight: 600; margin-bottom: 16px;">
            Hey ${escapeHtml(firstName)} 👋
          </p>

          <p style="color: #a1a1aa; font-size: 14px; margin-bottom: 20px; line-height: 1.5;">
            ${
              topLeak
                ? "Here's the single mistake costing you the most rating right now — plus this week's universal weakness to drill."
                : "No new scan to analyse yet, so here's this week's weakness for your level. Run a scan to get a personal leak report like the one below."
            }
          </p>

          ${leakHtml}
          ${tipHtml}
          ${planHtml}

          <a href="${appUrl}" style="display: inline-block; background: linear-gradient(135deg, #fbbf24, #f97316); color: #1c1917; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 8px; text-decoration: none;">
            ${scanCount > 0 ? "View my dashboard →" : "Scan my games →"}
          </a>

          <p style="color: #52525b; font-size: 11px; margin-top: 20px;">${escapeHtml(activityLine)}</p>

          <p style="color: #3f3f46; font-size: 11px; margin-top: 24px; border-top: 1px solid #27272a; padding-top: 16px;">
            You're receiving this because you have a FireChess account.
            <a href="${unsubUrl}" style="color: #52525b; text-decoration: underline;">Unsubscribe from weekly digests</a>
          </p>
        </div>
      </div>
    `;

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: user.email,
          subject,
          html,
        }),
      });

      if (res.ok) {
        sent++;
      } else {
        const errText = await res.text();
        console.error(`[digest] Failed for ${user.email}:`, res.status, errText);
      }
    } catch (err) {
      console.error(`[digest] Error for ${user.email}:`, err);
    }
  }

  return NextResponse.json({ ok: true, sent, total: eligibleUsers.length });
}

/* ── Small HTML helpers ─────────────────────────────────────────────────── */

function escapeHtml(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}
