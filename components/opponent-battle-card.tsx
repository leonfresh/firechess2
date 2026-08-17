"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Chessboard } from "@/components/chessboard-compat";
import { scanOwnerStorageKey } from "@/lib/scan-session";
import type { AnalyzeResponse } from "@/lib/types";
import {
  Swords,
  ExternalLink,
  Target,
  Trophy,
  AlertTriangle,
  Share2,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

/**
 * OpponentBattleCard — minimal pre-match intel card.
 *
 * Receives initial data from the server component. If the scan is still
 * processing (result is null), polls /api/scans/{id} every 3 seconds
 * until status=ready, then renders the battle card.
 */

type Props = {
  id: string;
  username: string;
  status: string;
  result: AnalyzeResponse | null;
  guestToken?: string | null;
};

export default function OpponentBattleCard({
  id,
  username: initialUsername,
  status: initialStatus,
  result: initialResult,
  guestToken,
}: Props) {
  const [result, setResult] = useState<AnalyzeResponse | null>(initialResult);
  const [status, setStatus] = useState(initialStatus);
  const [username] = useState(initialUsername);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll for result if scan is still processing
  useEffect(() => {
    if (status === "ready" && result) return;

    const headers: Record<string, string> = {};
    if (guestToken) headers["x-scan-owner-token"] = guestToken;
    else {
      try {
        const stored = window.localStorage.getItem(scanOwnerStorageKey(id));
        if (stored) headers["x-scan-owner-token"] = stored;
      } catch {}
    }

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/scans/${id}`, { headers });
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "ready" && data.result) {
          setResult(data.result);
          setStatus("ready");
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (data.status === "failed") {
          setStatus("failed");
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {}
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [id, status, result, guestToken]);

  // ── Processing state ──
  if (status !== "ready" || !result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070608]">
        <div className="text-center">
          <div className="relative mx-auto mb-5 h-16 w-16">
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-[#1e1a24] border-t-[#ff5a1f]" />
            <div className="absolute inset-2 animate-spin rounded-full border-2 border-[#1e1a24] border-b-[#ff5a1f]" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Swords className="h-5 w-5 text-[#ff5a1f]" />
            </div>
          </div>
          <p className="text-base font-semibold text-white">
            {status === "failed" ? "Scan failed" : `Scanning ${username}...`}
          </p>
          <p className="mt-1.5 text-sm text-[#8d8696]">
            {status === "failed"
              ? "Something went wrong. Try again."
              : "50 games · depth 8 · openings only · ~15 seconds"}
          </p>
          {status === "failed" && (
            <Link href="/opponent" className="mt-4 inline-block text-sm text-[#ff5a1f] hover:underline">
              Try another username
            </Link>
          )}
        </div>
      </div>
    );
  }

  // ── Battle card ──
  const totalGames = result.gamesAnalyzed ?? 0;

  const leaks = (result.leaks ?? [])
    .slice()
    .sort((a, b) => {
      const aT = (a.userWins ?? 0) + (a.userDraws ?? 0) + (a.userLosses ?? 0);
      const bT = (b.userWins ?? 0) + (b.userDraws ?? 0) + (b.userLosses ?? 0);
      const aR = aT > 0 ? (a.userLosses ?? 0) / aT : 0;
      const bR = bT > 0 ? (b.userLosses ?? 0) / bT : 0;
      return bR - aR;
    })
    .slice(0, 5);

  const motifs = getMotifClusters(result.missedTactics ?? []).slice(0, 4);

  const egCount = result.endgameMistakes?.length ?? 0;
  const egSignal =
    egCount > 10
      ? { label: "WEAK", advice: "Trade pieces and push to endgames." }
      : egCount > 3
        ? { label: "AVG", advice: "Endgame is neutral — focus on middlegame." }
        : { label: "SOLID", advice: "Avoid endgames — they convert well." };

  const featuredFen = leaks[0]?.fenBefore;
  const shareText = `Scanned ${username} on FireChess — ${leaks.length} opening leaks found. ${leaks[0]?.openingName ? `Their weakest: ${leaks[0].openingName}.` : ""} Prep time. 🔥`;

  return (
    <div className="min-h-screen bg-[#070608] text-[#f0edf2]">
      <div className="nl3-grain pointer-events-none fixed inset-0 z-[60] opacity-30" />

      {/* Header bar */}
      <div className="sticky top-0 z-50 border-b border-[#1e1a24] bg-[#070608]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link href="/opponent" className="flex items-center gap-2 text-sm text-[#565061] hover:text-white">
            ← New scan
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigator.clipboard?.writeText(window.location.href)}
              className="flex items-center gap-1.5 rounded-lg border border-[#1e1a24] px-3 py-1.5 text-xs text-[#8d8696] hover:border-[#ff5a1f]/20 hover:text-white"
            >
              <Share2 className="h-3 w-3" />
              Copy link
            </button>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-1.5 rounded-lg bg-[#1e1a24] px-3 py-1.5 text-xs text-[#8d8696] hover:text-white"
            >
              Share on X
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Battle card header */}
        <div className="mb-6 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#ff5a1f]/20 bg-[#ff5a1f]/[0.08] px-4 py-1.5">
            <span className="nl3-pulse-dot h-1.5 w-1.5 rounded-full bg-[#ff5a1f] shadow-[0_0_8px_#ff5a1f]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#ff8c42]">
              Opponent intel
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-[-0.02em] text-white">
            {username}
          </h1>
          <p className="mt-1.5 text-sm text-[#565061]">
            {totalGames} games · openings scan · depth 8
          </p>
        </div>

        {/* Featured board + first leak */}
        {featuredFen && leaks[0] && (
          <div className="relative mb-6 flex items-center gap-4 overflow-hidden rounded-xl border border-[#1e1a24] bg-[#121015] p-4">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff5a1f]/40 to-transparent" />
            <div className="shrink-0 overflow-hidden rounded-lg border border-[#1e1a24]">
              <Chessboard
                position={featuredFen}
                boardWidth={140}
                arePiecesDraggable={false}
                customDarkSquareStyle={{ backgroundColor: "#779952" }}
                customLightSquareStyle={{ backgroundColor: "#edeed1" }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#ff8c42]">
                Biggest leak
              </p>
              <p className="mt-1 text-lg font-bold text-white">
                {leaks[0].openingName ?? "Unknown"}
              </p>
              <p className="mt-1 text-sm text-[#8d8696]">
                {leaks[0].reachCount} games · −{(leaks[0].cpLoss / 100).toFixed(1)} avg cp loss
              </p>
              {leaks[0].bestMove && (
                <p className="mt-1 font-mono text-xs text-[#8d8696]">
                  Best response: <span className="text-[#ff8c42]">{leaks[0].bestMove}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Opening leaks — compact list */}
        <div className="mb-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
            <Target className="h-4 w-4 text-[#ff5a1f]" />
            Top openings to play against them
          </h2>
          <div className="space-y-1.5">
            {leaks.map((leak, i) => {
              const total = (leak.userWins ?? 0) + (leak.userDraws ?? 0) + (leak.userLosses ?? 0);
              const lossRate = total > 0 ? Math.round(((leak.userLosses ?? 0) / total) * 100) : 0;
              const winRate = total > 0 ? Math.round(((leak.userWins ?? 0) / total) * 100) : 0;
              return (
                <div
                  key={leak.openingName ?? i}
                  className="flex items-center gap-3 rounded-lg border border-[#1e1a24] bg-[#121015] px-3 py-2.5 transition-colors hover:border-[#ff5a1f]/25"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#ff5a1f]/[0.12] text-xs font-bold text-[#ff8c42]">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {leak.openingName ?? "Unknown"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-xs">
                    <span className="text-[#565061]">{leak.reachCount}×</span>
                    <span className="font-bold text-red-400">{lossRate}%L</span>
                    <span className="font-bold text-[#8d8696]">{winRate}%W</span>
                  </div>
                </div>
              );
            })}
            {leaks.length === 0 && (
              <p className="text-sm text-[#565061]">No repeated opening patterns found in {totalGames} games.</p>
            )}
          </div>
        </div>

        {/* Tactical + Endgame — side by side */}
        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[#1e1a24] bg-[#121015] p-4">
            <h3 className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#565061]">
              Tactical blind spots
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {motifs.map((m) => (
                <span
                  key={m.name}
                  className="rounded-full border border-[#ff5a1f]/20 bg-[#ff5a1f]/[0.06] px-2.5 py-1 text-[11px] font-semibold text-[#ff8c42]"
                >
                  {m.name} ×{m.count}
                </span>
              ))}
              {motifs.length === 0 && (
                <span className="text-xs text-[#565061]">No patterns detected</span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-[#1e1a24] bg-[#121015] p-4">
            <h3 className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#565061]">
              Endgame signal
            </h3>
            <div className="flex items-center gap-3">
              <span className="rounded-lg border border-[#ff5a1f]/25 bg-[#ff5a1f]/[0.08] px-3 py-1.5 text-lg font-extrabold text-[#ff8c42]">
                {egSignal.label}
              </span>
              <p className="text-xs leading-relaxed text-[#8d8696]">
                {egSignal.advice}
              </p>
            </div>
          </div>
        </div>

        {/* Prep summary */}
        <div className="relative mb-6 overflow-hidden rounded-xl border border-[#ff5a1f]/25 bg-[#ff5a1f]/[0.05] p-4">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff5a1f]/40 to-transparent" />
          <h3 className="mb-2.5 text-sm font-bold text-white">
            Your prep in 3 moves
          </h3>
          <ol className="space-y-2 text-sm text-[#8d8696]">
            {leaks.length > 0 && (
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ff5a1f]/[0.12] text-[10px] font-bold text-[#ff8c42]">1</span>
                <span>
                  <strong className="text-white">Play {leaks[0].openingName ?? "their weakest opening"}</strong> —
                  they lose from this position repeatedly
                </span>
              </li>
            )}
            {motifs.length > 0 && (
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ff5a1f]/[0.12] text-[10px] font-bold text-[#ff8c42]">2</span>
                <span>
                  <strong className="text-white">Look for {motifs[0].name.toLowerCase()}</strong> —
                  they miss this pattern regularly
                </span>
              </li>
            )}
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ff5a1f]/[0.12] text-[10px] font-bold text-[#ff8c42]">3</span>
              <span>
                <strong className="text-white">{egSignal.label === "WEAK" ? "Trade into endgames" : egSignal.label === "SOLID" ? "Fight in the middlegame" : "Play normally"}</strong> —{" "}
                {egSignal.advice.toLowerCase()}
              </span>
            </li>
          </ol>
        </div>

        {/* CTA row */}
        <div className="flex gap-3">
          <Link
            href={`/report/${id}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#1e1a24] bg-[#121015] py-3 text-sm font-semibold text-[#8d8696] transition-colors hover:border-[#ff5a1f]/20 hover:text-white"
          >
            Full report
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/opponent"
            className="nl3-cta flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#ff5a1f] py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
          >
            Scan another opponent
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──

function getMotifClusters(tactics: { tags: string[] }[]) {
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
