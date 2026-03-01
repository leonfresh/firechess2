"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { signIn, signOut } from "next-auth/react";
import { useSession } from "@/components/session-provider";
import { LATEST_VERSION } from "@/lib/constants";
import { useCoinBalance } from "@/lib/use-coins";

const NAV_LINKS = [
  { href: "/about", label: "About" },
];

export function Navbar() {
  const pathname = usePathname();
  const { loading, authenticated, user, plan, isAdmin } = useSession();
  const coinBalance = useCoinBalance();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [hasUnseenChanges, setHasUnseenChanges] = useState(false);

  // Check for unseen changelog
  useEffect(() => {
    try {
      const seen = parseInt(localStorage.getItem("firechess_changelog_seen") ?? "0", 10);
      setHasUnseenChanges(seen < LATEST_VERSION);
    } catch {
      setHasUnseenChanges(true);
    }
  }, [pathname]);

  // Close profile dropdown on outside click
  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#030712]/80 backdrop-blur-2xl">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-3.5 md:px-10">
        {/* ── Logo ── */}
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5 text-base font-bold text-white transition-colors hover:text-slate-200"
        >
          <Image
            src="/firechess-logo.png"
            alt="FireChess"
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg"
          />
          <span className="tracking-tight">FireChess</span>
        </Link>

        {/* ── Desktop nav links ── */}
        <div className="hidden items-center gap-1 md:flex">
          {/* About dropdown with Blog */}
          <div className="group relative">
            <Link
              href="/about"
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive("/about") || isActive("/blog")
                  ? "text-white bg-white/[0.06]"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              About
              <svg className="h-3 w-3 text-slate-500 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="6 9 12 15 18 9" /></svg>
            </Link>
            <div className="invisible absolute left-0 top-full pt-1 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
              <div className="min-w-[140px] rounded-xl border border-white/[0.08] bg-[#0a0f1a] p-1.5 shadow-xl shadow-black/40">
                <Link
                  href="/about"
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive("/about") ? "text-white bg-white/[0.06]" : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  About
                </Link>
                <Link
                  href="/blog"
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive("/blog") ? "text-white bg-white/[0.06]" : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  Blog
                </Link>
              </div>
            </div>
          </div>

          {/* Dev Notes link */}
          <Link
            href="/changelog"
            className={`relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive("/changelog")
                ? "text-white bg-white/[0.06]"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            Dev Notes
            {authenticated && hasUnseenChanges && (
              <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
              </span>
            )}
          </Link>

          {/* Feedback link */}
          <Link
            href="/feedback"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive("/feedback")
                ? "text-white bg-white/[0.06]"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            Feedback
          </Link>

          {/* Pro link (last) */}
          <Link
            href="/pricing"
            className={`ml-1 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-3.5 py-1.5 text-sm font-semibold text-slate-950 transition-all duration-200 hover:shadow-glow-sm ${
              isActive("/pricing") ? "shadow-glow-sm" : ""
            }`}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2h14v2H5v-2z" />
            </svg>
            Pro
          </Link>
        </div>

        {/* ── Desktop right side (auth) ── */}
        <div className="hidden items-center gap-2.5 md:flex">
          {loading ? (
            <div className="h-9 w-20 animate-pulse rounded-lg bg-white/[0.06]" />
          ) : !authenticated ? (
            <button
              type="button"
              onClick={() => signIn(undefined, { callbackUrl: "/" })}
              className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-white hover:bg-white/[0.04]"
            >
              Sign in
            </button>
          ) : (
            <>
              {/* Coin balance */}
              {coinBalance > 0 && (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-xs font-bold text-amber-400 transition-colors hover:bg-amber-500/15"
                  title="Your coin balance"
                >
                  <span>🪙</span>
                  {coinBalance.toLocaleString()}
                </Link>
              )}

              <Link
                href="/dashboard"
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive("/dashboard")
                    ? "text-white bg-white/[0.06]"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                Dashboard
              </Link>

              {/* Profile dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen((p) => !p)}
                  className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-sm text-white transition-all hover:border-white/[0.15] hover:bg-white/[0.08]"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                    {(user?.name?.[0] ?? user?.email?.[0] ?? "?").toUpperCase()}
                  </div>
                  <span className="max-w-[100px] truncate text-sm">
                    {user?.name ?? user?.email ?? "Account"}
                  </span>
                  {(plan === "pro" || plan === "lifetime") && (
                    <span className="rounded bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      {plan === "lifetime" ? "∞" : "Pro"}
                    </span>
                  )}
                  <svg
                    className={`h-3.5 w-3.5 text-slate-500 transition-transform ${profileOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0d1117] shadow-2xl animate-in fade-in slide-in-from-top-2">
                    <div className="border-b border-white/[0.06] px-4 py-3">
                      <p className="truncate text-sm font-medium text-white">
                        {user?.name ?? "User"}
                      </p>
                      <p className="truncate text-xs text-slate-500">{user?.email}</p>
                    </div>

                    <div className="p-1.5">
                      <div className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-400">
                        <span>Plan</span>
                        <span className={plan === "pro" || plan === "lifetime" ? "font-semibold text-emerald-400" : "text-slate-500"}>
                          {plan === "lifetime" ? "Lifetime" : plan === "pro" ? "Pro" : "Free"}
                        </span>
                      </div>

                      <Link
                        href="/changelog"
                        onClick={() => setProfileOpen(false)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                      >
                        <span className="relative">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                          {hasUnseenChanges && (
                            <span className="absolute -right-1 -top-1 flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                            </span>
                          )}
                        </span>
                        Dev Notes{hasUnseenChanges ? " — New!" : ""}
                      </Link>

                      <Link
                        href="/feedback"
                        onClick={() => setProfileOpen(false)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        Feedback
                      </Link>

                      <Link
                        href="/support"
                        onClick={() => setProfileOpen(false)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        My Tickets
                      </Link>

                      <Link
                        href="/account"
                        onClick={() => setProfileOpen(false)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Account &amp; Billing
                      </Link>

                      {isAdmin && (
                        <>
                        <Link
                          href="/admin/feedback"
                          onClick={() => setProfileOpen(false)}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-orange-400 transition-colors hover:bg-orange-500/10 hover:text-orange-300"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          Admin Panel
                        </Link>
                        <Link
                          href="/admin/users"
                          onClick={() => setProfileOpen(false)}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-orange-400 transition-colors hover:bg-orange-500/10 hover:text-orange-300"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Manage Users
                        </Link>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          signOut({ callbackUrl: "/" });
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Mobile hamburger button ── */}
        <button
          type="button"
          onClick={() => setMobileOpen((p) => !p)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>
    </header>

      {/* ── Mobile slide-out menu (outside header to avoid backdrop-blur stacking context) ── */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />

          {/* Panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-72 overflow-y-auto border-l border-white/[0.06] bg-[#0a0f1a] px-5 py-5 md:hidden">
            {/* Close button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                aria-label="Close menu"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* User info (if signed in) */}
            {authenticated && user && (
              <div className="mb-5 mt-2 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-400">
                  {(user.name?.[0] ?? user.email?.[0] ?? "?").toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{user.name ?? "User"}</p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                  {(plan === "pro" || plan === "lifetime") && (
                    <span className="mt-0.5 inline-block rounded bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      {plan === "lifetime" ? "Lifetime" : "Pro"}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Nav links */}
            <div className="space-y-1">
              {[
                { href: "/", label: "Home" },
                ...NAV_LINKS,
                { href: "/blog", label: "Blog" },
                { href: "/feedback", label: "Feedback" },
                ...(authenticated
                  ? [
                      { href: "/dashboard", label: "Dashboard" },
                      { href: "/changelog", label: "Dev Notes" },
                      { href: "/support", label: "My Tickets" },
                      { href: "/account", label: "Account & Billing" },
                      ...(isAdmin ? [{ href: "/admin/feedback", label: "Admin Panel" }, { href: "/admin/users", label: "Manage Users" }] : []),
                    ]
                  : [
                      { href: "/changelog", label: "Dev Notes" },
                    ]),
                { href: "/pricing", label: "Pro" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? "text-white bg-white/[0.06]"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  {link.label === "Pro" && (
                    <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2h14v2H5v-2z" />
                    </svg>
                  )}
                  <span className="relative">
                    {link.label}
                    {link.label === "Dev Notes" && authenticated && hasUnseenChanges && (
                      <span className="absolute -right-3 top-0 flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                      </span>
                    )}
                  </span>
                </Link>
              ))}
            </div>

            {/* Divider */}
            <div className="my-4 border-t border-white/[0.06]" />

            {/* Auth action */}
            {!loading && (
              authenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-white"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    signIn(undefined, { callbackUrl: "/" });
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/[0.04]"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Sign in
                </button>
              )
            )}
          </div>
        </>
      )}
    </>
  );
}
