import { replayDrama } from "./chaos-replay-drama";
/**
 * Chaos-native match scoring — deliberately engine-free.
 *
 * Stockfish "accuracy" is meaningless on a board where a Nuclear Queen deletes a
 * 3x3 and an armed Kamikaze Bishop removes itself. Worse, it would rank the
 * blandest games highest. So we score what actually makes a Chaos Chess game
 * worth watching: captures, multi-piece destruction, material comebacks,
 * lead changes and decisive finishes, with small bonuses for varied powers.
 *
 * Every input here already lives in `chaos_match.record` (moves[].powers, frames[],
 * state), so the entire archive is scorable retroactively with no new game
 * instrumentation and no server-side engine pass.
 */
import { ALL_MODIFIERS } from "./chaos-chess";
import { ALL_ANOMALIES } from "./chaos-anomalies";

export type ChaosSide = "white" | "black";
export type ChaosTier = "MYTHIC" | "LEGENDARY" | "WILD" | "SOLID" | "QUIET";

export type ChaosEventKind =
  | "signature"
  | "anomaly"
  | "pick"
  | "king-capture"
  | "checkmate"
  | "finish";

export type ChaosEvent = {
  kind: ChaosEventKind;
  side: ChaosSide | null;
  ply: number;
  label: string;
  icon: string;
  weight: number;
};

export type ChaosBadge = { icon: string; name: string; detail: string };

export type ChaosMoment = { fen: string; ply: number; label: string };

export type ChaosRecord = {
  moves?: unknown[];
  frames?: unknown[];
  state?: unknown;
  fen?: string;
  timeControlSeconds?: number;
  incrementSeconds?: number;
} | null;

export type ChaosScore = {
  score: number;
  watchReasons: string[];
  tier: ChaosTier;
  headline: string;
  blurb: string;
  badgeLine: string;
  events: ChaosEvent[];
  badges: ChaosBadge[];
  moment: ChaosMoment | null;
  picks: Record<ChaosSide, string[]>;
  powersInPlay: Record<ChaosSide, string[]>;
  anomalies: Record<ChaosSide, string | null>;
  signature: string[];
  plies: number;
};

/** Powers that visibly break chess. Their mere presence in a game is the story. */
const SIGNATURE: Record<string, { icon: string; weight: number }> = {
  "nuclear-queen": { icon: "☢️", weight: 14 },
  railgun: { icon: "🎯", weight: 13 },
  "bishop-cannon": { icon: "💥", weight: 11 },
  "rook-cannon": { icon: "🧨", weight: 11 },
  "collateral-rook": { icon: "🔥", weight: 12 },
  "kamikaze-bishop": { icon: "💀", weight: 13 },
  "undead-army": { icon: "🧟", weight: 12 },
  "knight-horde": { icon: "🐴", weight: 10 },
  amazon: { icon: "👸", weight: 11 },
  "king-ascension": { icon: "👑", weight: 10 },
  "queen-teleport": { icon: "🌀", weight: 10 },
  archbishop: { icon: "⛪", weight: 9 },
  knook: { icon: "🦄", weight: 9 },
  "pawn-promotion-early": { icon: "⬆️", weight: 8 },
};

/** Ending rarity. Fallback shares come from the first 177 archived matches and
 * are only used when the caller has no live table; rarity is always better
 * measured against the live archive. */
const FALLBACK_ENDING_SHARE: Record<string, number> = {
  "king captured": 0.04,
  "kamikaze king": 0.006,
  stalemate: 0.011,
  checkmate: 0.29,
  resignation: 0.3,
  "time expired": 0.21,
  "draw agreed": 0.13,
};

const MODIFIER_NAME = new Map(ALL_MODIFIERS.map((m) => [m.id, m]));
const MODIFIER_BY_NAME = new Map(ALL_MODIFIERS.map((m) => [m.name.toLowerCase(), m]));
const ANOMALY_BY_NAME = new Map(ALL_ANOMALIES.map((a) => [a.name.toLowerCase(), a]));

const sideOf = (word: string): ChaosSide | null =>
  word.toLowerCase() === "white" ? "white" : word.toLowerCase() === "black" ? "black" : null;

const normaliseReason = (reason: string) =>
  reason
    .toLowerCase()
    .replace(/^.*?kamikaze king.*$/, "kamikaze king")
    .replace(/\bdrawn?\b.*/, "draw agreed")
    .replace(/^.*stalemate.*$/, "stalemate")
    .replace(/^.*checkmate.*$/, "checkmate")
    .replace(/^.*king captured.*$/, "king captured")
    .replace(/^.*resign.*$/, "resignation")
    .replace(/^.*time.*$/, "time expired");

export function endingKey(reason: string): string {
  const key = normaliseReason(reason || "");
  return key || "other";
}

/** Rarity bonus: rarer endings score higher. 0 for a routine finish, up to 30. */
function rarityBonus(share: number): number {
  if (!Number.isFinite(share) || share <= 0) return 6;
  if (share < 0.01) return 24;
  if (share < 0.02) return 20;
  if (share < 0.05) return 16;
  if (share < 0.1) return 10;
  if (share < 0.2) return 5;
  return 0;
}

const TIERS: { min: number; tier: ChaosTier }[] = [
  { min: 85, tier: "MYTHIC" },
  { min: 68, tier: "LEGENDARY" },
  { min: 50, tier: "WILD" },
  { min: 32, tier: "SOLID" },
  { min: 0, tier: "QUIET" },
];

type MoveLike = {
  from?: string;
  to?: string;
  color?: string;
  moveNumber?: number;
  powers?: { white?: string[]; black?: string[] };
};

type FrameLike = { fen?: string; label?: string };

export function scoreChaosGame(input: {
  winner: string;
  reason: string;
  record: ChaosRecord;
  rated?: boolean;
  ratingDelta?: number | null;
  endingShare?: number;
  captureFen?: string | null;
}): ChaosScore {
  const record = input.record ?? {};
  const moves = (Array.isArray(record.moves) ? record.moves : []) as MoveLike[];
  const frames = (Array.isArray(record.frames) ? record.frames : []) as FrameLike[];
  const state = (record.state ?? {}) as Record<string, unknown>;
  const plies = moves.length;
  const share = input.endingShare ?? FALLBACK_ENDING_SHARE[endingKey(input.reason)] ?? 0.12;
  const key = endingKey(input.reason);

  const events: ChaosEvent[] = [];
  const picks: Record<ChaosSide, string[]> = { white: [], black: [] };
  const firstSeen: Record<ChaosSide, Map<string, number>> = { white: new Map(), black: new Map() };

  // 1. Draft picks and anomaly choices come straight from the replay frames.
  let kingCaptureFrame = -1;
  frames.forEach((frame, index) => {
    const label = String(frame?.label ?? "");
    const pick = /^(white|black) picked (.+)$/.exec(label);
    if (pick) {
      const side = sideOf(pick[1]);
      if (side) picks[side].push(pick[2]);
      return;
    }
    const chose = /^(white|black) chose (.+)$/.exec(label);
    if (chose && chose[2].toLowerCase() !== "no anomaly") {
      const side = sideOf(chose[1]);
      if (side) {
        const named = ANOMALY_BY_NAME.get(chose[2].toLowerCase());
        events.push({
          kind: "anomaly",
          side,
          ply: plyAtFrame(index, frames.length, plies),
          label: named ? `${side === "white" ? "White" : "Black"} played the ${named.name} anomaly` : `Anomaly: ${chose[2]}`,
          icon: named?.icon ?? "🔮",
          weight: named ? 12 : 6,
        });
      }
      return;
    }
    if (/captured the king/i.test(label)) kingCaptureFrame = index;
  });

  // 2. Power activations: powers[side] is the active set per move, so the first
  // move a power appears on is the moment it reached the board.
  moves.forEach((move, index) => {
    const ply = typeof move.moveNumber === "number" ? (move.moveNumber - 1) * 2 + (move.color === "b" ? 2 : 1) : index + 1;
    (["white", "black"] as ChaosSide[]).forEach((side) => {
      const list = (side === "white" ? move.powers?.white : move.powers?.black) ?? [];
      list.forEach((id) => {
        if (!firstSeen[side].has(id)) firstSeen[side].set(id, ply);
      });
    });
  });

  const powersInPlay: Record<ChaosSide, string[]> = {
    white: [...firstSeen.white.keys()],
    black: [...firstSeen.black.keys()],
  };

  for (const side of ["white", "black"] as ChaosSide[]) {
    for (const [id, ply] of firstSeen[side]) {
      const sig = SIGNATURE[id];
      if (!sig) continue;
      events.push({
        kind: "signature",
        side,
        ply,
        label: `${side === "white" ? "White" : "Black"} armed the ${MODIFIER_NAME.get(id)?.name ?? id}`,
        icon: sig.icon,
        weight: sig.weight,
      });
    }
  }

  // 3. Chaos flavour from the final state.
  const anomalyOf = (side: ChaosSide) => {
    const raw = state[side === "white" ? "playerAnomaly" : "aiAnomaly"];
    if (typeof raw !== "string" || !raw) return null;
    return ALL_ANOMALIES.find((a) => a.id === raw)?.name ?? raw;
  };
  const anomalies: Record<ChaosSide, string | null> = { white: anomalyOf("white"), black: anomalyOf("black") };
  const anomalyUsed =
    state.playerAnomalyUsed === true || state.aiAnomalyUsed === true || state.playerAnomalyUsed === 1;

  const signature = [...new Set([...powersInPlay.white, ...powersInPlay.black].filter((id) => SIGNATURE[id]))];
  const signatureNames = signature.map((id) => MODIFIER_NAME.get(id)?.name ?? id);

  // 4. Ending events.
  const kingCaptured = /king captured/i.test(input.reason);
  const kamikaze = /kamikaze/i.test(input.reason);
  const checkmate = key === "checkmate";
  const moveOf = Math.max(1, Math.ceil(plies / 2));
  if (kingCaptured) {
    events.push({
      kind: "king-capture",
      side: null,
      ply: plies,
      label: `The king fell on move ${moveOf}`,
      icon: "👑",
      weight: 34,
    });
  }
  if (kamikaze) {
    events.push({ kind: "finish", side: null, ply: plies, label: `Kamikaze King ending on move ${moveOf}`, icon: "💥", weight: 36 });
  }
  if (checkmate) {
    events.push({ kind: "checkmate", side: null, ply: plies, label: `Checkmate on move ${moveOf}`, icon: "🏁", weight: 14 });
  }

  // Board action dominates; merely owning rare cards adds a small, capped bonus.
  const drama = replayDrama(record, input.winner, input.reason);
  let score = 8 + drama.score + Math.min(10, signature.length * 2)
    + Math.min(6, powersInPlay.white.length + powersInPlay.black.length)
    + (anomalyUsed ? 4 : 0);
  // Rarity is a small tie-break for decisive finishes, never a reward for rare timeouts.
  if (kingCaptured || kamikaze || checkmate) score += Math.min(4, rarityBonus(share) / 6);
  if (plies < 12) score -= 20;
  if (!drama.hasReplay) score = Math.min(score, 15);
  score = Math.max(0, Math.min(100, Math.round(score * 0.82)));
  const clutch = drama.deficit >= 3;

  const tier = TIERS.find((t) => score >= t.min)?.tier ?? "QUIET";

  // 6. Moment: the king capture if there is one, else the final position.
  const momentIndex = kingCaptureFrame >= 0 ? kingCaptureFrame : frames.length - 1;
  const momentFrame = momentIndex >= 0 ? frames[momentIndex] : undefined;
  const momentFen = momentFrame?.fen ?? record.fen ?? null;
  const moment: ChaosMoment | null = drama.moment ?? (momentFen
    ? {
        fen: momentFen,
        ply: plyAtFrame(momentIndex, frames.length, plies),
        label: String(momentFrame?.label ?? "Final position"),
      }
    : null);

  const topEvent = [...events].sort((a, b) => b.weight - a.weight)[0] ?? null;

  const badges: ChaosBadge[] = [];
  if (signatureNames.length)
    badges.push({
      icon: SIGNATURE[signature[0]]?.icon ?? "⚡",
      name: signatureNames.slice(0, 2).join(" · "),
      detail: `${signatureNames.length} signature power${signatureNames.length === 1 ? "" : "s"} in play`,
    });
  if (anomalies.white || anomalies.black) {
    const mine = input.winner === "black" ? anomalies.black : anomalies.white;
    const theirs = input.winner === "black" ? anomalies.white : anomalies.black;
    badges.push({
      icon: "🔮",
      name: mine ?? theirs ?? "Anomaly",
      detail: `${theirs && mine ? `vs ${theirs} · ` : ""}${anomalyUsed ? "anomaly used" : "anomaly chosen"}`,
    });
  }
  if (kingCaptured) badges.push({ icon: "👑", name: "King captured", detail: input.reason });
  if (clutch) badges.push({ icon: "🕐", name: "Clutch", detail: `Recovered a ${drama.deficit}-point material deficit` });
  if (share < 0.05) badges.push({ icon: "💎", name: "Rare ending", detail: `${Math.max(1, Math.round(share * 1000) / 10)}% of games end this way` });
  if (anomalyUsed && !badges.some((b) => b.icon === "🔮")) badges.push({ icon: "🔮", name: "Anomaly used", detail: "Anomaly effect resolved" });
  if (plies >= 80) badges.push({ icon: "⏳", name: `${plies} plies`, detail: "Marathon" });

  const winnerName = input.winner === "draw" ? "Nobody" : input.winner === "white" ? "White" : "Black";
  const clause = (label: string) => label.replace(/^(White|Black) armed the /, "armed the ").replace(/^(White|Black) /, "");
  const headline = topEvent ? `${topEvent.icon} ${clause(topEvent.label)}` : input.reason;
  const blurb = [
    `${plies} plies`,
    `${powersInPlay.white.length + powersInPlay.black.length} powers drafted`,
    signatureNames.length ? `${signatureNames[0]} on the board` : null,
    kingCaptured ? "decided by a king capture" : key === "checkmate" ? "decided by mate" : `ended by ${input.reason.toLowerCase()}`,
  ]
    .filter(Boolean)
    .join(" · ");
  const badgeLine = badges.map((b) => `${b.icon} ${b.name}`).join("  ");

  return {
    score,
    watchReasons: drama.reasons,
    tier,
    headline: `${winnerName} — ${headline}`,
    blurb,
    badgeLine,
    events: events.sort((a, b) => b.weight - a.weight).slice(0, 8),
    badges: badges.slice(0, 4),
    moment,
    picks,
    powersInPlay,
    anomalies,
    signature,
    plies,
  };
}

function plyAtFrame(index: number, frames: number, plies: number): number {
  if (index < 0 || frames <= 0) return 0;
  return Math.round(((index + 1) / frames) * Math.max(plies, frames));
}

/** Live rarity table: reason -> share of all archived games. */
export function endingShareTable(rows: { reason: string; n: number }[]): Record<string, number> {
  const total = rows.reduce((sum, row) => sum + Number(row.n || 0), 0) || 1;
  const table: Record<string, number> = {};
  for (const row of rows) {
    const key = endingKey(row.reason);
    table[key] = (table[key] ?? 0) + Number(row.n || 0) / total;
  }
  return table;
}

export const CHAOS_TIER_STYLE: Record<ChaosTier, { color: string; label: string }> = {
  MYTHIC: { color: "#d7fa64", label: "MYTHIC" },
  LEGENDARY: { color: "#f0b354", label: "LEGENDARY" },
  WILD: { color: "#7dd3fc", label: "WILD" },
  SOLID: { color: "#a3e635", label: "SOLID" },
  QUIET: { color: "#94a3b8", label: "QUIET" },
};

export const MATCH_TITLE = (white: string, black: string, winner: string, reason: string) =>
  winner === "draw"
    ? `${white} and ${black} could not break each other`
    : `${winner === "white" ? white : black} takes the crown — ${reason}`;
