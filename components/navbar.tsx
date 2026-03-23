"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { signIn, signOut } from "next-auth/react";
import { useSession } from "@/components/session-provider";
import { LATEST_VERSION } from "@/lib/constants";
import { useCoinBalance } from "@/lib/use-coins";
import { useAvatarFrame } from "@/lib/use-coins";

const NAV_LINKS = [
  { href: "/analyze", label: "Analyze" },
  { href: "/train", label: "Training" },
  { href: "/sparring", label: "⚔️ Sparring" },
  { href: "/guess", label: "Guess the Move" },
  { href: "/chaos", label: "⚡ Chaos Chess" },
  { href: "/escape", label: "🎮 Escape Chess" },
  { href: "/roast", label: "🔥 Roast the Elo" },
  { href: "/about", label: "About" },
];

export function Navbar() {
  const pathname = usePathname();
  const { loading, authenticated, user, plan, isAdmin } = useSession();
  const coinBalance = useCoinBalance();
  const avatarFrame = useAvatarFrame();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [hasUnseenChanges, setHasUnseenChanges] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Check for unseen changelog
  useEffect(() => {
    try {
      const seen = parseInt(
        localStorage.getItem("firechess_changelog_seen") ?? "0",
        10,
      );
      setHasUnseenChanges(seen < LATEST_VERSION);
    } catch {
      setHasUnseenChanges(true);
    }
  }, [pathname]);

  // Poll for unread support messages
  useEffect(() => {
    if (!authenticated) return;
    let cancelled = false;
    const check = () => {
      fetch("/api/feedback/unread")
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled) setUnreadMessages(d.count ?? 0);
        })
        .catch(() => {});
    };
    check();
    const interval = setInterval(check, 60_000); // re-check every 60s
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [authenticated, pathname]);

  // Close profile dropdown on outside click
  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
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
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Reload the page when clicking a nav link that points to the current route
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a[href]");
      if (!a) return;
      const href = a.getAttribute("href");
      if (href && href === pathname) {
        e.preventDefault();
        window.location.reload();
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [pathname]);

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
          <div className="hidden items-center gap-1 lg:flex">
            {/* Pro link */}
            <Link
              href="/pricing"
              className={`inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-3.5 py-1.5 text-sm font-semibold text-slate-950 transition-all duration-200 hover:shadow-glow-sm ${
                isActive("/pricing") ? "shadow-glow-sm" : ""
              }`}
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2h14v2H5v-2z" />
              </svg>
              Pro
            </Link>

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

            {/* Analyze dropdown */}
            <div className="group relative">
              <button
                type="button"
                aria-haspopup="true"
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive("/analyze") || isActive("/my-openings")
                    ? "text-white bg-white/[0.06]"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                Analyze
                <svg
                  className="h-3 w-3 text-slate-500 transition-transform group-hover:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <div className="invisible absolute left-0 top-full pt-1 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
                <div className="min-w-[190px] rounded-xl border border-white/[0.08] bg-[#0a0f1a] p-1.5 shadow-xl shadow-black/40">
                  <Link
                    href="/"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      pathname === "/"
                        ? "text-white bg-white/[0.06]"
                        : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    🔍 Analyze Games
                  </Link>
                  <Link
                    href="/analyze"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive("/analyze")
                        ? "text-white bg-white/[0.06]"
                        : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    ♟️ PGN Analyzer
                  </Link>
                  <Link
                    href="/my-openings"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive("/my-openings")
                        ? "text-emerald-300 bg-emerald-500/[0.08]"
                        : "text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/[0.06]"
                    }`}
                  >
                    🌲 My Opening Tree
                  </Link>
                </div>
              </div>
            </div>

            {/* Games dropdown */}
            <div className="group relative">
              <button
                type="button"
                aria-haspopup="true"
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive("/train") ||
                  isActive("/guess") ||
                  isActive("/dungeon") ||
                  isActive("/roast") ||
                  isActive("/chaos")
                    ? "text-white bg-white/[0.06]"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                Games
                <svg
                  className="h-3 w-3 text-slate-500 transition-transform group-hover:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <div className="invisible absolute left-0 top-full pt-1 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
                <div className="min-w-[180px] rounded-xl border border-white/[0.08] bg-[#0a0f1a] p-1.5 shadow-xl shadow-black/40">
                  <Link
                    href="/train"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive("/train")
                        ? "text-white bg-white/[0.06]"
                        : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    🎯 Puzzles & Drills
                  </Link>
                  <Link
                    href="/guess"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive("/guess")
                        ? "text-white bg-white/[0.06]"
                        : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    🧩 Guess the Move
                  </Link>
                  <Link
                    href="/dungeon"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive("/dungeon")
                        ? "text-red-400 bg-red-500/[0.08]"
                        : "text-slate-400 hover:text-red-400 hover:bg-red-500/[0.06]"
                    }`}
                  >
                    ⚔️ Dungeon Tactics
                  </Link>
                  <Link
                    href="/chaos"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive("/chaos")
                        ? "text-purple-400 bg-purple-500/[0.08]"
                        : "text-slate-400 hover:text-purple-400 hover:bg-purple-500/[0.06]"
                    }`}
                  >
                    ⚡ Chaos Chess
                  </Link>
                  <Link
                    href="/roast"
                    onClick={() => {
                      if (pathname.startsWith("/roast")) {
                        window.dispatchEvent(
                          new CustomEvent("firechess:new-roast"),
                        );
                      }
                    }}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive("/roast")
                        ? "text-orange-400 bg-orange-500/[0.08]"
                        : "text-slate-400 hover:text-orange-400 hover:bg-orange-500/[0.06]"
                    }`}
                  >
                    🔥 Roast the Elo
                  </Link>
                </div>
              </div>
            </div>

            {/* More dropdown (About, Blog, Feedback, Leaderboard) */}
            <div className="group relative">
              <button
                type="button"
                aria-haspopup="true"
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive("/about") ||
                  isActive("/blog") ||
                  isActive("/feedback") ||
                  isActive("/leaderboard") ||
                  isActive("/shop") ||
                  isActive("/openings") ||
                  isActive("/coaches") ||
                  isActive("/youtubers")
                    ? "text-white bg-white/[0.06]"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                More
                <svg
                  className="h-3 w-3 text-slate-500 transition-transform group-hover:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <div className="invisible absolute left-0 top-full pt-1 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
                <div className="min-w-[160px] rounded-xl border border-white/[0.08] bg-[#0a0f1a] p-1.5 shadow-xl shadow-black/40">
                  <Link
                    href="/about"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive("/about")
                        ? "text-white bg-white/[0.06]"
                        : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    About
                  </Link>
                  <Link
                    href="/blog"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive("/blog")
                        ? "text-white bg-white/[0.06]"
                        : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    Blog
                  </Link>
                  <Link
                    href="/feedback"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive("/feedback")
                        ? "text-white bg-white/[0.06]"
                        : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    Feedback
                    {unreadMessages > 0 && (
                      <span className="flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/leaderboard"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive("/leaderboard")
                        ? "text-amber-400 bg-amber-500/[0.08]"
                        : "text-slate-400 hover:text-amber-400 hover:bg-amber-500/[0.06]"
                    }`}
                  >
                    🏆 Leaderboard
                  </Link>
                  <Link
                    href="/openings"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive("/openings")
                        ? "text-white bg-white/[0.06]"
                        : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    📖 Openings
                  </Link>
                  <Link
                    href="/shop"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive("/shop")
                        ? "text-amber-400 bg-amber-500/[0.08]"
                        : "text-slate-400 hover:text-amber-400 hover:bg-amber-500/[0.06]"
                    }`}
                  >
                    🪙 Coin Shop
                  </Link>
                  <div className="my-1 h-px bg-white/[0.06]" />
                  <Link
                    href="/coaches"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive("/coaches")
                        ? "text-emerald-400 bg-emerald-500/[0.08]"
                        : "text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/[0.06]"
                    }`}
                  >
                    🎓 For Coaches
                  </Link>
                  <Link
                    href="/youtubers"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive("/youtubers")
                        ? "text-fuchsia-400 bg-fuchsia-500/[0.08]"
                        : "text-slate-400 hover:text-fuchsia-400 hover:bg-fuchsia-500/[0.06]"
                    }`}
                  >
                    🎬 For Creators
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* ── Desktop right side (auth) ── */}
          <div className="hidden items-center gap-2.5 lg:flex">
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
                    {unreadMessages > 0 && (
                      <span className="absolute -right-1 -top-1 z-10 flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-orange-500" />
                      </span>
                    )}
                    {user?.image ? (
                      <img
                        src={user.image}
                        alt=""
                        className={`h-6 w-6 rounded-full object-cover ${avatarFrame.frameClass}`}
                        style={avatarFrame.frameStyle}
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const el = e.currentTarget;
                          el.style.display = "none";
                          const fb =
                            el.nextElementSibling as HTMLElement | null;
                          if (fb) fb.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className={`${user?.image ? "hidden" : "flex"} h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400 ${avatarFrame.frameClass}`}
                      style={avatarFrame.frameStyle}
                    >
                      {(
                        user?.name?.[0] ??
                        user?.email?.[0] ??
                        "?"
                      ).toUpperCase()}
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
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0d1117] shadow-2xl animate-in fade-in slide-in-from-top-2">
                      <div className="border-b border-white/[0.06] px-4 py-3">
                        <p className="truncate text-sm font-medium text-white">
                          {user?.name ?? "User"}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {user?.email}
                        </p>
                      </div>

                      <div className="p-1.5">
                        <div className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-400">
                          <span>Plan</span>
                          <span
                            className={
                              plan === "pro" || plan === "lifetime"
                                ? "font-semibold text-emerald-400"
                                : "text-slate-500"
                            }
                          >
                            {plan === "lifetime"
                              ? "Lifetime"
                              : plan === "pro"
                                ? "Pro"
                                : "Free"}
                          </span>
                        </div>

                        <Link
                          href="/changelog"
                          onClick={() => setProfileOpen(false)}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                        >
                          <span className="relative">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                              />
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
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                            />
                          </svg>
                          Feedback
                        </Link>

                        <Link
                          href="/support"
                          onClick={() => setProfileOpen(false)}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                        >
                          <span className="relative">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                            {!isAdmin && unreadMessages > 0 && (
                              <span className="absolute -right-1.5 -top-1.5 flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
                              </span>
                            )}
                          </span>
                          My Tickets
                          {!isAdmin && unreadMessages > 0
                            ? ` (${unreadMessages})`
                            : ""}
                        </Link>

                        <Link
                          href="/account"
                          onClick={() => setProfileOpen(false)}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
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
                              <span className="relative">
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                  />
                                </svg>
                                {unreadMessages > 0 && (
                                  <span className="absolute -right-1.5 -top-1.5 flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
                                  </span>
                                )}
                              </span>
                              Admin Panel
                              {unreadMessages > 0 ? ` (${unreadMessages})` : ""}
                            </Link>
                            <Link
                              href="/admin/users"
                              onClick={() => setProfileOpen(false)}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-orange-400 transition-colors hover:bg-orange-500/10 hover:text-orange-300"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              Manage Users
                            </Link>
                            <Link
                              href="/admin/affiliates"
                              onClick={() => setProfileOpen(false)}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-orange-400 transition-colors hover:bg-orange-500/10 hover:text-orange-300"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                />
                              </svg>
                              Affiliates
                            </Link>
                            <Link
                              href="/admin/gift"
                              onClick={() => setProfileOpen(false)}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-orange-400 transition-colors hover:bg-orange-500/10 hover:text-orange-300"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                                />
                              </svg>
                              Gift Links
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
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
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
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
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
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />

          {/* Panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-72 overflow-y-auto border-l border-white/[0.06] bg-[#0a0f1a] px-5 py-5 lg:hidden">
            {/* Close button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                aria-label="Close menu"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* User info (if signed in) */}
            {authenticated && user && (
              <div className="mb-5 mt-2 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                {user.image ? (
                  <img
                    src={user.image}
                    alt=""
                    className={`h-10 w-10 rounded-full object-cover ${avatarFrame.frameClass}`}
                    style={avatarFrame.frameStyle}
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const el = e.currentTarget;
                      el.style.display = "none";
                      const fb = el.nextElementSibling as HTMLElement | null;
                      if (fb) fb.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className={`${user.image ? "hidden" : "flex"} h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-400 ${avatarFrame.frameClass}`}
                  style={avatarFrame.frameStyle}
                >
                  {(user.name?.[0] ?? user.email?.[0] ?? "?").toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {user.name ?? "User"}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {user.email}
                  </p>
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
                { href: "/my-openings", label: "🌲 My Opening Tree" },
                { href: "/blog", label: "Blog" },
                { href: "/chaos", label: "⚡ Chaos Chess" },
                { href: "/dungeon", label: "⚔️ Dungeon Tactics" },
                { href: "/openings", label: "📖 Openings" },
                { href: "/leaderboard", label: "🏆 Leaderboard" },
                { href: "/shop", label: "🪙 Coin Shop" },
                { href: "/coaches", label: "🎓 For Coaches" },
                { href: "/youtubers", label: "🎬 For Creators" },
                { href: "/feedback", label: "Feedback" },
                ...(authenticated
                  ? [
                      { href: "/dashboard", label: "Dashboard" },
                      { href: "/changelog", label: "Dev Notes" },
                      { href: "/support", label: "My Tickets" },
                      { href: "/account", label: "Account & Billing" },
                      ...(isAdmin
                        ? [
                            { href: "/admin/feedback", label: "Admin Panel" },
                            { href: "/admin/users", label: "Manage Users" },
                            { href: "/admin/affiliates", label: "Affiliates" },
                            { href: "/admin/gift", label: "Gift Links" },
                          ]
                        : []),
                    ]
                  : [{ href: "/changelog", label: "Dev Notes" }]),
                { href: "/pricing", label: "Pro" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={
                    link.href === "/roast" && pathname.startsWith("/roast")
                      ? () => {
                          window.dispatchEvent(
                            new CustomEvent("firechess:new-roast"),
                          );
                        }
                      : undefined
                  }
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? "text-white bg-white/[0.06]"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  {link.label === "Pro" && (
                    <svg
                      className="h-4 w-4 text-emerald-400"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2h14v2H5v-2z" />
                    </svg>
                  )}
                  <span className="relative">
                    {link.label}
                    {link.label === "Dev Notes" &&
                      authenticated &&
                      hasUnseenChanges && (
                        <span className="absolute -right-3 top-0 flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                        </span>
                      )}
                    {(link.label === "My Tickets" ||
                      link.label === "Admin Panel" ||
                      link.label === "Feedback") &&
                      unreadMessages > 0 && (
                        <span className="absolute -right-3 top-0 flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
                        </span>
                      )}
                  </span>
                </Link>
              ))}
            </div>

            {/* Divider */}
            <div className="my-4 border-t border-white/[0.06]" />

            {/* Auth action */}
            {!loading &&
              (authenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-white"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
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
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  Sign in
                </button>
              ))}
          </div>
        </>
      )}
    </>
  );
}
