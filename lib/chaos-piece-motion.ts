import { Chess, type Square } from "chess.js";
export type PieceTravel = { from: string; to: string; code: string; hop: boolean; dropped?: boolean };
export type PieceMotion = { moves: PieceTravel[]; victims: { square: string; code: string }[] };
/** Animate only one forward ply; never infer travel across a reset or replay seek. */
export function pieceMotion(before: string, after: string): PieceMotion | null {
  try {
    const old = new Chess(before), next = new Chess(after);
    const a = before.split(" "), b = after.split(" ");
    if (old.turn() === next.turn() || Number(b[5]) !== Number(a[5]) + (old.turn() === "b" ? 1 : 0)) return null;
    const changed = (p: NonNullable<ReturnType<Chess["get"]>> & {square: Square}, board: Chess) => { const q = board.get(p.square); return !q || q.type !== p.type || q.color !== p.color; };
    const removed = old.board().flat().filter(p => p && changed(p, next)).filter(p => p !== null);
    const added = next.board().flat().filter(p => p && changed(p, old)).filter(p => p !== null);
    const movers = removed.filter(p => p.color === old.turn());
    const arrivals = added.filter(p => p.color === old.turn());
    if (added.some(p => p.color !== old.turn()) || movers.length > 2) return null;
    const moves: PieceTravel[] = [];
    for (const arrival of arrivals) {
      const candidates = movers.filter(p => p.type === arrival.type || (p.type === "p" && ["1", "8", "3", "6"].includes(arrival.square[1])));
      if (candidates.length !== 1) return null;
      const mover = candidates[0];
      const dx = Math.abs(mover.square.charCodeAt(0) - arrival.square.charCodeAt(0));
      const dy = Math.abs(Number(mover.square[1]) - Number(arrival.square[1]));
      moves.push({ from: mover.square, to: arrival.square, code: mover.color + mover.type.toUpperCase(), hop: mover.type === "n" || (dx * dy === 2) });
    }
    // The only standard two-piece move is castling; skip ambiguous swaps/army moves.
    if (moves.length === 2 && !movers.some(p => p.type === "k") || arrivals.length > 2) return null;
    const victims = removed.filter(p => p.color !== old.turn()).map(p => ({ square: p.square, code: p.color + p.type.toUpperCase() }));
    return moves.length || victims.length ? { moves, victims: victims.slice(0, 8) } : null;
  } catch { return null; }
}
