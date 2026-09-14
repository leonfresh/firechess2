"use client";

/**
 * Opening Sparring + Engine Assist.
 *
 * Two modes share one game loop:
 *
 *  - "sparring": play against weighted Lichess database moves.
 *  - "assist": the same opponent, plus an Engine Assist panel you can open on
 *    your turn to see what the engine would play against the opponent's last
 *    move (top 3 lines + arrow). Every move is logged assisted or solo, and the
 *    summary splits your accuracy — the honest answer to "how much of my chess
 *    is me?". Solo moves are still ranked against the engine's top lines, which
 *    is where the "you matched the engine 4/11 times unaided" stat comes from.
 *
 * Flow:
 *  1. User picks their color, a target rating (e.g. 1800) and a mode.
 *  2. Each opponent turn: fetch /api/sparring-move, pick a move via weighted
 *     random sampling, validate it isn't a blunder with quick Stockfish eval.
 *  3. When book runs out or after move 20, offer to continue vs. Stockfish
 *     at the appropriate depth for the target rating.
 *  4. After the session, show a motif summary of what happened.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "@/components/chessboard-compat";
import { EvalBar } from "@/components/eval-bar";
import { EngineAssistPanel } from "@/components/engine-assist-panel";
import { MoveBadge } from "@/components/move-badge";
import { playSound } from "@/lib/sounds";
import { stockfishPool, type LocalEngineLine } from "@/lib/stockfish-client";
import {
  classifyMoveQuality,
  MOVE_CLASSIFICATION_BORDER,
  MOVE_CLASSIFICATION_BG,
  MOVE_CLASSIFICATION_COLORS,
  MOVE_CLASSIFICATION_LABELS,
  type MoveClassification,
} from "@/lib/move-quality";
import { explainMoves } from "@/lib/position-explainer";
import {
  useBoardTheme,
  useShowCoordinates,
  useCustomPieces,
} from "@/lib/use-coins";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type Color = "white" | "black";

type MoveCandidate = {
  uci: string;
  san: string;
  games: number;
  winRate: number;
  averageRating: number;
  white: number;
  draws: number;
  black: number;
};

type SparringMoveResponse =
  | { outOfBook: true; reason?: string; totalGames?: number }
  | {
      outOfBook: false;
      candidates: MoveCandidate[];
      totalGames: number;
      targetRating: number;
    };

type Mode = "sparring" | "assist";

type MoveRecord = {
  san: string;
  uci: string;
  fenBefore: string; // FEN before the move
  fen: string; // FEN after the move
  byUser: boolean;
  cpLoss?: number;
  /** White-relative Stockfish eval before/after the move (for coaching) */
  evalBefore?: number;
  evalAfter?: number;
  bestMoveUci?: string | null;
  bookCandidate?: MoveCandidate | null;
  /** Canonical classification (undefined when evals were unavailable) */
  quality?: MoveClassification;
  /** Assist mode: was the engine panel open/used during this turn? */
  assisted?: boolean;
  /** Assist mode: 1-based rank of the played move in the pre-move top lines.
   *  null = lines were known but the move wasn't in them, undefined = unknown. */
  engineTop?: number | null;
};

type Phase =
  | "setup"
  | "playing"
  | "out-of-book-prompt"
  | "stockfish"
  | "gameover";

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * Convert a target ELO to a Stockfish search depth.
 * Rough mapping — lower depth = more mistakes.
 */
function ratingToDepth(rating: number): number {
  if (rating < 800) return 1;
  if (rating < 1000) return 2;
  if (rating < 1200) return 3;
  if (rating < 1400) return 5;
  if (rating < 1600) return 7;
  if (rating < 1800) return 9;
  if (rating < 2000) return 11;
  if (rating < 2200) return 13;
  if (rating < 2500) return 15;
  return 18;
}

/**
 * Weighted random pick from candidates.
 * Candidates with more games are proportionally more likely to be chosen.
 */
function weightedPick(candidates: MoveCandidate[]): MoveCandidate {
  const total = candidates.reduce((s, c) => s + c.games, 0);
  let rand = Math.random() * total;
  for (const c of candidates) {
    rand -= c.games;
    if (rand <= 0) return c;
  }
  return candidates[candidates.length - 1];
}

/**
 * Blunder threshold: reject a candidate if its eval drop is worse than
 * this many centipawns compared to the best engine move.
 * Scales with rating — weaker players allow slightly worse moves.
 */
function blunderThreshold(rating: number): number {
  if (rating < 1200) return 250;
  if (rating < 1600) return 180;
  if (rating < 2000) return 120;
  return 80;
}

/** Format a centipawn loss as "+X.XX" style */
function fmtCp(cp: number): string {
  return (cp / 100).toFixed(2);
}

/* ---------------------------- Assist tuning ---------------------------- */

/** Engine lines shown in the assist panel */
const ASSIST_LINES = 3;
/** Assist search depth — fast enough to prefetch while the user is thinking */
const ASSIST_DEPTH = 12;
/** Peek budget choices in setup (null = unlimited, the default) */
const PEEK_BUDGETS: Array<{ label: string; value: number | null }> = [
  { label: "Unlimited", value: null },
  { label: "5 peeks", value: 5 },
  { label: "3 peeks", value: 3 },
  { label: "1 peek", value: 1 },
];
/** A move counts as "ignoring the engine" when it drops this much with the panel open */
const IGNORED_ENGINE_CP = 90;
/**
 * Minimum analysed moves per bucket before we put a rating estimate on screen.
 * Two moves cannot support a strength claim — below this the card says so.
 */
const MIN_SAMPLE_MOVES = 5;

/**
 * Coarse strength read from the average centipawn loss of ONE game.
 * Anchors (ACPL → rating, published accuracy bands): ~110→800, ~70→1200,
 * ~45→1600, ~32→2000, fitted as rating ≈ 5370 − 2239·log10(cpl), clamped.
 * One game is a tiny sample: the assisted-vs-solo DELTA is the signal, the
 * absolute number is a rough band.
 */
function estimateStrengthFromCpLoss(avgCpLoss: number | null): number | null {
  if (avgCpLoss === null) return null;
  const cpl = Math.max(8, avgCpLoss);
  const rating = 5370 - 2239 * Math.log10(cpl);
  return Math.round(Math.min(2400, Math.max(400, rating)));
}

/** Evaluate a position and return cp from sideToMove's perspective */
async function evalPosition(
  fen: string,
  depth: number,
): Promise<number | null> {
  const result = await stockfishPool.evaluateFen(fen, depth);
  if (!result) return null;
  // chess.js FEN encodes side to move; cp is always from white's perspective in SF
  // We flip for black since Stockfish always gives white-relative cp
  const chess = new Chess(fen);
  const sideToMove = chess.turn();
  return sideToMove === "w" ? result.cp : -result.cp;
}

/* ------------------------------------------------------------------ */
/*  Move quality                                                       */
/* ------------------------------------------------------------------ */

/**
 * Canonical classifier (lib/move-quality.ts) — same language as /coach,
 * /daily and the report page. Falls back to null when evals are missing.
 */
function classifyRecord(args: {
  cpLoss: number | undefined;
  isBestMove: boolean;
  evalBeforeMover: number | undefined;
  evalAfterMover: number | undefined;
  fenBefore: string;
  moveUci: string;
  moveIndex: number;
}): MoveClassification | null {
  const { cpLoss, isBestMove, evalBeforeMover, evalAfterMover } = args;
  if (cpLoss === undefined || evalBeforeMover === undefined || evalAfterMover === undefined) {
    return null;
  }
  try {
    return classifyMoveQuality({
      cpLoss,
      isBestMove,
      evalBeforeMover,
      evalAfterMover,
      fenBefore: args.fenBefore,
      moveUci: args.moveUci,
      moveIndex: args.moveIndex,
    });
  } catch {
    return null;
  }
}

/** Themes that are genuinely instructive for the player (excludes metadata like phase, check, etc.) */
const COACHING_THEMES = new Set([
  "Hanging Piece",
  "Hangs Material",
  "Trapped Piece",
  "Weakening Move",
  "Walks Into Fork",
  "Walks Into Pin",
  "Back-Rank Mate Threat",
  "Exposed King",
  "Losing Exchange",
  "Back Rank",
  "Knight Fork",
  "Skewer",
  "Passive Retreat",
  "King Exposure",
  "Pin",
  "Discovered Attack",
  "X-Ray Attack",
]);

const COACHING_THEME_ICONS: Record<string, string> = {
  "Hanging Piece": "💀",
  "Hangs Material": "💀",
  "Trapped Piece": "🪤",
  "Weakening Move": "🏚️",
  "Walks Into Fork": "🍴",
  "Walks Into Pin": "📌",
  "Back-Rank Mate Threat": "🏰",
  "Back Rank": "🏰",
  "Exposed King": "🔓",
  "King Exposure": "👑",
  "Losing Exchange": "📉",
  "Passive Retreat": "🐢",
  "Knight Fork": "♞",
  Skewer: "🎯",
  Pin: "📌",
  "Discovered Attack": "⚡",
  "X-Ray Attack": "🔭",
};

/**
 * Cluster positional themes across all user moves to surface recurring patterns.
 * Uses `explainMoves` (pure chess.js, no Stockfish) — fast enough for ~30 moves.
 */
function computeSessionMotifs(
  moves: MoveRecord[],
): Array<{ name: string; count: number; avgCpLoss: number }> {
  const themeCounts = new Map<string, { count: number; totalLoss: number }>();

  for (const m of moves) {
    if (!m.byUser || (m.cpLoss ?? 0) < 30) continue;
    if (m.evalBefore === undefined || m.evalAfter === undefined) continue;
    try {
      const insight = explainMoves(
        m.fenBefore,
        m.uci,
        m.bestMoveUci ?? null,
        m.cpLoss ?? 0,
        m.evalBefore,
        m.evalAfter,
      );
      for (const theme of insight.played.themes) {
        if (!COACHING_THEMES.has(theme)) continue;
        const existing = themeCounts.get(theme);
        if (existing) {
          existing.count++;
          existing.totalLoss += m.cpLoss ?? 0;
        } else {
          themeCounts.set(theme, { count: 1, totalLoss: m.cpLoss ?? 0 });
        }
      }
    } catch {
      /* best-effort */
    }
  }

  return [...themeCounts.entries()]
    .map(([name, v]) => ({
      name,
      count: v.count,
      avgCpLoss: v.totalLoss / v.count,
    }))
    .sort((a, b) => b.count - a.count || b.avgCpLoss - a.avgCpLoss)
    .slice(0, 6);
}

/* ------------------------------------------------------------------ */
/*  Main component                                                       */
/* ------------------------------------------------------------------ */

export default function OpeningSparring({
  initialMode = "sparring",
}: {
  initialMode?: Mode;
} = {}) {
  // ----- setup state -----
  const [mode, setMode] = useState<Mode>(initialMode);
  const [userColor, setUserColor] = useState<Color>("white");
  const [targetRating, setTargetRating] = useState(1500);
  const [peekBudget, setPeekBudget] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("setup");
  const assistMode = mode === "assist";

  // ----- game state -----
  const chessRef = useRef(new Chess());
  const [fen, setFen] = useState(chessRef.current.fen());
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(
    null,
  );
  const [isOpponentThinking, setIsOpponentThinking] = useState(false);
  const [evalCp, setEvalCp] = useState<number | null>(null);
  const [bookMoveCount, setBookMoveCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [promotionPending, setPromotionPending] = useState<{
    from: string;
    to: string;
  } | null>(null);

  // ----- engine-assist state -----
  const [assistOpen, setAssistOpen] = useState(false);
  /**
   * Engine lines are stored WITH the FEN they were computed for — a line list
   * is only ever rendered against its own position (a PV from another position
   * is illegal on the board and would throw).
   */
  const [assistLines, setAssistLines] = useState<{
    fen: string;
    lines: LocalEngineLine[];
  } | null>(null);
  const [assistLoading, setAssistLoading] = useState(false);
  const [previewUci, setPreviewUci] = useState<string | null>(null);
  const [peeksUsed, setPeeksUsed] = useState(0);
  /** Pre-analysed lines per FEN — powers instant peeks + unaided move ranking */
  const linesCacheRef = useRef(new Map<string, LocalEngineLine[]>());
  /** Set while the engine panel has been open at any point during this turn */
  const assistedThisTurnRef = useRef(false);

  /** Lines that belong to the position currently on the board */
  const currentLines = assistLines?.fen === fen ? assistLines.lines : null;

  /** Classification for the piece badge on the last user move's destination */
  const [pieceBadge, setPieceBadge] = useState<{
    square: string;
    quality: MoveClassification;
  } | null>(null);

  /** Coaching insight for the most recent user move */
  const [lastMoveInsight, setLastMoveInsight] = useState<{
    quality: MoveClassification | null;
    cpLoss: number;
    headline: string;
    coaching: string;
    themes: string[];
    bestMoveSan: string | null;
  } | null>(null);

  // board cosmetics
  const boardTheme = useBoardTheme();
  const showCoords = useShowCoordinates();
  const customPieces = useCustomPieces();

  /* ------------------------------------------------------------------ */
  /*  Responsive board sizing — measures the flexible stage, not the     */
  /*  fixed-px board div (circular measurement leaves it stuck).         */
  /* ------------------------------------------------------------------ */

  const stageRef = useRef<HTMLDivElement>(null);
  const [boardSize, setBoardSize] = useState(480);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => {
      const vw = window.innerWidth;
      const vh = window.visualViewport?.height ?? window.innerHeight;
      const avail = el.clientWidth - 36; // eval bar 24 + gap 12
      // reserve navbar + page header + player rows + paddings
      const byHeight = vh - (vw >= 1024 ? 300 : 330);
      setBoardSize(Math.max(280, Math.min(avail, byHeight)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [phase, mode]);

  /* ------------------------------------------------------------------ */
  /*  Fetch & play opponent move                                           */
  /* ------------------------------------------------------------------ */

  const playOpponentMove = useCallback(
    async (currentFen: string, chess: Chess) => {
      setIsOpponentThinking(true);
      const sideToMove: Color = chess.turn() === "w" ? "white" : "black";

      try {
        // 1. Try book move
        const res = await fetch(
          `/api/sparring-move?fen=${encodeURIComponent(currentFen)}&rating=${targetRating}&sideToMove=${sideToMove}`,
        );
        const data: SparringMoveResponse = await res.json();

        if (!data.outOfBook && data.candidates.length > 0) {
          // --- In-book phase ---
          const candidates = data.candidates;
          const totalGames = data.totalGames;
          const threshold = blunderThreshold(targetRating);

          /**
           * Protect any move that accounts for >= 12% of total games at this
           * rating. If 20% of 1500-rated players really do hang a pawn here,
           * the opponent should hang it 20% of the time — that's authentic.
           * Only filter moves that are BOTH rarely played AND a big blunder.
           */
          const PROTECT_RATIO = 0.12;

          // Single multi-PV call — one Stockfish request covers all candidates
          const engineLines = await stockfishPool.getTopMoves(
            currentFen,
            Math.min(candidates.length + 5, 20),
            8,
          );

          // Build UCI → engine cp map (cp from side-to-move's perspective)
          const engineCpMap = new Map<string, number>();
          for (const line of engineLines) {
            if (line.bestMove) engineCpMap.set(line.bestMove, line.cp);
          }
          const bestEngineCp = engineLines[0]?.cp ?? null;

          const pool: MoveCandidate[] = [];
          for (const candidate of candidates) {
            const share = candidate.games / Math.max(1, totalGames);

            // Always include heavily-played moves regardless of eval
            if (share >= PROTECT_RATIO) {
              pool.push(candidate);
              continue;
            }

            // No engine data — accept anything with at least 3% of games
            if (bestEngineCp === null) {
              if (share >= 0.03) pool.push(candidate);
              continue;
            }

            const moveCp = engineCpMap.get(candidate.uci);
            if (moveCp === undefined) {
              // Not in engine's top N — keep if it has at least 3% game share
              if (share >= 0.03) pool.push(candidate);
              continue;
            }

            // Filter only if it's a big blunder AND rarely played
            const cpLoss = bestEngineCp - moveCp;
            if (cpLoss <= threshold) pool.push(candidate);
          }

          // Always have something to pick from
          const finalPool = pool.length > 0 ? pool : candidates.slice(0, 3);
          const chosen = weightedPick(finalPool);

          // Play the move
          const move = chess.move(chosen.uci, { strict: false });
          if (!move) {
            // Shouldn't happen but fall back to Stockfish
            setPhase("out-of-book-prompt");
            setIsOpponentThinking(false);
            return;
          }

          const newFen = chess.fen();
          setFen(newFen);
          setLastMove({ from: move.from, to: move.to });
          setBookMoveCount((n) => n + 1);
          setStatusMessage(
            `Opponent played ${move.san} (${chosen.games.toLocaleString()} games, ${Math.round(chosen.winRate * 100)}% win rate)`,
          );
          setMoveHistory((prev) => [
            ...prev,
            {
              san: move.san,
              uci: chosen.uci,
              fenBefore: currentFen,
              fen: newFen,
              byUser: false,
              bookCandidate: chosen,
            },
          ]);

          playSound(move.captured ? "capture" : "move");

          // Quick async eval update for eval bar
          evalPosition(newFen, 10).then((cp) => {
            if (cp !== null) setEvalCp(cp);
          });

          if (chess.isGameOver()) {
            setPhase("gameover");
          }
        } else {
          // --- Out of book ---
          setPhase("out-of-book-prompt");
        }
      } catch {
        setPhase("out-of-book-prompt");
      } finally {
        setIsOpponentThinking(false);
      }
    },
    [targetRating],
  );

  /* ------------------------------------------------------------------ */
  /*  Stockfish opponent move                                             */
  /* ------------------------------------------------------------------ */

  const playStockfishMove = useCallback(
    async (currentFen: string, chess: Chess) => {
      setIsOpponentThinking(true);
      const depth = ratingToDepth(targetRating);

      try {
        const result = await stockfishPool.evaluateFen(currentFen, depth);
        if (!result?.bestMove) {
          setPhase("gameover");
          return;
        }

        const move = chess.move(result.bestMove, { strict: false });
        if (!move) {
          setPhase("gameover");
          return;
        }

        const newFen = chess.fen();
        setFen(newFen);
        setLastMove({ from: move.from, to: move.to });
        setStatusMessage(`Stockfish (depth ${depth}) played ${move.san}`);
        setMoveHistory((prev) => [
          ...prev,
          {
            san: move.san,
            uci: result.bestMove!,
            fenBefore: currentFen,
            fen: newFen,
            byUser: false,
            bookCandidate: null,
          },
        ]);

        playSound(move.captured ? "capture" : "move");
        setEvalCp(null); // will update asynchronously

        evalPosition(newFen, 10).then((cp) => {
          if (cp !== null) setEvalCp(cp);
        });

        if (chess.isGameOver()) setPhase("gameover");
      } finally {
        setIsOpponentThinking(false);
      }
    },
    [targetRating],
  );

  /* ------------------------------------------------------------------ */
  /*  Handle opponent turn                                                */
  /* ------------------------------------------------------------------ */

  const triggerOpponentTurn = useCallback(
    (currentFen: string, chess: Chess, currentPhase: Phase) => {
      if (currentPhase === "playing") {
        playOpponentMove(currentFen, chess);
      } else if (currentPhase === "stockfish") {
        playStockfishMove(currentFen, chess);
      }
    },
    [playOpponentMove, playStockfishMove],
  );

  /* ------------------------------------------------------------------ */
  /*  Engine assist                                                       */
  /* ------------------------------------------------------------------ */

  const isUserTurn =
    (phase === "playing" || phase === "stockfish") &&
    chessRef.current.turn() === (userColor === "white" ? "w" : "b") &&
    !isOpponentThinking &&
    !chessRef.current.isGameOver();

  const peeksLeft =
    peekBudget === null ? null : Math.max(0, peekBudget - peeksUsed);
  const canPeek = peeksLeft === null || peeksLeft > 0;

  /**
   * Pre-analyse the user's position the moment the turn lands, so a peek is
   * instant (like a second monitor) and every move — peeked or not — can be
   * ranked against the engine's top lines afterwards.
   */
  useEffect(() => {
    if (!assistMode) return;
    if (phase !== "playing" && phase !== "stockfish") return;
    if (!isUserTurn) return;
    const currentFen = fen;
    const cached = linesCacheRef.current.get(currentFen);
    if (cached) {
      setAssistLines({ fen: currentFen, lines: cached });
      return;
    }
    let cancelled = false;
    setAssistLoading(true);
    stockfishPool
      .getTopMoves(currentFen, ASSIST_LINES, ASSIST_DEPTH)
      .then((lines) => {
        // Cache even if the turn already moved on — the analysis is still valid
        // for this FEN and the next visit should be instant.
        linesCacheRef.current.set(currentFen, lines);
        if (cancelled) return;
        setAssistLines({ fen: currentFen, lines });
      })
      .catch(() => {
        /* degrade quietly — the panel shows "no lines" */
      })
      .finally(() => {
        if (!cancelled) setAssistLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [assistMode, fen, isUserTurn, phase]);

  /** A turn that begins with the panel still open counts as assisted. */
  useEffect(() => {
    if (!assistMode) return;
    if (isUserTurn && assistOpen) assistedThisTurnRef.current = true;
  }, [assistMode, isUserTurn, assistOpen, fen]);

  /** Default the board arrow to the engine's first choice once lines land. */
  useEffect(() => {
    if (!assistOpen || previewUci) return;
    const first = currentLines?.[0]?.bestMove;
    if (first) setPreviewUci(first);
  }, [assistOpen, currentLines, previewUci]);

  const handleAssistToggle = useCallback(() => {
    if (assistOpen) {
      setAssistOpen(false);
      setPreviewUci(null);
      return;
    }
    if (!canPeek) return;
    setAssistOpen(true);
    setPreviewUci(currentLines?.[0]?.bestMove ?? null);
    setPeeksUsed((n) => n + 1);
    assistedThisTurnRef.current = true;
  }, [assistOpen, canPeek, currentLines]);

  const handleSelectLine = useCallback((uci: string) => {
    setPreviewUci((prev) => (prev === uci ? null : uci));
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Handle user move                                                    */
  /* ------------------------------------------------------------------ */

  const handleUserMove = useCallback(
    async (from: string, to: string, promotion?: string) => {
      const chess = chessRef.current;
      if (chess.turn() !== (userColor === "white" ? "w" : "b")) return;
      if (phase !== "playing" && phase !== "stockfish") return;

      // Clear previous move badge when starting a new move
      setPieceBadge(null);

      /** Read BEFORE the reset below — decides assisted vs solo for this move */
      const assistedTurn = assistedThisTurnRef.current;

      // Capture FEN before the move for eval comparison
      const prevFen = chess.fen();

      const uci = `${from}${to}${promotion ?? ""}`;

      // Try the move
      let move;
      try {
        move = chess.move({ from, to, promotion: promotion ?? "q" });
      } catch {
        return;
      }
      if (!move) return;

      setSelectedSquare(null);
      setLegalMoves([]);

      const newFen = chess.fen();
      setFen(newFen);
      setLastMove({ from: move.from, to: move.to });
      // The peek was for THIS turn only — close the panel before any await, so
      // the UI never shows the previous position's lines next to a new board.
      assistedThisTurnRef.current = false;
      setAssistOpen(false);
      setPreviewUci(null);
      playSound(move.captured ? "capture" : "move");
      if (chess.inCheck()) playSound("check");

      // Async: eval + coaching insight (non-blocking)
      let cpLoss: number | undefined;
      let evalBefore: number | undefined;
      let evalAfter: number | undefined;
      let bestMoveUci: string | null = null;
      let quality: MoveClassification | null = null;

      // Assist bookkeeping — was the engine panel used this turn, and where
      // does the played move rank in the pre-move top lines?
      const preLines = linesCacheRef.current.get(prevFen) ?? null;
      const rankedAt = preLines
        ? preLines.findIndex((l) => l.bestMove === uci)
        : -1;
      const engineTop: number | null | undefined = preLines
        ? rankedAt >= 0
          ? rankedAt + 1
          : null
        : undefined;
      const assisted = assistedTurn;
      const moveIndex = moveHistory.length;

      try {
        const [beforeResult, afterResult] = await Promise.all([
          stockfishPool.evaluateFen(prevFen, 10),
          stockfishPool.evaluateFen(newFen, 10),
        ]);

        if (beforeResult && afterResult) {
          evalBefore = beforeResult.cp; // from mover's perspective
          evalAfter = afterResult.cp; // from opponent's perspective (after the move)
          bestMoveUci = beforeResult.bestMove ?? null;
          // Negate evalAfter because after the move it's opponent's turn — cp flips perspective
          cpLoss = Math.max(0, evalBefore - -evalAfter);

          quality = classifyRecord({
            cpLoss,
            isBestMove: !!bestMoveUci && bestMoveUci === uci,
            evalBeforeMover: evalBefore,
            evalAfterMover: -evalAfter,
            fenBefore: prevFen,
            moveUci: uci,
            moveIndex,
          });

          // Synchronous coaching insight (pure chess.js — no extra Stockfish calls)
          try {
            const insight = explainMoves(
              prevFen,
              uci,
              bestMoveUci,
              cpLoss,
              evalBefore,
              evalAfter,
            );
            const coachingThemes = insight.played.themes.filter((t) =>
              COACHING_THEMES.has(t),
            );

            let bestMoveSan: string | null = null;
            if (bestMoveUci && cpLoss >= 40) {
              try {
                const tmp = new Chess(prevFen);
                const r = tmp.move(bestMoveUci, { strict: false });
                bestMoveSan = r?.san ?? null;
              } catch {
                /* ignore */
              }
            }

            setLastMoveInsight({
              quality,
              cpLoss,
              headline: insight.played.headline,
              coaching:
                cpLoss >= 50
                  ? (insight.played.takeaway ??
                    insight.played.coaching.split(". ")[0] + ".")
                  : "",
              themes: coachingThemes,
              bestMoveSan,
            });
          } catch {
            /* not critical */
          }
          // Set quality badge regardless of whether coaching insight succeeded
          if (quality) setPieceBadge({ square: move.to, quality });
        }
      } catch {
        // Not critical
      }

      // Update eval bar immediately after user's move (white-relative)
      evalPosition(newFen, 10).then((cp) => {
        if (cp !== null) setEvalCp(cp);
      });

      setMoveHistory((prev) => [
        ...prev,
        {
          san: move.san,
          uci,
          fenBefore: prevFen,
          fen: newFen,
          byUser: true,
          cpLoss,
          evalBefore,
          evalAfter,
          bestMoveUci,
          quality: quality ?? undefined,
          assisted,
          engineTop,
        },
      ]);

      if (chess.isGameOver()) {
        setPhase("gameover");
        return;
      }

      setStatusMessage("Opponent is thinking…");
      triggerOpponentTurn(newFen, chess, phase);
    },
    [phase, userColor, moveHistory, triggerOpponentTurn],
  );

  /* ------------------------------------------------------------------ */
  /*  Board interaction                                                   */
  /* ------------------------------------------------------------------ */

  const handleSquareClick = useCallback(
    (square: string) => {
      const chess = chessRef.current;
      if (chess.turn() !== (userColor === "white" ? "w" : "b")) return;
      if (phase !== "playing" && phase !== "stockfish") return;
      if (isOpponentThinking) return;

      if (selectedSquare) {
        if (legalMoves.includes(square)) {
          // Check for pawn promotion
          const piece = chess.get(selectedSquare as any);
          const isPromotion =
            piece?.type === "p" &&
            ((userColor === "white" && square[1] === "8") ||
              (userColor === "black" && square[1] === "1"));

          if (isPromotion) {
            setPromotionPending({ from: selectedSquare, to: square });
            return;
          }
          handleUserMove(selectedSquare, square);
        } else if (square === selectedSquare) {
          setSelectedSquare(null);
          setLegalMoves([]);
        } else {
          // Maybe clicking own piece
          const piece = chess.get(square as any);
          const myColor = userColor === "white" ? "w" : "b";
          if (piece && piece.color === myColor) {
            setSelectedSquare(square);
            const moves = chess.moves({ square: square as any, verbose: true });
            setLegalMoves(moves.map((m) => m.to));
          } else {
            setSelectedSquare(null);
            setLegalMoves([]);
          }
        }
      } else {
        const piece = chess.get(square as any);
        const myColor = userColor === "white" ? "w" : "b";
        if (piece && piece.color === myColor) {
          setSelectedSquare(square);
          const moves = chess.moves({ square: square as any, verbose: true });
          setLegalMoves(moves.map((m) => m.to));
        }
      }
    },
    [
      selectedSquare,
      legalMoves,
      phase,
      userColor,
      isOpponentThinking,
      handleUserMove,
    ],
  );

  const handlePieceDrop = useCallback(
    (sourceSquare: string, targetSquare: string): boolean => {
      if (isOpponentThinking) return false;
      if (phase !== "playing" && phase !== "stockfish") return false;
      const chess = chessRef.current;
      if (chess.turn() !== (userColor === "white" ? "w" : "b")) return false;

      const piece = chess.get(sourceSquare as any);
      const isPromotion =
        piece?.type === "p" &&
        ((userColor === "white" && targetSquare[1] === "8") ||
          (userColor === "black" && targetSquare[1] === "1"));

      if (isPromotion) {
        // Default queen promotion on drag
        handleUserMove(sourceSquare, targetSquare, "q");
        return true;
      }

      const prevFen = chess.fen();
      handleUserMove(sourceSquare, targetSquare);
      return chess.fen() !== prevFen;
    },
    [phase, userColor, isOpponentThinking, handleUserMove],
  );

  /* ------------------------------------------------------------------ */
  /*  Start game                                                          */
  /* ------------------------------------------------------------------ */

  const startGame = useCallback(() => {
    const chess = new Chess();
    chessRef.current = chess;
    setFen(chess.fen());
    setMoveHistory([]);
    setLastMove(null);
    setEvalCp(0);
    setBookMoveCount(0);
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMoveInsight(null);
    setPieceBadge(null);
    setAssistOpen(false);
    setAssistLines(null);
    setPreviewUci(null);
    setPeeksUsed(0);
    linesCacheRef.current.clear();
    assistedThisTurnRef.current = false;
    setStatusMessage("Game started — your move!");
    setPhase("playing");

    // If user plays black, opponent goes first
    if (userColor === "black") {
      setStatusMessage("Opponent is thinking…");
      setTimeout(() => {
        playOpponentMove(chess.fen(), chess);
      }, 300);
    }
  }, [userColor, playOpponentMove]);

  /* ------------------------------------------------------------------ */
  /*  Continue with Stockfish                                             */
  /* ------------------------------------------------------------------ */

  const continueWithStockfish = useCallback(() => {
    setPhase("stockfish");
    setStatusMessage(
      `Continuing with Stockfish (depth ${ratingToDepth(targetRating)})…`,
    );
    const chess = chessRef.current;
    // If it's the opponent's turn, trigger immediately
    const opponentTurn = chess.turn() !== (userColor === "white" ? "w" : "b");
    if (opponentTurn) {
      playStockfishMove(chess.fen(), chess);
    }
  }, [targetRating, userColor, playStockfishMove]);

  /* ------------------------------------------------------------------ */
  /*  Square highlights                                                  */
  /* ------------------------------------------------------------------ */

  const customSquareStyles: Record<string, React.CSSProperties> = {};

  if (lastMove) {
    customSquareStyles[lastMove.from] = {
      background: "rgba(255, 197, 0, 0.25)",
    };
    customSquareStyles[lastMove.to] = { background: "rgba(255, 197, 0, 0.45)" };
  }
  if (selectedSquare) {
    customSquareStyles[selectedSquare] = {
      background: "rgba(20, 85, 255, 0.45)",
    };
  }
  for (const sq of legalMoves) {
    customSquareStyles[sq] = {
      background: chessRef.current.get(sq as any)
        ? "radial-gradient(circle, transparent 52%, rgba(0,0,0,0.45) 52%)"
        : "radial-gradient(circle, rgba(0,0,0,0.35) 25%, transparent 26%)",
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Eval bar value (white-relative) & assist arrow                     */
  /* ------------------------------------------------------------------ */

  // evalCp is already stored as white-relative (evalPosition() converts it)
  const evalBarCp = evalCp ?? 0;

  /** Arrow for the assist line the user selected (defaults to the top line) */
  const assistArrows = useMemo(() => {
    if (
      !assistMode ||
      !assistOpen ||
      !previewUci ||
      previewUci.length < 4 ||
      !currentLines
    ) {
      return [] as string[][];
    }
    return [[previewUci.slice(0, 2), previewUci.slice(2, 4), "rgba(255, 140, 66, 0.75)"]];
  }, [assistMode, assistOpen, previewUci, currentLines]);

  // Round badge on the piece that just moved, via customSquareRenderer
  const customSquareRenderer = useMemo(() => {
    return ((props: any) => {
      const sq = props?.square as string | undefined;
      const showBadge = sq && pieceBadge && sq === pieceBadge.square;
      return (
        <div style={props?.style} className="relative h-full w-full">
          {props?.children}
          {showBadge && pieceBadge && (
            <MoveBadge classification={pieceBadge.quality} variant="corner" />
          )}
        </div>
      );
    }) as any;
  }, [pieceBadge]);

  /* ------------------------------------------------------------------ */
  /*  Session summary                                                    */
  /* ------------------------------------------------------------------ */

  const userMoves = moveHistory.filter((m) => m.byUser);
  const evaledUserMoves = userMoves.filter((m) => m.cpLoss !== undefined);
  const avgCpLoss =
    evaledUserMoves.length > 0
      ? Math.round(
          evaledUserMoves.reduce((s, m) => s + (m.cpLoss ?? 0), 0) /
            evaledUserMoves.length,
        )
      : null;

  const avgOf = (moves: MoveRecord[]): number | null => {
    const evaled = moves.filter((m) => m.cpLoss !== undefined);
    if (evaled.length === 0) return null;
    return Math.round(
      evaled.reduce((s, m) => s + (m.cpLoss ?? 0), 0) / evaled.length,
    );
  };

  /**
   * Assisted vs solo split — the point of the mode. Only moves where the
   * engine's top lines for that position were known count towards "matched",
   * so the rate never pretends to know something it doesn't.
   */
  const assistSummary = (() => {
    const assisted = evaledUserMoves.filter((m) => m.assisted);
    const solo = evaledUserMoves.filter((m) => !m.assisted);
    const hits = (moves: MoveRecord[]) => {
      const known = moves.filter((m) => m.engineTop !== undefined);
      return {
        known: known.length,
        top1: known.filter((m) => m.engineTop === 1).length,
        top3: known.filter((m) => m.engineTop !== null && m.engineTop !== undefined)
          .length,
      };
    };
    const ignored = assisted.filter((m) => (m.cpLoss ?? 0) >= IGNORED_ENGINE_CP);
    const assistedAvg = avgOf(assisted);
    const soloAvg = avgOf(solo);
    const assistedEnough = assisted.length >= MIN_SAMPLE_MOVES;
    const soloEnough = solo.length >= MIN_SAMPLE_MOVES;
    const assistedRating = assistedEnough
      ? estimateStrengthFromCpLoss(assistedAvg)
      : null;
    const soloRating = soloEnough ? estimateStrengthFromCpLoss(soloAvg) : null;
    return {
      assistedCount: assisted.length,
      soloCount: solo.length,
      assistedAvg,
      soloAvg,
      assistedRating,
      soloRating,
      assistedEnough,
      soloEnough,
      delta:
        assistedRating !== null && soloRating !== null
          ? assistedRating - soloRating
          : null,
      assistedHits: hits(assisted),
      soloHits: hits(solo),
      ignoredCount: ignored.length,
      ignoredLoss: ignored.reduce((s, m) => s + (m.cpLoss ?? 0), 0),
    };
  })();

  const MOVE_QUALITY_ORDER: MoveClassification[] = [
    "brilliant",
    "best",
    "book",
    "good",
    "inaccuracy",
    "mistake",
    "blunder",
  ];

  const moveQualityCounts = (() => {
    const counts = new Map<MoveClassification, number>();
    for (const m of evaledUserMoves) {
      if (!m.quality) continue;
      counts.set(m.quality, (counts.get(m.quality) ?? 0) + 1);
    }
    return counts;
  })();

  const sessionMotifs = phase === "gameover" ? computeSessionMotifs(moveHistory) : [];

  /* ------------------------------------------------------------------ */
  /*  Render: Setup                                                      */
  /* ------------------------------------------------------------------ */

  if (phase === "setup") {
    const modes: Array<{ value: Mode; title: string; blurb: string }> = [
      {
        value: "sparring",
        title: "Opening Sparring",
        blurb:
          "Play it yourself against real Lichess book moves at your rating, then Stockfish when the book runs out.",
      },
      {
        value: "assist",
        title: "Engine Assist",
        blurb:
          "The same opponent — but you may look at the engine's reply to every move. Assisted and solo moves are logged separately.",
      },
    ];

    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
        <div className="mb-6 text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <span className="h-3.5 w-1 rounded-full bg-gradient-to-b from-[#ff5a1f] to-[#ff8c42] shadow-[0_0_12px_rgba(255,90,31,0.35)]" />
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#ff8c42]">
              {assistMode ? "Engine Assist" : "Sparring"}
            </span>
          </div>
          <h1 className="text-[1.65rem] tracking-[-0.02em] text-[#f0edf2] sm:text-3xl">
            {assistMode ? "See what the engine sees" : "Opening Sparring"}
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[#8d8696]">
            {assistMode ? (
              <>
                Everyone has wondered what the engine would play here. Find out —
                and then find out what your chess looks like when you stop asking.
                Your moves are split into assisted and solo in the summary.
              </>
            ) : (
              <>
                Play against real moves from millions of Lichess games, weighted by
                how often they&apos;re played at your target rating and
                blunder-filtered. When the opening book runs out, you can continue
                against Stockfish at equivalent strength.
              </>
            )}
          </p>
        </div>

        <div className="flex flex-col gap-6 rounded-2xl border border-[#1e1a24] bg-[#121015]/70 p-6 backdrop-blur-xl [box-shadow:inset_0_1px_0_rgba(255,255,255,0.03)] sm:p-8">
          {/* Mode */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[#f0edf2]">
              Mode
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {modes.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    mode === m.value
                      ? "border-[#ff5a1f]/40 bg-[#ff5a1f]/[0.08] shadow-[0_0_20px_rgba(255,90,31,0.12)]"
                      : "border-[#1e1a24] bg-white/[0.02] hover:border-[#ff5a1f]/25 hover:bg-[#ff5a1f]/[0.05]"
                  }`}
                >
                  <div
                    className={`text-sm font-semibold ${
                      mode === m.value ? "text-[#ff8c42]" : "text-[#f0edf2]"
                    }`}
                  >
                    {m.title}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-[#8d8696]">
                    {m.blurb}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[#f0edf2]">
              Play as
            </label>
            <div className="flex gap-3">
              {(["white", "black"] as Color[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setUserColor(c)}
                  className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                    userColor === c
                      ? "border-[#ff5a1f]/40 bg-[#ff5a1f]/[0.08] text-[#ff8c42]"
                      : "border-[#1e1a24] bg-white/[0.02] text-[#8d8696] hover:border-[#ff5a1f]/25 hover:text-[#f0edf2]"
                  }`}
                >
                  {c === "white" ? "♙ White" : "♟ Black"}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[#f0edf2]">
              Opponent rating:{" "}
              <span className="font-bold text-[#ff8c42]">{targetRating}</span>
            </label>
            <input
              type="range"
              min={600}
              max={2800}
              step={50}
              value={targetRating}
              onChange={(e) => setTargetRating(Number(e.target.value))}
              className="w-full accent-[#ff5a1f]"
            />
            <div className="mt-1 flex justify-between text-xs text-[#565061]">
              <span>600</span>
              <span>1200</span>
              <span>1600</span>
              <span>2000</span>
              <span>2800</span>
            </div>
            <p className="mt-2 text-xs text-[#565061]">
              Book phase samples Lichess games near this rating. Stockfish phase
              runs at depth {ratingToDepth(targetRating)}.
            </p>
          </div>

          {/* Assist options */}
          {assistMode && (
            <div>
              <label className="mb-2 block text-sm font-medium text-[#f0edf2]">
                Peeks per game
              </label>
              <div className="flex flex-wrap gap-2">
                {PEEK_BUDGETS.map((b) => (
                  <button
                    key={b.label}
                    onClick={() => setPeekBudget(b.value)}
                    className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-all ${
                      peekBudget === b.value
                        ? "border-[#ff5a1f]/40 bg-[#ff5a1f]/[0.08] text-[#ff8c42]"
                        : "border-[#1e1a24] bg-white/[0.02] text-[#8d8696] hover:border-[#ff5a1f]/25 hover:text-[#f0edf2]"
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-[#565061]">
                Unlimited is the full experience. A budget turns peeking into a
                decision — you have to know when you actually need it.
              </p>
            </div>
          )}

          <button
            onClick={startGame}
            className="w-full rounded-xl bg-gradient-to-r from-[#ff5a1f] to-[#ff8c42] py-3 font-semibold text-[#070608] shadow-[0_0_24px_rgba(255,90,31,0.25)] transition-all hover:brightness-110"
          >
            {assistMode ? "Start Engine Assist" : "Start Sparring"}
          </button>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Render: Out-of-book prompt                                          */
  /* ------------------------------------------------------------------ */

  if (phase === "out-of-book-prompt") {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 px-4 py-16 text-center">
        <div className="text-4xl">📖</div>
        <h2 className="text-2xl text-[#f0edf2]">Opening book exhausted</h2>
        <p className="max-w-sm text-sm leading-relaxed text-[#8d8696]">
          After {bookMoveCount} book moves, this position has too few Lichess
          games at the {targetRating} level to sample reliably. Continue with
          Stockfish at equivalent strength (depth {ratingToDepth(targetRating)})?
        </p>
        <div className="flex gap-3">
          <button
            onClick={continueWithStockfish}
            className="rounded-xl bg-gradient-to-r from-[#ff5a1f] to-[#ff8c42] px-6 py-2.5 font-semibold text-[#070608] shadow-[0_0_20px_rgba(255,90,31,0.22)] transition-all hover:brightness-110"
          >
            Continue with Stockfish
          </button>
          <button
            onClick={() => setPhase("gameover")}
            className="rounded-xl border border-[#1e1a24] bg-white/[0.03] px-6 py-2.5 font-semibold text-[#8d8696] transition-colors hover:border-[#ff5a1f]/25 hover:text-[#f0edf2]"
          >
            End Session
          </button>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Render: Game Over summary                                           */
  /* ------------------------------------------------------------------ */

  if (phase === "gameover") {
    const chess = chessRef.current;
    let result = "Game over";
    if (chess.isCheckmate()) {
      result =
        chess.turn() === (userColor === "white" ? "w" : "b")
          ? "Checkmate — you lost"
          : "Checkmate — you won";
    } else if (chess.isDraw()) {
      result = "Draw";
    }

    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8">
        <h2 className="text-2xl tracking-[-0.02em] text-[#f0edf2]">{result}</h2>

        {/* Headline stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: String(moveHistory.length), label: "Total moves", tone: "text-[#f0edf2]" },
            { value: String(bookMoveCount), label: "Book moves", tone: "text-[#f0edf2]" },
            {
              value: avgCpLoss !== null ? fmtCp(avgCpLoss) : "—",
              label: "Avg loss / move",
              tone: "text-[#ff8c42]",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-[#1e1a24] bg-[#121015]/70 p-3 text-center backdrop-blur-xl [box-shadow:inset_0_1px_0_rgba(255,255,255,0.03)]"
            >
              <div className={`text-2xl font-bold ${s.tone}`}>{s.value}</div>
              <div className="mt-1 text-xs text-[#565061]">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Assist split — the point of the mode */}
        {assistMode && (
          <div className="rounded-2xl border border-[#1e1a24] bg-[#121015]/70 p-6 backdrop-blur-xl [box-shadow:inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="mb-1 flex items-center gap-2">
              <span className="h-3.5 w-1 rounded-full bg-gradient-to-b from-[#ff5a1f] to-[#ff8c42] shadow-[0_0_12px_rgba(255,90,31,0.35)]" />
              <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#ff8c42]">
                What the engine was worth
              </span>
            </div>
            <p className="mb-5 max-w-xl text-sm leading-relaxed text-[#8d8696]">
              {assistSummary.assistedCount === 0
                ? "You never opened the engine panel — this game was entirely your own chess."
                : assistSummary.soloCount === 0
                  ? "Every move you made this game was made with the engine open. Play one without peeking to see the difference."
                  : `Across ${assistSummary.assistedCount + assistSummary.soloCount} analysed moves, here is what changed when you looked.`}
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[#ff5a1f]/25 bg-[#ff5a1f]/[0.06] p-4">
                <div className="text-xs uppercase tracking-[0.14em] text-[#ff8c42]">
                  Assisted
                </div>
                <div className="mt-2 text-2xl font-bold text-[#f0edf2]">
                  {assistSummary.assistedRating !== null
                    ? `~${assistSummary.assistedRating}`
                    : "—"}
                </div>
                <div className="mt-1 text-xs text-[#8d8696]">
                  {assistSummary.assistedCount} move
                  {assistSummary.assistedCount === 1 ? "" : "s"}
                  {assistSummary.assistedAvg !== null &&
                    ` · ${fmtCp(assistSummary.assistedAvg)} loss/move`}
                </div>
                {!assistSummary.assistedEnough && (
                  <div className="mt-1 text-[11px] text-[#565061]">
                    {MIN_SAMPLE_MOVES - assistSummary.assistedCount} more assisted
                    move{MIN_SAMPLE_MOVES - assistSummary.assistedCount === 1 ? "" : "s"}{" "}
                    needed for an estimate
                  </div>
                )}
                {assistSummary.assistedHits.known > 0 && (
                  <div className="mt-2 text-xs text-[#565061]">
                    matched the top line {assistSummary.assistedHits.top1}/
                    {assistSummary.assistedHits.known}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-[#1e1a24] bg-white/[0.02] p-4">
                <div className="text-xs uppercase tracking-[0.14em] text-[#8d8696]">
                  Solo
                </div>
                <div className="mt-2 text-2xl font-bold text-[#f0edf2]">
                  {assistSummary.soloRating !== null
                    ? `~${assistSummary.soloRating}`
                    : "—"}
                </div>
                <div className="mt-1 text-xs text-[#8d8696]">
                  {assistSummary.soloCount} move
                  {assistSummary.soloCount === 1 ? "" : "s"}
                  {assistSummary.soloAvg !== null &&
                    ` · ${fmtCp(assistSummary.soloAvg)} loss/move`}
                </div>
                {!assistSummary.soloEnough && (
                  <div className="mt-1 text-[11px] text-[#565061]">
                    {MIN_SAMPLE_MOVES - assistSummary.soloCount} more solo move
                    {MIN_SAMPLE_MOVES - assistSummary.soloCount === 1 ? "" : "s"}{" "}
                    needed for an estimate
                  </div>
                )}
                {assistSummary.soloHits.known > 0 && (
                  <div className="mt-2 text-xs text-[#565061]">
                    matched the top line {assistSummary.soloHits.top1}/
                    {assistSummary.soloHits.known} on your own
                  </div>
                )}
              </div>
            </div>

            {assistSummary.delta === null ? (
              assistSummary.assistedCount > 0 &&
              assistSummary.soloCount > 0 && (
                <div className="mt-4 rounded-xl border border-[#1e1a24] bg-white/[0.02] p-4 text-sm text-[#8d8696]">
                  Keep going — the comparison needs {MIN_SAMPLE_MOVES}+ assisted and{" "}
                  {MIN_SAMPLE_MOVES}+ solo moves before it means anything.
                </div>
              )
            ) : assistSummary.delta !== 0 ? (
              <div className="mt-4 rounded-xl border border-[#1e1a24] bg-white/[0.02] p-4 text-sm text-[#f0edf2]">
                The engine was worth{" "}
                <span className="font-bold text-[#ff8c42]">
                  {assistSummary.delta > 0 ? "+" : ""}
                  {assistSummary.delta}
                </span>{" "}
                rating in this game.
                <span className="mt-1 block text-xs text-[#565061]">
                  Single-game estimate from average loss per move — a rough band,
                  not a rating. The gap between the two numbers is the signal.
                </span>
              </div>
            ) : null}

            {assistSummary.ignoredCount > 0 && (
              <div className="mt-3 rounded-xl border border-[#1e1a24] bg-white/[0.02] p-4 text-sm text-[#8d8696]">
                You saw the engine&apos;s move and played something else{" "}
                <span className="font-semibold text-[#f0edf2]">
                  {assistSummary.ignoredCount}×
                </span>{" "}
                — {fmtCp(assistSummary.ignoredLoss)} pawns of eval.
              </div>
            )}

            {peeksUsed > 0 && (
              <div className="mt-3 text-xs text-[#565061]">
                {peeksUsed} peek{peeksUsed === 1 ? "" : "s"} used
                {peekBudget !== null && ` of ${peekBudget}`}.
              </div>
            )}
          </div>
        )}

        {/* Move quality */}
        {moveQualityCounts.size > 0 && (
          <div className="rounded-2xl border border-[#1e1a24] bg-[#121015]/70 p-5 backdrop-blur-xl [box-shadow:inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="mb-3 text-xs uppercase tracking-[0.14em] text-[#565061]">
              Move quality
            </div>
            <div className="flex flex-wrap gap-2">
              {MOVE_QUALITY_ORDER.filter((k) => (moveQualityCounts.get(k) ?? 0) > 0).map(
                (k) => (
                  <span key={k} className="flex items-center gap-1.5">
                    <MoveBadge classification={k} />
                    <span className="text-sm font-semibold text-[#f0edf2]">
                      {moveQualityCounts.get(k)}
                    </span>
                  </span>
                ),
              )}
            </div>
          </div>
        )}

        {/* Motifs */}
        {sessionMotifs.length > 0 && (
          <div className="rounded-2xl border border-[#1e1a24] bg-[#121015]/70 p-5 backdrop-blur-xl [box-shadow:inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="mb-3 text-xs text-[#8d8696]">
              Recurring patterns in your play
            </div>
            <div className="flex flex-col gap-1.5">
              {sessionMotifs.map((m) => (
                <div
                  key={m.name}
                  className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2"
                >
                  <span className="text-base">
                    {COACHING_THEME_ICONS[m.name] ?? "🔍"}
                  </span>
                  <span className="flex-1 text-sm text-[#f0edf2]">{m.name}</span>
                  <span className="text-xs text-[#565061]">{m.count}×</span>
                  <span className="ml-1 text-xs text-[#ff8c42]">
                    &minus;{fmtCp(m.avgCpLoss)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Move list */}
        <div className="max-h-80 overflow-y-auto rounded-2xl border border-[#1e1a24] bg-[#121015]/70 p-4 backdrop-blur-xl [box-shadow:inset_0_1px_0_rgba(255,255,255,0.03)]">
          <div className="flex flex-col gap-1">
            {moveHistory.map((m, i) => {
              const moveNum = Math.floor(i / 2) + 1;
              const isWhiteMove = i % 2 === 0;
              return (
                <div key={i} className="flex items-center gap-2 rounded px-2 py-1 text-sm">
                  {isWhiteMove && (
                    <span className="w-6 shrink-0 text-right text-[#565061]">
                      {moveNum}.
                    </span>
                  )}
                  <span
                    className={`font-mono ${m.byUser ? "text-[#f0edf2]" : "text-[#8d8696]"}`}
                  >
                    {m.san}
                  </span>
                  {m.byUser && m.assisted && (
                    <span
                      className="rounded-full bg-[#ff5a1f]/[0.12] px-2 py-0.5 text-[10px] text-[#ff8c42]"
                      title="This move was made with the engine panel open"
                    >
                      assisted
                    </span>
                  )}
                  {m.byUser && m.quality && (
                    <span className="ml-auto flex items-center gap-2">
                      <span className="text-xs text-[#565061]">
                        {m.cpLoss !== undefined && `−${fmtCp(m.cpLoss)}`}
                      </span>
                      <MoveBadge classification={m.quality} />
                    </span>
                  )}
                  {!m.byUser && m.bookCandidate && (
                    <span className="ml-auto text-xs text-[#565061]">
                      {m.bookCandidate.games.toLocaleString()} games
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setPhase("setup")}
            className="rounded-xl bg-gradient-to-r from-[#ff5a1f] to-[#ff8c42] px-6 py-2.5 font-semibold text-[#070608] shadow-[0_0_20px_rgba(255,90,31,0.22)] transition-all hover:brightness-110"
          >
            New Game
          </button>
          <button
            onClick={startGame}
            className="rounded-xl border border-[#1e1a24] bg-white/[0.03] px-6 py-2.5 font-semibold text-[#8d8696] transition-colors hover:border-[#ff5a1f]/25 hover:text-[#f0edf2]"
          >
            Rematch
          </button>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Render: Playing / Stockfish                                        */
  /* ------------------------------------------------------------------ */

  return (
    <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 lg:py-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <span className="h-3.5 w-1 rounded-full bg-gradient-to-b from-[#ff5a1f] to-[#ff8c42] shadow-[0_0_12px_rgba(255,90,31,0.35)]" />
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#ff8c42]">
              {assistMode ? "Engine Assist" : "Opening Sparring"}
            </span>
          </div>
          <p className="text-xs text-[#8d8696]">
            vs <span className="text-[#f0edf2]">{targetRating}</span> ·{" "}
            {phase === "stockfish" ? (
              <span className="text-[#ff8c42]">
                Stockfish depth {ratingToDepth(targetRating)}
              </span>
            ) : (
              <span className="text-[#ff8c42]">
                Lichess book ({bookMoveCount} moves)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {assistMode && (
            <span className="rounded-full border border-[#1e1a24] bg-white/[0.02] px-3 py-1.5 text-[11px] text-[#8d8696]">
              assisted{" "}
              <span className="font-semibold text-[#ff8c42]">
                {assistSummary.assistedCount}
              </span>{" "}
              · solo{" "}
              <span className="font-semibold text-[#f0edf2]">
                {assistSummary.soloCount}
              </span>
            </span>
          )}
          <button
            onClick={() => setPhase("gameover")}
            className="rounded-lg border border-[#1e1a24] px-3 py-1.5 text-xs text-[#8d8696] transition-colors hover:border-[#ff5a1f]/25 hover:text-[#ff8c42]"
          >
            End
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        {/* Board stage */}
        <div ref={stageRef} className="flex w-full flex-col items-center gap-2.5">
          {/* Opponent row */}
          <div
            className="flex w-full items-center gap-2"
            style={{ maxWidth: boardSize + 36 }}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#1e1a24] bg-[#121015] text-sm">
              {userColor === "white" ? "♟" : "♙"}
            </div>
            <span className="text-sm text-[#8d8696]">
              Opponent ({targetRating}
              {phase === "stockfish" ? " · SF" : " · Lichess DB"})
            </span>
            {isOpponentThinking && (
              <span className="ml-1 animate-pulse text-xs text-[#ff8c42]">
                thinking…
              </span>
            )}
          </div>

          {/* Board + eval bar */}
          <div className="flex items-start gap-3">
            <EvalBar evalCp={evalBarCp} height={boardSize} />
            <div
              className="relative shrink-0"
              style={{ width: boardSize, height: boardSize }}
            >
              <Chessboard
                position={fen}
                boardOrientation={userColor}
                boardWidth={boardSize}
                onPieceDrop={handlePieceDrop}
                onSquareClick={handleSquareClick}
                customSquareStyles={customSquareStyles}
                customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
                customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
                customPieces={customPieces}
                showBoardNotation={showCoords}
                customSquare={customSquareRenderer}
                customArrows={assistArrows}
              />
            </div>
          </div>

          {/* User row */}
          <div
            className="flex w-full items-center gap-2"
            style={{ maxWidth: boardSize + 36 }}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#1e1a24] bg-[#1a1620] text-sm">
              {userColor === "white" ? "♙" : "♟"}
            </div>
            <span className="text-sm font-medium text-[#f0edf2]">You</span>
            {isUserTurn && (
              <span className="ml-1 text-xs text-emerald-300">your turn</span>
            )}
          </div>
        </div>

        {/* Right rail */}
        <aside className="flex w-full flex-col gap-3">
          {assistMode && (
            <EngineAssistPanel
              fen={fen}
              open={assistOpen}
              lines={currentLines}
              loading={assistLoading}
              depth={ASSIST_DEPTH}
              peeksUsed={peeksUsed}
              peekBudget={peekBudget}
              activeUci={previewUci}
              onToggle={handleAssistToggle}
              onSelectLine={handleSelectLine}
            />
          )}

          {/* Last-move coaching insight */}
          {lastMoveInsight && (
            <div
              className={`rounded-xl border p-4 ${
                lastMoveInsight.quality
                  ? `${MOVE_CLASSIFICATION_BORDER[lastMoveInsight.quality]} ${MOVE_CLASSIFICATION_BG[lastMoveInsight.quality]}`
                  : "border-[#1e1a24] bg-white/[0.02]"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                {lastMoveInsight.quality && (
                  <MoveBadge classification={lastMoveInsight.quality} />
                )}
                {lastMoveInsight.cpLoss > 0 && (
                  <span className="text-xs text-[#565061]">
                    &minus;{fmtCp(lastMoveInsight.cpLoss)}
                  </span>
                )}
                {lastMoveInsight.bestMoveSan && (
                  <span className="ml-auto text-xs text-[#565061]">
                    Best:{" "}
                    <span className="font-mono text-[#f0edf2]">
                      {lastMoveInsight.bestMoveSan}
                    </span>
                  </span>
                )}
              </div>
              {lastMoveInsight.headline && (
                <p className="mt-2 text-xs leading-relaxed text-[#8d8696]">
                  {lastMoveInsight.headline}
                </p>
              )}
              {lastMoveInsight.coaching && (
                <p className="mt-1 text-xs italic leading-relaxed text-[#565061]">
                  {lastMoveInsight.coaching}
                </p>
              )}
              {lastMoveInsight.themes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {lastMoveInsight.themes.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] text-[#8d8696]"
                    >
                      {COACHING_THEME_ICONS[t] ? `${COACHING_THEME_ICONS[t]} ` : ""}
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Status bar */}
          {statusMessage && (
            <div className="rounded-xl border border-[#1e1a24] bg-[#121015]/70 px-3 py-2 text-xs text-[#8d8696] backdrop-blur-xl">
              {statusMessage}
            </div>
          )}

          {/* Move list */}
          {moveHistory.length > 0 && (
            <div className="rounded-xl border border-[#1e1a24] bg-[#121015]/70 p-3 backdrop-blur-xl [box-shadow:inset_0_1px_0_rgba(255,255,255,0.03)]">
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                {moveHistory.slice(-16).map((m, i) => {
                  const absIdx =
                    moveHistory.length - Math.min(16, moveHistory.length) + i;
                  const moveNum = Math.floor(absIdx / 2) + 1;
                  const isWhite = absIdx % 2 === 0;
                  return (
                    <span
                      key={absIdx}
                      className="inline-flex items-baseline gap-1 text-xs font-mono"
                    >
                      {isWhite && (
                        <span className="mr-0.5 text-[#565061]">{moveNum}.</span>
                      )}
                      <span
                        className={m.byUser ? "text-[#f0edf2]" : "text-[#8d8696]"}
                      >
                        {m.san}
                      </span>
                      {m.byUser && m.assisted && (
                        <span
                          className="text-[9px] text-[#ff8c42]"
                          title="Assisted move"
                        >
                          ▣
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Running tally */}
          {assistMode && evaledUserMoves.length > 0 && (
            <div className="rounded-xl border border-[#1e1a24] bg-white/[0.02] px-3 py-2 text-[11px] text-[#565061]">
              avg loss — assisted{" "}
              <span className="text-[#ff8c42]">
                {assistSummary.assistedAvg !== null
                  ? fmtCp(assistSummary.assistedAvg)
                  : "—"}
              </span>{" "}
              · solo{" "}
              <span className="text-[#f0edf2]">
                {assistSummary.soloAvg !== null ? fmtCp(assistSummary.soloAvg) : "—"}
              </span>
            </div>
          )}
        </aside>
      </div>

      {/* Promotion picker */}
      {promotionPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070608]/80 backdrop-blur-sm">
          <div className="rounded-2xl border border-[#1e1a24] bg-[#121015] p-5 text-center">
            <div className="mb-3 text-sm text-[#8d8696]">Promote to</div>
            <div className="flex gap-2">
              {(["q", "r", "b", "n"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    const pending = promotionPending;
                    setPromotionPending(null);
                    handleUserMove(pending.from, pending.to, p);
                  }}
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#1e1a24] bg-white/[0.03] text-2xl transition-colors hover:border-[#ff5a1f]/40 hover:bg-[#ff5a1f]/[0.08]"
                >
                  {userColor === "white"
                    ? { q: "♕", r: "♖", b: "♗", n: "♘" }[p]
                    : { q: "♛", r: "♜", b: "♝", n: "♞" }[p]}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPromotionPending(null)}
              className="mt-3 text-xs text-[#565061] hover:text-[#8d8696]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
