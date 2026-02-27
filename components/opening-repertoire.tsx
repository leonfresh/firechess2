"use client";

/**
 * Opening Repertoire — lets users save "correct" moves from their leaks
 * and review them in a repertoire panel on the dashboard.
 *
 * Storage: localStorage key "fc-repertoire"
 * Format: RepertoireEntry[]
 */

import { useMemo, useState, useCallback, useEffect } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { useBoardSize } from "@/lib/use-board-size";
import { earnCoins } from "@/lib/coins";
import { useBoardTheme, useShowCoordinates } from "@/lib/use-coins";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export type RepertoireEntry = {
  /** Position FEN before the move */
  fen: string;
  /** The correct (best) move in UCI */
  correctMove: string;
  /** SAN for display */
  correctMoveSan: string;
  /** The user's incorrect move in UCI */
  userMove: string;
  /** User's move SAN */
  userMoveSan: string;
  /** Opening tags if any */
  tags: string[];
  /** Side to move */
  sideToMove: "white" | "black";
  /** User's colour */
  userColor: "white" | "black";
  /** CP loss of the user's move */
  cpLoss: number;
  /** When this was saved */
  savedAt: string;
};

const STORAGE_KEY = "fc-repertoire";

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

export function getRepertoire(): RepertoireEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addToRepertoire(entry: RepertoireEntry): boolean {
  const current = getRepertoire();
  // Dedup by FEN
  if (current.some((e) => e.fen === entry.fen)) return false;
  current.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  return true;
}

export function removeFromRepertoire(fen: string): void {
  const current = getRepertoire().filter((e) => e.fen !== fen);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export function isInRepertoire(fen: string): boolean {
  return getRepertoire().some((e) => e.fen === fen);
}

function toSan(fen: string, uci: string): string {
  try {
    const chess = new Chess(fen);
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promo = uci.slice(4, 5) || undefined;
    const result = chess.move({ from, to, promotion: promo as any });
    return result?.san ?? uci;
  } catch {
    return uci;
  }
}

/* ------------------------------------------------------------------ */
/*  Save Button (embeds in MistakeCard)                                 */
/* ------------------------------------------------------------------ */

type SaveToRepertoireProps = {
  fen: string;
  correctMove: string;
  userMove: string;
  tags: string[];
  sideToMove: "white" | "black";
  userColor: "white" | "black";
  cpLoss: number;
};

export function SaveToRepertoireButton({
  fen,
  correctMove,
  userMove,
  tags,
  sideToMove,
  userColor,
  cpLoss,
}: SaveToRepertoireProps) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isInRepertoire(fen));
  }, [fen]);

  const handleSave = useCallback(() => {
    if (saved) {
      removeFromRepertoire(fen);
      setSaved(false);
      return;
    }

    const entry: RepertoireEntry = {
      fen,
      correctMove,
      correctMoveSan: toSan(fen, correctMove),
      userMove,
      userMoveSan: toSan(fen, userMove),
      tags,
      sideToMove,
      userColor,
      cpLoss,
      savedAt: new Date().toISOString(),
    };
    const added = addToRepertoire(entry);
    setSaved(true);
    if (added) {
      try { earnCoins("repertoire_save"); } catch {}
    }
  }, [fen, correctMove, userMove, tags, sideToMove, userColor, cpLoss, saved]);

  return (
    <button
      onClick={handleSave}
      title={saved ? "Remove from repertoire" : "Save correct move to repertoire"}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
        saved
          ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
          : "bg-white/[0.04] text-white/40 hover:bg-white/[0.08] hover:text-white/60"
      }`}
    >
      {saved ? (
        <>
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
              clipRule="evenodd"
            />
          </svg>
          In Repertoire
        </>
      ) : (
        <>
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          Add to Repertoire
        </>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Repertoire Panel (dashboard widget)                                 */
/* ------------------------------------------------------------------ */

export function RepertoirePanel() {
  const [entries, setEntries] = useState<RepertoireEntry[]>([]);
  const [expandedFen, setExpandedFen] = useState<string | null>(null);

  useEffect(() => {
    setEntries(getRepertoire());
  }, []);

  const handleRemove = useCallback((fen: string) => {
    removeFromRepertoire(fen);
    setEntries(getRepertoire());
  }, []);

  if (entries.length === 0) {
    return (
      <div className="glass-card space-y-3 p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-xl">
            📖
          </span>
          <div>
            <h2 className="text-lg font-semibold text-white">Opening Repertoire</h2>
            <p className="text-xs text-white/40">
              Save correct moves from your leak cards to build your repertoire
            </p>
          </div>
        </div>
        <div className="flex h-24 items-center justify-center">
          <p className="text-sm text-white/30">
            No moves saved yet. Click &quot;Add to Repertoire&quot; on any opening leak card.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-xl">
            📖
          </span>
          <div>
            <h2 className="text-lg font-semibold text-white">Opening Repertoire</h2>
            <p className="text-xs text-white/40">
              {entries.length} position{entries.length !== 1 ? "s" : ""} saved
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {entries.map((entry) => (
          <RepertoireRow
            key={entry.fen}
            entry={entry}
            expanded={expandedFen === entry.fen}
            onToggle={() =>
              setExpandedFen(expandedFen === entry.fen ? null : entry.fen)
            }
            onRemove={() => handleRemove(entry.fen)}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Single repertoire row                                               */
/* ------------------------------------------------------------------ */

function RepertoireRow({
  entry,
  expanded,
  onToggle,
  onRemove,
}: {
  entry: RepertoireEntry;
  expanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const { ref: boardRef, size: boardSize } = useBoardSize(200);
  const boardTheme = useBoardTheme();
  const showCoords = useShowCoordinates();

  const openingName = entry.tags.find(
    (t) =>
      !t.includes("Inaccuracy") &&
      !t.includes("Mistake") &&
      !t.includes("Blunder") &&
      !t.includes("Repeated")
  );

  return (
    <div className="overflow-hidden rounded-xl border border-white/5 bg-white/[0.02]">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-white/[0.02]"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-xs font-bold text-white/50">
          {entry.userColor === "white" ? "♔" : "♚"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-white">
              {openingName ?? "Position"}
            </span>
            <span className="text-[10px] text-white/30">
              Play{" "}
              <span className="font-mono font-bold text-emerald-400">
                {entry.correctMoveSan}
              </span>{" "}
              not{" "}
              <span className="font-mono text-red-400">{entry.userMoveSan}</span>
            </span>
          </div>
          <div className="flex gap-1.5 mt-0.5">
            {entry.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-white/30"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <svg
          className={`h-4 w-4 flex-shrink-0 text-white/20 transition-transform ${expanded ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-white/5 p-4">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div ref={boardRef} className="w-full max-w-[200px] flex-shrink-0">
              <Chessboard
                position={entry.fen}
                boardWidth={Math.min(boardSize, 200)}
                boardOrientation={entry.userColor}
                arePiecesDraggable={false}
                customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
                customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
                showBoardNotation={showCoords}
              />
            </div>

            <div className="flex flex-1 flex-col gap-2">
              <div className="rounded-lg bg-emerald-500/10 p-3">
                <p className="text-xs font-medium text-emerald-400">
                  Correct: {entry.correctMoveSan}
                </p>
                <p className="text-[10px] text-white/30">
                  Instead of {entry.userMoveSan} (−{(entry.cpLoss / 100).toFixed(2)} eval)
                </p>
              </div>
              <p className="text-[10px] text-white/25">
                Saved{" "}
                {new Date(entry.savedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <button
                onClick={onRemove}
                className="mt-1 self-start rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[10px] font-medium text-red-400 transition-colors hover:bg-red-500/20"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
