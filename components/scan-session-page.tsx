"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CommunityPostComposerModal,
  type CommunityPostComposerSeed,
} from "@/components/community-post-composer-modal";
import { ScanSessionReport } from "@/components/scan-session-report";
import { BiggestTakeawayCard } from "@/components/biggest-takeaway-card";
import { useSession } from "@/components/session-provider";
import {
  analyzeBrilliantMovesInBrowser,
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
import { OpponentReport } from "@/components/opponent-report";

const REPORT_CACHE_KEY_PREFIX = "fc-last-report";

type CachedReportEntry = {
  result: AnalyzeResponse;
  config: {
    maxGames: number;
    maxMoves: number;
    cpThreshold: number;
    engineDepth: number;
    source: PublicScanSessionPayload["source"];
    scanMode: PublicScanSessionPayload["scanMode"];
    speed: PublicScanSessionPayload["config"]["speed"];
  };
  savedAt: string;
  reportPath?: string;
};

function reportCacheKey(mode: PublicScanSessionPayload["scanMode"]) {
  return `${REPORT_CACHE_KEY_PREFIX}-${mode}`;
}

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
  if (source === "chesscom") return "Chess.com";
  if (source === "pgn") return "PGN File";
  return "Lichess";
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
    reportVersion: 2,
    gamesAnalyzed: 0,
    repeatedPositions: 0,
    leaks: [],
    oneOffMistakes: [],
    positionalFindings: [],
    brilliantMoves: [],
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
  const { authenticated, plan, user, isAdmin } = useSession();
  const searchParams = useSearchParams();
  const isOpponentMode = searchParams.get("mode") === "opponent";
  const [opponentDismissed, setOpponentDismissed] = useState(false);
  const [scan, setScan] = useState(initialScan);
  const showOpponentCard = isOpponentMode && !opponentDismissed && scan.status === "ready" && scan.result;
  const [ownerToken, setOwnerToken] = useState<string | null>(null);
  const [copyLabel, setCopyLabel] = useState("Copy Link");
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "duplicate" | "error"
  >("idle");
  const [regenerateState, setRegenerateState] = useState<
    "idle" | "resetting" | "error"
  >("idle");
  const [brilliantBackfillState, setBrilliantBackfillState] = useState<
    "idle" | "running" | "done" | "error"
  >("idle");
  const [adminRerunState, setAdminRerunState] = useState<
    "idle" | "resetting" | "error"
  >("idle");
  const [reportMetaState, setReportMetaState] = useState<
    "idle" | "running" | "done" | "error"
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
  const [perPhaseProgress, setPerPhaseProgress] = useState<
    Partial<Record<AnalysisProgress["phase"], AnalysisProgress>>
  >({});
  const [sectionsReady, setSectionsReady] = useState<Set<string>>(new Set());
  const [showExpiryPopup, setShowExpiryPopup] = useState(false);
  const [showScanComplete, setShowScanComplete] = useState(false);
  // Incremented when the user picks "Start guided walkthrough" from the
  // completion modal. ScanSessionReport watches this to switch to guided mode.
  const [guidedLaunchSignal, setGuidedLaunchSignal] = useState(0);
  const analysisStartedRef = useRef(false);
  // Remembers whether this scan was freshly processed in this session, so the
  // completion modal only fires for scans that actually ran here (not on revisit
  // of an already-ready report).
  const prevStatusRef = useRef(initialScan.status);

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
  const needsBrilliantBackfill = Boolean(
    scan.scanMode !== "time-management" &&
    scan.status === "ready" &&
    scan.result &&
    (scan.result.reportVersion ?? 0) < 2,
  );
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
            ...(scan.config.source === "pgn" && scan.config.pgnText
              ? { pgnText: scan.config.pgnText }
              : {}),
            onProgress: (nextProgress) => {
              // Monotonic global percent so the top bar never goes backward
              setProgress((prev) => ({
                ...nextProgress,
                percent: Math.max(prev.percent, nextProgress.percent),
              }));
              // Per-phase tracking so each section bar is stable
              setPerPhaseProgress((prev) => ({
                ...prev,
                [nextProgress.phase]: nextProgress,
              }));
            },
            onSectionReady: (section, partial) => {
              setSectionsReady((prev) => new Set([...prev, section]));
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

  useEffect(() => {
    if (!isOwner || scan.status !== "ready" || !scan.result) return;

    try {
      const entry: CachedReportEntry = {
        result: scan.result,
        config: {
          maxGames: scan.config.maxGames,
          maxMoves: scan.config.maxMoves,
          cpThreshold: scan.config.cpThreshold,
          engineDepth: scan.config.engineDepth,
          source: scan.config.source,
          scanMode: scan.config.scanMode,
          speed: scan.config.speed,
        },
        savedAt: scan.updatedAt ?? scan.createdAt ?? new Date().toISOString(),
        reportPath: `/report/${scan.id}`,
      };

      window.localStorage.setItem(
        reportCacheKey(scan.scanMode),
        JSON.stringify(entry),
      );
    } catch {
      // Ignore storage failures.
    }
  }, [isOwner, scan]);

  // When a scan that started processing on THIS page reaches "ready", surface
  // the completion modal. Skipped when revisiting an already-ready report
  // (prevStatusRef starts at "ready" in that case, so no transition occurs).
  useEffect(() => {
    if (
      prevStatusRef.current === "processing" &&
      scan.status === "ready" &&
      scan.result
    ) {
      setShowScanComplete(true);
    }
    prevStatusRef.current = scan.status;
  }, [scan.status, scan.result]);

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
      let contentHash = scan.result.scanSignature ?? null;
      if (!contentHash) {
        const hashInput = buildReportContentHash(
          scan.result,
          scan.config.source,
          scan.config.scanMode,
        );
        const hashBuffer = await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(hashInput),
        );
        contentHash = Array.from(new Uint8Array(hashBuffer))
          .map((byte) => byte.toString(16).padStart(2, "0"))
          .join("");
      }

      const saveRes = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chessUsername: scan.result.username,
          source: scan.config.source,
          scanMode: scan.config.scanMode,
          gamesAnalyzed: scan.result.gamesAnalyzed,
          gamesDateRange: scan.result.gamesDateRange ?? null,
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
      setPerPhaseProgress({});
      setSectionsReady(new Set());
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

  const handleBrilliantBackfill = async () => {
    if (!scan.result || !isAdmin) return;

    setBrilliantBackfillState("running");

    try {
      const brilliantMoves = await analyzeBrilliantMovesInBrowser(
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
          until: scan.config.until ?? undefined,
        },
      );

      const nextResult: AnalyzeResponse = {
        ...scan.result,
        reportVersion: 2,
        brilliantMoves,
      };

      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (ownerToken) headers["x-scan-owner-token"] = ownerToken;

      const res = await fetch(`/api/scans/${scan.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          result: nextResult,
        }),
      });

      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          json?.error ?? "Failed to update the brilliant section.",
        );
      }

      setScan((current) => ({
        ...current,
        result: nextResult,
        updatedAt: new Date().toISOString(),
      }));
      setBrilliantBackfillState("done");
    } catch {
      setBrilliantBackfillState("error");
    }
  };

  const handleAdminRerun = async () => {
    if (!isAdmin || adminRerunState === "resetting") return;
    setAdminRerunState("resetting");
    try {
      const res = await fetch(`/api/scans/${scan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
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
      setPerPhaseProgress({});
      setSectionsReady(new Set());
      setProgress({ phase: "fetch", message: "Preparing scan", percent: 0 });
      setSaveState("idle");
      setAdminRerunState("idle");
      setScan((current) => ({
        ...current,
        status: "processing",
        result: null,
        reportMeta: null,
        error: null,
      }));
    } catch {
      setAdminRerunState("error");
    }
  };

  const handleReportMetaRefresh = async () => {
    if (!isAdmin || !scan.result) return;
    setReportMetaState("running");
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (ownerToken) headers["x-scan-owner-token"] = ownerToken;
      const res = await fetch(`/api/scans/${scan.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ regenerateReportMeta: true }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(json?.error ?? "Failed to refresh report meta.");
      }
      const json = (await res.json()) as { scan?: PublicScanSessionPayload };
      if (json.scan?.reportMeta) {
        setScan((current) => ({
          ...current,
          reportMeta: json.scan!.reportMeta,
          updatedAt: new Date().toISOString(),
        }));
      }
      setReportMetaState("done");
    } catch {
      setReportMetaState("error");
    }
  };

  return (
    <>
      {showOpponentCard && (
        <OpponentReport
          username={scan.chessUsername ?? "Unknown"}
          result={scan.result!}
          onDismiss={() => setOpponentDismissed(true)}
        />
      )}
    <div className="min-h-screen bg-[#0A0A0B] text-[#F4F1EA]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <nav className="mb-5 flex items-center gap-2 text-xs text-[#8A8578]">
          <Link href="/" className="transition-colors hover:text-[#C9C4B6]">
            Home
          </Link>
          <span>/</span>
          <span className="text-[#C9C4B6]">Report</span>
        </nav>

        <section className="relative overflow-hidden rounded-[2rem] border border-[#1e1a24] bg-[radial-gradient(ellipse_80%_60%_at_70%_-10%,_rgba(255,107,53,0.13),_transparent_60%),linear-gradient(180deg,_#121214_0%,_#0A0A0B_100%)] p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#FF6B35]/[0.10] blur-[120px]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FF6B35]/40 to-transparent" />
          <div className="relative">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8A8578]">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#FF6B35]" />
                  <span>{formatSource(scan.source)}</span>
                  <span className="text-[#4A463C]">/</span>
                  <span>{formatScanMode(scan.scanMode)}</span>
                </div>
                <h1 className="mt-4 text-4xl font-black tracking-tight text-[#F4F1EA] sm:text-5xl">
                  Report for{" "}
                  <span className="bg-gradient-to-r from-[#FF6B35] to-[#FFB25A] bg-clip-text text-transparent">
                    {scan.chessUsername}
                  </span>
                </h1>
                <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                  {/* Key stats */}
                  {scan.result?.gamesAnalyzed ? (
                    <div className="rounded-xl border border-[#1e1a24] bg-[#ff5a1f]/[0.03] px-4 py-3.5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A8578]">
                        Games
                      </p>
                      <p className="mt-1.5 text-2xl font-black tabular-nums text-[#F4F1EA]">
                        {scan.result.gamesAnalyzed.toLocaleString()}
                      </p>
                    </div>
                  ) : null}
                  {liveReportMeta?.estimatedAccuracy ? (
                    <div className="rounded-xl border border-emerald-500/[0.18] bg-emerald-500/[0.05] px-4 py-3.5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-400/70">
                        Accuracy
                      </p>
                      <p className="mt-1.5 text-2xl font-black tabular-nums text-emerald-300">
                        {liveReportMeta.estimatedAccuracy.toFixed(1)}%
                      </p>
                    </div>
                  ) : null}
                  {liveReportMeta?.estimatedRating ? (
                    <div className="rounded-xl border border-[#FF6B35]/[0.22] bg-[#FF6B35]/[0.06] px-4 py-3.5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#FF6B35]/80">
                        Est. Rating
                      </p>
                      <p className="mt-1.5 text-2xl font-black tabular-nums text-[#FFB25A]">
                        {liveReportMeta.estimatedRating.toLocaleString()}
                      </p>
                    </div>
                  ) : null}
                  {scan.result && scan.result.leaks.length > 0 ? (
                    <div className="rounded-xl border border-amber-500/[0.18] bg-amber-500/[0.05] px-4 py-3.5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-400/70">
                        Opening Leaks
                      </p>
                      <p className="mt-1.5 text-2xl font-black tabular-nums text-amber-300">
                        {scan.result.leaks.length}
                      </p>
                    </div>
                  ) : null}
                  {scan.result && scan.result.missedTactics.length > 0 ? (
                    <div className="rounded-xl border border-red-500/[0.18] bg-red-500/[0.05] px-4 py-3.5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-red-400/70">
                        Missed Tactics
                      </p>
                      <p className="mt-1.5 text-2xl font-black tabular-nums text-red-300">
                        {scan.result.missedTactics.length}
                      </p>
                    </div>
                  ) : null}
                  {scan.result &&
                  scan.result.brilliantMoves &&
                  scan.result.brilliantMoves.length > 0 ? (
                    <div className="rounded-xl border border-cyan-400/[0.18] bg-cyan-400/[0.05] px-4 py-3.5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-400/70">
                        Brilliant Moves
                      </p>
                      <p className="mt-1.5 text-2xl font-black tabular-nums text-cyan-300">
                        {scan.result.brilliantMoves.length}
                      </p>
                    </div>
                  ) : null}
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-[#1e1a24] bg-[#ff5a1f]/[0.05] px-3 py-1 text-[#f0edf2]">
                    Depth {scan.config.engineDepth}
                  </span>
                  <span
                    className={`rounded-full border px-3 py-1 font-medium ${
                      scan.status === "ready"
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                        : scan.status === "failed"
                          ? "border-red-500/20 bg-red-500/10 text-red-300"
                          : "border-amber-500/20 bg-amber-500/10 text-amber-300"
                    }`}
                  >
                    {scan.status === "ready"
                      ? "✓ Complete"
                      : scan.status === "failed"
                        ? "✗ Failed"
                        : "⏳ Running"}
                  </span>
                  {liveReportMeta ? (
                    <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 font-semibold text-cyan-300">
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
                  className="rounded-full border border-[#1e1a24] bg-[#ff5a1f]/[0.05] px-4 py-2 text-sm font-semibold text-white transition hover:border-[#ff5a1f]/25 hover:text-white"
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
                    className="rounded-full border border-[#1e1a24] bg-[#ff5a1f]/[0.05] px-4 py-2 text-sm font-semibold text-white transition hover:border-[#ff5a1f]/25 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
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
                {isAdmin && scan.status === "ready" && scan.result ? (
                  <button
                    type="button"
                    onClick={handleBrilliantBackfill}
                    disabled={brilliantBackfillState === "running"}
                    className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {brilliantBackfillState === "running"
                      ? "Regenerating brilliant section..."
                      : brilliantBackfillState === "error"
                        ? "Retry brilliant section"
                        : brilliantBackfillState === "done"
                          ? "Brilliant section updated"
                          : "Regenerate brilliant section"}
                  </button>
                ) : null}
                {isAdmin && scan.status === "ready" && scan.result ? (
                  <button
                    type="button"
                    onClick={handleReportMetaRefresh}
                    disabled={reportMetaState === "running"}
                    className="rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {reportMetaState === "running"
                      ? "Refreshing title & stats..."
                      : reportMetaState === "error"
                        ? "Retry title refresh"
                        : reportMetaState === "done"
                          ? "Title & stats refreshed ✓"
                          : "Refresh title & stats"}
                  </button>
                ) : null}
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={handleAdminRerun}
                    disabled={adminRerunState === "resetting"}
                    className="rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {adminRerunState === "resetting"
                      ? "Rerunning..."
                      : adminRerunState === "error"
                        ? "Retry rerun"
                        : "Rerun full scan"}
                  </button>
                ) : null}
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

        {scan.status === "ready" && scan.result ? (
          <BiggestTakeawayCard result={scan.result} />
        ) : null}

        {isAdmin && scan.status === "ready" && scan.result ? (
          <section className="mt-6 rounded-[1.5rem] border border-cyan-500/20 bg-cyan-500/[0.06] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/80">
              Admin — brilliant section
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-3xl text-sm leading-relaxed text-white">
                Re-scan all games for brilliant moves and update this report
                publicly. Useful after tuning the detection algorithm or to
                refresh an old report that predates this section.
              </p>
              {brilliantBackfillState === "done" ? (
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                  Brilliant section refreshed
                </span>
              ) : null}
            </div>
          </section>
        ) : null}

        {isAdmin && scan.status === "ready" && scan.result ? (
          <section className="mt-4 rounded-[1.5rem] border border-violet-500/20 bg-violet-500/[0.05] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-300/80">
              Admin — report meta
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-3xl text-sm leading-relaxed text-white">
                Recompute the title, full-report summary, and radar scores from
                the stored result. Use this after tuning the scoring logic to
                refresh all 9 sample reports without a full rescan.
              </p>
              {reportMetaState === "done" ? (
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                  Title & stats refreshed ✓
                </span>
              ) : reportMetaState === "error" ? (
                <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">
                  Error — check console
                </span>
              ) : null}
            </div>
          </section>
        ) : null}

        {showExpiryPopup ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-md rounded-[1.75rem] border border-amber-500/20 bg-slate-950 p-6 shadow-lg shadow-black/40">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-300">
                Temporary scan link
              </p>
              <h2 className="mt-3 text-2xl font-black text-white">
                This share page expires in 24 hours unless you save it.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#f0edf2]">
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
                  className="rounded-full border border-[#1e1a24] bg-[#ff5a1f]/[0.05] px-4 py-2 text-sm font-semibold text-[#f0edf2] transition hover:text-white"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {showScanComplete && scan.result ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-md rounded-[1.75rem] border border-emerald-500/20 bg-slate-950 p-6 text-center shadow-lg shadow-black/40">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-3xl">
                ✓
              </div>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Scan complete
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                Your scan is ready
              </h2>
              <p className="mt-2 text-sm text-[#8d8696]">
                {scan.result.gamesAnalyzed} games analyzed
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border border-[#1e1a24] bg-[#ff5a1f]/[0.03] px-2 py-3">
                  <div className="text-lg font-black text-white">
                    {scan.result.leaks.length}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-[#565061]">
                    Leaks
                  </div>
                </div>
                <div className="rounded-xl border border-[#1e1a24] bg-[#ff5a1f]/[0.03] px-2 py-3">
                  <div className="text-lg font-black text-white">
                    {scan.result.missedTactics.length}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-[#565061]">
                    Tactics
                  </div>
                </div>
                <div className="rounded-xl border border-[#1e1a24] bg-[#ff5a1f]/[0.03] px-2 py-3">
                  <div className="text-lg font-black text-white">
                    {scan.result.repeatedPositions}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-[#565061]">
                    Positions
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-[#f0edf2]">
                Walk through your biggest findings step by step, or jump
                straight to the full breakdown.
              </p>
              <div className="mt-5 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowScanComplete(false);
                    setGuidedLaunchSignal((n) => n + 1);
                  }}
                  className="w-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Start guided walkthrough →
                </button>
                <button
                  type="button"
                  onClick={() => setShowScanComplete(false)}
                  className="w-full rounded-full border border-[#1e1a24] bg-[#ff5a1f]/[0.05] px-4 py-2 text-sm font-semibold text-[#f0edf2] transition hover:text-white"
                >
                  View full report
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
          <section className="mt-6 rounded-[1.75rem] border border-[#1e1a24] bg-[#ff5a1f]/[0.04] p-6 sm:p-7">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">
                  {progress.message}
                </p>
                <p className="mt-0.5 text-sm text-[#8d8696]">
                  {sectionsReady.size > 0
                    ? `${sectionsReady.size} section${sectionsReady.size === 1 ? "" : "s"} complete — results unlocking below`
                    : (progress.detail ??
                      "Crunching your games into a shareable report page.")}
                </p>
              </div>
              <p className="text-2xl font-black text-cyan-300">
                {Math.round(progress.percent)}%
              </p>
            </div>

            {/* Per-phase bars */}
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {(
                [
                  {
                    key: "openings",
                    label: "Openings",
                    icon: "📚",
                    phases: [
                      "parse",
                      "aggregate",
                      "eval",
                    ] as AnalysisProgress["phase"][],
                    show:
                      scan.config.scanMode === "openings" ||
                      scan.config.scanMode === "both",
                  },
                  {
                    key: "tactics",
                    label: "Tactics",
                    icon: "⚔️",
                    phases: ["tactics"] as AnalysisProgress["phase"][],
                    show:
                      scan.config.scanMode === "tactics" ||
                      scan.config.scanMode === "both",
                  },
                  {
                    key: "endgames",
                    label: "Endgames",
                    icon: "♜",
                    phases: ["endgames"] as AnalysisProgress["phase"][],
                    show:
                      scan.config.scanMode === "endgames" ||
                      scan.config.scanMode === "both",
                  },
                  {
                    key: "time",
                    label: "Time",
                    icon: "⏱️",
                    phases: ["time"] as AnalysisProgress["phase"][],
                    show:
                      scan.config.scanMode === "time-management" ||
                      scan.config.scanMode === "both",
                  },
                ] as const
              )
                .filter((s) => s.show)
                .map((s) => {
                  const done = sectionsReady.has(s.key);
                  // Use the latest progress event for any of this section's phases
                  const activePhase = s.phases
                    .map((ph) => perPhaseProgress[ph])
                    .filter(Boolean)
                    .at(-1);
                  const barPct = done
                    ? 100
                    : activePhase?.total
                      ? Math.round(
                          ((activePhase.current ?? 0) / activePhase.total) *
                            100,
                        )
                      : activePhase
                        ? 5 // started but no count yet
                        : 0; // queued
                  const statusText = done
                    ? "Done"
                    : activePhase
                      ? activePhase.total
                        ? `${activePhase.current ?? 0} / ${activePhase.total}`
                        : "Running…"
                      : "Queued";
                  const barColor = done
                    ? "bg-emerald-500"
                    : activePhase
                      ? "bg-cyan-500"
                      : "bg-[#1e1a24]";

                  return (
                    <div
                      key={s.key}
                      className="rounded-xl border border-[#1e1a24] bg-black/20 px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-white">
                          {s.icon} {s.label}
                        </span>
                        <span
                          className={`text-xs font-semibold ${
                            done
                              ? "text-emerald-400"
                              : activePhase
                                ? "text-cyan-300"
                                : "text-[#565061]"
                          }`}
                        >
                          {statusText}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#1e1a24]">
                        <div
                          className={`h-full rounded-full transition-[width] duration-500 ${barColor}`}
                          style={{
                            width: `${Math.max(done ? 100 : activePhase ? 5 : 0, barPct)}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
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
          <>
            {scan.result.gamesAnalyzed === 0 && scan.config.source === "pgn" && (
              <section className="mt-6 rounded-[1.75rem] border border-amber-500/20 bg-amber-500/10 p-6 text-amber-100">
                <h2 className="text-lg font-bold">No games analyzed</h2>
                <p className="mt-2 text-sm leading-relaxed">
                  The PGN was parsed but no games matched the name{" "}
                  <strong className="font-bold text-white">{scan.chessUsername}</strong>.
                  Make sure the name you entered matches the{" "}
                  <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-xs">[White]</code>{" "}
                  or{" "}
                  <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-xs">[Black]</code>{" "}
                  header in your PGN file (case-insensitive).
                </p>
              </section>
            )}
            <ScanSessionReport
              scan={scan}
              reportMeta={liveReportMeta}
              hasProAccess={hasProAccess}
              scanProgress={progress}
              perPhaseProgress={perPhaseProgress}
              guidedLaunchSignal={guidedLaunchSignal}
              onSave={handleSave}
              saveStatus={saveState}
              authenticated={authenticated}
            />
          </>
        ) : null}
      </div>
    </div>
    </>
  );
}
