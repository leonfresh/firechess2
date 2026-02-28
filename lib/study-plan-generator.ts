/**
 * Study plan generator — takes analysis report data and produces
 * a personalized weekly study plan with prioritized tasks.
 */

export type StudyTaskDraft = {
  category: "opening" | "tactic" | "endgame" | "habit" | "puzzle" | "review";
  title: string;
  description: string;
  priority: number; // 1 (highest) – 5
  recurring: boolean;
  dayIndex?: number; // 1-7 for weekly schedule
  link?: string;
  icon: string;
};

export type PlanInput = {
  accuracy?: number | null;
  leakCount?: number | null;
  repeatedPositions?: number | null;
  tacticsCount?: number | null;
  gamesAnalyzed: number;
  weightedCpLoss?: number | null;
  severeLeakRate?: number | null;
  topLeakOpenings?: string[];
  estimatedRating?: number | null;
  scanMode?: string;
};

/**
 * Generate a personalised weekly study plan from the latest report data.
 * Returns a title + array of tasks.
 */
export function generateStudyPlan(input: PlanInput): {
  title: string;
  weaknesses: {
    accuracy?: number;
    leakCount?: number;
    tacticsPerGame?: number;
    severeLeakRate?: number;
    topLeakOpenings?: string[];
  };
  tasks: StudyTaskDraft[];
} {
  const {
    accuracy = 0,
    leakCount = 0,
    repeatedPositions = 0,
    tacticsCount = 0,
    gamesAnalyzed,
    weightedCpLoss = 0,
    severeLeakRate = 0,
    topLeakOpenings = [],
    estimatedRating = 0,
    scanMode = "both",
  } = input;

  const acc = accuracy ?? 0;
  const leaks = leakCount ?? 0;
  const tactics = tacticsCount ?? 0;
  const cpLoss = weightedCpLoss ?? 0;
  const severe = severeLeakRate ?? 0;
  const rating = estimatedRating ?? 0;

  const tacticsPerGame = gamesAnalyzed > 0 && tactics >= 0
    ? tactics / gamesAnalyzed
    : 0;
  const leakRate = (repeatedPositions ?? 0) > 0
    ? leaks / (repeatedPositions ?? 1)
    : 0;

  const tasks: StudyTaskDraft[] = [];

  // ── Determine biggest weaknesses to prioritise ──
  type Weakness = { area: string; severity: number };
  const weaknesses: Weakness[] = [];

  if (acc < 70) weaknesses.push({ area: "accuracy", severity: 70 - acc });
  if (leakRate > 0.2) weaknesses.push({ area: "openings", severity: leakRate * 100 });
  if (tacticsPerGame > 1) weaknesses.push({ area: "tactics", severity: tacticsPerGame * 30 });
  if (severe > 0.05) weaknesses.push({ area: "blunders", severity: severe * 200 });
  if (cpLoss > 80) weaknesses.push({ area: "precision", severity: cpLoss / 2 });

  // Sort by severity (biggest problem first)
  weaknesses.sort((a, b) => b.severity - a.severity);
  const topArea = weaknesses[0]?.area ?? "general";

  // ── Generate title ──
  const now = new Date();
  const weekStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const titleMap: Record<string, string> = {
    accuracy: `Week of ${weekStr} — Sharpen Move Accuracy`,
    openings: `Week of ${weekStr} — Fix Opening Leaks`,
    tactics: `Week of ${weekStr} — Tactical Training`,
    blunders: `Week of ${weekStr} — Reduce Blunders`,
    precision: `Week of ${weekStr} — Improve Precision`,
    general: `Week of ${weekStr} — All-Round Improvement`,
  };
  const title = titleMap[topArea] ?? titleMap.general;

  // ── Daily habit tasks (recurring, every day) ──
  tasks.push({
    category: "habit",
    title: "Checks, captures, threats",
    description: "Before EVERY move in your games today, spend 5 seconds checking all checks, captures, and threats — for both sides. This one habit prevents more blunders than any other.",
    priority: 1,
    recurring: true,
    icon: "🧠",
  });

  tasks.push({
    category: "puzzle",
    title: "Daily tactical puzzles",
    description: rating > 1500
      ? "Complete 15 tactical puzzles on Lichess. Focus on accuracy over speed — set a 60-second limit per puzzle."
      : "Complete 10 tactical puzzles on Lichess. Start with Puzzle Storm for pattern building, then switch to rated puzzles.",
    priority: 1,
    recurring: true,
    icon: "⚡",
    link: "https://lichess.org/training/daily",
  });

  // ── Opening-specific tasks ──
  if (scanMode !== "tactics" && leaks > 0) {
    const leakPriority = leakRate > 0.3 ? 1 : leakRate > 0.15 ? 2 : 3;

    if (topLeakOpenings.length > 0) {
      const openingName = topLeakOpenings[0];
      tasks.push({
        category: "opening",
        title: `Study ${openingName} lines`,
        description: `Your weakest opening is the ${openingName}. Spend 15 minutes studying the main lines and your specific leak positions. Use the Drill Mode on your latest report to practice.`,
        priority: leakPriority,
        recurring: false,
        dayIndex: 1,
        icon: "📖",
      });
    }

    tasks.push({
      category: "opening",
      title: "Drill your top 3 opening leaks",
      description: `You have ${leaks} opening leaks across ${repeatedPositions ?? 0} repeated positions (${(leakRate * 100).toFixed(0)}% leak rate). Open your latest report and use Drill Mode to practice the correct moves until they're automatic.`,
      priority: leakPriority,
      recurring: false,
      dayIndex: 2,
      icon: "🔁",
    });

    if (leaks > 5) {
      tasks.push({
        category: "opening",
        title: "Build a repertoire flashcard set",
        description: "Take your 5 most frequent leaks and create flashcards: position on one side, correct move + explanation on the other. Review daily for 5 minutes.",
        priority: 3,
        recurring: false,
        dayIndex: 3,
        icon: "🃏",
      });
    }
  }

  // ── Tactics-specific tasks ──
  if (tactics > 0 && tacticsPerGame > 0.5) {
    tasks.push({
      category: "tactic",
      title: "Review missed tactics from report",
      description: `You missed ${tactics} tactics across ${gamesAnalyzed} games (${tacticsPerGame.toFixed(1)}/game). Open your report and go through each missed tactic. Understand WHY you missed it — was it time pressure? A pattern you don't recognize?`,
      priority: tacticsPerGame > 2 ? 1 : 2,
      recurring: false,
      dayIndex: 1,
      icon: "🔍",
    });

    if (tacticsPerGame > 1.5) {
      tasks.push({
        category: "tactic",
        title: "Pattern recognition: forks & pins",
        description: "Focus today's puzzle session on fork and pin motifs specifically. These are the most commonly missed patterns. On Lichess, go to Themes and select 'Fork' or 'Pin'.",
        priority: 2,
        recurring: false,
        dayIndex: 4,
        icon: "♟️",
        link: "https://lichess.org/training/fork",
      });
    }

    tasks.push({
      category: "tactic",
      title: "Drill missed tactics",
      description: "Use the Missed Tactics drill in your report. These are YOUR missed opportunities — practicing them builds the specific patterns you need most.",
      priority: 2,
      recurring: false,
      dayIndex: 5,
      icon: "🎯",
    });
  }

  // ── Personalized puzzle training ──
  if (tactics > 0) {
    tasks.push({
      category: "puzzle",
      title: "Solve personalized puzzles",
      description: `Your scan found specific weakness patterns (forks, pins, back-rank threats, etc.). Scroll to the "Practice Your Weak Spots" section in your report and load puzzles that target YOUR missed patterns — not generic training.`,
      priority: 2,
      recurring: false,
      dayIndex: 3,
      icon: "🧩",
    });
  }

  // ── Blunder reduction tasks ──
  if (severe > 0.03) {
    tasks.push({
      category: "habit",
      title: "Blunder check before every move",
      description: `Your severe leak rate is ${(severe * 100).toFixed(1)}%. Before clicking your move, pause for 3 seconds and ask: "Am I hanging anything? Does my opponent have a tactic?" This alone can cut blunders in half.`,
      priority: 1,
      recurring: true,
      icon: "🛡️",
    });

    if (severe > 0.08) {
      tasks.push({
        category: "review",
        title: "Analyze your worst game",
        description: "Pick the game where you had the biggest eval swing (worst blunder). Step through it move by move and write down what you were thinking. Understanding the moment of failure prevents repetition.",
        priority: 2,
        recurring: false,
        dayIndex: 3,
        icon: "📝",
      });
    }
  }

  // ── Endgame tasks (if full scan) ──
  if (scanMode === "both") {
    tasks.push({
      category: "endgame",
      title: "Endgame fundamentals practice",
      description: rating > 1500
        ? "Practice rook endgames on Lichess Practice. Focus on Lucena and Philidor positions — these appear in nearly every game that reaches an endgame."
        : "Practice basic checkmates: King + Queen vs King, King + Rook vs King. Master these until you can do them in under 30 seconds.",
      priority: 3,
      recurring: false,
      dayIndex: 6,
      icon: "♔",
      link: "https://lichess.org/practice",
    });
  }

  // ── Game review task ──
  tasks.push({
    category: "review",
    title: "Play a slow game & self-review",
    description: "Play a 15+10 or 30-minute game. Afterwards, go through it yourself BEFORE checking the engine. Write down your thought process for critical moments. Then compare with engine analysis.",
    priority: 3,
    recurring: false,
    dayIndex: 7,
    icon: "🎮",
  });

  // ── Weekly rescan ──
  tasks.push({
    category: "review",
    title: "Run a new FireChess scan",
    description: "After a week of training, run a fresh scan to measure improvement. Compare your new accuracy, leak count, and tactics score to the previous report on your dashboard.",
    priority: 4,
    recurring: false,
    dayIndex: 7,
    icon: "🔬",
  });

  // Sort by priority, then dayIndex
  tasks.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return (a.dayIndex ?? 99) - (b.dayIndex ?? 99);
  });

  return {
    title,
    weaknesses: {
      accuracy: acc,
      leakCount: leaks,
      tacticsPerGame,
      severeLeakRate: severe,
      topLeakOpenings: topLeakOpenings.slice(0, 3),
    },
    tasks,
  };
}
