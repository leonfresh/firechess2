"use client";

/**
 * /admin/users — Search users and grant/revoke Pro access.
 */

import { useEffect, useState, useCallback } from "react";
import { useSession } from "@/components/session-provider";
import { useRouter } from "next/navigation";
import Link from "next/link";

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  plan: "free" | "pro" | "lifetime";
  status: string;
};

export default function AdminUsersPage() {
  const { loading, isAdmin } = useSession();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  // Redirect non-admin
  useEffect(() => {
    if (!loading && !isAdmin) router.replace("/");
  }, [loading, isAdmin, router]);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setUsers([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/admin/users?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setUsers(data.users ?? []);
      } catch {
        setUsers([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

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
          prev.map((u) => (u.id === userId ? { ...u, plan } : u))
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

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-slate-950 px-4 py-12 text-slate-300">
      <h1 className="mb-6 text-xl font-bold text-white">Manage Users</h1>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name or email..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-6 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/40 focus:outline-none"
      />

      {searching && (
        <p className="mb-4 text-xs text-slate-500">Searching...</p>
      )}

      {/* Results */}
      {users.length > 0 && (
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {user.name || "No name"}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {user.email || "No email"} &middot; {user.id.slice(0, 8)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Current plan badge */}
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                    user.plan === "lifetime"
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : user.plan === "pro"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                  }`}
                >
                  {user.plan}
                </span>

                {/* Action buttons */}
                {user.plan === "free" ? (
                  <button
                    onClick={() => setPlan(user.id, "pro")}
                    disabled={updating === user.id}
                    className="rounded-md bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/30 disabled:opacity-50"
                  >
                    {updating === user.id ? "..." : "Grant Pro"}
                  </button>
                ) : (
                  <button
                    onClick={() => setPlan(user.id, "free")}
                    disabled={updating === user.id}
                    className="rounded-md bg-red-500/20 px-3 py-1 text-xs font-medium text-red-400 transition hover:bg-red-500/30 disabled:opacity-50"
                  >
                    {updating === user.id ? "..." : "Revoke"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!searching && query.trim().length >= 2 && users.length === 0 && (
        <p className="text-xs text-slate-500">No users found.</p>
      )}

      <div className="mt-8 border-t border-white/[0.06] pt-4">
        <Link href="/admin/feedback" className="text-xs text-emerald-400 hover:underline">
          &larr; Feedback Panel
        </Link>
      </div>
    </div>
  );
}
