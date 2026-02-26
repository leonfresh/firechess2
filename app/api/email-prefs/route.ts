/**
 * Email preferences — unsubscribe / resubscribe endpoint.
 *
 * GET  /api/email-prefs?action=unsubscribe&uid=<userId>
 * GET  /api/email-prefs?action=subscribe&uid=<userId>
 *
 * Redirects to a simple confirmation page.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const action = searchParams.get("action");
  const uid = searchParams.get("uid");

  if (!uid || !["subscribe", "unsubscribe"].includes(action ?? "")) {
    return new NextResponse(htmlPage("Invalid request", "Missing or invalid parameters."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  const wantDigest = action === "subscribe";

  await db
    .update(subscriptions)
    .set({ weeklyDigest: wantDigest, updatedAt: new Date() })
    .where(eq(subscriptions.userId, uid!));

  const title = wantDigest ? "Subscribed!" : "Unsubscribed";
  const body = wantDigest
    ? "You'll receive weekly digest emails from FireChess. You can unsubscribe any time from the link in the email."
    : "You've been unsubscribed from weekly digest emails. You can re-subscribe from your account settings.";

  return new NextResponse(htmlPage(title, body), {
    headers: { "Content-Type": "text/html" },
  });
}

function htmlPage(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — FireChess</title>
<style>
  body { background: #0a0a0a; color: #e4e4e7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
  .card { background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 40px; max-width: 440px; text-align: center; }
  h1 { font-size: 24px; margin: 0 0 12px; }
  p { color: #a1a1aa; font-size: 14px; line-height: 1.6; margin: 0 0 24px; }
  a { display: inline-block; background: linear-gradient(135deg, #10b981, #06b6d4); color: #000; font-weight: 600; font-size: 14px; padding: 10px 24px; border-radius: 8px; text-decoration: none; }
</style></head><body>
<div class="card">
  <h1>🔥 ${title}</h1>
  <p>${body}</p>
  <a href="https://firechess.com">Back to FireChess</a>
</div>
</body></html>`;
}
