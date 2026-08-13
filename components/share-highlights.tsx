"use client";

import { useMemo, useState } from "react";
import { Chess } from "chess.js";
import type { PieceSymbol } from "chess.js";
import type { AnalyzeResponse } from "@/lib/types";
import type { ComputedScanReport } from "@/lib/scan-session";

function uciToSan(fen: string, uci: string): string {
  try {
    const chess = new Chess(fen);
    const mv = chess.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: (uci.slice(4, 5) || undefined) as PieceSymbol | undefined,
    });
    return mv?.san ?? uci;
  } catch { return uci; }
}

type ShareKind = "brilliant" | "tactic" | "mental" | "vibe";

interface CardDef { kind: ShareKind; emoji: string; label: string; desc: string; accent: string; subtext: string; }

function buildUrl(reportId: string, kind: ShareKind) {
  return `/api/report/share-card?id=${encodeURIComponent(reportId)}&type=${kind}`;
}

const ACCENT: Record<string, { border: string; bg: string; text: string; glow: string; gradient: string }> = {
  cyan: { border: "border-cyan-500/20", bg: "bg-cyan-500/[0.06]", text: "text-cyan-300", glow: "shadow-cyan-500/15", gradient: "from-cyan-500/[0.08] to-cyan-500/[0.02]" },
  red: { border: "border-red-500/20", bg: "bg-red-500/[0.06]", text: "text-red-300", glow: "shadow-red-500/15", gradient: "from-red-500/[0.08] to-red-500/[0.02]" },
  purple: { border: "border-purple-500/20", bg: "bg-purple-500/[0.06]", text: "text-purple-300", glow: "shadow-purple-500/15", gradient: "from-purple-500/[0.08] to-purple-500/[0.02]" },
  orange: { border: "border-orange-500/20", bg: "bg-orange-500/[0.06]", text: "text-orange-300", glow: "shadow-orange-500/15", gradient: "from-orange-500/[0.08] to-orange-500/[0.02]" },
};

export function ShareHighlights({ reportId, result, reportMeta }: {
  reportId: string; result: AnalyzeResponse | null; reportMeta: ComputedScanReport | null;
}) {
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState<ShareKind | null>(null);

  const cards = useMemo<CardDef[]>(() => {
    const list: CardDef[] = [];
    if (result?.brilliantMoves?.length) {
      list.push({ kind: "brilliant", emoji: "💎", label: "Brilliant Move", desc: uciToSan(result.brilliantMoves[0].fenBefore, result.brilliantMoves[0].userMove), accent: "cyan", subtext: `${result.brilliantMoves.length} found in scan` });
    }
    if (result?.missedTactics?.length) {
      const biggest = result.missedTactics.reduce((a, b) => (b.cpLoss > a.cpLoss ? b : a));
      list.push({ kind: "tactic", emoji: "🎯", label: "Biggest Tactic Missed", desc: uciToSan(biggest.fenBefore, biggest.bestMove), accent: "red", subtext: `${(biggest.cpLoss / 100).toFixed(1)} pawn oversight` });
    }
    if (result?.mentalStats) {
      list.push({ kind: "mental", emoji: "🧠", label: "Mental Archetype", desc: result.mentalStats.archetype ?? "Your mindset", accent: "purple", subtext: `${result.mentalStats.stability}/100 stability` });
    }
    if (reportMeta?.vibeTitle) {
      list.push({ kind: "vibe", emoji: "🔥", label: "Playing Style", desc: reportMeta.vibeTitle, accent: "orange", subtext: `~${reportMeta.estimatedRating} estimated rating` });
    }
    return list;
  }, [result, reportMeta]);

  if (cards.length === 0) return null;

  const shareUrl = `https://firechess.com/report/${reportId}`;
  const shareText = reportMeta?.vibeTitle
    ? `My FireChess report: "${reportMeta.vibeTitle}" — ${(reportMeta.estimatedAccuracy ?? 0).toFixed(0)}% accuracy across ${result?.gamesAnalyzed ?? 0} games`
    : `My FireChess chess analysis report`;

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;

  return (
    <section className="rounded-[1.75rem] border border-[#1e1a24] bg-[radial-gradient(circle_at_top_right,_rgba(249,115,22,0.08),_rgba(15,23,42,0.5)_50%,_rgba(2,6,23,0.9)_100%)] p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-orange-400/70">Share</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Your highlights</h2>
          <p className="mt-1 text-sm text-[#8d8696]">Download share cards or post your report — each one generates its own preview image.</p>
        </div>
        <div className="flex items-center gap-2">
          <a href={tweetUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#1e1a24] bg-[#ff5a1f]/[0.05] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1e1a24] transition-colors">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            Post
          </a>
          <button type="button" onClick={copyLink}
            className="inline-flex items-center gap-1.5 rounded-xl border border-orange-500/25 bg-orange-500/[0.10] px-4 py-2 text-xs font-semibold text-orange-200 hover:bg-orange-500/[0.16] transition-colors">
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      </div>

      {/* Preview modal — matches thumbnail aspect ratio */}
      {preview && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm" onClick={() => setPreview(null)}>
          <div className="relative w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setPreview(null)} className="absolute -top-3 -right-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#1a1a1c] border border-[#ff5a1f]/25 text-white hover:bg-[#2a2a2c] transition-colors z-10 shadow-lg">✕</button>
            {(() => {
              const c = cards.find((x) => x.kind === preview);
              if (!c) return null;
              const acc = ACCENT[c.accent] ?? ACCENT.orange;
              return (
                <div className={`rounded-2xl border ${acc.border} overflow-hidden shadow-2xl ${acc.glow}`}>
                  <div className="aspect-[3/2] w-full bg-gradient-to-br from-slate-950 to-slate-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={buildUrl(reportId, c.kind)} alt={`${c.label} share card`} className="h-full w-full object-contain" />
                  </div>
                  <div className={`flex items-center gap-3 border-t ${acc.border} p-4 ${acc.bg}`}>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold uppercase tracking-wider ${acc.text}`}>{c.emoji} {c.label}</p>
                      <p className="text-[11px] text-[#565061] mt-0.5">{c.subtext}</p>
                    </div>
                    <button type="button"
                      onClick={async () => {
                        const res = await fetch(buildUrl(reportId, c!.kind));
                        if (!res.ok) return;
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a"); a.href = url; a.download = `firechess-${c!.kind}.png`;
                        document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
                      }}
                      className="shrink-0 rounded-lg border border-[#1e1a24] bg-[#ff5a1f]/[0.05] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1e1a24] transition-colors">Download PNG</button>
                    <a href={tweetUrl} target="_blank" rel="noopener noreferrer"
                      className="shrink-0 rounded-lg border border-orange-500/25 bg-orange-500/[0.08] px-4 py-2 text-xs font-semibold text-orange-200 hover:bg-orange-500/[0.14] transition-colors">Post</a>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Cards grid — 3 columns, larger */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const acc = ACCENT[c.accent] ?? ACCENT.orange;
          return (
            <div key={c.kind}
              className={`group relative flex flex-col overflow-hidden rounded-2xl border ${acc.border} bg-gradient-to-br ${acc.gradient} transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl ${acc.glow}`}>
              <button type="button" onClick={() => setPreview(c.kind)}
                className="relative block aspect-[3/2] w-full overflow-hidden" aria-label={`Preview ${c.label}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={buildUrl(reportId, c.kind)} alt={c.label} loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8d8696] mb-1">{c.subtext}</p>
                  <p className={`text-sm font-black uppercase tracking-wider ${acc.text}`}>{c.emoji} {c.label}</p>
                  <p className="truncate text-base font-bold text-white mt-1">{c.desc}</p>
                </div>
              </button>
              <div className="flex items-center gap-2 border-t border-[#1e1a24] p-3">
                <button type="button" onClick={() => setPreview(c.kind)}
                  className="flex-1 rounded-lg border border-[#1e1a24] bg-[#ff5a1f]/[0.04] px-3 py-2.5 text-xs font-semibold text-[#f0edf2] hover:bg-[#1e1a24] hover:text-white transition-all">View</button>
                <button type="button" onClick={() => {
                  fetch(buildUrl(reportId, c.kind)).then(async (r) => {
                    if (!r.ok) return;
                    const blob = await r.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a"); a.href = url; a.download = `firechess-${c.kind}.png`;
                    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
                  });
                }}
                  className="flex-1 rounded-lg border border-[#1e1a24] bg-[#ff5a1f]/[0.02] px-3 py-2.5 text-xs font-semibold text-[#565061] hover:text-white hover:bg-[#ff5a1f]/[0.05] transition-all">Download</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Embed code */}
      <div className="mt-6 rounded-xl border border-[#1e1a24] bg-[#ff5a1f]/[0.03] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#565061] mb-2">Embed on your site</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-lg border border-[#1e1a24] bg-black/30 px-3 py-2 text-[11px] font-mono text-[#8d8696] break-all select-all">
            {`<iframe src="https://firechess.com/embed/report/${reportId}" width="400" height="380" frameborder="0" loading="lazy"></iframe>`}
          </code>
          <button type="button" onClick={async () => {
            const code = `<iframe src="https://firechess.com/embed/report/${reportId}" width="400" height="380" frameborder="0" loading="lazy"></iframe>`;
            try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
          }}
            className="shrink-0 rounded-lg border border-[#1e1a24] bg-[#ff5a1f]/[0.05] px-3 py-2 text-[11px] font-semibold text-[#f0edf2] hover:bg-[#1e1a24] transition-colors">
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
    </section>
  );
}
