import { Chess } from "chess.js";
import { fetchExplorerMoves } from "@/lib/lichess-explorer";
import type { PreviewPattern } from "./sample-data";

/** Same practical-opening thresholds used by the classic report. */
export function qualifiesAsSideline(cpLoss: number | null | undefined, games: number, score: number) {
  if (games < 50 || score < 0.35 || !Number.isFinite(games) || !Number.isFinite(score)) return false;
  if (games >= 50000) return true;
  if (cpLoss == null || !Number.isFinite(cpLoss)) return false;
  const dbScore = Math.min(300, Math.log10(games) * 40 * (score / 0.5));
  const bonus = games >= 5000 ? 50 : games >= 1000 ? 25 : 0;
  return cpLoss <= dbScore + bonus;
}

export async function lookupSideline(pattern: PreviewPattern): Promise<PreviewPattern["sideline"]> {
  const chess = new Chess(pattern.fen);
  const side = chess.turn() === "w" ? "white" : "black";
  const played = chess.move(pattern.played);
  const uci = played.from + played.to + (played.promotion ?? "");
  const result = await fetchExplorerMoves(pattern.fen, side);
  const move = result.moves.find(candidate => candidate.uci === uci);
  return move && qualifiesAsSideline(pattern.cpLoss, move.totalGames, move.winRate)
    ? { approved: true, games: move.totalGames, score: move.winRate }
    : undefined;
}
