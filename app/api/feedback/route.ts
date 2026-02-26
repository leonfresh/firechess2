/**
 * POST /api/feedback — submit feedback (auth optional).
 * GET  /api/feedback — list all feedback (admin only).
 * PATCH /api/feedback — update feedback status (admin only).
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { feedback } from "@/lib/schema";
import { isAdmin } from "@/lib/admin";
import { eq, desc } from "drizzle-orm";

/* ------------------------------------------------------------------ */
/*  POST — submit feedback                                             */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();

    const { category, message, email } = body as {
      category?: string;
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

    await db.insert(feedback).values({
      userId: session?.user?.id ?? null,
      email: email ?? session?.user?.email ?? null,
      category: cat,
      message: message.trim(),
      status: "new",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[feedback POST]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  GET — list all feedback (admin only)                               */
/* ------------------------------------------------------------------ */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await isAdmin(session.user.id);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rows = await db
      .select()
      .from(feedback)
      .orderBy(desc(feedback.createdAt));

    return NextResponse.json({ feedback: rows });
  } catch (err) {
    console.error("[feedback GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  PATCH — update feedback status (admin only)                        */
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
