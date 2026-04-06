"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "@/components/chessboard-compat";
import { useBoardTheme, useCustomPieces } from "@/lib/use-coins";

function parseSanMoves(raw: string): string[] {
  return raw
    .replace(/\d+\./g, "")
    .replace(/\.\.\./g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function OpeningSlugClient({ moves: rawMoves }: { moves: string }) {
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();

  const sans = useMemo(() => parseSanMoves(rawMoves), [rawMoves]);

  const fens = useMemo(() => {
    const g = new Chess();
    const arr = [g.fen()];
    for (const san of sans) {
      try {
        g.move(san);
        arr.push(g.fen());
      } catch {
        break;
      }
    }
    return arr;
  }, [sans]);

  const maxIndex = fens.length - 1;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setIndex(0);
    setPlaying(false);
  }, [rawMoves]);

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setIndex((prev) => {
          if (prev >= maxIndex) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 900);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, maxIndex]);

  const goBack = useCallback(() => {
    setPlaying(false);
    setIndex((p) => Math.max(0, p - 1));
  }, []);
  const goForward = useCallback(() => {
    setPlaying(false);
    setIndex((p) => Math.min(maxIndex, p));
  }, [maxIndex]);
  const reset = useCallback(() => {
    setPlaying(false);
    setIndex(0);
  }, []);
  const togglePlay = useCallback(() => {
    setPlaying((p) => {
      if (!p) setIndex((i) => (i >= maxIndex ? 0 : i));
      return !p;
    });
  }, [maxIndex]);

  const moveLabel = useMemo(() => {
    if (index === 0) return "Starting position";
    const moveNum = Math.ceil(index / 2);
    const isBlack = index % 2 === 0;
    return `${moveNum}${isBlack ? "..." : "."} ${sans[index - 1]}`;
  }, [index, sans]);

  return (
    <div className="glass-card flex flex-col items-center gap-3 p-4">
      <Chessboard
        position={fens[index]}
        boardWidth={280}
        arePiecesDraggable={false}
        customBoardStyle={{ borderRadius: "8px", overflow: "hidden" }}
        customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
        customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
        customPieces={customPieces}
      />
      <p className="text-xs text-stone-400">{moveLabel}</p>
      <div className="flex items-center gap-1.5">
        {[
          { label: "⏮", action: reset, title: "Reset" },
          { label: "◀", action: goBack, title: "Back" },
          {
            label: playing ? "⏸" : "▶",
            action: togglePlay,
            title: playing ? "Pause" : "Play",
          },
          { label: "▶", action: goForward, title: "Forward" },
        ].map(({ label, action, title }) => (
          <button
            key={title}
            type="button"
            title={title}
            onClick={action}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-sm text-stone-300 transition-colors hover:border-white/[0.15] hover:text-white"
          >
            {label}
          </button>
        ))}
      </div>
      <p className="text-center text-[11px] text-stone-600">
        {index} / {maxIndex} moves
      </p>
    </div>
  );
}

export function OpeningEmbedButton({
  slug,
  name,
}: {
  slug: string;
  name: string;
}) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const iframeCode = `<iframe
  src="https://firechess.com/embed/opening/${slug}"
  width="400"
  height="500"
  frameborder="0"
  loading="lazy"
  title="${name} Opening Guide"
></iframe>`;

  function copy() {
    navigator.clipboard.writeText(iframeCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-xs font-medium text-stone-400 transition-colors hover:border-white/[0.15] hover:text-white"
      >
        {"</>"} Embed
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-1 text-base font-bold text-white">
              Embed {name} Widget
            </h3>
            <p className="mb-4 text-xs text-slate-400">
              Paste this snippet into your blog or website to embed a live
              opening guide card.
            </p>
            <pre className="mb-4 overflow-x-auto rounded-xl bg-black/40 p-3 text-[11px] font-mono text-slate-300 whitespace-pre-wrap break-all">
              {iframeCode}
            </pre>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copy}
                className="flex-1 rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-400 transition-colors"
              >
                {copied ? "✅ Copied!" : "Copy Code"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
