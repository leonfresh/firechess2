"use client";

/**
 * /admin/feedback — Admin-only page to view and manage user feedback.
 * Redirects non-admin users back to /.
 */

import { useEffect, useState } from "react";
import { useSession } from "@/components/session-provider";
import { useRouter } from "next/navigation";

type FeedbackEntry = {
  id: string;
  userId: string | null;
  email: string | null;
  category: "bug" | "feature" | "question" | "other";
  message: string;
  status: "new" | "read" | "resolved";
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
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "new" | "read" | "resolved">("all");

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace("/");
    }
  }, [loading, isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/feedback")
      .then((r) => r.json())
      .then((data) => {
        if (data.feedback) setEntries(data.feedback);
        else setError("Failed to load feedback");
      })
      .catch(() => setError("Failed to load feedback"))
      .finally(() => setFetching(false));
  }, [isAdmin]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setEntries((prev) =>
          prev.map((e) =>
            e.id === id ? { ...e, status: newStatus as FeedbackEntry["status"] } : e,
          ),
        );
      }
    } catch {
      /* silently fail */
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-zinc-400">
        {loading ? "Loading…" : "Redirecting…"}
      </div>
    );
  }

  const filtered =
    filter === "all" ? entries : entries.filter((e) => e.status === filter);

  const counts = {
    all: entries.length,
    new: entries.filter((e) => e.status === "new").length,
    read: entries.filter((e) => e.status === "read").length,
    resolved: entries.filter((e) => e.status === "resolved").length,
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            📬 Feedback Admin
          </h1>
          <p className="mt-1 text-zinc-400">
            {entries.length} total submission{entries.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {(["all", "new", "read", "resolved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium capitalize transition ${
                filter === f
                  ? "border-orange-500/60 bg-orange-500/10 text-orange-300"
                  : "border-zinc-700/60 bg-zinc-800/40 text-zinc-400 hover:border-zinc-600"
              }`}
            >
              {f} ({counts[f]})
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
            {error}
          </p>
        )}

        {/* Loading */}
        {fetching && (
          <div className="flex items-center justify-center py-20 text-zinc-500">
            Loading feedback…
          </div>
        )}

        {/* Empty state */}
        {!fetching && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/50 py-16 text-center">
            <span className="mb-3 text-4xl">📭</span>
            <p className="text-zinc-400">
              {filter === "all"
                ? "No feedback yet."
                : `No ${filter} feedback.`}
            </p>
          </div>
        )}

        {/* Feedback cards */}
        <div className="space-y-4">
          {filtered.map((entry) => (
            <div
              key={entry.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-zinc-700"
            >
              {/* Top row: category + status + date */}
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <span className="text-lg">{CATEGORY_ICONS[entry.category]}</span>
                <span className="rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-xs font-medium capitalize text-zinc-300">
                  {entry.category}
                </span>
                <span
                  className={`rounded-md border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[entry.status]}`}
                >
                  {entry.status}
                </span>
                <span className="ml-auto text-xs text-zinc-500">
                  {new Date(entry.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {/* Message */}
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
                {entry.message}
              </p>

              {/* Meta + actions */}
              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-zinc-800 pt-3">
                {entry.email && (
                  <span className="text-xs text-zinc-500">
                    📧 {entry.email}
                  </span>
                )}
                {entry.userId && (
                  <span className="text-xs text-zinc-500">
                    🆔 {entry.userId.slice(0, 8)}…
                  </span>
                )}

                <div className="ml-auto flex gap-2">
                  {entry.status !== "read" && (
                    <button
                      onClick={() => updateStatus(entry.id, "read")}
                      className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-1 text-xs font-medium text-amber-400 transition hover:bg-amber-500/10"
                    >
                      Mark Read
                    </button>
                  )}
                  {entry.status !== "resolved" && (
                    <button
                      onClick={() => updateStatus(entry.id, "resolved")}
                      className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-1 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/10"
                    >
                      Resolve
                    </button>
                  )}
                  {entry.status === "resolved" && (
                    <button
                      onClick={() => updateStatus(entry.id, "new")}
                      className="rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-1 text-xs font-medium text-zinc-400 transition hover:bg-zinc-800"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
