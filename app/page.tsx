"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { DrillMode } from "@/components/drill-mode";
import { MistakeCard } from "@/components/mistake-card";
import { analyzeOpeningLeaksInBrowser } from "@/lib/client-analysis";
import type { AnalysisProgress } from "@/lib/client-analysis";
import type { AnalyzeResponse } from "@/lib/types";

type RequestState = "idle" | "loading" | "done" | "error";
const PREFS_KEY = "firechess-user-prefs";

export default function HomePage() {
  const [username, setUsername] = useState("");
  const [gameCount, setGameCount] = useState(100);
  const [moveCount, setMoveCount] = useState(12);
  const [cpThreshold, setCpThreshold] = useState(100);
  const [engineDepth, setEngineDepth] = useState(10);
  const [lastRunConfig, setLastRunConfig] =
    useState<{ maxGames: number; maxMoves: number; cpThreshold: number; engineDepth: number } | null>(null);
  const [state, setState] = useState<RequestState>("idle");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [progressLogs, setProgressLogs] = useState<string[]>([]);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PREFS_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as {
        gameCount?: number;
        moveCount?: number;
        cpThreshold?: number;
        engineDepth?: number;
      };

      if (typeof parsed.gameCount === "number") {
        setGameCount(Math.min(500, Math.max(1, Math.floor(parsed.gameCount))));
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
          engineDepth
        })
      );
    } catch {
      // ignore storage write failures
    }
  }, [gameCount, moveCount, cpThreshold, engineDepth]);

  const leaks = useMemo(() => result?.leaks ?? [], [result]);
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

    const estimatedAccuracy = Math.min(99.5, Math.max(35, 100 - weightedCpLoss / 4));
    const estimatedRating = Math.round(
      Math.min(2800, Math.max(600, 700 + estimatedAccuracy * 22 - severeLeakRate * 320 - weightedCpLoss * 0.8))
    );

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
  }, [diagnostics, lastRunConfig, cpThreshold, result?.leaks]);
  const maxObservedCpLoss = useMemo(() => {
    const losses = diagnostics?.positionTraces
      .map((trace) => trace.cpLoss)
      .filter((value): value is number => typeof value === "number");

    if (!losses || losses.length === 0) return null;
    return Math.max(...losses);
  }, [diagnostics]);

  const appendProgress = (message: string) => {
    setProgressLogs((prev) => {
      const next = [...prev, message];
      return next.slice(-8);
    });
  };

  const onBrowserProgress = (progress: AnalysisProgress) => {
    appendProgress(progress.message);
  };

  const runBrowserAnalysis = async (
    trimmed: string,
    safeGames: number,
    safeMoves: number,
    safeCpThreshold: number,
    safeDepth: number,
    reason?: string
  ) => {
    setNotice(reason ?? "Cloud eval disabled. Running local Stockfish analysis in your browser.");
    appendProgress("Using browser-side analysis...");
    const browserResult = await analyzeOpeningLeaksInBrowser(trimmed, {
      maxGames: safeGames,
      maxOpeningMoves: safeMoves,
      cpLossThreshold: safeCpThreshold,
      engineDepth: safeDepth,
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

    try {
      const safeGames = Math.min(500, Math.max(1, Math.floor(gameCount || 100)));
      const safeMoves = Math.min(30, Math.max(1, Math.floor(moveCount || 12)));
      const safeCpThreshold = Math.min(1000, Math.max(1, Math.floor(cpThreshold || 100)));
      const safeDepth = Math.min(24, Math.max(6, Math.floor(engineDepth || 10)));
      setLastRunConfig({ maxGames: safeGames, maxMoves: safeMoves, cpThreshold: safeCpThreshold, engineDepth: safeDepth });

      setState("loading");
      setError("");
      setNotice("");
      setResult(null);
      setProgressLogs(["Starting analysis..."]);
      appendProgress(
        `Settings: up to ${safeGames} games, first ${safeMoves} moves, CP threshold > ${safeCpThreshold}, depth ${safeDepth}.`
      );

      await runBrowserAnalysis(trimmed, safeGames, safeMoves, safeCpThreshold, safeDepth);
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

  return (
    <main className="min-h-screen px-4 py-10 md:px-8">
      <section className="mx-auto w-full max-w-4xl space-y-8">
        <header className="space-y-3 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Automated Opening Leak Scanner</h1>
          <p className="mx-auto max-w-2xl text-sm text-slate-300 md:text-base">
            Enter a Lichess username to scan recent games, detect repeated opening mistakes, and solve the correct move
            as a puzzle.
          </p>
        </header>

        <form
          onSubmit={onSubmit}
          className="mx-auto flex w-full max-w-2xl flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-4"
        >
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Lichess username"
              className="h-11 flex-1 rounded-md border border-slate-700 bg-slate-950 px-4 text-slate-100 placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={state === "loading"}
              className="h-11 rounded-md bg-emerald-500 px-5 font-medium text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {state === "loading" ? "Scanning..." : "Scan Games"}
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <label className="text-sm text-slate-300">
              Games to scan
              <input
                type="number"
                min={1}
                max={500}
                value={gameCount}
                onChange={(e) => setGameCount(Number(e.target.value))}
                className="mt-1 h-11 w-full rounded-md border border-slate-700 bg-slate-950 px-4 text-slate-100"
              />
            </label>

            <label className="text-sm text-slate-300">
              Opening moves per game
              <input
                type="number"
                min={1}
                max={30}
                value={moveCount}
                onChange={(e) => setMoveCount(Number(e.target.value))}
                className="mt-1 h-11 w-full rounded-md border border-slate-700 bg-slate-950 px-4 text-slate-100"
              />
            </label>

            <label className="text-sm text-slate-300">
              CP loss threshold
              <input
                type="number"
                min={1}
                max={1000}
                value={cpThreshold}
                onChange={(e) => setCpThreshold(Number(e.target.value))}
                className="mt-1 h-11 w-full rounded-md border border-slate-700 bg-slate-950 px-4 text-slate-100"
              />
            </label>

            <label className="text-sm text-slate-300">
              Engine depth
              <input
                type="number"
                min={6}
                max={24}
                value={engineDepth}
                onChange={(e) => setEngineDepth(Number(e.target.value))}
                className="mt-1 h-11 w-full rounded-md border border-slate-700 bg-slate-950 px-4 text-slate-100"
              />
            </label>
          </div>
        </form>

        {state === "loading" && (
          <div className="mx-auto w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
            <p className="mb-3">Running analysis pipeline...</p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-emerald-400" />
            </div>
            <div className="mt-4 space-y-1 rounded-md bg-slate-950/70 p-3 font-mono text-xs text-slate-300">
              {progressLogs.length === 0 ? (
                <p>Waiting for progress updates...</p>
              ) : (
                progressLogs.map((log, index) => <p key={`${index}-${log}`}>• {log}</p>)
              )}
            </div>
          </div>
        )}

        {notice && state !== "loading" && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">{notice}</div>
        )}

        {state === "error" && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>
        )}

        {state === "done" && result && (
          <section className="space-y-4">
            {report && (
              <div className="rounded-xl border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-500/10 via-emerald-500/10 to-cyan-500/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-semibold text-white">📸 Share-Worthy Opening Report</h2>
                  <span className="rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-2.5 py-1 text-xs font-medium text-fuchsia-200">
                    {report.vibeTitle}
                  </span>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-4">
                  <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                    <p className="text-xs text-slate-400">🎯 Estimated Accuracy</p>
                    <p className="text-xl font-bold text-emerald-300">{report.estimatedAccuracy.toFixed(1)}%</p>
                  </div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                    <p className="text-xs text-slate-400">🏆 Estimated Rating</p>
                    <p className="text-xl font-bold text-emerald-300">{report.estimatedRating}</p>
                  </div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                    <p className="text-xs text-slate-400">📉 Avg Eval Loss</p>
                    <p className="text-xl font-bold text-emerald-300">{(report.weightedCpLoss / 100).toFixed(2)}</p>
                  </div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                    <p className="text-xs text-slate-400">🚨 Severe Leak Rate</p>
                    <p className="text-xl font-bold text-emerald-300">{(report.severeLeakRate * 100).toFixed(0)}%</p>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-4">
                  <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                    <p className="text-xs text-slate-400">🧊 Consistency Score</p>
                    <p className="text-xl font-bold text-cyan-300">{report.consistencyScore}/100</p>
                  </div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                    <p className="text-xs text-slate-400">💥 Peak Throw (P75)</p>
                    <p className="text-xl font-bold text-cyan-300">{(report.p75CpLoss / 100).toFixed(2)}</p>
                  </div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                    <p className="text-xs text-slate-400">🧪 Sample Confidence</p>
                    <p className="text-xl font-bold text-cyan-300">{report.confidence}%</p>
                  </div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                    <p className="text-xs text-slate-400">🕵️ Main Leak Vibe</p>
                    <p className="text-sm font-bold text-cyan-300">{report.topTag}</p>
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-300">
                  Based on {report.sampleSize} repeated positions from this scan. These are opening-pattern estimates, not
                  full-game engine accuracy.
                </p>
                <p className="mt-1 text-xs text-fuchsia-200/90">✨ Screenshot this card for your chess recap post.</p>
              </div>
            )}

            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
              <p>
                Games analyzed: <span className="font-semibold text-white">{result.gamesAnalyzed}</span>
              </p>
              {lastRunConfig && (
                <p>
                  Settings used: <span className="font-semibold text-white">{lastRunConfig.maxGames}</span> games, first{" "}
                  <span className="font-semibold text-white">{lastRunConfig.maxMoves}</span> moves, CP threshold {">"}{" "}
                  <span className="font-semibold text-white">{lastRunConfig.cpThreshold}</span>, depth{" "}
                  <span className="font-semibold text-white">{lastRunConfig.engineDepth}</span>
                </p>
              )}
              <p>
                Repeated opening positions (≥3): <span className="font-semibold text-white">{result.repeatedPositions}</span>
              </p>
              <p>
                Leaks found (Eval loss {">"} {((lastRunConfig?.cpThreshold ?? cpThreshold) / 100).toFixed(2)}):{" "}
                <span className="font-semibold text-white">{result.leaks.length}</span>
              </p>
              {typeof maxObservedCpLoss === "number" && (
                <p>
                  Max observed eval loss: <span className="font-semibold text-white">{(maxObservedCpLoss / 100).toFixed(2)}</span>
                </p>
              )}
            </div>

            {leaks.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
                No repeated opening leaks found in the first {lastRunConfig?.maxMoves ?? moveCount} moves of your recent
                games.
              </div>
            ) : (
              <div className="space-y-4">
                {leaks.map((leak) => (
                  <MistakeCard
                    key={`${leak.fenBefore}-${leak.userMove}`}
                    leak={leak}
                    engineDepth={lastRunConfig?.engineDepth ?? engineDepth}
                  />
                ))}
              </div>
            )}

            {diagnostics && (
              <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
                <h2 className="text-base font-semibold text-white">Detailed analysis logs</h2>

                <details className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
                  <summary className="cursor-pointer font-medium text-slate-100">
                    Game traces ({diagnostics.gameTraces.length})
                  </summary>
                  <div className="mt-3 max-h-80 space-y-2 overflow-auto font-mono text-xs text-slate-300">
                    {diagnostics.gameTraces.map((trace) => (
                      <div key={`game-${trace.gameIndex}`} className="rounded border border-slate-800 p-2">
                        <p>
                          #{trace.gameIndex} • {trace.userColor} • moves: {trace.openingMoves.length}
                        </p>
                        <p className="mt-1 break-words text-slate-400">
                          {trace.openingMoves.length ? trace.openingMoves.join(" ") : "(no opening moves parsed)"}
                        </p>
                      </div>
                    ))}
                  </div>
                </details>

                <details className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
                  <summary className="cursor-pointer font-medium text-slate-100">
                    Position eval traces ({diagnostics.positionTraces.length})
                  </summary>
                  <div className="mt-3 max-h-96 space-y-2 overflow-auto font-mono text-xs text-slate-300">
                    {diagnostics.positionTraces.map((trace, index) => (
                      <div key={`pos-${index}-${trace.fenBefore}`} className="rounded border border-slate-800 p-2">
                        <p>
                          reach={trace.reachCount}, userMove={trace.userMove}, best={trace.bestMove ?? "n/a"}, cpLoss={
                            trace.cpLoss ?? "n/a"
                          }, flagged={trace.flagged ? "yes" : "no"}
                        </p>
                        <p className="mt-1 text-slate-400">
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

            {diagnostics && diagnostics.positionTraces.length > 0 && <DrillMode positions={diagnostics.positionTraces} />}
          </section>
        )}
      </section>
    </main>
  );
}
