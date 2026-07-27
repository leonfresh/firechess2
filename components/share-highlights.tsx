"use client";

import { useMemo, useState } from "react";
import { Chess } from "chess.js";
import type { PieceSymbol } from "chess.js";
import type { AnalyzeResponse } from "@/lib/types";
import type { ComputedScanReport } from "@/lib/scan-session";

/** UCI → SAN for the little preview subtitle under each card. */
function uciToSan(fen: string, uci: string): string {
  try {
    const chess = new Chess(fen);
    const mv = chess.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: (uci.slice(4, 5) || undefined) as PieceSymbol | undefined,
    });
    return mv?.san ?? uci;
  } catch {
    return uci;
  }
}

type ShareKind = "brilliant" | "tactic" | "mental" | "vibe";

interface ShareHighlightsProps {
  reportId: string;
  result: AnalyzeResponse | null;
  reportMeta: ComputedScanReport | null;
}

interface CardDef {
  kind: ShareKind;
  emoji: string;
  label: string;
  desc: string;
  accent: string; // tailwind-ish ring / text color class hints
}

function buildUrl(reportId: string, kind: ShareKind) {
  return `/api/report/share-card?id=${encodeURIComponent(reportId)}&type=${kind}`;
}

export function ShareHighlights({ reportId, result, reportMeta }: ShareHighlightsProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [preview, setPreview] = useState<ShareKind | null>(null);

  const cards = useMemo<CardDef[]>(() => {
    const list: CardDef[] = [];
    if (result?.brilliantMoves && result.brilliantMoves.length > 0) {
      list.push({
        kind: "brilliant",
        emoji: "\u{1F48E}",
        label: "Brilliant Move",
        desc: uciToSan(result.brilliantMoves[0].fenBefore, result.brilliantMoves[0].userMove),
        accent: "cyan",
      });
    }
    if (result?.missedTactics && result.missedTactics.length > 0) {
      const biggest = result.missedTactics.reduce((a, b) => (b.cpLoss > a.cpLoss ? b : a));
      list.push({
        kind: "tactic",
        emoji: "\u{1F3AF}",
        label: "Missed Tactic",
        desc: uciToSan(biggest.fenBefore, biggest.bestMove),
        accent: "red",
      });
    }
    if (result?.mentalStats) {
      list.push({
        kind: "mental",
        emoji: "\u{1F9E0}",
        label: "Mental Archetype",
        desc: result.mentalStats.archetype ?? "Your mindset",
        accent: "purple",
      });
    }
    if (reportMeta?.vibeTitle) {
      list.push({
        kind: "vibe",
        emoji: "\u{1F525}",
        label: "Playing Style",
        desc: reportMeta.vibeTitle,
        accent: "orange",
      });
    }
    return list;
  }, [result, reportMeta]);

  if (cards.length === 0) return null;

  const accentClasses: Record<string, { ring: string; text: string; glow: string }> = {
    cyan: {
      ring: "hover:border-cyan-400/40",
      text: "text-cyan-300",
      glow: "bg-cyan-500/[0.07]",
    },
    red: {
      ring: "hover:border-red-400/40",
      text: "text-red-300",
      glow: "bg-red-500/[0.07]",
    },
    purple: {
      ring: "hover:border-purple-400/40",
      text: "text-purple-300",
      glow: "bg-purple-500/[0.07]",
    },
    orange: {
      ring: "hover:border-orange-400/40",
      text: "text-orange-300",
      glow: "bg-orange-500/[0.07]",
    },
  };

  async function handleDownload(kind: ShareKind) {
    setDownloading(kind);
    try {
      const res = await fetch(buildUrl(reportId, kind));
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `firechess-${kind}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(null);
    }
  }

  async function handleCopy(kind: ShareKind) {
    try {
      const shareUrl = `https://firechess.com/report/${reportId}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      // ignore
    }
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Share your highlights</h2>
          <p className="text-sm text-slate-500">
            Download a card, or share the report — it generates its own preview.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const acc = accentClasses[c.accent] ?? accentClasses.orange;
          const isPreview = preview === c.kind;
          return (
            <div
              key={c.kind}
              className={`group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] transition-all duration-200 ${acc.ring}`}
            >
              {/* thumbnail preview */}
              <button
                type="button"
                onClick={() => setPreview(isPreview ? null : c.kind)}
                className="relative block aspect-square w-full overflow-hidden"
                aria-label={`Preview ${c.label} card`}
              >
                <div className={`absolute inset-0 ${acc.glow}`} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={buildUrl(reportId, c.kind)}
                  alt={`${c.label} share card`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent p-3">
                  <p className={`text-xs font-bold uppercase tracking-wider ${acc.text}`}>
                    {c.emoji} {c.label}
                  </p>
                  <p className="truncate text-sm font-semibold text-white">{c.desc}</p>
                </div>
              </button>

              {/* actions */}
              <div className="flex items-center gap-2 border-t border-white/[0.06] p-2.5">
                <button
                  type="button"
                  onClick={() => handleDownload(c.kind)}
                  disabled={downloading === c.kind}
                  className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-[11px] font-semibold text-slate-300 transition hover:border-white/[0.16] hover:text-white disabled:opacity-50"
                >
                  {downloading === c.kind ? "..." : "Download"}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(c.kind)}
                  className="flex-1 rounded-lg border border-orange-500/25 bg-orange-500/[0.08] px-2 py-1.5 text-[11px] font-semibold text-orange-200 transition hover:border-orange-400/40 hover:text-white"
                >
                  {copied === c.kind ? "Copied!" : "Copy link"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
