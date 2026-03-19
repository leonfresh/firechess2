/**
 * GET  /api/feedback/[id] — get ticket + all replies (owner or admin).
 * POST /api/feedback/[id] — add reply to a ticket (owner or admin).
 *
 * Admin replies are forwarded to the user's email via Resend.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { feedback, ticketReplies, users } from "@/lib/schema";
import { isAdmin } from "@/lib/admin";
import { eq, asc } from "drizzle-orm";

/* ------------------------------------------------------------------ */
/*  GET — get ticket + thread                                          */
/* ------------------------------------------------------------------ */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth();
    const guestToken = req.nextUrl.searchParams.get("token");

    const [ticket] = await db
      .select()
      .from(feedback)
      .where(eq(feedback.id, id))
      .limit(1);

    if (!ticket) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isGuestOwner = guestToken && ticket.guestToken && guestToken === ticket.guestToken;
    const admin = session?.user?.id ? await isAdmin(session.user.id) : false;
    const isOwner = session?.user?.id && ticket.userId === session.user.id;

    if (!admin && !isOwner && !isGuestOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch replies
    const replies = await db
      .select()
      .from(ticketReplies)
      .where(eq(ticketReplies.feedbackId, id))
      .orderBy(asc(ticketReplies.createdAt));

    // If admin is viewing, auto-mark as read
    if (admin && ticket.status === "new") {
      await db
        .update(feedback)
        .set({ status: "read" })
        .where(eq(feedback.id, id));
      ticket.status = "read";
    }

    return NextResponse.json({ ticket, replies });
  } catch (err) {
    console.error("[ticket GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  POST — add reply                                                    */
/* ------------------------------------------------------------------ */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth();
    const guestToken = req.nextUrl.searchParams.get("token");

    const [ticket] = await db
      .select()
      .from(feedback)
      .where(eq(feedback.id, id))
      .limit(1);

    if (!ticket) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isGuestOwner = guestToken && ticket.guestToken && guestToken === ticket.guestToken;
    const admin = session?.user?.id ? await isAdmin(session.user.id) : false;
    const isOwner = session?.user?.id && ticket.userId === session.user.id;

    if (!admin && !isOwner && !isGuestOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { message } = body as { message?: string };

    if (!message || message.trim().length < 1) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Insert reply
    const [reply] = await db.insert(ticketReplies).values({
      feedbackId: id,
      userId: session?.user?.id ?? null,
      isAdmin: admin,
      message: message.trim(),
      emailSent: false,
    }).returning();

    // If admin replied, send email notification to user
    let emailSent = false;
    if (admin && ticket.email) {
      try {
        emailSent = await sendReplyEmail(
          ticket.email,
          ticket.subject || `Ticket #${id.slice(0, 8)}`,
          message.trim(),
          id,
          ticket.guestToken ?? null,
        );
        if (emailSent) {
          await db
            .update(ticketReplies)
            .set({ emailSent: true })
            .where(eq(ticketReplies.id, reply.id));
        }
      } catch (e) {
        console.error("[reply email]", e);
      }
    }

    // If user replied, update status back to "new" so admin sees it
    if (!admin && ticket.status === "resolved") {
      await db
        .update(feedback)
        .set({ status: "new" })
        .where(eq(feedback.id, id));
    }

    return NextResponse.json({ ok: true, reply, emailSent });
  } catch (err) {
    console.error("[ticket reply POST]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  Email helper — send admin reply to user via Resend                  */
/* ------------------------------------------------------------------ */
async function sendReplyEmail(
  to: string,
  subject: string,
  replyText: string,
  ticketId: string,
  guestToken: string | null,
): Promise<boolean> {
  const resendKey = process.env.AUTH_RESEND_KEY;
  const from = process.env.AUTH_RESEND_FROM ?? "FireChess <noreply@firechess.com>";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://firechess.com";

  if (!resendKey) {
    console.warn("[reply email] No AUTH_RESEND_KEY set, skipping email");
    return false;
  }

  const ticketUrl = `${appUrl}/support/${ticketId}${guestToken ? `?token=${guestToken}` : ""}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #e4e4e7; background: #0a0a0a; border-radius: 12px; padding: 32px; border: 1px solid #27272a;">
      <div style="margin-bottom: 20px;">
        <span style="font-size: 22px; font-weight: 700; color: #fff;">🔥 FireChess Support</span>
      </div>

      <p style="color: #a1a1aa; font-size: 14px; margin: 0 0 16px 0;">New reply on your ticket: <strong style="color: #fff;">${subject}</strong></p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
        <tr>
          <td>
            <a href="${ticketUrl}" style="display: inline-block; background: #f97316; color: #000; font-weight: 700; font-size: 15px; padding: 12px 28px; border-radius: 8px; text-decoration: none;">&#128172; Reply to this ticket</a>
          </td>
        </tr>
      </table>

      <p style="color: #ef4444; font-size: 12px; font-weight: 600; margin: 0 0 20px 0;">&#9888; Do not reply to this email — use the button above to respond.</p>

      <div style="background: #18181b; border-radius: 8px; padding: 16px; border-left: 3px solid #f97316;">
        <p style="color: #e4e4e7; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${replyText}</p>
      </div>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: `Re: ${subject} — FireChess Support`,
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[Resend error]", res.status, errText);
    return false;
  }

  return true;
}
