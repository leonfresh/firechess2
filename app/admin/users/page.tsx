"use client";

/**
 * /admin/users — View all users with full details, search, and grant/revoke Pro.
 */

import { useEffect, useState, useCallback } from "react";
import { useSession } from "@/components/session-provider";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Provider = { provider: string; providerAccountId: string };

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  plan: "free" | "pro" | "lifetime";
  subStatus: string;
  subCreatedAt: string | null;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
  weeklyDigest: boolean;
  providers: Provider[];
  reportCount: number;
  lastReport: string | null;
  lastSession: string | null;
};

const PROVIDER_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  google: { label: "Google", icon: "🔵", color: "text-blue-400" },
  lichess: { label: "Lichess", icon: "♟️", color: "text-white" },
  resend: { label: "Email", icon: "✉️", color: "text-purple-400" },
};

const PLAN_STYLES: Record<string, string> = {
  lifetime: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  pro: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  free: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const STATUS_STYLES: Record<string, string> = {
  active: "text-emerald-400",
  canceled: "text-red-400",
  past_due: "text-amber-400",
  incomplete: "text-amber-400",
  trialing: "text-cyan-400",
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminUsersPage() {
  const { loading, isAdmin } = useSession();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  // Redirect non-admin
  useEffect(() => {
    if (!loading && !isAdmin) router.replace("/");
  }, [loading, isAdmin, router]);

  // Fetch users (all on mount, filtered on search)
  useEffect(() => {
    if (loading || !isAdmin) return;
    const timer = setTimeout(async () => {
      setFetching(true);
      try {
        const url = query.trim().length >= 2
          ? `/api/admin/users?q=${encodeURIComponent(query.trim())}`
          : "/api/admin/users";
        const res = await fetch(url);
        const data = await res.json();
        setUsers(data.users ?? []);
        setTotal(data.total ?? 0);
      } catch {
        setUsers([]);
      } finally {
        setFetching(false);
      }
    }, query ? 400 : 0);
    return () => clearTimeout(timer);
  }, [query, loading, isAdmin]);

  const setPlan = useCallback(async (userId: string, plan: "free" | "pro" | "lifetime") => {
    setUpdating(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, plan }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, plan, subStatus: "active" } : u))
        );
      }
    } catch {
      // silent
    } finally {
      setUpdating(null);
    }
  }, []);

  if (loading || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Loading...
      </div>
    );
  }

  const proCount = users.filter((u) => u.plan === "pro" || u.plan === "lifetime").length;
  const freeCount = users.filter((u) => u.plan === "free").length;

  return (
    <div className="mx-auto min-h-screen max-w-5xl bg-slate-950 px-4 py-12 text-slate-300">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Manage Users</h1>
          <p className="mt-1 text-xs text-slate-500">
            {total} user{total !== 1 ? "s" : ""} total &middot;{" "}
            <span className="text-emerald-400">{proCount} Pro</span> &middot;{" "}
            <span className="text-slate-400">{freeCount} Free</span>
          </p>
        </div>
        <Link href="/admin/feedback" className="text-xs text-emerald-400 hover:underline">
          Feedback Panel &rarr;
        </Link>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name or email..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-6 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/40 focus:outline-none"
      />

      {fetching && (
        <p className="mb-4 text-xs text-slate-500">Loading...</p>
      )}

      {/* User table */}
      {!fetching && users.length > 0 && (
        <div className="space-y-2">
          {users.map((user) => {
            const expanded = expandedUser === user.id;
            return (
              <div
                key={user.id}
                className="rounded-lg border border-white/10 bg-white/[0.03] transition-colors hover:bg-white/[0.05]"
              >
                {/* Main row */}
                <div
                  className="flex cursor-pointer items-center gap-3 px-4 py-3"
                  onClick={() => setExpandedUser(expanded ? null : user.id)}
                >
                  {/* Avatar */}
                  {user.image ? (
                    <img
                      src={user.image}
                      alt=""
                      className="h-8 w-8 rounded-full border border-white/10"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs text-slate-500">
                      {(user.name?.[0] ?? user.email?.[0] ?? "?").toUpperCase()}
                    </div>
                  )}

                  {/* Name & email */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {user.name || "No name"}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      {user.email || "No email"}
                    </p>
                  </div>

                  {/* Providers */}
                  <div className="hidden items-center gap-1 sm:flex">
                    {user.providers.map((p) => {
                      const meta = PROVIDER_LABELS[p.provider] ?? {
                        label: p.provider,
                        icon: "🔗",
                        color: "text-slate-400",
                      };
                      return (
                        <span
                          key={p.provider}
                          title={`${meta.label}: ${p.providerAccountId}`}
                          className={`rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] ${meta.color}`}
                        >
                          {meta.icon} {meta.label}
                        </span>
                      );
                    })}
                  </div>

                  {/* Reports count */}
                  <div className="hidden text-center sm:block" title="Reports saved">
                    <p className="text-xs font-semibold text-white">{user.reportCount}</p>
                    <p className="text-[9px] text-slate-500">reports</p>
                  </div>

                  {/* Last active */}
                  <div className="hidden text-right sm:block" title={user.lastSession ? `Session: ${formatDate(user.lastSession)}` : "No session"}>
                    <p className="text-[11px] text-slate-400">{timeAgo(user.lastSession)}</p>
                    <p className="text-[9px] text-slate-500">last seen</p>
                  </div>

                  {/* Plan badge */}
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase ${PLAN_STYLES[user.plan] ?? PLAN_STYLES.free}`}
                  >
                    {user.plan}
                  </span>

                  {/* Action buttons */}
                  <div className="flex gap-1">
                    {user.plan === "free" ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); setPlan(user.id, "pro"); }}
                        disabled={updating === user.id}
                        className="rounded-md bg-emerald-500/20 px-2.5 py-1 text-[11px] font-medium text-emerald-400 transition hover:bg-emerald-500/30 disabled:opacity-50"
                      >
                        {updating === user.id ? "..." : "Grant Pro"}
                      </button>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setPlan(user.id, "free"); }}
                        disabled={updating === user.id}
                        className="rounded-md bg-red-500/20 px-2.5 py-1 text-[11px] font-medium text-red-400 transition hover:bg-red-500/30 disabled:opacity-50"
                      >
                        {updating === user.id ? "..." : "Revoke"}
                      </button>
                    )}
                  </div>

                  {/* Expand chevron */}
                  <svg
                    className={`h-4 w-4 text-slate-500 transition-transform ${expanded ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Expanded details */}
                {expanded && (
                  <div className="border-t border-white/[0.06] px-4 py-3">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <Detail label="User ID" value={user.id} mono />
                      <Detail label="Subscription Status" value={
                        <span className={STATUS_STYLES[user.subStatus] ?? "text-slate-400"}>
                          {user.subStatus}
                        </span>
                      } />
                      <Detail label="Sub Created" value={formatDate(user.subCreatedAt)} />
                      <Detail label="Period End" value={formatDate(user.currentPeriodEnd)} />
                      <Detail label="Stripe Customer" value={user.stripeCustomerId || "None"} mono />
                      <Detail label="Weekly Digest" value={user.weeklyDigest ? "✅ On" : "❌ Off"} />
                      <Detail label="Reports Saved" value={String(user.reportCount)} />
                      <Detail label="Last Report" value={user.lastReport ? timeAgo(user.lastReport) : "Never"} />
                      <Detail label="Last Session" value={user.lastSession ? timeAgo(user.lastSession) : "Never"} />
                      <Detail label="Login Methods" value={
                        user.providers.length > 0
                          ? user.providers.map(p => {
                              const meta = PROVIDER_LABELS[p.provider] ?? { label: p.provider, icon: "🔗" };
                              return `${meta.icon} ${meta.label} (${p.providerAccountId})`;
                            }).join(", ")
                          : "None"
                      } />
                    </div>

                    {/* Quick plan actions */}
                    <div className="mt-3 flex gap-2 border-t border-white/[0.06] pt-3">
                      {(["free", "pro", "lifetime"] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPlan(user.id, p)}
                          disabled={updating === user.id || user.plan === p}
                          className={`rounded-md border px-3 py-1 text-[11px] font-medium transition disabled:opacity-30 ${
                            user.plan === p
                              ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-400"
                              : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {p === user.plan ? `✓ ${p.toUpperCase()}` : p.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!fetching && users.length === 0 && (
        <p className="text-xs text-slate-500">
          {query.trim().length >= 2 ? "No users found." : "No users yet."}
        </p>
      )}
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-0.5 text-xs text-slate-300 ${mono ? "font-mono text-[10px] break-all" : ""}`}>
        {value}
      </p>
    </div>
  );
}
