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
import { CoinShop } from "@/components/coin-shop";

export function Navbar() {
  const pathname = usePathname();
  const { loading, authenticated, user, plan, isAdmin } = useSession();
  const coinBalance = useCoinBalance();
  const avatarFrame = useAvatarFrame();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [profileOpen, setProfileOpen] = useState(false);
  const [coinShopOpen, setCoinShopOpen] = useState(false);

  const toggleSection = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
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
        <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-3 md:px-10">
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

          {/* ── Desktop nav — 4 grouped dropdowns ── */}
          <div className="hidden items-center gap-0.5 lg:flex">
            {/* Analyze */}
            <div className="group relative">
              <button
                type="button"
                aria-haspopup="true"
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  pathname === "/" ||
                  isActive("/analyze") ||
                  isActive("/my-openings")
                    ? "bg-white/[0.06] text-white"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
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
                <div className="min-w-[200px] rounded-xl border border-white/[0.08] bg-[#0d0a06] p-1.5 shadow-xl shadow-black/50">
                  <Link
                    href="/"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${pathname === "/" ? "bg-white/[0.06] text-white" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"}`}
                  >
                    🔍 Analyze Games
                  </Link>
                  <Link
                    href="/analyze"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive("/analyze") ? "bg-white/[0.06] text-white" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"}`}
                  >
                    ♟️ PGN Analyzer
                  </Link>
                  <Link
                    href="/my-openings"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive("/my-openings") ? "bg-orange-500/[0.08] text-orange-300" : "text-slate-400 hover:bg-orange-500/[0.06] hover:text-orange-300"}`}
                  >
                    🌲 My Opening Tree
                  </Link>
                </div>
              </div>
            </div>

            {/* Train */}
            <div className="group relative">
              <button
                type="button"
                aria-haspopup="true"
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive("/train") ||
                  isActive("/daily") ||
                  isActive("/sparring") ||
                  isActive("/guess") ||
                  isActive("/dungeon") ||
                  isActive("/openings") ||
                  isActive("/tactics") ||
                  isActive("/endgames")
                    ? "bg-white/[0.06] text-white"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                Train
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
                <div className="min-w-[210px] rounded-xl border border-white/[0.08] bg-[#0d0a06] p-1.5 shadow-xl shadow-black/50">
                  <Link
                    href="/daily"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive("/daily") ? "bg-amber-500/[0.12] text-amber-400" : "text-slate-400 hover:bg-amber-500/[0.06] hover:text-amber-400"}`}
                  >
                    📅 Daily Routine
                  </Link>
                  <Link
                    href="/train"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive("/train") ? "bg-white/[0.06] text-white" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"}`}
                  >
                    🎯 Puzzles & Drills
                  </Link>
                  <Link
                    href="/sparring"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive("/sparring") ? "bg-sky-500/[0.08] text-sky-400" : "text-slate-400 hover:bg-sky-500/[0.06] hover:text-sky-400"}`}
                  >
                    ⚔️ Opening Sparring
                  </Link>
                  <Link
                    href="/guess"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive("/guess") ? "bg-white/[0.06] text-white" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"}`}
                  >
                    🧩 Guess the Move
                  </Link>
                </div>
              </div>
            </div>

            {/* Guides */}
            <div className="group relative">
              <button
                type="button"
                aria-haspopup="true"
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive("/openings") ||
                  isActive("/tactics") ||
                  isActive("/endgames") ||
                  isActive("/positions") ||
                  isActive("/time-controls") ||
                  isActive("/mistakes") ||
                  isActive("/improve")
                    ? "bg-white/[0.06] text-white"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                Guides
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
                <div className="min-w-[200px] rounded-xl border border-white/[0.08] bg-[#0d0a06] p-1.5 shadow-xl shadow-black/50">
                  <Link
                    href="/openings"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive("/openings") ? "bg-white/[0.06] text-white" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"}`}
                  >
                    📖 Openings
                  </Link>
                  <Link
                    href="/tactics"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive("/tactics") ? "bg-sky-500/[0.08] text-sky-400" : "text-slate-400 hover:bg-sky-500/[0.06] hover:text-sky-400"}`}
                  >
                    ⚡ Tactics
                  </Link>
                  <Link
                    href="/endgames"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive("/endgames") ? "bg-emerald-500/[0.08] text-emerald-400" : "text-slate-400 hover:bg-emerald-500/[0.06] hover:text-emerald-400"}`}
                  >
                    ♟ Endgames
                  </Link>
                  <Link
                    href="/games"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive("/games") ? "bg-amber-500/[0.08] text-amber-400" : "text-slate-400 hover:bg-amber-500/[0.06] hover:text-amber-400"}`}
                  >
                    ♛ Famous Games
                  </Link>
                  <Link
                    href="/players"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive("/players") ? "bg-yellow-500/[0.08] text-yellow-400" : "text-slate-400 hover:bg-yellow-500/[0.06] hover:text-yellow-400"}`}
                  >
                    👑 Grandmasters
                  </Link>
                  <Link
                    href="/glossary"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive("/glossary") ? "bg-cyan-500/[0.08] text-cyan-400" : "text-slate-400 hover:bg-cyan-500/[0.06] hover:text-cyan-400"}`}
                  >
                    📚 Glossary
                  </Link>
                  <div className="my-1 h-px bg-white/[0.06]" />
                  <Link
                    href="/positions"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive("/positions") ? "bg-cyan-500/[0.08] text-cyan-400" : "text-slate-400 hover:bg-cyan-500/[0.06] hover:text-cyan-400"}`}
                  >
                    🧠 Positions
                  </Link>
                  <Link
                    href="/time-controls"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive("/time-controls") ? "bg-amber-500/[0.08] text-amber-400" : "text-slate-400 hover:bg-amber-500/[0.06] hover:text-amber-400"}`}
                  >
                    ⏱ Time Controls
                  </Link>
                  <Link
                    href="/mistakes"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive("/mistakes") ? "bg-red-500/[0.08] text-red-400" : "text-slate-400 hover:bg-red-500/[0.06] hover:text-red-400"}`}
                  >
                    ❌ Common Mistakes
                  </Link>
                  <Link
                    href="/improve"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive("/improve") ? "bg-emerald-500/[0.08] text-emerald-400" : "text-slate-400 hover:bg-emerald-500/[0.06] hover:text-emerald-400"}`}
                  >
                    📈 Improve by Rating
                  </Link>
                </div>
              </div>
            </div>

            {/* Play */}
            <div className="group relative">
              <button
                type="button"
                aria-haspopup="true"
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive("/chaos") ||
                  isActive("/dungeon") ||
                  isActive("/roast")
                    ? "bg-white/[0.06] text-white"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                Play
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
                <div className="min-w-[200px] rounded-xl border border-white/[0.08] bg-[#0d0a06] p-1.5 shadow-xl shadow-black/50">
                  <Link
                    href="/chaos"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive("/chaos") ? "bg-purple-500/[0.08] text-purple-400" : "text-slate-400 hover:bg-purple-500/[0.06] hover:text-purple-400"}`}
                  >
                    ⚡ Chaos Chess
                  </Link>
                  <Link
                    href="/dungeon"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive("/dungeon") ? "bg-red-500/[0.08] text-red-400" : "text-slate-400 hover:bg-red-500/[0.06] hover:text-red-400"}`}
                  >
                    🗡️ Dungeon Tactics
                  </Link>
                  <Link
                    href="/roast"
                    onClick={() => {
                      if (pathname.startsWith("/roast"))
                        window.dispatchEvent(
                          new CustomEvent("firechess:new-roast"),
                        );
                    }}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive("/roast") ? "bg-orange-500/[0.08] text-orange-400" : "text-slate-400 hover:bg-orange-500/[0.06] hover:text-orange-400"}`}
                  >
                    🔥 Roast the Elo
                  </Link>
                </div>
              </div>
            </div>

            {/* Community */}
            <div className="group relative">
              <button
                type="button"
                aria-haspopup="true"
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive("/blog") ||
                  isActive("/leaderboard") ||
                  isActive("/shop") ||
                  isActive("/coaches") ||
                  isActive("/youtubers") ||
                  isActive("/about") ||
                  isActive("/changelog")
                    ? "bg-white/[0.06] text-white"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                Community
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
                <div className="min-w-[180px] rounded-xl border border-white/[0.08] bg-[#0d0a06] p-1.5 shadow-xl shadow-black/50">
                  <Link
                    href="/blog"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive("/blog") ? "bg-white/[0.06] text-white" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"}`}
                  >
                    📝 Blog
                  </Link>
                  <Link
                    href="/leaderboard"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive("/leaderboard") ? "bg-amber-500/[0.08] text-amber-400" : "text-slate-400 hover:bg-amber-500/[0.06] hover:text-amber-400"}`}
                  >
                    🏆 Leaderboard
                  </Link>
                  <Link
                    href="/coaches"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive("/coaches") ? "bg-orange-500/[0.08] text-orange-400" : "text-slate-400 hover:bg-orange-500/[0.06] hover:text-orange-400"}`}
                  >
                    🎓 For Coaches
                  </Link>
                  <Link
                    href="/youtubers"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive("/youtubers") ? "bg-amber-500/[0.08] text-amber-400" : "text-stone-400 hover:bg-amber-500/[0.06] hover:text-amber-400"}`}
                  >
                    🎬 For Creators
                  </Link>
                  <Link
                    href="/about"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive("/about") ? "bg-white/[0.06] text-white" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"}`}
                  >
                    About
                  </Link>
                  <div className="my-1 h-px bg-white/[0.06]" />
                  <Link
                    href="/shop"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive("/shop") ? "bg-amber-500/[0.08] text-amber-400" : "text-slate-400 hover:bg-amber-500/[0.06] hover:text-amber-400"}`}
                  >
                    🪙 Coin Shop
                  </Link>
                  <Link
                    href="/changelog"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive("/changelog") ? "bg-white/[0.06] text-white" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"}`}
                  >
                    Dev Notes
                    {authenticated && hasUnseenChanges && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-red-500" />
                    )}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* ── Desktop right side ── */}
          <div className="hidden items-center gap-2 lg:flex">
            {/* Pro CTA */}
            <Link
              href="/pricing"
              className={`inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 px-3.5 py-1.5 text-sm font-semibold text-white transition-all duration-200 hover:shadow-glow-sm ${isActive("/pricing") ? "shadow-glow-sm" : ""}`}
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

            {loading ? (
              <div className="h-9 w-20 animate-pulse rounded-lg bg-white/[0.06]" />
            ) : !authenticated ? (
              <button
                type="button"
                onClick={() => signIn(undefined, { callbackUrl: "/" })}
                className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-white"
              >
                Sign in
              </button>
            ) : (
              <>
                {coinBalance > 0 && (
                  <button
                    type="button"
                    onClick={() => setCoinShopOpen(true)}
                    className="flex items-center gap-1 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-xs font-bold text-amber-400 transition-colors hover:bg-amber-500/15"
                    title="Open coin shop"
                  >
                    <span>🪙</span>
                    {coinBalance.toLocaleString()}
                  </button>
                )}
                <Link
                  href="/dashboard"
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${isActive("/dashboard") ? "bg-white/[0.06] text-white" : "text-slate-400 hover:bg-white/[0.04] hover:text-white"}`}
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
                      className={`${user?.image ? "hidden" : "flex"} h-6 w-6 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400 ${avatarFrame.frameClass}`}
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
                      <span className="rounded bg-gradient-to-r from-orange-500/20 to-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
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
                    <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-white/[0.08] bg-[#140f0a] shadow-2xl animate-in fade-in slide-in-from-top-2">
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
                                ? "font-semibold text-amber-400"
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
                          href="/profile"
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
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          Chess Profile
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
                        {isAdmin && (
                          <>
                            <div className="my-1 h-px bg-white/[0.06]" />
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
                        <div className="my-1 h-px bg-white/[0.06]" />
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

          {/* ── Mobile hamburger ── */}
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

      {/* ── Mobile slide-out ── */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-72 overflow-y-auto border-l border-white/[0.06] bg-[#110c08] px-4 pb-8 pt-4 lg:hidden">
            {/* Header row: user info + close */}
            <div className="mb-5 flex items-center justify-between">
              {authenticated && user ? (
                <div className="flex items-center gap-2.5">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt=""
                      className={`h-8 w-8 rounded-full object-cover ${avatarFrame.frameClass}`}
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
                    className={`${user.image ? "hidden" : "flex"} h-8 w-8 items-center justify-center rounded-full bg-orange-500/20 text-sm font-bold text-orange-400 ${avatarFrame.frameClass}`}
                    style={avatarFrame.frameStyle}
                  >
                    {(user.name?.[0] ?? user.email?.[0] ?? "?").toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-white">
                      {user.name ?? "User"}
                    </p>
                    {(plan === "pro" || plan === "lifetime") && (
                      <p className="text-[9px] font-bold uppercase tracking-wider text-amber-400">
                        {plan === "lifetime" ? "Lifetime" : "Pro"}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <span className="text-sm font-semibold text-white">Menu</span>
              )}
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-white"
                aria-label="Close menu"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* ── Accordion sections ── */}
            {(
              [
                {
                  key: "analyze",
                  label: "Analyze",
                  links: [
                    { href: "/", label: "🔍 Analyze Games" },
                    { href: "/analyze", label: "♟️ PGN Analyzer" },
                    { href: "/my-openings", label: "🌲 My Opening Tree" },
                  ],
                },
                {
                  key: "train",
                  label: "Train",
                  links: [
                    { href: "/train", label: "🎯 Puzzles & Drills" },
                    { href: "/sparring", label: "⚔️ Opening Sparring" },
                    { href: "/guess", label: "🧩 Guess the Move" },
                  ],
                },
                {
                  key: "guides",
                  label: "Guides",
                  links: [
                    { href: "/openings", label: "📖 Openings" },
                    { href: "/tactics", label: "⚡ Tactics" },
                    { href: "/endgames", label: "♟ Endgames" },
                    { href: "/positions", label: "🧠 Positions" },
                    { href: "/time-controls", label: "⏱ Time Controls" },
                    { href: "/mistakes", label: "❌ Common Mistakes" },
                    { href: "/improve", label: "📈 Improve by Rating" },
                    { href: "/games", label: "♛ Famous Games" },
                    { href: "/players", label: "👑 Grandmasters" },
                    { href: "/glossary", label: "📚 Glossary" },
                  ],
                },
                {
                  key: "play",
                  label: "Play",
                  links: [
                    { href: "/chaos", label: "⚡ Chaos Chess" },
                    { href: "/dungeon", label: "🗡️ Dungeon Tactics" },
                    { href: "/roast", label: "🔥 Roast the Elo" },
                  ],
                },
                {
                  key: "community",
                  label: "Community",
                  links: [
                    { href: "/blog", label: "📝 Blog" },
                    { href: "/leaderboard", label: "🏆 Leaderboard" },
                    { href: "/coaches", label: "🎓 For Coaches" },
                    { href: "/youtubers", label: "🎬 For Creators" },
                    { href: "/about", label: "About" },
                    { href: "/shop", label: "🪙 Coin Shop" },
                    { href: "/changelog", label: "Dev Notes" },
                  ],
                },
              ] as const
            ).map((section) => {
              const isExpanded = !!openSections[section.key];
              const hasActive = section.links.some((l) =>
                l.href === "/" ? pathname === "/" : isActive(l.href),
              );
              return (
                <div
                  key={section.key}
                  className="mb-1 overflow-hidden rounded-xl border border-white/[0.05] bg-white/[0.02]"
                >
                  <button
                    type="button"
                    onClick={() => toggleSection(section.key)}
                    className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm font-semibold transition-colors ${hasActive ? "text-white" : "text-slate-400 hover:text-white"}`}
                  >
                    {section.label}
                    <svg
                      className={`h-3.5 w-3.5 text-slate-500 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-white/[0.05] px-2 pb-2 pt-1 space-y-0.5">
                      {section.links.map((l) => {
                        const active =
                          l.href === "/" ? pathname === "/" : isActive(l.href);
                        return (
                          <Link
                            key={l.href}
                            href={l.href}
                            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active ? "bg-white/[0.06] text-white" : "text-slate-400 hover:bg-white/[0.04] hover:text-white"}`}
                          >
                            {l.label}
                            {l.href === "/changelog" && hasUnseenChanges && (
                              <span className="ml-auto h-2 w-2 rounded-full bg-red-500" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Account section (auth only) */}
            {authenticated && (
              <div className="mb-1 overflow-hidden rounded-xl border border-white/[0.05] bg-white/[0.02]">
                <button
                  type="button"
                  onClick={() => toggleSection("account")}
                  className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm font-semibold transition-colors ${isActive("/dashboard") || isActive("/account") || isActive("/support") || isActive("/feedback") ? "text-white" : "text-slate-400 hover:text-white"}`}
                >
                  Account
                  <svg
                    className={`h-3.5 w-3.5 text-slate-500 transition-transform duration-200 ${openSections["account"] ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {openSections["account"] && (
                  <div className="border-t border-white/[0.05] px-2 pb-2 pt-1 space-y-0.5">
                    <Link
                      href="/dashboard"
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive("/dashboard") ? "bg-white/[0.06] text-white" : "text-slate-400 hover:bg-white/[0.04] hover:text-white"}`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/account"
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive("/account") ? "bg-white/[0.06] text-white" : "text-slate-400 hover:bg-white/[0.04] hover:text-white"}`}
                    >
                      Account & Billing
                    </Link>
                    <Link
                      href="/support"
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive("/support") ? "bg-white/[0.06] text-white" : "text-slate-400 hover:bg-white/[0.04] hover:text-white"}`}
                    >
                      My Tickets
                      {!isAdmin && unreadMessages > 0
                        ? ` (${unreadMessages})`
                        : ""}
                      {!isAdmin && unreadMessages > 0 && (
                        <span className="ml-1 inline-flex h-2 w-2 rounded-full bg-orange-500" />
                      )}
                    </Link>
                    <Link
                      href="/feedback"
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive("/feedback") ? "bg-white/[0.06] text-white" : "text-slate-400 hover:bg-white/[0.04] hover:text-white"}`}
                    >
                      Feedback
                    </Link>
                    {isAdmin && (
                      <>
                        <div className="my-1 h-px bg-white/[0.06]" />
                        {(
                          [
                            { href: "/admin/feedback", label: "Admin Panel" },
                            { href: "/admin/users", label: "Manage Users" },
                            { href: "/admin/affiliates", label: "Affiliates" },
                            { href: "/admin/gift", label: "Gift Links" },
                          ] as const
                        ).map((l) => (
                          <Link
                            key={l.href}
                            href={l.href}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-orange-400 transition-colors hover:bg-orange-500/10 hover:text-orange-300"
                          >
                            {l.label}
                            {l.href === "/admin/feedback" &&
                              unreadMessages > 0 && (
                                <span className="ml-auto inline-flex h-2 w-2 rounded-full bg-orange-500" />
                              )}
                          </Link>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Bottom actions */}
            <div className="mt-4 space-y-2">
              <Link
                href="/pricing"
                className={`flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-glow-sm ${isActive("/pricing") ? "shadow-glow-sm" : ""}`}
              >
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2h14v2H5v-2z" />
                </svg>
                Go Pro
              </Link>
              {!loading &&
                (authenticated ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.08] px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:border-white/[0.15] hover:text-white"
                  >
                    Sign out
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      signIn(undefined, { callbackUrl: "/" });
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/[0.08]"
                  >
                    Sign in
                  </button>
                ))}
            </div>
          </div>
        </>
      )}

      {/* ── Coin Shop Modal ── */}
      {coinShopOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm pt-16 pb-8 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCoinShopOpen(false);
          }}
        >
          <div className="relative w-full max-w-3xl rounded-2xl border border-white/[0.08] bg-[#0d0a06] shadow-2xl">
            <button
              type="button"
              onClick={() => setCoinShopOpen(false)}
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
              aria-label="Close coin shop"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <CoinShop />
          </div>
        </div>
      )}
    </>
  );
}
