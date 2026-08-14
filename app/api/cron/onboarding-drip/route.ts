/**
 * POST /api/cron/onboarding-drip
 *
 * Onboarding email sequence for new FireChess users.
 * Runs every 6 hours via Vercel Cron.
 *
 * Sequence:
 *   Step 0 → 1: Welcome email (immediately after first scan)
 *   Step 1 → 2: "Your top 3 leaks" (24h after welcome)
 *   Step 2 → 3: "Upgrade to Pro" (72h after welcome)
 *
 * Auth: Bearer CRON_SECRET header.
 */

import { NextResponse } from "next/server";
import { eq, and, lt, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, scanSessions } from "@/lib/schema";

const STEP_DELAYS_MS = [0, 24 * 60 * 60 * 1000, 72 * 60 * 60 * 1000]; // 0h, 24h, 72h

export async function POST(req: Request) {
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

  // Find users with email who have at least 1 scan and are due for next step
  const now = Date.now();
  const eligible = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      step: users.onboardEmailStep,
      lastSent: users.onboardEmailLastSentAt,
    })
    .from(users)
    .where(
      and(
        isNotNull(users.email),
        // Has completed at least 1 scan (step 0 means no email sent yet, but needs a scan to trigger)
        // Step 1-2 need delay check
      ),
    );

  let sent = 0;
  const errors: string[] = [];

  for (const user of eligible) {
    if (!user.email) continue;

    // For step 0: check if user has at least 1 completed scan
    if (user.step === 0) {
      const [scan] = await db
        .select({ id: scanSessions.id })
        .from(scanSessions)
        .where(eq(scanSessions.userId, user.id))
        .limit(1);
      if (!scan) continue; // No scan yet, skip
    }

    // Check delay
    if (user.step > 0 && user.lastSent) {
      const elapsed = now - user.lastSent.getTime();
      if (elapsed < STEP_DELAYS_MS[user.step]) continue; // Not yet due
    }

    if (user.step >= 3) continue; // Sequence complete

    const nextStep = user.step + 1;
    const { subject, html } = buildEmail(nextStep, user.name ?? "there", appUrl);

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to: user.email, subject, html }),
      });

      if (res.ok) {
        sent++;
        await db
          .update(users)
          .set({
            onboardEmailStep: nextStep,
            onboardEmailLastSentAt: new Date(),
          })
          .where(eq(users.id, user.id));
      } else {
        const errText = await res.text();
        errors.push(`${user.email}: ${res.status} ${errText.slice(0, 100)}`);
      }
    } catch (err) {
      errors.push(`${user.email}: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  return NextResponse.json({ ok: true, sent, eligible: eligible.length, errors: errors.slice(0, 5) });
}

// ── Email templates ──

function buildEmail(step: number, name: string, appUrl: string): { subject: string; html: string } {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const base = (content: string) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; background: #070608; color: #f0edf2; padding: 40px 32px; border-radius: 16px;">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 32px;">
        <div style="width: 28px; height: 28px;">
          <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
            <path d="M12 2C12 2 6 8 6 13a6 6 0 0012 0c0-2-1-3.5-1-3.5S16 11 14.5 11c.5-2.5-.5-5.5-2.5-7C12 4 12 2 12 2z" fill="#ff5a1f"/>
          </svg>
        </div>
        <span style="font-size: 17px; font-weight: 700; color: #f0edf2;">FireChess</span>
      </div>
      ${content}
      <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #1e1a24;">
        <p style="font-size: 11px; color: #565061;">
          You're receiving this because you scanned your games on FireChess.
          <a href="${appUrl}/unsubscribe" style="color: #8d8696;">Unsubscribe</a>
        </p>
      </div>
    </div>
  `;

  switch (step) {
    case 1:
      return {
        subject: `Welcome to FireChess, ${esc(name)} — here's what we found`,
        html: base(`
          <h1 style="font-size: 24px; font-weight: 800; color: #f0edf2; margin: 0 0 12px;">Your first scan is ready 🎯</h1>
          <p style="font-size: 15px; color: #8d8696; line-height: 1.6; margin: 0 0 24px;">
            We analyzed your games and found the patterns holding you back. Your report is live —
            it shows your opening leaks, missed tactics, and endgame weaknesses across every game.
          </p>
          <a href="${appUrl}/dashboard" style="display: inline-block; background: #ff5a1f; color: #fff; font-weight: 600; font-size: 15px; padding: 14px 28px; border-radius: 12px; text-decoration: none;">
            View your report →
          </a>
          <p style="font-size: 13px; color: #565061; margin-top: 20px;">
            Tip: Look at the "Opening Leaks" section first — that's where the biggest rating gains are hiding.
          </p>
        `),
      };

    case 2:
      return {
        subject: `Your top 3 leaks are costing you rating points`,
        html: base(`
          <h1 style="font-size: 24px; font-weight: 800; color: #f0edf2; margin: 0 0 12px;">Your top 3 leaks 🔥</h1>
          <p style="font-size: 15px; color: #8d8696; line-height: 1.6; margin: 0 0 24px;">
            Most club players repeat the same 3-5 mistakes across hundreds of games.
            Your report found yours — now it's time to fix them.
          </p>
          <div style="background: #121015; border: 1px solid #1e1a24; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <p style="font-size: 13px; color: #ff8c42; font-weight: 600; margin: 0 0 8px;">🎯 What to fix first:</p>
            <ol style="font-size: 14px; color: #8d8696; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li>Your most-repeated opening mistake</li>
              <li>The tactical motif you miss most often</li>
              <li>Your endgame conversion rate</li>
            </ol>
          </div>
          <a href="${appUrl}/dashboard" style="display: inline-block; background: #ff5a1f; color: #fff; font-weight: 600; font-size: 15px; padding: 14px 28px; border-radius: 12px; text-decoration: none;">
            Fix your leaks →
          </a>
          <p style="font-size: 13px; color: #565061; margin-top: 20px;">
            Each leak becomes an interactive lesson built from your own games — not generic puzzles.
          </p>
        `),
      };

    case 3:
      return {
        subject: `Ready to scan unlimited games?`,
        html: base(`
          <h1 style="font-size: 24px; font-weight: 800; color: #f0edf2; margin: 0 0 12px;">Unlock unlimited scans ✨</h1>
          <p style="font-size: 15px; color: #8d8696; line-height: 1.6; margin: 0 0 24px;">
            Your free scan found real patterns. Pro gives you unlimited scans,
            deeper analysis (depth 22), and full drill access — so you can track
            your improvement scan over scan.
          </p>
          <div style="background: #121015; border: 1px solid #ff5a1f/20; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <p style="font-size: 22px; font-weight: 800; color: #ff5a1f; margin: 0 0 4px;">$4.99<small style="font-size: 14px; color: #8d8696;">/month</small></p>
            <p style="font-size: 13px; color: #565061; margin: 0;">Less than a coffee. Cancel anytime.</p>
          </div>
          <a href="${appUrl}/pricing" style="display: inline-block; background: #ff5a1f; color: #fff; font-weight: 600; font-size: 15px; padding: 14px 28px; border-radius: 12px; text-decoration: none;">
            Go Pro →
          </a>
          <p style="font-size: 13px; color: #565061; margin-top: 20px;">
            "I scanned again next month and watched my leak count drop from 11 to 4. It's like a fitness tracker for chess." — James T., Pro member
          </p>
        `),
      };

    default:
      return { subject: "", html: "" };
  }
}
