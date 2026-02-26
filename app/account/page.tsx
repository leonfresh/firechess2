"use client";

/**
 * /account — Profile & subscription management.
 *
 * Shows user info, current plan, and billing management (via Stripe Portal).
 */

import { useSession } from "@/components/session-provider";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function AccountPage() {
  const { loading, authenticated, user, plan, subscriptionStatus } = useSession();
  const router = useRouter();
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ── Redirect unauthenticated users ── */
  if (!loading && !authenticated) {
    router.push("/");
    return null;
  }

  /* ── Stripe Customer Portal ── */
  const openPortal = async () => {
    setPortalLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Could not open billing portal.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  };

  const isPro = plan === "pro" || plan === "lifetime";
  const isLifetime = plan === "lifetime";
  const isActive = subscriptionStatus === "active" || subscriptionStatus === "trialing";

  return (
    <div className="min-h-[80vh] px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-2xl">
        {/* ── Header ── */}
        <h1 className="text-3xl font-bold tracking-tight text-white">Account</h1>
        <p className="mt-1.5 text-sm text-slate-400">
          Manage your profile and subscription.
        </p>

        {loading ? (
          <div className="mt-10 space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-white/[0.04]" />
            ))}
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {/* ── Profile Card ── */}
            <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Profile
              </h2>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-2xl font-bold text-emerald-400">
                  {(user?.name?.[0] ?? user?.email?.[0] ?? "?").toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-semibold text-white">
                    {user?.name ?? "Unknown"}
                  </p>
                  {user?.email && (
                    <p className="truncate text-sm text-slate-400">{user.email}</p>
                  )}
                </div>
              </div>
            </section>

            {/* ── Subscription Card ── */}
            <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Subscription
              </h2>

              <div className="mt-4 flex items-center gap-3">
                {/* Plan badge */}
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
                    isLifetime
                      ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400"
                      : isPro
                        ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400"
                        : "bg-white/[0.06] text-slate-400"
                  }`}
                >
                  {isPro && (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2h14v2H5v-2z" />
                    </svg>
                  )}
                  {isLifetime ? "Lifetime" : isPro ? "Pro" : "Free"}
                </span>

                {/* Status */}
                {isPro && !isLifetime && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      isActive
                        ? "bg-emerald-500/10 text-emerald-400"
                        : subscriptionStatus === "canceled"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {subscriptionStatus === "active"
                      ? "Active"
                      : subscriptionStatus === "trialing"
                        ? "Trial"
                        : subscriptionStatus === "canceled"
                          ? "Canceled"
                          : subscriptionStatus === "past_due"
                            ? "Past Due"
                            : subscriptionStatus ?? "Unknown"}
                  </span>
                )}
              </div>

              {/* Plan details */}
              <div className="mt-4 rounded-xl bg-white/[0.03] p-4">
                {isLifetime ? (
                  <div className="space-y-2 text-sm text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Plan</span>
                      <span className="text-amber-400">Lifetime — Founding Member</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status</span>
                      <span className="text-emerald-400">Active forever</span>
                    </div>
                  </div>
                ) : isPro ? (
                  <div className="space-y-2 text-sm text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Plan</span>
                      <span>Pro — $5/month</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status</span>
                      <span className={isActive ? "text-emerald-400" : "text-amber-400"}>
                        {isActive ? "Active" : subscriptionStatus}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm text-slate-300">
                    <p>
                      You&apos;re on the <span className="font-medium text-white">Free</span> plan.
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-slate-500">
                      <li>• Up to 300 games per scan</li>
                      <li>• Up to 10 tactics & endgame results per scan</li>
                      <li>• Engine depth up to 12</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-5 flex flex-wrap gap-3">
                {isLifetime ? (
                  <span className="inline-flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-2.5 text-sm font-medium text-amber-400">
                    ♾️ Lifetime member — no billing to manage
                  </span>
                ) : isPro ? (
                  <button
                    type="button"
                    onClick={openPortal}
                    disabled={portalLoading}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white transition-all hover:border-white/[0.15] hover:bg-white/[0.08] disabled:opacity-50"
                  >
                    {portalLoading ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Opening…
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        Manage Billing
                      </>
                    )}
                  </button>
                ) : (
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-all duration-300 hover:shadow-glow-sm"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2h14v2H5v-2z" />
                    </svg>
                    Upgrade to Pro
                  </Link>
                )}

                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-400 transition-all hover:border-white/[0.15] hover:bg-white/[0.08] hover:text-white"
                >
                  Dashboard
                </Link>
              </div>

              {error && (
                <p className="mt-3 text-sm text-red-400">{error}</p>
              )}
            </section>

            {/* ── Pro Features (for free users) ── */}
            {!isPro && (
              <section className="rounded-2xl border border-emerald-500/10 bg-gradient-to-b from-emerald-500/[0.04] to-transparent p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
                  Pro Includes
                </h2>
                <ul className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                  {[
                    "Unlimited games per scan",
                    "Full endgame analysis",
                    "Deeper engine depth",
                    "Save unlimited reports",
                    "Priority support",
                    "Early access to new features",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
