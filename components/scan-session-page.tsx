"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CommunityPostComposerModal,
  type CommunityPostComposerSeed,
} from "@/components/community-post-composer-modal";
import { ScanSessionReport } from "@/components/scan-session-report";
import { useSession } from "@/components/session-provider";
import {
  analyzeOpeningLeaksInBrowser,
  type AnalysisProgress,
} from "@/lib/client-analysis";
import { earnCoins } from "@/lib/coins";
import {
  buildReportContentHash,
  computeScanReportMeta,
  scanExpiryDismissKey,
  scanOwnerStorageKey,
  type PublicScanSessionPayload,
} from "@/lib/scan-session";
import type { AnalyzeResponse } from "@/lib/types";

function formatScanMode(mode: PublicScanSessionPayload["scanMode"]) {
  switch (mode) {
    case "openings":
      return "Openings";
    case "tactics":
      return "Tactics";
    case "endgames":
      return "Endgames";
    case "time-management":
      return "Time Management";
    case "both":
    default:
      return "Full Scan";
  }
}

function formatSource(source: PublicScanSessionPayload["source"]) {
  return source === "chesscom" ? "Chess.com" : "Lichess";
}

function formatTimeRemaining(expiresAtIso: string | null) {
  if (!expiresAtIso) return null;

  const remainingMs = new Date(expiresAtIso).getTime() - Date.now();
  if (remainingMs <= 0) return "Expired";

  const totalHours = Math.ceil(remainingMs / (60 * 60 * 1000));
  if (totalHours >= 24) return "Expires in about 24 hours";
  if (totalHours > 1) return `Expires in about ${totalHours} hours`;

  const minutes = Math.max(1, Math.ceil(remainingMs / (60 * 1000)));
  return `Expires in about ${minutes} minutes`;
}

function buildPartialResult(
  username: string,
  partial: Partial<AnalyzeResponse>,
) {
  const base: AnalyzeResponse = {
    username,
    gamesAnalyzed: 0,
    repeatedPositions: 0,
    leaks: [],
    oneOffMistakes: [],
    positionalFindings: [],
    missedTactics: [],
    totalTacticsFound: 0,
    endgameMistakes: [],
    endgameStats: null,
    timeManagement: null,
    timeManagementScore: null,
    mentalStats: null,
    openingSummaries: [],
  };

  return { ...base, ...partial };
}

export function ScanSessionPage({
  initialScan,
}: {
  initialScan: PublicScanSessionPayload;
}) {
  const { authenticated, plan, user } = useSession();
  const [scan, setScan] = useState(initialScan);
  const [ownerToken, setOwnerToken] = useState<string | null>(null);
  const [copyLabel, setCopyLabel] = useState("Copy Link");
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "duplicate" | "error"
  >("idle");
  const [regenerateState, setRegenerateState] = useState<
    "idle" | "resetting" | "error"
  >("idle");
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerSeed, setComposerSeed] = useState<CommunityPostComposerSeed>(
    {},
  );
  const [progress, setProgress] = useState<AnalysisProgress>({
    phase: "fetch",
    message: "Preparing scan",
    percent: 0,
  });
  const [showExpiryPopup, setShowExpiryPopup] = useState(false);
  const analysisStartedRef = useRef(false);

  useEffect(() => {
    try {
      setOwnerToken(
        window.localStorage.getItem(scanOwnerStorageKey(initialScan.id)),
      );
    } catch {
      setOwnerToken(null);
    }
  }, [initialScan.id]);

  const isOwner = Boolean(
    ownerToken || (authenticated && scan.userId && user?.id === scan.userId),
  );
  const expiryLabel = formatTimeRemaining(scan.expiresAt);
  const topLeak = scan.result?.leaks[0] ?? null;
  const topTactic = scan.result?.missedTactics[0] ?? null;
  const topEndgame = scan.result?.endgameMistakes[0] ?? null;
  const topTimeMoment = scan.result?.timeManagement?.moments?.[0] ?? null;
  const hasProAccess = plan === "pro" || plan === "lifetime";
  const defaultComposerSeed = useMemo<CommunityPostComposerSeed>(() => {
    if (topLeak) {
      return {
        initialKind: "position",
        initialSourceType: "analysis",
        initialFen: topLeak.fenBefore,
        initialTitle: topLeak.openingName
          ? `What is the right move in this ${topLeak.openingName}?`
          : "What would you play in this report position?",
        initialPrompt: topLeak.openingName
          ? `My report flagged this ${topLeak.openingName} position. What would you play here, and why?`
          : "My report flagged this position. What would you play here, and why?",
        initialOpeningName: topLeak.openingName ?? "",
        initialOrientation: topLeak.fenBefore.includes(" w ")
          ? "white"
          : "black",
        initialPuzzleMoves: topLeak.bestMove ? [topLeak.bestMove] : [],
      };
    }

    if (topTactic) {
      return {
        initialKind: "position",
        initialSourceType: "analysis",
        initialFen: topTactic.fenBefore,
        initialTitle: `Find the missed tactic from game #${topTactic.gameIndex}`,
        initialPrompt:
          "My report flagged this as a missed tactic. What is the winning line here?",
        initialOrientation: topTactic.fenBefore.includes(" w ")
          ? "white"
          : "black",
        initialPuzzleMoves: topTactic.bestMove ? [topTactic.bestMove] : [],
      };
    }

    if (topEndgame) {
      return {
        initialKind: "position",
        initialSourceType: "endgame-scan",
        initialFen: topEndgame.fenBefore,
        initialTitle: `${topEndgame.endgameType} endgame from game #${topEndgame.gameIndex}`,
        initialPrompt: `My report flagged this ${topEndgame.endgameType.toLowerCase()} endgame. What is the best move here?`,
        initialOrientation: topEndgame.fenBefore.includes(" w ")
          ? "white"
          : "black",
        initialPuzzleMoves: topEndgame.bestMove ? [topEndgame.bestMove] : [],
      };
    }

    if (topTimeMoment) {
      return {
        initialKind: "position",
        initialSourceType: "analysis",
        initialFen: topTimeMoment.fen,
        initialTitle: `Clock decision from game #${topTimeMoment.gameIndex}, move ${topTimeMoment.moveNumber}`,
        initialPrompt: `My report tagged this as a ${topTimeMoment.verdict} time-management moment. What is the best move here?`,
        initialOrientation: topTimeMoment.fen.includes(" w ")
          ? "white"
          : "black",
        initialPuzzleMoves: topTimeMoment.bestMove
          ? [topTimeMoment.bestMove]
          : [],
      };
    }

    return {};
  }, [topEndgame, topLeak, topTactic, topTimeMoment]);
  const liveReportMeta = useMemo(
    () =>
      scan.reportMeta ??
      computeScanReportMeta(scan.result, scan.config.cpThreshold),
    [scan.config.cpThreshold, scan.reportMeta, scan.result],
  );

  const openComposer = (seed?: CommunityPostComposerSeed) => {
    setComposerSeed(seed ?? defaultComposerSeed);
    setComposerOpen(true);
  };

  useEffect(() => {
    if (!isOwner || scan.savedReportId || !scan.expiresAt) return;

    try {
      const dismissed = window.localStorage.getItem(
        scanExpiryDismissKey(scan.id),
      );
      if (dismissed === "dismissed") return;
    } catch {
      // Ignore storage failures.
    }

    setShowExpiryPopup(true);
  }, [isOwner, scan.expiresAt, scan.id, scan.savedReportId]);

  useEffect(() => {
    if (analysisStartedRef.current) return;
    if (scan.status !== "processing" || !isOwner || scan.result) return;

    analysisStartedRef.current = true;

    void (async () => {
      try {
        const browserResult = await analyzeOpeningLeaksInBrowser(
          scan.chessUsername,
          {
            source: scan.config.source,
            scanMode: scan.config.scanMode,
            timeControl: scan.config.speed,
            maxGames: scan.config.maxGames,
            maxOpeningMoves: scan.config.maxMoves,
            cpLossThreshold: scan.config.cpThreshold,
            engineDepth: scan.config.engineDepth,
            maxTactics: scan.config.maxTactics ?? Infinity,
            maxEndgames: scan.config.maxEndgames ?? Infinity,
            since: scan.config.since ?? undefined,
            onProgress: (nextProgress) => {
              setProgress(nextProgress);
            },
            onSectionReady: (_, partial) => {
              setScan((current) => ({
                ...current,
                result: buildPartialResult(
                  current.chessUsername,
                  current.result ? { ...current.result, ...partial } : partial,
                ),
              }));
            },
          },
        );

        const reportMeta = computeScanReportMeta(
          browserResult,
          scan.config.cpThreshold,
        );

        setScan((current) => ({
          ...current,
          status: "ready",
          result: browserResult,
          reportMeta,
          error: null,
        }));

        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (ownerToken) headers["x-scan-owner-token"] = ownerToken;

        const res = await fetch(`/api/scans/${scan.id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            status: "ready",
            result: browserResult,
            reportMeta,
            error: null,
          }),
        });

        if (!res.ok) {
          const json = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(json?.error ?? "Failed to store the finished scan.");
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Scan failed unexpectedly.";

        setScan((current) => ({
          ...current,
          status: "failed",
          error: message,
        }));

        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (ownerToken) headers["x-scan-owner-token"] = ownerToken;

        await fetch(`/api/scans/${scan.id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ status: "failed", error: message }),
        }).catch(() => undefined);
      }
    })();
  }, [isOwner, ownerToken, scan]);

  const dismissExpiryPopup = () => {
    setShowExpiryPopup(false);
    try {
      window.localStorage.setItem(scanExpiryDismissKey(scan.id), "dismissed");
    } catch {
      // Ignore storage failures.
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/report/${scan.id}`,
      );
      setCopyLabel("Copied!");
      window.setTimeout(() => setCopyLabel("Copy Link"), 1500);
    } catch {
      setCopyLabel("Copy failed");
      window.setTimeout(() => setCopyLabel("Copy Link"), 1500);
    }
  };

  const handleSave = async () => {
    if (!scan.result || !liveReportMeta) return;

    if (!authenticated) {
      signIn(undefined, { callbackUrl: window.location.href });
      return;
    }

    setSaveState("saving");

    try {
      const hashInput = buildReportContentHash(
        scan.result,
        scan.config.source,
        scan.config.scanMode,
      );
      const hashBuffer = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(hashInput),
      );
      const contentHash = Array.from(new Uint8Array(hashBuffer))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");

      const saveRes = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chessUsername: scan.result.username,
          source: scan.config.source,
          scanMode: scan.config.scanMode,
          gamesAnalyzed: scan.result.gamesAnalyzed,
          maxGames: scan.config.maxGames,
          maxMoves: scan.config.maxMoves,
          cpThreshold: scan.config.cpThreshold,
          engineDepth: scan.config.engineDepth,
          estimatedAccuracy: liveReportMeta.estimatedAccuracy,
          estimatedRating: liveReportMeta.estimatedRating,
          weightedCpLoss: liveReportMeta.weightedCpLoss,
          severeLeakRate: liveReportMeta.severeLeakRate,
          repeatedPositions: scan.result.repeatedPositions,
          leaks: scan.result.leaks,
          oneOffMistakes: scan.result.oneOffMistakes,
          missedTactics: scan.result.missedTactics,
          diagnostics: scan.result.diagnostics ?? null,
          mentalStats: scan.result.mentalStats ?? null,
          timeManagement: scan.result.timeManagement ?? null,
          playerRating: scan.result.playerRating ?? null,
          reportMeta: {
            consistencyScore: liveReportMeta.consistencyScore,
            p75CpLoss: liveReportMeta.p75CpLoss,
            confidence: liveReportMeta.confidence,
            topTag: liveReportMeta.topTag,
            vibeTitle: liveReportMeta.vibeTitle,
            sampleSize: liveReportMeta.sampleSize,
            endgameTechniqueScore: liveReportMeta.endgameTechniqueScore ?? null,
          },
          contentHash,
        }),
      });

      const saveJson = (await saveRes.json()) as {
        saved?: boolean;
        reason?: string;
        id?: string;
      };

      if (!saveJson.saved && saveJson.reason !== "duplicate") {
        throw new Error("Failed to save scan.");
      }

      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (ownerToken) headers["x-scan-owner-token"] = ownerToken;

      await fetch(`/api/scans/${scan.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          savedReportId: saveJson.id ?? null,
          clearExpiry: true,
        }),
      });

      if (saveJson.saved) {
        try {
          earnCoins("scan_complete");
        } catch {
          // Ignore local coin failures.
        }
      }

      await fetch("/api/study-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: saveJson.id,
          chessUsername: scan.result.username,
          source: scan.config.source,
          topLeakOpenings: [],
          accuracy: liveReportMeta.estimatedAccuracy,
          leakCount: scan.result.leaks.length,
          repeatedPositions: scan.result.repeatedPositions,
          tacticsCount: scan.result.totalTacticsFound,
          gamesAnalyzed: scan.result.gamesAnalyzed,
          weightedCpLoss: liveReportMeta.weightedCpLoss,
          severeLeakRate: liveReportMeta.severeLeakRate,
          estimatedRating: liveReportMeta.estimatedRating,
          scanMode: scan.config.scanMode,
        }),
      }).catch(() => undefined);

      setScan((current) => ({
        ...current,
        savedReportId: saveJson.id ?? current.savedReportId,
        expiresAt: null,
      }));
      setSaveState(saveJson.saved ? "saved" : "duplicate");
      setShowExpiryPopup(false);
    } catch {
      setSaveState("error");
    }
  };

  const handleRegenerate = async () => {
    if (!isOwner || regenerateState === "resetting") return;

    setRegenerateState("resetting");

    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (ownerToken) headers["x-scan-owner-token"] = ownerToken;

      const res = await fetch(`/api/scans/${scan.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          status: "processing",
          result: null,
          reportMeta: null,
          error: null,
        }),
      });

      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(json?.error ?? "Failed to restart the report.");
      }

      analysisStartedRef.current = false;
      setProgress({
        phase: "fetch",
        message: "Preparing scan",
        percent: 0,
      });
      setSaveState("idle");
      setRegenerateState("idle");
      setScan((current) => ({
        ...current,
        status: "processing",
        result: null,
        reportMeta: null,
        error: null,
      }));
    } catch {
      setRegenerateState("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <nav className="mb-5 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="transition-colors hover:text-slate-300">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-300">Report</span>
        </nav>

        <section className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.16),_rgba(15,23,42,0.92)_40%,_rgba(2,6,23,0.98)_100%)] p-6 sm:p-7">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-[110px]" />
          <div className="pointer-events-none absolute -left-24 bottom-0 h-56 w-56 rounded-full bg-fuchsia-500/10 blur-[100px]" />
          <div className="relative">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  <span>{formatSource(scan.source)}</span>
                  <span className="text-slate-600">/</span>
                  <span>{formatScanMode(scan.scanMode)}</span>
                </div>
                <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                  Report for {scan.chessUsername}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                  Dedicated report page, shareable link, and a cleaner handoff
                  out of the homepage.
                </p>
                <div className="mt-5 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-slate-300">
                    {scan.result?.gamesAnalyzed ?? scan.config.maxGames} games
                  </span>
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-slate-300">
                    Depth {scan.config.engineDepth}
                  </span>
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-slate-300">
                    {scan.status === "ready"
                      ? "Ready"
                      : scan.status === "failed"
                        ? "Failed"
                        : "Running"}
                  </span>
                  {liveReportMeta ? (
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-300">
                      {liveReportMeta.vibeTitle}
                    </span>
                  ) : null}
                  {expiryLabel && !scan.savedReportId ? (
                    <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-amber-300">
                      {expiryLabel}
                    </span>
                  ) : null}
                  {scan.savedReportId ? (
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-300">
                      Saved to account
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 lg:justify-end">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/[0.16] hover:text-white"
                >
                  {copyLabel}
                </button>
                {isOwner &&
                !scan.savedReportId &&
                scan.status !== "processing" ? (
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    disabled={regenerateState === "resetting"}
                    className="rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/[0.16] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {regenerateState === "resetting"
                      ? "Regenerating..."
                      : scan.status === "failed"
                        ? "Run again"
                        : regenerateState === "error"
                          ? "Retry regenerate"
                          : "Regenerate"}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => openComposer()}
                  aria-label="Make community post"
                  aria-haspopup="dialog"
                  className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-400/40 hover:text-white"
                >
                  Make community post
                </button>
                {saveState === "saved" ? (
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300">
                    Saved
                  </span>
                ) : saveState === "duplicate" ? (
                  <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-300">
                    Already saved
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={
                      saveState === "saving" ||
                      scan.status !== "ready" ||
                      !scan.result ||
                      !scan.reportMeta
                    }
                    className="rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saveState === "saving"
                      ? "Saving..."
                      : authenticated
                        ? "Save to account"
                        : "Sign in to save"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {showExpiryPopup ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-md rounded-[1.75rem] border border-amber-500/20 bg-slate-950 p-6 shadow-2xl shadow-black/50">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-300">
                Temporary scan link
              </p>
              <h2 className="mt-3 text-2xl font-black text-white">
                This share page expires in 24 hours unless you save it.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Guests get a short-lived share page by default. Save it with an
                account if you want to keep the link and the report around
                permanently.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  {authenticated ? "Save now" : "Sign in and save"}
                </button>
                <button
                  type="button"
                  onClick={dismissExpiryPopup}
                  className="rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-300 transition hover:text-white"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <CommunityPostComposerModal
          open={composerOpen}
          onClose={() => {
            setComposerOpen(false);
            setComposerSeed({});
          }}
          {...composerSeed}
        />

        {scan.status === "processing" ? (
          <section className="mt-6 rounded-[1.75rem] border border-white/[0.08] bg-white/[0.03] p-6 sm:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">
                  {progress.message}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {progress.detail ??
                    "Crunching your games into a shareable report page."}{" "}
                  Sections below unlock as soon as they finish.
                </p>
              </div>
              <p className="text-2xl font-black text-cyan-300">
                {Math.round(progress.percent)}%
              </p>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-[width] duration-300"
                style={{ width: `${Math.max(6, progress.percent)}%` }}
              />
            </div>
            {scan.result ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/[0.08] bg-black/15 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Leaks found
                  </p>
                  <p className="mt-1 text-2xl font-black text-white">
                    {scan.result.leaks.length}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-black/15 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Tactics found
                  </p>
                  <p className="mt-1 text-2xl font-black text-white">
                    {scan.result.missedTactics.length}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-black/15 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Endgames found
                  </p>
                  <p className="mt-1 text-2xl font-black text-white">
                    {scan.result.endgameMistakes.length}
                  </p>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {scan.status === "failed" ? (
          <section className="mt-6 rounded-[1.75rem] border border-red-500/20 bg-red-500/10 p-6 text-red-100">
            <h2 className="text-lg font-bold">Scan failed</h2>
            <p className="mt-2 text-sm leading-relaxed">
              {scan.error ?? "Something went wrong while building this scan."}
            </p>
          </section>
        ) : null}

        {scan.result ? (
          <ScanSessionReport
            scan={scan}
            reportMeta={liveReportMeta}
            hasProAccess={hasProAccess}
            scanProgress={progress}
            onCreateCommunityPost={openComposer}
          />
        ) : null}
      </div>
    </div>
  );
}
