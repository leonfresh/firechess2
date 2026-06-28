"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/session-provider";
import {
  buildScanReuseSignatureInBrowser,
  splitMultiPgn,
} from "@/lib/client-analysis";
import type { AnalysisSource, ScanMode, TimeControl } from "@/lib/client-analysis";
import { scanOwnerStorageKey } from "@/lib/scan-session";

const FREE_MAX_GAMES = 300;
const FREE_MAX_DEPTH = 12;
const FREE_MAX_MOVES = 30;
const PGN_MAX_BYTES = 2 * 1024 * 1024;
const PGN_MAX_GAMES = 250;
const PRO_MAX_GAMES = 100000;
const FULL_SCAN_MODE: ScanMode = "both";

export function DashboardScanWidget() {
  const { authenticated, plan } = useSession();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [source, setSource] = useState<AnalysisSource | null>(null);
  const [pgnText, setPgnText] = useState("");
  const [gameRangeMode, setGameRangeMode] = useState<"count" | "since">("count");
  const [gameCount, setGameCount] = useState(300);
  const [sinceDate, setSinceDate] = useState("");
  const [untilDate, setUntilDate] = useState("");
  const [moveCount, setMoveCount] = useState(30);
  const [cpThreshold, setCpThreshold] = useState(50);
  const [engineDepth, setEngineDepth] = useState(12);
  const [speed, setSpeed] = useState<TimeControl[]>(["all"]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [error, setError] = useState("");
  const [isLaunching, setIsLaunching] = useState(false);

  const hasProAccess = plan === "pro" || plan === "lifetime";

  const handleScan = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) {
      setError("Enter your chess username.");
      return;
    }
    if (!source) {
      setError("Select a platform — Lichess, Chess.com, or Paste PGN.");
      return;
    }

    if (source === "pgn") {
      const trimmedPgn = pgnText.trim();
      if (!trimmedPgn) {
        setError("Paste at least one PGN game.");
        return;
      }
      if (new Blob([trimmedPgn]).size > PGN_MAX_BYTES) {
        setError("PGN is too large (max 2 MB).");
        return;
      }
      if (splitMultiPgn(trimmedPgn).length > PGN_MAX_GAMES) {
        setError("Too many games (max 250).");
        return;
      }
    }

    if (!hasProAccess && gameRangeMode === "count" && gameCount > FREE_MAX_GAMES) {
      setError(`Free plan supports up to ${FREE_MAX_GAMES} recent games per scan. Upgrade on /pricing.`);
      return;
    }
    if (!hasProAccess && gameRangeMode === "since") {
      setError("Scanning by date range is a Pro feature. Upgrade on /pricing.");
      return;
    }
    if (gameRangeMode === "since" && !sinceDate) {
      setError("Pick a start date for the Range mode.");
      return;
    }
    if (gameRangeMode === "since" && sinceDate && untilDate && new Date(untilDate) < new Date(sinceDate)) {
      setError("End date can't be before start date.");
      return;
    }
    if (!hasProAccess && engineDepth > FREE_MAX_DEPTH) {
      setError(`Free plan supports engine depth up to ${FREE_MAX_DEPTH}. Upgrade on /pricing.`);
      return;
    }

    setIsLaunching(true);
    setError("");

    try {
      const rangeCap = hasProAccess ? PRO_MAX_GAMES : FREE_MAX_GAMES;
      const safeGames = gameRangeMode === "since"
        ? rangeCap
        : Math.min(hasProAccess ? PRO_MAX_GAMES : 5000, Math.max(1, Math.floor(gameCount || 300)));
      const safeSince = gameRangeMode === "since" && sinceDate ? new Date(sinceDate).getTime() : undefined;
      const safeUntil = gameRangeMode === "since" && untilDate ? new Date(untilDate).getTime() : undefined;
      const safeMoves = Math.min(hasProAccess ? 40 : FREE_MAX_MOVES, Math.max(1, Math.floor(moveCount || 20)));
      const safeCpThreshold = Math.min(1000, Math.max(1, Math.floor(cpThreshold || 50)));
      const safeDepth = Math.min(24, Math.max(6, Math.floor(engineDepth || 12)));

      const scanConfig = {
        maxGames: safeGames,
        maxMoves: safeMoves,
        cpThreshold: safeCpThreshold,
        engineDepth: safeDepth,
        source: source!,
        scanMode: FULL_SCAN_MODE,
        speed,
        since: safeSince ?? null,
        until: safeUntil ?? null,
        maxTactics: null,
        maxEndgames: null,
        ...(source === "pgn" ? { pgnText: pgnText.trim() } : {}),
      };

      const reuseSignature = authenticated
        ? await buildScanReuseSignatureInBrowser(trimmed, {
            maxGames: safeGames,
            maxOpeningMoves: safeMoves,
            cpLossThreshold: safeCpThreshold,
            engineDepth: safeDepth,
            source: source!,
            scanMode: FULL_SCAN_MODE,
            timeControl: speed,
            since: safeSince,
            until: safeUntil,
            ...(source === "pgn" ? { pgnText: pgnText.trim() } : {}),
          })
        : null;

      const res = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chessUsername: trimmed, config: scanConfig, reuseSignature }),
      });

      const json = await res.json();
      if (!res.ok || !json.id) throw new Error(json.error || "Could not create scan session.");

      if (json.guestToken) {
        try { localStorage.setItem(scanOwnerStorageKey(json.id), json.guestToken); } catch {}
      }

      router.push(`/report/${json.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <form onSubmit={handleScan} className="glass-card space-y-4 p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-lg">
          🔬
        </span>
        <div>
          <h3 className="text-sm font-bold text-white">New Scan</h3>
          <p className="text-[11px] text-slate-500">
            Analyze your recent games
          </p>
        </div>
      </div>

      {/* Platform + Username */}
      <div className="flex items-center overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.04]">
        <div className="flex shrink-0 gap-0.5 px-2 py-2">
          {(["lichess", "chesscom", "pgn"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSource(s)}
              className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
                source === s
                  ? "bg-gradient-to-r from-amber-200 to-orange-300 text-slate-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {s === "lichess" ? "Lichess" : s === "chesscom" ? "Chess.com" : "PGN"}
            </button>
          ))}
        </div>
        <div className="h-6 w-px shrink-0 bg-white/[0.10]" />
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={
            source === "chesscom" ? "Chess.com username"
            : source === "lichess" ? "Lichess username"
            : source === "pgn" ? "Your name (as in PGN)"
            : "Pick a platform"
          }
          className="flex-1 bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500"
        />
      </div>

      {source === "pgn" && (
        <textarea
          value={pgnText}
          onChange={(e) => setPgnText(e.target.value)}
          placeholder="Paste one or more PGN games here..."
          className="h-24 w-full resize-y rounded-xl bg-black/30 p-3 font-mono text-xs text-white outline-none placeholder:text-slate-500"
        />
      )}

      {/* Advanced settings toggle */}
      <button
        type="button"
        onClick={() => setAdvancedOpen(!advancedOpen)}
        className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
      >
        <svg className={`h-3 w-3 transition-transform ${advancedOpen ? "rotate-90" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M9 5l7 7-7 7" />
        </svg>
        Advanced settings
      </button>

      {advancedOpen && (
        <div className="space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          {/* Time control */}
          <div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
              Time Control
            </span>
            <div className="mt-1 grid h-9 grid-cols-5 gap-1">
              {(["all", "bullet", "blitz", "rapid", "classical"] as const).map((tc) => (
                <button
                  key={tc}
                  type="button"
                  onClick={() => {
                    if (tc === "all") setSpeed(["all"]);
                    else {
                      setSpeed((prev) => {
                        const withoutAll = prev.filter((s) => s !== "all");
                        const next = withoutAll.includes(tc)
                          ? withoutAll.filter((s) => s !== tc)
                          : [...withoutAll, tc];
                        return next.length === 0 || next.length === 4 ? ["all"] : next;
                      });
                    }
                  }}
                  className={`rounded-md text-[10px] font-semibold transition-all ${
                    speed.includes(tc)
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950"
                      : "text-slate-400 hover:bg-white/[0.05]"
                  }`}
                >
                  {tc === "all" ? "All" : tc.charAt(0).toUpperCase() + tc.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Game range mode toggle */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
              Range
            </span>
            <div className="flex h-6 gap-0.5 rounded-md border border-white/[0.06] bg-white/[0.02] p-0.5">
              <button
                type="button"
                onClick={() => setGameRangeMode("count")}
                className={`rounded px-2 text-[10px] font-semibold transition-all ${
                  gameRangeMode === "count"
                    ? "bg-emerald-500/80 text-slate-950"
                    : "text-slate-500"
                }`}
              >
                Last N
              </button>
              <button
                type="button"
                onClick={() => setGameRangeMode("since")}
                className={`rounded px-2 text-[10px] font-semibold transition-all ${
                  gameRangeMode === "since"
                    ? "bg-emerald-500/80 text-slate-950"
                    : "text-slate-500"
                }`}
              >
                Range
              </button>
            </div>
          </div>

          {/* Settings grid */}
          <div className="grid grid-cols-2 gap-3">
            {gameRangeMode === "count" ? (
              <div className="space-y-1">
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Games</span>
                <input
                  type="number"
                  min={1}
                  max={hasProAccess ? undefined : 300}
                  value={gameCount}
                  onChange={(e) => setGameCount(Number(e.target.value))}
                  className="glass-input h-9 text-sm"
                />
              </div>
            ) : (
              <div className="space-y-1">
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">From</span>
                <input
                  type="date"
                  value={sinceDate}
                  onChange={(e) => setSinceDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  disabled={!hasProAccess}
                  className="glass-input h-9 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            )}
            <div className="space-y-1">
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Moves</span>
              <input
                type="number"
                min={1}
                max={hasProAccess ? 40 : FREE_MAX_MOVES}
                value={moveCount}
                onChange={(e) => setMoveCount(Number(e.target.value))}
                className="glass-input h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">CP Threshold</span>
              <input
                type="number"
                min={1}
                max={1000}
                value={cpThreshold}
                onChange={(e) => setCpThreshold(Number(e.target.value))}
                className="glass-input h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Depth</span>
              <input
                type="number"
                min={6}
                max={24}
                value={engineDepth}
                onChange={(e) => setEngineDepth(Number(e.target.value))}
                className="glass-input h-9 text-sm"
              />
            </div>
          </div>

          {gameRangeMode === "since" && sinceDate && !hasProAccess && (
            <p className="text-xs font-medium text-amber-400">
              Requires <a href="/pricing" className="underline">Pro</a>
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs font-medium text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={isLaunching}
        className="btn-primary flex w-full items-center justify-center gap-2 py-2.5 text-sm disabled:opacity-50"
      >
        {isLaunching ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Starting scan...
          </>
        ) : (
          <>
            Scan Your Games
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </>
        )}
      </button>
    </form>
  );
}
