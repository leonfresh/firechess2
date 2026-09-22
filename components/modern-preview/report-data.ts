import { coachingTheme } from "../../lib/report-coaching";
import { Chess } from "chess.js";
import type { AnalyzeResponse } from "@/lib/types";
import type { ComputedScanReport, ScanSessionConfig } from "@/lib/scan-session";
import type { PatternCategory, PreviewPattern } from "./sample-data";

export type PreviewScan = { id: string; chessUsername: string; source: string; config: ScanSessionConfig; result: AnalyzeResponse | null; reportMeta: ComputedScanReport | null };
export const CATEGORIES: PatternCategory[] = ["Openings", "Tactics", "Endgames", "Brilliants", "Clock", "Positional"];
export const FREE_FINDING_LIMITS: Record<PatternCategory, number> = { Openings: 6, Tactics: 6, Endgames: 6, Brilliants: 6, Clock: 6, Positional: 6 };
export const FREE_SCAN_GAMES = 50;

export function findingsByCategory(result: AnalyzeResponse) {
  return { Openings: [...result.leaks, ...result.oneOffMistakes], Tactics: result.missedTactics, Endgames: result.endgameMistakes, Brilliants: result.brilliantMoves ?? [], Clock: result.timeManagement?.moments ?? [], Positional: result.positionalFindings ?? [] };
}

export function buildReportPositions(result: AnalyzeResponse, hasProAccess: boolean): PreviewPattern[] {
  const output: PreviewPattern[] = [];
  const groups = findingsByCategory(result);
  const previousMoves = indexPreviousMoves(result);
  for (const category of CATEGORIES) {
    const rows = groups[category];
    let availableCount = 0;
    rows.forEach((row, index) => {
      if (!hasProAccess && availableCount >= FREE_FINDING_LIMITS[category]) return;
      const fen = "fenBefore" in row ? row.fenBefore : row.fen;
      if (!row.bestMove) return;
      try {
        const parse = (move: string) => new Chess(fen).move(/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move) ? { from: move.slice(0, 2), to: move.slice(2, 4), promotion: move[4] } : move);
        const played = parse(row.userMove);
        const best = parse(row.bestMove);
        const tags = "tags" in row ? row.tags ?? [] : [];
        const loss = row.cpLoss;
        const impact = loss == null ? "Evaluation unavailable" : loss >= 10000 ? "Forced-mate swing" : `${(loss / 100).toFixed(2)} pawn evaluation loss`;
        const sideline = "dbApproved" in row && row.dbApproved ? { approved: true, score: row.dbWinRate, games: row.dbGames } : undefined;
        const recurring = "reachCount" in row && row.reachCount > 1;
        const title = category === "Positional" ? coachingTheme({ category, tags }) : "openingName" in row && row.openingName ? row.openingName : "endgameType" in row ? `${row.endgameType} endgame` : category === "Brilliants" ? `${"classificationVersion" in row && row.classificationVersion === 2 ? "Brilliant" : "Legacy highlight"} ${played.san}` : "verdict" in row ? row.verdict.replaceAll("_", " ") : tags.includes("Missed Mate") ? `Missed mate${"mateIn" in row && row.mateIn ? ` in ${row.mateIn}` : ""}` : tags[0] ?? "Position to review";
        const details = ["gameIndex" in row ? `Game ${row.gameIndex} · Move ${row.moveNumber}` : null, "reachCount" in row ? `Reached ${row.reachCount} times · Played ${row.moveCount} times` : null, "timeSpentSec" in row ? `${row.timeSpentSec.toFixed(1)}s spent · ${row.timeRemainingSec.toFixed(1)}s remaining` : null, category === "Brilliants" ? "Engine-highlighted move" : impact].filter(Boolean).join(" · ");
        const gameUrl = ("gameUrl" in row ? row.gameUrl : undefined) ?? ("gameIndex" in row ? result.games?.[row.gameIndex - 1]?.gameUrl : undefined);
        const reason = "reason" in row ? row.reason : `The report records ${played.san}; the engine prefers ${best.san}. ${impact}.${tags.length ? ` Themes: ${tags.join(", ")}.` : ""}`;
        const lastMove = previousMoves.get(`${gameUrl ?? ""}|${positionKey(fen)}`) ?? undefined;
        output.push({ lastMove, id: `${category}-${index}`, category, title, cpLoss: loss, sideline, opening: title, fen, played: played.san, best: best.san, from: best.from, to: best.to, promotion: best.promotion, context: details, explanation: reason, habit: category === "Brilliants" ? "Replay the continuation and identify what made this move work, so you can recognize the idea again." : "Compare the played move with the engine choice. Look at checks, captures and threats before committing to your move.", hint: `Look for a move by your ${({ p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" })[best.piece]}.`, severity: sideline ? "Offbeat sideline" : recurring ? "Recurring pattern" : category === "Openings" ? "One-off mistake" : category === "Brilliants" ? ("classificationVersion" in row && row.classificationVersion === 2 ? "Sound sacrifice" : "Needs revalidation") : impact, gameUrl: gameUrl && /^https:\/\/(?:www\.)?(?:chess\.com|lichess\.org)\//.test(gameUrl) ? gameUrl : undefined, tags });
        availableCount++;
      } catch {
        // Older scans may contain unplayable positions; retain their aggregate
        // counts, but never mount a broken board or invent an engine answer.
      }
    });
  }
  return output;
}

function positionKey(fen: string) { return fen.split(" ").slice(0, 4).join(" "); }

/** Recover the move that led to the puzzle, never infer it from a FEN alone. */
export function indexPreviousMoves(result: AnalyzeResponse) {
  type LastMove = NonNullable<PreviewPattern["lastMove"]>;
  const moves = new Map<string, LastMove | null>();
  const wanted = new Set(Object.values(findingsByCategory(result)).flat().map(row => positionKey("fenBefore" in row ? row.fenBefore : row.fen)));
  function add(key: string, move: LastMove) {
    if (!moves.has(key)) moves.set(key, move);
    else { const previous = moves.get(key); if (previous && (previous.from !== move.from || previous.to !== move.to)) moves.set(key, null); }
  }
  for (const game of result.games ?? []) {
    try {
      const chess = new Chess();
      chess.loadPgn(game.moves);
      for (const move of chess.history({ verbose: true })) {
        const key = positionKey(move.after);
        if (!wanted.has(key)) continue;
        const lastMove = { from: move.from, to: move.to, san: move.san };
        if (game.gameUrl) add(`${game.gameUrl}|${key}`, lastMove);
        add(`|${key}`, lastMove);
      }
    } catch { /* Older scans may omit a complete legal game; don't invent a last move. */ }
  }
  return moves;
}
