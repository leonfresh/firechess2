/**
 * GET /api/feedback/unread — returns unread message count.
 *
 * Admin: count of tickets with status "new" (new ticket or user re-replied).
 * User:  count of own tickets with an unread admin reply
 *        (latest reply on ticket is from admin, not yet seen).
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { feedback, ticketReplies } from "@/lib/schema";
import { isAdmin } from "@/lib/admin";
import { eq, and, desc } from "drizzle-orm";

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

    // Regular user: find tickets where the latest reply is from admin
    const userTickets = await db
      .select({ id: feedback.id })
      .from(feedback)
      .where(eq(feedback.userId, session.user.id));

    if (userTickets.length === 0) {
      return NextResponse.json({ count: 0 });
    }

    let unreadCount = 0;
    for (const ticket of userTickets) {
      // Get the latest reply on this ticket
      const [latestReply] = await db
        .select({
          isAdmin: ticketReplies.isAdmin,
        })
        .from(ticketReplies)
        .where(eq(ticketReplies.feedbackId, ticket.id))
        .orderBy(desc(ticketReplies.createdAt))
        .limit(1);

      // If the latest reply is from admin, the user has an unread response
      if (latestReply?.isAdmin) {
        unreadCount++;
      }
    }

    return NextResponse.json({ count: unreadCount });
  } catch (err) {
    console.error("[feedback unread]", err);
    return NextResponse.json({ count: 0 });
  }
}
