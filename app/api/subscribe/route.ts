/**
 * Newsletter / lead-capture endpoint.
 *
 * POST /api/subscribe   { email, source?, leadMagnet? }
 *   - Validates the email, dedupes, stores it, and fires a welcome email
 *     via Resend containing the lead magnet + a "scan your games" CTA.
 *   - Idempotent: re-subscribing a known address just re-sends the welcome.
 *
 * GET  /api/subscribe?action=unsubscribe&token=<unsubscribeToken>
 *   - One-click unsubscribe, mirrors the /api/email-prefs pattern.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/schema";
import { and, eq, isNull } from "drizzle-orm";

export const runtime = "nodejs";
export const maxDuration = 20;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: { email?: unknown; source?: unknown; leadMagnet?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 320) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }

  const source = body.source ? String(body.source).slice(0, 40) : "homepage";
  const leadMagnet = body.leadMagnet
    ? String(body.leadMagnet).slice(0, 120)
    : null;

  const resendKey = process.env.AUTH_RESEND_KEY;
  const from =
    process.env.AUTH_RESEND_FROM ?? "FireChess <noreply@firechess.com>";
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://firechess.com";

  // Generate an unsubscribe token so we can build a one-click link.
  const unsubscribeToken = crypto.randomUUID();

  try {
    // Upsert: re-activate if previously unsubscribed, otherwise insert.
    await db
      .insert(newsletterSubscribers)
      .values({
        email,
        source,
        leadMagnet,
        unsubscribeToken,
        unsubscribedAt: null,
      })
      .onConflictDoUpdate({
        target: newsletterSubscribers.email,
        set: {
          source,
          leadMagnet,
          unsubscribeToken,
          unsubscribedAt: null,
        },
      });
  } catch (err) {
    console.error("[subscribe] DB error:", err);
    return NextResponse.json(
      { error: "Could not save your email. Please try again." },
      { status: 500 },
    );
  }

  // Fire the welcome email. Best-effort: subscription still succeeds if email fails.
  if (resendKey) {
    try {
      const html = welcomeHtml(appUrl, email, unsubscribeToken);
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: email,
          subject: "🔥 Your free FireChess leak report is one scan away",
          html,
        }),
      });
    } catch (err) {
      console.error("[subscribe] welcome email failed:", err);
    }
  }

  return NextResponse.json({ ok: true });
}

/* ── One-click unsubscribe ─────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const action = searchParams.get("action");
  const token = searchParams.get("token");

  if (action !== "unsubscribe" || !token) {
    return new NextResponse(
      htmlPage(
        "Invalid request",
        "This unsubscribe link is missing or invalid.",
      ),
      { status: 400, headers: { "Content-Type": "text/html" } },
    );
  }

  await db
    .update(newsletterSubscribers)
    .set({ unsubscribedAt: new Date() })
    .where(
      and(
        eq(newsletterSubscribers.unsubscribeToken, token),
        isNull(newsletterSubscribers.unsubscribedAt),
      ),
    );

  return new NextResponse(
    htmlPage(
      "Unsubscribed",
      "You've been unsubscribed from FireChess emails. You can re-subscribe any time from the homepage.",
    ),
    { headers: { "Content-Type": "text/html" } },
  );
}

/* ── Email + landing HTML helpers ──────────────────────────────────────── */

function welcomeHtml(appUrl: string, email: string, token: string): string {
  const unsubUrl = `${appUrl}/api/subscribe?action=unsubscribe&token=${token}`;
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;color:#e4e4e7;">
      <div style="background:#0a0a0a;border-radius:12px;padding:32px;border:1px solid #27272a;">
        <div style="margin-bottom:24px;">
          <span style="font-size:24px;font-weight:700;color:#fff;">🔥 FireChess</span>
          <span style="color:#52525b;font-size:13px;margin-left:8px;">Free Weekly Leak Report</span>
        </div>

        <p style="color:#fff;font-size:18px;font-weight:600;margin-bottom:16px;">You're in 🎯</p>

        <p style="color:#a1a1aa;font-size:14px;margin-bottom:20px;line-height:1.6;">
          Every week we'll send you the <strong style="color:#fff;">repeated mistakes</strong> that are actually costing you rating — pulled straight from your own games by Stockfish 18. Most players lose the same way for months without realising. Not you, not anymore.
        </p>

        <div style="background:#18181b;border-left:3px solid #f59e0b;border-radius:8px;padding:16px;margin-bottom:24px;">
          <p style="color:#fbbf24;font-size:14px;font-weight:600;margin:0 0 4px;">⚡ Start now — it's free</p>
          <p style="color:#a1a1aa;font-size:13px;margin:0;">Drop your Lichess or Chess.com username into FireChess and get your first leak report in under a minute.</p>
        </div>

        <a href="${appUrl}" style="display:inline-block;background:linear-gradient(135deg,#fbbf24,#f97316);color:#1c1917;font-weight:700;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none;">
          Scan my games →
        </a>

        <p style="color:#3f3f46;font-size:11px;margin-top:32px;border-top:1px solid #27272a;padding-top:16px;">
          You're receiving this because you signed up at FireChess.
          <a href="${unsubUrl}" style="color:#52525b;text-decoration:underline;">Unsubscribe</a>
        </p>
      </div>
    </div>`;
}

function htmlPage(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — FireChess</title>
<style>
  body { background:#0a0a0a; color:#e4e4e7; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; }
  .card { background:#18181b; border:1px solid #27272a; border-radius:12px; padding:40px; max-width:440px; text-align:center; }
  h1 { font-size:24px; margin:0 0 12px; }
  p { color:#a1a1aa; font-size:14px; line-height:1.6; margin:0 0 24px; }
  a { display:inline-block; background:linear-gradient(135deg,#fbbf24,#f97316); color:#1c1917; font-weight:700; font-size:14px; padding:10px 24px; border-radius:8px; text-decoration:none; }
</style></head><body>
<div class="card">
  <h1>🔥 ${title}</h1>
  <p>${body}</p>
  <a href="https://firechess.com">Back to FireChess</a>
</div>
</body></html>`;
}
