/**
 * POST /api/feedback/inbound — Resend inbound email webhook.
 *
 * When a user replies to a support email, Resend routes it here.
 * We parse the `To` address for the ticket ID (reply+{ticketId}@firechess.com),
 * strip the quoted original message, and append the reply to the ticket.
 *
 * Setup required in Resend dashboard:
 *   1. Enable inbound email routing for your domain (add MX records)
 *   2. Create a route: reply+* @firechess.com → webhook → this URL
 *   3. Set RESEND_INBOUND_SECRET env var to the secret shown in Resend
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { feedback, ticketReplies } from "@/lib/schema";
import { eq } from "drizzle-orm";

/* ------------------------------------------------------------------ */
/*  Types — Resend inbound webhook payload                             */
/* ------------------------------------------------------------------ */
type ResendInboundPayload = {
  type?: string;
  data?: {
    from?: string;
    to?: string[];
    subject?: string;
    text?: string;
    html?: string;
  };
  // flat fallback (older format)
  from?: string;
  to?: string[];
  subject?: string;
  text?: string;
  html?: string;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Extract ticket ID from an address like reply+abc-123@firechess.com */
function extractTicketId(toAddresses: string[]): string | null {
  for (const addr of toAddresses) {
    // Match reply+{id}@anything
    const match = addr.match(/reply\+([a-zA-Z0-9_-]+)@/i);
    if (match?.[1]) return match[1];
  }
  return null;
}

/**
 * Strip quoted reply text so we only store the new content.
 * Handles common mail client quoting patterns:
 *   - Lines starting with ">"
 *   - "On [date] ... wrote:" separators
 *   - "---" / "___" / "From:" hard separators
 */
function stripQuotedText(text: string): string {
  const lines = text.split("\n");
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Stop at common quote separators
    if (
      /^>/.test(line) ||
      /^On .+wrote:/i.test(line) ||
      /^-{3,}/.test(line.trim()) ||
      /^_{3,}/.test(line.trim()) ||
      /^From:\s/i.test(line) ||
      /^Sent:\s/i.test(line) ||
      /^Reply-To:\s/i.test(line)
    ) {
      break;
    }

    result.push(line);
  }

  return result.join("\n").trim();
}

/* ------------------------------------------------------------------ */
/*  POST handler                                                        */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  try {
    // Verify shared secret if configured
    const secret = process.env.RESEND_INBOUND_SECRET;
    if (secret) {
      const provided =
        req.headers.get("x-resend-signature") ??
        req.nextUrl.searchParams.get("secret");
      if (provided !== secret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = (await req.json()) as ResendInboundPayload;

    // Resend wraps inbound email data under `data`, but support flat too
    const payload = body.data ?? body;
    const from = payload.from ?? "";
    const to: string[] = payload.to ?? [];
    const text = payload.text ?? "";

    if (!to?.length || !text) {
      return NextResponse.json({ ok: true }); // nothing to process
    }

    const ticketId = extractTicketId(to);
    if (!ticketId) {
      return NextResponse.json({ ok: true }); // not a ticket reply address
    }

    // Look up the ticket
    const [ticket] = await db
      .select()
      .from(feedback)
      .where(eq(feedback.id, ticketId))
      .limit(1);

    if (!ticket) {
      return NextResponse.json({ ok: true }); // ticket not found, ignore
    }

    const cleanMessage = stripQuotedText(text);
    if (!cleanMessage) {
      return NextResponse.json({ ok: true }); // empty after stripping
    }

    // Append reply to ticket thread
    await db.insert(ticketReplies).values({
      feedbackId: ticketId,
      userId: ticket.userId ?? null,
      isAdmin: false,
      message: `[via email from ${from}]\n\n${cleanMessage}`,
      emailSent: false,
    });

    // Re-open ticket so admin sees it as new
    await db
      .update(feedback)
      .set({ status: "new" })
      .where(eq(feedback.id, ticketId));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[inbound email]", err);
    // Always return 200 to Resend so it doesn't retry indefinitely
    return NextResponse.json({ ok: true });
  }
}
