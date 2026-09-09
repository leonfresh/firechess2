import type { ChaosState } from "./chaos-chess";

export type PendingDraft = { baseFen: string; fen: string; state: ChaosState; phase: number; move: { from: string; to: string } };
export const pendingDraftKey = (room: string) => `chaos-pending-draft:${room}`;
export function recoverPendingDraft(raw: string | null, fen: string, phase: number, color: string): PendingDraft | null {
  try {
    const draft = JSON.parse(raw ?? "null") as PendingDraft | null;
    if (!draft || color !== "white" || draft.baseFen !== fen || draft.phase !== phase + 1 || !draft.state?.isDrafting || !draft.state.draftChoices?.length) return null;
    if (!/^[a-h][1-8]$/.test(draft.move?.from) || !/^[a-h][1-8]$/.test(draft.move?.to) || typeof draft.fen !== "string") return null;
    return draft;
  } catch { return null; }
}
