import { Chess, type Square } from "chess.js";
import { ALL_MODIFIERS, rollDraftChoices, type ChaosState, type PieceType } from "./chaos-chess";
import { applyDraftEffect } from "./chaos-moves";

export const DRAFT_DURATION_MS = 20_000;
export type ServerDraft = { id: string; color: "white" | "black"; phase: number; choices: string[]; deadline: number; rerolled?: boolean };
export function draftChoices(fen: string, state: ChaosState, color: "white" | "black", phase: number, excluded: string[] = []) {
  const own = color === "white" ? "player" : "ai";
  const counts: Partial<Record<PieceType, number>> = {};
  for (const p of new Chess(fen).board().flat()) if (p?.color === (color === "white" ? "w" : "b")) counts[p.type] = (counts[p.type] ?? 0) + 1;
  return rollDraftChoices(phase, [...state[`${own}Modifiers`], ...ALL_MODIFIERS.filter(m => excluded.includes(m.id))], undefined, counts,
    state[`${own}Anomaly`], state[own === "player" ? "spentPlayerModIds" : "spentAiModIds"] ?? []).map(m => m.id);
}
export function applyServerDraft(fen: string, state: ChaosState, draft: ServerDraft, id: string) {
  const mod = ALL_MODIFIERS.find(m => m.id === id)!;
  const side = draft.color === "white" ? "w" : "b", own = side === "w" ? "player" : "ai";
  const next = structuredClone(state);
  next[`${own}Modifiers`] = [...next[`${own}Modifiers`], mod];
  next.currentPhase = side === "w" ? state.currentPhase : draft.phase;
  next.draftStep = side === "w" ? 1 : 2;
  next.isDrafting = false; next.draftingSide = null; next.draftChoices = [];
  const board = new Chess(fen);
  const single: Record<string, string> = {archbishop:"b", knook:"n", camel:"n", "night-rider":"n"};
  if (single[id]) {
    const squares: string[] = [];
    for (const file of "abcdefgh") for (const rank of "12345678") {
      const square = `${file}${rank}`, p = board.get(square as Square);
      if (p?.color === side && p.type === single[id]) squares.push(square);
    }
    const claimed = new Set(Object.values(next.assignedSquares ?? {}));
    next.assignedSquares = {...next.assignedSquares, [`${side}_${id}`]: squares.find(s => !claimed.has(s)) ?? squares[0] ?? null};
  }
  return {state: next, fen: (applyDraftEffect(board, mod, side, 0) ?? board).fen()};
}
