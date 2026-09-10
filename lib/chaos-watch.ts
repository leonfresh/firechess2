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
};
export function describeWatchFrame(frame: WatchFrame) {
  const choice = /^(white|black) chose an anomaly$/.exec(frame.label);
  if (!choice) return frame.label;
  const id = choice[1] === "white" ? frame.state.playerAnomaly : frame.state.aiAnomaly;
  return `${choice[1]} chose ${ALL_ANOMALIES.find(a => a.id === id)?.name ?? (id ? id : "no anomaly")}`;
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
    }));
  if (record.fen)
    frames.push({
      fen: record.fen,
      state: visualState(record.state),
      label: "Final position",
    });
  return frames;
}
