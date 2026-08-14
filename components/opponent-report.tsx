"use client";

import { useEffect, useState } from "react";
import { Chessboard } from "@/components/chessboard-compat";
import { X, Swords, ArrowRight, Clock, Target, Trophy } from "lucide-react";
import type { AnalyzeResponse } from "@/lib/types";

/**
 * OpponentReport — minimal pre-match intel card.
 *
 * Shows only what you need before a game:
 * - Top 3 opening leaks (what to play against them)
 * - Tactical blind spots (what motifs they miss)
 * - Endgame weakness signal (should you trade?)
 * - Quick prep summary
 *
 * Triggered by ?mode=opponent on /report/[id].
 * Can be dismissed to reveal the full report underneath.
 */

interface OpponentReportProps {
  username: string;
  result: AnalyzeResponse;
  onDismiss: () => void;
}

export function OpponentReport({ username, result, onDismiss }: OpponentReportProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    // Prevent body scroll
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Extract key data
  const leaks = (result.leaks ?? [])
    .slice()
    .sort((a, b) => {
      const aTotal = (a.userWins ?? 0) + (a.userDraws ?? 0) + (a.userLosses ?? 0);
      const bTotal = (b.userWins ?? 0) + (b.userDraws ?? 0) + (b.userLosses ?? 0);
      const aRate = aTotal > 0 ? (a.userLosses ?? 0) / aTotal : 0;
      const bRate = bTotal > 0 ? (b.userLosses ?? 0) / bTotal : 0;
      return bRate - aRate;
    })
    .slice(0, 3);

  const missedTactics = result.missedTactics ?? [];
  const topMotifs = getMotifSummary(missedTactics).slice(0, 3);

  const endgameMistakes = result.endgameMistakes ?? [];
  const endgameSignal = endgameMistakes.length > 15
    ? "Weak — push to endgames"
    : endgameMistakes.length > 5
      ? "Average — neutral"
      : "Strong — avoid endgames";

  const totalGames = result.gamesAnalyzed ?? 0;
  const acpl = leaks.length > 0
    ? leaks.reduce((sum, l) => sum + l.cpLoss, 0) / leaks.length / 100
    : 0;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${
        mounted ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`relative mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#1e1a24] bg-[#0d0b0e] shadow-2xl transition-all duration-300 ${
          mounted ? "translate-y-0 scale-100" : "translate-y-4 scale-95"
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-[#1e1a24] bg-[#0d0b0e] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-500/10">
                <Swords className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {username}
                </h2>
                <p className="text-xs text-[#565061]">
                  Pre-match intel · {totalGames} games scanned
                </p>
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="grid h-8 w-8 place-items-center rounded-lg border border-[#1e1a24] text-[#565061] transition-colors hover:border-[#ff5a1f]/30 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-5 px-6 py-5">
          {/* Quick stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <Target className="h-4 w-4" />, label: "ACPL", value: Math.round(acpl).toString(), color: acpl > 60 ? "text-red-400" : acpl > 35 ? "text-amber-400" : "text-emerald-400" },
              { icon: <Clock className="h-4 w-4" />, label: "Games", value: totalGames.toString(), color: "text-[#8d8696]" },
              { icon: <Trophy className="h-4 w-4" />, label: "Endgames", value: endgameSignal.split(" — ")[0], color: endgameSignal.includes("Weak") ? "text-emerald-400" : endgameSignal.includes("Strong") ? "text-red-400" : "text-amber-400" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-[#1e1a24] bg-[#121015] p-3 text-center">
                <div className="mb-1 flex items-center justify-center gap-1.5 text-[#565061]">
                  {s.icon}
                  <span className="text-[10px] font-semibold uppercase tracking-wider">{s.label}</span>
                </div>
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Top opening leaks — exploit these */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <span className="text-[#ff5a1f]">🎯</span>
              Exploit these openings
            </h3>
            <div className="space-y-2">
              {leaks.map((leak, i) => {
                const total = (leak.userWins ?? 0) + (leak.userDraws ?? 0) + (leak.userLosses ?? 0);
                const lossRate = total > 0 ? Math.round(((leak.userLosses ?? 0) / total) * 100) : 0;
                return (
                  <div
                    key={leak.openingName ?? i}
                    className="flex items-center gap-3 rounded-xl border border-[#1e1a24] bg-[#121015] p-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ff5a1f]/10 text-sm font-bold text-[#ff5a1f]">
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">
                        {leak.openingName ?? "Unknown opening"}
                      </p>
                      <p className="text-xs text-[#565061]">
                        {leak.reachCount} games · −{(leak.cpLoss / 100).toFixed(1)} avg cp loss
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-400">
                        {lossRate}% loss
                      </p>
                    </div>
                  </div>
                );
              })}
              {leaks.length === 0 && (
                <p className="text-sm text-[#565061]">No repeated opening patterns found.</p>
              )}
            </div>
          </div>

          {/* Tactical blind spots */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <span className="text-amber-400">⚡</span>
              Tactical blind spots
            </h3>
            <div className="flex flex-wrap gap-2">
              {topMotifs.map((m) => (
                <span
                  key={m.name}
                  className="rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-3 py-1.5 text-xs font-semibold text-amber-300"
                >
                  {m.name} ×{m.count}
                </span>
              ))}
              {topMotifs.length === 0 && (
                <p className="text-sm text-[#565061]">No tactical patterns detected.</p>
              )}
            </div>
          </div>

          {/* Endgame signal */}
          <div className="rounded-xl border border-[#1e1a24] bg-[#121015] p-4">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
              <span className="text-emerald-400">🏁</span>
              Endgame signal
            </h3>
            <p className="text-sm text-[#8d8696]">
              {endgameSignal.includes("Weak")
                ? `${username} converts poorly in endgames (${endgameMistakes.length} mistakes in ${totalGames} games). Trade pieces and push to a pawn endgame — they'll likely leak points.`
                : endgameSignal.includes("Strong")
                  ? `${username} is solid in endgames (${endgameMistakes.length} mistakes only). Avoid trading — fight in the middlegame where you can create complications.`
                  : `${username} has average endgame technique (${endgameMistakes.length} mistakes). Endgame play is neutral — focus on middlegame advantages.`}
            </p>
          </div>

          {/* Prep summary */}
          <div className="rounded-xl border border-[#ff5a1f]/20 bg-[#ff5a1f]/[0.06] p-4">
            <h3 className="mb-2 text-sm font-bold text-[#ff8c42]">
              📋 Quick prep summary
            </h3>
            <ul className="space-y-1.5 text-sm text-[#8d8696]">
              {leaks.length > 0 && (
                <li className="flex items-start gap-2">
                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ff5a1f]" />
                  Play {leaks[0].openingName ?? "their weakest opening"} — they lose from this position repeatedly ({leaks[0].reachCount} games, −{(leaks[0].cpLoss / 100).toFixed(1)} avg cp loss)
                </li>
              )}
              {topMotifs.length > 0 && (
                <li className="flex items-start gap-2">
                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ff5a1f]" />
                  Look for {topMotifs[0].name.toLowerCase()} opportunities — they miss this pattern regularly
                </li>
              )}
              <li className="flex items-start gap-2">
                <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ff5a1f]" />
                {endgameSignal.includes("Weak")
                  ? "Trade into endgames — they convert poorly"
                  : endgameSignal.includes("Strong")
                    ? "Avoid endgames — fight in the middlegame"
                    : "Endgame is neutral — focus on middlegame plans"}
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div className="flex gap-3">
            <button
              onClick={onDismiss}
              className="flex-1 rounded-xl border border-[#1e1a24] bg-[#121015] py-3 text-sm font-semibold text-[#8d8696] transition-colors hover:border-[#ff5a1f]/20 hover:text-white"
            >
              View full report
            </button>
            <button
              onClick={() => {
                const leakName = leaks[0]?.openingName ?? "their weakest opening";
                const text = `I just scanned ${username} on @FireChess — they consistently lose from ${leakName}. Time to prepare. 🔥`;
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
              }}
              className="nl3-cta flex-1 rounded-xl bg-[#ff5a1f] py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
            >
              Share on X
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──

function getMotifSummary(tactics: { tags: string[] }[]) {
  const counts = new Map<string, number>();
  for (const t of tactics) {
    for (const tag of t.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
