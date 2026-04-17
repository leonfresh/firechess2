"use client";

/**
 * /profile — Chess Profile & Lesson Plan Generator
 *
 * Lets the user link a chess username (picked from their scanned games),
 * view aggregated weakness data, and auto-generate a detailed lesson plan
 * with real positions from their games.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Chess } from "chess.js";
import { useSession } from "@/components/session-provider";
import { Chessboard } from "@/components/chessboard-compat";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type Leak = {
  fenBefore: string;
  fenAfter?: string;
  userMove: string;
  bestMove: string | null;
  cpLoss: number;
  sideToMove?: "white" | "black";
  userColor?: "white" | "black";
  openingName?: string;
  reachCount?: number;
  moveCount?: number;
  tags?: string[];
};

type MissedTactic = {
  fenBefore: string;
  userMove: string;
  bestMove: string;
  cpLoss: number;
  moveNumber?: number;
  sideToMove?: "white" | "black";
  userColor?: "white" | "black";
  tags?: string[];
  motif?: string;
};

type SavedReport = {
  id: string;
  chessUsername: string;
  source: string;
  scanMode: string;
  gamesAnalyzed: number;
  estimatedAccuracy: number | null;
  estimatedRating: number | null;
  weightedCpLoss: number | null;
  severeLeakRate: number | null;
  leakCount: number | null;
  tacticsCount: number | null;
  leaks: Leak[];
  missedTactics: MissedTactic[];
  reportMeta: { topTag?: string; vibeTitle?: string } | null;
  createdAt: string;
};

type PlayerOption = { username: string; source: "lichess" | "chesscom" };

type PositionExample = {
  fenBefore: string;
  userMove: string;
  bestMove: string | null;
  cpLoss: number;
  openingName?: string;
  moveNumber: number;
  userColor: "white" | "black";
  tags: string[];
};

type WeaknessGroup = {
  tag: string;
  icon: string;
  count: number;
  coachNote: string;
  drillLink: string;
  drillLabel: string;
  examples: PositionExample[];
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

const SOURCE_LABEL: Record<
  string,
  { name: string; color: string; flag: string }
> = {
  chesscom: { name: "Chess.com", color: "text-emerald-400", flag: "♟️" },
  lichess: { name: "Lichess", color: "text-slate-300", flag: "🔥" },
};

/** Convert UCI move to SAN; fall back to UCI on failure */
function uciToSan(fen: string, uci: string): string {
  try {
    const chess = new Chess(fen);
    const move = chess.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci[4],
    });
    return move?.san ?? uci;
  } catch {
    return uci;
  }
}

/** Parse full move number from FEN (field 6) */
function moveNumberFromFen(fen: string): number {
  return parseInt(fen.split(" ")[5] ?? "1", 10);
}

const TAG_CONFIG: Record<
  string,
  { icon: string; coachNote: string; drillLink: string; drillLabel: string }
> = {
  "Tactical Miss": {
    icon: "⚔️",
    coachNote:
      "You missed tactical shots in these positions. The pattern to study: scan for checks, captures, and threats every move before your reply. These are forcing sequences where the correct move wins material or delivers a decisive advantage.",
    drillLink: "/tactics",
    drillLabel: "Tactic puzzles",
  },
  "Major Blunder": {
    icon: "💥",
    coachNote:
      "These are severe blunders — positions where a single move lost significant material or gave away a winning position. The common thread: moving without checking if your piece is hanging or if the opponent has a forcing reply.",
    drillLink: "/tactics",
    drillLabel: "Blunder prevention drills",
  },
  Crushing: {
    icon: "🚨",
    coachNote:
      "Critical moment failures. In each of these positions there was a game-changing move available. Develop the habit of pausing when the position feels sharp — these moments require extra calculation time.",
    drillLink: "/tactics",
    drillLabel: "Critical moment training",
  },
  "Missed Check": {
    icon: "✓",
    coachNote:
      "You played a passive move when you had a check available. Checks are forcing — they limit the opponent's options and often lead directly to material gain or mate. Always ask: 'Can I check?' before playing your move.",
    drillLink: "/tactics",
    drillLabel: "Forcing move drills",
  },
  "Missed Capture": {
    icon: "🎯",
    coachNote:
      "Free material was left on the board. These are positions where you missed a capture that wins a piece or pawn with no compensation for the opponent. Always scan for hanging pieces before deciding on a plan.",
    drillLink: "/tactics",
    drillLabel: "Tactical awareness",
  },
  "King Safety": {
    icon: "🛡️",
    coachNote:
      "Your king was left exposed in these positions. The best move prioritized king safety — whether by castling, blocking threats, or activating a defensive piece. King safety errors often snowball quickly.",
    drillLink: "/tactics",
    drillLabel: "King safety drills",
  },
  "Repeated Habit": {
    icon: "🔁",
    coachNote:
      "These mistakes appear repeatedly across multiple games — that makes them habits, not one-off errors. Habits require deliberate repetition to break. Drill the correct response until the right move feels automatic.",
    drillLink: "/train",
    drillLabel: "Break habits — drill mode",
  },
  "Pawn Endgame": {
    icon: "♙",
    coachNote:
      "Pawn endgames are won and lost by the distance of a tempo. Key principles: opposition (your king blocks the opponent's king), passed pawn advancement, and knowing when a pawn endgame is won vs drawn.",
    drillLink: "/endgames",
    drillLabel: "Pawn endgame drills",
  },
  "Rook Endgame": {
    icon: "♖",
    coachNote:
      "Rook endgames are the most common endgame type and the hardest to convert. The Lucena and Philidor positions are must-know. Rooks belong behind passed pawns — yours or the opponent's.",
    drillLink: "/endgames",
    drillLabel: "Rook endgame drills",
  },
  Endgame: {
    icon: "👑",
    coachNote:
      "Your accuracy drops in the endgame phase. The endgame is where calculated technique matters most — memorized patterns, king activation, and pawn structure all become critical when material is reduced.",
    drillLink: "/endgames",
    drillLabel: "Endgame technique",
  },
  "Center Control": {
    icon: "♟️",
    coachNote:
      "The center was given up unnecessarily in these positions. Central pawns limit the opponent's piece mobility and create space for your pieces. When the best move targets the center and you don't play it, you give up the initiative.",
    drillLink: "/openings",
    drillLabel: "Opening center control",
  },
  Opening: {
    icon: "🌲",
    coachNote:
      "Mistakes in the opening phase. These errors usually come from deviating into unfamiliar territory or playing automatic moves. Build a small, solid opening repertoire and understand the ideas behind each line rather than memorizing moves.",
    drillLink: "/openings",
    drillLabel: "Opening repertoire",
  },
  Fork: {
    icon: "🍴",
    coachNote:
      "Knight forks and pawn forks were missed repeatedly. A fork attacks two pieces simultaneously. The classic knight fork pattern: a knight on the 5th rank creates fork threats against king, queen, and rooks. Always check knight outpost squares.",
    drillLink: "/tactics",
    drillLabel: "Fork pattern drills",
  },
  Pin: {
    icon: "📌",
    coachNote:
      "Pins and skewers were missed in your games. A pin immobilizes a piece because moving it would expose a more valuable piece behind it. Recognize when your opponent's piece is aligned with a more valuable piece on a rank, file, or diagonal.",
    drillLink: "/tactics",
    drillLabel: "Pin & skewer tactics",
  },
  Skewer: {
    icon: "📌",
    coachNote:
      "Skewers — attacks on a high-value piece that force it to move, exposing a less valuable piece behind it. A skewer is like a reverse pin. Bishops and rooks on long diagonals and open files create skewer threats frequently.",
    drillLink: "/tactics",
    drillLabel: "Pin & skewer tactics",
  },
};

const DEFAULT_TAG_CONFIG = {
  icon: "📚",
  coachNote:
    "Study this recurring pattern to improve your game. Practice the correct responses until they become automatic.",
  drillLink: "/train",
  drillLabel: "Training drills",
};

/* ------------------------------------------------------------------ */
/*  Weakness group builder                                              */
/* ------------------------------------------------------------------ */

function buildWeaknessGroups(reports: SavedReport[]): WeaknessGroup[] {
  const tagPositions = new Map<string, PositionExample[]>();
  const tagRawCounts = new Map<string, number>();

  for (const r of reports) {
    for (const leak of r.leaks ?? []) {
      for (const tag of leak.tags ?? []) {
        tagRawCounts.set(tag, (tagRawCounts.get(tag) ?? 0) + 1);
        if (!tagPositions.has(tag)) tagPositions.set(tag, []);
        const arr = tagPositions.get(tag)!;
        if (arr.length < 3) {
          arr.push({
            fenBefore: leak.fenBefore,
            userMove: leak.userMove,
            bestMove: leak.bestMove,
            cpLoss: leak.cpLoss,
            openingName: leak.openingName,
            moveNumber: moveNumberFromFen(leak.fenBefore),
            userColor: leak.userColor ?? "white",
            tags: leak.tags ?? [],
          });
        }
      }
    }
    for (const tactic of r.missedTactics ?? []) {
      const tags = tactic.tags?.length
        ? tactic.tags
        : tactic.motif
          ? [tactic.motif]
          : ["Tactical Miss"];
      for (const tag of tags) {
        tagRawCounts.set(tag, (tagRawCounts.get(tag) ?? 0) + 1);
        if (!tagPositions.has(tag)) tagPositions.set(tag, []);
        const arr = tagPositions.get(tag)!;
        if (arr.length < 3) {
          arr.push({
            fenBefore: tactic.fenBefore,
            userMove: tactic.userMove,
            bestMove: tactic.bestMove,
            cpLoss: tactic.cpLoss,
            openingName: undefined,
            moveNumber:
              tactic.moveNumber ?? moveNumberFromFen(tactic.fenBefore),
            userColor: tactic.userColor ?? "white",
            tags,
          });
        }
      }
    }
  }

  const skipPhase = new Set(["Middlegame"]);
  const groups: WeaknessGroup[] = [];
  const usedFens = new Set<string>();

  const sorted = [...tagPositions.entries()].sort(
    (a, b) => (tagRawCounts.get(b[0]) ?? 0) - (tagRawCounts.get(a[0]) ?? 0),
  );

  for (const [tag, examples] of sorted) {
    if (groups.length >= 5) break;
    if (skipPhase.has(tag)) continue;
    const cfg = TAG_CONFIG[tag] ?? DEFAULT_TAG_CONFIG;
    const deduped = examples.filter((e) => !usedFens.has(e.fenBefore));
    if (deduped.length === 0) continue;
    deduped.forEach((e) => usedFens.add(e.fenBefore));
    groups.push({
      tag,
      icon: cfg.icon,
      count: tagRawCounts.get(tag) ?? examples.length,
      coachNote: cfg.coachNote,
      drillLink: cfg.drillLink,
      drillLabel: cfg.drillLabel,
      examples: deduped.slice(0, 3),
    });
  }

  return groups;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                      */
/* ------------------------------------------------------------------ */

function SourceBadge({ source }: { source: string }) {
  const s = SOURCE_LABEL[source] ?? {
    name: source,
    color: "text-slate-400",
    flag: "♟️",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${s.color}`}
    >
      {s.flag} {s.name}
    </span>
  );
}

function WeaknessBar({
  label,
  count,
  max,
}: {
  label: string;
  count: number;
  max: number;
}) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-500">{count}×</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/[0.06]">
        <div
          className="h-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function cpBadgeStyle(cpLoss: number): { label: string; color: string } {
  if (cpLoss >= 300)
    return { label: "Blunder", color: "bg-red-500/20 text-red-400" };
  if (cpLoss >= 100)
    return { label: "Mistake", color: "bg-amber-500/20 text-amber-400" };
  return { label: "Inaccuracy", color: "bg-slate-500/20 text-slate-400" };
}

function PositionCard({ example }: { example: PositionExample }) {
  const userSan = useMemo(
    () => uciToSan(example.fenBefore, example.userMove),
    [example.fenBefore, example.userMove],
  );
  const bestSan = useMemo(
    () =>
      example.bestMove ? uciToSan(example.fenBefore, example.bestMove) : null,
    [example.fenBefore, example.bestMove],
  );
  const badge = cpBadgeStyle(example.cpLoss);

  // Highlight squares: red for played move, green for best move
  const customSquareStyles: Record<string, React.CSSProperties> = {};
  if (example.userMove.length >= 4) {
    const from = example.userMove.slice(0, 2);
    const to = example.userMove.slice(2, 4);
    customSquareStyles[from] = { backgroundColor: "rgba(239,68,68,0.35)" };
    customSquareStyles[to] = { backgroundColor: "rgba(239,68,68,0.5)" };
  }
  if (example.bestMove && example.bestMove.length >= 4) {
    const bto = example.bestMove.slice(2, 4);
    // Only highlight best dest if different from played move dest
    if (bto !== example.userMove.slice(2, 4)) {
      customSquareStyles[bto] = { backgroundColor: "rgba(34,197,94,0.45)" };
    }
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      <div className="relative">
        <Chessboard
          position={example.fenBefore}
          boardOrientation={example.userColor}
          boardWidth={160}
          arePiecesDraggable={false}
          customSquareStyles={customSquareStyles}
          animationDuration={0}
        />
        <span
          className={`absolute right-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-bold ${badge.color}`}
        >
          {badge.label}
        </span>
      </div>
      <div className="p-3 space-y-1.5">
        <div className="text-[10px] text-slate-500 uppercase tracking-wide">
          Move {example.moveNumber} ·{" "}
          {example.userColor === "white" ? "White" : "Black"}
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-red-400 font-mono font-semibold">
            {userSan}
          </span>
          <span className="text-slate-600 text-[10px]">
            −{example.cpLoss}cp
          </span>
        </div>
        {bestSan && (
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 text-[10px]">Best:</span>
            <span className="text-emerald-400 font-mono font-semibold">
              {bestSan}
            </span>
          </div>
        )}
        {example.openingName && (
          <div
            className="text-[10px] text-slate-600 truncate"
            title={example.openingName}
          >
            {example.openingName}
          </div>
        )}
      </div>
    </div>
  );
}

function WeaknessGroupCard({
  group,
  index,
}: {
  group: WeaknessGroup;
  index: number;
}) {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-xl">{group.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-sm">
              {group.tag}
            </span>
            <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400">
              {group.count}×
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
            {group.coachNote.split(".")[0]}.
          </p>
        </div>
        <svg
          className={`h-4 w-4 flex-shrink-0 text-slate-500 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-white/[0.06] p-4 space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            {group.coachNote}
          </p>

          {group.examples.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                From Your Games
              </h4>
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                {group.examples.map((ex, i) => (
                  <PositionCard key={i} example={ex} />
                ))}
              </div>
            </div>
          )}

          <Link
            href={group.drillLink}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-500/10 border border-orange-500/20 px-4 py-2 text-sm font-medium text-orange-400 transition hover:bg-orange-500/20"
          >
            {group.icon} {group.drillLabel}
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}

const WEEK_SCHEDULE = [
  {
    week: 1,
    label: "Week 1 — Attack your worst pattern",
    color: "border-red-500/30 bg-red-500/5",
    description:
      "Focus entirely on your #1 weakness above. Do 20 puzzles from that category daily. Review the position examples before each session — recognize the pattern before it happens in a game.",
  },
  {
    week: 2,
    label: "Week 2 — Second weakness + game review",
    color: "border-amber-500/30 bg-amber-500/5",
    description:
      "Shift focus to your #2 pattern. Also re-scan your last 10 games to see if Week 1 improvements are showing in your accuracy score.",
  },
  {
    week: 3,
    label: "Week 3 — Mixed drilling",
    color: "border-blue-500/30 bg-blue-500/5",
    description:
      "Alternate between all identified weaknesses. Test yourself: play 5 games and count how often you reproduce each mistake. The goal is zero.",
  },
  {
    week: 4,
    label: "Week 4 — Full scan + maintenance",
    color: "border-emerald-500/30 bg-emerald-500/5",
    description:
      "Do a full FireChess scan to measure improvement. Accuracy and rating estimate should shift. Maintain gains with 10 daily puzzles going forward.",
  },
];

/* ------------------------------------------------------------------ */
/*  Main page                                                           */
/* ------------------------------------------------------------------ */

const LINKED_USER_KEY = "fc-profile-linked-user";

export default function ProfilePage() {
  const { loading: sessionLoading, authenticated, user } = useSession();
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkedUser, setLinkedUser] = useState<string>("");
  const [showPlan, setShowPlan] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (sessionLoading) return;
    if (!authenticated) {
      setLoading(false);
      return;
    }
    fetch("/api/reports")
      .then((r) => r.json())
      .then((data) => setReports(data.reports ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authenticated, sessionLoading]);

  const playerOptions = useMemo<PlayerOption[]>(() => {
    const seen = new Map<string, PlayerOption>();
    for (const r of reports) {
      const key = `${r.chessUsername}__${r.source}`;
      if (!seen.has(key))
        seen.set(key, {
          username: r.chessUsername,
          source: r.source as "lichess" | "chesscom",
        });
    }
    return Array.from(seen.values());
  }, [reports]);

  useEffect(() => {
    if (playerOptions.length === 0) return;
    const saved =
      typeof window !== "undefined"
        ? localStorage.getItem(LINKED_USER_KEY)
        : null;
    if (
      saved &&
      playerOptions.some((p) => `${p.username}__${p.source}` === saved)
    ) {
      setLinkedUser(saved);
    } else if (user?.name) {
      const match = playerOptions.find(
        (p) => p.username.toLowerCase() === user.name!.toLowerCase(),
      );
      setLinkedUser(
        match
          ? `${match.username}__${match.source}`
          : `${playerOptions[0].username}__${playerOptions[0].source}`,
      );
    } else {
      setLinkedUser(`${playerOptions[0].username}__${playerOptions[0].source}`);
    }
  }, [playerOptions, user?.name]);

  useEffect(() => {
    if (linkedUser && typeof window !== "undefined")
      localStorage.setItem(LINKED_USER_KEY, linkedUser);
  }, [linkedUser]);

  const profileName = linkedUser.split("__")[0] ?? "";
  const profileSource = linkedUser.split("__")[1] ?? "";

  const profileReports = useMemo(
    () =>
      reports.filter((r) => `${r.chessUsername}__${r.source}` === linkedUser),
    [reports, linkedUser],
  );

  const latestReport = profileReports[0] ?? null;

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of profileReports) {
      for (const leak of r.leaks ?? []) {
        for (const tag of leak.tags ?? [])
          counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return counts;
  }, [profileReports]);

  const topTags = useMemo(() => {
    const ignore = new Set(["Opening", "Middlegame", "Endgame"]);
    return [...tagCounts.entries()]
      .filter(([t]) => !ignore.has(t))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [tagCounts]);

  const maxTagCount = topTags[0]?.[1] ?? 1;

  const weaknessGroups = useMemo(
    () => (showPlan ? buildWeaknessGroups(profileReports) : []),
    [showPlan, profileReports],
  );

  const profileCompleteness = useMemo(() => {
    let score = 0;
    if (linkedUser) score += 25;
    const hasOpeningScan = profileReports.some(
      (r) => r.scanMode === "openings" || r.scanMode === "both",
    );
    const hasTacticsScan = profileReports.some((r) => r.scanMode === "tactics");
    const hasEndgameScan = profileReports.some(
      (r) => r.scanMode === "endgames",
    );
    if (hasOpeningScan) score += 25;
    if (hasTacticsScan) score += 25;
    if (hasEndgameScan) score += 25;
    return { score, hasOpeningScan, hasTacticsScan, hasEndgameScan };
  }, [linkedUser, profileReports]);

  function copyPlan() {
    const sourceName = SOURCE_LABEL[profileSource]?.name ?? profileSource;
    const lines = [
      `Chess Training Plan — ${profileName} (${sourceName})`,
      "Generated by FireChess — firechess.app",
      "",
      `Based on ${profileReports.reduce((s, r) => s + r.gamesAnalyzed, 0)} games across ${profileReports.length} scan(s).`,
      "",
    ];
    for (const group of weaknessGroups) {
      lines.push(`── ${group.tag} (${group.count}×) ──`);
      lines.push(group.coachNote);
      if (group.examples.length > 0) {
        lines.push("Example positions from your games:");
        for (const ex of group.examples) {
          const userSan = uciToSan(ex.fenBefore, ex.userMove);
          const bestSan = ex.bestMove
            ? uciToSan(ex.fenBefore, ex.bestMove)
            : null;
          lines.push(
            `  • Move ${ex.moveNumber}: played ${userSan} (−${ex.cpLoss}cp)${bestSan ? `, best was ${bestSan}` : ""}${ex.openingName ? ` — ${ex.openingName}` : ""}`,
          );
        }
      }
      lines.push(
        `Drill: ${group.drillLabel} — firechess.app${group.drillLink}`,
        "",
      );
    }
    lines.push("── 4-Week Schedule ──");
    for (const w of WEEK_SCHEDULE) {
      lines.push(`${w.label}: ${w.description}`);
    }
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  /* ── Empty states ── */

  if (!sessionLoading && !authenticated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
        <div className="text-5xl">♟️</div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Chess Profile</h1>
          <p className="mt-2 text-slate-400">
            Sign in to build your chess profile and generate lesson plans.
          </p>
        </div>
        <Link
          href="/auth/signin"
          className="rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="text-5xl">📡</div>
        <div>
          <h1 className="text-2xl font-bold text-white">
            Build Your Chess Profile
          </h1>
          <p className="mt-2 text-slate-400">
            Scan your games first — FireChess will analyze your mistakes and
            build a profile automatically.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Scan My Games
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-white">Chess Profile</h1>
        <p className="mt-1 text-sm text-slate-400">
          Your linked identity, weakness breakdown and coach-ready lesson plan.
        </p>
      </div>

      {/* ── Player Picker ── */}
      <div className="glass-card space-y-4 p-6">
        <h2 className="text-base font-semibold text-white">Linked Player</h2>
        <p className="text-sm text-slate-400">
          Select which scanned username represents you. Lesson plans are
          generated for this profile.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {playerOptions.map((p) => {
            const key = `${p.username}__${p.source}`;
            const isSelected = linkedUser === key;
            const count = reports.filter(
              (r) => `${r.chessUsername}__${r.source}` === key,
            ).length;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setLinkedUser(key);
                  setShowPlan(false);
                }}
                className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                  isSelected
                    ? "border-orange-500/50 bg-orange-500/10 ring-1 ring-orange-500/30"
                    : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]"
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-xl ${isSelected ? "bg-orange-500/20" : "bg-white/[0.06]"}`}
                >
                  {SOURCE_LABEL[p.source]?.flag ?? "♟️"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-white">
                    {p.username}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <SourceBadge source={p.source} />
                    <span className="text-xs text-slate-500">
                      {count} scan{count !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                {isSelected && (
                  <svg
                    className="h-5 w-5 flex-shrink-0 text-orange-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Profile Completeness ── */}
      {linkedUser && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">
              Profile Completeness
            </h2>
            <span
              className={`text-sm font-bold ${profileCompleteness.score >= 100 ? "text-emerald-400" : profileCompleteness.score >= 50 ? "text-amber-400" : "text-orange-400"}`}
            >
              {profileCompleteness.score}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/[0.06]">
            <div
              className={`h-2 rounded-full transition-all duration-700 ${profileCompleteness.score >= 100 ? "bg-emerald-500" : "bg-gradient-to-r from-orange-500 to-amber-400"}`}
              style={{ width: `${profileCompleteness.score}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
            {[
              { label: "Linked player", done: !!linkedUser, link: null },
              {
                label: "Opening scan",
                done: profileCompleteness.hasOpeningScan,
                link: "/",
              },
              {
                label: "Tactics scan",
                done: profileCompleteness.hasTacticsScan,
                link: "/",
              },
              {
                label: "Endgame scan",
                done: profileCompleteness.hasEndgameScan,
                link: "/",
              },
            ].map((step) => (
              <div
                key={step.label}
                className={`flex items-center gap-2 rounded-lg p-3 ${step.done ? "bg-emerald-500/10" : "bg-white/[0.03]"}`}
              >
                <span
                  className={step.done ? "text-emerald-400" : "text-slate-600"}
                >
                  {step.done ? "✓" : "○"}
                </span>
                <span
                  className={step.done ? "text-emerald-300" : "text-slate-500"}
                >
                  {step.label}
                </span>
                {!step.done && step.link && (
                  <Link
                    href={step.link}
                    className="ml-auto text-xs text-orange-400 hover:underline"
                  >
                    Scan →
                  </Link>
                )}
              </div>
            ))}
          </div>
          {profileCompleteness.score < 100 && (
            <p className="text-xs text-slate-500">
              Complete all scan types for a fuller lesson plan.
            </p>
          )}
        </div>
      )}

      {/* ── Stats summary ── */}
      {latestReport && (
        <div className="glass-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">
              Profile Stats
            </h2>
            <span className="text-xs text-slate-500">
              Based on {profileReports.length} scan
              {profileReports.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              {
                label: "Accuracy",
                value:
                  latestReport.estimatedAccuracy != null
                    ? `${Math.round(latestReport.estimatedAccuracy)}%`
                    : "—",
                color: "text-emerald-400",
              },
              {
                label: "Est. Rating",
                value:
                  latestReport.estimatedRating != null
                    ? Math.round(latestReport.estimatedRating).toString()
                    : "—",
                color: "text-blue-400",
              },
              {
                label: "Avg CP Loss",
                value:
                  latestReport.weightedCpLoss != null
                    ? Math.round(latestReport.weightedCpLoss).toString()
                    : "—",
                color: "text-amber-400",
              },
              {
                label: "Games Scanned",
                value: profileReports
                  .reduce((s, r) => s + r.gamesAnalyzed, 0)
                  .toString(),
                color: "text-slate-300",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl bg-white/[0.03] p-4 text-center"
              >
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="mt-1 text-xs text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
          {topTags.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-300">
                Top Weaknesses
              </h3>
              <div className="space-y-2.5">
                {topTags.map(([tag, count]) => (
                  <WeaknessBar
                    key={tag}
                    label={tag}
                    count={count}
                    max={maxTagCount}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Lesson Plan ── */}
      <div className="glass-card p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">Lesson Plan</h2>
            <p className="mt-1 text-sm text-slate-400">
              Coach-style breakdown of your weaknesses with positions from your
              actual games.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {showPlan && weaknessGroups.length > 0 && (
              <button
                type="button"
                onClick={copyPlan}
                className="flex items-center gap-1.5 rounded-xl border border-white/[0.12] bg-white/[0.04] px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-white/[0.2] hover:text-white"
              >
                {copied ? (
                  <>
                    <svg
                      className="h-4 w-4 text-emerald-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy for coach
                  </>
                )}
              </button>
            )}
            {!showPlan && (
              <button
                type="button"
                onClick={() => setShowPlan(true)}
                disabled={profileReports.length === 0}
                className="rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Generate Plan
              </button>
            )}
          </div>
        </div>

        {showPlan && (
          <>
            {weaknessGroups.length === 0 ? (
              <p className="text-sm text-slate-500">
                Not enough data yet. Scan more games to generate a full plan.
              </p>
            ) : (
              <div className="space-y-6">
                {/* Weakness breakdown with positions */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Your Weaknesses
                  </h3>
                  <div className="space-y-2">
                    {weaknessGroups.map((group, i) => (
                      <WeaknessGroupCard
                        key={group.tag}
                        group={group}
                        index={i}
                      />
                    ))}
                  </div>
                </div>

                {/* 4-week schedule */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    4-Week Training Schedule
                  </h3>
                  <div className="space-y-2">
                    {WEEK_SCHEDULE.map((w) => (
                      <div
                        key={w.week}
                        className={`rounded-xl border p-4 ${w.color}`}
                      >
                        <div className="font-semibold text-white text-sm">
                          {w.label}
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                          {w.description}
                        </p>
                        {w.week <= weaknessGroups.length && (
                          <Link
                            href={
                              weaknessGroups[w.week - 1]?.drillLink ?? "/train"
                            }
                            className="mt-2 inline-flex items-center gap-1 text-xs text-orange-400 hover:underline"
                          >
                            {weaknessGroups[w.week - 1]?.icon} Start:{" "}
                            {weaknessGroups[w.week - 1]?.drillLabel ??
                              "training"}{" "}
                            →
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-600">
                  Plan based on{" "}
                  {profileReports.reduce((s, r) => s + (r.leakCount ?? 0), 0)}{" "}
                  mistakes across{" "}
                  {profileReports.reduce((s, r) => s + r.gamesAnalyzed, 0)}{" "}
                  games.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
