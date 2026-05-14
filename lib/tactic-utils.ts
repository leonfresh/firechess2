import type { MissedTactic } from "@/lib/types";

export const SHORT_TACTIC_MATE_MAX_MOVES = 5;

export function isShortMateDistance(
  mateIn: number | null | undefined,
): mateIn is number {
  return (
    typeof mateIn === "number" &&
    mateIn > 0 &&
    mateIn <= SHORT_TACTIC_MATE_MAX_MOVES
  );
}

export function isMissedMateTactic(
  tactic: Pick<MissedTactic, "mateIn" | "tags">,
): boolean {
  if (typeof tactic.mateIn === "number") {
    return isShortMateDistance(tactic.mateIn);
  }

  return tactic.tags.includes("Missed Mate");
}
