"use client";

/**
 * /support — User's support ticket inbox.
 * Shows all tickets they've submitted with status and reply counts.
 */

import { useEffect, useState } from "react";
import { useSession } from "@/components/session-provider";
import Link from "next/link";

type Ticket = {
  id: string;
  subject: string | null;
  category: string;
  message: string;
  status: "new" | "read" | "resolved";
  replyCount: number;
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

export default function SupportPage() {
  const { loading, authenticated } = useSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!authenticated) return;
    fetch("/api/feedback")
      .then((r) => r.json())
      .then((data) => {
        if (data.feedback) setTickets(data.feedback);
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [authenticated]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Support Tickets
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Track your feedback and conversations with our team
            </p>
          </div>
          <Link
            href="/feedback"
            className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:shadow-orange-500/30"
          >
            New Ticket
          </Link>
        </div>

        {/* Not signed in */}
        {!loading && !authenticated && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
            <span className="mb-3 block text-4xl">🔒</span>
            <p className="text-zinc-400">Sign in to view your support tickets.</p>
            <Link
              href="/auth/signin"
              className="mt-4 inline-block rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              Sign In
            </Link>
          </div>
        )}

        {/* Loading */}
        {authenticated && fetching && (
          <div className="flex items-center justify-center py-20 text-zinc-500">Loading…</div>
        )}

        {/* Empty */}
        {authenticated && !fetching && tickets.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
            <span className="mb-3 block text-4xl">📭</span>
            <p className="text-zinc-400">No support tickets yet.</p>
            <p className="mt-1 text-xs text-zinc-600">
              Submit feedback or a bug report and it will appear here.
            </p>
          </div>
        )}

        {/* Ticket list */}
        {authenticated && !fetching && tickets.length > 0 && (
          <div className="space-y-3">
            {tickets.map((t) => {
              const st = STATUS_LABELS[t.status] ?? STATUS_LABELS.new;
              return (
                <Link
                  key={t.id}
                  href={`/support/${t.id}`}
                  className="block rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-zinc-700 hover:bg-zinc-900/80"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{CATEGORY_ICONS[t.category] ?? "💬"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-200">
                        {t.subject || t.message.slice(0, 80)}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-[11px] text-zinc-500">
                        <span>
                          {new Date(t.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        {t.replyCount > 0 && (
                          <span className="flex items-center gap-1">
                            💬 {t.replyCount} {t.replyCount === 1 ? "reply" : "replies"}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${st.color}`}>
                      {st.label}
                    </span>
                    <svg className="h-4 w-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
