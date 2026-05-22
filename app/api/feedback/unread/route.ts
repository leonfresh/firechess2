/**
 * GET /api/feedback/unread — returns unread message count.
 *
 * Admin: count of tickets with status "new" (new ticket or user re-replied).
 * User:  count of own tickets with an unread admin reply
 *        tracked via the ticket's last admin reply timestamp vs. last user view.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { feedback } from "@/lib/schema";
import { isAdmin } from "@/lib/admin";
import { and, eq, isNotNull, isNull, lt, or } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ count: 0 });
    }

    const admin = await isAdmin(session.user.id);

    if (admin) {
      // Admin: count tickets with status "new" — means a user submitted or re-replied
      const newTickets = await db
        .select({ id: feedback.id })
        .from(feedback)
        .where(eq(feedback.status, "new"));
      return NextResponse.json({ count: newTickets.length });
    }

    const unreadTickets = await db
      .select({ id: feedback.id })
      .from(feedback)
      .where(
        and(
          eq(feedback.userId, session.user.id),
          isNotNull(feedback.lastAdminReplyAt),
          or(
            isNull(feedback.userLastViewedAt),
            lt(feedback.userLastViewedAt, feedback.lastAdminReplyAt),
          ),
        ),
      );

    return NextResponse.json({ count: unreadTickets.length });
  } catch (err) {
    console.error("[feedback unread]", err);
    return NextResponse.json({ count: 0 });
  }
}
