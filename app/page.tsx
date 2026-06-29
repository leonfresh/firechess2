"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Castle,
  CheckCircle2,
  FileText,
  Flame,
  Gem,
  Globe,
  GraduationCap,
  Skull,
  Swords,
  Zap,
} from "lucide-react";
import { DrillMode } from "@/components/drill-mode";
import {
  HeroSection,
  type SiteStats as HeroSiteStats,
} from "@/components/home/hero-section";
import { GuidedWalk } from "@/components/guided-walk/guided-walk";
import { ReportViewToggle } from "@/components/guided-walk/report-view-toggle";
import dynamic from "next/dynamic";

// Below-the-fold homepage sections are code-split to keep the 8k-line page's
// initial JS bundle lean. They only render when no scan is in flight, so
// deferring them is safe and improves LCP / INP on mobile.
const HowItWorks = dynamic(
  () => import("@/components/home/how-it-works").then((m) => m.HowItWorks),
  { ssr: true },
);
const EmailCapture = dynamic(
  () => import("@/components/home/email-capture").then((m) => m.EmailCapture),
  { ssr: true },
);
import { MistakeCard } from "@/components/mistake-card";
import { TacticCard } from "@/components/tactic-card";
import { EndgameCard } from "@/components/endgame-card";
import { TimeCard } from "@/components/time-card";
import { DailyLoginPopup } from "@/components/daily-login-rewards";
import { ProWelcomeModal } from "@/components/lifetime-welcome";
import { AdminDebug } from "@/components/admin-debug";
import { SampleReportsSection } from "@/components/sample-reports-section";
import { HomepageBlogSection } from "@/components/homepage-blog-section";
import { DiscordCta } from "@/components/home/discord-cta";
import { CardCarousel, ViewModeToggle } from "@/components/card-carousel";
import type { CardViewMode } from "@/components/card-carousel";
import { useSession } from "@/components/session-provider";
import { OpeningRankings } from "@/components/opening-rankings";
import {
  StrengthsRadar,
  RadarLegend,
  InsightCards,
  computeRadarData,
} from "@/components/radar-chart";
import {
  analyzeOpeningLeaksInBrowser,
  buildScanReuseSignatureInBrowser,
  splitMultiPgn,
} from "@/lib/client-analysis";
import type { AnalysisProgress } from "@/lib/client-analysis";
import type {
  AnalysisSource,
  ScanMode,
  TimeControl,
} from "@/lib/client-analysis";
import type { AnalyzeResponse, RepeatedOpeningLeak } from "@/lib/types";
import { fetchExplorerMoves } from "@/lib/lichess-explorer";
import { shareReportCard } from "@/lib/share-report";
import { earnCoins, spendCoins, hasPurchased, getBalance } from "@/lib/coins";
import { POSITIONAL_PATTERNS } from "@/lib/positional-quotes";
import {
  explainOpeningLeak,
  describeEndPosition,
  type PositionExplanation,
} from "@/lib/position-explainer";
import { ExplanationModal } from "@/components/explanation-modal";
import { stockfishClient } from "@/lib/stockfish-client";
import { PersonalizedPuzzles } from "@/components/personalized-puzzles";
import { PositionalMotifTrainer } from "@/components/positional-motif-trainer";
import { Chessboard, type CbSquare } from "@/components/chessboard-compat";
import { Chess, type PieceSymbol } from "chess.js";
import { useBoardTheme, useCustomPieces } from "@/lib/use-coins";
import { DEFAULT_LAUNCHER, type LauncherConfig } from "@/lib/launcher-apps";
import { LauncherEditor } from "@/components/launcher-editor";
import {
  buildReportContentHash,
  computeScanReportMeta,
  scanOwnerStorageKey,
  type PublicScanSessionPayload,
} from "@/lib/scan-session";
import { ScanSessionReport } from "@/components/scan-session-report";
import { isMissedMateTactic } from "@/lib/tactic-utils";

function HelpTip({ text }: { text: string }) {
  return (
    <span className="group relative ml-1 inline-flex">
      <span className="flex h-[15px] w-[15px] cursor-help items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-[9px] font-bold leading-none text-slate-500 transition-colors group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10 group-hover:text-emerald-400">
        ?
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-[9999] mb-2 w-48 -translate-x-1/2 rounded-lg border border-white/[0.08] bg-slate-900/95 px-3 py-2 text-[11px] font-normal normal-case leading-snug tracking-normal text-slate-300 opacity-0 shadow-xl backdrop-blur-sm transition-opacity group-hover:opacity-100">
        {text}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-900/95" />
      </span>
    </span>
  );
}

type RequestState = "idle" | "loading" | "done" | "error";
const PREFS_KEY = "firechess-user-prefs";
const REPORT_CACHE_KEY_PREFIX = "fc-last-report";
const FULL_SCAN_MODE: ScanMode = "both";

type CachedReportEntry = {
  result: AnalyzeResponse;
  config: {
    maxGames: number;
    maxMoves: number;
    cpThreshold: number;
    engineDepth: number;
    source: AnalysisSource;
    scanMode: ScanMode;
    speed: TimeControl[];
  };
  savedAt: string;
  reportPath?: string;
};

function reportCacheKey(mode: ScanMode): string {
  return `${REPORT_CACHE_KEY_PREFIX}-${mode}`;
}

const FREE_MAX_GAMES = 300;
const FREE_MAX_DEPTH = 12;
const FREE_MAX_MOVES = 30;
/** Hard limits for the pasted-PGN source (kept in sync with the server). */
const PGN_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const PGN_MAX_GAMES = 250;
const FREE_TACTIC_SAMPLE = 10;
const FREE_ENDGAME_SAMPLE = 10;
const FREE_TIME_MANAGEMENT_SAMPLE = 10;
const FREE_POSITIONAL_SAMPLE = 3;
const LOCAL_PRO_HOTKEY_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_LOCAL_PRO_HOTKEY !== "false";
const IS_DEV = process.env.NODE_ENV !== "production";

function AnalysisSectionSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-4 animate-pulse py-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
        >
          <div className="flex gap-4">
            <div className="h-16 w-16 rounded-xl bg-white/[0.08] shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3.5 w-3/4 rounded bg-white/[0.08]" />
              <div className="h-3 w-1/2 rounded bg-white/[0.06]" />
              <div className="h-3 w-2/3 rounded bg-white/[0.06]" />
            </div>
          </div>
        </div>
      ))}
      <p className="text-center text-xs text-slate-500">{label}</p>
    </div>
  );
}

export default function HomePage() {
  const {
    plan: sessionPlan,
    authenticated,
    user,
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

  const [heroPhase, setHeroPhase] = useState<"idle" | "hiding" | "revealing">(
    "idle",
  );
  const heroTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  const [lastRunConfig, setLastRunConfig] = useState<{
    maxGames: number;
    maxMoves: number;
    cpThreshold: number;
    engineDepth: number;
    source: AnalysisSource;
    scanMode: ScanMode;
    speed: TimeControl[];
  } | null>(null);
  const [state, setState] = useState<RequestState>("idle");
  // Report view: "full" (the complete scrollable report, default) or "guided"
  // (Brilliant-style walkthrough). The sticky toggle switches between them.
  const [viewMode, setViewMode] = useState<"guided" | "full">("full");
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
  const [progressInfo, setProgressInfo] = useState<{
    message: string;
    detail?: string;
    percent: number;
    phase: string;
  }>({ message: "", percent: 0, phase: "" });
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [localProEnabled, setLocalProEnabled] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "duplicate" | "error"
  >("idle");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [welcomeBack, setWelcomeBack] = useState<string | null>(null);
  const [cachedReportEntry, setCachedReportEntry] =
    useState<CachedReportEntry | null>(null);
  const [copyLinkLabel, setCopyLinkLabel] = useState("Copy Link");
  const [activeReportPath, setActiveReportPath] = useState<string | null>(null);
  const [showRestoreBanner, setShowRestoreBanner] = useState(false);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const [leakTab, setLeakTab] = useState<"repeated" | "one-off">("repeated");
  const [openingFolder, setOpeningFolder] = useState<"mistakes" | "rankings">(
    "mistakes",
  );
  const [tacticsOpen, setTacticsOpen] = useState(true);
  const [patternsOpen, setPatternsOpen] = useState(true);
  const [endgamesOpen, setEndgamesOpen] = useState(true);
  const [puzzleBoardOpen, setPuzzleBoardOpen] = useState(false);
  const [timeManagementOpen, setTimeManagementOpen] = useState(true);
  const [sectionsDone, setSectionsDone] = useState<Set<string>>(new Set());
  const [timeVerdictTab, setTimeVerdictTab] = useState<
    "all" | "wasted" | "rushed" | "justified"
  >("all");
  const [expandedMotifs, setExpandedMotifs] = useState<Set<string>>(new Set());
  const [posExplainModalOpen, setPosExplainModalOpen] = useState(false);
  const [posExplainRich, setPosExplainRich] =
    useState<PositionExplanation | null>(null);
  const [posExplainAnimUci, setPosExplainAnimUci] = useState<string[]>([]);
  const [posExplainAltUci, setPosExplainAltUci] = useState<string[]>([]);
  const [posExplainAltLabel, setPosExplainAltLabel] = useState<
    string | undefined
  >();
  const [posExplainFen, setPosExplainFen] = useState("");
  const [posExplainOrientation, setPosExplainOrientation] = useState<
    "white" | "black"
  >("white");
  const [posExplainTitle, setPosExplainTitle] = useState("");
  const [posExplainSubtitle, setPosExplainSubtitle] = useState<
    string | undefined
  >();
  const [posExplaining, setPosExplaining] = useState<string | null>(null);
  const [timeUnlocked, setTimeUnlocked] = useState(false);
  const reportRef = useRef<HTMLElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const pngRef = useRef<HTMLDivElement>(null);
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();

  const [launcherConfig, setLauncherConfig] =
    useState<LauncherConfig>(DEFAULT_LAUNCHER);
  useEffect(() => {
    if (sessionLoading) return;

    if (!authenticated) {
      setLauncherConfig(DEFAULT_LAUNCHER);
      return;
    }

    let cancelled = false;

    fetch("/api/launcher")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data?.config) setLauncherConfig(data.config);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [authenticated, sessionLoading]);

  const saveLauncherConfig = useCallback(async (config: LauncherConfig) => {
    await fetch("/api/launcher", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setLauncherConfig(config);
  }, []);

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

  const heroAnim = (step: number) =>
    heroPhase === "hiding"
      ? "hero-hide"
      : heroPhase === "revealing"
        ? `hero-reveal-${step}`
        : "";

  const triggerHeroAnimation = useCallback(() => {
    if (heroTimerRef.current) clearTimeout(heroTimerRef.current);
    setHeroPhase("hiding");
    heroTimerRef.current = setTimeout(() => {
      setHeroPhase("revealing");
      heroTimerRef.current = setTimeout(() => setHeroPhase("idle"), 3000);
    }, 400);
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
        setWelcomeBack((parsed as any).username);
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

  /* ── Load cached report from localStorage (for unauthenticated users) ── */
  useEffect(() => {
    try {
      const modes: ScanMode[] = [
        "openings",
        "tactics",
        "endgames",
        "both",
        "time-management",
      ];
      // Find the most recently saved across all modes
      let newest: CachedReportEntry | null = null;
      for (const mode of modes) {
        const raw = window.localStorage.getItem(reportCacheKey(mode));
        if (!raw) continue;
        const parsed = JSON.parse(raw) as CachedReportEntry;
        if (!newest || new Date(parsed.savedAt) > new Date(newest.savedAt)) {
          newest = parsed;
        }
      }
      if (newest) {
        setCachedReportEntry(newest);
        setShowRestoreBanner(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  /* ── Fetch latest saved report leaks for personalized hero board ── */
  const [heroLeaks, setHeroLeaks] = useState<RepeatedOpeningLeak[]>([]);
  const [savedScanModes, setSavedScanModes] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!authenticated) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/reports");
        if (!res.ok) return;
        const json = await res.json();
        const allReports: Array<{ scanMode?: string; leaks?: unknown[] }> =
          json.reports ?? [];
        if (!cancelled) {
          const modes = new Set<string>();
          for (const r of allReports) {
            if (r.scanMode) modes.add(r.scanMode);
          }
          setSavedScanModes(modes);
          const latest = allReports[0];
          if (latest?.leaks?.length) {
            setHeroLeaks(latest.leaks as RepeatedOpeningLeak[]);
          }
        }
      } catch {
        /* silent */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authenticated]);

  const leaks = useMemo(() => result?.leaks ?? [], [result]);
  /** Leak count excluding DB-approved sidelines — used for radar/scoring so sidelines don't penalize */
  const realLeakCount = useMemo(
    () => leaks.filter((l) => !l.dbApproved).length,
    [leaks],
  );
  const missedTactics = useMemo(() => result?.missedTactics ?? [], [result]);
  const endgameMistakes = useMemo(
    () => result?.endgameMistakes ?? [],
    [result],
  );
  const oneOffMistakes = useMemo(() => result?.oneOffMistakes ?? [], [result]);
  const positionalFindings = useMemo(
    () => result?.positionalFindings ?? [],
    [result],
  );
  const endgameStats = useMemo(() => result?.endgameStats ?? null, [result]);
  const timeManagement = useMemo(
    () => result?.timeManagement ?? null,
    [result],
  );

  // Check if user has unlocked time management with coins
  useEffect(() => {
    if (typeof window !== "undefined") {
      setTimeUnlocked(hasPurchased("time-management-unlock"));
    }
  }, [result]);

  // DB-approved inaccuracy detection — exclude these FENs from drills
  const [dbApprovedFens, setDbApprovedFens] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (leaks.length === 0) {
      setDbApprovedFens(new Set());
      return;
    }
    const inaccuracyLeaks = leaks.filter((l) => l.cpLoss < 100);
    if (inaccuracyLeaks.length === 0) {
      setDbApprovedFens(new Set());
      return;
    }
    let cancelled = false;
    (async () => {
      const approved = new Set<string>();
      // Check explorer in parallel (batches of 4 to avoid rate limits)
      for (let i = 0; i < inaccuracyLeaks.length; i += 4) {
        const batch = inaccuracyLeaks.slice(i, i + 4);
        const results = await Promise.all(
          batch.map((l) =>
            fetchExplorerMoves(l.fenBefore, l.sideToMove).catch(() => null),
          ),
        );
        if (cancelled) return;
        results.forEach((res, idx) => {
          if (!res) return;
          const leak = batch[idx];
          const userMoveInDb = res.moves.find((m) => m.uci === leak.userMove);
          if (
            userMoveInDb &&
            userMoveInDb.totalGames >= 100 &&
            userMoveInDb.winRate >= 0.45
          ) {
            approved.add(leak.fenBefore);
          }
        });
      }
      if (!cancelled) setDbApprovedFens(approved);
    })();
    return () => {
      cancelled = true;
    };
  }, [leaks]);

  // Motif clustering — combine missed tactics, opening leaks, AND one-off mistakes
  const tacticMotifs = useMemo(() => {
    // Build a unified array of tagged positions from all sources
    type TaggedPosition = {
      tags: string[];
      cpLoss: number;
      fenBefore: string;
      userMove?: string;
      bestMove?: string | null;
      gameUrl?: string;
      /**
       * Eval from the USER's perspective AFTER their move (centipawns).
       * Positive = user is still winning. Used to skip "still crushing" positions.
       */
      evalAfterUser?: number;
    };

    // Threshold: if user is still winning by more than this after the blunder, skip it
    const STILL_WINNING_THRESHOLD = 350; // +3.5 pawns — clearly still winning

    const allPositions: TaggedPosition[] = [];

    for (const t of missedTactics) {
      // cpBefore and cpAfter are from side-to-move's perspective
      // evalAfterUser = what the user (side that moved) has after their move
      //   = negated cpAfter (since after the move it's opponent's turn)
      const evalAfterUser = -t.cpAfter;
      allPositions.push({
        tags: t.tags,
        cpLoss: t.cpLoss,
        fenBefore: t.fenBefore,
        userMove: t.userMove,
        bestMove: t.bestMove,
        evalAfterUser,
      });
    }
    for (const l of leaks) {
      if (l.tags?.length) {
        // evalAfter is from the side-to-move's perspective after the move (opponent's perspective)
        // evalAfterUser (original mover) = -evalAfter
        const evalAfterUser =
          typeof l.evalAfter === "number" ? -l.evalAfter : undefined;
        allPositions.push({
          tags: l.tags,
          cpLoss: l.cpLoss,
          fenBefore: l.fenBefore,
          userMove: l.userMove,
          bestMove: l.bestMove,
          evalAfterUser,
        });
      }
    }
    for (const o of oneOffMistakes) {
      if (o.tags?.length) {
        const evalAfterUser =
          typeof o.evalAfter === "number" ? -o.evalAfter : undefined;
        allPositions.push({
          tags: o.tags,
          cpLoss: o.cpLoss,
          fenBefore: o.fenBefore,
          userMove: o.userMove,
          bestMove: o.bestMove,
          evalAfterUser,
        });
      }
    }
    for (const pf of positionalFindings) {
      if (pf.tags?.length) {
        allPositions.push({
          tags: pf.tags,
          cpLoss: pf.cpLoss,
          fenBefore: pf.fenBefore,
          userMove: pf.userMove,
          bestMove: pf.bestMove,
          // PositionalFinding has no eval data; can't filter by winning margin
        });
      }
    }

    if (allPositions.length === 0) return [];

    // Positional pattern tags that should surface even with 1 occurrence
    const positionalTags = new Set([
      "Unnecessary Capture",
      "Premature Trade",
      "Released Tension",
      "Passive Retreat",
      "Trading Advantage",
      "Greedy Pawn Grab",
      "Premature Pawn Break",
      "Weakened Pawn Structure",
      "Wrong Recapture",
      "Missed Development",
      "Piece Activity",
      "King Exposure",
      "Hanging Piece",
    ]);

    // Define motif categories with matching logic
    const motifDefs: {
      name: string;
      icon: string;
      positional?: boolean;
      match: (t: TaggedPosition) => boolean;
    }[] = [
      {
        name: "Hanging Pieces",
        icon: "💀",
        positional: true,
        match: (t) => t.tags.includes("Hanging Piece"),
      },
      {
        name: "Missed Mate",
        icon: "👑",
        match: (t) => t.tags.includes("Missed Mate"),
      },
      {
        name: "Missed Check",
        icon: "⚡",
        match: (t) => t.tags.includes("Missed Check"),
      },
      {
        name: "Missed Capture",
        icon: "🗡️",
        match: (t) =>
          t.tags.includes("Missed Capture") ||
          t.tags.includes("Forcing Capture"),
      },
      {
        name: "Back Rank Threats",
        icon: "🏰",
        match: (t) => t.tags.includes("Back Rank"),
      },
      {
        name: "Knight Tactics",
        icon: "♞",
        match: (t) => t.tags.includes("Knight Fork?"),
      },
      {
        name: "Queen Tactics",
        icon: "♛",
        match: (t) => t.tags.includes("Queen Tactic"),
      },
      {
        name: "Converting Advantage",
        icon: "📈",
        match: (t) => t.tags.includes("Converting Advantage"),
      },
      {
        name: "Equal Position Misses",
        icon: "⚖️",
        match: (t) => t.tags.includes("Equal Position"),
      },
      {
        name: "Unnecessary Captures",
        icon: "🚫",
        positional: true,
        match: (t) => t.tags.includes("Unnecessary Capture"),
      },
      {
        name: "Premature Trades",
        icon: "🤝",
        positional: true,
        match: (t) => t.tags.includes("Premature Trade"),
      },
      {
        name: "Released Tension",
        icon: "💨",
        positional: true,
        match: (t) => t.tags.includes("Released Tension"),
      },
      {
        name: "Passive Retreats",
        icon: "🐢",
        positional: true,
        match: (t) => t.tags.includes("Passive Retreat"),
      },
      {
        name: "Trading Advantage",
        icon: "📉",
        positional: true,
        match: (t) => t.tags.includes("Trading Advantage"),
      },
      {
        name: "Greedy Pawn Grabs",
        icon: "🍕",
        positional: true,
        match: (t) => t.tags.includes("Greedy Pawn Grab"),
      },
      {
        name: "Weakened Pawn Structure",
        icon: "🏚️",
        positional: true,
        match: (t) => t.tags.includes("Weakened Pawn Structure"),
      },
      {
        name: "Wrong Recaptures",
        icon: "↩️",
        positional: true,
        match: (t) => t.tags.includes("Wrong Recapture"),
      },
      {
        name: "Missed Development",
        icon: "🐌",
        positional: true,
        match: (t) => t.tags.includes("Missed Development"),
      },
      {
        name: "King Exposure",
        icon: "👑",
        positional: true,
        match: (t) => t.tags.includes("King Exposure"),
      },
      {
        name: "Piece Activity",
        icon: "📊",
        positional: true,
        match: (t) => t.tags.includes("Piece Activity"),
      },
      {
        name: "Premature Pawn Breaks",
        icon: "⚔️",
        positional: true,
        match: (t) => t.tags.includes("Premature Pawn Break"),
      },
      {
        name: "General Inaccuracy",
        icon: "⚠️",
        positional: true,
        match: (t) => t.tags.includes("Inaccuracy"),
      },
      {
        name: "Neglected Castling",
        icon: "🏰",
        positional: true,
        match: (t) => t.tags.includes("Neglected Castling"),
      },
      {
        name: "Aimless Moves",
        icon: "🌀",
        positional: true,
        match: (t) => t.tags.includes("Aimless Move"),
      },
      {
        name: "Overextended Pawns",
        icon: "📏",
        positional: true,
        match: (t) => t.tags.includes("Overextended Pawn"),
      },
      {
        name: "Center Neglect",
        icon: "🎯",
        positional: true,
        match: (t) => t.tags.includes("Center Neglect"),
      },
    ];

    const groups: {
      name: string;
      icon: string;
      count: number;
      avgCpLoss: number;
      tactics: typeof missedTactics;
      examples: TaggedPosition[];
    }[] = [];

    for (const def of motifDefs) {
      // Deduplicate by FEN so the same position from leaks+tactics isn't double-counted
      const seen = new Set<string>();
      const matching: TaggedPosition[] = [];
      for (const p of allPositions) {
        if (def.match(p) && !seen.has(p.fenBefore)) {
          // Skip positions where the user was still clearly winning after the mistake
          // (e.g., saccing a queen but still up a rook vs lone king — not worth drilling)
          if (
            typeof p.evalAfterUser === "number" &&
            p.evalAfterUser > STILL_WINNING_THRESHOLD
          ) {
            continue;
          }
          seen.add(p.fenBefore);
          matching.push(p);
        }
      }
      // Positional patterns show with 1+ occurrence, tactical patterns need 2+
      const minCount = def.positional ? 1 : 2;
      if (matching.length >= minCount) {
        const avgLoss =
          matching.reduce((sum, t) => sum + t.cpLoss, 0) / matching.length;
        // For the tactics array, only include actual MissedTactic objects (for card rendering)
        const tacticMatches = missedTactics.filter(def.match);
        groups.push({
          name: def.name,
          icon: def.icon,
          count: matching.length,
          avgCpLoss: avgLoss,
          tactics: tacticMatches,
          examples: matching.sort((a, b) => b.cpLoss - a.cpLoss).slice(0, 6),
        });
      }
    }

    return groups.sort((a, b) => b.avgCpLoss - a.avgCpLoss);
  }, [missedTactics, leaks, oneOffMistakes, positionalFindings]);

  // Separate tactical motifs (for Pattern Analysis) from positional motifs (for dedicated section)
  const POSITIONAL_MOTIF_NAMES = new Set([
    "Unnecessary Captures",
    "Premature Trades",
    "Released Tension",
    "Passive Retreats",
    "Trading Advantage",
    "Greedy Pawn Grabs",
    "Weakened Pawn Structure",
    "Wrong Recaptures",
    "Missed Development",
    "King Exposure",
    "Piece Activity",
    "Premature Pawn Breaks",
    "General Inaccuracy",
    "Neglected Castling",
    "Aimless Moves",
    "Overextended Pawns",
    "Center Neglect",
    "Hanging Pieces",
  ]);

  const tacticalMotifs = useMemo(
    () => tacticMotifs.filter((m) => !POSITIONAL_MOTIF_NAMES.has(m.name)),
    [tacticMotifs],
  );

  const positionalMotifs = useMemo(
    () => tacticMotifs.filter((m) => POSITIONAL_MOTIF_NAMES.has(m.name)),
    [tacticMotifs],
  );

  const diagnostics = result?.diagnostics;
  const report = useMemo(
    () =>
      computeScanReportMeta(result, lastRunConfig?.cpThreshold ?? cpThreshold),
    [cpThreshold, lastRunConfig?.cpThreshold, result],
  );

  // Adapts the instant in-browser scan into the shared report's payload shape
  // so the homepage renders the same <ScanSessionReport> as the /report/[id]
  // route instead of a duplicated inline report. Instant scans aren't
  // persisted, so id/timestamps are synthetic.
  const instantScanPayload = useMemo<PublicScanSessionPayload | null>(() => {
    if (!result) return null;
    const cfgSource: AnalysisSource =
      lastRunConfig?.source ?? source ?? "lichess";
    const cfgScanMode: ScanMode = lastRunConfig?.scanMode ?? scanMode;
    return {
      id: activeReportPath?.split("/").pop() ?? "instant",
      userId: null,
      chessUsername: username,
      source: cfgSource,
      scanMode: cfgScanMode,
      status: state === "loading" ? "processing" : "ready",
      config: {
        maxGames: lastRunConfig?.maxGames ?? gameCount,
        maxMoves: lastRunConfig?.maxMoves ?? moveCount,
        cpThreshold: lastRunConfig?.cpThreshold ?? cpThreshold,
        engineDepth: lastRunConfig?.engineDepth ?? engineDepth,
        source: cfgSource,
        scanMode: cfgScanMode,
        speed: lastRunConfig?.speed ?? speed,
        since: null,
        until: null,
        maxTactics: null,
        maxEndgames: null,
        ...(cfgSource === "pgn" ? { pgnText } : {}),
      },
      result,
      reportMeta: report,
      error: error || null,
      savedReportId: null,
      expiresAt: null,
      createdAt: null,
      updatedAt: null,
    };
  }, [
    result,
    lastRunConfig,
    source,
    scanMode,
    state,
    activeReportPath,
    username,
    gameCount,
    moveCount,
    cpThreshold,
    engineDepth,
    speed,
    pgnText,
    report,
    error,
  ]);
  const maxObservedCpLoss = useMemo(() => {
    const losses = diagnostics?.positionTraces
      .map((trace) => trace.cpLoss)
      .filter((value): value is number => typeof value === "number");

    if (!losses || losses.length === 0) return null;
    return Math.max(...losses);
  }, [diagnostics]);

  const activeReportUrl = useMemo(() => {
    if (!activeReportPath || typeof window === "undefined") return null;
    return new URL(activeReportPath, window.location.origin).toString();
  }, [activeReportPath]);

  const onBrowserProgress = (progress: AnalysisProgress) => {
    setProgressInfo({
      message: progress.message,
      detail: progress.detail,
      percent: progress.percent,
      phase: progress.phase,
    });
  };

  /** Save analysis report to the user's account (called explicitly via button). */
  const saveReportToAccount = useCallback(async () => {
    if (!result || !lastRunConfig) return;
    setSaveStatus("saving");
    try {
      let contentHash = result.scanSignature ?? null;
      if (!contentHash) {
        const hashInput = buildReportContentHash(
          result,
          lastRunConfig.source,
          lastRunConfig.scanMode,
        );
        const hashBuffer = await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(hashInput),
        );
        contentHash = Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      }

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chessUsername: result.username,
          source: lastRunConfig.source,
          scanMode: lastRunConfig.scanMode,
          gamesAnalyzed: result.gamesAnalyzed,
          maxGames: lastRunConfig.maxGames,
          maxMoves: lastRunConfig.maxMoves,
          cpThreshold: lastRunConfig.cpThreshold,
          engineDepth: lastRunConfig.engineDepth,
          // Use the client-side computed report values (same as displayed)
          estimatedAccuracy: report?.estimatedAccuracy ?? null,
          estimatedRating: report?.estimatedRating ?? null,
          weightedCpLoss: report?.weightedCpLoss ?? null,
          severeLeakRate: report?.severeLeakRate ?? null,
          repeatedPositions: result.repeatedPositions,
          leaks: result.leaks,
          oneOffMistakes: result.oneOffMistakes,
          missedTactics: result.missedTactics,
          diagnostics: result.diagnostics ?? null,
          mentalStats: result.mentalStats ?? null,
          timeManagement: result.timeManagement ?? null,
          playerRating: result.playerRating ?? null,
          reportMeta: report
            ? {
                consistencyScore: report.consistencyScore,
                p75CpLoss: report.p75CpLoss,
                confidence: report.confidence,
                topTag: report.topTag,
                vibeTitle: report.vibeTitle,
                sampleSize: report.sampleSize,
                endgameTechniqueScore: report.endgameTechniqueScore ?? null,
              }
            : null,
          contentHash,
        }),
      });
      const json = await res.json();
      if (json.saved || json.reason === "duplicate") {
        setSaveStatus(json.saved ? "saved" : "duplicate");
        // Award coins for saving a scan
        if (json.saved) {
          try {
            earnCoins("scan_complete");
          } catch {}
        }
        // Auto-generate a study plan (works for both new saves and duplicates)
        try {
          const planRes = await fetch("/api/study-plan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reportId: json.id,
              chessUsername: result.username,
              source: lastRunConfig.source,
              topLeakOpenings: [],
              accuracy: report?.estimatedAccuracy ?? 50,
              leakCount: result.leaks.length,
              repeatedPositions: result.repeatedPositions,
              tacticsCount: result.totalTacticsFound,
              gamesAnalyzed: result.gamesAnalyzed,
              weightedCpLoss: report?.weightedCpLoss ?? 0,
              severeLeakRate: report?.severeLeakRate ?? 0,
              estimatedRating: report?.estimatedRating ?? null,
              scanMode: lastRunConfig.scanMode,
            }),
          });
          if (!planRes.ok)
            console.warn("Study plan generation failed:", await planRes.text());
        } catch (e) {
          console.warn("Study plan generation error:", e);
        }
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    }
  }, [result, report, lastRunConfig]);

  const runBrowserAnalysis = async (
    trimmed: string,
    safeGames: number,
    safeMoves: number,
    safeCpThreshold: number,
    safeDepth: number,
    safeSource: AnalysisSource,
    reason?: string,
    scanModeOverride?: ScanMode,
    since?: number,
  ) => {
    if (reason) setNotice(reason);
    // Consolidated scans always run the full report so counts and ranking stay complete.
    const effectiveScanMode: ScanMode = FULL_SCAN_MODE;
    const effectiveMaxTactics = Infinity;
    const effectiveMaxEndgames = Infinity;

    const browserResult = await analyzeOpeningLeaksInBrowser(trimmed, {
      source: safeSource,
      scanMode: effectiveScanMode,
      timeControl: speed,
      maxGames: safeGames,
      maxOpeningMoves: safeMoves,
      cpLossThreshold: safeCpThreshold,
      engineDepth: safeDepth,
      maxTactics: effectiveMaxTactics,
      maxEndgames: effectiveMaxEndgames,
      since,
      onProgress: onBrowserProgress,
      onSectionReady: (section, partial) => {
        setResult((prev) => {
          const base: AnalyzeResponse = prev ?? {
            username: trimmed,
            gamesAnalyzed: 0,
            repeatedPositions: 0,
            leaks: [],
            oneOffMistakes: [],
            missedTactics: [],
            totalTacticsFound: 0,
            endgameMistakes: [],
            endgameStats: null,
          };
          return { ...base, ...partial };
        });
        setSectionsDone((prev) => {
          const isFirst = prev.size === 0;
          const next = new Set([...prev, section]);
          if (isFirst) {
            setTimeout(
              () =>
                reportRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                }),
              300,
            );
          }
          return next;
        });
      },
    });
    setResult(browserResult);
    setActiveReportPath(null);
    setState("done");
    // Fresh scan → land on the full report; guided is one tap away.
    setViewMode("full");

    // Cache report in localStorage for offline restore
    try {
      const cacheKey = reportCacheKey(effectiveScanMode);
      const entry: CachedReportEntry = {
        result: browserResult,
        config: {
          maxGames: safeGames,
          maxMoves: safeMoves,
          cpThreshold: safeCpThreshold,
          engineDepth: safeDepth,
          source: safeSource,
          scanMode: effectiveScanMode,
          speed,
        },
        savedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(cacheKey, JSON.stringify(entry));
    } catch {
      /* ignore storage failures */
    }

    // Toast + smooth scroll to report
    setToast("✅ Your report is ready!");
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
    setTimeout(() => {
      reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);
  };

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
  const quickScanMode = async (_mode: ScanMode) => {
    const trimmed = username.trim();
    if (!trimmed || !lastRunConfig) return;
    const mode = FULL_SCAN_MODE;
    setScanMode(mode);
    setLastRunConfig({
      ...lastRunConfig,
      scanMode: mode,
      speed: lastRunConfig.speed ?? speed,
    });
    setState("loading");
    setError("");
    setNotice("");
    setResult(null);
    setActiveReportPath(null);
    setSectionsDone(new Set());
    setSaveStatus("idle");
    setTimeout(
      () =>
        loadingRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      50,
    );
    setProgressInfo({
      message: "🔄 Refreshing full scan",
      detail: "Re-analyzing openings, tactics, endgames, and time together...",
      percent: 0,
      phase: "fetch",
    });
    try {
      await runBrowserAnalysis(
        trimmed,
        lastRunConfig.maxGames,
        lastRunConfig.maxMoves,
        lastRunConfig.cpThreshold,
        lastRunConfig.engineDepth,
        lastRunConfig.source,
        `Running full scan for ${trimmed}...`,
        mode,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
      setState("error");
    }
  };

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

          {/* ─── Loading State ─── */}
          {state === "loading" && (
            <div
              ref={loadingRef}
              className="glass-card animate-scale-in mx-auto w-full max-w-3xl p-6"
            >
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                  <svg
                    className="h-5 w-5 animate-spin text-emerald-400"
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
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white">
                    {progressInfo.message || "Preparing analysis..."}
                  </p>
                  {progressInfo.detail && (
                    <p className="truncate text-sm text-slate-400">
                      {progressInfo.detail}
                    </p>
                  )}
                </div>
                <span className="shrink-0 rounded-lg bg-white/[0.06] px-2.5 py-1 font-mono text-xs font-medium text-slate-300">
                  {progressInfo.percent}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500 ease-out"
                  style={{ width: `${progressInfo.percent}%` }}
                />
              </div>

              {/* Phase steps */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-y-2 text-[11px] font-medium">
                {[
                  { key: "fetch", label: "Download", icon: Globe },
                  { key: "parse", label: "Parse", icon: BookOpen },
                  { key: "eval", label: "Evaluate", icon: Brain },
                  { key: "tactics", label: "Tactics", icon: Swords },
                  { key: "endgames", label: "Endgames", icon: Castle },
                  { key: "done", label: "Done", icon: CheckCircle2 },
                ].map((step) => {
                  const phases = [
                    "fetch",
                    "parse",
                    "aggregate",
                    "eval",
                    "tactics",
                    "endgames",
                    "done",
                  ];
                  const currentIdx = phases.indexOf(progressInfo.phase);
                  const stepIdx = phases.indexOf(step.key);
                  const isActive =
                    step.key === progressInfo.phase ||
                    (step.key === "eval" && progressInfo.phase === "aggregate");
                  const isComplete =
                    currentIdx > stepIdx ||
                    (step.key === "eval" &&
                      (progressInfo.phase === "tactics" ||
                        progressInfo.phase === "endgames"));
                  return (
                    <div
                      key={step.key}
                      className={`flex flex-col items-center gap-1 transition-colors ${
                        isActive
                          ? "text-emerald-400"
                          : isComplete
                            ? "text-slate-400"
                            : "text-slate-500"
                      }`}
                    >
                      <step.icon className="h-4 w-4" />
                      <span>{step.label}</span>
                      {isActive && (
                        <span className="mt-0.5 h-0.5 w-4 rounded-full bg-emerald-400" />
                      )}
                      {isComplete && (
                        <span className="mt-0.5 h-0.5 w-4 rounded-full bg-slate-500" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ── Profile completion widget ── */}
              {authenticated &&
                (() => {
                  const hasSaved = (mode: string) =>
                    savedScanModes.has(mode) ||
                    savedScanModes.has("both") ||
                    (mode === "openings" && savedScanModes.has("both")) ||
                    (mode === "tactics" && savedScanModes.has("both"));
                  const steps = [
                    { label: "Opening scan saved", done: hasSaved("openings") },
                    { label: "Tactics scan saved", done: hasSaved("tactics") },
                    { label: "Endgame scan saved", done: hasSaved("endgames") },
                  ];
                  const doneCount = steps.filter((s) => s.done).length;
                  // +1 for "account linked" which is always true if authenticated
                  const totalScore = Math.round(((doneCount + 1) / 4) * 100);
                  return (
                    <Link
                      href="/profile"
                      className="mt-5 block rounded-xl border border-orange-500/20 bg-orange-500/[0.05] px-4 py-3.5 transition hover:bg-orange-500/[0.09]"
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-orange-300" />
                          <span className="text-sm font-semibold text-white">
                            Chess Profile
                          </span>
                          {doneCount === 3 ? (
                            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                              Complete
                            </span>
                          ) : (
                            <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[10px] font-bold text-orange-400">
                              {totalScore}% complete
                            </span>
                          )}
                        </div>
                        <svg
                          className="h-3.5 w-3.5 text-slate-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                      {/* Progress bar */}
                      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            doneCount === 3
                              ? "bg-emerald-500"
                              : "bg-gradient-to-r from-orange-500 to-amber-400"
                          }`}
                          style={{ width: `${totalScore}%` }}
                        />
                      </div>
                      {/* Steps */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-emerald-400">✓</span>
                          <span className="text-slate-300">Account linked</span>
                        </div>
                        {steps.map((s) => (
                          <div
                            key={s.label}
                            className="flex items-center gap-1.5 text-xs"
                          >
                            {s.done ? (
                              <span className="text-emerald-400">✓</span>
                            ) : (
                              <span className="text-slate-600">○</span>
                            )}
                            <span
                              className={
                                s.done ? "text-slate-300" : "text-slate-500"
                              }
                            >
                              {s.label}
                            </span>
                          </div>
                        ))}
                      </div>
                      {doneCount < 3 && (
                        <p className="mt-2.5 text-[11px] text-slate-500">
                          Complete all scans to unlock your personalized lesson
                          plan →
                        </p>
                      )}
                    </Link>
                  );
                })()}
            </div>
          )}

          {advancedSettingsOpen && (
            <div className="fixed inset-0 z-[80] flex items-start justify-center bg-[rgba(2,6,23,0.78)] px-4 py-6 backdrop-blur-sm sm:items-center sm:px-6">
              <div
                className="absolute inset-0"
                onClick={() => setAdvancedSettingsOpen(false)}
                aria-hidden="true"
              />
              <section className="relative z-10 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-white/[0.08] bg-[rgba(6,11,26,0.96)] p-5 shadow-[0_30px_120px_-48px_rgba(2,6,23,0.98)] sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-200/72">
                      Advanced Scan Settings
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-white">
                      Tune the scan without crowding the homepage.
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
                      These settings apply to the quick scan above. Set the
                      platform and username there, then use this panel for
                      depth, thresholds, and range.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAdvancedSettingsOpen(false)}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-slate-400 transition hover:border-white/[0.16] hover:text-white"
                    aria-label="Close advanced scan settings"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                    >
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className="tag-cyan text-[11px]">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
                    Browser analysis
                  </span>
                  {IS_DEV && LOCAL_PRO_HOTKEY_ENABLED && (
                    <span
                      className={`tag-pill text-[11px] ${
                        localProEnabled
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                          : "border-white/10 bg-white/[0.03] text-slate-400"
                      }`}
                    >
                      Pro: {localProEnabled ? "ON" : "OFF"} (~)
                    </span>
                  )}
                </div>

                {welcomeBack && state === "idle" && !result && (
                  <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.05] px-4 py-3">
                    <span className="text-lg">👋</span>
                    <p className="flex-1 text-sm text-slate-300">
                      Welcome back! Ready to scan{" "}
                      <span className="font-semibold text-white">
                        {welcomeBack}
                      </span>{" "}
                      again?
                    </p>
                    <button
                      type="button"
                      onClick={() => setWelcomeBack(null)}
                      className="text-slate-500 transition-colors hover:text-slate-300"
                      aria-label="Dismiss"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                {showRestoreBanner &&
                  cachedReportEntry &&
                  state === "idle" &&
                  !result && (
                    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.06] px-4 py-3">
                      <span className="text-lg">📋</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-200">
                          Last report:{" "}
                          <span className="text-white">
                            {cachedReportEntry.result.username}
                          </span>
                          <span className="ml-2 rounded-md bg-cyan-500/15 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-cyan-400">
                            Full scan
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {cachedReportEntry.result.gamesAnalyzed} games ·{" "}
                          {cachedReportEntry.result.leaks.length} opening leaks
                          · {cachedReportEntry.result.missedTactics.length}{" "}
                          missed tactics ·{" "}
                          {new Date(
                            cachedReportEntry.savedAt,
                          ).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const entry = cachedReportEntry;
                          setUsername(entry.result.username);
                          setSource(entry.config.source);
                          setScanMode(FULL_SCAN_MODE);
                          setSpeed(entry.config.speed);
                          setLastRunConfig({
                            ...entry.config,
                            scanMode: FULL_SCAN_MODE,
                          });
                          setResult(entry.result);
                          setActiveReportPath(entry.reportPath ?? null);
                          setState("done");
                          // Restored report → land on the full report.
                          setViewMode("full");
                          setSaveStatus("idle");
                          setShowRestoreBanner(false);
                          setAdvancedSettingsOpen(false);
                          setTimeout(() => {
                            reportRef.current?.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                          }, 300);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition-all hover:bg-cyan-500/20"
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        Load Last Report
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRestoreBanner(false)}
                        className="text-slate-500 transition-colors hover:text-slate-300"
                        aria-label="Dismiss"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}

                <div className="mt-6 space-y-3">
                  <div className="stat-card space-y-2">
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Time Control
                      <HelpTip text="Filter which game speeds to include. Pick specific ones or All. Multi-select is supported — click multiple to combine." />
                    </span>
                    <div className="grid h-auto grid-cols-3 gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1 sm:h-10 sm:grid-cols-5">
                      {[
                        { value: "all" as const, label: "All" },
                        { value: "bullet" as const, label: "Bullet" },
                        { value: "blitz" as const, label: "Blitz" },
                        { value: "rapid" as const, label: "Rapid" },
                        { value: "classical" as const, label: "Classical" },
                      ].map((tc) => {
                        const isActive = speed.includes(tc.value);
                        return (
                          <button
                            key={tc.value}
                            type="button"
                            onClick={() => {
                              if (tc.value === "all") {
                                setSpeed(["all"]);
                              } else {
                                setSpeed((prev) => {
                                  const withoutAll = prev.filter(
                                    (s) => s !== "all",
                                  );
                                  const next = withoutAll.includes(tc.value)
                                    ? withoutAll.filter((s) => s !== tc.value)
                                    : [...withoutAll, tc.value];
                                  return next.length === 0 || next.length === 4
                                    ? ["all"]
                                    : next;
                                });
                              }
                            }}
                            className={`rounded-md text-[11px] font-semibold transition-all duration-200 ${
                              isActive
                                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 shadow-glow-sm"
                                : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                            }`}
                          >
                            {tc.label}
                          </button>
                        );
                      })}
                    </div>
                    {!speed.includes("all") && speed.length > 1 && (
                      <p className="text-[10px] text-slate-500">
                        {speed.length} time controls selected
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="stat-card space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                          Games
                          <HelpTip text="Scan your N most recent games (Last N), or pick a date range to include every game played in that window. The end date is optional — leave it blank to scan up to today." />
                        </span>
                        <div className="grid h-6 grid-cols-2 gap-0.5 rounded-md border border-white/[0.06] bg-white/[0.02] p-0.5">
                          <button
                            type="button"
                            onClick={() => setGameRangeMode("count")}
                            className={`rounded px-1.5 text-[10px] font-semibold transition-all ${
                              gameRangeMode === "count"
                                ? "bg-emerald-500/80 text-slate-950"
                                : "text-slate-500 hover:text-slate-300"
                            }`}
                          >
                            Last N
                          </button>
                          <button
                            type="button"
                            onClick={() => setGameRangeMode("since")}
                            className={`rounded px-1.5 text-[10px] font-semibold transition-all ${
                              gameRangeMode === "since"
                                ? "bg-emerald-500/80 text-slate-950"
                                : "text-slate-500 hover:text-slate-300"
                            }`}
                          >
                            Range
                          </button>
                        </div>
                      </div>
                      {gameRangeMode === "count" ? (
                        <input
                          type="number"
                          min={1}
                          max={hasProAccess ? 100000 : 300}
                          value={gameCount}
                          onChange={(e) => setGameCount(Number(e.target.value))}
                          aria-label="Number of games to scan"
                          className="glass-input h-10 text-sm"
                        />
                      ) : (
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase tracking-wider text-slate-500">
                              From
                            </span>
                            <input
                              type="date"
                              value={sinceDate}
                              onChange={(e) => setSinceDate(e.target.value)}
                              max={new Date().toISOString().split("T")[0]}
                              disabled={!hasProAccess}
                              aria-label="Scan games from date"
                              className="glass-input h-10 min-w-0 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase tracking-wider text-slate-500">
                              To
                            </span>
                            <input
                              type="date"
                              value={untilDate}
                              onChange={(e) => setUntilDate(e.target.value)}
                              min={sinceDate || undefined}
                              max={new Date().toISOString().split("T")[0]}
                              disabled={!hasProAccess}
                              aria-label="Scan games until date (optional)"
                              className="glass-input h-10 min-w-0 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                            />
                          </div>
                        </div>
                      )}
                      {gameRangeMode === "since" && !hasProAccess && (
                        <p className="text-xs font-medium text-amber-400">
                          Requires{" "}
                          <Link href="/pricing" className="underline">
                            Pro
                          </Link>
                        </p>
                      )}
                      {gameRangeMode === "count" && gamesOverFreeLimit && (
                        <p className="text-xs font-medium text-amber-400">
                          {!hasProAccess ? (
                            <>
                              Requires{" "}
                              <Link href="/pricing" className="underline">
                                Pro
                              </Link>
                            </>
                          ) : gameCount > 1000 ? (
                            `${gameCount.toLocaleString()} games — may take a while`
                          ) : (
                            "Unlocked"
                          )}
                        </p>
                      )}
                      {gameRangeMode === "since" && !sinceDate && (
                        <p className="text-[10px] text-slate-500">
                          Pick a start date
                        </p>
                      )}
                    </div>

                    <div className="stat-card space-y-2">
                      <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                        Moves
                        <HelpTip text="How deep into the opening to scan (number of moves per side). Higher values catch later opening deviations but take longer." />
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={hasProAccess ? 40 : FREE_MAX_MOVES}
                        value={moveCount}
                        onChange={(e) => setMoveCount(Number(e.target.value))}
                        aria-label="Number of moves to scan"
                        className="glass-input h-10 text-sm"
                      />
                      {!hasProAccess && movesOverFreeLimit && (
                        <p className="text-xs font-medium text-amber-400">
                          Free capped at {FREE_MAX_MOVES}.{" "}
                          <Link href="/pricing" className="underline">
                            Upgrade
                          </Link>{" "}
                          for up to 40.
                        </p>
                      )}
                    </div>

                    <div className="stat-card space-y-2">
                      <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                        CP Threshold
                        <HelpTip text="Minimum centipawn loss to flag a move as a mistake. Lower = stricter (catches inaccuracies). Default 50cp works well for most players." />
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={cpThreshold}
                        onChange={(e) => setCpThreshold(Number(e.target.value))}
                        aria-label="Centipawn loss threshold"
                        className="glass-input h-10 text-sm"
                      />
                    </div>

                    <div className="stat-card space-y-2">
                      <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                        Depth
                        <HelpTip text="Stockfish engine search depth. Higher = more accurate but slower. 12 is good for quick scans, 18+ for serious analysis. Pro unlocks up to 24." />
                      </span>
                      <input
                        type="number"
                        min={6}
                        max={24}
                        value={engineDepth}
                        onChange={(e) => setEngineDepth(Number(e.target.value))}
                        aria-label="Engine search depth"
                        className="glass-input h-10 text-sm"
                      />
                      {depthOverFreeLimit && (
                        <p className="text-xs font-medium text-amber-400">
                          {!hasProAccess ? (
                            <>
                              Requires{" "}
                              <Link href="/pricing" className="underline">
                                Pro
                              </Link>
                            </>
                          ) : (
                            "Unlocked"
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 border-t border-white/[0.08] pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-relaxed text-slate-500">
                    These settings update the next scan immediately. Use the
                    main scan button in the quick-scan card when you are ready.
                  </p>
                  <button
                    type="button"
                    onClick={() => setAdvancedSettingsOpen(false)}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/[0.18] hover:bg-white/[0.07]"
                  >
                    Done
                  </button>
                </div>
              </section>
            </div>
          )}

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

          {/* ─── App Launcher (hidden for now) ─── */}
          {false && state === "idle" && (
            <section className="animate-fade-in mx-auto w-full max-w-5xl">
              <div className="mb-6 text-center">
                <span className="mb-2 inline-block rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-400">
                  All Tools
                </span>
                <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                  Your Chess{" "}
                  <span className="gradient-text">Command Center</span>
                </h2>
                <p className="mt-1.5 text-sm text-slate-400">
                  Tap to launch any tool
                </p>
              </div>
              <LauncherEditor
                initialConfig={launcherConfig}
                onSave={saveLauncherConfig}
              />
            </section>
          )}

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

          {/* ─── Results ─── */}
          {result !== null && (state === "done" || state === "loading") && (
            <section ref={reportRef} className="animate-fade-in-up space-y-8">
              {instantScanPayload && (
                <ScanSessionReport
                  scan={instantScanPayload}
                  reportMeta={report}
                  hasProAccess={hasProAccess}
                  authenticated={authenticated}
                />
              )}
            </section>
          )}
        </section>
      </div>

      {/* ─── Testimonials / Human Photos ─── */}
      <section className="border-t border-white/[0.06] py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-extrabold text-white md:text-4xl">
                Trusted by chess players of all levels
              </h2>
              <p className="mt-4 text-base text-slate-400">
                From casual club players to tournament competitors — FireChess
                helps you find and fix the gaps in your game.
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {/* Testimonial 1 */}
              <div className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 transition-all hover:border-violet-500/30 hover:bg-white/[0.04]">
                <div className="flex items-center gap-4">
                  <img
                    src="/images/testimonials/david-chen.jpg"
                    alt="David Chen"
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-violet-500/20"
                    width={56}
                    height={56}
                    loading="lazy"
                  />
                  <div>
                    <p className="font-bold text-white">David Chen</p>
                    <p className="text-sm text-slate-500">Club player, 1650 Elo</p>
                  </div>
                </div>
                <blockquote className="mt-4 text-sm leading-relaxed text-slate-300">
                  &ldquo;I always knew my openings were weak, but seeing the
                  exact leaks laid out game-by-game was eye-opening. My accuracy
                  went from 65% to 82% in two months.&rdquo;
                </blockquote>
              </div>

              {/* Testimonial 2 */}
              <div className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 transition-all hover:border-violet-500/30 hover:bg-white/[0.04]">
                <div className="flex items-center gap-4">
                  <img
                    src="/images/testimonials/sarah-okonkwo.jpg"
                    alt="Sarah Müller"
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-violet-500/20"
                    width={56}
                    height={56}
                    loading="lazy"
                  />
                  <div>
                    <p className="font-bold text-white">Sarah Müller</p>
                    <p className="text-sm text-slate-500">
                      Tournament player, 1950 Elo
                    </p>
                  </div>
                </div>
                <blockquote className="mt-4 text-sm leading-relaxed text-slate-300">
                  &ldquo;The tactic recognition drill is exactly what I needed.
                  I was missing forks in cramped positions — now I catch them
                  instantly. Up 120 points in three months.&rdquo;
                </blockquote>
              </div>

              {/* Testimonial 3 */}
              <div className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 transition-all hover:border-violet-500/30 hover:bg-white/[0.04]">
                <div className="flex items-center gap-4">
                  <img
                    src="/images/testimonials/marcus-rivera.jpg"
                    alt="Marcus Rivera"
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-violet-500/20"
                    width={56}
                    height={56}
                    loading="lazy"
                  />
                  <div>
                    <p className="font-bold text-white">Marcus Rivera</p>
                    <p className="text-sm text-slate-500">
                      Casual player, 1200 Elo
                    </p>
                  </div>
                </div>
                <blockquote className="mt-4 text-sm leading-relaxed text-slate-300">
                  &ldquo;I play a few blitz games on my lunch break. FireChess
                  makes it dead simple to upload them and see what I&rsquo;m
                  doing wrong. The study plan alone is worth it.&rdquo;
                </blockquote>
              </div>
            </div>
          </div>
        </section>

      {/* ─── Sticky Save Bar ─── */}
      {state === "done" &&
        result &&
        saveStatus !== "saved" &&
        saveStatus !== "duplicate" && (
          <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] bg-slate-950/90 backdrop-blur-lg">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
              <p className="text-sm text-slate-300">
                <span className="font-semibold text-white">
                  {result.leaks.length} leaks
                </span>{" "}
                &middot;{" "}
                <span className="font-semibold text-white">
                  {result.missedTactics.length} tactics
                </span>
                {result.endgameMistakes.length > 0 && (
                  <>
                    {" "}
                    &middot;{" "}
                    <span className="font-semibold text-white">
                      {result.endgameMistakes.length} endgame
                    </span>
                  </>
                )}{" "}
                found — save to unlock training modes
              </p>
              <button
                type="button"
                onClick={() => {
                  if (!authenticated) {
                    window.location.href = "/auth/signin";
                    return;
                  }
                  saveReportToAccount();
                }}
                disabled={saveStatus === "saving"}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:brightness-110 disabled:opacity-50"
              >
                {saveStatus === "saving" ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="opacity-20"
                      />
                      <path
                        d="M12 2a10 10 0 019.95 9"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                    Saving…
                  </>
                ) : (
                  <>
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
                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                      />
                    </svg>
                    {authenticated ? "Save Report" : "Sign in to Save"}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
    </div>
  );
}
