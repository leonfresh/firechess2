import { Chess } from "chess.js";
/** A mutual kill removes exactly the victim and attacker, and adds no piece. */
export function kamikazeImpact(before: string, after: string, armed: {w:boolean;b:boolean}) {
  if (before === after || (!armed.w && !armed.b)) return null;
  let old: Chess, next: Chess;
  try { old = new Chess(before); next = new Chess(after); } catch { return null; }
  const removed = old.board().flat().filter(p => p && (!next.get(p.square) || next.get(p.square)?.type !== p.type || next.get(p.square)?.color !== p.color));
  const added = next.board().flat().some(p => p && (!old.get(p.square) || old.get(p.square)?.type !== p.type || old.get(p.square)?.color !== p.color));
  if (added || removed.length !== 2) return null;
  const victim = removed.find(p => p?.type === "b" && armed[p.color]);
  const attacker = removed.find(p => p && p.color !== victim?.color);
  if (!victim || !attacker) return null;
  // Both bishops can be armed: the side whose turn just ended is the attacker.
  const target = removed.find(p => p?.type === "b" && armed[p.color] && p.color !== old.turn());
  const mover = removed.find(p => p?.color === old.turn());
  if (!target || !mover) return null;
  return {square:target.square, pieces:[`${target.color}B`, `${mover.color}${mover.type.toUpperCase()}`]};
}
