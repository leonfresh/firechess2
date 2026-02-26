/**
 * POST /api/feedback — submit a new ticket (auth optional).
 * GET  /api/feedback — list tickets (admin: all, user: own).
 * PATCH /api/feedback — update ticket status (admin only).
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { feedback, ticketReplies } from "@/lib/schema";
import { isAdmin } from "@/lib/admin";
import { eq, desc } from "drizzle-orm";

/* ------------------------------------------------------------------ */
/*  POST — submit a new ticket                                         */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();

    const { category, subject, message, email } = body as {
      category?: string;
      subject?: string;
      message?: string;
      email?: string;
    };

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

    const [ticket] = await db.insert(feedback).values({
      userId: session?.user?.id ?? null,
      email: email ?? session?.user?.email ?? null,
      subject: subject?.trim() || null,
      category: cat,
      message: message.trim(),
      status: "new",
    }).returning({ id: feedback.id });

    return NextResponse.json({ ok: true, ticketId: ticket.id });
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
      return NextResponse.json({ error: "Invalid id or status" }, { status: 400 });
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
