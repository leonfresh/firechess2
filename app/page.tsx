"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DrillMode } from "@/components/drill-mode";
import { HeroDemoBoard } from "@/components/hero-demo-board";
import { MistakeCard } from "@/components/mistake-card";
import { TacticCard } from "@/components/tactic-card";
import { useSession } from "@/components/session-provider";
import { StrengthsRadar, RadarLegend, InsightCards, computeRadarData } from "@/components/radar-chart";
import { analyzeOpeningLeaksInBrowser } from "@/lib/client-analysis";
import type { AnalysisProgress } from "@/lib/client-analysis";
import type { AnalysisSource, ScanMode, TimeControl } from "@/lib/client-analysis";
import type { AnalyzeResponse } from "@/lib/types";
import { fetchExplorerMoves } from "@/lib/lichess-explorer";

type RequestState = "idle" | "loading" | "done" | "error";
const PREFS_KEY = "firechess-user-prefs";
const FREE_MAX_GAMES = 300;
const FREE_MAX_DEPTH = 12;
const FREE_TACTIC_SAMPLE = 3;
const LOCAL_PRO_HOTKEY_ENABLED = process.env.NEXT_PUBLIC_ENABLE_LOCAL_PRO_HOTKEY !== "false";
const IS_DEV = process.env.NODE_ENV !== "production";

export default function HomePage() {
  const { plan: sessionPlan, authenticated } = useSession();
  const [username, setUsername] = useState("");
  const [gameCount, setGameCount] = useState(300);
  const [moveCount, setMoveCount] = useState(20);
  const [cpThreshold, setCpThreshold] = useState(50);
  const [engineDepth, setEngineDepth] = useState(12);
  const [source, setSource] = useState<AnalysisSource>("lichess");
  const [scanMode, setScanMode] = useState<ScanMode>("openings");
  const [speed, setSpeed] = useState<TimeControl[]>(["all"]);
  const [lastRunConfig, setLastRunConfig] =
    useState<{ maxGames: number; maxMoves: number; cpThreshold: number; engineDepth: number; source: AnalysisSource; scanMode: ScanMode; speed: TimeControl[] } | null>(null);
  const [state, setState] = useState<RequestState>("idle");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [progressInfo, setProgressInfo] = useState<{ message: string; detail?: string; percent: number; phase: string }>({ message: "", percent: 0, phase: "" });
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [localProEnabled, setLocalProEnabled] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "duplicate" | "error">("idle");
  const hasProAccess = sessionPlan === "pro" || localProEnabled;
  const gamesOverFreeLimit = gameCount > FREE_MAX_GAMES;
  const depthOverFreeLimit = engineDepth > FREE_MAX_DEPTH;
  const freeLimitsExceeded = !hasProAccess && (gamesOverFreeLimit || depthOverFreeLimit);

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
      };

      if (typeof parsed.gameCount === "number") {
        setGameCount(Math.min(5000, Math.max(1, Math.floor(parsed.gameCount))));
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
      if (parsed.scanMode === "openings" || parsed.scanMode === "tactics" || parsed.scanMode === "both") {
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
          speed
        })
      );
    } catch {
      // ignore storage write failures
    }
  }, [gameCount, moveCount, cpThreshold, engineDepth, source, scanMode, speed]);

  const leaks = useMemo(() => result?.leaks ?? [], [result]);
  const missedTactics = useMemo(() => result?.missedTactics ?? [], [result]);

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

  // Motif clustering for missed tactics
  const tacticMotifs = useMemo(() => {
    if (missedTactics.length === 0) return [];

    // Define motif categories with matching logic
    const motifDefs: { name: string; icon: string; match: (t: typeof missedTactics[0]) => boolean }[] = [
      { name: "Missed Mate", icon: "👑", match: (t) => t.tags.some((tag) => tag === "Missed Mate" || tag === "Winning Blunder") && (t.cpLoss >= 99000 || t.cpBefore >= 99000) },
      { name: "Missed Check", icon: "⚡", match: (t) => t.tags.includes("Missed Check") },
      { name: "Missed Capture", icon: "🗡️", match: (t) => t.tags.includes("Missed Capture") || t.tags.includes("Forcing Capture") },
      { name: "Back Rank Threats", icon: "🏰", match: (t) => t.tags.includes("Back Rank") },
      { name: "Knight Tactics", icon: "♞", match: (t) => t.tags.includes("Knight Fork?") },
      { name: "Queen Tactics", icon: "♛", match: (t) => t.tags.includes("Queen Tactic") },
      { name: "Converting Advantage", icon: "📈", match: (t) => t.tags.includes("Converting Advantage") },
      { name: "Equal Position Misses", icon: "⚖️", match: (t) => t.tags.includes("Equal Position") },
    ];

    const groups: { name: string; icon: string; count: number; avgCpLoss: number; tactics: typeof missedTactics }[] = [];

    for (const def of motifDefs) {
      const matching = missedTactics.filter(def.match);
      if (matching.length >= 1) {
        const avgLoss = matching.reduce((sum, t) => sum + t.cpLoss, 0) / matching.length;
        groups.push({
          name: def.name,
          icon: def.icon,
          count: matching.length,
          avgCpLoss: avgLoss,
          tactics: matching
        });
      }
    }

    return groups.sort((a, b) => b.count - a.count);
  }, [missedTactics]);

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
    if (!result || !report || !lastRunConfig) return;
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
          estimatedAccuracy: report.estimatedAccuracy,
          estimatedRating: report.estimatedRating,
          weightedCpLoss: report.weightedCpLoss,
          severeLeakRate: report.severeLeakRate,
          repeatedPositions: result.repeatedPositions,
          leaks: result.leaks,
          missedTactics: result.missedTactics,
          diagnostics: result.diagnostics ?? null,
          reportMeta: {
            consistencyScore: report.consistencyScore,
            p75CpLoss: report.p75CpLoss,
            confidence: report.confidence,
            topTag: report.topTag,
            vibeTitle: report.vibeTitle,
            sampleSize: report.sampleSize,
          },
          contentHash,
        }),
      });
      const json = await res.json();
      if (json.saved) {
        setSaveStatus("saved");
      } else if (json.reason === "duplicate") {
        setSaveStatus("duplicate");
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
    scanModeOverride?: ScanMode
  ) => {
    setNotice(reason ?? "Cloud eval disabled. Running local Stockfish analysis in your browser.");
    // Free users always get openings + a small tactics sample;
    // Pro users get whichever mode they selected
    const effectiveScanMode: ScanMode = !hasProAccess
      ? "both"   // always run both so free users get a taste of tactics
      : (scanModeOverride ?? scanMode);
    const effectiveMaxTactics = !hasProAccess ? FREE_TACTIC_SAMPLE : 25;

    const browserResult = await analyzeOpeningLeaksInBrowser(trimmed, {
      source: safeSource,
      scanMode: effectiveScanMode,
      timeControl: speed,
      maxGames: safeGames,
      maxOpeningMoves: safeMoves,
      cpLossThreshold: safeCpThreshold,
      engineDepth: safeDepth,
      maxTactics: effectiveMaxTactics,
      onProgress: onBrowserProgress
    });
    setResult(browserResult);
    setState("done");
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = username.trim();
    if (!trimmed) {
      setError("Please enter a Lichess username.");
      setState("error");
      return;
    }

    if (!hasProAccess && gameCount > FREE_MAX_GAMES) {
      setError(
        `Free plan supports up to ${FREE_MAX_GAMES} recent games per scan. Set games to ${FREE_MAX_GAMES} or less, or upgrade on /pricing.`
      );
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
      const safeGames = Math.min(5000, Math.max(1, Math.floor(gameCount || 300)));
      const safeMoves = Math.min(30, Math.max(1, Math.floor(moveCount || 20)));
      const safeCpThreshold = Math.min(1000, Math.max(1, Math.floor(cpThreshold || 50)));
      const safeDepth = Math.min(24, Math.max(6, Math.floor(engineDepth || 12)));
      const safeSource: AnalysisSource = source === "chesscom" ? "chesscom" : "lichess";
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
      setProgressInfo({ message: "🚀 Starting analysis", detail: `${safeSource === "chesscom" ? "Chess.com" : "Lichess"} · ${speed.includes("all") ? "All time controls" : speed.join(", ")} · ${safeGames} games · Depth ${safeDepth}`, percent: 0, phase: "fetch" });

      await runBrowserAnalysis(trimmed, safeGames, safeMoves, safeCpThreshold, safeDepth, safeSource);
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
      {/* Animated floating orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="animate-float absolute -left-32 top-20 h-96 w-96 rounded-full bg-emerald-500/[0.07] blur-[100px]" />
        <div className="animate-float-delayed absolute -right-32 top-40 h-80 w-80 rounded-full bg-cyan-500/[0.06] blur-[100px]" />
        <div className="animate-float absolute bottom-20 left-1/3 h-72 w-72 rounded-full bg-fuchsia-500/[0.05] blur-[100px]" />
        <div className="animate-float-delayed absolute right-1/4 top-1/2 h-64 w-64 rounded-full bg-emerald-500/[0.04] blur-[80px]" />
      </div>

      <div className="relative z-10 px-6 py-12 md:px-10">
        <section className="mx-auto w-full max-w-6xl space-y-16">

          {/* ─── Hero Section ─── */}
          <header className="animate-fade-in-up space-y-8 text-center">
            <div className="flex items-center justify-center gap-3">
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
              <div className="flex flex-wrap items-center justify-center gap-3">
                <span className="tag-fuchsia">
                  <span className="text-sm">🔥</span> FireChess
                </span>
                <span className="tag-emerald">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                  Powered by Stockfish 18
                </span>
              </div>

              <h1 className="mx-auto max-w-4xl text-4xl font-black leading-[1.1] tracking-tight md:text-6xl lg:text-7xl">
                <span className="text-white">Stop repeating the </span>
                <span className="gradient-text">same opening mistakes.</span>
              </h1>

              <p className="mx-auto max-w-2xl text-base text-slate-400 md:text-lg">
                FireChess scans your games, finds repeated opening leaks, explains the better move, and drills you until the fix sticks.
              </p>
            </div>

            <HeroDemoBoard />
          </header>

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
                  "Upgrade for Pro limits"
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
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Scan Mode</span>
                {!hasProAccess && (
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">Full tactics = Pro</span>
                )}
              </div>
              <div className="grid h-10 grid-cols-3 gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1">
                <button
                  type="button"
                  onClick={() => setScanMode("openings")}
                  className={`rounded-md text-xs font-semibold transition-all duration-200 ${
                    scanMode === "openings"
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 shadow-glow-sm"
                      : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                  }`}
                >
                  🔁 Openings
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!hasProAccess) return;
                    setScanMode("tactics");
                  }}
                  className={`relative rounded-md text-xs font-semibold transition-all duration-200 ${
                    scanMode === "tactics"
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-glow-sm"
                      : !hasProAccess
                        ? "cursor-not-allowed text-slate-600"
                        : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                  }`}
                >
                  ⚡ Tactics
                  {!hasProAccess && <span className="ml-0.5 text-[9px]">🔒</span>}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!hasProAccess) return;
                    setScanMode("both");
                  }}
                  className={`relative rounded-md text-xs font-semibold transition-all duration-200 ${
                    scanMode === "both"
                      ? "bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 text-white shadow-glow-sm"
                      : !hasProAccess
                        ? "cursor-not-allowed text-slate-600"
                        : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                  }`}
                >
                  Both
                  {!hasProAccess && <span className="ml-0.5 text-[9px]">🔒</span>}
                </button>
              </div>
              <p className="text-xs text-slate-500">
                {scanMode === "openings" && (hasProAccess ? "Finds repeated patterns in your first N moves" : "Finds repeated patterns + a sample of missed tactics")}
                {scanMode === "tactics" && "Scans full games for missed forcing moves (slower)"}
                {scanMode === "both" && "Runs both scans — most thorough but slowest"}
              </p>
            </div>

            {/* Settings grid — row 1: toggles, row 2: number inputs */}
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="stat-card space-y-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Source</span>
                  <div className="grid h-10 grid-cols-2 gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1">
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
                </div>

                <div className="stat-card space-y-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Time Control</span>
                  <div className="grid h-10 grid-cols-5 gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1">
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
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Games</span>
                  <input
                    type="number"
                    min={1}
                    max={hasProAccess ? 5000 : 300}
                    value={gameCount}
                    onChange={(e) => setGameCount(Number(e.target.value))}
                    className="glass-input h-10 text-sm"
                  />
                  {gamesOverFreeLimit && (
                    <p className="text-xs font-medium text-amber-400">
                      {!hasProAccess ? (
                        <>Requires <Link href="/pricing" className="underline">Pro</Link></>
                      ) : gameCount > 1000 ? `${gameCount.toLocaleString()} games — may take a while` : "Unlocked"}
                    </p>
                  )}
                </div>

                <div className="stat-card space-y-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Moves</span>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={moveCount}
                    onChange={(e) => setMoveCount(Number(e.target.value))}
                    className="glass-input h-10 text-sm"
                  />
                </div>

                <div className="stat-card space-y-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">CP Threshold</span>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={cpThreshold}
                    onChange={(e) => setCpThreshold(Number(e.target.value))}
                    className="glass-input h-10 text-sm"
                  />
                </div>

                <div className="stat-card space-y-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Depth</span>
                  <input
                    type="number"
                    min={6}
                    max={24}
                    value={engineDepth}
                    onChange={(e) => setEngineDepth(Number(e.target.value))}
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
              <div className="mt-4 flex items-center justify-between text-[11px] font-medium">
                {[
                  { key: "fetch", label: "Download", icon: "🌐" },
                  { key: "parse", label: "Parse", icon: "📖" },
                  { key: "eval",  label: "Evaluate", icon: "🧠" },
                  { key: "tactics", label: "Tactics", icon: "⚔️" },
                  { key: "done",  label: "Done", icon: "✅" },
                ].map((step) => {
                  const phases = ["fetch", "parse", "aggregate", "eval", "tactics", "done"];
                  const currentIdx = phases.indexOf(progressInfo.phase);
                  const stepIdx = phases.indexOf(step.key);
                  const isActive = step.key === progressInfo.phase || (step.key === "eval" && progressInfo.phase === "aggregate");
                  const isComplete = currentIdx > stepIdx || (step.key === "eval" && progressInfo.phase === "tactics");
                  return (
                    <div key={step.key} className={`flex flex-col items-center gap-1 transition-colors ${
                      isActive ? "text-emerald-400" : isComplete ? "text-slate-400" : "text-slate-600"
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

          {/* ─── Results ─── */}
          {state === "done" && result && (
            <section className="animate-fade-in-up space-y-8">

              {/* Report Heading */}
              <div className="text-center">
                <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                  Analysis for <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">{result.username}</span>
                </h1>
                <p className="mt-2 text-sm text-slate-400">
                  {result.gamesAnalyzed} games scanned{result.playerRating ? ` · ${result.playerRating} rated` : ""} · {result.leaks.length} opening leak{result.leaks.length !== 1 ? "s" : ""} · {result.missedTactics.length} missed tactic{result.missedTactics.length !== 1 ? "s" : ""}
                </p>
              </div>

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
                        { label: "Accuracy", value: `${report.estimatedAccuracy.toFixed(1)}%`, color: "text-emerald-400" },
                        { label: "Est. Rating", value: report.estimatedRating.toString(), color: "text-emerald-400" },
                        { label: "Avg Eval Loss", value: (report.weightedCpLoss / 100).toFixed(2), color: "text-emerald-400" },
                        { label: "Leak Rate", value: `${(report.severeLeakRate * 100).toFixed(0)}%`, color: "text-red-400" },
                      ].map((stat) => (
                        <div key={stat.label} className="stat-card">
                          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{stat.label}</p>
                          <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-4">
                      {[
                        { label: "Consistency", value: `${report.consistencyScore}/100`, color: "text-cyan-400" },
                        { label: "Peak Throw", value: (report.p75CpLoss / 100).toFixed(2), color: "text-cyan-400" },
                        { label: "Confidence", value: `${report.confidence}%`, color: "text-cyan-400" },
                        { label: "Main Pattern", value: report.topTag, color: "text-fuchsia-400", small: true },
                      ].map((stat) => (
                        <div key={stat.label} className="stat-card">
                          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{stat.label}</p>
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
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">Strengths & Weaknesses</h2>

                    {/* Save to Dashboard button */}
                    {saveStatus === "saved" ? (
                      <span className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        Saved
                      </span>
                    ) : saveStatus === "duplicate" ? (
                      <span className="flex items-center gap-1.5 rounded-xl bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400">
                        Already saved
                      </span>
                    ) : saveStatus === "saving" ? (
                      <span className="flex items-center gap-1.5 rounded-xl bg-white/5 px-4 py-2 text-sm text-white/40">
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
                          if (!authenticated) {
                            window.location.href = "/auth/signin";
                            return;
                          }
                          saveReportToAccount();
                        }}
                        className="flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 transition-all hover:border-emerald-500/40 hover:bg-emerald-500/20 hover:shadow-glow-sm"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                        {authenticated ? "Save to Dashboard" : "Sign in to Save"}
                      </button>
                    )}
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <StrengthsRadar
                      accuracy={report.estimatedAccuracy}
                      leakCount={result.leaks.length}
                      repeatedPositions={result.repeatedPositions}
                      tacticsCount={result.missedTactics.length}
                      gamesAnalyzed={result.gamesAnalyzed}
                      weightedCpLoss={report.weightedCpLoss}
                      severeLeakRate={report.severeLeakRate}
                      timeManagementScore={result.timeManagementScore}
                    />
                    <RadarLegend
                      data={computeRadarData({
                        accuracy: report.estimatedAccuracy,
                        leakCount: result.leaks.length,
                        repeatedPositions: result.repeatedPositions,
                        tacticsCount: result.missedTactics.length,
                        gamesAnalyzed: result.gamesAnalyzed,
                        weightedCpLoss: report.weightedCpLoss,
                        severeLeakRate: report.severeLeakRate,
                        timeManagementScore: result.timeManagementScore,
                      })}
                      props={{
                        accuracy: report.estimatedAccuracy,
                        leakCount: result.leaks.length,
                        repeatedPositions: result.repeatedPositions,
                        tacticsCount: result.missedTactics.length,
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
                    leakCount: result.leaks.length,
                    repeatedPositions: result.repeatedPositions,
                    tacticsCount: result.missedTactics.length,
                    gamesAnalyzed: result.gamesAnalyzed,
                    weightedCpLoss: report.weightedCpLoss,
                    severeLeakRate: report.severeLeakRate,
                    timeManagementScore: result.timeManagementScore,
                  })}
                  props={{
                    accuracy: report.estimatedAccuracy,
                    leakCount: result.leaks.length,
                    repeatedPositions: result.repeatedPositions,
                    tacticsCount: result.missedTactics.length,
                    gamesAnalyzed: result.gamesAnalyzed,
                    weightedCpLoss: report.weightedCpLoss,
                    severeLeakRate: report.severeLeakRate,
                    timeManagementScore: result.timeManagementScore,
                  }}
                />
              )}

              {/* Summary stats */}
              <div className="glass-card p-5">
                <div className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div className="flex items-center justify-between border-b border-white/[0.04] py-2 sm:border-0">
                    <span className="text-slate-400">Games analyzed</span>
                    <span className="font-semibold text-white">{result.gamesAnalyzed}</span>
                  </div>
                  {lastRunConfig && (
                    <div className="flex items-center justify-between border-b border-white/[0.04] py-2 sm:border-0">
                      <span className="text-slate-400">Source</span>
                      <span className="font-semibold capitalize text-white">{lastRunConfig.source}</span>
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
                  {(lastRunConfig?.scanMode !== "openings" || !hasProAccess) && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-slate-400">Missed tactics</span>
                      <span className="font-semibold text-amber-400">{missedTactics.length}{!hasProAccess && " (sample)"}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Opening Leaks Section */}
              {(lastRunConfig?.scanMode !== "tactics") && (
              <>
              {/* Opening Leaks Section Header */}
              <div className="glass-card border-emerald-500/15 bg-gradient-to-r from-emerald-500/[0.04] to-transparent p-6">
                <div className="flex items-center gap-4">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-3xl shadow-lg shadow-emerald-500/10">🔁</span>
                  <div className="flex-1">
                    <h2 className="text-2xl font-extrabold text-white tracking-tight">
                      Repeated Opening Leaks
                      {leaks.length > 0 && (
                        <span className="ml-3 inline-flex items-center rounded-full bg-emerald-500/15 px-3 py-1 text-base font-bold text-emerald-400">
                          {leaks.length}
                        </span>
                      )}
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Positions you keep reaching and making the same suboptimal move
                    </p>
                  </div>
                </div>
              </div>

              {/* Leak cards */}
              {leaks.length === 0 ? (
                <div className="glass-card flex items-center gap-4 p-6">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-2xl">🎉</span>
                  <div>
                    <p className="font-semibold text-white">No repeated opening leaks found</p>
                    <p className="text-sm text-slate-400">
                      Great job! No patterns found in the first {lastRunConfig?.maxMoves ?? moveCount} moves.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {leaks.map((leak, idx) => (
                    <div key={`${leak.fenBefore}-${leak.userMove}-${idx}`} className="animate-fade-in-up" style={{ animationDelay: `${idx * 80}ms` }}>
                      <MistakeCard
                        leak={leak}
                        engineDepth={lastRunConfig?.engineDepth ?? engineDepth}
                      />
                    </div>
                  ))}

                  {/* Opening Leaks Drill */}
                  {diagnostics && diagnostics.positionTraces.length > 0 && (
                    <DrillMode positions={diagnostics.positionTraces} excludeFens={dbApprovedFens} />
                  )}
                </div>
              )}
              </>
              )}

              {/* CTA: after openings-only scan, suggest tactics scan */}
              {hasProAccess && lastRunConfig?.scanMode === "openings" && (
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

              {/* Missed Tactics Section — hidden for pro users in openings-only mode */}
              {(lastRunConfig?.scanMode !== "openings" || !hasProAccess) && (
              <>
              <div className="my-4">
                <div className="section-divider" />
              </div>
              <div className="glass-card border-amber-500/15 bg-gradient-to-r from-amber-500/[0.04] to-transparent p-6">
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
                </div>
              </div>

              {/* Motif Pattern Summary — Pro only */}
              {hasProAccess && tacticMotifs.length > 0 && (
                <div className="glass-card space-y-4 p-5">
                  <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0022 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                    Pattern Analysis
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {tacticMotifs.map((motif) => (
                      <div
                        key={motif.name}
                        className="flex items-center gap-3 rounded-xl border border-amber-500/10 bg-amber-500/[0.03] p-3 transition-all hover:border-amber-500/20 hover:bg-amber-500/[0.06]"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-lg">
                          {motif.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white">{motif.name}</p>
                          <p className="text-xs text-slate-400">
                            {motif.count}× missed
                            {motif.avgCpLoss < 99000
                              ? ` · avg −${(motif.avgCpLoss / 100).toFixed(1)}`
                              : " · forced mate"
                            }
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-400">
                          {motif.count}
                        </span>
                      </div>
                    ))}
                  </div>
                  {tacticMotifs.length >= 2 && (
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
                <div className="space-y-6">
                  {missedTactics.map((tactic, idx) => (
                    <div
                      key={`${tactic.fenBefore}-${tactic.userMove}-${tactic.gameIndex}`}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${idx * 80}ms` }}
                    >
                      <TacticCard
                        tactic={tactic}
                        engineDepth={lastRunConfig?.engineDepth ?? engineDepth}
                      />
                    </div>
                  ))}

                  {/* Free user upgrade CTA */}
                  {!hasProAccess && missedTactics.length >= FREE_TACTIC_SAMPLE && (
                    <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.06] via-amber-600/[0.03] to-transparent p-8">
                      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-amber-500/10 blur-[60px]" />
                      <div className="relative flex flex-col items-center gap-4 text-center">
                        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-3xl shadow-lg shadow-amber-500/10">🔒</span>
                        <div>
                          <h3 className="text-xl font-bold text-white">Unlock Full Tactics Scanner</h3>
                          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
                            You&apos;re seeing {FREE_TACTIC_SAMPLE} sample missed tactics. Pro unlocks the full scan with up to 25 missed tactics, motif pattern analysis, time pressure detection, and dedicated tactics drill mode.
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

                  {/* Tactics Drill — only for Pro or if they have tactics */}
                  {(hasProAccess || missedTactics.length > 0) && (
                    <DrillMode positions={[]} tactics={missedTactics} excludeFens={dbApprovedFens} />
                  )}
                </div>
              )}
              </>
              )}

              {/* CTA: after tactics-only scan, suggest openings scan */}
              {hasProAccess && lastRunConfig?.scanMode === "tactics" && (
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
                          <p className="mt-1 break-all text-slate-600">fen={trace.fenBefore}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}

              {/* Combined Drill Mode */}
              {diagnostics && (diagnostics.positionTraces.length > 0 || missedTactics.length > 0) && hasProAccess && lastRunConfig?.scanMode === "both" && (
                <div className="glass-card border-fuchsia-500/15 bg-gradient-to-r from-fuchsia-500/[0.04] to-transparent p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-500/15 text-xl">🔥</span>
                    <div>
                      <h3 className="text-base font-bold text-white">Combined Drill</h3>
                      <p className="text-xs text-slate-400">Practice both opening leaks and missed tactics together</p>
                    </div>
                  </div>
                  <DrillMode positions={diagnostics.positionTraces} tactics={missedTactics} excludeFens={dbApprovedFens} />
                </div>
              )}
            </section>
          )}
        </section>
      </div>
    </div>
  );
}
