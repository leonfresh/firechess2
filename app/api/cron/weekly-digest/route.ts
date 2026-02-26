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

    /* ─ Latest report ever (for "days since last scan") ─ */
    const [latestReport] = await db
      .select({ createdAt: reports.createdAt })
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

    // Build stats rows
    let statsHtml = "";
    if (scanCount > 0) {
      statsHtml = `
        <div style="background: #18181b; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <p style="color: #34d399; font-size: 20px; font-weight: 700; margin: 0 0 4px;">
            ${scanCount} scan${scanCount > 1 ? "s" : ""} this week
          </p>
          <p style="color: #a1a1aa; font-size: 13px; margin: 0;">
            ${totalGames} games analyzed ${bestAcc ? `· Best accuracy: <strong style="color:#fff;">${bestAcc}%</strong>` : ""}
          </p>
        </div>`;
    } else {
      statsHtml = `
        <div style="background: #18181b; border-radius: 8px; padding: 16px; margin-bottom: 16px; border-left: 3px solid #f59e0b;">
          <p style="color: #fbbf24; font-size: 16px; font-weight: 600; margin: 0 0 4px;">
            No scans this week
          </p>
          <p style="color: #a1a1aa; font-size: 13px; margin: 0;">
            Your last scan was ${daysSince} day${daysSince !== 1 ? "s" : ""} ago. Time for a fresh analysis!
          </p>
        </div>`;
    }

    // Study plan row
    let planHtml = "";
    if (activePlan) {
      planHtml = `
        <div style="background: #18181b; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <p style="color: #c084fc; font-size: 14px; font-weight: 600; margin: 0 0 4px;">
            📚 Study Plan: ${activePlan.title}
          </p>
          <p style="color: #a1a1aa; font-size: 13px; margin: 0;">
            ${activePlan.currentStreak} day streak · ${activePlan.progress}% complete
          </p>
        </div>`;
    }

    // Motivational line
    const motivations = [
      "Every game has a lesson. Let's find yours.",
      "The best players study their losses. You're already ahead.",
      "Small improvements compound. Keep scanning!",
      "Your next breakthrough is one scan away.",
      "Consistency beats talent. Keep the streak alive!",
    ];
    const motivation = motivations[Math.floor(Math.random() * motivations.length)];

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #e4e4e7;">
        <div style="background: #0a0a0a; border-radius: 12px; padding: 32px; border: 1px solid #27272a;">
          <div style="margin-bottom: 24px;">
            <span style="font-size: 24px; font-weight: 700; color: #fff;">🔥 FireChess</span>
            <span style="color: #52525b; font-size: 13px; margin-left: 8px;">Weekly Digest</span>
          </div>

          <p style="color: #fff; font-size: 18px; font-weight: 600; margin-bottom: 16px;">
            Hey ${firstName} 👋
          </p>

          <p style="color: #a1a1aa; font-size: 14px; margin-bottom: 20px;">
            Here's your weekly chess improvement summary:
          </p>

          ${statsHtml}
          ${planHtml}

          <p style="color: #a1a1aa; font-size: 13px; font-style: italic; margin-bottom: 24px;">
            "${motivation}"
          </p>

          <a href="${appUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #06b6d4); color: #000; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 8px; text-decoration: none;">
            ${scanCount > 0 ? "View Dashboard →" : "Scan Now →"}
          </a>

          <p style="color: #3f3f46; font-size: 11px; margin-top: 32px; border-top: 1px solid #27272a; padding-top: 16px;">
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
          subject: scanCount > 0
            ? `🔥 Your Week: ${scanCount} scan${scanCount > 1 ? "s" : ""}${bestAcc ? `, ${bestAcc}% best accuracy` : ""}`
            : `🔥 Time for a fresh scan — ${daysSince}d since your last`,
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
