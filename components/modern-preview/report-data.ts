import { Chess } from "chess.js";
import type { AnalyzeResponse } from "@/lib/types";
import type { ComputedScanReport, ScanSessionConfig } from "@/lib/scan-session";
import type { PatternCategory, PreviewPattern } from "./sample-data";

export type PreviewScan = { id: string; chessUsername: string; source: string; config: ScanSessionConfig; result: AnalyzeResponse | null; reportMeta: ComputedScanReport | null };
export const CATEGORIES: PatternCategory[] = ["Openings", "Tactics", "Endgames", "Brilliants", "Clock", "Positional"];
export const FREE_FINDING_LIMITS: Record<PatternCategory, number> = { Openings: 3, Tactics: 3, Endgames: 3, Brilliants: 1, Clock: 1, Positional: 1 };
export const FREE_SCAN_GAMES = 50;

export function findingsByCategory(result: AnalyzeResponse) {
  return { Openings: [...result.leaks, ...result.oneOffMistakes], Tactics: result.missedTactics, Endgames: result.endgameMistakes, Brilliants: result.brilliantMoves ?? [], Clock: result.timeManagement?.moments ?? [], Positional: result.positionalFindings ?? [] };
}

export function buildReportPositions(result: AnalyzeResponse, hasProAccess: boolean): PreviewPattern[] {
  const output: PreviewPattern[] = [];
  const groups = findingsByCategory(result);
  for (const category of CATEGORIES) {
    const rows = hasProAccess ? groups[category] : groups[category].slice(0, FREE_FINDING_LIMITS[category]);
    rows.forEach((row, index) => {
      const fen = "fenBefore" in row ? row.fenBefore : row.fen;
      if (!row.bestMove) return;
      try {
        const parse = (move: string) => new Chess(fen).move(/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move) ? { from: move.slice(0, 2), to: move.slice(2, 4), promotion: move[4] } : move);
        const played = parse(row.userMove);
        const best = parse(row.bestMove);
        const tags = "tags" in row ? row.tags ?? [] : [];
        const loss = row.cpLoss;
        const impact = loss == null ? "Evaluation unavailable" : loss >= 10000 ? "Forced-mate swing" : `${(loss / 100).toFixed(2)} pawn evaluation loss`;
        const recurring = "reachCount" in row && row.reachCount > 1;
        const title = "openingName" in row && row.openingName ? row.openingName : "endgameType" in row ? `${row.endgameType} endgame` : category === "Brilliants" ? `${"classificationVersion" in row && row.classificationVersion === 2 ? "Brilliant" : "Legacy highlight"} ${played.san}` : "verdict" in row ? row.verdict.replaceAll("_", " ") : tags.includes("Missed Mate") ? `Missed mate${"mateIn" in row && row.mateIn ? ` in ${row.mateIn}` : ""}` : tags[0] ?? "Position to review";
        const details = ["gameIndex" in row ? `Game ${row.gameIndex} · Move ${row.moveNumber}` : null, "reachCount" in row ? `Reached ${row.reachCount} times · Played ${row.moveCount} times` : null, "timeSpentSec" in row ? `${row.timeSpentSec.toFixed(1)}s spent · ${row.timeRemainingSec.toFixed(1)}s remaining` : null, category === "Brilliants" ? "Engine-highlighted move" : impact].filter(Boolean).join(" · ");
        const gameUrl = ("gameUrl" in row ? row.gameUrl : undefined) ?? ("gameIndex" in row ? result.games?.[row.gameIndex - 1]?.gameUrl : undefined);
        const reason = "reason" in row ? row.reason : `The report records ${played.san}; the engine prefers ${best.san}. ${impact}.${tags.length ? ` Themes: ${tags.join(", ")}.` : ""}`;
        output.push({ id: `${category}-${index}`, category, title, opening: title, fen, played: played.san, best: best.san, from: best.from, to: best.to, promotion: best.promotion, context: details, explanation: reason, habit: category === "Brilliants" ? "Replay the continuation and identify what made this move work, so you can recognize the idea again." : "Compare the played move with the engine choice. Look at checks, captures and threats before committing to your move.", hint: `Look for a move by your ${({ p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" })[best.piece]}.`, severity: recurring ? "Recurring pattern" : category === "Openings" ? "One-off mistake" : category === "Brilliants" ? ("classificationVersion" in row && row.classificationVersion === 2 ? "Sound sacrifice" : "Needs revalidation") : impact, gameUrl: gameUrl && /^https:\/\/(?:www\.)?(?:chess\.com|lichess\.org)\//.test(gameUrl) ? gameUrl : undefined, tags });
      } catch {
        // Older scans may contain unplayable positions; retain their aggregate
        // counts, but never mount a broken board or invent an engine answer.
      }
    });
  }
  return output;
}
