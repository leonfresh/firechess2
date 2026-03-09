"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { DrillMode } from "@/components/drill-mode";
import { HeroDemoBoard } from "@/components/hero-demo-board";
import { MistakeCard } from "@/components/mistake-card";
import { TacticCard } from "@/components/tactic-card";
import { EndgameCard } from "@/components/endgame-card";
import { TimeCard } from "@/components/time-card";
import { DailyLoginPopup } from "@/components/daily-login-rewards";
import { CardCarousel, ViewModeToggle } from "@/components/card-carousel";
import type { CardViewMode } from "@/components/card-carousel";
import { useSession } from "@/components/session-provider";
import { OpeningRankings } from "@/components/opening-rankings";
import { StrengthsRadar, RadarLegend, InsightCards, computeRadarData } from "@/components/radar-chart";
import { analyzeOpeningLeaksInBrowser } from "@/lib/client-analysis";
import type { AnalysisProgress } from "@/lib/client-analysis";
import type { AnalysisSource, ScanMode, TimeControl } from "@/lib/client-analysis";
import type { AnalyzeResponse, RepeatedOpeningLeak } from "@/lib/types";
import { fetchExplorerMoves } from "@/lib/lichess-explorer";
import { shareReportCard } from "@/lib/share-report";
import { earnCoins, spendCoins, hasPurchased, getBalance } from "@/lib/coins";
import { POSITIONAL_PATTERNS } from "@/lib/positional-quotes";
import { explainOpeningLeak, describeEndPosition, type PositionExplanation } from "@/lib/position-explainer";
import { ExplanationModal } from "@/components/explanation-modal";
import { stockfishClient } from "@/lib/stockfish-client";
import { PersonalizedPuzzles } from "@/components/personalized-puzzles";
import { Chessboard, type CbSquare } from "@/components/chessboard-compat";
import { Chess, type PieceSymbol } from "chess.js";
import { useBoardTheme, useCustomPieces } from "@/lib/use-coins";

/* ── Inline help tooltip ── */
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
const FREE_MAX_GAMES = 300;
const FREE_MAX_DEPTH = 12;
const FREE_MAX_MOVES = 30;
const FREE_TACTIC_SAMPLE = 10;
const FREE_ENDGAME_SAMPLE = 10;
const LOCAL_PRO_HOTKEY_ENABLED = process.env.NEXT_PUBLIC_ENABLE_LOCAL_PRO_HOTKEY !== "false";
const IS_DEV = process.env.NODE_ENV !== "production";

export default function HomePage() {
  const { plan: sessionPlan, authenticated } = useSession();
  const [heroPhase, setHeroPhase] = useState<"idle" | "hiding" | "revealing">("idle");
  const heroTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [username, setUsername] = useState("");
  const [gameRangeMode, setGameRangeMode] = useState<"count" | "since">("count");
  const [gameCount, setGameCount] = useState(300);
  const [sinceDate, setSinceDate] = useState("");
  const [moveCount, setMoveCount] = useState(30);
  const [cpThreshold, setCpThreshold] = useState(50);
  const [engineDepth, setEngineDepth] = useState(12);
  const [source, setSource] = useState<AnalysisSource | null>(null);
  const [scanMode, setScanMode] = useState<ScanMode>("openings");
  const [includeTactics, setIncludeTactics] = useState(false);
  const [speed, setSpeed] = useState<TimeControl[]>(["all"]);
  const [cardViewMode, setCardViewMode] = useState<CardViewMode>(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) return "carousel";
    return "list";
  });
  const [lastRunConfig, setLastRunConfig] =
    useState<{ maxGames: number; maxMoves: number; cpThreshold: number; engineDepth: number; source: AnalysisSource; scanMode: ScanMode; speed: TimeControl[] } | null>(null);
  const [state, setState] = useState<RequestState>("idle");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [progressInfo, setProgressInfo] = useState<{ message: string; detail?: string; percent: number; phase: string }>({ message: "", percent: 0, phase: "" });
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [localProEnabled, setLocalProEnabled] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "duplicate" | "error">("idle");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [copyLinkLabel, setCopyLinkLabel] = useState("Copy Link");
  const [welcomeBack, setWelcomeBack] = useState<string | null>(null);
  const [leakTab, setLeakTab] = useState<"repeated" | "one-off">("repeated");
  const [openingFolder, setOpeningFolder] = useState<"mistakes" | "rankings">("mistakes");
  const [tacticsOpen, setTacticsOpen] = useState(true);
  const [patternsOpen, setPatternsOpen] = useState(true);
  const [endgamesOpen, setEndgamesOpen] = useState(true);
  const [puzzleBoardOpen, setPuzzleBoardOpen] = useState(false);
  const [timeManagementOpen, setTimeManagementOpen] = useState(true);
  const [timeVerdictTab, setTimeVerdictTab] = useState<"all" | "wasted" | "rushed" | "justified">("all");
  const [expandedMotifs, setExpandedMotifs] = useState<Set<string>>(new Set());
  const [posExplainModalOpen, setPosExplainModalOpen] = useState(false);
  const [posExplainRich, setPosExplainRich] = useState<PositionExplanation | null>(null);
  const [posExplainAnimUci, setPosExplainAnimUci] = useState<string[]>([]);
  const [posExplainFen, setPosExplainFen] = useState("");
  const [posExplainOrientation, setPosExplainOrientation] = useState<"white" | "black">("white");
  const [posExplainTitle, setPosExplainTitle] = useState("");
  const [posExplainSubtitle, setPosExplainSubtitle] = useState<string | undefined>();
  const [posExplaining, setPosExplaining] = useState<string | null>(null);
  const [timeUnlocked, setTimeUnlocked] = useState(false);
  const reportRef = useRef<HTMLElement>(null);
  const pngRef = useRef<HTMLDivElement>(null);
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();
  const hasProAccess = sessionPlan === "pro" || sessionPlan === "lifetime" || localProEnabled;
  const gamesOverFreeLimit = gameRangeMode === "count" && gameCount > FREE_MAX_GAMES;
  const depthOverFreeLimit = engineDepth > FREE_MAX_DEPTH;
  const movesOverFreeLimit = moveCount > FREE_MAX_MOVES;
  const freeLimitsExceeded = !hasProAccess && (gamesOverFreeLimit || depthOverFreeLimit || movesOverFreeLimit);

  /* ── Hero typography animation ── */
  const heroAnim = (step: number) =>
    heroPhase === "hiding" ? "hero-hide" : heroPhase === "revealing" ? `hero-reveal-${step}` : "";

  const triggerHeroAnimation = useCallback(() => {
    if (heroTimerRef.current) clearTimeout(heroTimerRef.current);
    setHeroPhase("hiding");
    heroTimerRef.current = setTimeout(() => {
      setHeroPhase("revealing");
      heroTimerRef.current = setTimeout(() => setHeroPhase("idle"), 3000);
    }, 400);
  }, []);

  useEffect(() => {
    if (!IS_DEV || !LOCAL_PRO_HOTKEY_ENABLED) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Backquote") return;

      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isTypingField =
        tag === "input" || tag === "textarea" || tag === "select" || !!target?.isContentEditable;

      if (isTypingField) return;

      setLocalProEnabled((prev) => {
        const next = !prev;
        setNotice(next ? "Local Pro mode enabled via ~ hotkey." : "Local Pro mode disabled.");
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
        cardViewMode?: string;
      };

      if (parsed.gameRangeMode === "count" || parsed.gameRangeMode === "since") {
        setGameRangeMode(parsed.gameRangeMode);
      }
      if (typeof parsed.gameCount === "number") {
        setGameCount(Math.min(5000, Math.max(1, Math.floor(parsed.gameCount))));
      }
      if (typeof parsed.sinceDate === "string" && parsed.sinceDate) {
        setSinceDate(parsed.sinceDate);
      }
      if (typeof parsed.moveCount === "number") {
        setMoveCount(Math.min(30, Math.max(1, Math.floor(parsed.moveCount))));
      }
      if (typeof parsed.cpThreshold === "number") {
        setCpThreshold(Math.min(1000, Math.max(1, Math.floor(parsed.cpThreshold))));
      }
      if (typeof parsed.engineDepth === "number") {
        setEngineDepth(Math.min(24, Math.max(6, Math.floor(parsed.engineDepth))));
      }
      if (parsed.source === "chesscom" || parsed.source === "lichess") {
        setSource(parsed.source);
      }
      if (typeof (parsed as any).username === "string" && (parsed as any).username) {
        setUsername((parsed as any).username);
        setWelcomeBack((parsed as any).username);
      }
      if (parsed.cardViewMode === "carousel" || parsed.cardViewMode === "list" || parsed.cardViewMode === "grid") {
        setCardViewMode(parsed.cardViewMode);
      }
      if (parsed.scanMode === "openings" || parsed.scanMode === "tactics" || parsed.scanMode === "endgames" || parsed.scanMode === "both" || parsed.scanMode === "time-management") {
        setScanMode(parsed.scanMode as ScanMode);
      }
      // Restore speed (supports both legacy single string and new array format)
      if (Array.isArray(parsed.speed)) {
        const valid = parsed.speed.filter((s): s is TimeControl =>
          s === "all" || s === "bullet" || s === "blitz" || s === "rapid" || s === "classical"
        );
        if (valid.length > 0) setSpeed(valid);
      } else if (typeof parsed.speed === "string") {
        if (parsed.speed === "all" || parsed.speed === "bullet" || parsed.speed === "blitz" || parsed.speed === "rapid" || parsed.speed === "classical") {
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
          scanMode,
          speed,
          gameRangeMode,
          sinceDate,
          cardViewMode,
          username: username.trim() || undefined
        })
      );
    } catch {
      // ignore storage write failures
    }
  }, [gameCount, moveCount, cpThreshold, engineDepth, source, scanMode, speed, gameRangeMode, sinceDate, cardViewMode, username]);

  /* ── Fetch latest saved report leaks for personalized hero board ── */
  const [heroLeaks, setHeroLeaks] = useState<RepeatedOpeningLeak[]>([]);
  useEffect(() => {
    if (!authenticated) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/reports");
        if (!res.ok) return;
        const json = await res.json();
        const latest = json.reports?.[0];
        if (!cancelled && latest?.leaks?.length) {
          setHeroLeaks(latest.leaks as RepeatedOpeningLeak[]);
        }
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
  }, [authenticated]);

  const leaks = useMemo(() => result?.leaks ?? [], [result]);
  /** Leak count excluding DB-approved sidelines — used for radar/scoring so sidelines don't penalize */
  const realLeakCount = useMemo(() => leaks.filter(l => !l.dbApproved).length, [leaks]);
  const missedTactics = useMemo(() => result?.missedTactics ?? [], [result]);
  const endgameMistakes = useMemo(() => result?.endgameMistakes ?? [], [result]);
  const oneOffMistakes = useMemo(() => result?.oneOffMistakes ?? [], [result]);
  const positionalFindings = useMemo(() => result?.positionalFindings ?? [], [result]);
  const endgameStats = useMemo(() => result?.endgameStats ?? null, [result]);
  const timeManagement = useMemo(() => result?.timeManagement ?? null, [result]);

  // Check if user has unlocked time management with coins
  useEffect(() => {
    if (typeof window !== "undefined") {
      setTimeUnlocked(hasPurchased("time-management-unlock"));
    }
  }, [result]);

  // DB-approved inaccuracy detection — exclude these FENs from drills
  const [dbApprovedFens, setDbApprovedFens] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (leaks.length === 0) { setDbApprovedFens(new Set()); return; }
    const inaccuracyLeaks = leaks.filter((l) => l.cpLoss < 100);
    if (inaccuracyLeaks.length === 0) { setDbApprovedFens(new Set()); return; }
    let cancelled = false;
    (async () => {
      const approved = new Set<string>();
      // Check explorer in parallel (batches of 4 to avoid rate limits)
      for (let i = 0; i < inaccuracyLeaks.length; i += 4) {
        const batch = inaccuracyLeaks.slice(i, i + 4);
        const results = await Promise.all(
          batch.map((l) => fetchExplorerMoves(l.fenBefore, l.sideToMove).catch(() => null))
        );
        if (cancelled) return;
        results.forEach((res, idx) => {
          if (!res) return;
          const leak = batch[idx];
          const userMoveInDb = res.moves.find((m) => m.uci === leak.userMove);
          if (userMoveInDb && userMoveInDb.totalGames >= 100 && userMoveInDb.winRate >= 0.45) {
            approved.add(leak.fenBefore);
          }
        });
      }
      if (!cancelled) setDbApprovedFens(approved);
    })();
    return () => { cancelled = true; };
  }, [leaks]);

  // Motif clustering — combine missed tactics, opening leaks, AND one-off mistakes
  const tacticMotifs = useMemo(() => {
    // Build a unified array of tagged positions from all sources
    type TaggedPosition = { tags: string[]; cpLoss: number; fenBefore: string; userMove?: string; bestMove?: string | null };
    const allPositions: TaggedPosition[] = [];

    for (const t of missedTactics) {
      allPositions.push({ tags: t.tags, cpLoss: t.cpLoss, fenBefore: t.fenBefore, userMove: t.userMove, bestMove: t.bestMove });
    }
    for (const l of leaks) {
      if (l.tags?.length) {
        allPositions.push({ tags: l.tags, cpLoss: l.cpLoss, fenBefore: l.fenBefore, userMove: l.userMove, bestMove: l.bestMove });
      }
    }
    for (const o of oneOffMistakes) {
      if (o.tags?.length) {
        allPositions.push({ tags: o.tags, cpLoss: o.cpLoss, fenBefore: o.fenBefore, userMove: o.userMove, bestMove: o.bestMove });
      }
    }
    for (const pf of positionalFindings) {
      if (pf.tags?.length) {
        allPositions.push({ tags: pf.tags, cpLoss: pf.cpLoss, fenBefore: pf.fenBefore, userMove: pf.userMove, bestMove: pf.bestMove });
      }
    }

    if (allPositions.length === 0) return [];

    // Positional pattern tags that should surface even with 1 occurrence
    const positionalTags = new Set([
      "Unnecessary Capture", "Premature Trade", "Released Tension",
      "Passive Retreat", "Trading Advantage", "Greedy Pawn Grab",
      "Premature Pawn Break", "Weakened Pawn Structure", "Wrong Recapture",
      "Missed Development", "Piece Activity", "King Exposure",
      "Hanging Piece",
    ]);

    // Define motif categories with matching logic
    const motifDefs: { name: string; icon: string; positional?: boolean; match: (t: TaggedPosition) => boolean }[] = [
      { name: "Hanging Pieces", icon: "💀", positional: true, match: (t) => t.tags.includes("Hanging Piece") },
      { name: "Missed Mate", icon: "👑", match: (t) => t.tags.some((tag) => tag === "Missed Mate" || tag === "Winning Blunder") && (t.cpLoss >= 99000) },
      { name: "Missed Check", icon: "⚡", match: (t) => t.tags.includes("Missed Check") },
      { name: "Missed Capture", icon: "🗡️", match: (t) => t.tags.includes("Missed Capture") || t.tags.includes("Forcing Capture") },
      { name: "Back Rank Threats", icon: "🏰", match: (t) => t.tags.includes("Back Rank") },
      { name: "Knight Tactics", icon: "♞", match: (t) => t.tags.includes("Knight Fork?") },
      { name: "Queen Tactics", icon: "♛", match: (t) => t.tags.includes("Queen Tactic") },
      { name: "Converting Advantage", icon: "📈", match: (t) => t.tags.includes("Converting Advantage") },
      { name: "Equal Position Misses", icon: "⚖️", match: (t) => t.tags.includes("Equal Position") },
      { name: "Unnecessary Captures", icon: "🚫", positional: true, match: (t) => t.tags.includes("Unnecessary Capture") },
      { name: "Premature Trades", icon: "🤝", positional: true, match: (t) => t.tags.includes("Premature Trade") },
      { name: "Released Tension", icon: "💨", positional: true, match: (t) => t.tags.includes("Released Tension") },
      { name: "Passive Retreats", icon: "🐢", positional: true, match: (t) => t.tags.includes("Passive Retreat") },
      { name: "Trading Advantage", icon: "📉", positional: true, match: (t) => t.tags.includes("Trading Advantage") },
      { name: "Greedy Pawn Grabs", icon: "🍕", positional: true, match: (t) => t.tags.includes("Greedy Pawn Grab") },
      { name: "Weakened Pawn Structure", icon: "🏚️", positional: true, match: (t) => t.tags.includes("Weakened Pawn Structure") },
      { name: "Wrong Recaptures", icon: "↩️", positional: true, match: (t) => t.tags.includes("Wrong Recapture") },
      { name: "Missed Development", icon: "🐌", positional: true, match: (t) => t.tags.includes("Missed Development") },
      { name: "King Exposure", icon: "👑", positional: true, match: (t) => t.tags.includes("King Exposure") },
      { name: "Piece Activity", icon: "📊", positional: true, match: (t) => t.tags.includes("Piece Activity") },
      { name: "Premature Pawn Breaks", icon: "⚔️", positional: true, match: (t) => t.tags.includes("Premature Pawn Break") },
      { name: "General Inaccuracy", icon: "⚠️", positional: true, match: (t) => t.tags.includes("Inaccuracy") },
      { name: "Neglected Castling", icon: "🏰", positional: true, match: (t) => t.tags.includes("Neglected Castling") },
      { name: "Aimless Moves", icon: "🌀", positional: true, match: (t) => t.tags.includes("Aimless Move") },
      { name: "Overextended Pawns", icon: "📏", positional: true, match: (t) => t.tags.includes("Overextended Pawn") },
      { name: "Center Neglect", icon: "🎯", positional: true, match: (t) => t.tags.includes("Center Neglect") },
    ];

    const groups: { name: string; icon: string; count: number; avgCpLoss: number; tactics: typeof missedTactics; examples: TaggedPosition[] }[] = [];

    for (const def of motifDefs) {
      // Deduplicate by FEN so the same position from leaks+tactics isn't double-counted
      const seen = new Set<string>();
      const matching: TaggedPosition[] = [];
      for (const p of allPositions) {
        if (def.match(p) && !seen.has(p.fenBefore)) {
          seen.add(p.fenBefore);
          matching.push(p);
        }
      }
      // Positional patterns show with 1+ occurrence, tactical patterns need 2+
      const minCount = def.positional ? 1 : 2;
      if (matching.length >= minCount) {
        const avgLoss = matching.reduce((sum, t) => sum + t.cpLoss, 0) / matching.length;
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
    "Unnecessary Captures", "Premature Trades", "Released Tension", "Passive Retreats",
    "Trading Advantage", "Greedy Pawn Grabs", "Weakened Pawn Structure", "Wrong Recaptures",
    "Missed Development", "King Exposure", "Piece Activity", "Premature Pawn Breaks",
    "General Inaccuracy", "Neglected Castling", "Aimless Moves", "Overextended Pawns", "Center Neglect",
    "Hanging Pieces",
  ]);

  const tacticalMotifs = useMemo(() => tacticMotifs.filter(m => !POSITIONAL_MOTIF_NAMES.has(m.name)), [tacticMotifs]);

  const positionalMotifs = useMemo(() => tacticMotifs.filter(m => POSITIONAL_MOTIF_NAMES.has(m.name)), [tacticMotifs]);

  const diagnostics = result?.diagnostics;
  const report = useMemo(() => {
    if (!diagnostics?.positionTraces?.length) return null;

    const valid = diagnostics.positionTraces.filter((trace) => typeof trace.cpLoss === "number");
    if (valid.length === 0) return null;

    const lossValues = valid.map((trace) => trace.cpLoss ?? 0);
    const sortedLosses = [...lossValues].sort((a, b) => a - b);
    const percentileIndex = Math.floor(sortedLosses.length * 0.75);
    const p75CpLoss = sortedLosses[Math.min(sortedLosses.length - 1, percentileIndex)] ?? 0;
    const meanCpLoss = lossValues.reduce((sum, value) => sum + value, 0) / lossValues.length;
    const variance =
      lossValues.reduce((sum, value) => sum + Math.pow(value - meanCpLoss, 2), 0) / Math.max(1, lossValues.length);
    const stdDevCpLoss = Math.sqrt(variance);

    const weightedLossNumerator = valid.reduce((sum, trace) => sum + (trace.cpLoss ?? 0) * trace.reachCount, 0);
    const totalWeight = valid.reduce((sum, trace) => sum + trace.reachCount, 0);
    const weightedCpLoss = totalWeight > 0 ? weightedLossNumerator / totalWeight : 0;
    const severeLeakRate =
      valid.filter((trace) => (trace.cpLoss ?? 0) >= (lastRunConfig?.cpThreshold ?? cpThreshold)).length / valid.length;

    // Accuracy: exponential decay — 15cp ≈ 88%, 30cp ≈ 78%, 60cp ≈ 61%
    const estimatedAccuracy = Math.min(99.5, Math.max(25,
      100 * Math.exp(-weightedCpLoss / 120)
    ));

    // Rating estimation:
    // If we have the player's actual rating from the API, use it as the base
    // and apply a small adjustment from the analysis signal.
    // Otherwise fall back to the analysis-only estimate.
    const actualRating = result?.playerRating;
    let estimatedRating: number;

    if (actualRating && actualRating > 0) {
      // Analysis-based adjustment: good opening play nudges up, bad nudges down.
      // Scale: ±200 max based on opening quality relative to their level.
      const clampedLoss = Math.max(1, weightedCpLoss);
      // "Expected" cp loss for their level (rough curve)
      const expectedLoss = Math.max(2, 50 - actualRating / 60);
      const diff = expectedLoss - clampedLoss; // positive = better than expected
      const adjustment = Math.max(-200, Math.min(200, diff * 8));
      const leakAdj = severeLeakRate * -150;
      estimatedRating = Math.round(
        Math.min(2800, Math.max(400, actualRating + adjustment + leakAdj))
      );
    } else {
      // Fallback: pure analysis estimate (no actual rating available)
      const clampedLoss = Math.max(2, weightedCpLoss);
      const baseRating = 1800 - 400 * Math.log10(clampedLoss);
      const leakPenalty = severeLeakRate * 400;
      const sampleFactor = Math.min(1, valid.length / 50);
      const rawRating = baseRating - leakPenalty;
      const adjustedRating = 1200 + (rawRating - 1200) * sampleFactor;
      estimatedRating = Math.round(
        Math.min(2400, Math.max(400, adjustedRating))
      );
    }

    const consistencyScore = Math.max(1, Math.min(100, Math.round(100 - stdDevCpLoss / 4)));
    const confidence = Math.max(10, Math.min(99, Math.round((valid.length / 40) * 100)));

    const topTag = (() => {
      if (!result?.leaks?.length) return "No big leak pattern";
      const counts = new Map<string, number>();
      for (const leak of result.leaks) {
        for (const tag of leak.tags ?? []) {
          counts.set(tag, (counts.get(tag) ?? 0) + 1);
        }
      }
      if (counts.size === 0) return "No big leak pattern";
      let best = "No big leak pattern";
      let bestCount = 0;
      for (const [tag, count] of counts.entries()) {
        if (count > bestCount) {
          best = tag;
          bestCount = count;
        }
      }
      return best;
    })();

    const vibeTitle =
      estimatedRating >= 2000
        ? "🔥 Certified Opening Demon"
        : estimatedRating >= 1600
          ? "⚡ Solid Climber Energy"
          : estimatedRating >= 1200
            ? "🌱 Growth Arc Activated"
            : "🧠 Training Arc Beginning";

    return {
      estimatedAccuracy,
      estimatedRating,
      weightedCpLoss,
      severeLeakRate,
      p75CpLoss,
      consistencyScore,
      confidence,
      topTag,
      sampleSize: valid.length,
      vibeTitle
    };
  }, [diagnostics, lastRunConfig, cpThreshold, result?.leaks, result?.playerRating]);
  const maxObservedCpLoss = useMemo(() => {
    const losses = diagnostics?.positionTraces
      .map((trace) => trace.cpLoss)
      .filter((value): value is number => typeof value === "number");

    if (!losses || losses.length === 0) return null;
    return Math.max(...losses);
  }, [diagnostics]);

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
      // Build a content hash for dedup (SHA-256 of key fields)
      const hashInput = JSON.stringify({
        u: result.username,
        s: lastRunConfig.source,
        m: lastRunConfig.scanMode,
        g: result.gamesAnalyzed,
        leakKeys: result.leaks.map((l) => `${l.fenBefore}:${l.userMove}`).sort(),
        tacticKeys: result.missedTactics.map((t) => `${t.fenBefore}:${t.userMove}:${t.gameIndex}`).sort(),
      });
      const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(hashInput));
      const contentHash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

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
          reportMeta: report ? {
            consistencyScore: report.consistencyScore,
            p75CpLoss: report.p75CpLoss,
            confidence: report.confidence,
            topTag: report.topTag,
            vibeTitle: report.vibeTitle,
            sampleSize: report.sampleSize,
          } : null,
          contentHash,
        }),
      });
      const json = await res.json();
      if (json.saved || json.reason === "duplicate") {
        setSaveStatus(json.saved ? "saved" : "duplicate");
        // Award coins for saving a scan
        if (json.saved) {
          try { earnCoins("scan_complete"); } catch {}
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
          if (!planRes.ok) console.warn("Study plan generation failed:", await planRes.text());
        } catch (e) { console.warn("Study plan generation error:", e); }
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
    since?: number
  ) => {
    if (reason) setNotice(reason);
    // Respect the user's scan mode choice. When free users pick "All",
    // they get a limited taste of tactics + endgames (capped samples).
    // Free users can now pick any scan mode; results are capped by
    // FREE_TACTIC_SAMPLE / FREE_ENDGAME_SAMPLE instead.
    const baseScanMode: ScanMode = scanModeOverride ?? scanMode;
    const effectiveScanMode: ScanMode =
      baseScanMode === "openings" && includeTactics ? "both" : baseScanMode;
    const effectiveMaxTactics = !hasProAccess ? FREE_TACTIC_SAMPLE : Infinity;
    const effectiveMaxEndgames = !hasProAccess ? FREE_ENDGAME_SAMPLE : Infinity;

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
      onProgress: onBrowserProgress
    });
    setResult(browserResult);
    setState("done");

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
      setError("Please enter your chess username.");
      setState("error");
      return;
    }

    if (!source) {
      setError("Please select a platform — Lichess or Chess.com.");
      setState("error");
      return;
    }

    if (!hasProAccess && gameRangeMode === "count" && gameCount > FREE_MAX_GAMES) {
      setError(
        `Free plan supports up to ${FREE_MAX_GAMES} recent games per scan. Set games to ${FREE_MAX_GAMES} or less, or upgrade on /pricing.`
      );
      setState("error");
      return;
    }

    if (gameRangeMode === "since" && !sinceDate) {
      setError("Please pick a start date for the \"Since\" range mode.");
      setState("error");
      return;
    }

    if (!hasProAccess && engineDepth > FREE_MAX_DEPTH) {
      setError(
        `Free plan supports engine depth up to ${FREE_MAX_DEPTH}. Set depth to ${FREE_MAX_DEPTH} or less, or upgrade on /pricing.`
      );
      setState("error");
      return;
    }

    try {
      // When "since" mode, use a high cap so the date filter is the real limiter
      const safeGames = gameRangeMode === "since"
        ? 5000
        : Math.min(5000, Math.max(1, Math.floor(gameCount || 300)));
      const safeSince = gameRangeMode === "since" && sinceDate
        ? new Date(sinceDate).getTime()
        : undefined;
      const safeMoves = Math.min(hasProAccess ? 40 : FREE_MAX_MOVES, Math.max(1, Math.floor(moveCount || 20)));
      const safeCpThreshold = Math.min(1000, Math.max(1, Math.floor(cpThreshold || 50)));
      const safeDepth = Math.min(24, Math.max(6, Math.floor(engineDepth || 12)));
      const safeSource: AnalysisSource = source!;
      setLastRunConfig({
        maxGames: safeGames,
        maxMoves: safeMoves,
        cpThreshold: safeCpThreshold,
        engineDepth: safeDepth,
        source: safeSource,
        scanMode,
        speed
      });

      setState("loading");
      setError("");
      setNotice("");
      setResult(null);
      setSaveStatus("idle");
      const rangeLabel = gameRangeMode === "since" ? `since ${sinceDate}` : `${safeGames} games`;
      setProgressInfo({ message: "🚀 Starting analysis", detail: `${safeSource === "chesscom" ? "Chess.com" : "Lichess"} · ${speed.includes("all") ? "All time controls" : speed.join(", ")} · ${rangeLabel} · Depth ${safeDepth}`, percent: 0, phase: "fetch" });

      await runBrowserAnalysis(trimmed, safeGames, safeMoves, safeCpThreshold, safeDepth, safeSource, undefined, undefined, safeSince);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      if (/cannot reach lichess\.org|timed out|fetch failed|network/i.test(message)) {
        setError(
          "Neither your server nor browser can reach lichess.org right now (network timeout/block). Try disabling VPN/proxy, switching network, or retrying later."
        );
      } else {
        setError(message);
      }
      setState("error");
    }
  };

  /** Quick-switch: change scan mode and immediately re-run with the same settings */
  const quickScanMode = async (mode: ScanMode) => {
    const trimmed = username.trim();
    if (!trimmed || !lastRunConfig) return;
    setScanMode(mode);
    setLastRunConfig({ ...lastRunConfig, scanMode: mode, speed: lastRunConfig.speed ?? speed });
    setState("loading");
    setError("");
    setNotice("");
    setResult(null);
    setSaveStatus("idle");
    setProgressInfo({ message: `🔄 Switching to ${mode} scan`, detail: "Re-analyzing with new scan mode...", percent: 0, phase: "fetch" });
    try {
      await runBrowserAnalysis(
        trimmed,
        lastRunConfig.maxGames,
        lastRunConfig.maxMoves,
        lastRunConfig.cpThreshold,
        lastRunConfig.engineDepth,
        lastRunConfig.source,
        `Running ${mode} scan for ${trimmed}...`,
        mode
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
      setState("error");
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Animated floating orbs — hidden during puzzle solving for drag perf */}
      <div className={`pointer-events-none fixed inset-0 z-0 overflow-hidden transition-opacity duration-300 ${puzzleBoardOpen ? "opacity-0" : ""}`} style={puzzleBoardOpen ? { display: "none" } : undefined}>
        <div className="animate-float absolute -left-32 top-20 h-96 w-96 rounded-full bg-emerald-500/[0.07] blur-[100px] will-change-transform" />
        <div className="animate-float-delayed absolute -right-32 top-40 h-80 w-80 rounded-full bg-cyan-500/[0.06] blur-[100px] will-change-transform" />
        <div className="animate-float absolute bottom-20 left-1/3 h-72 w-72 rounded-full bg-fuchsia-500/[0.05] blur-[100px] will-change-transform" />
        <div className="animate-float-delayed absolute right-1/4 top-1/2 h-64 w-64 rounded-full bg-emerald-500/[0.04] blur-[80px] will-change-transform" />
      </div>

      <div className="relative z-10 px-4 py-12 sm:px-6 md:px-10">
        <section className="mx-auto w-full max-w-6xl space-y-16 overflow-x-hidden">

          {/* ─── Hero Section ─── */}
          <header className="animate-fade-in-up space-y-8 text-center">
            <div className={`flex items-center justify-center gap-3 ${heroAnim(1)}`}>
              <Link
                href="/pricing"
                className="tag-emerald group gap-2 hover:shadow-glow-sm"
              >
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Upgrade to Pro
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="transition-transform group-hover:translate-x-0.5"><path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
            </div>

            <div className="space-y-4">
              <div className={`flex flex-wrap items-center justify-center gap-3 ${heroAnim(1)}`}>
                <span className="tag-fuchsia">
                  <span className="text-sm">🔥</span> FireChess
                </span>
                <span className="tag-emerald">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                  Powered by Stockfish 18
                </span>
                <a
                  href="https://www.youtube.com/watch?v=MpWsW10YE5M"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tag-emerald cursor-pointer gap-1.5 transition-all hover:shadow-glow-sm active:scale-95 no-underline"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  Watch Trailer
                </a>
              </div>

              <h1 className="mx-auto max-w-4xl text-4xl font-black leading-[1.1] tracking-tight md:text-6xl lg:text-7xl">
                <span className={`block text-white ${heroAnim(2)}`}>Stop making the </span>
                <span className={`block gradient-text ${heroAnim(3)}`}>same mistakes.</span>
              </h1>

              <p className={`mx-auto max-w-2xl text-base text-slate-400 md:text-lg ${heroAnim(4)}`}>
                FireChess scans your <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text font-semibold text-transparent">openings</span>, <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text font-semibold text-transparent">tactics</span>, and <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text font-semibold text-transparent">endgames</span> — finds the mistakes you keep repeating, explains the better move, and drills you until the fix sticks.
              </p>
            </div>

            <div className={heroAnim(5)}>
              <HeroDemoBoard paused={puzzleBoardOpen} userLeaks={heroLeaks} />
            </div>
          </header>

          {/* ─── Loading State ─── */}
          {state === "loading" && (
            <div className="glass-card animate-scale-in mx-auto w-full max-w-3xl p-6">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                  <svg className="h-5 w-5 animate-spin text-emerald-400" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white">{progressInfo.message || "Preparing analysis..."}</p>
                  {progressInfo.detail && (
                    <p className="truncate text-sm text-slate-400">{progressInfo.detail}</p>
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
                  { key: "fetch", label: "Download", icon: "🌐" },
                  { key: "parse", label: "Parse", icon: "📖" },
                  { key: "eval",  label: "Evaluate", icon: "🧠" },
                  { key: "tactics", label: "Tactics", icon: "⚔️" },
                  { key: "endgames", label: "Endgames", icon: "♟️" },
                  { key: "done",  label: "Done", icon: "✅" },
                ].map((step) => {
                  const phases = ["fetch", "parse", "aggregate", "eval", "tactics", "endgames", "done"];
                  const currentIdx = phases.indexOf(progressInfo.phase);
                  const stepIdx = phases.indexOf(step.key);
                  const isActive = step.key === progressInfo.phase || (step.key === "eval" && progressInfo.phase === "aggregate");
                  const isComplete = currentIdx > stepIdx || (step.key === "eval" && (progressInfo.phase === "tactics" || progressInfo.phase === "endgames"));
                  return (
                    <div key={step.key} className={`flex flex-col items-center gap-1 transition-colors ${
                      isActive ? "text-emerald-400" : isComplete ? "text-slate-400" : "text-slate-500"
                    }`}>
                      <span className="text-sm">{step.icon}</span>
                      <span>{step.label}</span>
                      {isActive && <span className="mt-0.5 h-0.5 w-4 rounded-full bg-emerald-400" />}
                      {isComplete && <span className="mt-0.5 h-0.5 w-4 rounded-full bg-slate-500" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── Control Center ─── */}
          <form
            onSubmit={onSubmit}
            className="glass-card animate-fade-in-up mx-auto w-full max-w-5xl space-y-6 p-6 md:p-8"
          >
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-sm">⚡</span>
                  Control Center
                </h2>
                <p className="mt-1 text-sm text-slate-400">Configure your scan parameters</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
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
            </div>

            {/* Welcome back prompt */}
            {welcomeBack && state === "idle" && !result && (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.05] px-4 py-3">
                <span className="text-lg">👋</span>
                <p className="flex-1 text-sm text-slate-300">
                  Welcome back! Ready to scan <span className="font-semibold text-white">{welcomeBack}</span> again?
                </p>
                <button
                  type="button"
                  onClick={() => setWelcomeBack(null)}
                  className="text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label="Dismiss"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            )}

            {/* Search bar */}
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-slate-500" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your Lichess or Chess.com username"
                  aria-label="Chess username"
                  className="glass-input pl-11"
                />
              </div>
              <button
                type="submit"
                disabled={state === "loading" || freeLimitsExceeded}
                className="btn-primary flex items-center justify-center gap-2"
              >
                {state === "loading" ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Scanning...
                  </>
                ) : freeLimitsExceeded ? (
                  <Link href="/pricing" className="text-inherit no-underline">Upgrade for Pro limits</Link>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                    Scan Games
                  </>
                )}
              </button>
            </div>

            {/* Scan mode toggle */}
            <div className="stat-card space-y-2 p-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Scan Mode<HelpTip text="Choose what to analyze: openings finds repeated patterns, tactics finds missed forcing moves, endgames checks your technique, and time management analyses your clock usage." /></span>
                {!hasProAccess && (
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">Full tactics = Pro</span>
                )}
              </div>
              <div className="grid h-auto grid-cols-2 gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1 sm:h-10 sm:grid-cols-4">
                <button
                  type="button"
                  onClick={() => setScanMode("openings")}
                  className={`rounded-md text-xs font-semibold transition-all duration-200 ${
                    scanMode === "openings"
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 shadow-glow-sm"
                      : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                  }`}
                >
                  📖 Openings
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScanMode("tactics");
                  }}
                  className={`relative rounded-md text-xs font-semibold transition-all duration-200 ${
                    scanMode === "tactics"
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-glow-sm"
                      : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                  }`}
                >
                  ⚡ Tactics
                  {!hasProAccess && <span className="ml-0.5 text-[9px] text-amber-400/60">sample</span>}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScanMode("endgames");
                  }}
                  className={`relative rounded-md text-xs font-semibold transition-all duration-200 ${
                    scanMode === "endgames"
                      ? "bg-gradient-to-r from-sky-500 to-sky-600 text-slate-950 shadow-glow-sm"
                      : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                  }`}
                >
                  ♟️ Endgames
                  {!hasProAccess && <span className="ml-0.5 text-[9px] text-sky-400/60">sample</span>}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScanMode("time-management");
                  }}
                  className={`relative rounded-md text-xs font-semibold transition-all duration-200 ${
                    scanMode === "time-management"
                      ? "bg-gradient-to-r from-violet-500 to-violet-600 text-white shadow-glow-sm"
                      : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                  }`}
                >
                  ⏱️ Time
                </button>
              </div>
              <p className="text-xs text-slate-500">
                {scanMode === "openings" && (includeTactics ? "Opening patterns + missed tactics — slower but more thorough" : "Finds repeated patterns in your first N moves")}
                {scanMode === "tactics" && (hasProAccess ? "Scans full games for missed forcing moves (slower)" : `Scans for missed tactics — free users see up to ${FREE_TACTIC_SAMPLE} results`)}
                {scanMode === "endgames" && (hasProAccess ? "Analyses your endgame technique — conversions, holds & accuracy" : `Analyses endgame technique — free users see up to ${FREE_ENDGAME_SAMPLE} results`)}
                {scanMode === "time-management" && "Analyses your clock usage — finds rushed moves, wasted time, and time scrambles"}
              </p>

              {/* Tactics toggle — visible only in openings mode */}
              {scanMode === "openings" && (
                <label className="mt-1.5 flex cursor-pointer items-center gap-2 select-none">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={includeTactics}
                      onChange={() => setIncludeTactics((v) => !v)}
                      className="peer sr-only"
                    />
                    <div className="h-5 w-9 rounded-full bg-white/[0.08] transition-colors peer-checked:bg-amber-500/60" />
                    <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-slate-300 transition-transform peer-checked:translate-x-4 peer-checked:bg-white" />
                  </div>
                  <span className="text-xs text-slate-400">
                    Also scan for tactics
                    {!hasProAccess && <span className="ml-1 text-amber-400/60">(sample)</span>}
                  </span>
                </label>
              )}
            </div>

            {/* Settings grid — row 1: toggles, row 2: number inputs */}
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="stat-card space-y-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Source<HelpTip text="Which chess platform to fetch your games from. Your username must match the platform you select." /></span>
                  <div className={`grid h-10 grid-cols-2 gap-1 rounded-lg border p-1 transition-colors duration-200 ${
                    !source
                      ? "border-amber-500/30 bg-amber-500/[0.06] ring-1 ring-amber-500/20"
                      : "border-white/[0.06] bg-white/[0.02]"
                  }`}>
                    <button
                      type="button"
                      onClick={() => setSource("lichess")}
                      className={`rounded-md text-xs font-semibold transition-all duration-200 ${
                        source === "lichess"
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 shadow-glow-sm"
                          : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                      }`}
                    >
                      Lichess
                    </button>
                    <button
                      type="button"
                      onClick={() => setSource("chesscom")}
                      className={`rounded-md text-xs font-semibold transition-all duration-200 ${
                        source === "chesscom"
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 shadow-glow-sm"
                          : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                      }`}
                    >
                      Chess.com
                    </button>
                  </div>
                  {!source && (
                    <p className="text-[11px] font-medium text-amber-400/80">← Pick your platform</p>
                  )}
                </div>

                <div className="stat-card space-y-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Time Control<HelpTip text="Filter which game speeds to include. Pick specific ones or All. Multi-select is supported — click multiple to combine." /></span>
                  <div className="grid h-auto grid-cols-3 gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1 sm:h-10 sm:grid-cols-5">
                    {([
                      { value: "all" as const, label: "All" },
                      { value: "bullet" as const, label: "Bullet" },
                      { value: "blitz" as const, label: "Blitz" },
                      { value: "rapid" as const, label: "Rapid" },
                      { value: "classical" as const, label: "Classical" },
                    ]).map((tc) => {
                      const isActive = speed.includes(tc.value);
                      return (
                        <button
                          key={tc.value}
                          type="button"
                          onClick={() => {
                            if (tc.value === "all") {
                              // "All" resets to just ["all"]
                              setSpeed(["all"]);
                            } else {
                              setSpeed((prev) => {
                                const withoutAll = prev.filter((s) => s !== "all");
                                const next = withoutAll.includes(tc.value)
                                  ? withoutAll.filter((s) => s !== tc.value)
                                  : [...withoutAll, tc.value];
                                // If nothing selected or all 4 specific ones selected, reset to "all"
                                return next.length === 0 || next.length === 4 ? ["all"] : next;
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
                    <p className="text-[10px] text-slate-500">{speed.length} time controls selected</p>
                  )}
                </div>
              </div>

              <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                <div className="stat-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Games<HelpTip text="How many recent games to scan (Last N), or pick a start date (Since) to include all games from that point." /></span>
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
                        Since
                      </button>
                    </div>
                  </div>
                  {gameRangeMode === "count" ? (
                    <input
                      type="number"
                      min={1}
                      max={hasProAccess ? 5000 : 300}
                      value={gameCount}
                      onChange={(e) => setGameCount(Number(e.target.value))}
                      aria-label="Number of games to scan"
                      className="glass-input h-10 text-sm"
                    />
                  ) : (
                    <input
                      type="date"
                      value={sinceDate}
                      onChange={(e) => setSinceDate(e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                      aria-label="Scan games since date"
                      className="glass-input h-10 text-sm"
                    />
                  )}
                  {gameRangeMode === "count" && gamesOverFreeLimit && (
                    <p className="text-xs font-medium text-amber-400">
                      {!hasProAccess ? (
                        <>Requires <Link href="/pricing" className="underline">Pro</Link></>
                      ) : gameCount > 1000 ? `${gameCount.toLocaleString()} games — may take a while` : "Unlocked"}
                    </p>
                  )}
                  {gameRangeMode === "since" && !sinceDate && (
                    <p className="text-[10px] text-slate-500">Pick a start date</p>
                  )}
                </div>

                <div className="stat-card space-y-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Moves<HelpTip text="How deep into the opening to scan (number of moves per side). Higher values catch later opening deviations but take longer." /></span>
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
                      Free capped at {FREE_MAX_MOVES}. <Link href="/pricing" className="underline">Upgrade</Link> for up to 40.
                    </p>
                  )}
                </div>

                <div className="stat-card space-y-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">CP Threshold<HelpTip text="Minimum centipawn loss to flag a move as a mistake. Lower = stricter (catches inaccuracies). Default 50cp works well for most players." /></span>
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
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Depth<HelpTip text="Stockfish engine search depth. Higher = more accurate but slower. 12 is good for quick scans, 18+ for serious analysis. Pro unlocks up to 24." /></span>
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
                        <>Requires <Link href="/pricing" className="underline">Pro</Link></>
                      ) : "Unlocked"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </form>

          {/* ─── Feature Pills ─── */}
          <section className="animate-fade-in mx-auto grid w-full max-w-5xl gap-4 sm:grid-cols-3">
            {[
              { icon: "🎯", title: "Pattern Detection", desc: "Spots positions you keep reaching and misplaying" },
              { icon: "🧠", title: "Move Explanations", desc: "Shows why the engine move is superior to yours" },
              { icon: "📸", title: "Share-Ready Reports", desc: "Screenshot-worthy performance analytics card" },
            ].map((feature) => (
              <div key={feature.title} className="glass-card-hover group flex items-start gap-4 p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-xl transition-transform group-hover:scale-110">
                  {feature.icon}
                </span>
                <div>
                  <h3 className="font-semibold text-slate-100">{feature.title}</h3>
                  <p className="mt-0.5 text-sm text-slate-400">{feature.desc}</p>
                </div>
              </div>
            ))}
          </section>

          {/* ─── Training CTA ─── */}
          {state === "idle" && (
            <section className="animate-fade-in mx-auto w-full max-w-5xl">
              <Link
                href="/train"
                className="group relative block overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-fuchsia-500/[0.08] via-transparent to-cyan-500/[0.08] p-8 transition-all hover:border-white/[0.15] hover:shadow-lg hover:shadow-fuchsia-500/[0.06] sm:p-10"
              >
                <div className="relative z-10 flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-cyan-500/20 text-3xl transition-transform group-hover:scale-110">
                    🎯
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white sm:text-2xl">Training Center</h3>
                    <p className="mt-1 text-sm text-slate-400 sm:text-base">
                      5 modes that drill your real weaknesses — from tactic puzzles to opening leaks to endgame practice. Sign in and run a scan to unlock personalized training.
                    </p>
                    <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                      {["Weakness Trainer", "Speed Drill", "Blunder Spotter", "Opening Trainer", "Endgame Gym"].map((m) => (
                        <span key={m} className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 text-[11px] font-medium text-slate-300">{m}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all group-hover:shadow-fuchsia-500/25 group-hover:scale-105">
                    Start Training
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
                {/* Decorative glow */}
                <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-fuchsia-500/[0.06] blur-[80px] transition-opacity group-hover:opacity-100 opacity-50" />
                <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-cyan-500/[0.06] blur-[80px] transition-opacity group-hover:opacity-100 opacity-50" />
              </Link>
            </section>
          )}

          {/* ─── Testimonials ─── */}
          {state === "idle" && (
            <section className="animate-fade-in mx-auto w-full max-w-5xl space-y-6">
              <div className="text-center">
                <h2 className="text-lg font-bold text-white">Loved by chess players</h2>
                <p className="mt-1 text-sm text-slate-400">See what players are saying after scanning their games</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    name: "Marcus R.",
                    handle: "@marcus_chess",
                    platform: "𝕏",
                    rating: "1847 Lichess",
                    avatar: "♔",
                    text: "I kept losing in the Caro-Kann exchange and had no idea why. FireChess showed me I was misplaying the same pawn structure in 14 of my last 50 games. Fixed it, gained 80 elo in a week.",
                    time: "2d",
                  },
                  {
                    name: "Sophie L.",
                    handle: "@sophplays",
                    platform: "𝕏",
                    rating: "1523 Chess.com",
                    avatar: "♕",
                    text: "The drill mode is addictive. It pulls your actual blunders and makes you solve them. Way better than random puzzles because these are YOUR mistakes. 10/10 would recommend.",
                    time: "5d",
                  },
                  {
                    name: "Arjun P.",
                    handle: "@arjun_blitz",
                    platform: "𝕏",
                    rating: "2103 Lichess",
                    avatar: "♘",
                    text: "The tactical eye radar metric called me out hard. I thought I was sharp but I was hanging pieces in 23% of my games. The endgame scanner is a game-changer too.",
                    time: "1w",
                  },
                  {
                    name: "montgomery_r",
                    handle: "Hacker News",
                    platform: "HN",
                    rating: "",
                    avatar: "♗",
                    text: "Brilliant idea, really useful — I've often thought 'I wonder what my better move is in this oft-repeated opening' and this tells me. The radar was surprising too — it told me my play falls off a cliff when I'm in a worse position. I would have guessed I'm quite good at battling on, so that was an eye opener.",
                    time: "2h",
                  },
                  {
                    name: "James K.",
                    handle: "@jk_pawns",
                    platform: "𝕏",
                    rating: "1680 Lichess",
                    avatar: "♖",
                    text: "Scanned 200 of my rapid games and found I lose 90% of my rook endgames. The endgame drills alone made the Pro upgrade worth it. My conversion rate already feels better.",
                    time: "4d",
                  },
                  {
                    name: "Priya S.",
                    handle: "@priya_chess64",
                    platform: "𝕏",
                    rating: "1410 Chess.com",
                    avatar: "♚",
                    text: "I showed my coach the radar chart and he was impressed. Said it gave a better overview of my weaknesses than he could describe in words. Using it to guide our lessons now.",
                    time: "1w",
                  },
                ].map((t, i) => (
                  <div
                    key={t.handle}
                    className="glass-card-hover space-y-3 p-5 transition-all"
                  >
                    {/* Author row */}
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-lg">
                        {t.avatar}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-slate-100">{t.name}</span>
                          <span className="text-[10px] text-slate-500">{t.platform}</span>
                        </div>
                        <p className="text-xs text-slate-500">{t.handle}{t.rating ? ` · ${t.rating}` : ""}</p>
                      </div>
                      <span className="text-[10px] text-slate-500">{t.time}</span>
                    </div>
                    {/* Body */}
                    <p className="text-[13px] leading-relaxed text-slate-300">{t.text}</p>
                    {/* Engagement row */}
                    <div className="flex items-center gap-4 pt-1 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                        {[34, 19, 47, 28, 41, 15][i]}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" /></svg>
                        {[5, 3, 7, 2, 6, 4][i]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ─── Notice ─── */}
          {notice && state !== "loading" && (
            <div className="glass-card animate-fade-in border-amber-500/20 p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">⚡</span>
                <p className="text-sm text-amber-200">{notice}</p>
              </div>
            </div>
          )}

          {/* ─── Error ─── */}
          {state === "error" && (
            <div className="glass-card animate-scale-in border-red-500/20 p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-400">✕</span>
                <p className="text-sm text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* ─── Toast ─── */}
          {toast && (
            <div className="fixed bottom-6 left-1/2 z-[9999] -translate-x-1/2 animate-fade-in">
              <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-slate-900/95 px-5 py-3 shadow-2xl backdrop-blur-sm">
                <span className="text-sm font-medium text-emerald-300">{toast}</span>
                <button type="button" onClick={() => setToast(null)} className="ml-1 text-slate-500 hover:text-slate-300 transition-colors" aria-label="Close notification">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
          )}

          {/* ─── Daily Login Popup ─── */}
          {state !== "loading" && authenticated && (
            <DailyLoginPopup />
          )}

          {/* ─── Results ─── */}
          {state === "done" && result && (
            <section ref={reportRef} className="animate-fade-in-up space-y-8">

              {/* Report Heading + Action Bar */}
              <div className="space-y-5">
                <div className="text-center">
                  <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                    Analysis for <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">{result.username}</span>
                  </h2>
                  <p className="mt-2 text-sm text-slate-400">
                    {result.gamesAnalyzed} games scanned{result.playerRating ? ` · ${result.playerRating} rated` : ""} · {result.leaks.length} opening leak{result.leaks.length !== 1 ? "s" : ""} · {result.missedTactics.length} missed tactic{result.missedTactics.length !== 1 ? "s" : ""}{result.endgameMistakes.length > 0 ? ` · ${result.endgameMistakes.length} endgame mistake${result.endgameMistakes.length !== 1 ? "s" : ""}` : ""}
                  </p>
                </div>

                {/* Action Bar */}
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  {/* Save to Dashboard */}
                  {saveStatus === "saved" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-400">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      Saved
                    </span>
                  ) : saveStatus === "duplicate" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-400">
                      Already saved
                    </span>
                  ) : saveStatus === "saving" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 px-4 py-2.5 text-sm text-white/40">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
                        <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      Saving…
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (!authenticated) { window.location.href = "/auth/signin"; return; }
                        saveReportToAccount();
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-400 transition-all hover:border-emerald-500/40 hover:bg-emerald-500/20 hover:shadow-glow-sm"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                      {authenticated ? "Save to Dashboard" : "Sign in to Save"}
                    </button>
                  )}

                  {/* Divider */}
                  <span className="hidden h-6 w-px bg-white/10 sm:block" />

                  {/* Share on X / Twitter */}
                  <button
                    type="button"
                    onClick={() => {
                      const text = `🔥 My FireChess analysis: ${report ? `${report.estimatedAccuracy.toFixed(1)}% accuracy` : `${result.gamesAnalyzed} games scanned`}${result.playerRating ? ` (${result.playerRating} rated)` : ""} — ${result.leaks.length} opening leaks, ${result.missedTactics.length} missed tactics found\n\nScan your games free at`;
                      const url = "https://firechess.com";
                      window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank", "noopener");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-300 transition-all hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                    Share
                  </button>

                  {/* Share on Reddit */}
                  <button
                    type="button"
                    onClick={() => {
                      const title = `My FireChess Analysis: ${report ? `${report.estimatedAccuracy.toFixed(1)}% accuracy` : `${result.gamesAnalyzed} games`}${result.playerRating ? ` (${result.playerRating})` : ""} — ${result.leaks.length} leaks, ${result.missedTactics.length} missed tactics`;
                      window.open(`https://www.reddit.com/submit?url=${encodeURIComponent("https://firechess.com")}&title=${encodeURIComponent(title)}`, "_blank", "noopener");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-300 transition-all hover:border-orange-500/30 hover:bg-orange-500/[0.08] hover:text-orange-400"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" /></svg>
                    Reddit
                  </button>

                  {/* Copy Link */}
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      setCopyLinkLabel("Copied!");
                      setTimeout(() => setCopyLinkLabel("Copy Link"), 1500);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-300 transition-all hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                    {copyLinkLabel}
                  </button>

                  {/* Download PNG */}
                  <button
                    type="button"
                    onClick={async () => {
                      const el = pngRef.current;
                      if (!el) return;
                      const btn = document.activeElement as HTMLButtonElement;
                      const origHTML = btn?.innerHTML;
                      if (btn) btn.innerHTML = `<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-20"/><path d="M12 2a10 10 0 019.95 9" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg> Generating…`;
                      try {
                        const html2canvas = (await import("html2canvas-pro")).default;
                        const canvas = await html2canvas(el, {
                          backgroundColor: "#0b1120",
                          scale: 2,
                          useCORS: true,
                          logging: false,
                        });
                        const link = document.createElement("a");
                        link.download = `firechess-${result.username}-report.png`;
                        link.href = canvas.toDataURL("image/png");
                        link.click();
                      } catch (e) {
                        console.error("PNG export failed:", e);
                      } finally {
                        if (btn && origHTML) btn.innerHTML = origHTML;
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/[0.08] px-4 py-2.5 text-sm font-medium text-fuchsia-400 transition-all hover:border-fuchsia-500/40 hover:bg-fuchsia-500/15 hover:shadow-glow-sm"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download PNG
                  </button>

                  {/* Share Report Card (Canvas-generated image) */}
                  {report && (
                    <button
                      type="button"
                      onClick={() => {
                        shareReportCard({
                          username: result.username,
                          source: lastRunConfig?.source ?? "lichess",
                          accuracy: report.estimatedAccuracy,
                          estimatedRating: report.estimatedRating,
                          avgCpLoss: report.weightedCpLoss,
                          severeLeakRate: report.severeLeakRate,
                          gamesAnalyzed: result.gamesAnalyzed,
                          leakCount: result.leaks.length,
                          tacticsCount: result.missedTactics.length,
                          vibeTitle: report.vibeTitle,
                        });
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 px-4 py-2.5 text-sm font-medium text-violet-300 transition-all hover:border-violet-500/40 hover:from-violet-500/15 hover:to-fuchsia-500/15 hover:text-violet-200 hover:shadow-glow-sm"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16l4 4m0 0l4-4m-4 4V4m14 4l-4-4m0 0l-4 4m4-4v16" /></svg>
                      Share Card
                    </button>
                  )}
                </div>
              </div>

              {/* ── PNG-exportable region ── */}
              <div ref={pngRef} className="space-y-8">

              {/* Report Card */}
              {report && (
                <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] p-6 md:p-8">
                  {/* Decorative gradient background */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-fuchsia-500/[0.08] via-emerald-500/[0.05] to-cyan-500/[0.08]" />
                  <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-fuchsia-500/10 blur-[60px]" />
                  <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-[60px]" />

                  <div className="relative">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="text-xl font-bold text-white">Opening Report</h2>
                      <div className="flex flex-wrap gap-2">
                        <span className="tag-fuchsia">{report.vibeTitle}</span>
                        <span className="tag-emerald">Stockfish 18</span>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-4">
                      {[
                        { label: "Accuracy", value: `${report.estimatedAccuracy.toFixed(1)}%`, color: "text-emerald-400", help: "How closely your opening moves matched the engine's top choice, weighted by position importance." },
                        { label: "Est. Rating", value: report.estimatedRating.toString(), color: "text-emerald-400", help: "Estimated Elo rating based on your opening play quality. Derived from accuracy and eval loss patterns." },
                        { label: "Avg Eval Loss", value: (report.weightedCpLoss / 100).toFixed(2), color: "text-emerald-400", help: "Average centipawn loss per move. Lower is better — 0.00 means you played the engine's top choice every time." },
                        { label: "Leak Rate", value: `${(report.severeLeakRate * 100).toFixed(0)}%`, color: "text-red-400", help: "Percentage of moves that were significant mistakes (losing ≥ the CP threshold). Lower is better." },
                      ].map((stat) => (
                        <div key={stat.label} className="stat-card">
                          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{stat.label}<HelpTip text={stat.help} /></p>
                          <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-4">
                      {[
                        { label: "Consistency", value: `${report.consistencyScore}/100`, color: "text-cyan-400", help: "How steady your play is across all positions. 100 = perfectly uniform; lower scores mean erratic swings." },
                        { label: "Peak Throw", value: (report.p75CpLoss / 100).toFixed(2), color: "text-cyan-400", help: "75th-percentile eval loss — captures your worst tendencies while ignoring rare outliers." },
                        { label: "Confidence", value: `${report.confidence}%`, color: "text-cyan-400", help: "Statistical confidence in these results. More games analyzed = higher confidence." },
                        { label: "Main Pattern", value: report.topTag, color: "text-fuchsia-400", small: true, help: "The most frequent weakness pattern detected across your opening positions." },
                      ].map((stat) => (
                        <div key={stat.label} className="stat-card">
                          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{stat.label}<HelpTip text={stat.help} /></p>
                          <p className={`mt-1 font-bold ${stat.color} ${"small" in stat ? "text-sm" : "text-2xl"}`}>{stat.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="section-divider mt-6" />
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-slate-500">
                        Based on {report.sampleSize} positions &middot; Opening pattern estimates
                      </p>
                      <p className="text-xs text-fuchsia-400/80">✦ Screenshot this card for your chess recap</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Strengths Radar */}
              {report && result && (
                <div className="glass-card p-6">
                  <div className="mb-4">
                    <h2 className="text-lg font-bold text-white">Strengths & Weaknesses</h2>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <StrengthsRadar
                      accuracy={report.estimatedAccuracy}
                      leakCount={realLeakCount}
                      repeatedPositions={result.repeatedPositions}
                      tacticsCount={result.totalTacticsFound}
                      gamesAnalyzed={result.gamesAnalyzed}
                      weightedCpLoss={report.weightedCpLoss}
                      severeLeakRate={report.severeLeakRate}
                      timeManagementScore={result.timeManagementScore}
                    />
                    <RadarLegend
                      data={computeRadarData({
                        accuracy: report.estimatedAccuracy,
                        leakCount: realLeakCount,
                        repeatedPositions: result.repeatedPositions,
                        tacticsCount: result.totalTacticsFound,
                        gamesAnalyzed: result.gamesAnalyzed,
                        weightedCpLoss: report.weightedCpLoss,
                        severeLeakRate: report.severeLeakRate,
                        timeManagementScore: result.timeManagementScore,
                      })}
                      props={{
                        accuracy: report.estimatedAccuracy,
                        leakCount: realLeakCount,
                        repeatedPositions: result.repeatedPositions,
                        tacticsCount: result.totalTacticsFound,
                        gamesAnalyzed: result.gamesAnalyzed,
                        weightedCpLoss: report.weightedCpLoss,
                        severeLeakRate: report.severeLeakRate,
                        timeManagementScore: result.timeManagementScore,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Deep Analysis — 6 Insight Cards */}
              {result && report && (
                <InsightCards
                  data={computeRadarData({
                    accuracy: report.estimatedAccuracy,
                    leakCount: realLeakCount,
                    repeatedPositions: result.repeatedPositions,
                    tacticsCount: result.totalTacticsFound,
                    gamesAnalyzed: result.gamesAnalyzed,
                    weightedCpLoss: report.weightedCpLoss,
                    severeLeakRate: report.severeLeakRate,
                    timeManagementScore: result.timeManagementScore,
                  })}
                  props={{
                    accuracy: report.estimatedAccuracy,
                    leakCount: realLeakCount,
                    repeatedPositions: result.repeatedPositions,
                    tacticsCount: result.totalTacticsFound,
                    gamesAnalyzed: result.gamesAnalyzed,
                    weightedCpLoss: report.weightedCpLoss,
                    severeLeakRate: report.severeLeakRate,
                    timeManagementScore: result.timeManagementScore,
                  }}
                  hasProAccess={hasProAccess}
                />
              )}

              {/* Mental / Psychology Stats */}
              {result?.mentalStats && (
                <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] p-6 md:p-8">
                  {/* Decorative gradient background */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/[0.08] via-amber-500/[0.05] to-rose-500/[0.08]" />
                  <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-violet-500/10 blur-[60px]" />
                  <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-amber-500/10 blur-[60px]" />

                  <div className="relative">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="text-xl font-bold text-white">Mental Game</h2>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/20 bg-violet-500/[0.08] px-3 py-1 text-xs font-medium text-violet-400">🧠 Psychology</span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-500/20 bg-slate-500/[0.08] px-3 py-1 text-xs font-medium text-slate-400">{result.mentalStats.totalGames} games · {result.mentalStats.wins}W {result.mentalStats.losses}L {result.mentalStats.draws}D</span>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      {[
                        {
                          icon: "🧘",
                          label: "Stability",
                          value: `${result.mentalStats.stability}`,
                          sub: result.mentalStats.stability >= 70 ? "Steady" : result.mentalStats.stability >= 40 ? "Average" : "Volatile",
                          color: result.mentalStats.stability >= 70 ? "text-emerald-400" : result.mentalStats.stability >= 40 ? "text-amber-400" : "text-red-400",
                          help: "Mental consistency between games. High = predictable performance, low = varies greatly between sessions.",
                        },
                        {
                          icon: "🌡️",
                          label: "Tilt",
                          value: `${result.mentalStats.tiltRate}%`,
                          sub: result.mentalStats.tiltRate <= 30 ? "Resilient" : result.mentalStats.tiltRate <= 50 ? "Moderate" : "Tilts Often",
                          color: result.mentalStats.tiltRate <= 30 ? "text-emerald-400" : result.mentalStats.tiltRate <= 50 ? "text-amber-400" : "text-red-400",
                          help: "How often a loss is immediately followed by another loss. Lower is better — means you recover well.",
                        },
                        {
                          icon: "💪",
                          label: "Post-Loss",
                          value: `${result.mentalStats.postLossWinRate}%`,
                          sub: result.mentalStats.postLossWinRate >= 40 ? "Recovers" : result.mentalStats.postLossWinRate >= 25 ? "Struggles" : "Spirals",
                          color: result.mentalStats.postLossWinRate >= 40 ? "text-emerald-400" : result.mentalStats.postLossWinRate >= 25 ? "text-amber-400" : "text-red-400",
                          help: "Win rate in the game immediately after a loss. High = strong bounce-back ability.",
                        },
                      ].map((stat) => (
                        <div key={stat.label} className="stat-card">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{stat.icon}</span>
                            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{stat.label}<HelpTip text={stat.help} /></p>
                          </div>
                          <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                          <p className={`mt-0.5 text-xs ${stat.color} opacity-70`}>{stat.sub}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      {[
                        {
                          icon: "⏱️",
                          label: "Timeouts",
                          value: `${result.mentalStats.timeoutRate}%`,
                          sub: result.mentalStats.timeoutRate <= 5 ? "Rare" : result.mentalStats.timeoutRate <= 15 ? "Sometimes" : "Frequent",
                          color: result.mentalStats.timeoutRate <= 5 ? "text-cyan-400" : result.mentalStats.timeoutRate <= 15 ? "text-amber-400" : "text-red-400",
                          help: "Percentage of games lost on time. High = possible time management issue.",
                        },
                        {
                          icon: "🔥",
                          label: "Max Streak",
                          value: `${result.mentalStats.maxStreak}`,
                          sub: (() => {
                            const s = result.mentalStats!;
                            const tag = s.streakType === "win" ? "Win" : "Loss";
                            if (s.maxStreak <= 4) return `${tag} · Normal`;
                            if (s.maxStreak <= 8) return `${tag} · Notable`;
                            return `${tag} · Extreme`;
                          })(),
                          color: result.mentalStats.streakType === "win" ? "text-emerald-400" : "text-red-400",
                          help: "Longest consecutive win or loss streak across the analysed games.",
                        },
                        {
                          icon: "🏳️",
                          label: "Resigns",
                          value: `${result.mentalStats.resignRate}%`,
                          sub: result.mentalStats.resignRate <= 50 ? "Fights On" : result.mentalStats.resignRate <= 75 ? "Normal" : "Quick Quitter",
                          color: result.mentalStats.resignRate <= 50 ? "text-cyan-400" : result.mentalStats.resignRate <= 75 ? "text-amber-400" : "text-red-400",
                          help: "Percentage of losses that ended in resignation. Very high may indicate giving up too early.",
                        },
                      ].map((stat) => (
                        <div key={stat.label} className="stat-card">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{stat.icon}</span>
                            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{stat.label}<HelpTip text={stat.help} /></p>
                          </div>
                          <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                          <p className={`mt-0.5 text-xs ${stat.color} opacity-70`}>{stat.sub}</p>
                        </div>
                      ))}
                    </div>

                    {/* ── Pro-only Advanced Breakdowns ── */}
                    {hasProAccess && (() => {
                      const ms = result.mentalStats!;
                      return (
                        <>
                          {/* Archetype + Recent Form */}
                          <div className="mt-5 flex flex-wrap items-center gap-3">
                            {ms.archetype && (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/[0.1] px-4 py-1.5 text-sm font-semibold text-violet-300">
                                {ms.archetype}
                              </span>
                            )}
                            {ms.recentForm && ms.recentForm.length > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="mr-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">Last {ms.recentForm.length}</span>
                                {ms.recentForm.map((r, i) => (
                                  <span
                                    key={i}
                                    className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${
                                      r === "W" ? "bg-emerald-500/20 text-emerald-400"
                                      : r === "L" ? "bg-red-500/20 text-red-400"
                                      : "bg-slate-500/20 text-slate-400"
                                    }`}
                                  >
                                    {r}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Color Breakdown */}
                          <div className="mt-4">
                            <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-slate-500">Color Performance</p>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm">♔</div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400">White · {ms.whiteGames ?? 0} games</span>
                                    <span className={`text-sm font-bold ${(ms.whiteWinRate ?? 0) >= 55 ? "text-emerald-400" : (ms.whiteWinRate ?? 0) >= 45 ? "text-amber-400" : "text-red-400"}`}>{ms.whiteWinRate ?? 0}%</span>
                                  </div>
                                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                                    <div className="h-full rounded-full bg-white/60 transition-all" style={{ width: `${ms.whiteWinRate ?? 0}%` }} />
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-700/50 text-sm">♚</div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400">Black · {ms.blackGames ?? 0} games</span>
                                    <span className={`text-sm font-bold ${(ms.blackWinRate ?? 0) >= 55 ? "text-emerald-400" : (ms.blackWinRate ?? 0) >= 45 ? "text-amber-400" : "text-red-400"}`}>{ms.blackWinRate ?? 0}%</span>
                                  </div>
                                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                                    <div className="h-full rounded-full bg-slate-400/60 transition-all" style={{ width: `${ms.blackWinRate ?? 0}%` }} />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Deep Breakdown Stats */}
                          <div className="mt-4">
                            <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-slate-500">Deep Breakdown</p>
                            <div className="grid gap-3 sm:grid-cols-4">
                              {[
                                {
                                  icon: "🚀",
                                  label: "Momentum",
                                  value: `${ms.postWinWinRate ?? 0}%`,
                                  sub: (ms.postWinWinRate ?? 0) >= 55 ? "Snowballs" : (ms.postWinWinRate ?? 0) >= 40 ? "Steady" : "Resets",
                                  color: (ms.postWinWinRate ?? 0) >= 55 ? "text-emerald-400" : (ms.postWinWinRate ?? 0) >= 40 ? "text-amber-400" : "text-red-400",
                                  help: "Win rate in the game after a win. High = you build momentum from victories.",
                                },
                                {
                                  icon: "💥",
                                  label: "Early Losses",
                                  value: `${ms.earlyLossRate ?? 0}%`,
                                  sub: (ms.earlyLossRate ?? 0) <= 15 ? "Rare" : (ms.earlyLossRate ?? 0) <= 30 ? "Some" : "Frequent",
                                  color: (ms.earlyLossRate ?? 0) <= 15 ? "text-emerald-400" : (ms.earlyLossRate ?? 0) <= 30 ? "text-amber-400" : "text-red-400",
                                  help: "Percentage of losses within the first 20 moves. High = early blunders or mental disengagement.",
                                },
                                {
                                  icon: "↩️",
                                  label: "Comebacks",
                                  value: `${ms.comebackRate ?? 0}%`,
                                  sub: (ms.comebackRate ?? 0) >= 60 ? "Fighter" : (ms.comebackRate ?? 0) >= 35 ? "Average" : "Gives Up",
                                  color: (ms.comebackRate ?? 0) >= 60 ? "text-emerald-400" : (ms.comebackRate ?? 0) >= 35 ? "text-amber-400" : "text-red-400",
                                  help: "Percentage of wins that required 30+ moves — proxy for fighting from worse positions.",
                                },
                                {
                                  icon: "⚔️",
                                  label: "Mate Finish",
                                  value: `${ms.mateFinishRate ?? 0}%`,
                                  sub: (ms.mateFinishRate ?? 0) >= 40 ? "Ruthless" : (ms.mateFinishRate ?? 0) >= 20 ? "Normal" : "Rare",
                                  color: (ms.mateFinishRate ?? 0) >= 40 ? "text-emerald-400" : (ms.mateFinishRate ?? 0) >= 20 ? "text-cyan-400" : "text-slate-400",
                                  help: "Percentage of wins that ended in checkmate vs opponent resigning or flagging.",
                                },
                              ].map((stat) => (
                                <div key={stat.label} className="stat-card">
                                  <div className="flex items-center gap-2">
                                    <span className="text-base">{stat.icon}</span>
                                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{stat.label}<HelpTip text={stat.help} /></p>
                                  </div>
                                  <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                                  <p className={`mt-0.5 text-xs ${stat.color} opacity-70`}>{stat.sub}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Game Length + Decisiveness + Streaks Row */}
                          <div className="mt-3 grid gap-3 sm:grid-cols-4">
                            {[
                              {
                                icon: "✅",
                                label: "Avg Win Length",
                                value: `${ms.avgMovesWin ?? 0}`,
                                sub: "moves",
                                color: "text-emerald-400",
                                help: "Average number of full moves in your wins.",
                              },
                              {
                                icon: "❌",
                                label: "Avg Loss Length",
                                value: `${ms.avgMovesLoss ?? 0}`,
                                sub: "moves",
                                color: "text-red-400",
                                help: "Average number of full moves in your losses.",
                              },
                              {
                                icon: "📈",
                                label: "Best Run",
                                value: `${ms.maxWinStreak ?? 0}W`,
                                sub: (ms.maxWinStreak ?? 0) >= 7 ? "Hot Streak" : (ms.maxWinStreak ?? 0) >= 4 ? "Solid" : "Short",
                                color: "text-emerald-400",
                                help: "Longest consecutive winning streak in the analysed games.",
                              },
                              {
                                icon: "📉",
                                label: "Worst Run",
                                value: `${ms.maxLossStreak ?? 0}L`,
                                sub: (ms.maxLossStreak ?? 0) >= 6 ? "Danger Zone" : (ms.maxLossStreak ?? 0) >= 4 ? "Notable" : "Manageable",
                                color: (ms.maxLossStreak ?? 0) >= 6 ? "text-red-400" : (ms.maxLossStreak ?? 0) >= 4 ? "text-amber-400" : "text-cyan-400",
                                help: "Longest consecutive losing streak. Long streaks may indicate tilt.",
                              },
                            ].map((stat) => (
                              <div key={stat.label} className="stat-card">
                                <div className="flex items-center gap-2">
                                  <span className="text-base">{stat.icon}</span>
                                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{stat.label}<HelpTip text={stat.help} /></p>
                                </div>
                                <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                                <p className={`mt-0.5 text-xs ${stat.color} opacity-70`}>{stat.sub}</p>
                              </div>
                            ))}
                          </div>

                          {/* Decisiveness + Draw Rate */}
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <div className="stat-card">
                              <div className="flex items-center gap-2">
                                <span className="text-base">⚔️</span>
                                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Decisiveness<HelpTip text="Percentage of games that ended decisively (not a draw). High = aggressive, playing for the win." /></p>
                              </div>
                              <p className={`mt-1 text-2xl font-bold ${(ms.decisiveness ?? 0) >= 85 ? "text-violet-400" : "text-cyan-400"}`}>{ms.decisiveness ?? 0}%</p>
                              <p className={`mt-0.5 text-xs opacity-70 ${(ms.decisiveness ?? 0) >= 85 ? "text-violet-400" : "text-cyan-400"}`}>
                                {(ms.decisiveness ?? 0) >= 85 ? "All or Nothing" : (ms.decisiveness ?? 0) >= 70 ? "Plays to Win" : "Draw-Prone"}
                              </p>
                            </div>
                            <div className="stat-card">
                              <div className="flex items-center gap-2">
                                <span className="text-base">🤝</span>
                                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Draw Rate<HelpTip text="Percentage of games ending in a draw. Compare to your rating bracket average." /></p>
                              </div>
                              <p className="mt-1 text-2xl font-bold text-slate-300">{ms.drawRate ?? 0}%</p>
                              <p className="mt-0.5 text-xs text-slate-400 opacity-70">
                                {(ms.drawRate ?? 0) >= 20 ? "Frequent Draws" : (ms.drawRate ?? 0) >= 8 ? "Average" : "Rarely Draws"}
                              </p>
                            </div>
                          </div>
                        </>
                      );
                    })()}

                    {/* Pro upsell — blurred preview cards */}
                    {!hasProAccess && (() => {
                      const ms = result.mentalStats!;
                      return (
                        <div className="relative mt-5">
                          {/* Blurred cards */}
                          <div className="select-none blur-[6px] pointer-events-none">
                            {/* Archetype + Recent Form row */}
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/[0.1] px-4 py-1.5 text-sm font-semibold text-violet-300">
                                🧊 Ice Veins
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="mr-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">Last 10</span>
                                {["W","L","W","W","D","L","W","W","L","W"].map((r, i) => (
                                  <span key={i} className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${r === "W" ? "bg-emerald-500/20 text-emerald-400" : r === "L" ? "bg-red-500/20 text-red-400" : "bg-slate-500/20 text-slate-400"}`}>{r}</span>
                                ))}
                              </div>
                            </div>

                            {/* Color performance row */}
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm">♔</div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400">White · 42 games</span>
                                    <span className="text-sm font-bold text-emerald-400">58.3%</span>
                                  </div>
                                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full w-[58%] rounded-full bg-white/60" /></div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-700/50 text-sm">♚</div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400">Black · 38 games</span>
                                    <span className="text-sm font-bold text-amber-400">47.2%</span>
                                  </div>
                                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full w-[47%] rounded-full bg-slate-400/60" /></div>
                                </div>
                              </div>
                            </div>

                            {/* Deep breakdown stat cards */}
                            <div className="mt-3 grid gap-3 sm:grid-cols-4">
                              {["Momentum", "Early Losses", "Comebacks", "Mate Finish"].map((label) => (
                                <div key={label} className="stat-card">
                                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
                                  <p className="mt-1 text-2xl font-bold text-emerald-400">42%</p>
                                  <p className="mt-0.5 text-xs text-emerald-400 opacity-70">Average</p>
                                </div>
                              ))}
                            </div>

                            <div className="mt-3 grid gap-3 sm:grid-cols-4">
                              {["Avg Win Len", "Avg Loss Len", "Best Run", "Worst Run"].map((label) => (
                                <div key={label} className="stat-card">
                                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
                                  <p className="mt-1 text-2xl font-bold text-cyan-400">28</p>
                                  <p className="mt-0.5 text-xs text-cyan-400 opacity-70">moves</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Overlay unlock CTA */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="rounded-2xl border border-violet-500/30 bg-slate-900/90 px-6 py-4 text-center shadow-2xl backdrop-blur-sm">
                              <p className="text-lg font-bold text-white">🔒 Pro Mental Breakdown</p>
                              <p className="mt-1.5 max-w-xs text-xs text-slate-400">Unlock your emotional archetype, color win rates, momentum analysis, comeback rate, game length trends, and streak details.</p>
                              <a
                                href="/pricing"
                                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
                              >
                                Upgrade to Pro
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="section-divider mt-6" />
                    <div className="mt-4">
                      <p className="text-xs text-slate-500">
                        Based on {result.mentalStats.totalGames} game outcomes &middot; Psychology estimates
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── Personalized Puzzles ─── */}
              {(missedTactics.length > 0 || endgameMistakes.length > 0 || leaks.length > 0) && (
                <PersonalizedPuzzles tactics={missedTactics} endgames={endgameMistakes} leaks={leaks} onExpandedChange={setPuzzleBoardOpen} />
              )}

              </div>{/* end pngRef wrapper */}

              {/* Summary stats */}
              <div className="glass-card p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="grid flex-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-center justify-between border-b border-white/[0.04] py-2 sm:border-0">
                      <span className="text-slate-400">Games analyzed</span>
                      <span className="font-semibold text-white">{result.gamesAnalyzed}</span>
                    </div>
                    {lastRunConfig && (
                      <div className="flex items-center justify-between border-b border-white/[0.04] py-2 sm:border-0">
                        <span className="text-slate-400">Source</span>
                        <span className="font-semibold text-white">{lastRunConfig.source === "chesscom" ? "Chess.com" : "Lichess"}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-b border-white/[0.04] py-2 sm:border-0">
                      <span className="text-slate-400">Repeated positions</span>
                      <span className="font-semibold text-white">{result.repeatedPositions}</span>
                    </div>
                    {(lastRunConfig?.scanMode !== "tactics") && (
                      <div className="flex items-center justify-between py-2">
                        <span className="text-slate-400">Leaks found</span>
                        <span className="font-semibold text-emerald-400">{result.leaks.length}</span>
                      </div>
                    )}
                    {(lastRunConfig?.scanMode === "tactics" || lastRunConfig?.scanMode === "both") && (
                      <div className="flex items-center justify-between py-2">
                        <span className="text-slate-400">Missed tactics</span>
                        <span className="font-semibold text-amber-400">{missedTactics.length}{!hasProAccess && " (sample)"}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center justify-center border-t border-white/[0.04] pt-3 sm:border-t-0 sm:border-l sm:border-white/[0.06] sm:pl-6 sm:pt-0">
                    <ViewModeToggle mode={cardViewMode} onChange={setCardViewMode} />
                  </div>
                </div>
              </div>

              {/* ─── Opening Analysis — Folder Tabs ─── */}
              {(lastRunConfig?.scanMode === "openings" || lastRunConfig?.scanMode === "both") && (
              <div>
                {/* Folder tab bar */}
                <div className="flex items-end gap-0.5 px-1">
                  {/* Mistakes tab */}
                  <button
                    type="button"
                    onClick={() => setOpeningFolder("mistakes")}
                    className={`group relative flex items-center gap-2 rounded-t-xl px-5 py-3 text-sm font-bold transition-all cursor-pointer ${
                      openingFolder === "mistakes"
                        ? "bg-white/[0.06] text-white border border-white/[0.1] border-b-transparent z-10 shadow-[0_-4px_20px_-6px_rgba(16,185,129,0.15)]"
                        : "bg-white/[0.02] text-slate-500 border border-white/[0.05] border-b-white/[0.1] hover:text-slate-300 hover:bg-white/[0.04]"
                    }`}
                  >
                    <span className="text-base">📖</span>
                    <span className="hidden sm:inline">Mistakes</span>
                    {(leaks.length + oneOffMistakes.length) > 0 && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${openingFolder === "mistakes" ? "bg-emerald-500/20 text-emerald-400" : "bg-white/[0.06] text-slate-500"}`}>
                        {leaks.length + oneOffMistakes.length}
                      </span>
                    )}
                  </button>

                  {/* Rankings tab — only if data exists */}
                  {result?.openingSummaries && result.openingSummaries.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setOpeningFolder("rankings")}
                      className={`group relative flex items-center gap-2 rounded-t-xl px-5 py-3 text-sm font-bold transition-all cursor-pointer ${
                        openingFolder === "rankings"
                          ? "bg-white/[0.06] text-white border border-white/[0.1] border-b-transparent z-10 shadow-[0_-4px_20px_-6px_rgba(99,102,241,0.15)]"
                          : "bg-white/[0.02] text-slate-500 border border-white/[0.05] border-b-white/[0.1] hover:text-slate-300 hover:bg-white/[0.04]"
                      }`}
                    >
                      <span className="text-base">📊</span>
                      <span className="hidden sm:inline">Rankings</span>
                    </button>
                  )}

                  {/* Fill remaining space with bottom border */}
                  <div className="flex-1 border-b border-white/[0.1]" />
                </div>

                {/* Folder body */}
                <div className="rounded-b-2xl rounded-tr-2xl border border-white/[0.1] border-t-0 bg-white/[0.03] p-5 space-y-5 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.5)]">

                  {/* Coach Insight — Openings */}
                  {openingFolder === "mistakes" && (() => {
                    const repeatedCount = leaks.length;
                    const oneOffCount = oneOffMistakes.length;
                    const totalLeaks = repeatedCount + oneOffCount;
                    const totalEvalLost = [...leaks, ...oneOffMistakes].reduce((s, l) => s + (l.cpLoss ?? 0), 0);
                    const avgLoss = totalLeaks > 0 ? totalEvalLost / totalLeaks : 0;

                    let headline = "";
                    let headlineColor = "gradient-text-emerald";
                    const lines: { text: string; type: "positive" | "improve" }[] = [];

                    if (totalLeaks === 0) {
                      headline = "Your openings are bulletproof.";
                    } else if (repeatedCount >= 3) {
                      headline = "The same opening traps keep catching you.";
                      headlineColor = "gradient-text-amber";
                    } else if (avgLoss > 100) {
                      headline = "Your opening mistakes are expensive.";
                      headlineColor = "gradient-text-amber";
                    } else if (totalLeaks <= 2) {
                      headline = "Just a couple of opening rough edges.";
                    } else {
                      headline = "Some opening patterns to clean up.";
                      headlineColor = "gradient-text-amber";
                    }

                    // Positives
                    if (repeatedCount === 0 && oneOffCount > 0) lines.push({ text: "No recurring mistakes — each error was a one-off, suggesting solid opening knowledge.", type: "positive" });
                    if (totalLeaks <= 2 && result.gamesAnalyzed >= 5) lines.push({ text: `Only ${totalLeaks} mistake${totalLeaks !== 1 ? "s" : ""} across ${result.gamesAnalyzed} games — your preparation is paying off.`, type: "positive" });
                    if (totalLeaks === 0) lines.push({ text: `Clean opening play across all ${result.gamesAnalyzed} games. Your repertoire is well-prepared.`, type: "positive" });

                    // Improvements
                    if (repeatedCount >= 2) lines.push({ text: `${repeatedCount} repeated mistakes — you're falling into the same traps. Use the drill mode below to build muscle memory.`, type: "improve" });
                    if (oneOffCount >= 3) lines.push({ text: `${oneOffCount} one-off inaccuracies. Broaden your preparation to cover sidelines you're encountering.`, type: "improve" });
                    if (avgLoss > 100 && totalLeaks > 0) lines.push({ text: `Averaging ${(avgLoss / 100).toFixed(1)} pawns lost per mistake — these are costing you games before the middlegame.`, type: "improve" });
                    if (repeatedCount >= 1 && oneOffCount >= 1) lines.push({ text: "Focus on the repeated leaks first — fixing those gives the biggest return per study hour.", type: "improve" });

                    const positives = lines.filter(l => l.type === "positive");
                    const improvements = lines.filter(l => l.type === "improve");
                    const displayLines = [...positives, ...improvements].slice(0, 3);

                    return displayLines.length > 0 ? (
                      <div className="coach-insight rounded-xl border border-emerald-500/10 bg-gradient-to-br from-emerald-500/[0.06] to-teal-500/[0.03] px-5 py-5">
                        <p className={`coach-headline text-lg font-extrabold tracking-tight sm:text-xl ${headlineColor}`}>
                          {headline}
                        </p>
                        <div className="mt-3 space-y-2">
                          {displayLines.map((line, i) => (
                            <div key={i} className={`coach-line-${i + 1} flex items-start gap-2`}>
                              <span className={`mt-0.5 text-xs ${line.type === "positive" ? "text-emerald-400" : "text-slate-500"}`}>
                                {line.type === "positive" ? "✦" : "▸"}
                              </span>
                              <p className={`text-sm leading-relaxed ${line.type === "positive" ? "text-emerald-300/90" : "text-slate-400"}`}>
                                {line.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {/* ── Mistakes folder ── */}
                  {openingFolder === "mistakes" && (<>
                  {leaks.length === 0 && oneOffMistakes.length === 0 ? (
                    <div className="glass-card flex items-center gap-4 p-6">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-2xl">🎉</span>
                      <div>
                        <p className="font-semibold text-white">No opening mistakes found</p>
                        <p className="text-sm text-slate-400">
                          Great job! No significant mistakes in the first {lastRunConfig?.maxMoves ?? moveCount} moves.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                    {/* Pill toggle — Repeated / One-Off */}
                    {leaks.length > 0 && oneOffMistakes.length > 0 && (
                      <div className="flex items-center justify-center">
                        <div className="inline-flex rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
                          <button
                            type="button"
                            onClick={() => setLeakTab("repeated")}
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${leakTab === "repeated" ? "bg-emerald-500/15 text-emerald-400 shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
                          >
                            🔁 Repeated
                            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${leakTab === "repeated" ? "bg-emerald-500/20 text-emerald-400" : "bg-white/[0.06] text-slate-500"}`}>
                              {leaks.length}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setLeakTab("one-off")}
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${leakTab === "one-off" ? "bg-amber-500/15 text-amber-400 shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
                          >
                            ⚡ One-Off
                            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${leakTab === "one-off" ? "bg-amber-500/20 text-amber-400" : "bg-white/[0.06] text-slate-500"}`}>
                              {oneOffMistakes.length}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Repeated Leaks tab */}
                    {(leakTab === "repeated" || oneOffMistakes.length === 0) && leaks.length > 0 && (
                      <CardCarousel viewMode={cardViewMode}>
                        {leaks.map((leak, idx) => (
                          <MistakeCard
                            key={`${leak.fenBefore}-${leak.userMove}-${idx}`}
                            leak={leak}
                            engineDepth={lastRunConfig?.engineDepth ?? engineDepth}
                          />
                        ))}
                      </CardCarousel>
                    )}

                    {/* One-Off tab */}
                    {(leakTab === "one-off" || leaks.length === 0) && oneOffMistakes.length > 0 && (
                      <CardCarousel viewMode={cardViewMode}>
                        {oneOffMistakes.map((leak, idx) => (
                          <MistakeCard
                            key={`oneoff-${leak.fenBefore}-${leak.userMove}-${idx}`}
                            leak={leak}
                            engineDepth={lastRunConfig?.engineDepth ?? engineDepth}
                          />
                        ))}
                      </CardCarousel>
                    )}

                    {/* Drill CTA */}
                    {(diagnostics?.positionTraces.length ?? 0) > 0 && (
                      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 p-8 md:p-10">
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/[0.08] via-cyan-500/[0.04] to-transparent" />
                        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-[80px]" />
                        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-cyan-500/10 blur-[80px]" />
                        <div className="relative flex flex-col items-center text-center">
                          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-3xl shadow-lg shadow-emerald-500/10">📖</span>
                          <h3 className="mt-5 text-2xl font-extrabold text-white md:text-3xl">Drill Your Opening Mistakes</h3>
                          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-400">
                            Practice the correct moves for every opening mistake until they&apos;re automatic. The drill feeds you each position and checks if you play the right move.
                          </p>
                          <div className="mt-6 grid w-full max-w-lg gap-3 sm:grid-cols-3">
                            <div className="flex flex-col items-center gap-2 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] px-4 py-3">
                              <span className="text-lg">🎯</span>
                              <p className="text-xs font-bold text-white">Your Real Mistakes</p>
                              <p className="text-[10px] text-slate-500">From your actual games</p>
                            </div>
                            <div className="flex flex-col items-center gap-2 rounded-xl border border-cyan-500/15 bg-cyan-500/[0.04] px-4 py-3">
                              <span className="text-lg">♟️</span>
                              <p className="text-xs font-bold text-white">Interactive Board</p>
                              <p className="text-[10px] text-slate-500">Play the correct move</p>
                            </div>
                            <div className="flex flex-col items-center gap-2 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] px-4 py-3">
                              <span className="text-lg">📈</span>
                              <p className="text-xs font-bold text-white">Build Muscle Memory</p>
                              <p className="text-[10px] text-slate-500">Repeat until automatic</p>
                            </div>
                          </div>
                          <div className="mt-7 w-full max-w-md">
                            <DrillMode positions={diagnostics?.positionTraces ?? []} oneOffMistakes={oneOffMistakes} excludeFens={dbApprovedFens} />
                          </div>
                        </div>
                      </div>
                    )}
                    </>
                  )}
                  </>)}

                  {/* ── Rankings folder ── */}
                  {openingFolder === "rankings" && result?.openingSummaries && result.openingSummaries.length > 0 && (
                    <OpeningRankings openingSummaries={result.openingSummaries} />
                  )}

                  {/* CTA: after openings-only scan, suggest tactics scan */}
                  {lastRunConfig?.scanMode === "openings" && (
                    <div className="glass-card flex flex-col items-center gap-4 border-amber-500/15 bg-gradient-to-r from-amber-500/[0.04] to-transparent p-6 text-center sm:flex-row sm:text-left">
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-3xl shadow-lg shadow-amber-500/10">⚡</span>
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-white">Want to find missed tactics too?</h3>
                        <p className="mt-1 text-sm text-slate-400">
                          Your opening scan is complete. Run a tactics scan on the same games to find forcing moves you missed.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => quickScanMode("tactics")}
                        className="btn-amber flex h-11 shrink-0 items-center gap-2 px-5 text-sm font-bold"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                        Scan Tactics
                      </button>
                    </div>
                  )}

                  {/* CTA: after openings-only scan, suggest endgame scan */}
                  {lastRunConfig?.scanMode === "openings" && (
                    <div className="glass-card flex flex-col items-center gap-4 border-sky-500/15 bg-gradient-to-r from-sky-500/[0.04] to-transparent p-6 text-center sm:flex-row sm:text-left">
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-500/15 text-3xl shadow-lg shadow-sky-500/10">♟️</span>
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-white">Want to find endgame mistakes too?</h3>
                        <p className="mt-1 text-sm text-slate-400">
                          Your opening scan is complete. Run an endgame scan to catch mistakes in king &amp; pawn endings, rook endgames, and more.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => quickScanMode("endgames")}
                        className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-5 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition hover:shadow-sky-500/30"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                        Scan Endgames
                      </button>
                    </div>
                  )}

                  {/* CTA: suggest time management scan */}
                  {lastRunConfig?.scanMode === "openings" && (
                    <div className="glass-card flex flex-col items-center gap-4 border-violet-500/15 bg-gradient-to-r from-violet-500/[0.04] to-transparent p-6 text-center sm:flex-row sm:text-left">
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-3xl shadow-lg shadow-violet-500/10">⏱️</span>
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-white">Want to analyze your time management?</h3>
                        <p className="mt-1 text-sm text-slate-400">
                          Find rushed moves, wasted thinks, and time scrambles. See how your clock usage impacts your results.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => quickScanMode("time-management")}
                        className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/10 px-5 text-sm font-bold text-violet-400 transition hover:border-violet-500/40 hover:bg-violet-500/20"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        Scan Time
                      </button>
                    </div>
                  )}

                </div>
              </div>
              )}

              {/* ─── Positional Patterns — Standalone Section ─── */}
              {(lastRunConfig?.scanMode === "openings" || lastRunConfig?.scanMode === "both") && positionalMotifs.length > 0 && (
              <>
              <div className="my-4">
                <div className="section-divider" />
              </div>
              <button type="button" onClick={() => setPatternsOpen(o => !o)} className="glass-card border-amber-500/15 bg-gradient-to-r from-amber-500/[0.04] to-transparent p-6 w-full text-left cursor-pointer transition-colors hover:border-amber-500/25">
                <div className="flex items-center gap-4">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-3xl shadow-lg shadow-amber-500/10">🧠</span>
                  <div className="flex-1">
                    <h2 className="text-2xl font-extrabold text-white tracking-tight">
                      Positional Patterns
                      <span className="ml-3 inline-flex items-center rounded-full bg-amber-500/15 px-3 py-1 text-base font-bold text-amber-400">
                        {positionalMotifs.length}
                      </span>
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Recurring positional habits detected across your games — premature trades, released tension, passive retreats, and more
                    </p>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`shrink-0 text-slate-400 transition-transform duration-200 ${patternsOpen ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </button>

              {patternsOpen && (
              <div className="space-y-3">
                {positionalMotifs.map((motif) => {
                  const pattern = POSITIONAL_PATTERNS.find(p => motif.name.startsWith(p.label) || motif.name.includes(p.tag));
                  const quote = pattern?.quote;
                  const author = pattern?.author;
                  const icon = pattern?.icon ?? motif.icon;
                  const colorMap: Record<string, string> = {
                    amber: "border-amber-500/20 bg-amber-500/[0.04]",
                    orange: "border-orange-500/20 bg-orange-500/[0.04]",
                    rose: "border-rose-500/20 bg-rose-500/[0.04]",
                    red: "border-red-500/20 bg-red-500/[0.04]",
                    slate: "border-slate-500/20 bg-slate-500/[0.04]",
                    violet: "border-violet-500/20 bg-violet-500/[0.04]",
                    yellow: "border-yellow-500/20 bg-yellow-500/[0.04]",
                    blue: "border-blue-500/20 bg-blue-500/[0.04]",
                    cyan: "border-cyan-500/20 bg-cyan-500/[0.04]",
                    indigo: "border-indigo-500/20 bg-indigo-500/[0.04]",
                    teal: "border-teal-500/20 bg-teal-500/[0.04]",
                  };
                  const borderClass = colorMap[pattern?.color ?? "amber"] ?? colorMap.amber;
                  const ratio = motif.avgCpLoss < 99000 ? motif.avgCpLoss : 0;
                  const severityColor = ratio >= 15000 ? "text-red-400" : ratio >= 8000 ? "text-amber-400" : "text-yellow-400";

                  const isExpanded = expandedMotifs.has(motif.name);
                  const toggleExpand = () => setExpandedMotifs(prev => {
                    const next = new Set(prev);
                    if (next.has(motif.name)) next.delete(motif.name);
                    else next.add(motif.name);
                    return next;
                  });
                  const hasExamples = motif.examples.length > 0;

                  return (
                    <div key={motif.name} className={`glass-card ${borderClass} overflow-hidden`}>
                      <div className="p-5">
                        <div className="flex items-start gap-4">
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-2xl">{icon}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="text-lg font-bold text-white">{motif.name}</h3>
                              <span className={`rounded-full bg-white/[0.06] px-2.5 py-0.5 text-xs font-bold ${severityColor}`}>
                                {motif.count}× detected
                              </span>
                              {motif.avgCpLoss < 99000 && (
                                <span className="text-xs text-slate-500">
                                  avg −{(motif.avgCpLoss / 100).toFixed(1)} pawns
                                </span>
                              )}
                            </div>
                            {quote && (
                              <blockquote className="mt-3 border-l-2 border-amber-500/30 pl-4">
                                <p className="text-sm italic leading-relaxed text-slate-300">
                                  &ldquo;{quote}&rdquo;
                                </p>
                                <p className="mt-1 text-xs text-slate-500">— {author}</p>
                              </blockquote>
                            )}
                            {hasExamples && (
                              <button
                                type="button"
                                onClick={toggleExpand}
                                className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9"/></svg>
                                {isExpanded ? "Hide" : "Show"} {motif.examples.length} example{motif.examples.length !== 1 ? "s" : ""} from your games
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Batch example positions */}
                      {isExpanded && hasExamples && (
                        <div className="border-t border-white/[0.06] bg-white/[0.015] px-5 py-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {motif.examples.map((ex, ei) => {
                              const resolveMove = (fen: string, move: string | null | undefined): { from: string; to: string; san: string } | null => {
                                if (!move) return null;
                                try {
                                  const c = new Chess(fen);
                                  if (/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move)) {
                                    const r = c.move({ from: move.slice(0, 2), to: move.slice(2, 4), promotion: (move[4] || undefined) as any });
                                    if (r) return { from: r.from, to: r.to, san: r.san };
                                  }
                                  const r = c.move(move);
                                  if (r) return { from: r.from, to: r.to, san: r.san };
                                } catch {}
                                return null;
                              };
                              const userR = resolveMove(ex.fenBefore, ex.userMove);
                              const bestR = resolveMove(ex.fenBefore, ex.bestMove);
                              const arrows: [CbSquare, CbSquare, string][] = [];
                              if (userR) arrows.push([userR.from as CbSquare, userR.to as CbSquare, "rgba(239, 68, 68, 0.85)"]);
                              if (bestR) arrows.push([bestR.from as CbSquare, bestR.to as CbSquare, "rgba(34, 197, 94, 0.85)"]);
                              const sideToMove = ex.fenBefore.includes(" b ") ? "black" : "white";

                              const exKey = `${motif.name}-${ei}`;
                              const isExplaining = posExplaining === exKey;
                              const onExplain = async () => {
                                if (isExplaining) return;
                                setPosExplaining(exKey);
                                try {
                                  const coaching = explainOpeningLeak(ex.fenBefore, ex.userMove ?? "", ex.bestMove ?? null, ex.cpLoss, 0, -ex.cpLoss);
                                  // Use the "best" explanation (like openings modal) so we show the best continuation
                                  const rich: PositionExplanation = { ...coaching.best };

                                  const playedUci = ex.userMove ?? "";
                                  const bestUci = ex.bestMove ?? "";

                                  // Resolve played move SAN for display
                                  const afterPlayed = new Chess(ex.fenBefore);
                                  const uciMatch = /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(playedUci);
                                  let playedSan = playedUci;
                                  if (uciMatch) {
                                    const r = afterPlayed.move({ from: playedUci.slice(0, 2), to: playedUci.slice(2, 4), promotion: (playedUci[4] || undefined) as PieceSymbol | undefined });
                                    if (r) playedSan = r.san;
                                  } else {
                                    const r = afterPlayed.move(playedUci);
                                    if (r) playedSan = r.san;
                                  }

                                  // ── Compute the BEST continuation (like the openings modal) ──
                                  let fullBestLine: string[] = [];
                                  let bestSan = bestUci;
                                  try {
                                    const bestChess = new Chess(ex.fenBefore);
                                    const bestIsUci = /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(bestUci);
                                    if (bestIsUci) {
                                      const r = bestChess.move({ from: bestUci.slice(0, 2), to: bestUci.slice(2, 4), promotion: (bestUci[4] || undefined) as PieceSymbol | undefined });
                                      if (r) bestSan = r.san;
                                    } else {
                                      const r = bestChess.move(bestUci);
                                      if (r) bestSan = r.san;
                                    }

                                    const bestPv = await stockfishClient.getPrincipalVariation(bestChess.fen(), 9, 12);
                                    const bestContinuationUcis = bestPv?.pvMoves ?? [];
                                    fullBestLine = [bestUci, ...bestContinuationUcis];

                                    // Build SAN text for the best line
                                    const bestSanTokens: string[] = [bestSan];
                                    const pvSim = new Chess(bestChess.fen());
                                    for (const uci of bestContinuationUcis) {
                                      if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) break;
                                      const mn = pvSim.moveNumber();
                                      const side = pvSim.turn();
                                      const mr = pvSim.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: (uci[4] || undefined) as PieceSymbol | undefined });
                                      if (!mr) break;
                                      bestSanTokens.push(side === "w" ? `${mn}.${mr.san}` : `${mn}...${mr.san}`);
                                    }
                                    rich.observations = [
                                      ...rich.observations,
                                      `**Engine best line**: ${bestSanTokens.join(" ")}`,
                                    ];

                                    // Position outlook for the best line end position
                                    try {
                                      const finalSim = new Chess(ex.fenBefore);
                                      for (const u of fullBestLine) {
                                        if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(u)) break;
                                        const r2 = finalSim.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: (u[4] || undefined) as PieceSymbol | undefined });
                                        if (!r2) break;
                                      }
                                      const userP = sideToMove === "white" ? "w" as const : "b" as const;
                                      const finalEval = await stockfishClient.evaluateFen(finalSim.fen(), 8);
                                      const outlook = describeEndPosition(finalSim.fen(), userP, finalEval?.cp ?? null);
                                      if (outlook.summary) rich.observations.push(`**Position outlook**: ${outlook.summary}`);
                                      for (const d of outlook.details) rich.observations.push(`  · ${d}`);
                                    } catch { /* skip outlook */ }
                                  } catch { /* skip best PV */ }

                                  // Also add the punishment line for context
                                  try {
                                    const punishSim = new Chess(ex.fenBefore);
                                    const playedIsUci = /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(playedUci);
                                    if (playedIsUci) {
                                      punishSim.move({ from: playedUci.slice(0, 2), to: playedUci.slice(2, 4), promotion: (playedUci[4] || undefined) as PieceSymbol | undefined });
                                    } else {
                                      punishSim.move(playedUci);
                                    }
                                    const punishPv = await stockfishClient.getPrincipalVariation(punishSim.fen(), 8, 10);
                                    if (punishPv) {
                                      const pTokens: string[] = [playedSan];
                                      const pSim = new Chess(punishSim.fen());
                                      for (const uci of punishPv.pvMoves) {
                                        if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) break;
                                        const mn = pSim.moveNumber();
                                        const side = pSim.turn();
                                        const mr = pSim.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: (uci[4] || undefined) as PieceSymbol | undefined });
                                        if (!mr) break;
                                        pTokens.push(side === "w" ? `${mn}.${mr.san}` : `${mn}...${mr.san}`);
                                      }
                                      rich.observations.push(`**After your move** (${playedSan}): ${pTokens.join(" ")}`);
                                    }
                                  } catch { /* skip punishment */ }

                                  setPosExplainRich(rich);
                                  // Animate the BEST continuation (like the openings modal)
                                  setPosExplainAnimUci(fullBestLine.length > 0 ? fullBestLine : [playedUci]);
                                  setPosExplainFen(ex.fenBefore);
                                  setPosExplainOrientation(sideToMove === "black" ? "black" : "white");
                                  setPosExplainTitle(`Best Move: ${bestSan}`);
                                  setPosExplainSubtitle(rich.headline);
                                  setPosExplainModalOpen(true);
                                } catch { /* silently fail */ }
                                setPosExplaining(null);
                              };

                              return (
                                <div key={`${ex.fenBefore}-${ei}`} className="flex flex-col items-center gap-2">
                                  <div className="w-full max-w-[280px] aspect-square rounded-lg overflow-hidden border border-white/[0.08]">
                                    <Chessboard
                                      id={`pos-ex-${motif.name}-${ei}`}
                                      position={ex.fenBefore}
                                      arePiecesDraggable={false}
                                      boardWidth={280}
                                      customArrows={arrows}
                                      boardOrientation={sideToMove === "black" ? "black" : "white"}
                                      customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
                                      customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
                                      customBoardStyle={{ borderRadius: "0px" }}
                                      showBoardNotation={false}
                                      customPieces={customPieces}
                                    />
                                  </div>
                                  <div className="text-center">
                                    <span className="text-xs font-bold text-red-400">
                                      −{(ex.cpLoss / 100).toFixed(1)}
                                    </span>
                                    {userR && (
                                      <span className="ml-1.5 text-xs text-slate-500">
                                        played <span className="font-mono text-red-400/80">{userR.san}</span>
                                      </span>
                                    )}
                                    {bestR && (
                                      <span className="ml-1 text-xs text-slate-500">
                                        best <span className="font-mono text-emerald-400/80">{bestR.san}</span>
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={onExplain}
                                    disabled={isExplaining}
                                    className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                                  >
                                    {isExplaining ? "Loading…" : "Explain"}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                            <span className="inline-block h-2 w-4 rounded-sm" style={{ backgroundColor: "rgba(239, 68, 68, 0.85)" }} />
                            <span>Your move</span>
                            <span className="inline-block h-2 w-4 rounded-sm ml-2" style={{ backgroundColor: "rgba(34, 197, 94, 0.85)" }} />
                            <span>Best move</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {positionalMotifs.length >= 2 && (
                  <div className="glass-card border-amber-500/10 p-4">
                    <p className="flex items-start gap-2 text-sm text-slate-400">
                      <span className="mt-0.5 shrink-0 text-amber-400">💡</span>
                      <span>
                        These patterns often repeat unconsciously. Awareness is the first step — try to catch yourself <em>before</em> making the move.
                        Head to the <Link href="/train" className="text-amber-400 underline underline-offset-2 hover:text-amber-300">Training Center</Link> to practice positions with these exact patterns.
                      </span>
                    </p>
                  </div>
                )}

                {/* Positional motif explanation modal (shared) */}
                <ExplanationModal
                  open={posExplainModalOpen}
                  onClose={() => setPosExplainModalOpen(false)}
                  variant="opening"
                  activeTab="best"
                  richExplanation={posExplainRich}
                  fen={posExplainFen}
                  uciMoves={posExplainAnimUci}
                  boardOrientation={posExplainOrientation}
                  autoPlay
                  title={posExplainTitle}
                  subtitle={posExplainSubtitle}
                />
              </div>
              )}
              </>
              )}

              {/* Missed Tactics Section — shown when tactics were scanned */}
              {(lastRunConfig?.scanMode === "tactics" || lastRunConfig?.scanMode === "both") && (
              <>
              <div className="my-4">
                <div className="section-divider" />
              </div>
              <button type="button" onClick={() => setTacticsOpen(o => !o)} className="glass-card border-amber-500/15 bg-gradient-to-r from-amber-500/[0.04] to-transparent p-6 w-full text-left cursor-pointer transition-colors hover:border-amber-500/25">
                <div className="flex items-center gap-4">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-3xl shadow-lg shadow-amber-500/10">⚡</span>
                  <div className="flex-1">
                    <h2 className="text-2xl font-extrabold text-white tracking-tight">
                      Missed Tactics
                      {missedTactics.length > 0 && (
                        <span className="ml-3 inline-flex items-center rounded-full bg-amber-500/15 px-3 py-1 text-base font-bold text-amber-400">
                          {missedTactics.length}{!hasProAccess && ` / ${FREE_TACTIC_SAMPLE} sample`}
                        </span>
                      )}
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Positions where you had a forcing move for ≥200cp material gain but missed it
                    </p>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`shrink-0 text-slate-400 transition-transform duration-200 ${tacticsOpen ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </button>

              {tacticsOpen && (<>
              {/* Tactics Overview Stats */}
              {missedTactics.length > 0 && (
                <div className="glass-card space-y-4 p-5">
                  <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>
                    Tactics Overview
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="stat-card py-3">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Total Missed</p>
                      <p className="mt-0.5 text-lg font-bold text-amber-400">{missedTactics.length}</p>
                    </div>
                    <div className="stat-card py-3">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Total Eval Lost</p>
                      <p className="mt-0.5 text-lg font-bold text-red-400">
                        −{(missedTactics.reduce((s, t) => s + (t.cpLoss < 99000 ? t.cpLoss : 0), 0) / 100).toFixed(1)}
                      </p>
                    </div>
                    <div className="stat-card py-3">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Worst Miss</p>
                      <p className="mt-0.5 text-lg font-bold text-red-400">
                        {missedTactics.some(t => t.cpLoss >= 99000) ? "Mate" : `−${(Math.max(...missedTactics.map(t => t.cpLoss)) / 100).toFixed(1)}`}
                      </p>
                    </div>
                    <div className="stat-card py-3">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Under Time Pressure</p>
                      <p className={`mt-0.5 text-lg font-bold ${missedTactics.filter(t => typeof t.timeRemainingSec === "number" && t.timeRemainingSec <= 30).length > 0 ? "text-red-400" : "text-emerald-400"}`}>
                        {missedTactics.filter(t => typeof t.timeRemainingSec === "number" && t.timeRemainingSec <= 30).length}
                        <span className="text-xs font-normal text-slate-500"> / {missedTactics.length}</span>
                      </p>
                    </div>
                  </div>
                  {/* Coach Insight — Tactics */}
                  {(() => {
                    const timePressureCount = missedTactics.filter(t => typeof t.timeRemainingSec === "number" && t.timeRemainingSec <= 30).length;
                    const timePressureRate = missedTactics.length > 0 ? timePressureCount / missedTactics.length : 0;
                    const matesMissed = missedTactics.filter(t => t.cpLoss >= 99000).length;
                    const nonMateTactics = missedTactics.filter(t => t.cpLoss < 99000);
                    const avgLoss = nonMateTactics.reduce((s, t) => s + t.cpLoss, 0) / Math.max(1, nonMateTactics.length);
                    const totalMissed = missedTactics.length;

                    let headline = "";
                    let headlineColor = "gradient-text-amber";
                    const lines: { text: string; type: "positive" | "improve" }[] = [];

                    if (totalMissed <= 2 && matesMissed === 0) {
                      headline = "Sharp tactical vision.";
                      headlineColor = "gradient-text-emerald";
                    } else if (matesMissed >= 2) {
                      headline = "Forced mates are slipping through.";
                    } else if (timePressureRate > 0.5 && timePressureCount >= 2) {
                      headline = "Time pressure is blinding your tactics.";
                    } else if (avgLoss > 500) {
                      headline = "You're leaving pieces on the table.";
                    } else if (totalMissed >= 5) {
                      headline = "Too many tactics going unnoticed.";
                    } else {
                      headline = "A few tactical gaps to patch.";
                    }

                    // Positives
                    if (matesMissed === 0 && totalMissed > 0) lines.push({ text: "You didn't miss any forced checkmates — your mating pattern awareness is solid.", type: "positive" });
                    if (timePressureCount === 0 && totalMissed > 0) lines.push({ text: "None of your misses were under time pressure — you're keeping composure on the clock.", type: "positive" });
                    if (totalMissed <= 3 && totalMissed > 0 && avgLoss < 300) lines.push({ text: "Only minor tactical edges missed — you're finding most of the key moments.", type: "positive" });

                    // Improvements
                    if (matesMissed >= 1) lines.push({ text: `${matesMissed} forced mate${matesMissed > 1 ? "s" : ""} missed. Practice mate-in-2/3 puzzles daily — these are the costliest oversights.`, type: "improve" });
                    if (timePressureRate > 0.4 && timePressureCount >= 2) lines.push({ text: `${(timePressureRate * 100).toFixed(0)}% of misses happened with ≤30s on the clock. Try longer time controls or blitz puzzle drills.`, type: "improve" });
                    if (avgLoss > 400 && nonMateTactics.length >= 2) lines.push({ text: `Average miss is worth ${(avgLoss / 100).toFixed(1)} pawns. Before each move, scan for checks, captures, and threats.`, type: "improve" });
                    if (totalMissed >= 5) lines.push({ text: `${totalMissed} missed tactics across your games — dedicate 15 min daily to rated puzzles to sharpen pattern recognition.`, type: "improve" });

                    const positives = lines.filter(l => l.type === "positive");
                    const improvements = lines.filter(l => l.type === "improve");
                    const displayLines = [...positives, ...improvements].slice(0, 3);

                    return (
                      <div className="coach-insight rounded-xl border border-amber-500/10 bg-gradient-to-br from-amber-500/[0.06] to-orange-500/[0.03] px-5 py-5">
                        <p className={`coach-headline text-lg font-extrabold tracking-tight sm:text-xl ${headlineColor}`}>
                          {headline}
                        </p>
                        <div className="mt-3 space-y-2">
                          {displayLines.map((line, i) => (
                            <div key={i} className={`coach-line-${i + 1} flex items-start gap-2`}>
                              <span className={`mt-0.5 text-xs ${line.type === "positive" ? "text-emerald-400" : "text-slate-500"}`}>
                                {line.type === "positive" ? "✦" : "▸"}
                              </span>
                              <p className={`text-sm leading-relaxed ${line.type === "positive" ? "text-emerald-300/90" : "text-slate-400"}`}>
                                {line.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Tactical Motif Pattern Summary — Pro only */}
              {hasProAccess && tacticalMotifs.length > 0 && (
                <div className="glass-card space-y-4 p-5">
                  <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0022 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                    Pattern Analysis
                  </h3>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ranked Worst → Best</p>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {tacticalMotifs.map((motif, idx) => {
                      const total = tacticalMotifs.length;
                      const isWorst = idx === 0;
                      const isBest = idx === total - 1;
                      const ratio = total > 1 ? idx / (total - 1) : 0.5;
                      const rankColor = ratio >= 0.7 ? "text-emerald-400" : ratio >= 0.3 ? "text-amber-400" : "text-red-400";
                      const borderClass = isWorst
                        ? "border-red-500/20 bg-red-500/[0.06]"
                        : isBest
                          ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                          : "border-white/[0.06] bg-white/[0.02]";
                      const badgeBg = isWorst
                        ? "bg-red-500/15"
                        : isBest
                          ? "bg-emerald-500/15"
                          : "bg-white/[0.06]";
                      return (
                        <div
                          key={motif.name}
                          className={`flex items-center gap-3 rounded-xl border p-3 transition-all hover:border-white/[0.12] ${borderClass}`}
                        >
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black ${badgeBg} ${rankColor}`}>
                            #{idx + 1}
                          </div>
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-lg">
                            {motif.icon}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-white">
                              {motif.name}
                              {isWorst && <span className="ml-1.5 rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold text-red-400">WEAKEST</span>}
                              {isBest && total > 1 && <span className="ml-1.5 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">BEST</span>}
                            </p>
                            <p className="text-xs text-slate-400">
                              {motif.count}× missed
                              {motif.avgCpLoss < 99000
                                ? <> · avg <span className={rankColor}>−{(motif.avgCpLoss / 100).toFixed(1)}</span></>
                                : " · forced mate"
                              }
                            </p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${badgeBg} ${rankColor}`}>
                            {motif.count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {tacticalMotifs.length >= 2 && (
                    <p className="text-xs text-slate-500">
                      💡 You have recurring weakness patterns — focus your training on the most frequent motifs above.
                    </p>
                  )}
                </div>
              )}

              {missedTactics.length === 0 ? (
                <div className="glass-card flex items-center gap-4 p-6">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-2xl">🎯</span>
                  <div>
                    <p className="font-semibold text-white">No missed tactics found</p>
                    <p className="text-sm text-slate-400">
                      You didn&apos;t miss any major forcing opportunities (≥200cp) in these games. Nice!
                    </p>
                  </div>
                </div>
              ) : (
                <>
                <CardCarousel
                  viewMode={cardViewMode}
                >
                  {missedTactics.map((tactic) => (
                    <TacticCard
                      key={`${tactic.fenBefore}-${tactic.userMove}-${tactic.gameIndex}`}
                      tactic={tactic}
                      engineDepth={lastRunConfig?.engineDepth ?? engineDepth}
                    />
                  ))}
                </CardCarousel>

                {/* Tactics upsell for free users */}
                {!hasProAccess && missedTactics.length >= FREE_TACTIC_SAMPLE && (
                  <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.06] via-amber-600/[0.03] to-transparent p-8">
                    <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-amber-500/10 blur-[60px]" />
                    <div className="relative flex flex-col items-center gap-4 text-center">
                      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-3xl shadow-lg shadow-amber-500/10">🔒</span>
                      <div>
                        <h3 className="text-xl font-bold text-white">Unlock Full Tactics Scanner</h3>
                        <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
                          You&apos;re seeing {FREE_TACTIC_SAMPLE} sample missed tactics. Pro unlocks the full scan with unlimited missed tactics, motif pattern analysis, time pressure detection, and dedicated tactics drill mode.
                        </p>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                        <Link
                          href="/pricing"
                          className="btn-amber flex h-11 items-center gap-2 px-6 text-sm font-bold"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                          Upgrade to Pro — <span className="line-through decoration-1 opacity-60">$8</span> $5/mo
                        </Link>
                        <span className="text-xs text-slate-500">Launch pricing · Cancel anytime</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tactics Drill CTA */}
                {(hasProAccess || missedTactics.length > 0) && (
                  <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 p-8 md:p-10">
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/[0.08] via-orange-500/[0.04] to-transparent" />
                    <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-500/10 blur-[80px]" />
                    <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-orange-500/10 blur-[80px]" />
                    <div className="relative flex flex-col items-center text-center">
                      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-3xl shadow-lg shadow-amber-500/10">⚔️</span>
                      <h3 className="mt-5 text-2xl font-extrabold text-white md:text-3xl">Drill Your Missed Tactics</h3>
                      <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-400">
                        These are tactics from YOUR games — forks, pins, and combinations you missed. Drill them until the patterns click.
                      </p>
                      <div className="mt-6 grid w-full max-w-lg gap-3 sm:grid-cols-3">
                        <div className="flex flex-col items-center gap-2 rounded-xl border border-amber-500/15 bg-amber-500/[0.04] px-4 py-3">
                          <span className="text-lg">🎯</span>
                          <p className="text-xs font-bold text-white">Your Missed Tactics</p>
                          <p className="text-[10px] text-slate-500">Not random puzzles</p>
                        </div>
                        <div className="flex flex-col items-center gap-2 rounded-xl border border-orange-500/15 bg-orange-500/[0.04] px-4 py-3">
                          <span className="text-lg">♟️</span>
                          <p className="text-xs font-bold text-white">Find the Best Move</p>
                          <p className="text-[10px] text-slate-500">Interactive solving</p>
                        </div>
                        <div className="flex flex-col items-center gap-2 rounded-xl border border-amber-500/15 bg-amber-500/[0.04] px-4 py-3">
                          <span className="text-lg">🧠</span>
                          <p className="text-xs font-bold text-white">Pattern Recognition</p>
                          <p className="text-[10px] text-slate-500">Train your weak spots</p>
                        </div>
                      </div>
                      <div className="mt-7 w-full max-w-md">
                        <DrillMode positions={[]} tactics={missedTactics} excludeFens={dbApprovedFens} />
                      </div>
                    </div>
                  </div>
                )}
                </>
              )}
              </>
              )}
              </>)}

              {/* CTA: after tactics-only scan, suggest openings scan */}
              {lastRunConfig?.scanMode === "tactics" && (
                <div className="glass-card flex flex-col items-center gap-4 border-emerald-500/15 bg-gradient-to-r from-emerald-500/[0.04] to-transparent p-6 text-center sm:flex-row sm:text-left">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-3xl shadow-lg shadow-emerald-500/10">🔁</span>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-white">Want to find opening leaks too?</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Your tactics scan is complete. Run an openings scan to find repeated patterns where you consistently play suboptimal moves.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => quickScanMode("openings")}
                    className="btn-primary flex h-11 shrink-0 items-center gap-2 px-5 text-sm font-bold"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0022 16z"/></svg>
                    Scan Openings
                  </button>
                </div>
              )}

              {/* CTA: after tactics-only scan, suggest endgame scan */}
              {lastRunConfig?.scanMode === "tactics" && (
                <div className="glass-card flex flex-col items-center gap-4 border-sky-500/15 bg-gradient-to-r from-sky-500/[0.04] to-transparent p-6 text-center sm:flex-row sm:text-left">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-500/15 text-3xl shadow-lg shadow-sky-500/10">♟️</span>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-white">Want to find endgame mistakes too?</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Your tactics scan is complete. Run an endgame scan to catch mistakes in king &amp; pawn endings, rook endgames, and more.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => quickScanMode("endgames")}
                    className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-5 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition hover:shadow-sky-500/30"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                    Scan Endgames
                  </button>
                </div>
              )}

              {/* CTA: after tactics-only scan, suggest time management scan */}
              {lastRunConfig?.scanMode === "tactics" && (
                <div className="glass-card flex flex-col items-center gap-4 border-violet-500/15 bg-gradient-to-r from-violet-500/[0.04] to-transparent p-6 text-center sm:flex-row sm:text-left">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-3xl shadow-lg shadow-violet-500/10">⏱️</span>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-white">Want to analyze your time management?</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Find rushed moves, wasted thinks, and time scrambles. See how your clock usage impacts your results.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => quickScanMode("time-management")}
                    className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/10 px-5 text-sm font-bold text-violet-400 transition hover:border-violet-500/40 hover:bg-violet-500/20"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Scan Time
                  </button>
                </div>
              )}

              {/* ─── Endgame Section ─── */}
              {(lastRunConfig?.scanMode === "endgames" || lastRunConfig?.scanMode === "both") && (
              <>
              <div className="my-4">
                <div className="section-divider" />
              </div>
              <button type="button" onClick={() => setEndgamesOpen(o => !o)} className="glass-card border-sky-500/15 bg-gradient-to-r from-sky-500/[0.04] to-transparent p-6 w-full text-left cursor-pointer transition-colors hover:border-sky-500/25">
                <div className="flex items-center gap-4">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/15 text-3xl shadow-lg shadow-sky-500/10">♟️</span>
                  <div className="flex-1">
                    <h2 className="text-2xl font-extrabold text-white tracking-tight">
                      Endgame Analysis
                      {endgameMistakes.length > 0 && (
                        <span className="ml-3 inline-flex items-center rounded-full bg-sky-500/15 px-3 py-1 text-base font-bold text-sky-400">
                          {endgameMistakes.length} mistake{endgameMistakes.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Endgame positions where your technique cost eval — conversions, holds & accuracy
                    </p>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`shrink-0 text-slate-400 transition-transform duration-200 ${endgamesOpen ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </button>

              {endgamesOpen && (<>
              {/* Endgame Stats Overview */}
              {endgameStats && (
                <div className="glass-card space-y-4 p-5">
                  <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-sky-400"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0022 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                    Endgame Overview
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="stat-card py-3">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Positions Scanned</p>
                      <p className="mt-0.5 text-lg font-bold text-slate-200">{endgameStats.totalPositions}</p>
                    </div>
                    <div className="stat-card py-3">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Avg CP Loss</p>
                      <p className={`mt-0.5 text-lg font-bold ${endgameStats.avgCpLoss <= 30 ? "text-emerald-400" : endgameStats.avgCpLoss <= 60 ? "text-amber-400" : "text-red-400"}`}>
                        {(endgameStats.avgCpLoss / 100).toFixed(2)}
                      </p>
                    </div>
                    <div className="stat-card py-3">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Conversion Rate</p>
                      <p className={`mt-0.5 text-lg font-bold ${endgameStats.conversionRate == null ? "text-slate-500" : endgameStats.conversionRate >= 70 ? "text-emerald-400" : endgameStats.conversionRate >= 50 ? "text-amber-400" : "text-red-400"}`}>
                        {endgameStats.conversionRate != null ? `${endgameStats.conversionRate.toFixed(0)}%` : "N/A"}
                      </p>
                    </div>
                    <div className="stat-card py-3">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Hold Rate</p>
                      <p className={`mt-0.5 text-lg font-bold ${endgameStats.holdRate == null ? "text-slate-500" : endgameStats.holdRate >= 60 ? "text-emerald-400" : endgameStats.holdRate >= 40 ? "text-amber-400" : "text-red-400"}`}>
                        {endgameStats.holdRate != null ? `${endgameStats.holdRate.toFixed(0)}%` : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Coach Insight — Endgames */}
                  {(() => {
                    const { totalPositions, avgCpLoss, conversionRate, holdRate, weakestType } = endgameStats;
                    const mistakeCount = endgameMistakes.length;
                    const mistakeRate = totalPositions > 0 ? mistakeCount / totalPositions : 0;

                    let headline = "";
                    let headlineColor = "gradient-text-sky";
                    const lines: { text: string; type: "positive" | "improve" }[] = [];

                    if (avgCpLoss <= 20 && mistakeRate <= 0.1) {
                      headline = "Your endgame technique is rock-solid.";
                      headlineColor = "gradient-text-emerald";
                    } else if (conversionRate != null && conversionRate < 40) {
                      headline = "You're letting winning endgames slip away.";
                    } else if (holdRate != null && holdRate < 30) {
                      headline = "Defensive endgames need work.";
                    } else if (avgCpLoss > 60) {
                      headline = "Endgame inaccuracies are adding up.";
                    } else if (mistakeRate > 0.25) {
                      headline = "Too many endgame errors for your level.";
                    } else {
                      headline = "Decent endgame play with room to grow.";
                    }

                    // Positives
                    if (conversionRate != null && conversionRate >= 70) lines.push({ text: `${conversionRate.toFixed(0)}% conversion rate — you're cashing in winning positions reliably.`, type: "positive" });
                    if (holdRate != null && holdRate >= 60) lines.push({ text: `${holdRate.toFixed(0)}% hold rate in worse positions — impressive defensive resilience.`, type: "positive" });
                    if (avgCpLoss <= 25 && totalPositions >= 3) lines.push({ text: `Only ${(avgCpLoss / 100).toFixed(2)} avg centipawn loss — your endgame moves are near-engine quality.`, type: "positive" });
                    if (mistakeRate <= 0.1 && mistakeCount > 0) lines.push({ text: `Only ${mistakeCount} mistake${mistakeCount !== 1 ? "s" : ""} across ${totalPositions} positions — very clean technique.`, type: "positive" });

                    // Improvements
                    if (conversionRate != null && conversionRate < 50) lines.push({ text: `Converting only ${conversionRate.toFixed(0)}% of winning endgames. Study technique games to learn how to press advantages home.`, type: "improve" });
                    if (holdRate != null && holdRate < 40) lines.push({ text: `Holding only ${holdRate.toFixed(0)}% of worse positions. Practice fortress setups and learn when draws are achievable.`, type: "improve" });
                    if (weakestType) lines.push({ text: `${weakestType} endgames are your weakest area. Targeted practice here will yield the biggest rating gains.`, type: "improve" });
                    if (avgCpLoss > 60) lines.push({ text: `Averaging ${(avgCpLoss / 100).toFixed(2)} centipawn loss — slow down in endgames and calculate one move deeper.`, type: "improve" });

                    const positives = lines.filter(l => l.type === "positive");
                    const improvements = lines.filter(l => l.type === "improve");
                    const displayLines = [...positives, ...improvements].slice(0, 3);

                    return totalPositions > 0 && displayLines.length > 0 ? (
                      <div className="coach-insight rounded-xl border border-sky-500/10 bg-gradient-to-br from-sky-500/[0.06] to-cyan-500/[0.03] px-5 py-5">
                        <p className={`coach-headline text-lg font-extrabold tracking-tight sm:text-xl ${headlineColor}`}>
                          {headline}
                        </p>
                        <div className="mt-3 space-y-2">
                          {displayLines.map((line, i) => (
                            <div key={i} className={`coach-line-${i + 1} flex items-start gap-2`}>
                              <span className={`mt-0.5 text-xs ${line.type === "positive" ? "text-emerald-400" : "text-slate-500"}`}>
                                {line.type === "positive" ? "✦" : "▸"}
                              </span>
                              <p className={`text-sm leading-relaxed ${line.type === "positive" ? "text-emerald-300/90" : "text-slate-400"}`}>
                                {line.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {/* By-type breakdown — ranked worst to best */}
                  {endgameStats.byType.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Ranked Worst → Best</p>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {endgameStats.byType.map((t, idx) => {
                          const icon = ({ "Pawn": "♟", "Rook": "♜", "Rook + Bishop": "♜♝", "Rook + Knight": "♜♞", "Rook + Minor": "♜♝", "Knight vs Knight": "♞♞", "Bishop vs Bishop": "♝♝", "Knight vs Bishop": "♞♝", "Bishop vs Knight": "♝♞", "Bishop + Knight": "♝♞", "Two Bishops": "♝♝", "Two Knights": "♞♞", "Minor Piece": "♝", "Queen": "♛", "Queen + Rook": "♛♜", "Queen + Minor": "♛♝", "Opposite Bishops": "♗♝", "Complex": "♔" } as Record<string, string>)[t.type] ?? "♔";
                          const total = endgameStats.byType.length;
                          const isWeakest = idx === 0;
                          const isBest = idx === total - 1;
                          // Color gradient: worst (red) → middle (amber) → best (emerald)
                          const ratio = total > 1 ? idx / (total - 1) : 0.5;
                          const rankColor = ratio >= 0.7 ? "text-emerald-400" : ratio >= 0.3 ? "text-amber-400" : "text-red-400";
                          const borderClass = isWeakest
                            ? "border-red-500/20 bg-red-500/[0.06]"
                            : isBest
                              ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                              : "border-white/[0.06] bg-white/[0.02]";
                          const badgeBg = isWeakest
                            ? "bg-red-500/15"
                            : isBest
                              ? "bg-emerald-500/15"
                              : "bg-white/[0.06]";
                          return (
                            <div
                              key={t.type}
                              className={`flex items-center gap-3 rounded-xl border p-3 transition-all hover:border-white/[0.12] ${borderClass}`}
                            >
                              {/* Rank number */}
                              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black ${badgeBg} ${rankColor}`}>
                                #{idx + 1}
                              </div>
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-lg">
                                {icon}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-white">
                                  {t.type}
                                  {isWeakest && <span className="ml-1.5 rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold text-red-400">WEAKEST</span>}
                                  {isBest && <span className="ml-1.5 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">BEST</span>}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {t.count} position{t.count !== 1 ? "s" : ""} · avg <span className={rankColor}>−{(t.avgCpLoss / 100).toFixed(2)}</span> · {t.mistakes} mistake{t.mistakes !== 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {endgameStats.weakestType && (
                    <div className="rounded-xl border border-red-500/10 bg-red-500/[0.03] p-4">
                      <p className="text-sm font-semibold text-red-300">
                        ⚠️ Weakest area: {endgameStats.weakestType} Endgame
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">
                        {({
                          "Pawn": "Practice king activity and passed pawn creation. Study the opposition and key squares — counting tempi is critical.",
                          "Rook": "Study the Lucena and Philidor positions. Keep your rook active and behind passed pawns. Rook activity > material.",
                          "Rook + Bishop": "Focus on restricting the opposing bishop. Use your rook to target fixed pawns and create penetration points.",
                          "Rook + Knight": "Knights need outposts. In open positions the rook dominates — choose your pawn structure wisely.",
                          "Rook + Minor": "Coordinate your pieces. The minor piece often defends while the rook does the attacking. Avoid passive setups.",
                          "Knight vs Knight": "These play like pawn endgames. Focus on king centralisation and creating a passed pawn race.",
                          "Bishop vs Bishop": "Fix enemy pawns on your bishop's colour. Practice creating targets and using your king actively.",
                          "Knight vs Bishop": "If you have the knight, keep pawns locked. If the bishop, open the position and exploit your range.",
                          "Bishop vs Knight": "Use the bishop's long range. Keep the position open and attack pawns on both sides of the board.",
                          "Bishop + Knight": "Practice the B+N checkmate pattern. Coordinate both pieces to restrict the enemy king.",
                          "Two Bishops": "The bishop pair thrives in open positions. Avoid trading one bishop — use both diagonals to dominate.",
                          "Two Knights": "Focus on pawn promotion as two knights alone can't checkmate. Support passed pawns with your knights.",
                          "Minor Piece": "Piece activity and pawn structure are key. Study which minor piece is better in your typical pawn structures.",
                          "Queen": "Centralise your queen and watch for perpetual check resources. King safety is paramount — passed pawns decide.",
                          "Queen + Rook": "Look for back-rank threats and queen+rook batteries. Watch for stalemate tricks when defending.",
                          "Queen + Minor": "Use the queen's mobility to create threats while the minor piece controls key squares.",
                          "Opposite Bishops": "Very drawish — the attacker usually needs pawns on both sides. Build fortresses when defending.",
                          "Complex": "Simplify when ahead, complicate when behind. Prioritise king safety and piece coordination.",
                        } as Record<string, string>)[endgameStats.weakestType] ?? "Focus on endgame training for this type."}
                      </p>
                    </div>
                  )}

                  {/* Additional overview stats */}
                  {endgameMistakes.length > 0 && (
                    <div className="grid gap-2 sm:grid-cols-3">
                      <div className="stat-card py-3">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Mistake Rate</p>
                        <p className={`mt-0.5 text-lg font-bold ${endgameStats.totalPositions > 0 && (endgameMistakes.length / endgameStats.totalPositions) <= 0.1 ? "text-emerald-400" : (endgameMistakes.length / endgameStats.totalPositions) <= 0.25 ? "text-amber-400" : "text-red-400"}`}>
                          {endgameStats.totalPositions > 0 ? ((endgameMistakes.length / endgameStats.totalPositions) * 100).toFixed(0) : 0}%
                        </p>
                      </div>
                      <div className="stat-card py-3">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Worst Blunder</p>
                        <p className="mt-0.5 text-lg font-bold text-red-400">
                          {endgameMistakes.some(m => m.cpLoss >= 99000) ? "Mate" : `−${(Math.max(...endgameMistakes.map(m => m.cpLoss)) / 100).toFixed(1)}`}
                        </p>
                      </div>
                      <div className="stat-card py-3">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Failed Conversions</p>
                        <p className="mt-0.5 text-lg font-bold text-amber-400">
                          {endgameMistakes.filter(m => m.tags.includes("Failed Conversion")).length}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {endgameMistakes.length === 0 ? (
                <div className="glass-card flex items-center gap-4 p-6">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-2xl">✅</span>
                  <div>
                    <p className="font-semibold text-white">No endgame mistakes found</p>
                    <p className="text-sm text-slate-400">
                      You didn&apos;t make significant endgame errors (≥80cp) in these games. Solid technique!
                    </p>
                  </div>
                </div>
              ) : (
                <>
                <CardCarousel
                  viewMode={cardViewMode}
                >
                  {endgameMistakes.map((mistake) => (
                    <EndgameCard
                      key={`${mistake.fenBefore}-${mistake.userMove}-${mistake.gameIndex}`}
                      mistake={mistake}
                      engineDepth={lastRunConfig?.engineDepth ?? engineDepth}
                    />
                  ))}
                </CardCarousel>

                {/* Endgame Drill CTA */}
                {hasProAccess && endgameMistakes.length > 0 && (
                  <div className="relative overflow-hidden rounded-2xl border border-sky-500/20 p-8 md:p-10">
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/[0.08] via-blue-500/[0.04] to-transparent" />
                    <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-sky-500/10 blur-[80px]" />
                    <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-blue-500/10 blur-[80px]" />
                    <div className="relative flex flex-col items-center text-center">
                      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/15 text-3xl shadow-lg shadow-sky-500/10">♔</span>
                      <h3 className="mt-5 text-2xl font-extrabold text-white md:text-3xl">Drill Your Endgame Mistakes</h3>
                      <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-400">
                        Endgames are where games are won and lost. Replay your actual endgame blunders and learn the winning technique.
                      </p>
                      <div className="mt-6 grid w-full max-w-lg gap-3 sm:grid-cols-3">
                        <div className="flex flex-col items-center gap-2 rounded-xl border border-sky-500/15 bg-sky-500/[0.04] px-4 py-3">
                          <span className="text-lg">🎯</span>
                          <p className="text-xs font-bold text-white">Your Endgame Errors</p>
                          <p className="text-[10px] text-slate-500">Positions you botched</p>
                        </div>
                        <div className="flex flex-col items-center gap-2 rounded-xl border border-blue-500/15 bg-blue-500/[0.04] px-4 py-3">
                          <span className="text-lg">♟️</span>
                          <p className="text-xs font-bold text-white">Find the Win</p>
                          <p className="text-[10px] text-slate-500">Convert your advantage</p>
                        </div>
                        <div className="flex flex-col items-center gap-2 rounded-xl border border-sky-500/15 bg-sky-500/[0.04] px-4 py-3">
                          <span className="text-lg">📈</span>
                          <p className="text-xs font-bold text-white">Stop Throwing Games</p>
                          <p className="text-[10px] text-slate-500">Solid technique</p>
                        </div>
                      </div>
                      <div className="mt-7 w-full max-w-md">
                        <DrillMode positions={[]} tactics={[]} endgameMistakes={endgameMistakes} excludeFens={dbApprovedFens} />
                      </div>
                    </div>
                  </div>
                )}
                </>
              )}

              {/* Endgame upsell for free users */}
              {!hasProAccess && endgameMistakes.length >= FREE_ENDGAME_SAMPLE && (
                <div className="glass-card flex flex-col items-center gap-4 border-amber-500/15 bg-gradient-to-r from-amber-500/[0.04] to-transparent p-5 text-center sm:flex-row sm:text-left">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-2xl">🔓</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">Showing {FREE_ENDGAME_SAMPLE} of your endgame mistakes</p>
                    <p className="mt-0.5 text-xs text-slate-400">Upgrade to Pro for unlimited endgame analysis, drill mode, and coaching tips.</p>
                  </div>
                  <Link href="/pricing" className="btn-primary flex h-10 shrink-0 items-center gap-2 px-5 text-sm font-bold">
                    Unlock All
                  </Link>
                </div>
              )}
              </>
              )}
              </>)}

              {/* CTA: after endgames-only scan, suggest opening scan */}
              {lastRunConfig?.scanMode === "endgames" && (
                <div className="glass-card flex flex-col items-center gap-4 border-emerald-500/15 bg-gradient-to-r from-emerald-500/[0.04] to-transparent p-6 text-center sm:flex-row sm:text-left">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-3xl shadow-lg shadow-emerald-500/10">📖</span>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-white">Want the full picture?</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Your endgame scan is complete. Run an Openings or Tactics scan to catch more weaknesses.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => quickScanMode("openings")}
                    className="btn-primary flex h-11 shrink-0 items-center gap-2 px-5 text-sm font-bold"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    Scan Openings
                  </button>
                </div>
              )}

              {/* CTA: after endgames-only scan, suggest time management scan */}
              {lastRunConfig?.scanMode === "endgames" && (
                <div className="glass-card flex flex-col items-center gap-4 border-violet-500/15 bg-gradient-to-r from-violet-500/[0.04] to-transparent p-6 text-center sm:flex-row sm:text-left">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-3xl shadow-lg shadow-violet-500/10">⏱️</span>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-white">Want to analyze your time management?</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Find rushed moves, wasted thinks, and time scrambles. See how your clock usage impacts your results.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => quickScanMode("time-management")}
                    className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/10 px-5 text-sm font-bold text-violet-400 transition hover:border-violet-500/40 hover:bg-violet-500/20"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Scan Time
                  </button>
                </div>
              )}

              {/* CTA: after any non-time scan, suggest time management scan */}
              {lastRunConfig?.scanMode === "both" && (
                <div className="glass-card flex flex-col items-center gap-4 border-violet-500/15 bg-gradient-to-r from-violet-500/[0.04] to-transparent p-6 text-center sm:flex-row sm:text-left">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-3xl shadow-lg shadow-violet-500/10">⏱️</span>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-white">Want to analyze your time management?</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Find rushed moves, wasted thinks, and time scrambles. See how your clock usage impacts your results.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => quickScanMode("time-management")}
                    className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/10 px-5 text-sm font-bold text-violet-400 transition hover:border-violet-500/40 hover:bg-violet-500/20"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Scan Time
                  </button>
                </div>
              )}

              {/* ─── Time Management Section ─── */}
              {lastRunConfig?.scanMode === "time-management" && timeManagement && timeManagement.moments.length > 0 && (
              <>
              <div className="my-4">
                <div className="section-divider" />
              </div>
              <button type="button" onClick={() => setTimeManagementOpen(o => !o)} className="glass-card border-violet-500/15 bg-gradient-to-r from-violet-500/[0.04] to-transparent p-6 w-full text-left cursor-pointer transition-colors hover:border-violet-500/25">
                <div className="flex items-center gap-4">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/15 text-3xl shadow-lg shadow-violet-500/10">⏱️</span>
                  <div className="flex-1">
                    <h2 className="text-2xl font-extrabold text-white tracking-tight">
                      Time Management
                      <span className="ml-3 inline-flex items-center rounded-full bg-violet-500/15 px-3 py-1 text-base font-bold text-violet-400">
                        {timeManagement.moments.length} moment{timeManagement.moments.length !== 1 ? "s" : ""}
                      </span>
                      {!hasProAccess && !timeUnlocked && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-400">
                          🪙 Pro
                        </span>
                      )}
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Moments where your clock usage was exceptional or cost you — time wasted, rushed moves, and justified thinks
                    </p>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`shrink-0 text-slate-400 transition-transform duration-200 ${timeManagementOpen ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </button>

              {timeManagementOpen && (
              <>
              {/* Time Management Overview Stats */}
              <div className="glass-card space-y-4 p-5">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-violet-400"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Time Overview
                </h3>
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
                  <div className="stat-card py-3">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Score</p>
                    <p className={`mt-0.5 text-lg font-bold ${timeManagement.score >= 70 ? "text-emerald-400" : timeManagement.score >= 45 ? "text-amber-400" : "text-red-400"}`}>
                      {timeManagement.score}/100
                    </p>
                  </div>
                  <div className="stat-card py-3">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Avg / Move</p>
                    <p className="mt-0.5 text-lg font-bold text-slate-200">{timeManagement.avgTimePerMove.toFixed(1)}s</p>
                  </div>
                  <div className="stat-card py-3">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Justified Thinks</p>
                    <p className="mt-0.5 text-lg font-bold text-emerald-400">{timeManagement.justifiedThinks}</p>
                  </div>
                  <div className="stat-card py-3">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Time Wasted</p>
                    <p className="mt-0.5 text-lg font-bold text-red-400">{timeManagement.wastedThinks}</p>
                  </div>
                  <div className="stat-card py-3">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Rushed Moves</p>
                    <p className="mt-0.5 text-lg font-bold text-amber-400">{timeManagement.rushedMoves}</p>
                  </div>
                </div>
                {timeManagement.timeScrambleCount > 0 && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-500/15 bg-red-500/[0.05] px-3 py-2">
                    <span className="text-base">🚨</span>
                    <p className="text-xs text-red-400">
                      <span className="font-semibold">{timeManagement.timeScrambleCount}</span> of {timeManagement.gamesWithClockData} games had time scrambles (clock below 10% of starting time)
                    </p>
                  </div>
                )}
              </div>

              {/* Coach Insight — Time Management */}
              {(() => {
                const { score, wastedThinks, rushedMoves, justifiedThinks, avgTimePerMove, timeScrambleCount, moments, gamesWithClockData } = timeManagement;
                const total = moments.length;
                const rushRatio = total > 0 ? rushedMoves / total : 0;
                const wasteRatio = total > 0 ? wastedThinks / total : 0;

                let headline = "";
                let headlineColor = "gradient-text-violet";
                const lines: { text: string; type: "positive" | "improve" }[] = [];

                if (score >= 75) {
                  headline = "Your clock management is a weapon.";
                  headlineColor = "gradient-text-emerald";
                } else if (wasteRatio > rushRatio && wastedThinks >= 3) {
                  headline = "You're overthinking quiet positions.";
                } else if (rushRatio > wasteRatio && rushedMoves >= 3) {
                  headline = "Slow down — speed is costing you.";
                } else if (score >= 50) {
                  headline = "Room to sharpen your clock sense.";
                } else {
                  headline = "Your clock is working against you.";
                }

                // Positive lines
                if (justifiedThinks >= 3) lines.push({ text: `${justifiedThinks} moments where you invested time wisely — great instinct for critical positions.`, type: "positive" });
                if (timeScrambleCount === 0 && gamesWithClockData >= 3) lines.push({ text: "You avoided time scrambles across all games — excellent composure.", type: "positive" });
                if (avgTimePerMove >= 8 && avgTimePerMove <= 25 && score >= 60) lines.push({ text: `Averaging ${avgTimePerMove.toFixed(1)}s per move — a healthy, sustainable pace.`, type: "positive" });

                // Improvement lines
                if (wastedThinks >= 3) lines.push({ text: `${wastedThinks} moments of overthinking on non-critical positions. Trust your intuition more on forced or simple moves.`, type: "improve" });
                if (rushedMoves >= 3) lines.push({ text: `${rushedMoves} rushed decisions in complex positions. When the position is sharp, invest an extra 5-10 seconds.`, type: "improve" });
                if (timeScrambleCount >= 2) lines.push({ text: `${timeScrambleCount} games ended in time trouble. Budget your clock more evenly across the game.`, type: "improve" });
                if (avgTimePerMove < 5 && score < 60) lines.push({ text: `Only ${avgTimePerMove.toFixed(1)}s per move on average — try to slow down in middlegame complications.`, type: "improve" });
                if (avgTimePerMove > 30) lines.push({ text: `${avgTimePerMove.toFixed(1)}s per move is high — practice pattern recognition to make routine decisions faster.`, type: "improve" });

                // Cap at 3 lines, prioritize positives first then improvements
                const positives = lines.filter(l => l.type === "positive");
                const improvements = lines.filter(l => l.type === "improve");
                const displayLines = [...positives, ...improvements].slice(0, 3);

                return displayLines.length > 0 ? (
                  <div className="coach-insight rounded-xl border border-violet-500/10 bg-gradient-to-br from-violet-500/[0.06] to-purple-500/[0.03] px-5 py-5">
                    <p className={`coach-headline text-lg font-extrabold tracking-tight sm:text-xl ${headlineColor}`}>
                      {headline}
                    </p>
                    <div className="mt-3 space-y-2">
                      {displayLines.map((line, i) => (
                        <div key={i} className={`coach-line-${i + 1} flex items-start gap-2`}>
                          <span className={`mt-0.5 text-xs ${line.type === "positive" ? "text-emerald-400" : "text-slate-500"}`}>
                            {line.type === "positive" ? "✦" : "▸"}
                          </span>
                          <p className={`text-sm leading-relaxed ${line.type === "positive" ? "text-emerald-300/90" : "text-slate-400"}`}>
                            {line.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Verdict filter tabs */}
              {(() => {
                const wastedCount = timeManagement.moments.filter(m => m.verdict === "wasted").length;
                const rushedCount = timeManagement.moments.filter(m => m.verdict === "rushed").length;
                const justifiedCount = timeManagement.moments.filter(m => m.verdict === "justified").length;
                const tabs = [
                  { key: "all" as const, label: "All", count: timeManagement.moments.length, icon: "📊", color: "text-violet-400", bg: "bg-violet-500/15", activeBg: "bg-violet-500/20", border: "border-violet-500/30" },
                  { key: "wasted" as const, label: "Time Wasted", count: wastedCount, icon: "⏳", color: "text-red-400", bg: "bg-red-500/15", activeBg: "bg-red-500/20", border: "border-red-500/30" },
                  { key: "rushed" as const, label: "Rushed", count: rushedCount, icon: "💨", color: "text-amber-400", bg: "bg-amber-500/15", activeBg: "bg-amber-500/20", border: "border-amber-500/30" },
                  { key: "justified" as const, label: "Well-Timed", count: justifiedCount, icon: "✅", color: "text-emerald-400", bg: "bg-emerald-500/15", activeBg: "bg-emerald-500/20", border: "border-emerald-500/30" },
                ];
                return (
                  <div className="flex flex-wrap gap-2">
                    {tabs.map(t => (
                      <button
                        key={t.key}
                        onClick={() => setTimeVerdictTab(t.key)}
                        disabled={t.count === 0 && t.key !== "all"}
                        className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                          timeVerdictTab === t.key
                            ? `${t.border} ${t.activeBg} ${t.color}`
                            : "border-white/[0.06] bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
                        } disabled:opacity-30 disabled:cursor-not-allowed`}
                      >
                        <span>{t.icon}</span>
                        <span>{t.label}</span>
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${timeVerdictTab === t.key ? t.bg : "bg-white/[0.06]"}`}>{t.count}</span>
                      </button>
                    ))}
                  </div>
                );
              })()}

              {/* Time moment cards — using CardCarousel for list/grid/swipe, gated for free users */}
              {(() => {
                const filteredMoments = timeVerdictTab === "all"
                  ? timeManagement.moments
                  : timeManagement.moments.filter(m => m.verdict === timeVerdictTab);
                return hasProAccess || timeUnlocked ? (
                  filteredMoments.length > 0 ? (
                    <CardCarousel viewMode={cardViewMode}>
                      {filteredMoments.map((moment) => (
                        <TimeCard
                          key={`${moment.fen}-${moment.userMove}-${moment.gameIndex}`}
                          moment={moment}
                        />
                      ))}
                    </CardCarousel>
                  ) : (
                    <div className="glass-card flex items-center justify-center p-8 text-sm text-slate-500">
                      No moments in this category
                    </div>
                  )
                ) : (
                  <>
                    {/* Free preview: first 3 cards */}
                    {filteredMoments.length > 0 ? (
                      <CardCarousel viewMode={cardViewMode}>
                        {filteredMoments.slice(0, 3).map((moment) => (
                          <TimeCard
                            key={`${moment.fen}-${moment.userMove}-${moment.gameIndex}`}
                            moment={moment}
                          />
                        ))}
                      </CardCarousel>
                    ) : (
                      <div className="glass-card flex items-center justify-center p-8 text-sm text-slate-500">
                        No moments in this category
                      </div>
                    )}

                  {/* Upgrade CTA for the rest */}
                  {filteredMoments.length > 3 && (
                <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.06] via-violet-600/[0.03] to-transparent p-8">
                  <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-violet-500/10 blur-[60px]" />
                  <div className="relative flex flex-col items-center gap-4 text-center">
                    <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/15 text-3xl shadow-lg shadow-violet-500/10">⏱️</span>
                    <div>
                      <h3 className="text-xl font-bold text-white">Unlock All Time Management Moments</h3>
                      <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
                        {timeManagement.moments.length - 3} more moment{timeManagement.moments.length - 3 !== 1 ? "s" : ""} found.
                        Upgrade to Pro or unlock with coins to see the full breakdown.
                      </p>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                      <Link
                        href="/pricing"
                        className="btn-primary flex h-11 items-center gap-2 px-6 text-sm font-bold"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                        Upgrade to Pro
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          const cost = 30;
                          const balance = getBalance();
                          if (balance < cost) {
                            setToast(`Not enough coins (${balance}/${cost}) — earn more by completing daily challenges and study tasks!`);
                            if (toastTimer.current) clearTimeout(toastTimer.current);
                            toastTimer.current = setTimeout(() => setToast(null), 3000);
                            return;
                          }
                          const ok = spendCoins(cost, "time-management-unlock");
                          if (ok) {
                            setTimeUnlocked(true);
                            setToast("🎉 Time Management unlocked! Spend wisely.");
                            if (toastTimer.current) clearTimeout(toastTimer.current);
                            toastTimer.current = setTimeout(() => setToast(null), 3000);
                          }
                        }}
                        className="flex h-11 items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 text-sm font-bold text-amber-400 transition hover:bg-amber-500/20"
                      >
                        <span>🪙</span> Unlock for 30 Coins
                      </button>
                    </div>
                  </div>
                </div>
                  )}

                  {/* Time Pressure Training CTA */}
                  <div className="glass-card flex flex-col items-center gap-4 border-violet-500/15 bg-gradient-to-r from-violet-500/[0.04] to-transparent p-6 text-center sm:flex-row sm:text-left">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-3xl shadow-lg shadow-violet-500/10">🎯</span>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-white">Practice under time pressure</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        Head to the Training Center to replay your rushed and overthought positions under simulated clock pressure.
                        <span className="ml-1 text-amber-400">Save this report first to unlock Time Pressure training.</span>
                      </p>
                    </div>
                    <Link
                      href="/train"
                      className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/10 px-5 text-sm font-bold text-violet-400 transition hover:border-violet-500/40 hover:bg-violet-500/20"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      Time Pressure Training
                    </Link>
                  </div>
                </>
              );
              })()}
              </>
              )}
              </>
              )}


              {/* Diagnostics */}
              {diagnostics && (
                <div className="glass-card space-y-4 p-6">
                  <h2 className="flex items-center gap-2 text-base font-bold text-white">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
                    Analysis Logs
                  </h2>

                  <details className="group rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <summary className="cursor-pointer select-none px-4 py-3 font-medium text-slate-200 transition-colors hover:text-white">
                      <span className="inline-flex items-center gap-2">
                        Game traces
                        <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-slate-400">{diagnostics.gameTraces.length}</span>
                      </span>
                    </summary>
                    <div className="max-h-80 space-y-2 overflow-auto border-t border-white/[0.04] p-4 font-mono text-xs text-slate-400">
                      {diagnostics.gameTraces.map((trace) => (
                        <div key={`game-${trace.gameIndex}`} className="rounded-lg border border-white/[0.04] bg-white/[0.01] p-3">
                          <p className="text-slate-300">
                            #{trace.gameIndex} &middot; {trace.userColor} &middot; {trace.openingMoves.length} moves
                          </p>
                          <p className="mt-1 break-words text-slate-500">
                            {trace.openingMoves.length ? trace.openingMoves.join(" ") : "(no opening moves parsed)"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </details>

                  <details className="group rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <summary className="cursor-pointer select-none px-4 py-3 font-medium text-slate-200 transition-colors hover:text-white">
                      <span className="inline-flex items-center gap-2">
                        Position traces
                        <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-slate-400">{diagnostics.positionTraces.length}</span>
                      </span>
                    </summary>
                    <div className="max-h-96 space-y-2 overflow-auto border-t border-white/[0.04] p-4 font-mono text-xs text-slate-400">
                      {diagnostics.positionTraces.map((trace, index) => (
                        <div key={`pos-${index}-${trace.fenBefore}`} className="rounded-lg border border-white/[0.04] bg-white/[0.01] p-3">
                          <p className="text-slate-300">
                            reach={trace.reachCount}, userMove={trace.userMove}, best={trace.bestMove ?? "n/a"}, cpLoss={
                              trace.cpLoss ?? "n/a"
                            }, flagged={trace.flagged ? "yes" : "no"}
                          </p>
                          <p className="mt-1 text-slate-500">
                            evalBefore={trace.evalBefore ?? "n/a"}, evalAfter={trace.evalAfter ?? "n/a"}
                            {trace.skippedReason ? `, skipped=${trace.skippedReason}` : ""}
                          </p>
                          <p className="mt-1 break-all text-slate-500">fen={trace.fenBefore}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}

              {/* Combined Drill Mode */}
              {diagnostics && (diagnostics.positionTraces.length > 0 || missedTactics.length > 0 || endgameMistakes.length > 0) && hasProAccess && lastRunConfig?.scanMode === "both" && (
                <div className="relative overflow-hidden rounded-2xl border border-fuchsia-500/20 p-8 md:p-10">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-fuchsia-500/[0.08] via-violet-500/[0.04] to-transparent" />
                  <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-fuchsia-500/10 blur-[80px]" />
                  <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-violet-500/10 blur-[80px]" />
                  <div className="relative flex flex-col items-center text-center">
                    <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-fuchsia-500/15 text-3xl shadow-lg shadow-fuchsia-500/10">🔥</span>
                    <h3 className="mt-5 text-2xl font-extrabold text-white md:text-3xl">Combined Drill Mode</h3>
                    <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-400">
                      Practice everything in one session — opening leaks, missed tactics, and endgame blunders from your actual games, all in one drill.
                    </p>
                    <div className="mt-6 grid w-full max-w-lg gap-3 sm:grid-cols-3">
                      <div className="flex flex-col items-center gap-2 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] px-4 py-3">
                        <span className="text-lg">📖</span>
                        <p className="text-xs font-bold text-white">Openings</p>
                        <p className="text-[10px] text-slate-500">{diagnostics.positionTraces.filter(t => t.flagged).length} positions</p>
                      </div>
                      <div className="flex flex-col items-center gap-2 rounded-xl border border-amber-500/15 bg-amber-500/[0.04] px-4 py-3">
                        <span className="text-lg">⚔️</span>
                        <p className="text-xs font-bold text-white">Tactics</p>
                        <p className="text-[10px] text-slate-500">{missedTactics.length} missed</p>
                      </div>
                      <div className="flex flex-col items-center gap-2 rounded-xl border border-sky-500/15 bg-sky-500/[0.04] px-4 py-3">
                        <span className="text-lg">♔</span>
                        <p className="text-xs font-bold text-white">Endgames</p>
                        <p className="text-[10px] text-slate-500">{endgameMistakes.length} mistakes</p>
                      </div>
                    </div>
                    <div className="mt-7 w-full max-w-md">
                      <DrillMode positions={diagnostics.positionTraces} tactics={missedTactics} endgameMistakes={endgameMistakes} oneOffMistakes={oneOffMistakes} excludeFens={dbApprovedFens} />
                    </div>
                  </div>
                </div>
              )}

              {/* ─── Save to Dashboard CTA ─── */}
              {saveStatus !== "saved" && saveStatus !== "duplicate" && (
                <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 p-8 md:p-10">
                  {/* Decorative background */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/[0.08] via-emerald-500/[0.04] to-fuchsia-500/[0.08]" />
                  <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-500/10 blur-[80px]" />
                  <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-[80px]" />

                  <div className="relative flex flex-col items-center text-center">
                    <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/15 text-3xl shadow-lg shadow-cyan-500/10">📊</span>
                    <h3 className="mt-5 text-2xl font-extrabold text-white md:text-3xl">
                      {authenticated ? "Save this report to your Dashboard" : "Track your improvement over time"}
                    </h3>
                    <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-400">
                      {authenticated
                        ? "Save your analysis and compare future scans side-by-side. Watch your accuracy climb, leak count drop, and tactics sharpen — all from your personal dashboard."
                        : "Create a free account to save reports, compare scans over time, and watch your accuracy and tactics improve week over week."}
                    </p>
                    <p className="mx-auto mt-2 max-w-lg text-xs text-amber-400/80">
                      💡 Training modes (Weakness Trainer, Endgame Gym, Time Pressure) require saved reports to generate personalized exercises.
                    </p>

                    {/* Feature highlights — cards */}
                    <div className="mt-6 grid w-full max-w-lg gap-3 sm:grid-cols-2">
                      <div className="flex items-center gap-3 rounded-xl border border-violet-500/20 bg-violet-500/[0.06] px-4 py-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-lg">📋</span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white">Study Plan</p>
                          <p className="text-[11px] text-slate-400">Weekly tasks based on your weaknesses</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.06] px-4 py-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-lg">📈</span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white">Progress Charts</p>
                          <p className="text-[11px] text-slate-400">Compare accuracy across scans</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-lg">🔥</span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white">Daily Streaks</p>
                          <p className="text-[11px] text-slate-400">Build consistency with daily goals</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-lg">🎯</span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white">Track Accuracy</p>
                          <p className="text-[11px] text-slate-400">Watch your rating estimates improve</p>
                        </div>
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="mt-7">
                      {saveStatus === "saving" ? (
                        <span className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600/20 px-8 py-3.5 text-sm font-semibold text-cyan-300">
                          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
                            <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                          </svg>
                          Saving…
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (!authenticated) { window.location.href = "/auth/signin"; return; }
                            saveReportToAccount();
                          }}
                          className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-emerald-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:shadow-xl hover:shadow-cyan-500/30 hover:brightness-110"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                          {authenticated ? "Save to Dashboard" : "Sign in to Save — it\u2019s free"}
                        </button>
                      )}
                    </div>

                    {saveStatus === "error" && (
                      <p className="mt-3 text-xs text-red-400">Something went wrong — please try again.</p>
                    )}

                    {!authenticated && (
                      <p className="mt-4 text-xs text-slate-500">No credit card required · Google, Lichess, or email sign-in</p>
                    )}
                  </div>
                </div>
              )}

              {/* Already-saved confirmation */}
              {(saveStatus === "saved" || saveStatus === "duplicate") && (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-8 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-2xl">✅</span>
                  <p className="text-lg font-bold text-white">Report saved to your Dashboard</p>
                  <p className="max-w-md text-sm text-slate-400">
                    A personalized study plan has been generated based on your weaknesses. Check your dashboard to start your weekly training.
                  </p>
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-2.5 text-sm font-semibold text-emerald-400 transition-all hover:border-emerald-500/40 hover:bg-emerald-500/20"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                      View Dashboard & Study Plan
                    </Link>
                  </div>
                </div>
              )}

              {/* Viral share CTA — always visible */}
              <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 p-8 md:p-10">
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/[0.06] via-fuchsia-500/[0.04] to-cyan-500/[0.06]" />
                    <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-500/10 blur-[80px]" />
                    <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-fuchsia-500/10 blur-[80px]" />

                    <div className="relative flex flex-col items-center text-center">
                      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/15 text-3xl shadow-lg shadow-violet-500/10">🔥</span>

                      <h3 className="mt-5 text-2xl font-extrabold text-white md:text-3xl">
                        Challenge Your Chess Friends
                      </h3>
                      <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-400">
                        Think you had a good report? Share your results and challenge your friends to beat your accuracy score. Who has fewer opening leaks?
                      </p>

                      {/* Stats preview */}
                      {report && (
                        <div className="mt-6 grid w-full max-w-md gap-3 grid-cols-3">
                          <div className="flex flex-col items-center gap-1 rounded-xl border border-violet-500/15 bg-violet-500/[0.04] px-3 py-3">
                            <span className={`text-2xl font-black tabular-nums ${report.estimatedAccuracy >= 80 ? "text-emerald-400" : report.estimatedAccuracy >= 60 ? "text-amber-400" : "text-red-400"}`}>
                              {report.estimatedAccuracy.toFixed(0)}%
                            </span>
                            <p className="text-[10px] font-medium text-slate-500">Accuracy</p>
                          </div>
                          <div className="flex flex-col items-center gap-1 rounded-xl border border-fuchsia-500/15 bg-fuchsia-500/[0.04] px-3 py-3">
                            <span className="text-2xl font-black tabular-nums text-fuchsia-400">{result.leaks.length}</span>
                            <p className="text-[10px] font-medium text-slate-500">Leaks</p>
                          </div>
                          <div className="flex flex-col items-center gap-1 rounded-xl border border-cyan-500/15 bg-cyan-500/[0.04] px-3 py-3">
                            <span className="text-2xl font-black tabular-nums text-cyan-400">{report.estimatedRating}</span>
                            <p className="text-[10px] font-medium text-slate-500">Est. Elo</p>
                          </div>
                        </div>
                      )}

                      {/* Share buttons — big and prominent */}
                      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                        {/* Share on X */}
                        <button
                          type="button"
                          onClick={() => {
                            const acc = report ? `${report.estimatedAccuracy.toFixed(1)}% accuracy` : `${result.gamesAnalyzed} games scanned`;
                            const text = `🔥 Just analyzed my chess games on FireChess:\n\n${acc}${result.playerRating ? ` (${result.playerRating})` : ""}\n📊 ${result.leaks.length} opening leaks\n⚔️ ${result.missedTactics.length} missed tactics\n${report?.vibeTitle ? `\n"${report.vibeTitle}"\n` : ""}\nCan you beat my score? Scan yours free 👇`;
                            window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent("https://firechess.com")}`, "_blank", "noopener");
                          }}
                          className="inline-flex items-center gap-2 rounded-xl bg-white/[0.08] px-6 py-3 text-sm font-bold text-white transition-all hover:bg-white/[0.14] hover:shadow-lg"
                        >
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                          Post on X
                        </button>

                        {/* Share on Reddit */}
                        <button
                          type="button"
                          onClick={() => {
                            const title = `🔥 My FireChess Analysis: ${report ? `${report.estimatedAccuracy.toFixed(1)}% accuracy` : `${result.gamesAnalyzed} games`}${result.playerRating ? ` (${result.playerRating})` : ""} — can you beat this?`;
                            window.open(`https://www.reddit.com/submit?url=${encodeURIComponent("https://firechess.com")}&title=${encodeURIComponent(title)}`, "_blank", "noopener");
                          }}
                          className="inline-flex items-center gap-2 rounded-xl bg-orange-500/10 px-6 py-3 text-sm font-bold text-orange-400 transition-all hover:bg-orange-500/20 hover:shadow-lg"
                        >
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" /></svg>
                          r/chess
                        </button>

                        {/* Share Image */}
                        {report && (
                          <button
                            type="button"
                            onClick={() => {
                              shareReportCard({
                                username: result.username,
                                source: lastRunConfig?.source ?? "lichess",
                                accuracy: report.estimatedAccuracy,
                                estimatedRating: report.estimatedRating,
                                avgCpLoss: report.weightedCpLoss,
                                severeLeakRate: report.severeLeakRate,
                                gamesAnalyzed: result.gamesAnalyzed,
                                leakCount: result.leaks.length,
                                tacticsCount: result.missedTactics.length,
                                vibeTitle: report.vibeTitle,
                              });
                            }}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500/15 to-fuchsia-500/15 px-6 py-3 text-sm font-bold text-violet-300 transition-all hover:from-violet-500/25 hover:to-fuchsia-500/25 hover:shadow-lg"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            Share Report Card
                          </button>
                        )}

                        {/* Copy link */}
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText("https://firechess.com");
                            setCopyLinkLabel("Copied!");
                            setTimeout(() => setCopyLinkLabel("Copy Link"), 1500);
                          }}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-6 py-3 text-sm font-bold text-slate-300 transition-all hover:bg-white/[0.08] hover:text-white"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                          {copyLinkLabel}
                        </button>
                      </div>

                      <p className="mt-5 text-xs text-slate-500">
                        💡 Players who share get their friends analyzing too — and you can compare progress on your dashboards
                      </p>
                    </div>
                  </div>
            </section>
          )}
        </section>
      </div>

      {/* ─── Sticky Save Bar ─── */}
      {state === "done" && result && saveStatus !== "saved" && saveStatus !== "duplicate" && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] bg-slate-950/90 backdrop-blur-lg">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
            <p className="text-sm text-slate-300">
              <span className="font-semibold text-white">{result.leaks.length} leaks</span> &middot; <span className="font-semibold text-white">{result.missedTactics.length} tactics</span>
              {result.endgameMistakes.length > 0 && <> &middot; <span className="font-semibold text-white">{result.endgameMistakes.length} endgame</span></>}
              {" "} found — save to unlock training modes
            </p>
            <button
              type="button"
              onClick={() => {
                if (!authenticated) { window.location.href = "/auth/signin"; return; }
                saveReportToAccount();
              }}
              disabled={saveStatus === "saving"}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:brightness-110 disabled:opacity-50"
            >
              {saveStatus === "saving" ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
                    <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Saving…
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
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
