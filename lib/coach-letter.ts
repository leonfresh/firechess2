/**
 * The coach's note at the top of a report: a short letter about the one theme to fix first,
 * written by an LLM from a brief of verified facts, then checked so it cannot cite a move,
 * square or number that the brief does not contain.
 *
 * The brief uses only the Free-plan positions: the note is cached on the scan and shown to
 * everyone who opens the report link, so it must not reveal Pro-only findings.
 */
import type { AnalyzeResponse } from "./types";
import { buildReportPositions } from "../components/modern-preview/report-data";
import { coachingPriority, patternWhy, themeHabit } from "./report-coaching";

export type CoachLetter = { theme: string; note: string; rule: string; generatedAt: string };
export type CoachLetterState = CoachLetter | { failedAt: string };

export const COACH_LETTER_SYSTEM = `You are an experienced chess coach. You have just gone through a student's games and are writing them a short note about the one thing to fix first.

Voice:
- Talk to the student directly ("you"), plainly, the way you would across the board. Warm, but straight to the point.
- No headings, lists, emoji or hype. Do not open with praise or a greeting line. Avoid words like "crucial", "journey", "delve", "unlock", "elevate".
- Do not mention engines, evaluations, centipawns, scans or reports. Do not hedge or add disclaimers.

Facts:
- Use only the facts in the brief. Every move, square and number you write must appear in the brief, spelled the same way.
- Do not add variations, and do not claim to know what the student was thinking.
- Walk through two of the examples concretely, by game and move when the brief gives them ("In game 12, move 18, you played ..."), then name what they have in common in one sentence, then give the habit that fixes it.

Length: 70 to 130 words for the note.

Reply with JSON only, no markdown:
{"note": "the note", "rule": "one short sentence the student can say to themselves before every move in their next games"}`;

export type CoachBrief = { theme: string; text: string };

export function buildCoachBrief(result: AnalyzeResponse, username: string): CoachBrief | null {
  const patterns = buildReportPositions(result, false);
  const priority = coachingPriority(patterns);
  if (!priority) return null;
  const examples = priority.positions
    .map(p => ({ p, why: patternWhy(p) }))
    // Concrete board facts first; the generic "Precision" fallback only fills gaps.
    .sort((a, b) => Number(!a.why || a.why.label === "Precision") - Number(!b.why || b.why.label === "Precision") || (b.p.cpLoss ?? 0) - (a.p.cpLoss ?? 0))
    .slice(0, 3);
  const mistakes = patterns.filter(p => p.category !== "Brilliants").length;
  const lines = [
    `STUDENT: ${username}${result.playerRating ? `, rated ${result.playerRating}` : ""}`,
    `GAMES REVIEWED: ${result.gamesAnalyzed}`,
    `THEME TO FIX FIRST: ${priority.theme}`,
    `HOW OFTEN: ${priority.positions.length} of the ${mistakes} mistakes we looked at`,
    `HABIT THAT FIXES IT: ${themeHabit(priority.theme)}`,
    "EXAMPLES:",
    ...examples.map(({ p, why }, i) => {
      const where = p.context.split(" · ").filter(part => !/evaluation|Forced-mate|remaining/i.test(part)).join(", ");
      return `${i + 1}. ${where || "One of your games"} (${p.title}). You played ${p.played}; the better move was ${p.best}.${why && why.label !== "Precision" ? ` What went wrong: ${why.reason}` : ""}`;
    }),
  ];
  return { theme: priority.theme, text: lines.join("\n") };
}

const MOVE_OR_SQUARE = /\b(?:O-O(?:-O)?|[KQRBN][a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?|[a-h](?:x[a-h])?[1-8](?:=[QRBN])?)(?=[+#]|\b)/g;
const NUMBER = /(?<![\w.])\d+(?:\.\d+)?(?!\w)/g;

/** Parse the model reply; null unless it is well-formed and cites only what the brief contains. */
export function parseCoachLetter(raw: string, brief: CoachBrief): CoachLetter | null {
  let parsed: unknown;
  try { parsed = JSON.parse(raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, "")); } catch { return null; }
  const { note, rule } = (parsed ?? {}) as { note?: unknown; rule?: unknown };
  if (typeof note !== "string" || typeof rule !== "string") return null;
  const words = note.trim().split(/\s+/).length;
  if (words < 40 || words > 170 || !rule.trim() || rule.length > 200) return null;
  // A move in the brief also vouches for its destination square ("Nxe5" allows "on e5").
  const allowedMoves = new Set((brief.text.match(MOVE_OR_SQUARE) ?? []).flatMap(m => [m, ...(m.match(/[a-h][1-8]/g) ?? [])]));
  const allowedNumbers = new Set(brief.text.match(NUMBER) ?? []);
  const text = `${note}\n${rule}`;
  if ((text.match(MOVE_OR_SQUARE) ?? []).some(m => !allowedMoves.has(m))) return null;
  if ((text.match(NUMBER) ?? []).some(n => !allowedNumbers.has(n))) return null;
  if (/\b(engine|centipawn|evaluation|stockfish)\b/i.test(text)) return null;
  return { theme: brief.theme, note: note.trim(), rule: rule.trim(), generatedAt: new Date().toISOString() };
}
