import { Chess, type Color, type Square } from "chess.js";
import { getPatternQuote, POSITIONAL_PATTERNS } from "./positional-quotes";
import type { PreviewPattern } from "../components/modern-preview/sample-data";

const PIECES = { p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" };
export type PieceDanger = { square: Square; piece: string; attackers: Square[]; defenders: Square[]; level: "red" | "yellow" | "green" };

/** Geometric attacks, not a static exchange evaluation: pinned pieces still count. */
export function getPieceDanger(fen: string, player: Color): PieceDanger[] {
  const board = new Chess(fen);
  return board.board().flatMap(rank => rank.flatMap(piece => {
    if (!piece || piece.color !== player) return [];
    const attackers = board.attackers(piece.square, player === "w" ? "b" : "w");
    const defenders = board.attackers(piece.square, player);
    const level = !attackers.length ? "green" : piece.type === "k" || attackers.length > defenders.length ? "red" : "yellow";
    return [{ square: piece.square, piece: PIECES[piece.type], attackers, defenders, level } satisfies PieceDanger];
  }));
}

export function coachingThemes(pattern: Pick<PreviewPattern, "tags" | "category">): string[] {
  const tags = pattern.tags ?? [];
  // Phase and severity tags are metadata, not positional lessons.
  const positional = tags.filter(t => t !== "Inaccuracy" && POSITIONAL_PATTERNS.some(p => p.tag === t));
  const normalize = (tag: string) => /hanging|undefended/i.test(tag) ? "Hanging pieces" : /released tension|unnecessary capture|premature trade/i.test(tag) ? "Released Tension" : tag;
  if (pattern.category === "Positional" && positional.length) return [...new Set(positional.map(normalize))];
  const themes = positional.map(normalize);
  if (tags.some(t => /hanging|undefended/i.test(t))) themes.unshift("Hanging pieces");
  if (tags.some(t => /missed mate/i.test(t))) themes.unshift("Spot the checkmate");
  if (themes.length) return [...new Set(themes)];
  const concrete = tags.filter(t => !/blunder|mistake|inaccuracy|opening|endgame|middlegame|tactic|miss$|repeated habit|time pressure/i.test(t));
  return concrete.length ? [...new Set(concrete)] : [({ Tactics: "Checks, captures & threats", Openings: "Develop with a plan", Endgames: "Finish the game", Clock: "Pause before you move", Brilliants: "Find what worked", Positional: "Improve your pieces" })[pattern.category]];
}

export function coachingTheme(pattern: Pick<PreviewPattern, "tags" | "category">) {
  return coachingThemes(pattern)[0];
}

export function countingArrows(piece: PieceDanger | undefined): [string, string, string][] {
  if (!piece) return [];
  return [
    ...piece.attackers.map(from => [from, piece.square, "#ef4444dd"] as [string, string, string]),
    ...piece.defenders.map(from => [from, piece.square, "#facc15dd"] as [string, string, string]),
  ];
}

export function themeQuote(theme: string) {
  return getPatternQuote(theme === "Released Tension" ? "Unnecessary Capture" : theme === "King safety" ? "Neglected Castling" : theme);
}

export function themeHabit(theme: string) {
  if (theme === "Released Tension") return "Before exchanging, ask: what does their recapture improve? Keep the tension unless taking wins something or improves your position.";
  if (theme === "Hanging pieces") return "Before moving, check every attacked piece. Count attackers and defenders, then calculate the captures in order.";
  if (["King safety", "King Exposure", "Neglected Castling"].includes(theme)) return "Check your opponent's checks and captures first. Can you get your king safe before starting your own attack?";
  if (theme === "Spot the checkmate") return "List your checks. For each one, look for every king escape, capture and block.";
  if (theme === "Finish the game" || theme === "Failed Conversion") return "Activate your king and pieces. Check pawn races and your opponent’s forcing moves before simplifying a winning ending.";
  if (/capture/i.test(theme)) return "Look at every available capture. Compare piece values and work through their best recapture before you take.";
  if (theme === "Missed Check") return "List all your checks before making a quiet move. Calculate the opponent’s replies to each one.";
  if (/passive|activity|outpost/i.test(theme)) return "Find your least active piece. Can it move to a useful square where it attacks something and cannot be chased away easily?";
  if (theme === "Find what worked") return "Replay the continuation and explain why the move worked. Look for the same idea in your next game.";
  if (theme === "Pause before you move") return "Spend a little extra time when there are checks or captures. Finish your threat check before committing to a move.";
  return "Ask what your opponent can do next: checks, captures and threats. Count attackers and defenders before choosing your move.";
}

export function humanExplanation(pattern: PreviewPattern) {
  const theme = coachingTheme(pattern);
  if (pattern.category === "Brilliants") return pattern.explanation;
  const board = new Chess(pattern.fen);
  const player = board.turn();
  board.move(pattern.played);
  const danger = getPieceDanger(board.fen(), player).filter(p => p.level === "red");
  if (danger.length) {
    const piece = danger.find(p => p.piece === "king") ?? danger[0];
    return `After ${pattern.played}, your ${piece.piece} on ${piece.square} has ${piece.attackers.length} enemy attacker${piece.attackers.length === 1 ? "" : "s"} and ${piece.defenders.length} defender${piece.defenders.length === 1 ? "" : "s"}. Check that threat before following your own plan. Compare with ${pattern.best} and calculate the reply; the counts alone do not prove a piece is lost.`;
  }
  return `${themeHabit(theme)} In this position, compare ${pattern.played} with ${pattern.best}. The engine prefers ${pattern.best}; replay the continuation to see why. An evaluation drop alone does not tell us that you missed a threat.`;
}

/** Balanced, deterministic session: one position per theme before repeats. */
export function buildTrainingSession(patterns: PreviewPattern[], completed: string[], limit = 6) {
  const seen = new Set<string>();
  const ranked = [...patterns].sort((a, b) => Number(completed.includes(a.id)) - Number(completed.includes(b.id)) || Number(!["Tactics", "Positional", "Endgames"].includes(a.category)) - Number(!["Tactics", "Positional", "Endgames"].includes(b.category)) || (b.cpLoss ?? 0) - (a.cpLoss ?? 0));
  const unique = ranked.filter(p => { const key = `${p.fen}|${p.best}`; if (seen.has(key)) return false; seen.add(key); return true; });
  const themes = new Set<string>();
  const first: PreviewPattern[] = [], rest: PreviewPattern[] = [];
  for (const p of unique) { const theme = coachingTheme(p); if (themes.has(theme)) rest.push(p); else { themes.add(theme); first.push(p); } }
  return [...first, ...rest].slice(0, limit);
}
