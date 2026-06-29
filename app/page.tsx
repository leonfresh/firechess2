"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  FileText,
  Flame,
  Gem,
  Skull,
  Swords,
  Zap,
} from "lucide-react";
import {
  HeroSection,
  type SiteStats as HeroSiteStats,
} from "@/components/home/hero-section";
import dynamic from "next/dynamic";

// Below-the-fold homepage sections are code-split to keep the initial JS
// bundle lean. They only render when no scan is in flight, so deferring them
// is safe and improves LCP / INP on mobile.
const HowItWorks = dynamic(
  () => import("@/components/home/how-it-works").then((m) => m.HowItWorks),
  { ssr: true },
);
const EmailCapture = dynamic(
  () => import("@/components/home/email-capture").then((m) => m.EmailCapture),
  { ssr: true },
);
import { DailyLoginPopup } from "@/components/daily-login-rewards";
import { ProWelcomeModal } from "@/components/lifetime-welcome";
import { AdminDebug } from "@/components/admin-debug";
import { SampleReportsSection } from "@/components/sample-reports-section";
import { HomepageBlogSection } from "@/components/homepage-blog-section";
import { DiscordCta } from "@/components/home/discord-cta";
import type { CardViewMode } from "@/components/card-carousel";
import { useSession } from "@/components/session-provider";
import {
  buildScanReuseSignatureInBrowser,
  splitMultiPgn,
} from "@/lib/client-analysis";
import type {
  AnalysisSource,
  ScanMode,
  TimeControl,
} from "@/lib/client-analysis";
import { scanOwnerStorageKey } from "@/lib/scan-session";

type RequestState = "idle" | "loading" | "done" | "error";
const PREFS_KEY = "firechess-user-prefs";
const FULL_SCAN_MODE: ScanMode = "both";
const REDDIT_THREAD_URL =
  "https://www.reddit.com/r/chessbeginners/comments/1re8jgm/i_made_a_free_tool_that_finds_the_mistakes_you/";

const FREE_MAX_GAMES = 300;
const FREE_MAX_DEPTH = 12;
const FREE_MAX_MOVES = 30;
/** Hard limits for the pasted-PGN source (kept in sync with the server). */
const PGN_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const PGN_MAX_GAMES = 250;
const LOCAL_PRO_HOTKEY_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_LOCAL_PRO_HOTKEY !== "false";
const IS_DEV = process.env.NODE_ENV !== "production";

export default function HomePage() {
  const {
    plan: sessionPlan,
    authenticated,
    loading: sessionLoading,
  } = useSession();
  const router = useRouter();

  // Redirect authenticated users to their dashboard (skip if ?scan=1)
  useEffect(() => {
    if (!sessionLoading && authenticated) {
      const params = new URLSearchParams(window.location.search);
      if (params.get("scan") === "1" || params.get("landing") === "1") return;
      router.replace("/dashboard");
    }
  }, [sessionLoading, authenticated, router]);

  const [username, setUsername] = useState("");
  const [gameRangeMode, setGameRangeMode] = useState<"count" | "since">(
    "count",
  );
  const [gameCount, setGameCount] = useState(300);
  const [sinceDate, setSinceDate] = useState("");
  const [untilDate, setUntilDate] = useState("");
  const [moveCount, setMoveCount] = useState(30);
  const [cpThreshold, setCpThreshold] = useState(50);
  const [engineDepth, setEngineDepth] = useState(12);
  const [source, setSource] = useState<AnalysisSource | null>(null);
  const [pgnText, setPgnText] = useState("");
  const [scanMode, setScanMode] = useState<ScanMode>(FULL_SCAN_MODE);
  const [speed, setSpeed] = useState<TimeControl[]>(["all"]);
  const [cardViewMode, setCardViewMode] = useState<CardViewMode>(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      return "carousel";
    }
    return "list";
  });
  // Write-only: persisted into the scan request; the report now renders on the
  // /report/[id] route, so the homepage never reads this back.
  const [, setLastRunConfig] = useState<{
    maxGames: number;
    maxMoves: number;
    cpThreshold: number;
    engineDepth: number;
    source: AnalysisSource;
    scanMode: ScanMode;
    speed: TimeControl[];
  } | null>(null);
  const [state, setState] = useState<RequestState>("idle");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [siteStats, setSiteStats] = useState<{
    totalUsers: number;
    activeUsers30d: number;
    totalReports: number;
    proMembers: number;
    lifetimeMembers: number;
  } | null>(null);
  const [isLaunchingScan, setIsLaunchingScan] = useState(false);
  const [localProEnabled, setLocalProEnabled] = useState(false);
  const [, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "duplicate" | "error"
  >("idle");
  const [toast, setToast] = useState<string | null>(null);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);

  const hasProAccess =
    sessionPlan === "pro" || sessionPlan === "lifetime" || localProEnabled;
  const gamesOverFreeLimit =
    gameRangeMode === "count" && gameCount > FREE_MAX_GAMES;
  const depthOverFreeLimit = engineDepth > FREE_MAX_DEPTH;
  const movesOverFreeLimit = moveCount > FREE_MAX_MOVES;
  const freeLimitsExceeded =
    !hasProAccess &&
    (gamesOverFreeLimit || depthOverFreeLimit || movesOverFreeLimit);

  useEffect(() => {
    if (!advancedSettingsOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAdvancedSettingsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [advancedSettingsOpen]);

  useEffect(() => {
    if (state !== "idle") {
      setAdvancedSettingsOpen(false);
    }
  }, [state]);

  /* ── Hero typography animation ── */
  // Fetch public stats once on mount for social proof in the hero
  useEffect(() => {
    fetch("/api/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setSiteStats(data);
      })
      .catch(() => {});
  }, []);

  // Hero CTA scroll handlers — smooth-scroll to the analyzer form and the
  // inline sample-reports section without a route change.
  const scrollToAnalyzer = useCallback(() => {
    document
      .getElementById("analyzer")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const scrollToSampleReports = useCallback(() => {
    document
      .getElementById("sample-reports")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    if (!IS_DEV || !LOCAL_PRO_HOTKEY_ENABLED) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Backquote") return;

      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isTypingField =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        !!target?.isContentEditable;

      if (isTypingField) return;

      setLocalProEnabled((prev) => {
        const next = !prev;
        setNotice(
          next
            ? "Local Pro mode enabled via ~ hotkey."
            : "Local Pro mode disabled.",
        );
        return next;
      });
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PREFS_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as {
        gameCount?: number;
        moveCount?: number;
        cpThreshold?: number;
        engineDepth?: number;
        source?: AnalysisSource;
        scanMode?: string;
        speed?: string | string[];
        gameRangeMode?: string;
        sinceDate?: string;
        untilDate?: string;
        cardViewMode?: string;
      };

      if (
        parsed.gameRangeMode === "count" ||
        parsed.gameRangeMode === "since"
      ) {
        setGameRangeMode(parsed.gameRangeMode);
      }
      if (typeof parsed.gameCount === "number") {
        setGameCount(Math.min(100000, Math.max(1, Math.floor(parsed.gameCount))));
      }
      if (typeof parsed.sinceDate === "string" && parsed.sinceDate) {
        setSinceDate(parsed.sinceDate);
      }
      if (typeof parsed.untilDate === "string") {
        setUntilDate(parsed.untilDate);
      }
      if (typeof parsed.moveCount === "number") {
        setMoveCount(Math.min(30, Math.max(1, Math.floor(parsed.moveCount))));
      }
      if (typeof parsed.cpThreshold === "number") {
        setCpThreshold(
          Math.min(1000, Math.max(1, Math.floor(parsed.cpThreshold))),
        );
      }
      if (typeof parsed.engineDepth === "number") {
        setEngineDepth(
          Math.min(24, Math.max(6, Math.floor(parsed.engineDepth))),
        );
      }
      if (parsed.source === "chesscom" || parsed.source === "lichess") {
        setSource(parsed.source);
      }
      if (
        typeof (parsed as any).username === "string" &&
        (parsed as any).username
      ) {
        setUsername((parsed as any).username);
      }
      if (
        parsed.cardViewMode === "carousel" ||
        parsed.cardViewMode === "list" ||
        parsed.cardViewMode === "grid"
      ) {
        setCardViewMode(parsed.cardViewMode);
      }
      if (
        parsed.scanMode === "openings" ||
        parsed.scanMode === "tactics" ||
        parsed.scanMode === "endgames" ||
        parsed.scanMode === "both" ||
        parsed.scanMode === "time-management"
      ) {
        setScanMode(FULL_SCAN_MODE);
      }
      // Restore speed (supports both legacy single string and new array format)
      if (Array.isArray(parsed.speed)) {
        const valid = parsed.speed.filter(
          (s): s is TimeControl =>
            s === "all" ||
            s === "bullet" ||
            s === "blitz" ||
            s === "rapid" ||
            s === "classical",
        );
        if (valid.length > 0) setSpeed(valid);
      } else if (typeof parsed.speed === "string") {
        if (
          parsed.speed === "all" ||
          parsed.speed === "bullet" ||
          parsed.speed === "blitz" ||
          parsed.speed === "rapid" ||
          parsed.speed === "classical"
        ) {
          setSpeed([parsed.speed as TimeControl]);
        }
      }
    } catch {
      // ignore malformed localStorage
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        PREFS_KEY,
        JSON.stringify({
          gameCount,
          moveCount,
          cpThreshold,
          engineDepth,
          source,
          scanMode: FULL_SCAN_MODE,
          speed,
          gameRangeMode,
          sinceDate,
          untilDate,
          cardViewMode,
          username: username.trim() || undefined,
        }),
      );
    } catch {
      // ignore storage write failures
    }
  }, [
    gameCount,
    moveCount,
    cpThreshold,
    engineDepth,
    source,
    scanMode,
    speed,
    gameRangeMode,
    sinceDate,
    untilDate,
    cardViewMode,
    username,
  ]);




  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = username.trim();
    if (!trimmed) {
      setError(
        source === "pgn"
          ? "Enter your name as it appears in the PGN (e.g. [White \"YourName\"])."
          : "Please enter your chess username.",
      );
      setState("error");
      return;
    }

    if (!source) {
      setError(
        "Please select a platform — Lichess, Chess.com, or Paste PGN.",
      );
      setState("error");
      return;
    }

    // Pasted-PGN source has its own validation: non-empty text within limits,
    // and at least one parseable game.
    if (source === "pgn") {
      const trimmedPgn = pgnText.trim();
      if (!trimmedPgn) {
        setError("Paste at least one PGN game (or upload a .pgn file).");
        setState("error");
        return;
      }
      if (new Blob([trimmedPgn]).size > PGN_MAX_BYTES) {
        setError(
          `That PGN is too large (max ${Math.round(PGN_MAX_BYTES / 1024 / 1024)} MB). Trim it down or split it into a smaller batch.`,
        );
        setState("error");
        return;
      }
      const pgnGameCount = splitMultiPgn(trimmedPgn).length;
      if (pgnGameCount > PGN_MAX_GAMES) {
        setError(
          `That's ${pgnGameCount} games — the limit is ${PGN_MAX_GAMES}. Split your batch and run a few scans.`,
        );
        setState("error");
        return;
      }
    }

    if (
      !hasProAccess &&
      gameRangeMode === "count" &&
      gameCount > FREE_MAX_GAMES
    ) {
      setError(
        `Free plan supports up to ${FREE_MAX_GAMES} recent games per scan. Set games to ${FREE_MAX_GAMES} or less, or upgrade on /pricing.`,
      );
      setState("error");
      return;
    }

    if (!hasProAccess && gameRangeMode === "since") {
      setError(
        "Scanning by date range is a Pro feature. Use “Last N” (up to " +
          FREE_MAX_GAMES +
          " games) or upgrade on /pricing.",
      );
      setState("error");
      return;
    }

    if (gameRangeMode === "since" && !sinceDate) {
      setError('Please pick a start date for the "Range" range mode.');
      setState("error");
      return;
    }

    if (
      gameRangeMode === "since" &&
      sinceDate &&
      untilDate &&
      new Date(untilDate).getTime() < new Date(sinceDate).getTime()
    ) {
      setError('The "To" date can\'t be before the "From" date.');
      setState("error");
      return;
    }

    if (!hasProAccess && engineDepth > FREE_MAX_DEPTH) {
      setError(
        `Free plan supports engine depth up to ${FREE_MAX_DEPTH}. Set depth to ${FREE_MAX_DEPTH} or less, or upgrade on /pricing.`,
      );
      setState("error");
      return;
    }

    try {
      // Range mode forces a high cap so the date filter is the real limiter.
      // For free users we still clamp to the free cap as a safety net (the
      // hard block above should already prevent reaching here in Range mode).
      const rangeCap = hasProAccess ? 100000 : FREE_MAX_GAMES;
      const safeGames =
        gameRangeMode === "since"
          ? rangeCap
          : Math.min(hasProAccess ? 100000 : 5000, Math.max(1, Math.floor(gameCount || 300)));
      const safeSince =
        gameRangeMode === "since" && sinceDate
          ? new Date(sinceDate).getTime()
          : undefined;
      const safeUntil =
        gameRangeMode === "since" && untilDate
          ? new Date(untilDate).getTime()
          : undefined;
      const safeMoves = Math.min(
        hasProAccess ? 40 : FREE_MAX_MOVES,
        Math.max(1, Math.floor(moveCount || 20)),
      );
      const safeCpThreshold = Math.min(
        1000,
        Math.max(1, Math.floor(cpThreshold || 50)),
      );
      const safeDepth = Math.min(
        24,
        Math.max(6, Math.floor(engineDepth || 12)),
      );
      const safeSource: AnalysisSource = source!;
      const safeScanMode: ScanMode = FULL_SCAN_MODE;
      setLastRunConfig({
        maxGames: safeGames,
        maxMoves: safeMoves,
        cpThreshold: safeCpThreshold,
        engineDepth: safeDepth,
        source: safeSource,
        scanMode: safeScanMode,
        speed,
      });

      setIsLaunchingScan(true);
      setState("idle");
      setError("");
      setNotice(
        authenticated
          ? "Checking your latest saved scan before opening a dedicated report page."
          : "Opening your dedicated scan page. Results will stream in there as each section finishes.",
      );
      setSaveStatus("idle");

      const scanConfig = {
        maxGames: safeGames,
        maxMoves: safeMoves,
        cpThreshold: safeCpThreshold,
        engineDepth: safeDepth,
        source: safeSource,
        scanMode: safeScanMode,
        speed,
        since: safeSince ?? null,
        until: safeUntil ?? null,
        maxTactics: null,
        maxEndgames: null,
        ...(safeSource === "pgn" ? { pgnText: pgnText.trim() } : {}),
      };

      const reuseSignature = authenticated
        ? await buildScanReuseSignatureInBrowser(trimmed, {
            maxGames: safeGames,
            maxOpeningMoves: safeMoves,
            cpLossThreshold: safeCpThreshold,
            engineDepth: safeDepth,
            source: safeSource,
            scanMode: safeScanMode,
            timeControl: speed,
            since: safeSince,
            until: safeUntil,
            ...(safeSource === "pgn" ? { pgnText: pgnText.trim() } : {}),
          })
        : null;

      const sessionRes = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chessUsername: trimmed,
          config: scanConfig,
          reuseSignature,
        }),
      });

      const sessionJson = (await sessionRes.json()) as {
        id?: string;
        guestToken?: string | null;
        reused?: boolean;
        error?: string;
      };

      if (!sessionRes.ok || !sessionJson.id) {
        throw new Error(sessionJson.error || "Could not create report page.");
      }

      if (sessionJson.guestToken) {
        try {
          window.localStorage.setItem(
            scanOwnerStorageKey(sessionJson.id),
            sessionJson.guestToken,
          );
        } catch {
          // Ignore storage failures; the public page still works.
        }
      }

      if (sessionJson.reused) {
        setNotice(
          "Reusing your latest saved report because the downloaded games and settings are unchanged.",
        );
      }

      router.push(`/report/${sessionJson.id}`);
    } catch (err) {
      setIsLaunchingScan(false);
      const message = err instanceof Error ? err.message : "Unexpected error";
      if (
        /cannot reach lichess\.org|timed out|fetch failed|network/i.test(
          message,
        )
      ) {
        setError(
          "Neither your server nor browser can reach lichess.org right now (network timeout/block). Try disabling VPN/proxy, switching network, or retrying later.",
        );
      } else {
        setError(message);
      }
      setNotice("");
      setState("error");
    }
  };

  /** Legacy reruns collapse back into the full scan. */
  return (
    <div className="relative min-h-screen">
      <div className="relative z-10 px-4 py-10 sm:px-6 md:px-10">
        <section className="mx-auto w-full max-w-7xl space-y-20 sm:space-y-24 lg:space-y-28">
          {/* ─── Hero Section ─── */}
          <HeroSection
            siteStats={siteStats as HeroSiteStats}
            onScanClick={scrollToAnalyzer}
            onSeeSampleClick={scrollToSampleReports}
          />

          {/*
            Social-proof strip removed: its trust signals (Stockfish 18,
            free-forever, platform coverage) now live in the redesigned hero,
            so a separate band here only added consecutive-row clutter.
          */}

          <section
            id="analyzer"
            className="animate-fade-in-up grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)]"
          >
            <form
              onSubmit={onSubmit}
              className="relative overflow-hidden rounded-[1.9rem] px-5 py-5 shadow-[0_28px_90px_-52px_rgba(37,12,7,0.98)] sm:px-6 sm:py-6"
              style={{
                background:
                  "linear-gradient(160deg, rgba(11, 9, 12, 0.97) 0%, rgba(18, 12, 15, 0.96) 58%, rgba(41, 21, 13, 0.94) 100%)",
              }}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-200/35 to-transparent" />

              <div className="relative flex flex-col gap-1">
                <h2 className="text-xl font-bold text-white">
                  Scan your recent games
                </h2>
                <p className="max-w-xl text-sm leading-relaxed text-slate-400">
                  Pick a platform, enter your username, and get a full report in
                  seconds.
                </p>
              </div>

              <div className="relative mt-6 flex flex-col gap-4">
                <div
                  className={`flex flex-1 items-center overflow-hidden rounded-2xl border bg-white/[0.04] transition-colors duration-200 focus-within:border-orange-400/35 ${
                    !source
                      ? "border-orange-400/30 ring-1 ring-orange-400/15"
                      : "border-orange-500/10"
                  }`}
                >
                  <div className="flex shrink-0 items-center gap-0.5 px-2 py-2">
                    <button
                      type="button"
                      onClick={() => setSource("lichess")}
                      className={`rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                        source === "lichess"
                          ? "bg-gradient-to-r from-amber-200 to-orange-300 text-slate-950 shadow-[0_14px_30px_-18px_rgba(251,146,60,0.78)]"
                          : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
                      }`}
                    >
                      Lichess
                    </button>
                    <button
                      type="button"
                      onClick={() => setSource("chesscom")}
                      className={`rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                        source === "chesscom"
                          ? "bg-gradient-to-r from-amber-200 to-orange-300 text-slate-950 shadow-[0_14px_30px_-18px_rgba(251,146,60,0.78)]"
                          : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
                      }`}
                    >
                      Chess.com
                    </button>
                    <button
                      type="button"
                      onClick={() => setSource("pgn")}
                      className={`rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                        source === "pgn"
                          ? "bg-gradient-to-r from-amber-200 to-orange-300 text-slate-950 shadow-[0_14px_30px_-18px_rgba(251,146,60,0.78)]"
                          : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
                      }`}
                    >
                      Paste PGN
                    </button>
                  </div>
                  <div className="h-6 w-px shrink-0 bg-white/[0.10]" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={
                      source === "chesscom"
                        ? "Your Chess.com username"
                        : source === "lichess"
                          ? "Your Lichess username"
                          : source === "pgn"
                            ? "Your name (as it appears in the PGN)"
                            : "Pick a platform, then enter username"
                    }
                    aria-label={
                      source === "pgn" ? "Your name" : "Chess username"
                    }
                    className="flex-1 bg-transparent py-4 pl-4 pr-4 text-base text-white outline-none placeholder:text-slate-500"
                  />
                </div>

                {source === "pgn" && (
                  <div className="rounded-2xl border border-orange-500/10 bg-white/[0.04] p-3">
                    <textarea
                      value={pgnText}
                      onChange={(e) => setPgnText(e.target.value)}
                      placeholder={
                        "Paste one or more PGN games here (e.g. from your OTB app or DGT board).\nClocks and ratings are picked up automatically if present."
                      }
                      aria-label="PGN games"
                      spellCheck={false}
                      className="h-40 w-full resize-y rounded-xl bg-black/30 p-3 font-mono text-xs leading-relaxed text-white outline-none placeholder:text-slate-500"
                    />
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/[0.10]">
                        <svg
                          className="h-3.5 w-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Upload .pgn file
                        <input
                          type="file"
                          accept=".pgn,.txt"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                              const text =
                                typeof reader.result === "string"
                                  ? reader.result
                                  : "";
                              setPgnText(text);
                            };
                            reader.readAsText(file);
                          }}
                        />
                      </label>
                      <span className="text-[11px] text-slate-500">
                        Up to 250 games · 2 MB
                      </span>
                    </div>
                  </div>
                )}

                <div
                  className="rounded-[1.45rem] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                  style={{
                    background:
                      "linear-gradient(140deg, rgba(78, 34, 15, 0.22) 0%, rgba(37, 20, 16, 0.7) 58%, rgba(18, 12, 16, 0.92) 100%)",
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-100/80">
                      Full Scan
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {["openings", "tactics", "endgames", "time"].map(
                        (item) => (
                          <span
                            key={item}
                            className="rounded-full bg-orange-300/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-100/80"
                          >
                            {item}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300/80">
                    One report across{" "}
                    <span className="text-white">openings</span>,{" "}
                    <span className="text-white">tactics</span>,{" "}
                    <span className="text-white">endgames</span>, and{" "}
                    <span className="text-white">time</span>.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <button
                    type="submit"
                    disabled={
                      state === "loading" ||
                      isLaunchingScan ||
                      freeLimitsExceeded
                    }
                    className="btn-primary btn-cta-fire flex flex-1 items-center justify-center gap-2 text-white disabled:animate-none"
                  >
                    {state === "loading" || isLaunchingScan ? (
                      <>
                        <svg
                          className="h-4 w-4 animate-spin"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        {isLaunchingScan ? "Opening report..." : "Scanning..."}
                      </>
                    ) : freeLimitsExceeded ? (
                      "Upgrade for Pro limits"
                    ) : (
                      <>
                        Analyze Your Games
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdvancedSettingsOpen(true)}
                    className="inline-flex items-center justify-center gap-2 text-sm font-medium text-orange-100/70 transition-colors hover:text-orange-50 sm:justify-end"
                  >
                    Advanced settings
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.75}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </form>

            <div>
              <div
                className="relative overflow-hidden rounded-[1.9rem] px-5 py-5 shadow-[0_28px_90px_-52px_rgba(37,12,7,0.98)]"
                style={{
                  background:
                    "linear-gradient(160deg, rgba(11, 9, 12, 0.97) 0%, rgba(18, 12, 15, 0.96) 58%, rgba(41, 21, 13, 0.94) 100%)",
                }}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-200/25 to-transparent" />
                <h3 className="text-base font-semibold uppercase tracking-[0.18em] text-orange-100/60">
                  What you get
                </h3>
                <div className="mt-5 space-y-3">
                  {[
                    {
                      icon: Zap,
                      color: "from-amber-400/20 to-orange-500/10",
                      iconColor: "text-amber-400",
                      title: "Missed tactics",
                      text: "Short, forcing positions bubble to the top first.",
                    },
                    {
                      icon: Swords,
                      color: "from-orange-400/20 to-red-500/10",
                      iconColor: "text-orange-400",
                      title: "Opening leaks",
                      text: "Repeated positions get grouped into clearer priorities.",
                    },
                    {
                      icon: FileText,
                      color: "from-red-400/15 to-pink-500/10",
                      iconColor: "text-red-400",
                      title: "Canonical report",
                      text: "Each full scan opens on its own dedicated report page.",
                    },
                    {
                      icon: Gem,
                      color: "from-yellow-400/15 to-amber-500/10",
                      iconColor: "text-yellow-300",
                      title: "Brilliant moves",
                      text: "Exceptional plays detected and highlighted in your report.",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="group flex gap-3 rounded-xl border border-white/[0.04] p-3 transition-colors hover:border-white/[0.08] hover:bg-white/[0.02]"
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${item.color} ${item.iconColor}`}
                      >
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-sm leading-relaxed text-slate-400">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ─── How it works (placed below the scan tool so the primary
              action sits directly under the hero) ─── */}
          {state === "idle" && <HowItWorks />}

          {/* ─── Sample reports ─── */}
          {state === "idle" && (
            <div id="sample-reports" className="scroll-mt-24">
              <SampleReportsSection />
            </div>
          )}

          {/* ─── Lead capture (free weekly leak report) ─── */}
          {state === "idle" && <EmailCapture />}

          {/* ─── Discord community ─── */}
          {state === "idle" && <DiscordCta />}



          {/* ─── Final CTA ─── */}
          {state === "idle" && (
            <section className="animate-fade-in mx-auto w-full max-w-5xl">
              <div
                className="relative overflow-hidden rounded-[2rem] px-6 py-10 text-center shadow-[0_0_80px_-20px_rgba(249,115,22,0.18)] sm:px-10 sm:py-12"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(30,14,6,0.97) 0%, rgba(51,22,8,0.96) 42%, rgba(72,18,8,0.95) 75%, rgba(30,8,14,0.97) 100%)",
                }}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-300/40 to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-red-400/20 to-transparent" />
                <div className="pointer-events-none absolute left-[10%] top-[-20%] h-64 w-64 rounded-full bg-orange-500/[0.07] blur-3xl" />
                <div className="pointer-events-none absolute bottom-[-20%] right-[12%] h-56 w-56 rounded-full bg-red-600/[0.06] blur-3xl" />

                <div className="relative mx-auto max-w-2xl">
                  <span className="inline-flex rounded-full bg-orange-400/[0.1] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.32em] text-orange-200/70">
                    Free · No credit card
                  </span>
                  <h2 className="mt-4 bg-gradient-to-r from-amber-200 via-orange-300 to-red-400 bg-clip-text text-3xl font-black leading-tight tracking-tight text-transparent sm:text-4xl">
                    Get your free chess analysis report
                  </h2>
                  <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-slate-300/80">
                    Enter your Lichess or Chess.com username and discover
                    exactly where your rating is leaking — openings, tactics,
                    endgames, and time management in one clean report.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      document.getElementById("analyzer")?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      })
                    }
                    className="btn-cta-fire mt-6 inline-flex h-12 items-center gap-2 rounded-xl px-8 text-base font-bold text-white"
                  >
                    Analyze my games — it&apos;s free
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-t border-white/[0.07] pt-5 text-sm font-semibold text-slate-400">
                    {[
                      { href: "/board", label: "Open Workbench" },
                      { href: "/train", label: "Go to Training" },
                      { href: "/community", label: "Explore Community" },
                    ].map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="inline-flex items-center gap-1.5 transition-colors hover:text-white"
                      >
                        {link.label}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ─── Blog Section ─── */}
          {state === "idle" && <HomepageBlogSection />}

          {/* ─── More to explore (secondary modes) ─── */}
          {state === "idle" && (
            <section className="animate-fade-in mx-auto w-full max-w-5xl">
              <div className="relative overflow-hidden rounded-[1.85rem] border border-white/[0.08] bg-[linear-gradient(160deg,rgba(8,12,24,0.76),rgba(20,14,26,0.62)_54%,rgba(32,18,12,0.66))] px-5 py-5 shadow-[0_24px_90px_-60px_rgba(0,0,0,0.9)] sm:px-6 sm:py-6">
                <div className="pointer-events-none absolute left-[8%] top-0 h-24 w-24 rounded-full bg-sky-400/[0.06] blur-3xl" />
                <div className="pointer-events-none absolute bottom-0 right-[10%] h-24 w-24 rounded-full bg-orange-400/[0.06] blur-3xl" />

                <div className="relative grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
                  <div className="max-w-xl">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                      More to explore
                    </p>
                    <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
                      A few strong side modes beyond the main scan flow.
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400 sm:text-[0.95rem]">
                      The homepage stays centered on reports, but these are some
                      of the most promising detours once you want something more
                      playful, sharper, or more specialized.
                    </p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      {
                        href: "/chaos",
                        icon: Zap,
                        title: "Chaos Chess",
                        desc: "Variant energy and unpredictable positions.",
                        accent:
                          "bg-purple-500/[0.12] text-purple-200 group-hover:bg-purple-500/[0.18]",
                      },
                      {
                        href: "/sparring",
                        icon: Swords,
                        title: "Opening Sparring",
                        desc: "Rehearse critical lines instead of guessing.",
                        accent:
                          "bg-sky-500/[0.12] text-sky-200 group-hover:bg-sky-500/[0.18]",
                      },
                      {
                        href: "/dungeon",
                        icon: Skull,
                        title: "Dungeon Tactics",
                        desc: "A more gamified way to grind calculation.",
                        accent:
                          "bg-red-500/[0.12] text-red-200 group-hover:bg-red-500/[0.18]",
                      },
                      {
                        href: "/roast",
                        icon: Flame,
                        title: "Roast the Elo",
                        desc: "A harsher, more entertaining feedback lane.",
                        accent:
                          "bg-orange-500/[0.12] text-orange-200 group-hover:bg-orange-500/[0.18]",
                      },
                    ].map((item) => (
                      <Link
                        key={item.title}
                        href={item.href}
                        className="group flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3.5 transition hover:border-white/[0.1] hover:bg-white/[0.05]"
                      >
                        <span
                          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors ${item.accent}`}
                        >
                          <item.icon className="h-[18px] w-[18px]" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="text-sm font-semibold text-white transition-colors group-hover:text-slate-100">
                              {item.title}
                            </h3>
                            <span className="text-xs font-semibold text-white/40 transition-colors group-hover:text-white/70">
                              Open
                            </span>
                          </div>
                          <p className="mt-1 text-sm leading-relaxed text-slate-400">
                            {item.desc}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ─── Notice ─── */}
          {notice && state !== "loading" && (
            <div className="glass-card animate-fade-in border-amber-500/20 p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                  <Zap className="h-4 w-4" />
                </span>
                <p className="text-sm text-amber-200">{notice}</p>
              </div>
            </div>
          )}

          {/* ─── Error ─── */}
          {state === "error" && (
            <div className="glass-card animate-scale-in border-red-500/20 p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
                  ✕
                </span>
                <p className="text-sm text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* ─── Toast ─── */}
          {toast && (
            <div className="fixed bottom-6 left-1/2 z-[9999] -translate-x-1/2 animate-fade-in">
              <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-slate-900/95 px-5 py-3 shadow-2xl backdrop-blur-sm">
                <span className="text-sm font-medium text-emerald-300">
                  {toast}
                </span>
                <button
                  type="button"
                  onClick={() => setToast(null)}
                  className="ml-1 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label="Close notification"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* ─── Daily Login Popup ─── */}
          {state !== "loading" && authenticated && <DailyLoginPopup />}

          {/* ─── Pro/Lifetime welcome modal (shown once after upgrade or for existing members) ─── */}
          <ProWelcomeModal />

          {/* ─── Admin Debug Widget ─── */}
          <AdminDebug />

        </section>
      </div>

      {/*
        ─── Social proof: real Reddit comments ───
        Genuine, verbatim comments from the r/chessbeginners launch thread,
        attributed to the real usernames + rating flairs and linked to the
        source so they're verifiable. Capitalization lightly normalized;
        wording unchanged. If a commenter ever asks to be removed, drop their
        card. (This replaced an earlier set of fabricated testimonials.)
      */}
      <section className="border-t border-white/[0.06] py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold text-white md:text-4xl">
              What players said on Reddit
            </h2>
            <p className="mt-4 text-base text-slate-400">
              Real, unedited comments from the{" "}
              <a
                href={REDDIT_THREAD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-orange-300 underline-offset-2 hover:underline"
              >
                r/chessbeginners launch thread
              </a>
              .
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              {
                initial: "N",
                user: "No-Sky2462",
                flair: "1200–1400 · Lichess",
                quote:
                  "I absolutely love this! If I had the money I would definitely support you.",
              },
              {
                initial: "C",
                user: "cooolcooolio",
                flair: "1000–1200 · Chess.com",
                quote: "That's a great tool.",
              },
              {
                initial: "R",
                user: "raineling",
                flair: "200–400 · Chess.com",
                quote:
                  "Honestly, quite an impressive application. I wish I had your skills.",
              },
            ].map((t) => (
              <figure
                key={t.user}
                className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6"
              >
                <blockquote className="text-base leading-relaxed text-slate-200">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-sm font-bold text-orange-200">
                    {t.initial}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-white">
                      u/{t.user}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {t.flair}
                    </span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>

          <p className="mt-10 text-center text-xs text-slate-500">
            Real users, quoted with their Reddit usernames —{" "}
            <a
              href={REDDIT_THREAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 underline-offset-2 hover:text-slate-200 hover:underline"
            >
              read them in context
            </a>
            .
          </p>
        </div>
      </section>

    </div>
  );
}
