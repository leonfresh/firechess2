import { Chess } from "chess.js";
import type { LocalEngineLine } from "./stockfish-client";

/**
 * Shared engine-line helpers for the training boards.
 * (Mirrors the logic in positional-motif-trainer.tsx so drill boards can
 * explain "why this move works" with a clickable continuation.)
 */

/** Convert a UCI principal variation into SAN moves (stops at the first illegal ply). */
export function pvToSan(fen: string, pv: string[]): string[] {
  const san: string[] = [];
  const chess = new Chess(fen);
  for (const uci of pv) {
    const move = chess.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: (uci[4] || undefined) as "q" | "r" | "b" | "n" | undefined,
    });
    if (!move) break;
    san.push(move.san);
  }
  return san;
}

/** Format an engine eval as "+1.2" / "−0.4" / "M3". */
export function formatEval(line: LocalEngineLine): string {
  if (line.mateIn != null) return `M${Math.abs(line.mateIn)}`;
  const cp = line.cp / 100;
  return `${cp > 0 ? "+" : cp < 0 ? "−" : ""}${Math.abs(cp).toFixed(1)}`;
}

/** Apply the first `count` UCI plies to a FEN and return the resulting FEN. */
export function applyPv(fen: string, pv: string[], count: number): string {
  const chess = new Chess(fen);
  for (const uci of pv.slice(0, count)) {
    const move = chess.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: (uci[4] || undefined) as "q" | "r" | "b" | "n" | undefined,
    });
    if (!move) break;
  }
  return chess.fen();
}
