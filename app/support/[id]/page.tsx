"use client";

/**
 * /support/[id] — View a single support ticket thread.
 * Users can see the conversation history and reply.
 */

import { useEffect, useState, useRef } from "react";
import { useSession } from "@/components/session-provider";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

type Ticket = {
  id: string;
  subject: string | null;
  category: string;
  message: string;
  status: "new" | "read" | "resolved";
  email: string | null;
  createdAt: string;
};

type Reply = {
  id: string;
  feedbackId: string;
  userId: string | null;
  isAdmin: boolean;
  message: string;
  emailSent: boolean;
  createdAt: string;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: "Awaiting Reply", color: "border-blue-500/40 bg-blue-500/10 text-blue-400" },
  read: { label: "In Progress", color: "border-amber-500/40 bg-amber-500/10 text-amber-400" },
  resolved: { label: "Resolved", color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" },
};

const CATEGORY_ICONS: Record<string, string> = {
  bug: "🐛",
  feature: "💡",
  question: "❓",
  other: "💬",
};

export default function TicketThreadPage() {
  const { loading, authenticated, user } = useSession();
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authenticated || !ticketId) return;
    setFetching(true);
    fetch(`/api/feedback/${ticketId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => {
        setTicket(data.ticket);
        setReplies(data.replies);
      })
      .catch(() => setError("Ticket not found or access denied."))
      .finally(() => setFetching(false));
  }, [authenticated, ticketId]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies.length]);

  const sendReply = async () => {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      const res = await fetch(`/api/feedback/${ticketId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setReplies((prev) => [...prev, data.reply]);
        setReplyText("");
      }
    } catch {}
    finally { setReplying(false); }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-zinc-400">
        Loading…
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0a0a0a] text-zinc-400">
        <span className="text-4xl">🔒</span>
        <p>Sign in to view this ticket.</p>
        <Link href="/auth/signin" className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black">
          Sign In
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0a0a0a] text-zinc-400">
        <span className="text-4xl">❌</span>
        <p>{error}</p>
        <Link href="/support" className="text-sm text-orange-400 hover:underline">Back to Support</Link>
      </div>
    );
  }

  if (fetching || !ticket) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-zinc-400">
        Loading ticket…
      </div>
    );
  }

  const st = STATUS_LABELS[ticket.status] ?? STATUS_LABELS.new;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        {/* Back link + header */}
        <Link
          href="/support"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-white"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          All Tickets
        </Link>

        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">
              {CATEGORY_ICONS[ticket.category]}{" "}
              {ticket.subject || `Ticket #${ticket.id.slice(0, 8)}`}
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              Submitted {new Date(ticket.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <span className={`shrink-0 rounded-lg border px-2.5 py-1 text-xs font-medium ${st.color}`}>
            {st.label}
          </span>
        </div>

        {/* Thread */}
        <div className="space-y-4">
          {/* Original message */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-400">
                {(user?.name?.[0] ?? "U").toUpperCase()}
              </span>
              <span className="text-xs font-medium text-zinc-300">You</span>
              <span className="ml-auto text-[10px] text-zinc-600">
                {new Date(ticket.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">{ticket.message}</p>
          </div>

          {/* Replies */}
          {replies.map((r) => (
            <div
              key={r.id}
              className={`rounded-xl border p-4 ${
                r.isAdmin
                  ? "border-orange-500/20 bg-orange-500/5"
                  : "border-zinc-800 bg-zinc-900/60"
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  r.isAdmin ? "bg-orange-500/20 text-orange-400" : "bg-blue-500/20 text-blue-400"
                }`}>
                  {r.isAdmin ? "🔥" : (user?.name?.[0] ?? "U").toUpperCase()}
                </span>
                <span className="text-xs font-medium text-zinc-300">
                  {r.isAdmin ? "FireChess Team" : "You"}
                </span>
                <span className="ml-auto text-[10px] text-zinc-600">
                  {new Date(r.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">{r.message}</p>
            </div>
          ))}
          <div ref={threadEndRef} />
        </div>

        {/* Reply box */}
        {ticket.status !== "resolved" ? (
          <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <textarea
              rows={3}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply…"
              className="w-full resize-none rounded-xl border border-zinc-700/60 bg-zinc-800/40 px-4 py-3 text-sm text-white placeholder-zinc-500 transition focus:border-orange-500/60 focus:outline-none focus:ring-1 focus:ring-orange-500/40"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendReply();
              }}
            />
            <div className="mt-3 flex items-center justify-between">
              <p className="text-[10px] text-zinc-600">Ctrl+Enter to send</p>
              <button
                onClick={sendReply}
                disabled={replying || !replyText.trim()}
                className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:shadow-orange-500/30 disabled:opacity-50"
              >
                {replying ? "Sending…" : "Reply"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
            <p className="text-sm text-emerald-400">This ticket has been resolved.</p>
            <p className="mt-1 text-xs text-zinc-500">
              Need more help?{" "}
              <Link href="/feedback" className="text-orange-400 hover:underline">
                Open a new ticket
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
