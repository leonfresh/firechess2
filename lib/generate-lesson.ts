import type { TimePositionalInsight } from "./time-positional-crossref";

export type TextSlide = {
  kind: "text";
  heading: string;
  body: string;
  insight?: string;
  fen?: string;
  orientation?: "white" | "black";
  highlights?: string[];
  arrows?: [string, string][];
};

export type InteractSlide = {
  kind: "interact";
  heading: string;
  instruction: string;
  fen: string;
  orientation?: "white" | "black";
  correctMoves: string[];
  wrongMoves?: string[];
  correctExplanation: string;
  wrongExplanation: string;
  badge?: "brilliant" | "best" | "great" | "good" | "inaccuracy" | "mistake" | "blunder";
  /** Opponent's last move before this position (from/to squares for highlighting) */
  opponentLastMove?: { from: string; to: string };
};

export type ChoiceSlide = {
  kind: "choice";
  heading: string;
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  fen?: string;
  orientation?: "white" | "black";
};

export type ReplaySlide = {
  kind: "replay";
  heading: string;
  body: string;
  startFen?: string;
  moves: string[];
  orientation?: "white" | "black";
  intervalMs?: number;
};

export type ReportLesson = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  estimatedMinutes: number;
  tags: string[];
  slides: (TextSlide | InteractSlide | ChoiceSlide | ReplaySlide)[];
};

/**
 * Given a TimePositionalInsight from the cross-reference, generate a
 * mini-lesson explaining the pattern with interactive slides.
 *
 * Uses the user's actual game FENs so every position is personally relevant.
 */
export function generateLessonFromInsight(
  insight: TimePositionalInsight,
): ReportLesson {
  const slides: ReportLesson["slides"] = [];
  const fen = insight.exampleFens[0];
  const orientation: "white" | "black" = fen?.includes(" b ") ? "black" : "white";

  const verdictLabel = insight.timeVerdict === "rushed" ? "Rushing" : "Overthinking";
  const motifLabel = insight.motifName;
  const avgSec = insight.avgSecondsOnMotif.toFixed(1);
  const cpCost = (insight.avgCpLossOnMotif / 100).toFixed(1);

  // Slide 1: Intro text — explain the pattern
  slides.push({
    kind: "text",
    heading: `${verdictLabel} + ${motifLabel}`,
    body: insight.insight,
    insight: `In ${insight.overlapCount} of your ${insight.totalVerdictCount} ${insight.timeVerdict === "rushed" ? "rushed" : "overthought"} moves, you also made a ${motifLabel.toLowerCase()} mistake. That's not a coincidence — it's a connected habit.`,
    fen,
    orientation,
  });

  // Slide 2: Show the position where it happened (text explainer)
  if (insight.exampleFens.length >= 1) {
    const firstFen = insight.exampleFens[0];
    slides.push({
      kind: "text",
      heading: "Here's one example from your games",
      body: insight.timeVerdict === "rushed"
        ? `You spent just ${avgSec} seconds on this move — that's not enough time to check for ${motifLabel.toLowerCase()}. When you feel the urge to move fast, pause for a 1-second scan: "Is anything undefended? Does this move improve my position?"`
        : `You spent ${avgSec} seconds on this position. That's too long for a ${motifLabel.toLowerCase()} decision. Trust your pattern recognition more — the first reasonable move you see is usually right in these spots.`,
      insight: insight.timeVerdict === "rushed"
        ? "Speed kills accuracy. Not every move needs deep thought, but every move needs a blunder-check."
        : "Analysis paralysis is real. In routine positions, the first decent move you spot is usually good enough.",
      fen: firstFen,
      orientation: firstFen.includes(" b ") ? "black" : "white",
    });
  }

  // Slide 3: Interactive — find the correct move (if we have a best move)
  if (insight.exampleFens.length >= 2) {
    const secondFen = insight.exampleFens[1];
    slides.push({
      kind: "interact",
      heading: "Your turn: find the right move",
      instruction: `In this position from one of your games, you made a ${insight.timeVerdict === "rushed" ? "rushed" : "slow"} ${motifLabel.toLowerCase()} decision. What should you have played instead?`,
      fen: secondFen,
      orientation: secondFen.includes(" b ") ? "black" : "white",
      correctMoves: [],
      correctExplanation:
        "That's the idea. A quick blunder-check before committing would have caught this.",
      wrongExplanation:
        "Look again — what's the biggest threat or the most active square for your pieces?",
      badge: "mistake",
    });
  }

  // Slide 4: Choice — what's the root cause
  slides.push({
    kind: "choice",
    heading: "What's the root cause?",
    question: insight.timeVerdict === "rushed"
      ? `Why do you think you keep making ${motifLabel.toLowerCase()} mistakes when moving fast?`
      : `Why do you spend too long on ${motifLabel.toLowerCase()} decisions?`,
    choices: insight.timeVerdict === "rushed"
      ? [
          "I move too fast because I trust my intuition",
          "I don't run a blunder-check before committing",
          "The positions are too complex for quick decisions",
          "I get bored in quiet positions and rush",
        ]
      : [
          "I'm afraid of making a mistake",
          "I can't decide between two reasonable moves",
          "I don't recognize the pattern quickly enough",
          "I overthink every position equally",
        ],
    correctIndex: insight.timeVerdict === "rushed" ? 1 : 2,
    explanation: insight.timeVerdict === "rushed"
      ? "The fix isn't slowing down everywhere — it's building a 1-second blunder-check habit before every move. Checks, captures, threats — in that order."
      : "The fix is pattern recognition practice. The more you see these positions, the faster your brain will pick the right move automatically.",
  });

  // Slide 5: Takeaway
  slides.push({
    kind: "text",
    heading: "The takeaway",
    body: insight.timeVerdict === "rushed"
      ? `${insight.overlapCount} rushed ${motifLabel.toLowerCase()} mistakes, averaging ${avgSec}s each and costing ~${cpCost} pawns. Your move: add a 1-second blunder-check before every move. It won't slow you down, but it will catch the loose pieces.`
      : `${insight.overlapCount} overthought ${motifLabel.toLowerCase()} decisions, averaging ${avgSec}s each and costing ~${cpCost} pawns. Your move: trust your first reasonable instinct in routine positions. Save deep calculation for genuinely complex moments.`,
    insight: insight.timeVerdict === "rushed"
      ? "Speed + blunder-check > speed alone."
      : "Pattern recognition > analysis paralysis.",
  });

  return {
    id: `report-lesson-${insight.motifName}-${insight.timeVerdict}`,
    title: `${verdictLabel} + ${motifLabel}`,
    subtitle: `${insight.overlapCount} moments where clock habits and positional mistakes overlapped`,
    icon: insight.motifIcon,
    estimatedMinutes: 3,
    tags: ["report", insight.timeVerdict, motifLabel.toLowerCase()],
    slides,
  };
}
