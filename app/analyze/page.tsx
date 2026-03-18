"use client";

/**
 * /analyze — PGN Game Analyzer
 *
 * Paste or upload a PGN to get a full move-by-move analysis with:
 *   - Stockfish evaluation per move (client-side WASM)
 *   - Move classification (brilliant/best/good/inaccuracy/mistake/blunder)
 *   - Positional motif detection via the existing explainMoves() engine
 *   - Interactive board with eval bar and move navigation
 *   - "Explain" button per move using the ExplanationModal
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard, type CbSquare } from "@/components/chessboard-compat";
import { EvalBar } from "@/components/eval-bar";
import { ExplanationModal } from "@/components/explanation-modal";
import { explainMoves, type PositionExplanation } from "@/lib/position-explainer";
import { stockfishPool } from "@/lib/stockfish-client";
import { useBoardSize } from "@/lib/use-board-size";
import { useBoardTheme, useShowCoordinates, useCustomPieces } from "@/lib/use-coins";
import { playSound, preloadSounds } from "@/lib/sounds";
import { SAMPLE_GAMES, GAME_CATEGORIES, type GameCategory } from "@/lib/sample-games";

/* ────────────────── Tag filter options (shared with Guess) ──────────────── */
const TAG_OPTIONS = [
  { value: "all", label: "All Games", icon: "📚" },
  { value: "attack", label: "Attack", icon: "⚔️" },
  { value: "sacrifice", label: "Sacrifice", icon: "💥" },
  { value: "positional", label: "Positional", icon: "🧠" },
  { value: "endgame", label: "Endgame", icon: "♔" },
  { value: "defense", label: "Defense", icon: "🛡️" },
  { value: "tactics", label: "Tactics", icon: "🎯" },
] as const;

/* ────────────────────────── Types ────────────────────────── */

type MoveClassification = "brilliant" | "best" | "good" | "book" | "inaccuracy" | "mistake" | "blunder";

type AnalyzedMove = {
  /** Move index (0-based) */
  idx: number;
  /** SAN notation */
  san: string;
  /** UCI notation */
  uci: string;
  /** FEN before this move */
  fenBefore: string;
  /** FEN after this move */
  fenAfter: string;
  /** Engine eval BEFORE this move (from white's perspective) */
  evalBefore: number;
  /** Engine eval AFTER this move (from white's perspective) */
  evalAfter: number;
  /** Engine best move for the position before */
  bestMove: string | null;
  /** Best move FEN for PV display */
  bestMoveSan: string | null;
  /** CP loss (always >= 0) */
  cpLoss: number;
  /** Classification */
  classification: MoveClassification;
  /** Which side played */
  color: "w" | "b";
  /** Full move number */
  moveNumber: number;
  /** PV moves (UCI) from engine */
  pvMoves: string[];
};

/* ────────────────────────── Constants ────────────────────────── */

const DEFAULT_ENGINE_DEPTH = 14;
const DEPTH_OPTIONS = [8, 10, 12, 14, 16, 18, 20] as const;

const CLASSIFICATION_COLORS: Record<MoveClassification, string> = {
  brilliant: "text-cyan-400",
  best: "text-emerald-400",
  good: "text-emerald-400/70",
  book: "text-slate-400",
  inaccuracy: "text-amber-400",
  mistake: "text-orange-400",
  blunder: "text-red-400",
};

const CLASSIFICATION_BG: Record<MoveClassification, string> = {
  brilliant: "bg-cyan-500/15",
  best: "bg-emerald-500/15",
  good: "bg-emerald-500/10",
  book: "bg-white/[0.04]",
  inaccuracy: "bg-amber-500/15",
  mistake: "bg-orange-500/15",
  blunder: "bg-red-500/15",
};

const CLASSIFICATION_ICONS: Record<MoveClassification, string> = {
  brilliant: "!!",
  best: "!",
  good: "",
  book: "📖",
  inaccuracy: "?!",
  mistake: "?",
  blunder: "??",
};

const CLASSIFICATION_BORDER: Record<MoveClassification, string> = {
  brilliant: "border-cyan-500/30",
  best: "border-emerald-500/20",
  good: "border-emerald-500/10",
  book: "border-white/[0.06]",
  inaccuracy: "border-amber-500/20",
  mistake: "border-orange-500/20",
  blunder: "border-red-500/30",
};

function classifyMove(
  cpLoss: number,
  isBestMove: boolean,
  evalBeforeMover: number,
  evalAfterMover: number,
): MoveClassification {
  if (isBestMove) return "best";

  // Winning-side leniency: when the player is already heavily winning
  // and is STILL winning after the move, relax the classification.
  // e.g. sacrificing a rook when you're up a queen+rook vs lone king
  // shouldn't be called a blunder — you're still completely winning.
  const stillWinning = evalAfterMover >= 400;
  const wasWinning = evalBeforeMover >= 400;

  if (wasWinning && stillWinning) {
    // Position was winning and still is — be very lenient
    if (cpLoss <= 50) return "good";
    if (cpLoss <= 200) return "inaccuracy";
    // Even huge cp losses are at most a "mistake" if still totally winning
    return "mistake";
  }

  if (wasWinning && evalAfterMover >= 200) {
    // Was winning and still significantly ahead — moderate leniency
    if (cpLoss <= 35) return "good";
    if (cpLoss <= 120) return "inaccuracy";
    if (cpLoss <= 300) return "mistake";
    return "blunder";
  }

  // Standard thresholds for normal positions
  if (cpLoss <= 25) return "good";
  if (cpLoss <= 75) return "inaccuracy";
  if (cpLoss <= 200) return "mistake";
  return "blunder";
}

const CLASSIFICATION_EMOJI: Record<MoveClassification, string> = {
  brilliant: "💎",
  best: "✅",
  good: "👍",
  book: "📖",
  inaccuracy: "⚠️",
  mistake: "❌",
  blunder: "💀",
};

const CLASSIFICATION_BADGE_COLORS: Record<MoveClassification, string> = {
  brilliant: "rgba(6,182,212,0.9)",
  best: "rgba(16,185,129,0.85)",
  good: "rgba(16,185,129,0.6)",
  book: "rgba(148,163,184,0.7)",
  inaccuracy: "rgba(245,158,11,0.85)",
  mistake: "rgba(249,115,22,0.9)",
  blunder: "rgba(239,68,68,0.9)",
};

function formatEval(cp: number): string {
  if (Math.abs(cp) >= 99000) {
    const n = 100000 - Math.abs(cp);
    const sign = cp > 0 ? "+" : "-";
    return n <= 0 ? `${sign}Mate` : `${sign}M${n}`;
  }
  const pawns = cp / 100;
  return `${pawns > 0 ? "+" : ""}${(Math.round(pawns * 10) / 10).toFixed(1)}`;
}

type PgnParseResult = {
  moves: { san: string; uci: string; fenBefore: string; fenAfter: string; color: "w" | "b"; moveNumber: number }[];
  headers: Record<string, string>;
};

/**
 * Parse a SAN token into its component parts (piece, destination, capture, promotion).
 * Handles moves like "Re1", "Rxd4", "Nbd7", "exd5", "O-O", "e8=Q" etc.
 */
function parseSanToken(token: string) {
  const cleaned = token.replace(/[+#!?]+$/, "");
  if (cleaned === "O-O" || cleaned === "O-O-O") return null; // castling

  // Flexible regex: piece?, disambig file?, disambig rank?, capture?, dest square, promotion?
  const m = cleaned.match(/^([KQRBN])?([a-h])?([1-8])?(x)?([a-h][1-8])(=[QRBN])?$/);
  if (!m) return null;

  return {
    piece: (m[1] ?? "P").toLowerCase(),
    fileHint: m[2] ?? null,
    rankHint: m[3] ?? null,
    capture: !!m[4],
    target: m[5],
    promotion: m[6]?.slice(1).toLowerCase() ?? null,
  };
}

/**
 * Resolve ambiguous SAN notation by matching against legal moves.
 * When multiple candidates exist, uses look-ahead to find which move
 * allows the rest of the game to continue (up to 6 moves ahead).
 */
function resolveAmbiguousMove(
  chess: InstanceType<typeof Chess>,
  token: string,
  remainingTokens: string[] = [],
) {
  const parsed = parseSanToken(token);
  if (!parsed) return null;

  const pieceMap: Record<string, string> = { p: "p", k: "k", q: "q", r: "r", b: "b", n: "n" };
  const pieceType = pieceMap[parsed.piece];
  if (!pieceType) return null;

  const legalMoves = chess.moves({ verbose: true });
  let candidates = legalMoves.filter(m =>
    m.piece === pieceType &&
    m.to === parsed.target &&
    (!parsed.promotion || m.promotion === parsed.promotion)
  );

  // Narrow with disambiguation hints
  if (candidates.length > 1 && (parsed.fileHint || parsed.rankHint)) {
    const narrowed = candidates.filter(m =>
      (!parsed.fileHint || m.from[0] === parsed.fileHint) &&
      (!parsed.rankHint || m.from[1] === parsed.rankHint)
    );
    if (narrowed.length >= 1) candidates = narrowed;
  }

  if (candidates.length === 1) {
    return chess.move(candidates[0].san);
  }

  // Multiple candidates — use look-ahead to find the correct one
  if (candidates.length > 1) {
    const lookAhead = remainingTokens
      .filter(t => !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(t))
      .slice(0, 6);

    for (const cand of candidates) {
      const probe = new Chess(chess.fen());
      try {
        probe.move(cand.san);
        let ok = true;
        for (const futureToken of lookAhead) {
          try {
            const r = probe.move(futureToken);
            if (!r) { ok = false; break; }
          } catch {
            // Also try resolving this future move
            const fp = parseSanToken(futureToken);
            if (!fp) { ok = false; break; }
            const fpt = pieceMap[fp.piece];
            const fl = probe.moves({ verbose: true }).filter(m =>
              m.piece === fpt && m.to === fp.target && (!fp.promotion || m.promotion === fp.promotion)
            );
            if (fl.length >= 1) {
              try { probe.move(fl[0].san); } catch { ok = false; break; }
            } else { ok = false; break; }
          }
        }
        if (ok) {
          return chess.move(cand.san);
        }
      } catch { /* this candidate doesn't work */ }
    }

    // Fallback: just try the first
    try { return chess.move(candidates[0].san); } catch { /* */ }
  }

  return null;
}

function parsePgn(pgn: string): PgnParseResult | { error: string } {
  try {
    // Extract headers
    const headers: Record<string, string> = {};
    const headerLines = pgn.match(/\[(\w+)\s+"([^"]*)"\]/g) ?? [];
    for (const line of headerLines) {
      const match = line.match(/\[(\w+)\s+"([^"]*)"\]/);
      if (match) headers[match[1]] = match[2];
    }

    // Try chess.js loadPgn first (handles standard PGN best)
    try {
      const game = new Chess();
      game.loadPgn(pgn);
      const history = game.history({ verbose: true });
      const replay = new Chess();
      const moves: PgnParseResult["moves"] = [];

      for (const move of history) {
        const fenBefore = replay.fen();
        const uci = `${move.from}${move.to}${move.promotion ?? ""}`;
        replay.move(move.san);
        const fenAfter = replay.fen();
        const fullMove = parseInt(fenBefore.split(" ")[5] ?? "1");
        moves.push({ san: move.san, uci, fenBefore, fenAfter, color: move.color, moveNumber: fullMove });
      }

      return { moves, headers };
    } catch {
      // loadPgn failed — fall back to manual parsing for better error messages
    }

    // Manual replay: strip headers, comments, variations, NAGs, and result
    let moveText = pgn
      .replace(/\[.*?\]\s*/g, "")        // remove header tags
      .replace(/\{[^}]*\}/g, "")         // remove comments
      .replace(/\([^)]*\)/g, "")         // remove variations (single-level)
      .replace(/\$\d+/g, "")             // remove NAGs ($1, $2, etc.)
      .replace(/\b(1-0|0-1|1\/2-1\/2|\*)\s*$/, "") // remove game result
      .trim();

    // Tokenise: split on whitespace, drop move numbers like "1." "12..."
    const tokens = moveText.split(/\s+/).filter(t => t && !/^\d+\.+$/.test(t));

    if (tokens.length === 0) {
      return { error: "No moves found in PGN." };
    }

    const chess = new Chess();
    const moves: PgnParseResult["moves"] = [];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      // Skip result tokens that might appear mid-text
      if (/^(1-0|0-1|1\/2-1\/2|\*)$/.test(token)) continue;
      const fenBefore = chess.fen();
      const color = chess.turn();
      const fullMove = parseInt(fenBefore.split(" ")[5] ?? "1");

      try {
        let result: ReturnType<typeof chess.move> | null = null;
        try {
          result = chess.move(token);
        } catch {
          // chess.js throws on invalid/ambiguous moves — try resolution below
        }

        // If the move failed, try to resolve ambiguous notation.
        // Some PGN sources omit disambiguation (e.g. "Re1" when "Rde1" is needed).
        if (!result) {
          result = resolveAmbiguousMove(chess, token, tokens.slice(i + 1));
        }

        if (!result) {
          return { error: `Illegal move "${token}" at move ${fullMove}${color === "w" ? "" : "..."} — the position does not allow this move.` };
        }
        const fenAfter = chess.fen();
        const uci = `${result.from}${result.to}${result.promotion ?? ""}`;
        moves.push({ san: result.san, uci, fenBefore, fenAfter, color, moveNumber: fullMove });
      } catch {
        // Retry ambiguous move resolution in the catch path too
        try {
          const resolved = resolveAmbiguousMove(chess, token, tokens.slice(i + 1));
          if (resolved) {
            const fenAfter = chess.fen();
            const uci = `${resolved.from}${resolved.to}${resolved.promotion ?? ""}`;
            moves.push({ san: resolved.san, uci, fenBefore, fenAfter, color, moveNumber: fullMove });
            continue;
          }
        } catch { /* fall through */ }
        return { error: `Invalid move "${token}" at move ${fullMove}${color === "w" ? "" : "..."} — the PGN may be corrupted or use a non-standard format.` };
      }
    }

    return { moves, headers };
  } catch {
    return { error: "Could not parse PGN. Please check the format and try again." };
  }
}

/* ────────────────────────── Component ────────────────────────── */

export default function AnalyzePage() {
  /* ── PGN input state ── */
  const [pgnText, setPgnText] = useState("");
  const [error, setError] = useState("");

  /* ── Settings state ── */
  const [engineDepth, setEngineDepth] = useState(DEFAULT_ENGINE_DEPTH);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  /* ── Game loader state ── */
  const [loadUsername, setLoadUsername] = useState("");
  const [loadSource, setLoadSource] = useState<"lichess" | "chesscom">("lichess");
  const [loadingGames, setLoadingGames] = useState(false);
  const [recentGames, setRecentGames] = useState<{ white: string; black: string; date: string; result: string; pgn: string; event?: string }[]>([]);
  const [loadError, setLoadError] = useState("");
  const [gameLoaderOpen, setGameLoaderOpen] = useState(false);

  /* ── Game library modal state ── */
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryCategory, setLibraryCategory] = useState<GameCategory | "all">("all");
  const [libraryTagFilter, setLibraryTagFilter] = useState<string>("all");

  /* ── Elo report modal state ── */
  const [eloReportOpen, setEloReportOpen] = useState(false);
  const eloReportShownRef = useRef(false);

  /* ── Analysis state ── */
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [analyzedMoves, setAnalyzedMoves] = useState<AnalyzedMove[]>([]);
  const [gameHeaders, setGameHeaders] = useState<Record<string, string>>({});

  /* ── Navigation state ── */
  const [selectedMoveIdx, setSelectedMoveIdx] = useState(-1); // -1 = starting position
  const prevMoveIdxRef = useRef(-1);
  const [boardOrientation, setBoardOrientation] = useState<"white" | "black">("white");

  /* ── Explain modal state ── */
  const [explainOpen, setExplainOpen] = useState(false);
  const [explainData, setExplainData] = useState<{
    explanation: PositionExplanation;
    title: string;
    subtitle: string;
    fen: string;
    uciMoves: string[];
    tab: "played" | "best";
  } | null>(null);

  /* ── Hooks ── */
  const { ref: boardRef, size: boardSize } = useBoardSize(540);
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();
  const showCoords = useShowCoordinates();
  const moveListRef = useRef<HTMLDivElement>(null);

  /* ── Preload sounds ── */
  useEffect(() => { preloadSounds(); }, []);

  /* ── Load PGN from sessionStorage (from Game Library on main page) ── */
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("firechess-library-pgn");
      if (stored) {
        setPgnText(stored);
        sessionStorage.removeItem("firechess-library-pgn");
      }
    } catch { /* sessionStorage unavailable */ }
  }, []);

  /* ── Load recent games from Lichess / Chess.com ── */
  const fetchRecentGames = useCallback(async () => {
    const username = loadUsername.trim();
    if (!username) { setLoadError("Enter a username"); return; }
    setLoadingGames(true);
    setLoadError("");
    setRecentGames([]);

    try {
      if (loadSource === "lichess") {
        // Lichess: fetch last 10 games as PGN text, then split
        const url = `https://lichess.org/api/games/user/${encodeURIComponent(username)}?max=10&moves=true&opening=true&clocks=true&evals=false&pgnInBody=true`;
        const res = await fetch(url, { headers: { Accept: "application/x-chess-pgn" } });
        if (!res.ok) {
          if (res.status === 404) throw new Error("User not found on Lichess");
          throw new Error(`Lichess API error (${res.status})`);
        }
        const text = await res.text();
        // Split multi-game PGN by double newline before [Event
        const games = text.split(/\n\n(?=\[Event )/).filter(g => g.trim());
        if (games.length === 0) throw new Error("No games found for this user");
        const parsed = games.map(pgn => {
          const headers: Record<string, string> = {};
          const headerLines = pgn.match(/\[(\w+)\s+"([^"]*)"\]/g) ?? [];
          for (const line of headerLines) {
            const m = line.match(/\[(\w+)\s+"([^"]*)"\]/);
            if (m) headers[m[1]] = m[2];
          }
          return {
            white: headers.White ?? "?",
            black: headers.Black ?? "?",
            date: headers.UTCDate ?? headers.Date ?? "?",
            result: headers.Result ?? "?",
            event: headers.Event,
            pgn: pgn.trim(),
          };
        });
        setRecentGames(parsed);
      } else {
        // Chess.com: fetch latest archive then extract last 10
        const archRes = await fetch(`https://api.chess.com/pub/player/${encodeURIComponent(username)}/games/archives`);
        if (!archRes.ok) {
          if (archRes.status === 404) throw new Error("User not found on Chess.com");
          throw new Error(`Chess.com API error (${archRes.status})`);
        }
        const archData = await archRes.json();
        const archives: string[] = archData.archives ?? [];
        if (archives.length === 0) throw new Error("No games found for this user");

        // Fetch the most recent archive
        const latestUrl = archives[archives.length - 1];
        const gamesRes = await fetch(latestUrl);
        if (!gamesRes.ok) throw new Error("Failed to fetch games from Chess.com");
        const gamesData = await gamesRes.json();
        const allGames: { pgn?: string; white?: { username?: string; rating?: number }; black?: { username?: string; rating?: number }; end_time?: number }[] = gamesData.games ?? [];

        // Take last 10 (most recent)
        const last10 = allGames.filter(g => g.pgn).slice(-10).reverse();
        if (last10.length === 0) throw new Error("No games with PGN found");

        const parsed = last10.map(g => {
          const pgn = g.pgn!;
          const headers: Record<string, string> = {};
          const headerLines = pgn.match(/\[(\w+)\s+"([^"]*)"\]/g) ?? [];
          for (const line of headerLines) {
            const m = line.match(/\[(\w+)\s+"([^"]*)"\]/);
            if (m) headers[m[1]] = m[2];
          }
          return {
            white: headers.White ?? g.white?.username ?? "?",
            black: headers.Black ?? g.black?.username ?? "?",
            date: headers.UTCDate ?? headers.Date ?? (g.end_time ? new Date(g.end_time * 1000).toISOString().slice(0, 10) : "?"),
            result: headers.Result ?? "?",
            event: headers.Event,
            pgn: pgn.trim(),
          };
        });
        setRecentGames(parsed);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load games");
    } finally {
      setLoadingGames(false);
    }
  }, [loadUsername, loadSource]);

  // Track whether move navigation is sequential (±1) to enable/disable animation
  const isSequentialNav = Math.abs(selectedMoveIdx - prevMoveIdxRef.current) <= 1;
  useEffect(() => { prevMoveIdxRef.current = selectedMoveIdx; }, [selectedMoveIdx]);

  /* ── Derived state ── */
  const currentFen = useMemo(() => {
    if (selectedMoveIdx < 0) {
      // Starting position - use first move's fenBefore or default start
      return analyzedMoves.length > 0 ? analyzedMoves[0].fenBefore : "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    }
    return analyzedMoves[selectedMoveIdx]?.fenAfter ?? "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  }, [selectedMoveIdx, analyzedMoves]);

  const currentEval = useMemo(() => {
    if (analyzedMoves.length === 0) return 0;
    if (selectedMoveIdx < 0) return analyzedMoves[0]?.evalBefore ?? 0;
    return analyzedMoves[selectedMoveIdx]?.evalAfter ?? 0;
  }, [selectedMoveIdx, analyzedMoves]);

  const selectedMove = selectedMoveIdx >= 0 ? analyzedMoves[selectedMoveIdx] : null;

  /* ── Board overlay: highlight from/to squares & show accuracy badge ── */
  const analyzeSquareStyles = useMemo<Record<string, React.CSSProperties>>(() => {
    if (!selectedMove) return {};
    const from = selectedMove.uci.slice(0, 2);
    const to = selectedMove.uci.slice(2, 4);
    const cls = selectedMove.classification;
    const isRed = cls === "blunder" || cls === "mistake";
    const isYellow = cls === "inaccuracy";
    const color = isRed
      ? "rgba(239, 68, 68, 0.35)"
      : isYellow
        ? "rgba(245, 158, 11, 0.3)"
        : "rgba(34, 197, 94, 0.25)";
    return {
      [from]: { backgroundColor: color },
      [to]: { backgroundColor: color },
    };
  }, [selectedMove]);

  const analyzeCustomSquare = useMemo(() => {
    return ((props: any) => {
      const sq = props?.square as string | undefined;
      const to = selectedMove?.uci.slice(2, 4);
      const showBadge = sq === to && selectedMove;
      return (
        <div style={props?.style} className="relative h-full w-full">
          {props?.children}
          {showBadge && (
            <span
              className="pointer-events-none absolute -right-0.5 -top-0.5 z-[40] flex h-5 w-5 items-center justify-center rounded-full text-[11px] shadow-lg"
              style={{ backgroundColor: CLASSIFICATION_BADGE_COLORS[selectedMove.classification] }}
              title={selectedMove.classification}
            >
              {CLASSIFICATION_EMOJI[selectedMove.classification]}
            </span>
          )}
        </div>
      );
    }) as any;
  }, [selectedMove]);

  /* ── Filtered library games ── */
  const filteredLibraryGames = useMemo(() => {
    let games = [...SAMPLE_GAMES];
    if (libraryCategory !== "all") games = games.filter(g => g.category === libraryCategory);
    if (libraryTagFilter !== "all") games = games.filter(g => g.tags.includes(libraryTagFilter as any));
    return games;
  }, [libraryCategory, libraryTagFilter]);

  /* ── Summary stats ── */
  const summary = useMemo(() => {
    if (analyzedMoves.length === 0) return null;
    const whiteMoves = analyzedMoves.filter(m => m.color === "w");
    const blackMoves = analyzedMoves.filter(m => m.color === "b");

    const avgCpLoss = (moves: AnalyzedMove[]) => {
      const losses = moves.map(m => m.cpLoss);
      return losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;
    };

    const accuracy = (acpl: number) => Math.min(99.5, Math.max(25, 100 * Math.exp(-acpl / 120)));

    const count = (moves: AnalyzedMove[], cls: MoveClassification) => moves.filter(m => m.classification === cls).length;

    const whiteAcpl = avgCpLoss(whiteMoves);
    const blackAcpl = avgCpLoss(blackMoves);

    return {
      white: {
        acpl: Math.round(whiteAcpl * 10) / 10,
        accuracy: Math.round(accuracy(whiteAcpl) * 10) / 10,
        brilliant: count(whiteMoves, "brilliant"),
        best: count(whiteMoves, "best"),
        good: count(whiteMoves, "good"),
        book: count(whiteMoves, "book"),
        inaccuracy: count(whiteMoves, "inaccuracy"),
        mistake: count(whiteMoves, "mistake"),
        blunder: count(whiteMoves, "blunder"),
      },
      black: {
        acpl: Math.round(blackAcpl * 10) / 10,
        accuracy: Math.round(accuracy(blackAcpl) * 10) / 10,
        brilliant: count(blackMoves, "brilliant"),
        best: count(blackMoves, "best"),
        good: count(blackMoves, "good"),
        book: count(blackMoves, "book"),
        inaccuracy: count(blackMoves, "inaccuracy"),
        mistake: count(blackMoves, "mistake"),
        blunder: count(blackMoves, "blunder"),
      },
    };
  }, [analyzedMoves]);

  /* ── Eval graph data ── */
  const evalGraph = useMemo(() => {
    if (analyzedMoves.length === 0) return [];
    return [
      { x: 0, cp: analyzedMoves[0].evalBefore },
      ...analyzedMoves.map((m, i) => ({ x: i + 1, cp: m.evalAfter })),
    ];
  }, [analyzedMoves]);

  /* ── Estimated Elo from ACPL ── */
  const eloEstimate = useMemo(() => {
    if (!summary) return null;
    // ACPL to Elo mapping (rough heuristic)
    const acplToElo = (acpl: number) => {
      if (acpl <= 10) return 2700;
      if (acpl <= 15) return 2500;
      if (acpl <= 20) return 2300;
      if (acpl <= 30) return 2100;
      if (acpl <= 40) return 1900;
      if (acpl <= 50) return 1700;
      if (acpl <= 65) return 1500;
      if (acpl <= 80) return 1300;
      if (acpl <= 100) return 1100;
      if (acpl <= 130) return 900;
      return 700;
    };
    const whiteElo = acplToElo(summary.white.acpl);
    const blackElo = acplToElo(summary.black.acpl);
    return { white: whiteElo, black: blackElo };
  }, [summary]);

  /* ── Auto-show elo report when analysis finishes ── */
  useEffect(() => {
    if (!analyzing && summary && eloEstimate && !eloReportShownRef.current) {
      eloReportShownRef.current = true;
      // Small delay so the board has time to render
      const t = setTimeout(() => setEloReportOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [analyzing, summary, eloEstimate]);

  /* ── Start analysis ── */
  const analyzeGame = useCallback(async () => {
    setError("");
    const trimmed = pgnText.trim();
    if (!trimmed) {
      setError("Please paste a PGN to analyze.");
      return;
    }

    const parsed = parsePgn(trimmed);
    if ("error" in parsed) {
      setError(parsed.error);
      return;
    }
    if (parsed.moves.length === 0) {
      setError("No moves found in PGN. Please check the format and try again.");
      return;
    }

    setAnalyzing(true);
    eloReportShownRef.current = false;
    setEloReportOpen(false);
    setAnalyzedMoves([]);
    setSelectedMoveIdx(-1);
    setGameHeaders(parsed.headers);
    setProgress({ current: 0, total: parsed.moves.length });

    const results: AnalyzedMove[] = [];

    // Evaluate starting position
    const startEval = await stockfishPool.evaluateFen(parsed.moves[0].fenBefore, engineDepth);
    let prevEvalWhite = startEval?.cp ?? 15; // slight white advantage default

    for (let i = 0; i < parsed.moves.length; i++) {
      const move = parsed.moves[i];
      setProgress({ current: i + 1, total: parsed.moves.length });

      // Evaluate position after this move
      const evalResult = await stockfishPool.evaluateFen(move.fenAfter, engineDepth);
      // Get best move for the position before
      const bestResult = await stockfishPool.evaluateFen(move.fenBefore, engineDepth);
      // Get PV for the position before
      const pvResult = await stockfishPool.getPrincipalVariation(move.fenBefore, 6, engineDepth);

      // Normalize evals to white's perspective
      const evalAfterWhite = evalResult ? (move.color === "w" ? -evalResult.cp : evalResult.cp) : prevEvalWhite;
      const evalBeforeWhite = prevEvalWhite;

      // CP loss from the mover's perspective
      const evalBeforeMover = move.color === "w" ? evalBeforeWhite : -evalBeforeWhite;
      const evalAfterMover = move.color === "w" ? evalAfterWhite : -evalAfterWhite;
      const cpLoss = Math.max(0, evalBeforeMover - evalAfterMover);

      // Was this the engine's best move?
      const isBestMove = bestResult?.bestMove === move.uci ||
        (bestResult?.bestMove && move.uci.startsWith(bestResult.bestMove.slice(0, 4)) && cpLoss <= 5);

      // Convert best move UCI to SAN
      let bestMoveSan: string | null = null;
      if (bestResult?.bestMove) {
        try {
          const tempGame = new Chess(move.fenBefore);
          const from = bestResult.bestMove.slice(0, 2);
          const to = bestResult.bestMove.slice(2, 4);
          const promo = bestResult.bestMove.slice(4, 5) || undefined;
          const r = tempGame.move({ from, to, promotion: promo as any });
          if (r) bestMoveSan = r.san;
        } catch {}
      }

      results.push({
        idx: i,
        san: move.san,
        uci: move.uci,
        fenBefore: move.fenBefore,
        fenAfter: move.fenAfter,
        evalBefore: evalBeforeWhite,
        evalAfter: evalAfterWhite,
        bestMove: bestResult?.bestMove ?? null,
        bestMoveSan,
        cpLoss,
        classification: classifyMove(cpLoss, !!isBestMove, evalBeforeMover, evalAfterMover),
        color: move.color,
        moveNumber: move.moveNumber,
        pvMoves: pvResult?.pvMoves ?? [],
      });

      prevEvalWhite = evalAfterWhite;

      // Update moves progressively
      setAnalyzedMoves([...results]);
    }

    setAnalyzing(false);
    setSelectedMoveIdx(0);
    if (soundEnabled) playSound("move");
  }, [pgnText, engineDepth, soundEnabled]);

  /* ── Keyboard navigation ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (analyzedMoves.length === 0) return;
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSelectedMoveIdx(prev => Math.max(-1, prev - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setSelectedMoveIdx(prev => Math.min(analyzedMoves.length - 1, prev + 1));
      } else if (e.key === "Home") {
        e.preventDefault();
        setSelectedMoveIdx(-1);
      } else if (e.key === "End") {
        e.preventDefault();
        setSelectedMoveIdx(analyzedMoves.length - 1);
      } else if (e.key === "f") {
        setBoardOrientation(o => o === "white" ? "black" : "white");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [analyzedMoves.length]);

  /* ── Auto-scroll move list ── */
  useEffect(() => {
    if (selectedMoveIdx < 0 || !moveListRef.current) return;
    const el = moveListRef.current.querySelector(`[data-move-idx="${selectedMoveIdx}"]`);
    if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedMoveIdx]);

  /* ── Play sound on move navigation ── */
  useEffect(() => {
    if (!soundEnabled || analyzedMoves.length === 0) return;
    // Skip initial render and when idx hasn't actually changed
    if (selectedMoveIdx < 0) return;
    const move = analyzedMoves[selectedMoveIdx];
    if (!move) return;
    const san = move.san;
    if (san.includes("+") || san.includes("#")) {
      playSound("check");
    } else if (san.includes("x")) {
      playSound("capture");
    } else {
      playSound("move");
    }
  }, [selectedMoveIdx, soundEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Explain move ── */
  const openExplain = useCallback((move: AnalyzedMove, tab: "played" | "best") => {
    const explanation = explainMoves(
      move.fenBefore,
      move.uci,
      move.bestMove,
      move.cpLoss,
      move.color === "w" ? move.evalBefore : -move.evalBefore,
      move.color === "w" ? move.evalAfter : -move.evalAfter,
    );

    const ex = tab === "played" ? explanation.played : explanation.best;
    const pvMoveList = tab === "best" ? move.pvMoves : [move.uci];

    const playedTitle = (() => {
      if (move.classification === "blunder") return `Why ${move.san} is a blunder`;
      if (move.classification === "mistake") return `Why ${move.san} is a mistake`;
      if (move.classification === "inaccuracy") return `Why ${move.san} is inaccurate`;
      if (move.classification === "brilliant") return `Why ${move.san} is brilliant`;
      if (move.classification === "best") return `Why ${move.san} is the best move`;
      if (move.classification === "good") return `Why ${move.san} is a good move`;
      return `About ${move.san}`;
    })();

    const bestTitle = move.cpLoss > 0
      ? `Why ${move.bestMoveSan ?? "the engine move"} is better`
      : `Engine's top line from this position`;

    setExplainData({
      explanation: ex,
      title: tab === "played" ? playedTitle : bestTitle,
      subtitle: `Move ${move.moveNumber}${move.color === "w" ? "." : "..."} — ${formatEval(move.evalBefore)} → ${formatEval(move.evalAfter)}`,
      fen: move.fenBefore,
      uciMoves: pvMoveList,
      tab,
    });
    setExplainOpen(true);
  }, []);

  /* ── Handle board piece drop (navigate to that point) ── */
  const onPieceDrop = useCallback(() => false, []);

  /* ── Eval bar graph (mini sparkline) ── */
  const evalGraphSvg = useMemo(() => {
    if (evalGraph.length < 2) return null;
    const w = 600;
    const h = 60;
    const maxCp = 400;
    const points = evalGraph.map((pt, i) => {
      const x = (i / (evalGraph.length - 1)) * w;
      const clamped = Math.max(-maxCp, Math.min(maxCp, pt.cp));
      const y = h / 2 - (clamped / maxCp) * (h / 2);
      return `${x},${y}`;
    });

    // Find the selected move position on the graph
    const selectedX = selectedMoveIdx >= 0
      ? ((selectedMoveIdx + 1) / (evalGraph.length - 1)) * w
      : 0;

    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[60px] cursor-pointer" preserveAspectRatio="none"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const ratio = x / rect.width;
          const idx = Math.round(ratio * (evalGraph.length - 1)) - 1;
          setSelectedMoveIdx(Math.max(-1, Math.min(analyzedMoves.length - 1, idx)));
        }}
      >
        {/* Background */}
        <rect x="0" y="0" width={w} height={h} fill="transparent" />
        {/* Center line */}
        <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        {/* White advantage area */}
        <polygon
          points={`0,${h / 2} ${points.map((p, i) => {
            const clamped = Math.max(-maxCp, Math.min(maxCp, evalGraph[i].cp));
            const y = h / 2 - (clamped / maxCp) * (h / 2);
            return y < h / 2 ? p : `${(i / (evalGraph.length - 1)) * w},${h / 2}`;
          }).join(" ")} ${w},${h / 2}`}
          fill="rgba(255,255,255,0.08)"
        />
        {/* Black advantage area */}
        <polygon
          points={`0,${h / 2} ${points.map((p, i) => {
            const clamped = Math.max(-maxCp, Math.min(maxCp, evalGraph[i].cp));
            const y = h / 2 - (clamped / maxCp) * (h / 2);
            return y > h / 2 ? p : `${(i / (evalGraph.length - 1)) * w},${h / 2}`;
          }).join(" ")} ${w},${h / 2}`}
          fill="rgba(100,100,100,0.1)"
        />
        {/* Eval line */}
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="2"
        />
        {/* Blunder/mistake markers */}
        {analyzedMoves.map((m, i) => {
          if (m.classification !== "blunder" && m.classification !== "mistake") return null;
          const x = ((i + 1) / (evalGraph.length - 1)) * w;
          const clamped = Math.max(-maxCp, Math.min(maxCp, m.evalAfter));
          const y = h / 2 - (clamped / maxCp) * (h / 2);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              fill={m.classification === "blunder" ? "#ef4444" : "#f97316"}
              opacity="0.8"
            />
          );
        })}
        {/* Selected move indicator */}
        {selectedMoveIdx >= 0 && (
          <line x1={selectedX} y1="0" x2={selectedX} y2={h} stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
        )}
      </svg>
    );
  }, [evalGraph, selectedMoveIdx, analyzedMoves]);

  /* ═══════════════════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════════════════ */

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-black">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Game Analyzer
            </span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Paste a PGN to get move-by-move analysis with Stockfish — entirely in your browser
          </p>
        </div>

        {/* ── PGN Input (shown when no analysis is running/done) ── */}
        {analyzedMoves.length === 0 && !analyzing && (
          <div className="mx-auto max-w-2xl space-y-4">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Paste your PGN
              </label>
              <textarea
                value={pgnText}
                onChange={(e) => setPgnText(e.target.value)}
                placeholder={`[Event "Casual Game"]\n[White "You"]\n[Black "Opponent"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 ...`}
                className="h-64 w-full resize-none rounded-xl border border-white/[0.08] bg-black/40 px-4 py-3 font-mono text-sm text-slate-200 placeholder-slate-600 outline-none transition-colors focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20"
              />

              {error && (
                <p className="mt-2 text-sm text-red-400">{error}</p>
              )}

              <button
                onClick={analyzeGame}
                className="mt-4 w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/30 hover:brightness-110 active:scale-[0.98]"
              >
                🔍 Analyze Game
              </button>

              {/* Settings panel */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setSettingsOpen(o => !o)}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-400 transition-colors hover:text-slate-200"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
                  </svg>
                  Settings
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${settingsOpen ? "rotate-180" : ""}`}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {settingsOpen && (
                  <div className="mt-3 space-y-3 rounded-xl border border-white/[0.06] bg-black/30 p-4">
                    {/* Engine depth */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-300">Engine Depth</p>
                        <p className="text-[10px] text-slate-500">Higher = more accurate but slower</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {DEPTH_OPTIONS.map(d => (
                          <button
                            key={d}
                            onClick={() => setEngineDepth(d)}
                            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                              engineDepth === d
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                : "bg-white/[0.04] text-slate-500 border border-white/[0.04] hover:bg-white/[0.08] hover:text-slate-300"
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sound toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-300">Move Sounds</p>
                        <p className="text-[10px] text-slate-500">Play sounds when navigating moves</p>
                      </div>
                      <button
                        onClick={() => setSoundEnabled(s => !s)}
                        className={`relative h-6 w-11 rounded-full transition-colors ${
                          soundEnabled ? "bg-blue-500" : "bg-white/[0.1]"
                        }`}
                      >
                        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                          soundEnabled ? "translate-x-5" : ""
                        }`} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
                <span className="rounded-full border border-white/[0.06] px-2.5 py-1">
                  Depth {engineDepth}
                </span>
                <span className="rounded-full border border-white/[0.06] px-2.5 py-1">
                  Client-side Stockfish 18
                </span>
                <span className="rounded-full border border-white/[0.06] px-2.5 py-1">
                  ← → keyboard nav
                </span>
                <span className="rounded-full border border-white/[0.06] px-2.5 py-1">
                  F to flip board
                </span>
              </div>
            </div>

            {/* Sample PGN buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* ── Load from Lichess / Chess.com ── */}
              <button
                type="button"
                onClick={() => setGameLoaderOpen(true)}
                className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-center transition-all hover:border-blue-500/20 hover:bg-blue-500/[0.04] cursor-pointer"
              >
                <span className="mb-2 flex justify-center text-2xl">📥</span>
                <p className="text-sm font-bold text-blue-400 group-hover:text-blue-300">Load from Lichess / Chess.com</p>
                <p className="mt-1 text-[11px] text-slate-500">Import your recent games</p>
              </button>

              {/* ── Browse Game Library ── */}
              <button
                type="button"
                onClick={() => setLibraryOpen(true)}
                className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-center transition-all hover:border-amber-500/20 hover:bg-amber-500/[0.04] cursor-pointer"
              >
                <span className="mb-2 flex justify-center text-2xl">📚</span>
                <p className="text-sm font-bold text-amber-400 group-hover:text-amber-300">Browse Game Library</p>
                <p className="mt-1 text-[11px] text-slate-500">{SAMPLE_GAMES.length} famous games across {GAME_CATEGORIES.length} collections</p>
              </button>
            </div>
          </div>
        )}

        {/* ── Analysis progress ── */}
        {analyzing && (
          <div className="mx-auto mb-6 max-w-2xl">
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-blue-300">
                  Analyzing move {progress.current} of {progress.total}...
                </p>
                <span className="text-xs font-mono text-blue-400/60">
                  {progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                  style={{ width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : "0%" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Analysis results ── */}
        {analyzedMoves.length > 0 && (
          <div className="space-y-4">
            {/* Game info header */}
            {(gameHeaders.White || gameHeaders.Black) && (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-sm border border-white/20 bg-white" />
                      <span className="text-sm font-bold text-white">{gameHeaders.White ?? "White"}</span>
                      {gameHeaders.WhiteElo && <span className="text-xs text-slate-500">({gameHeaders.WhiteElo})</span>}
                    </div>
                    <span className="text-xs text-slate-500">vs</span>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-sm border border-white/20 bg-slate-800" />
                      <span className="text-sm font-bold text-white">{gameHeaders.Black ?? "Black"}</span>
                      {gameHeaders.BlackElo && <span className="text-xs text-slate-500">({gameHeaders.BlackElo})</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    {gameHeaders.Event && <span>{gameHeaders.Event}</span>}
                    {gameHeaders.Date && <span>{gameHeaders.Date}</span>}
                    {gameHeaders.Result && (
                      <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 font-bold text-slate-300">
                        {gameHeaders.Result}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Summary stats */}
            {summary && !analyzing && (
              <div className="grid grid-cols-2 gap-3">
                {/* White stats */}
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-3.5 w-3.5 rounded-sm border border-white/30 bg-white" />
                    <span className="text-sm font-bold text-white">{gameHeaders.White ?? "White"}</span>
                  </div>
                  <div className="mb-3 flex items-baseline gap-2">
                    <span className="text-3xl font-black tabular-nums text-white">{summary.white.accuracy}%</span>
                    <span className="text-xs text-slate-500">accuracy</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {summary.white.brilliant > 0 && <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[11px] font-bold text-cyan-400">!! {summary.white.brilliant}</span>}
                    {summary.white.best > 0 && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-400">Best {summary.white.best}</span>}
                    {summary.white.good > 0 && <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400/70">Good {summary.white.good}</span>}
                    {summary.white.inaccuracy > 0 && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-400">?! {summary.white.inaccuracy}</span>}
                    {summary.white.mistake > 0 && <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[11px] font-bold text-orange-400">? {summary.white.mistake}</span>}
                    {summary.white.blunder > 0 && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-bold text-red-400">?? {summary.white.blunder}</span>}
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">ACPL: {summary.white.acpl}</p>
                </div>

                {/* Black stats */}
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-3.5 w-3.5 rounded-sm border border-white/20 bg-slate-700" />
                    <span className="text-sm font-bold text-white">{gameHeaders.Black ?? "Black"}</span>
                  </div>
                  <div className="mb-3 flex items-baseline gap-2">
                    <span className="text-3xl font-black tabular-nums text-white">{summary.black.accuracy}%</span>
                    <span className="text-xs text-slate-500">accuracy</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {summary.black.brilliant > 0 && <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[11px] font-bold text-cyan-400">!! {summary.black.brilliant}</span>}
                    {summary.black.best > 0 && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-400">Best {summary.black.best}</span>}
                    {summary.black.good > 0 && <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400/70">Good {summary.black.good}</span>}
                    {summary.black.inaccuracy > 0 && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-400">?! {summary.black.inaccuracy}</span>}
                    {summary.black.mistake > 0 && <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[11px] font-bold text-orange-400">? {summary.black.mistake}</span>}
                    {summary.black.blunder > 0 && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-bold text-red-400">?? {summary.black.blunder}</span>}
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">ACPL: {summary.black.acpl}</p>
                </div>
              </div>
            )}

            {/* Eval graph */}
            {evalGraph.length > 1 && (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                {evalGraphSvg}
              </div>
            )}

            {/* Main analysis area: Board + Move list */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
              {/* Board column */}
              <div className="flex flex-col items-center gap-3">
                <div ref={boardRef} className="w-full max-w-[640px]">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <EvalBar evalCp={currentEval} height={boardSize} />
                    <div className="overflow-hidden rounded-xl">
                      <Chessboard
                        key={isSequentialNav ? "seq" : `jump-${selectedMoveIdx}`}
                        id="analyze-board"
                        position={currentFen}
                        boardOrientation={boardOrientation}
                        boardWidth={boardSize}
                        arePiecesDraggable={false}
                        onPieceDrop={onPieceDrop}
                        animationDuration={isSequentialNav ? 200 : 0}
                        customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
                        customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
                        showBoardNotation={showCoords}
                        customSquareStyles={analyzeSquareStyles}
                        customSquare={analyzeCustomSquare}
                        customPieces={customPieces}
                      />
                    </div>
                  </div>
                </div>

                {/* Board controls */}
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setSelectedMoveIdx(-1)} disabled={selectedMoveIdx <= -1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-slate-400 transition-colors hover:bg-white/[0.12] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    title="First move (Home)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="11 19 2 12 11 5"/><line x1="22" y1="5" x2="22" y2="19"/></svg>
                  </button>
                  <button onClick={() => setSelectedMoveIdx(p => Math.max(-1, p - 1))} disabled={selectedMoveIdx <= -1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-slate-400 transition-colors hover:bg-white/[0.12] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Previous move (←)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <button onClick={() => setSelectedMoveIdx(p => Math.min(analyzedMoves.length - 1, p + 1))} disabled={selectedMoveIdx >= analyzedMoves.length - 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-slate-400 transition-colors hover:bg-white/[0.12] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Next move (→)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                  <button onClick={() => setSelectedMoveIdx(analyzedMoves.length - 1)} disabled={selectedMoveIdx >= analyzedMoves.length - 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-slate-400 transition-colors hover:bg-white/[0.12] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Last move (End)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="13 19 22 12 13 5"/><line x1="2" y1="5" x2="2" y2="19"/></svg>
                  </button>
                  <div className="mx-1 h-5 w-px bg-white/[0.08]" />
                  <button onClick={() => setBoardOrientation(o => o === "white" ? "black" : "white")}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-slate-400 transition-colors hover:bg-white/[0.12] hover:text-white"
                    title="Flip board (F)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4"/></svg>
                  </button>
                  <button onClick={() => { setAnalyzedMoves([]); setGameHeaders({}); setSelectedMoveIdx(-1); eloReportShownRef.current = false; }}
                    className="flex h-8 items-center justify-center gap-1.5 rounded-lg bg-white/[0.06] px-3 text-xs font-medium text-slate-400 transition-colors hover:bg-white/[0.12] hover:text-white"
                    title="New game">
                    New game
                  </button>
                  <button onClick={() => setGameLoaderOpen(true)}
                    className="flex h-8 items-center justify-center gap-1.5 rounded-lg bg-white/[0.06] px-3 text-xs font-medium text-slate-400 transition-colors hover:bg-white/[0.12] hover:text-white"
                    title="Load a game from Lichess or Chess.com">
                    📥 Load
                  </button>
                  {summary && !analyzing && (
                    <button onClick={() => setEloReportOpen(true)}
                      className="flex h-8 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/20 px-3 text-xs font-bold text-purple-300 transition-colors hover:from-purple-500/30 hover:to-pink-500/30"
                      title="View Elo Report">
                      🔥 Elo Report
                    </button>
                  )}
                </div>

                {/* Current move info */}
                {selectedMove && (
                  <div className={`w-full max-w-[640px] rounded-xl border ${CLASSIFICATION_BORDER[selectedMove.classification]} ${CLASSIFICATION_BG[selectedMove.classification]} p-3`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-black font-mono ${CLASSIFICATION_COLORS[selectedMove.classification]}`}>
                          {selectedMove.moveNumber}{selectedMove.color === "w" ? "." : "..."}{selectedMove.san}
                        </span>
                        {CLASSIFICATION_ICONS[selectedMove.classification] && (
                          <span className={`rounded-md px-1.5 py-0.5 text-xs font-bold ${CLASSIFICATION_BG[selectedMove.classification]} ${CLASSIFICATION_COLORS[selectedMove.classification]}`}>
                            {CLASSIFICATION_ICONS[selectedMove.classification]}
                          </span>
                        )}
                        <span className="text-sm">{CLASSIFICATION_EMOJI[selectedMove.classification]}</span>
                        <span className="text-xs capitalize text-slate-400">{selectedMove.classification}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-500">
                          {formatEval(selectedMove.evalBefore)} → {formatEval(selectedMove.evalAfter)}
                        </span>
                        {selectedMove.cpLoss > 0 && (
                          <span className={`text-xs font-bold ${CLASSIFICATION_COLORS[selectedMove.classification]}`}>
                            −{(selectedMove.cpLoss / 100).toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Best move & action buttons */}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      {selectedMove.bestMoveSan && selectedMove.bestMove !== selectedMove.uci && (
                        <p className="text-xs text-slate-400">
                          Best: <span className="font-bold text-emerald-400">{selectedMove.bestMoveSan}</span>
                        </p>
                      )}
                      <div className="flex gap-1.5 ml-auto">
                        <button
                          onClick={() => openExplain(selectedMove, "played")}
                          className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                            selectedMove.cpLoss >= 30
                              ? "border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                              : "border-blue-500/20 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                          }`}
                        >
                          💡 Explain
                        </button>
                        {selectedMove.bestMove && selectedMove.bestMove !== selectedMove.uci && (
                          <button
                            onClick={() => openExplain(selectedMove, "best")}
                            className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
                          >
                            Explain best
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Move list column */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden flex flex-col w-full lg:w-auto" style={{ maxHeight: boardSize + 120 }}>
                <div className="border-b border-white/[0.06] px-4 py-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Moves</h3>
                </div>
                <div ref={moveListRef} className="flex-1 overflow-y-auto p-2">
                  <div className="grid" style={{ gridTemplateColumns: "auto 1fr 1fr" }}>
                    {/* Group moves by pairs (white + black) */}
                    {(() => {
                      const rows: React.ReactNode[] = [];
                      let i = 0;
                      while (i < analyzedMoves.length) {
                        const whiteMove = analyzedMoves[i]?.color === "w" ? analyzedMoves[i] : null;
                        const blackMove = whiteMove
                          ? (analyzedMoves[i + 1]?.color === "b" ? analyzedMoves[i + 1] : null)
                          : (analyzedMoves[i]?.color === "b" ? analyzedMoves[i] : null);
                        const moveNum = whiteMove?.moveNumber ?? blackMove?.moveNumber ?? 0;

                        rows.push(
                          <div key={`row-${i}`} className="contents">
                            {/* Move number */}
                            <div className="flex items-center px-2 py-0.5 text-[11px] font-mono text-slate-600">
                              {moveNum}.
                            </div>
                            {/* White move */}
                            {whiteMove ? (
                              <button
                                data-move-idx={whiteMove.idx}
                                onClick={() => setSelectedMoveIdx(whiteMove.idx)}
                                className={`relative flex items-center gap-1 rounded-md px-2 py-0.5 text-left text-xs font-mono transition-colors ${
                                  selectedMoveIdx === whiteMove.idx
                                    ? `${CLASSIFICATION_BG[whiteMove.classification]} ${CLASSIFICATION_COLORS[whiteMove.classification]} font-bold`
                                    : "text-slate-300 hover:bg-white/[0.06]"
                                }`}
                              >
                                <span>{whiteMove.san}</span>
                                {whiteMove.classification !== "good" && whiteMove.classification !== "book" && (
                                  <span className={`text-[10px] ${CLASSIFICATION_COLORS[whiteMove.classification]}`}>
                                    {CLASSIFICATION_ICONS[whiteMove.classification]}
                                  </span>
                                )}
                                <span className="absolute -top-1.5 -right-1 text-[9px] leading-none" title={whiteMove.classification}>
                                  {CLASSIFICATION_EMOJI[whiteMove.classification]}
                                </span>
                              </button>
                            ) : (
                              <div />
                            )}
                            {/* Black move */}
                            {blackMove ? (
                              <button
                                data-move-idx={blackMove.idx}
                                onClick={() => setSelectedMoveIdx(blackMove.idx)}
                                className={`relative flex items-center gap-1 rounded-md px-2 py-0.5 text-left text-xs font-mono transition-colors ${
                                  selectedMoveIdx === blackMove.idx
                                    ? `${CLASSIFICATION_BG[blackMove.classification]} ${CLASSIFICATION_COLORS[blackMove.classification]} font-bold`
                                    : "text-slate-300 hover:bg-white/[0.06]"
                                }`}
                              >
                                <span>{blackMove.san}</span>
                                {blackMove.classification !== "good" && blackMove.classification !== "book" && (
                                  <span className={`text-[10px] ${CLASSIFICATION_COLORS[blackMove.classification]}`}>
                                    {CLASSIFICATION_ICONS[blackMove.classification]}
                                  </span>
                                )}
                                <span className="absolute -top-1.5 -right-1 text-[9px] leading-none" title={blackMove.classification}>
                                  {CLASSIFICATION_EMOJI[blackMove.classification]}
                                </span>
                              </button>
                            ) : (
                              <div />
                            )}
                          </div>
                        );

                        i += whiteMove ? (blackMove ? 2 : 1) : 1;
                      }
                      return rows;
                    })()}
                  </div>

                  {/* Result */}
                  {gameHeaders.Result && !analyzing && (
                    <div className="mt-2 text-center text-xs font-bold text-slate-500">
                      {gameHeaders.Result}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Key moments — only blunders and mistakes */}
            {!analyzing && analyzedMoves.some(m => m.classification === "blunder" || m.classification === "mistake") && (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                <h3 className="mb-3 text-sm font-bold text-white">Key Moments</h3>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {analyzedMoves
                    .filter(m => m.classification === "blunder" || m.classification === "mistake")
                    .map(m => (
                      <button
                        key={m.idx}
                        onClick={() => setSelectedMoveIdx(m.idx)}
                        className={`group flex items-center gap-3 rounded-xl border ${CLASSIFICATION_BORDER[m.classification]} ${CLASSIFICATION_BG[m.classification]} p-3 text-left transition-all hover:brightness-110`}
                      >
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg font-black ${CLASSIFICATION_COLORS[m.classification]}`}>
                          {CLASSIFICATION_ICONS[m.classification]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-bold ${CLASSIFICATION_COLORS[m.classification]}`}>
                            {m.moveNumber}{m.color === "w" ? "." : "..."}{m.san}
                            <span className="ml-1.5 text-xs text-slate-500 font-normal capitalize">{m.classification}</span>
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {formatEval(m.evalBefore)} → {formatEval(m.evalAfter)}
                            {m.bestMoveSan && <span className="ml-1.5">Best: <span className="text-emerald-400/70">{m.bestMoveSan}</span></span>}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <span
                            onClick={(e) => { e.stopPropagation(); openExplain(m, "played"); }}
                            className="rounded-md border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400 transition-colors hover:bg-red-500/20 cursor-pointer"
                          >
                            Why?
                          </span>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Explanation Modal — reuses the existing ExplanationModal component */}
      <ExplanationModal
        open={explainOpen}
        onClose={() => setExplainOpen(false)}
        variant="opening"
        activeTab={explainData?.tab ?? "played"}
        richExplanation={explainData?.explanation ?? null}
        title={explainData?.title}
        subtitle={explainData?.subtitle}
        fen={explainData?.fen}
        uciMoves={explainData?.uciMoves}
        boardOrientation={boardOrientation}
        autoPlay
      />

      {/* ── Game Loader Modal ── */}
      {gameLoaderOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setGameLoaderOpen(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-lg rounded-3xl border border-white/[0.1] bg-slate-950 p-6 shadow-2xl animate-fade-in-up"
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setGameLoaderOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-slate-400 transition-colors hover:bg-white/[0.12] hover:text-white"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>

            <h3 className="mb-4 text-lg font-bold text-white">📥 Load Recent Games</h3>

            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="inline-flex rounded-xl border border-white/[0.08] bg-white/[0.03] p-1 shrink-0">
                  <button type="button" onClick={() => { setLoadSource("lichess"); setRecentGames([]); setLoadError(""); }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${loadSource === "lichess" ? "bg-white/[0.1] text-white shadow-sm" : "text-slate-500 hover:text-slate-300"}`}>
                    Lichess
                  </button>
                  <button type="button" onClick={() => { setLoadSource("chesscom"); setRecentGames([]); setLoadError(""); }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${loadSource === "chesscom" ? "bg-white/[0.1] text-white shadow-sm" : "text-slate-500 hover:text-slate-300"}`}>
                    Chess.com
                  </button>
                </div>
                <input
                  type="text"
                  value={loadUsername}
                  onChange={(e) => setLoadUsername(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") fetchRecentGames(); }}
                  placeholder={loadSource === "lichess" ? "Lichess username" : "Chess.com username"}
                  className="flex-1 min-w-0 rounded-xl border border-white/[0.08] bg-black/40 px-3 py-1.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500/40"
                />
                <button type="button" onClick={fetchRecentGames} disabled={loadingGames}
                  className="shrink-0 rounded-xl bg-white/[0.06] px-4 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/[0.1] hover:text-white disabled:opacity-50 cursor-pointer">
                  {loadingGames ? "..." : "Load"}
                </button>
              </div>

              {loadError && <p className="text-xs text-red-400">{loadError}</p>}

              {recentGames.length > 0 && (
                <div className="space-y-1.5 max-h-80 overflow-y-auto rounded-xl border border-white/[0.06] bg-black/30 p-2">
                  {recentGames.map((game, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPgnText(game.pgn);
                        setRecentGames([]);
                        setGameLoaderOpen(false);
                        // If we already had analysis, clear it
                        if (analyzedMoves.length > 0) {
                          setAnalyzedMoves([]);
                          setGameHeaders({});
                          setSelectedMoveIdx(-1);
                          eloReportShownRef.current = false;
                        }
                      }}
                      className="group flex w-full items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2.5 text-left transition-all hover:border-blue-500/20 hover:bg-blue-500/[0.04] cursor-pointer"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-xs font-bold text-slate-400 group-hover:bg-blue-500/10 group-hover:text-blue-300">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-300 group-hover:text-blue-300 truncate">
                          {game.white} vs {game.black}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {game.date} · {game.result}{game.event ? ` · ${game.event}` : ""}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${game.result === "1-0" ? "border-white/10 text-white" : game.result === "0-1" ? "border-slate-600 text-slate-400" : "border-slate-700 text-slate-500"}`}>
                        {game.result}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {recentGames.length === 0 && !loadingGames && !loadError && (
                <p className="text-center text-xs text-slate-600 py-4">Enter your username and hit Load to see your last 10 games</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Game Library Modal ── */}
      {libraryOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setLibraryOpen(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div
            className="relative z-10 flex w-full max-w-5xl max-h-[85vh] flex-col rounded-3xl border border-white/[0.1] bg-slate-950 shadow-2xl animate-fade-in-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-white">📚 Game Library</h3>
                <p className="text-xs text-slate-500 mt-0.5">{SAMPLE_GAMES.length} famous games across {GAME_CATEGORIES.length} collections</p>
              </div>
              <button
                type="button"
                onClick={() => setLibraryOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-slate-400 transition-colors hover:bg-white/[0.12] hover:text-white"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Body: sidebar + grid */}
            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar */}
              <aside className="hidden sm:flex w-56 shrink-0 flex-col gap-1 overflow-y-auto border-r border-white/[0.06] p-3 custom-scrollbar">
                <button
                  onClick={() => setLibraryCategory("all")}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all text-left ${
                    libraryCategory === "all"
                      ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                      : "bg-white/[0.02] text-slate-400 border border-white/[0.04] hover:bg-white/[0.06] hover:text-slate-200"
                  }`}
                >
                  <span>📚</span>
                  <span className="truncate">All Games</span>
                  <span className="ml-auto rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                    {SAMPLE_GAMES.length}
                  </span>
                </button>
                {GAME_CATEGORIES.map(cat => {
                  const count = SAMPLE_GAMES.filter(g => g.category === cat.key).length;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => setLibraryCategory(cat.key)}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all text-left ${
                        libraryCategory === cat.key
                          ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                          : "bg-white/[0.02] text-slate-400 border border-white/[0.04] hover:bg-white/[0.06] hover:text-slate-200"
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span className="truncate">{cat.label}</span>
                      <span className="ml-auto rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </aside>

              {/* Main content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
                {/* Mobile category select */}
                <div className="sm:hidden mb-4">
                  <select
                    value={libraryCategory}
                    onChange={(e) => setLibraryCategory(e.target.value as GameCategory | "all")}
                    className="w-full rounded-xl border border-white/[0.08] bg-black/40 px-3 py-2 text-sm text-slate-200 outline-none"
                  >
                    <option value="all">📚 All Games ({SAMPLE_GAMES.length})</option>
                    {GAME_CATEGORIES.map(cat => (
                      <option key={cat.key} value={cat.key}>
                        {cat.icon} {cat.label} ({SAMPLE_GAMES.filter(g => g.category === cat.key).length})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category description */}
                {libraryCategory !== "all" && (
                  <div className="mb-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 flex items-center gap-3">
                    <span className="text-2xl">{GAME_CATEGORIES.find(c => c.key === libraryCategory)?.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-white">{GAME_CATEGORIES.find(c => c.key === libraryCategory)?.label}</p>
                      <p className="text-xs text-slate-500">{GAME_CATEGORIES.find(c => c.key === libraryCategory)?.description}</p>
                    </div>
                  </div>
                )}

                {/* Tag filters */}
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {TAG_OPTIONS.map(tag => (
                    <button
                      key={tag.value}
                      onClick={() => setLibraryTagFilter(tag.value)}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                        libraryTagFilter === tag.value
                          ? "bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-sm"
                          : "bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:bg-white/[0.06] hover:text-slate-200"
                      }`}
                    >
                      <span>{tag.icon}</span>
                      {tag.label}
                    </button>
                  ))}
                </div>

                {/* Game grid */}
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredLibraryGames.map((game) => {
                    const resultTag = game.pgn.match(/\[Result "([^"]+)"\]/)?.[1] ?? "";
                    const whiteWon = resultTag === "1-0";
                    const blackWon = resultTag === "0-1";
                    const catInfo = GAME_CATEGORIES.find(c => c.key === game.category);
                    return (
                      <button
                        key={game.label}
                        type="button"
                        onClick={() => {
                          setPgnText(game.pgn);
                          setLibraryOpen(false);
                          // Clear any existing analysis
                          if (analyzedMoves.length > 0) {
                            setAnalyzedMoves([]);
                            setGameHeaders({});
                            setSelectedMoveIdx(-1);
                            eloReportShownRef.current = false;
                          }
                        }}
                        className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-left transition-all hover:border-blue-500/20 hover:bg-blue-500/[0.03] cursor-pointer"
                      >
                        <div className="mb-2 flex items-start justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors truncate">{game.label}</p>
                            <p className="mt-0.5 text-xs text-slate-500 truncate">{game.description}</p>
                          </div>
                          <span className="shrink-0 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold text-slate-400 ml-2">
                            {game.year}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {libraryCategory === "all" && catInfo && (
                            <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                              {catInfo.icon} {catInfo.label}
                            </span>
                          )}
                          {game.tags.map(tag => (
                            <span key={tag} className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-slate-500 capitalize">
                              {tag}
                            </span>
                          ))}
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${whiteWon ? "bg-white/[0.08] text-white" : blackWon ? "bg-slate-700/50 text-slate-300" : "bg-white/[0.04] text-slate-500"}`}>
                            {resultTag}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {filteredLibraryGames.length === 0 && (
                  <div className="mt-12 text-center">
                    <p className="text-slate-500">No games match this filter.</p>
                    <button onClick={() => { setLibraryTagFilter("all"); setLibraryCategory("all"); }} className="mt-2 text-sm text-blue-400 hover:underline">
                      Clear filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Viral Elo Report Modal ── */}
      {eloReportOpen && summary && eloEstimate && (() => {
        const whiteElo = eloEstimate.white;
        const blackElo = eloEstimate.black;
        const whiteName = gameHeaders.White ?? "White";
        const blackName = gameHeaders.Black ?? "Black";
        const whiteAcc = summary.white.accuracy;
        const blackAcc = summary.black.accuracy;

        const getEloTitle = (elo: number) => {
          if (elo >= 2700) return { title: "SUPER GM", emoji: "👑", vibe: "Bro you play like Magnus??? No cap this is ELITE 🔥", color: "from-yellow-400 to-amber-500" };
          if (elo >= 2500) return { title: "GRANDMASTER", emoji: "🏆", vibe: "Actual GM energy rn 😤 the opponents are NOT ready", color: "from-amber-400 to-orange-500" };
          if (elo >= 2300) return { title: "MASTER", emoji: "⚡", vibe: "Main character energy tbh 💅 lowkey cracked at chess", color: "from-orange-400 to-red-500" };
          if (elo >= 2100) return { title: "EXPERT", emoji: "🎯", vibe: "This goes HARD 🔥 you're cooking and they can't handle it", color: "from-red-400 to-pink-500" };
          if (elo >= 1900) return { title: "CLASS A", emoji: "💪", vibe: "Solid gameplay no cap 😤 you're on that sigma grindset", color: "from-pink-400 to-purple-500" };
          if (elo >= 1700) return { title: "CLASS B", emoji: "🧠", vibe: "POV: you chose violence on the board 😈 keep grinding bestie", color: "from-purple-400 to-violet-500" };
          if (elo >= 1500) return { title: "CLUB PLAYER", emoji: "♟️", vibe: "Not bad fr fr 💀 the vibes are immaculate, keep it up", color: "from-violet-400 to-blue-500" };
          if (elo >= 1300) return { title: "INTERMEDIATE", emoji: "📈", vibe: "The glow-up arc is starting 🌱 you're gonna be cracked soon", color: "from-blue-400 to-cyan-500" };
          if (elo >= 1100) return { title: "IMPROVING", emoji: "🌟", vibe: "It's giving... potential bestie 💫 the grind doesn't stop", color: "from-cyan-400 to-teal-500" };
          if (elo >= 900) return { title: "BEGINNER+", emoji: "🎮", vibe: "OK we all start somewhere 😭 but the hustle is real", color: "from-teal-400 to-emerald-500" };
          return { title: "NEWBIE", emoji: "🐣", vibe: "Fresh account energy 💀 but slay queen/king, you'll get there", color: "from-emerald-400 to-green-500" };
        };

        const whiteInfo = getEloTitle(whiteElo);
        const blackInfo = getEloTitle(blackElo);

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setEloReportOpen(false)}>
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
            <div
              className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/[0.1] bg-slate-950 shadow-2xl animate-fade-in-up"
              onClick={e => e.stopPropagation()}
            >
              {/* Header gradient */}
              <div className="relative overflow-hidden bg-gradient-to-br from-purple-600/30 via-pink-600/20 to-blue-600/30 px-6 pt-8 pb-6">
                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-purple-500/20 blur-[60px]" />
                <div className="pointer-events-none absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-pink-500/20 blur-[60px]" />

                <button
                  type="button"
                  onClick={() => setEloReportOpen(false)}
                  className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.1] text-white/60 transition hover:bg-white/[0.2] hover:text-white"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>

                <div className="text-center">
                  <p className="text-xs font-bold uppercase tracking-widest text-purple-300/80">✨ Performance Report ✨</p>
                  <h2 className="mt-2 text-3xl font-black text-white">Estimated Elo</h2>
                  <p className="mt-1 text-xs text-white/50">based on this game&apos;s accuracy</p>
                </div>
              </div>

              {/* Player cards */}
              <div className="space-y-3 p-6">
                {/* White */}
                <div className={`rounded-2xl border border-white/[0.08] bg-gradient-to-r ${whiteInfo.color} bg-opacity-10 p-4`} style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))` }}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.1] text-2xl">{whiteInfo.emoji}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-sm bg-white border border-white/30" />
                        <p className="text-sm font-bold text-white">{whiteName}</p>
                      </div>
                      <div className="mt-0.5 flex items-baseline gap-2">
                        <span className={`text-2xl font-black bg-gradient-to-r ${whiteInfo.color} bg-clip-text text-transparent`}>{whiteElo}</span>
                        <span className={`rounded-full bg-gradient-to-r ${whiteInfo.color} px-2 py-0.5 text-[10px] font-black text-white`}>{whiteInfo.title}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-white">{whiteAcc}%</p>
                      <p className="text-[10px] text-slate-500">accuracy</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-400 italic">&ldquo;{whiteInfo.vibe}&rdquo;</p>
                </div>

                {/* VS divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-white/[0.06]" />
                  <span className="text-xs font-black text-slate-600">VS</span>
                  <div className="flex-1 border-t border-white/[0.06]" />
                </div>

                {/* Black */}
                <div className={`rounded-2xl border border-white/[0.08] p-4`} style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))` }}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.06] text-2xl">{blackInfo.emoji}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-sm bg-slate-700 border border-white/20" />
                        <p className="text-sm font-bold text-white">{blackName}</p>
                      </div>
                      <div className="mt-0.5 flex items-baseline gap-2">
                        <span className={`text-2xl font-black bg-gradient-to-r ${blackInfo.color} bg-clip-text text-transparent`}>{blackElo}</span>
                        <span className={`rounded-full bg-gradient-to-r ${blackInfo.color} px-2 py-0.5 text-[10px] font-black text-white`}>{blackInfo.title}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-white">{blackAcc}%</p>
                      <p className="text-[10px] text-slate-500">accuracy</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-400 italic">&ldquo;{blackInfo.vibe}&rdquo;</p>
                </div>

                {/* Move breakdown badges */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">White Moves</p>
                    <div className="flex flex-wrap gap-1">
                      {summary.white.brilliant > 0 && <span className="rounded-full bg-cyan-500/15 px-1.5 py-0.5 text-[10px] font-bold text-cyan-400">🤯 {summary.white.brilliant}</span>}
                      {summary.white.best > 0 && <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">✅ {summary.white.best}</span>}
                      {summary.white.blunder > 0 && <span className="rounded-full bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold text-red-400">💀 {summary.white.blunder}</span>}
                      {summary.white.mistake > 0 && <span className="rounded-full bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-bold text-orange-400">😬 {summary.white.mistake}</span>}
                      {summary.white.inaccuracy > 0 && <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">🤔 {summary.white.inaccuracy}</span>}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Black Moves</p>
                    <div className="flex flex-wrap gap-1">
                      {summary.black.brilliant > 0 && <span className="rounded-full bg-cyan-500/15 px-1.5 py-0.5 text-[10px] font-bold text-cyan-400">🤯 {summary.black.brilliant}</span>}
                      {summary.black.best > 0 && <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">✅ {summary.black.best}</span>}
                      {summary.black.blunder > 0 && <span className="rounded-full bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold text-red-400">💀 {summary.black.blunder}</span>}
                      {summary.black.mistake > 0 && <span className="rounded-full bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-bold text-orange-400">😬 {summary.black.mistake}</span>}
                      {summary.black.inaccuracy > 0 && <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">🤔 {summary.black.inaccuracy}</span>}
                    </div>
                  </div>
                </div>

                {/* Result */}
                {gameHeaders.Result && (
                  <div className="text-center">
                    <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-sm font-black text-white">
                      {gameHeaders.Result === "1-0" ? "⚪ White Wins" : gameHeaders.Result === "0-1" ? "⚫ Black Wins" : "🤝 Draw"}
                    </span>
                  </div>
                )}

                {/* Share buttons */}
                {(() => {
                  const shareText = `🔥 My chess performance report:\n\n⚪ ${whiteName} — ${whiteElo} Elo (${whiteInfo.title})\n⚫ ${blackName} — ${blackElo} Elo (${blackInfo.title})\n\nAnalyzed on firechess.com — free game analysis powered by Stockfish`;
                  const shareUrl = "https://firechess.com/analyze";
                  const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
                  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
                  return (
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <a
                        href={xUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-9 items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 text-xs font-bold text-white transition-all hover:bg-white/[0.12] hover:scale-105"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                        Share on X
                      </a>
                      <a
                        href={fbUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-9 items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 text-xs font-bold text-blue-400 transition-all hover:bg-blue-500/20 hover:scale-105"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                        Facebook
                      </a>
                    </div>
                  );
                })()}

                {/* Footer CTA */}
                <p className="text-center text-[10px] text-slate-600 pt-2">
                  🔥 firechess.com &middot; free game analysis powered by Stockfish
                </p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
