import { Chess, type Square } from "chess.js";
import { ALL_MODIFIERS } from "./chaos-chess";
import { ALL_ANOMALIES } from "./chaos-anomalies";
// Explicit public projection: never serialize room metadata, chat, identities or offers.
export function visualState(value: any) {
  const s = value ?? {};
  return {
    white: (s.playerModifiers ?? []).map((m: any) => m.id),
    black: (s.aiModifiers ?? []).map((m: any) => m.id),
    assignedSquares: s.assignedSquares ?? {},
    playerAnomaly: s.playerAnomaly ?? null,
    aiAnomaly: s.aiAnomaly ?? null,
    playerAnomalyUsed: s.playerAnomalyUsed,
    aiAnomalyUsed: s.aiAnomalyUsed,
    currentPhase: s.currentPhase ?? 0,
    playerNuclearCooldownUntil: s.playerNuclearCooldownUntil ?? 0,
    aiNuclearCooldownUntil: s.aiNuclearCooldownUntil ?? 0,
    playerMoonUnlocked: !!s.playerMoonUnlocked,
    aiMoonUnlocked: !!s.aiMoonUnlocked,
  };
}
export type VisualState = ReturnType<typeof visualState>;
export type WatchFrame = {
  fen: string;
  state: VisualState;
  label: string;
  from?: string;
  to?: string;
  kingCapture?: boolean;
  pieceStays?: boolean;
};
/** Discord Activity requires a signed discord_ identity before play. Browser
 * sessions and browser guests use the other identity formats. Return only the
 * platform label; private account IDs must never enter the public response. */
export function archivePlatform(hostId: unknown, guestId: unknown): string {
  if (typeof hostId !== "string" || !hostId || typeof guestId !== "string" || !guestId)
    return "Platform unavailable";
  const hostDiscord = /^discord_\d{17,20}$/.test(hostId);
  const guestDiscord = /^discord_\d{17,20}$/.test(guestId);
  return hostDiscord && guestDiscord ? "Discord" : hostDiscord || guestDiscord ? "Discord + Website" : "Website";
}
export function describeWatchFrame(frame: WatchFrame) {
  const choice = /^(white|black) chose an anomaly$/.exec(frame.label);
  if (!choice) return frame.label;
  const id = choice[1] === "white" ? frame.state.playerAnomaly : frame.state.aiAnomaly;
  return `${choice[1]} chose ${ALL_ANOMALIES.find(a => a.id === id)?.name ?? (id ? id : "no anomaly")}`;
}
export function describeWatchAnomaly(frame: WatchFrame): string | null {
  const choice = /^(white|black) chose an anomaly$/.exec(frame.label);
  if (!choice) return null;
  const id = choice[1] === "white" ? frame.state.playerAnomaly : frame.state.aiAnomaly;
  return ALL_ANOMALIES.find(a => a.id === id)?.description ?? null;
}
export function expandVisual(s: VisualState) {
  return {
    ...s,
    playerModifiers: ALL_MODIFIERS.filter((m) => s.white.includes(m.id)),
    aiModifiers: ALL_MODIFIERS.filter((m) => s.black.includes(m.id)),
  };
}
export function archiveFrames(record: any): WatchFrame[] {
  if (Array.isArray(record.frames) && record.frames.length)
    return record.frames;
  // Older records have authoritative FENs but no historical piece assignments.
  const moves = Array.isArray(record.moves) ? record.moves : [];
  const frames = moves
    .filter((m: any) => typeof m.fen === "string")
    .map((m: any, i: number) => ({
      fen: m.fen,
      state: {
        ...visualState(null),
        white: m.powers?.white ?? [],
        black: m.powers?.black ?? [],
      },
      label: `Move ${i + 1}: ${m.from} → ${m.to}`,
      from: m.from,
      to: m.to,
      kingCapture:!!m.kingCapture,
      pieceStays:!!m.pieceStays,
    }));
  if (record.fen && !moves.at(-1)?.kingCapture)
    frames.push({
      fen: record.fen,
      state: visualState(record.state),
      label: "Final position",
    });
  return frames;
}

/* ── What a power did on a replayed move ──────────────────────────────────────────────────────
 * Stored frames only say "black: e8 → d6". Comparing the boards before and after, with the powers
 * the mover held, names what actually happened: a Usurper swap, a Regicide revival, a Torpedo
 * double step, a Battlefield Promotion, a ranged shot, an explosion. Works on every archived game,
 * old ones included, because it only needs the FENs. */
type Board = Map<string, { type: string; color: "w" | "b" }>;
const PIECE_NAMES: Record<string, string> = { p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" };

function readBoard(fen: string): Board | null {
  const rows = fen.split(" ")[0]?.split("/");
  if (!rows || rows.length !== 8) return null;
  const board: Board = new Map();
  for (let r = 0; r < 8; r++) {
    let f = 0;
    for (const ch of rows[r]) {
      if (/[1-8]/.test(ch)) { f += Number(ch); continue; }
      if (!/[prnbqk]/i.test(ch) || f > 7) return null;
      board.set(`${"abcdefgh"[f]}${8 - r}`, { type: ch.toLowerCase(), color: ch === ch.toUpperCase() ? "w" : "b" });
      f++;
    }
    if (f !== 8) return null;
  }
  return board;
}

function isStandardMove(fen: string, from: string, to: string): boolean | null {
  try {
    const parts = fen.split(" ");
    const game = new Chess(parts.join(" "));
    return game.moves({ square: from as Square, verbose: true }).some((m) => m.to === to);
  } catch {
    return null; // positions only Chaos allows (a missing king) can't be checked
  }
}

export function describeWatchPower(previous: WatchFrame | undefined, frame: WatchFrame): string | null {
  const from = frame.from, to = frame.to;
  if (!previous || !from || !to || !/^(white|black):/.test(frame.label)) return null;
  const before = readBoard(previous.fen), after = readBoard(frame.fen);
  const piece = before?.get(from);
  if (!before || !after || !piece) return null;
  const side = piece.color, name = PIECE_NAMES[piece.type];
  const powers: string[] = (side === "w" ? frame.state.white : frame.state.black) ?? [];
  const target = before.get(to), landed = after.get(to);
  const captured = !!target && target.color !== side;
  const df = Math.abs("abcdefgh".indexOf(to[0]) - "abcdefgh".indexOf(from[0])), dr = Math.abs(Number(to[1]) - Number(from[1]));

  if (piece.type === "k" && target?.color === side && landed?.type === "k" && after.get(from)?.type === target.type && after.get(from)?.color === side)
    return `🎭 Usurper: the king swapped places with the ${PIECE_NAMES[target.type]}`;
  // Ordinary castling moves the rook too; that is not a power.
  if (piece.type === "k" && dr === 0 && df === 2 && (from === "e1" || from === "e8")) return null;

  const notes: string[] = [];
  let lost = 0;
  for (const [square, p] of before) {
    const now = after.get(square);
    if (square !== from && (!now || now.color !== p.color || now.type !== p.type) && !(square === to && p.color === side)) lost++;
  }
  if (frame.pieceStays || (captured && after.get(from)?.type === piece.type && after.get(from)?.color === side && landed?.color !== side))
    notes.push(`🎯 The ${name} fired from ${from} without moving`);
  if (lost >= 2) {
    // Name the blast when the moving piece carries one.
    const blast = ALL_MODIFIERS.find((m) => powers.includes(m.id) && m.piece === piece.type && ["nuclear-queen", "kamikaze-bishop", "collateral-rook"].includes(m.id));
    notes.push(blast ? `💥 ${blast.icon} ${blast.name}: ${lost} pieces destroyed` : `💥 ${lost} pieces destroyed in one turn`);
  }
  if (piece.type === "p" && landed?.color === side && landed.type !== "p")
    notes.push(to[1] === (side === "w" ? "8" : "1") ? `♛ Promoted to a ${PIECE_NAMES[landed.type]}` : `⬆️ Battlefield Promotion: the pawn became a ${PIECE_NAMES[landed.type]}`);
  if (piece.type === "p" && df === 0 && dr === 2 && from[1] !== (side === "w" ? "2" : "7")) notes.push("🚀 Torpedo Pawns: two squares forward");
  if (piece.type === "p" && df === 0 && captured) notes.push("🗡️ Pawn Bayonet: captured straight ahead");
  if (piece.type === "k" && captured && (df > 1 || dr > 1)) notes.push("🔱 King Ascension: the king captured from range");
  for (const [square, p] of after) {
    if (square === to || square === from || p.color !== side) continue;
    const was = before.get(square);
    if (was && was.color === p.color && was.type === p.type) continue;
    notes.push(piece.type === "k" && captured && powers.includes("king-wrath")
      ? `👑 Regicide revived a ${PIECE_NAMES[p.type]} on ${square}`
      : `✨ A ${PIECE_NAMES[p.type]} appeared on ${square}`);
  }
  if (notes.length) return notes.join(" · ");
  if (isStandardMove(previous.fen, from, to) !== false) return null;
  // Not a legal chess move, and nothing above explains it: name the mover's powers for that piece.
  const matching = ALL_MODIFIERS.filter((m) => powers.includes(m.id) && m.piece === piece.type);
  return matching.length
    ? `✦ ${matching.map((m) => `${m.icon} ${m.name}`).join(" or ")}: a move only the ${name}'s power allows`
    : `✦ A power move by the ${name}`;
}
