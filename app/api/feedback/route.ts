/**
 * POST /api/feedback — submit a new ticket (auth optional).
 * GET  /api/feedback — list tickets (admin: all, user: own).
 * PATCH /api/feedback — update ticket status (admin only).
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { feedback, ticketReplies, users, subscriptions } from "@/lib/schema";
import { isAdmin } from "@/lib/admin";
import { eq, desc, inArray } from "drizzle-orm";

/* ── Anti-bot: rate limiter ──────────────────────────────────────────
 * In-memory per-IP store. Resets on cold start (acceptable for this scale).
 * 3 POST per IP per 60s window. */
const rateMap = new Map<string, { count: number; resetAt: number }>();
function checkRate(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 3) return false;
  entry.count++;
  return true;
}

/* ── Anti-bot: spam patterns ───────────────────────────────────────── */
const SPAM_PATTERNS = [
  /https?:\/\//i,         // URLs in name/email fields only
  /\b(SEO|backlink|guest post|sponsored|buy now|click here)\b/i,
  /\b(viagra|casino|lottery|won \d|prize|free money)\b/i,
  /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(ru|cn|xyz|tk|ml|ga|cf))\b/, // disposable/targeted TLDs
];
const MAX_MESSAGE_LENGTH = 8000;

function isSpam(body: { email?: string; message?: string; name?: string; _honey?: string }): string | null {
  // Honeypot: bots fill hidden fields
  if (body._honey && body._honey.length > 0) return "honeypot";

  // Message too long (bots dump garbage)
  if (body.message && body.message.length > MAX_MESSAGE_LENGTH) return "message too long";

  // Check email for spam patterns
  if (body.email) {
    for (const p of SPAM_PATTERNS) {
      if (p.test(body.email)) return "spam pattern in email";
    }
  }

  return null;
}

/* ------------------------------------------------------------------ */
/*  POST — submit a new ticket                                         */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();

    const { category, subject, message, email, _honey, _ts } = body as {
      category?: string;
      subject?: string;
      message?: string;
      email?: string;
      _honey?: string;
      _ts?: number;
    };

    // ── Anti-bot ──
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? req.headers.get("x-real-ip")
      ?? "127.0.0.1";

    if (!checkRate(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    // Timing check: reject if submitted < 2.5s after page load
    if (_ts && Date.now() - _ts < 2500) {
      return NextResponse.json({ ok: true }); // silently succeed
    }

    const spamReason = isSpam({ email, message, _honey });
    if (spamReason) {
      console.log(`[feedback] spam blocked: ${spamReason} from ${ip}`);
      return NextResponse.json({ ok: true }); // silently succeed to not tip off bots
    }

    if (!message || message.trim().length < 5) {
      return NextResponse.json(
        { error: "Message must be at least 5 characters." },
        { status: 400 },
      );
    }

    const validCategories = ["bug", "feature", "question", "other"] as const;
    const cat = validCategories.includes(category as any)
      ? (category as (typeof validCategories)[number])
      : "other";

    const isGuest = !session?.user?.id;
    const guestToken = isGuest ? crypto.randomUUID() : null;

    const [ticket] = await db
      .insert(feedback)
      .values({
        userId: session?.user?.id ?? null,
        email: email ?? session?.user?.email ?? null,
        subject: subject?.trim() || null,
        category: cat,
        message: message.trim(),
        status: "new",
        guestToken,
        userLastViewedAt: new Date(),
      })
      .returning({ id: feedback.id });

    return NextResponse.json({ ok: true, ticketId: ticket.id, guestToken });
  } catch (err) {
    console.error("[feedback POST]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  GET — list tickets                                                  */
/*  Admin sees all. Signed-in user sees their own. Anon gets 401.      */
/* ------------------------------------------------------------------ */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await isAdmin(session.user.id);

    // Fetch tickets
    const tickets = admin
      ? await db.select().from(feedback).orderBy(desc(feedback.createdAt))
      : await db
          .select()
          .from(feedback)
          .where(eq(feedback.userId, session.user.id))
          .orderBy(desc(feedback.createdAt));

    // For admins: attach the linked account (name, email, plan) so tickets
    // from signed-in users can be identified and granted Pro in one view.
    let usersById: Record<string, { name: string | null; email: string | null; plan: string }> = {};
    if (admin) {
      const userIds = [
        ...new Set(tickets.map((t) => t.userId).filter((id): id is string => !!id)),
      ];
      if (userIds.length > 0) {
        const [userRows, planRows] = await Promise.all([
          db
            .select({ id: users.id, name: users.name, email: users.email })
            .from(users)
            .where(inArray(users.id, userIds)),
          db
            .select({ userId: subscriptions.userId, plan: subscriptions.plan })
            .from(subscriptions)
            .where(inArray(subscriptions.userId, userIds)),
        ]);
        const planByUserId = new Map(planRows.map((p) => [p.userId, p.plan]));
        for (const u of userRows) {
          usersById[u.id] = {
            name: u.name,
            email: u.email,
            plan: planByUserId.get(u.id) ?? "free",
          };
        }
      }
    }

    // Fetch reply counts for each ticket
    const ticketIds = tickets.map((t) => t.id);
    let replyCounts: Record<string, number> = {};
    if (ticketIds.length > 0) {
      const allReplies = await db
        .select({ feedbackId: ticketReplies.feedbackId })
        .from(ticketReplies);
      for (const r of allReplies) {
        if (ticketIds.includes(r.feedbackId)) {
          replyCounts[r.feedbackId] = (replyCounts[r.feedbackId] || 0) + 1;
        }
      }
    }

    const enriched = tickets.map((t) => ({
      ...t,
      replyCount: replyCounts[t.id] || 0,
      hasUnreadReply:
        !admin &&
        !!t.lastAdminReplyAt &&
        (!t.userLastViewedAt || t.userLastViewedAt < t.lastAdminReplyAt),
    }));

    return NextResponse.json({ feedback: enriched, isAdmin: admin });
  } catch (err) {
    console.error("[feedback GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  PATCH — update ticket status (admin only)                          */
/* ------------------------------------------------------------------ */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await isAdmin(session.user.id);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, status } = body as { id?: string; status?: string };

    if (!id || !["new", "read", "resolved"].includes(status ?? "")) {
      return NextResponse.json(
        { error: "Invalid id or status" },
        { status: 400 },
      );
    }

    await db
      .update(feedback)
      .set({ status: status as "new" | "read" | "resolved" })
      .where(eq(feedback.id, id));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[feedback PATCH]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
