"use client";

/**
 * /admin/feedback — Admin ticket management with threaded conversations.
 * Click a ticket to open the thread, reply, and manage status.
 */

import { useEffect, useState, useRef } from "react";
import { useSession } from "@/components/session-provider";
import { useRouter } from "next/navigation";

type Ticket = {
  id: string;
  userId: string | null;
  email: string | null;
  subject: string | null;
  category: "bug" | "feature" | "question" | "other";
  message: string;
  status: "new" | "read" | "resolved";
  replyCount: number;
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

const STATUS_COLORS: Record<string, string> = {
  new: "border-blue-500/40 bg-blue-500/10 text-blue-400",
  read: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  resolved: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
};

const CATEGORY_ICONS: Record<string, string> = {
  bug: "🐛",
  feature: "💡",
  question: "❓",
  other: "💬",
};

export default function AdminFeedbackPage() {
  const { loading, isAdmin } = useSession();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "new" | "read" | "resolved">("all");

  // Thread state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [thread, setThread] = useState<{ ticket: Ticket; replies: Reply[] } | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !isAdmin) router.replace("/");
  }, [loading, isAdmin, router]);

  // Fetch ticket list
  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/feedback")
      .then((r) => r.json())
      .then((data) => {
        if (data.feedback) setTickets(data.feedback);
        else setError("Failed to load");
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setFetching(false));
  }, [isAdmin]);

  // Fetch thread when ticket selected
  useEffect(() => {
    if (!selectedId) { setThread(null); return; }
    setThreadLoading(true);
    fetch(`/api/feedback/${selectedId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ticket) {
          setThread(data);
          // Update list status if it changed
          setTickets((prev) =>
            prev.map((t) => t.id === selectedId ? { ...t, status: data.ticket.status } : t),
          );
        }
      })
      .catch(() => {})
      .finally(() => setThreadLoading(false));
  }, [selectedId]);

  // Scroll to bottom when new replies
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.replies.length]);

  const updateStatus = async (id: string, newStatus: string) => {
    const res = await fetch("/api/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
    if (res.ok) {
      setTickets((prev) => prev.map((t) => t.id === id ? { ...t, status: newStatus as Ticket["status"] } : t));
      if (thread && thread.ticket.id === id) {
        setThread({ ...thread, ticket: { ...thread.ticket, status: newStatus as Ticket["status"] } });
      }
    }
  };

  const sendReply = async () => {
    if (!selectedId || !replyText.trim()) return;
    setReplying(true);
    try {
      const res = await fetch(`/api/feedback/${selectedId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        if (thread) {
          setThread({
            ...thread,
            replies: [...thread.replies, data.reply],
          });
        }
        setTickets((prev) =>
          prev.map((t) => t.id === selectedId ? { ...t, replyCount: t.replyCount + 1 } : t),
        );
        setReplyText("");
      }
    } catch {} finally {
      setReplying(false);
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-zinc-400">
        {loading ? "Loading…" : "Redirecting…"}
      </div>
    );
  }

  const filtered = filter === "all" ? tickets : tickets.filter((t) => t.status === filter);
  const counts = {
    all: tickets.length,
    new: tickets.filter((t) => t.status === "new").length,
    read: tickets.filter((t) => t.status === "read").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white">
      {/* ── Left: Ticket list ──────────────────────────────────── */}
      <div className={`w-full border-r border-zinc-800 ${selectedId ? "hidden md:block md:w-[420px]" : ""}`}>
        <div className="p-5">
          <h1 className="text-xl font-bold">📬 Support Tickets</h1>
          <p className="mt-1 text-xs text-zinc-500">{tickets.length} total</p>
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 px-5 pb-4">
          {(["all", "new", "read", "resolved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${
                filter === f
                  ? "border border-orange-500/60 bg-orange-500/10 text-orange-300"
                  : "border border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {f} ({counts[f]})
            </button>
          ))}
        </div>

        {/* Ticket list */}
        <div className="space-y-px overflow-y-auto" style={{ maxHeight: "calc(100vh - 140px)" }}>
          {fetching && <p className="px-5 py-10 text-center text-zinc-500">Loading…</p>}
          {!fetching && filtered.length === 0 && (
            <p className="px-5 py-10 text-center text-zinc-500">No tickets.</p>
          )}
          {filtered.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              className={`w-full border-b border-zinc-800/60 px-5 py-3.5 text-left transition hover:bg-zinc-900/60 ${
                selectedId === t.id ? "bg-zinc-900/80 border-l-2 border-l-orange-500" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{CATEGORY_ICONS[t.category]}</span>
                <span className="flex-1 truncate text-sm font-medium text-zinc-200">
                  {t.subject || t.message.slice(0, 60)}
                </span>
                <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium capitalize ${STATUS_COLORS[t.status]}`}>
                  {t.status}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-3 text-[11px] text-zinc-500">
                <span>{t.email || "anonymous"}</span>
                {t.replyCount > 0 && <span>💬 {t.replyCount}</span>}
                <span className="ml-auto">
                  {new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Right: Thread view ─────────────────────────────────── */}
      <div className={`flex-1 flex flex-col ${!selectedId ? "hidden md:flex items-center justify-center" : ""}`}>
        {!selectedId ? (
          <p className="text-zinc-600">Select a ticket to view the thread</p>
        ) : threadLoading ? (
          <div className="flex flex-1 items-center justify-center text-zinc-500">Loading…</div>
        ) : thread ? (
          <>
            {/* Thread header */}
            <div className="border-b border-zinc-800 p-5">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedId(null)}
                  className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-white md:hidden"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-bold text-white">
                    {CATEGORY_ICONS[thread.ticket.category]}{" "}
                    {thread.ticket.subject || `Ticket #${thread.ticket.id.slice(0, 8)}`}
                  </h2>
                  <p className="text-xs text-zinc-500">
                    {thread.ticket.email || "anonymous"} · {new Date(thread.ticket.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {thread.ticket.status !== "resolved" ? (
                    <button
                      onClick={() => updateStatus(thread.ticket.id, "resolved")}
                      className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10"
                    >
                      Resolve
                    </button>
                  ) : (
                    <button
                      onClick={() => updateStatus(thread.ticket.id, "new")}
                      className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ maxHeight: "calc(100vh - 240px)" }}>
              {/* Original message */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-400">U</span>
                  <span className="text-xs font-medium text-zinc-300">{thread.ticket.email || "User"}</span>
                  <span className="ml-auto text-[10px] text-zinc-600">
                    {new Date(thread.ticket.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">{thread.ticket.message}</p>
              </div>

              {/* Replies */}
              {thread.replies.map((r) => (
                <div
                  key={r.id}
                  className={`rounded-xl border p-4 ${
                    r.isAdmin
                      ? "border-orange-500/20 bg-orange-500/5 ml-6"
                      : "border-zinc-800 bg-zinc-900/60 mr-6"
                  }`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      r.isAdmin ? "bg-orange-500/20 text-orange-400" : "bg-blue-500/20 text-blue-400"
                    }`}>
                      {r.isAdmin ? "A" : "U"}
                    </span>
                    <span className="text-xs font-medium text-zinc-300">
                      {r.isAdmin ? "FireChess Team" : (thread.ticket.email || "User")}
                    </span>
                    {r.isAdmin && r.emailSent && (
                      <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-400">📧 Sent</span>
                    )}
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
            <div className="border-t border-zinc-800 p-4">
              <div className="flex gap-3">
                <textarea
                  rows={2}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply… (will be emailed to user)"
                  className="flex-1 resize-none rounded-xl border border-zinc-700/60 bg-zinc-800/40 px-4 py-2.5 text-sm text-white placeholder-zinc-500 transition focus:border-orange-500/60 focus:outline-none focus:ring-1 focus:ring-orange-500/40"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendReply();
                  }}
                />
                <button
                  onClick={sendReply}
                  disabled={replying || !replyText.trim()}
                  className="self-end rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:shadow-orange-500/30 disabled:opacity-50"
                >
                  {replying ? "…" : "Send"}
                </button>
              </div>
              <p className="mt-1.5 text-[10px] text-zinc-600">Ctrl+Enter to send · Reply will be emailed to user</p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
