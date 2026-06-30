/**
 * computeBiggestTakeaway — distills a full scan report into ONE prioritized,
 * actionable verdict for the hero card at the top of /report.
 *
 * It scores each leak category by a rough "estimated rating impact" heuristic
 * (repetition × severity, normalised per category to a 0–100 scale) and returns
 * the single highest one. The heuristics are intentionally simple and tunable —
 * the goal is to surface the *one thing worth fixing next*, not a precise number.
 */

import type { AnalyzeResponse, RepeatedOpeningLeak } from "./types";

export type TakeawayCategory =
  | "opening"
  | "tactics"
  | "endgame"
  | "time"
  | "mental"
  | "clean";

export type BiggestTakeaway = {
  category: TakeawayCategory;
  severity: "critical" | "major" | "moderate" | "good";
  /** Short verdict headline, plain English. */
  headline: string;
  /** One or two sentences of evidence / why it matters. */
  detail: string;
  /** The single next action. */
  fix: string;
  /** Punchy stat chip, e.g. "6 games · −2.4 pawns". */
  stat?: string;
  /** Optional position to render as evidence. */
  evidenceFen?: string;
  evidenceMove?: { user: string; best: string | null };
  /** 0–100 internal impact score (exposed for debugging / sorting). */
  score: number;
};

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const pawns = (cp: number) => (cp / 100).toFixed(1);

function bestLeak(leaks: RepeatedOpeningLeak[]): RepeatedOpeningLeak | null {
  const scored = leaks
    .filter((l) => l.cpLoss >= 100 && l.reachCount >= 2)
    .map((l) => ({ l, s: l.reachCount * l.cpLoss }))
    .sort((a, b) => b.s - a.s);
  return scored[0]?.l ?? null;
}

export function computeBiggestTakeaway(
  r: AnalyzeResponse | null | undefined,
): BiggestTakeaway | null {
  if (!r) return null;
  const games = Math.max(1, r.gamesAnalyzed ?? 0);
  const candidates: BiggestTakeaway[] = [];

  // ── 1. Repeated opening leak (strongest signal: you do it again and again) ──
  const leak = bestLeak(r.leaks ?? []);
  if (leak) {
    const score = clamp((leak.reachCount * leak.cpLoss) / 20);
    const opening = leak.openingName ? `the ${leak.openingName}` : "the same opening position";
    const lossNote =
      leak.userLosses && leak.userLosses > 0
        ? ` You've lost ${leak.userLosses} of those games.`
        : "";
    candidates.push({
      category: "opening",
      severity: sev(score),
      headline: `Your #1 leak is ${opening} — you repeat the same mistake.`,
      detail: `In ${leak.reachCount} games you reached this position and played ${leak.userMove}, dropping about ${pawns(leak.cpLoss)} pawns each time.${lossNote}`,
      fix: leak.bestMove
        ? `Next time, play ${leak.bestMove} here instead of ${leak.userMove}.`
        : `Study this position and stop auto-playing ${leak.userMove}.`,
      stat: `${leak.reachCount}× · −${pawns(leak.cpLoss)} pawns`,
      evidenceFen: leak.fenBefore,
      evidenceMove: { user: leak.userMove, best: leak.bestMove },
      score,
    });
  }

  // ── 2. Missed tactics ──
  const found = r.totalTacticsFound ?? r.missedTactics?.length ?? 0;
  if (found > 0) {
    const perGame = found / games;
    const score = clamp(perGame * 35);
    candidates.push({
      category: "tactics",
      severity: sev(score),
      headline: "You're leaving winning tactics on the board.",
      detail: `Across ${games} games you missed ${found} clear tactics — about ${perGame.toFixed(1)} per game that an opponent at your level would punish.`,
      fix: "Do 10 minutes of tactics puzzles a day. It's the fastest rating you'll gain.",
      stat: `${found} missed · ${perGame.toFixed(1)}/game`,
      score,
    });
  }

  // ── 3. Endgame ──
  const eg = r.endgameStats;
  if (eg && eg.totalPositions >= 8) {
    const convPenalty = eg.conversionRate != null && eg.conversionRate < 0.6 ? 22 : 0;
    const score = clamp((eg.avgCpLoss - 30) * 1.2 + convPenalty);
    if (score > 0) {
      const weak = eg.weakestType ? ` Your weakest area: ${eg.weakestType.toLowerCase()} endgames.` : "";
      const conv = eg.conversionRate != null ? ` You convert only ${Math.round(eg.conversionRate * 100)}% of winning endgames.` : "";
      candidates.push({
        category: "endgame",
        severity: sev(score),
        headline: "Your endgames are leaking the points you earn.",
        detail: `You average ${pawns(eg.avgCpLoss)} pawns lost per endgame move.${conv}${weak}`,
        fix: eg.weakestType
          ? `Drill basic ${eg.weakestType.toLowerCase()} endgames — technique converts directly to rating.`
          : "Drill basic king-and-pawn and rook endgames.",
        stat: `−${pawns(eg.avgCpLoss)} pawns/move`,
        score,
      });
    }
  }

  // ── 4. Time management ──
  const tms = r.timeManagementScore;
  if (tms != null && tms < 55) {
    const score = clamp((55 - tms) * 1.6);
    candidates.push({
      category: "time",
      severity: sev(score),
      headline: "You're losing on the clock, not the board.",
      detail: `Your time-management score is ${tms}/100 — you burn time early and get low later, where most blunders happen.`,
      fix: "Spend less time on familiar opening moves; bank it for the middlegame.",
      stat: `${tms}/100 clock`,
      score,
    });
  }

  // ── 5. Mental / tilt ──
  const ms = r.mentalStats;
  if (ms) {
    const tiltScore = clamp((ms.tiltRate - 35) * 1.5);
    const timeoutScore = clamp((ms.timeoutRate - 12) * 3);
    const score = Math.max(tiltScore, timeoutScore);
    if (score > 0) {
      const tiltLed = tiltScore >= timeoutScore;
      candidates.push({
        category: "mental",
        severity: sev(score),
        headline: tiltLed ? "Tilt is quietly costing you games." : "You're flagging too many games.",
        detail: tiltLed
          ? `${Math.round(ms.tiltRate)}% of your losses are immediately followed by another loss — you keep playing while tilted.`
          : `${Math.round(ms.timeoutRate)}% of your games end on time, not on the board.`,
        fix: tiltLed
          ? "After a loss, take a 5-minute break before the next game."
          : "Play a slower time control until your clock habits improve.",
        stat: tiltLed ? `${Math.round(ms.tiltRate)}% tilt` : `${Math.round(ms.timeoutRate)}% timeouts`,
        score,
      });
    }
  }

  if (candidates.length === 0) {
    return {
      category: "clean",
      severity: "good",
      headline: "No single glaring leak — your mistakes are spread thin.",
      detail: "Nothing in this scan dominates, which usually means you're past the easy fixes. Keep scanning to catch patterns as they form.",
      fix: "Pick the highest-frequency item in the sections below and drill it.",
      score: 0,
    };
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0];
}

function sev(score: number): BiggestTakeaway["severity"] {
  if (score >= 65) return "critical";
  if (score >= 35) return "major";
  return "moderate";
}
