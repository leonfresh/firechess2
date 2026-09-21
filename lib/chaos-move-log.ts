/**
 * The in-game move log: turn the room's move history into numbered rows.
 *
 * The room history is one entry per ply, and a game can end on a move that chess.js cannot
 * represent (a king capture leaves the board kingless), so those entries arrive without a
 * move number. Numbering by ply order keeps such a move in its own row instead of creating an
 * unnumbered row that renders as "undefined" and inflates the move count.
 */

export type MoveLogRow = { moveNumber: number; white?: string; black?: string };

export type MoveLogSource = {
  moveNumber?: number | null;
  color?: string | null;
  from?: string | null;
  to?: string | null;
};

export function moveLogRows(history: readonly MoveLogSource[] | null | undefined): MoveLogRow[] {
  const rows = new Map<number, MoveLogRow>();
  let ply = 0;
  for (const move of Array.isArray(history) ? history : []) {
    const colour = move?.color === "w" ? "w" : move?.color === "b" ? "b" : null;
    if (!colour) continue;
    const stored = Number(move.moveNumber);
    const moveNumber = Number.isFinite(stored) && stored >= 1 ? stored : Math.floor(ply / 2) + 1;
    ply++;
    const row = rows.get(moveNumber) ?? { moveNumber };
    const label = `${move.from ?? "?"}–${move.to ?? "?"}`;
    // One entry per ply: a replayed command must not overwrite the move already logged for the turn.
    if (colour === "w") {
      if (row.white == null) row.white = label;
    } else if (row.black == null) row.black = label;
    rows.set(moveNumber, row);
  }
  return [...rows.values()].sort((a, b) => a.moveNumber - b.moveNumber);
}

/** Number of full moves in a room history: the highest turn number reached, at least one per ply. */
export function moveLogCount(history: readonly MoveLogSource[] | null | undefined): number {
  const list = Array.isArray(history) ? history : [];
  const numbered = list
    .map((m) => Number(m?.moveNumber))
    .filter((n) => Number.isFinite(n) && n >= 1);
  return Math.max(numbered.length ? Math.max(...numbered) : 0, Math.ceil(list.length / 2));
}
