"use client";

import React, {
  useState, useCallback, useEffect, useRef, useMemo,
} from "react";
import { Chess, type Color, type Square } from "chess.js";
import { Chessboard } from "@/components/chessboard-compat";
import { useBoardTheme, useCustomPieces, usePieceTheme, useShowCoordinates } from "@/lib/use-coins";
import { getPieceImageUrl } from "@/lib/board-themes";
import { playSound, preloadSounds } from "@/lib/sounds";
import { stockfishPool } from "@/lib/stockfish-client";
import { getChaosMoves, executeChaosMove, type ChaosMove } from "@/lib/chaos-moves";
import { TIER_COLORS, TIER_LABELS, type ChaosModifier } from "@/lib/chaos-chess";
import {
  RAID_CONFIGS,
  EXTRACTION_ZONES,
  createRaidState,
  rollLootChoices,
  rollEnemyReinforcement,
  getLootFlavor,
  WIPE_REASONS,
  EXTRACT_FLAVOR,
  getRandomFlavor,
  type RaidDifficulty,
  type RaidState,
} from "@/lib/escape-chess";

/* ══════════════════════════════════════════════════════════════════ */
/*  Piece recruitment helper                                           */
/* ══════════════════════════════════════════════════════════════════ */

/** Back-rank squares to try when placing a recruited piece (skips e1 = king). */
const RECRUIT_SQUARES: Square[] = ["a1", "b1", "c1", "d1", "f1", "g1", "h1"];
/** Rank-2 squares to try when recruiting a pawn. */
const RECRUIT_PAWN_SQUARES: Square[] = ["a2", "b2", "e2", "h2", "a3", "b3", "c3", "d3", "e3", "f3", "g3", "h3"];

function recruitPiece(game: Chess, pieceType: string): Chess {
  if (pieceType === "k") return game;
  // Pawns must go on rank 2+ (rank 1 is illegal FEN)
  const candidates = pieceType === "p" ? RECRUIT_PAWN_SQUARES : RECRUIT_SQUARES;
  for (const sq of candidates) {
    if (!game.get(sq)) {
      const ng = new Chess(game.fen());
      ng.put({ type: pieceType as any, color: "w" }, sq);
      return new Chess(ng.fen());
    }
  }
  return game; // No room — no recruitment
}

/* ══════════════════════════════════════════════════════════════════ */
/*  Constants                                                          */
/* ══════════════════════════════════════════════════════════════════ */

const AI_MOVE_DELAY = 700;

/** Extraction zone square highlight styles */
const EXTRACT_SQUARE_STYLE: React.CSSProperties = {
  background: "radial-gradient(circle, rgba(34,197,94,0.40) 0%, rgba(34,197,94,0.12) 100%)",
  boxShadow: "inset 0 0 0 2px rgba(34,197,94,0.55)",
};

/** Highlight for the last move */
const LAST_MOVE_STYLE: React.CSSProperties = {
  background: "rgba(234,179,8,0.25)",
};

/** Highlight for legal-move dots */
const LEGAL_MOVE_STYLE: React.CSSProperties = {
  background: "radial-gradient(circle, rgba(168,85,247,0.65) 25%, transparent 26%)",
};

/** Highlight for legal captures */
const LEGAL_CAPTURE_STYLE: React.CSSProperties = {
  background: "radial-gradient(circle, transparent 60%, rgba(168,85,247,0.55) 61%)",
};

/** Selected-piece highlight */
const SELECTED_STYLE: React.CSSProperties = {
  background: "rgba(168,85,247,0.30)",
};

/* ══════════════════════════════════════════════════════════════════ */
/*  Styling helpers                                                    */
/* ══════════════════════════════════════════════════════════════════ */

function TierBadge({ tier }: { tier: ChaosModifier["tier"] }) {
  const t = TIER_COLORS[tier];
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${t.text} ${t.bg}`}>
      {TIER_LABELS[tier]}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
/*  Loot Modal                                                         */
/* ══════════════════════════════════════════════════════════════════ */

function LootModal({
  choices,
  pieceFlavor,
  pieceName,
  pieceSetName,
  onPick,
  onSkip,
}: {
  choices: ChaosModifier[];
  pieceFlavor: string;
  pieceName: string;
  pieceSetName: string | null;
  onPick: (mod: ChaosModifier) => void;
  onSkip: () => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);

  const handlePick = (mod: ChaosModifier) => {
    if (picked) return;
    setPicked(mod.id);
    playSound("taco-bell-bong");
    setTimeout(() => onPick(mod), 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg rounded-2xl border border-amber-500/30 bg-[#0a0f1a]/95 p-5 shadow-2xl sm:p-7">
        {/* Header */}
        <div className="mb-4 text-center">
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-amber-400/80">
            📦 Loot Secured — {pieceName}
          </p>
          <h2 className="text-lg font-black text-white sm:text-xl">{pieceFlavor}</h2>
          <p className="mt-1 text-xs text-slate-400">Pick a modifier to add to your loadout</p>
        </div>

        {/* Cards */}
        <div className="grid gap-3 sm:grid-cols-2">
          {choices.map((mod, idx) => {
            const t = TIER_COLORS[mod.tier];
            const isPicked = picked === mod.id;
            const isDismissed = picked !== null && !isPicked;
            const pieceImgUrl = mod.piece && pieceSetName
              ? getPieceImageUrl(pieceSetName, `w${mod.piece.toUpperCase()}`)
              : null;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => handlePick(mod)}
                disabled={picked !== null}
                className={`relative flex flex-col gap-1 rounded-xl border p-4 text-left transition-all duration-200 ${t.bg} ${t.border} ${
                  !picked ? "cursor-pointer hover:border-white/30 hover:scale-[1.03]" : ""
                } ${isPicked ? "scale-105 brightness-125" : ""} ${isDismissed ? "opacity-40" : ""}`}
                style={{
                  animation: `card-in 0.35s cubic-bezier(0.34,1.56,0.64,1) ${idx * 0.1}s both`,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{mod.icon}</span>
                  <div>
                    <TierBadge tier={mod.tier} />
                    <p className="mt-0.5 text-sm font-bold text-white">{mod.name}</p>
                  </div>
                </div>
                {mod.piece && (
                  <div className="flex items-center gap-1.5">
                    {pieceImgUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={pieceImgUrl} alt={mod.piece} width={18} height={18} className="object-contain opacity-80" />
                    )}
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">
                      Affects: {{ p: "Pawns", n: "Knights", b: "Bishops", r: "Rooks", q: "Queen", k: "King" }[mod.piece]}
                    </p>
                  </div>
                )}
                <p className="text-xs leading-relaxed text-slate-400">{mod.description}</p>
              </button>
            );
          })}
        </div>

        {/* Skip */}
        {!picked && (
          <button
            type="button"
            onClick={onSkip}
            className="mt-4 w-full rounded-xl border border-slate-700/50 bg-slate-800/40 py-2 text-xs font-semibold text-slate-400 transition-colors hover:text-white"
          >
            Leave it — continue the raid
          </button>
        )}
      </div>

      <style>{`
        @keyframes card-in {
          0%  { transform: translateY(24px) scale(0.9); opacity: 0; }
          100%{ transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
/*  Modifier Chip                                                      */
/* ══════════════════════════════════════════════════════════════════ */

function ModChip({ mod, pieceSetName }: { mod: ChaosModifier; pieceSetName: string | null }) {
  const [hover, setHover] = useState(false);
  const t = TIER_COLORS[mod.tier];
  const pieceImgUrl = mod.piece && pieceSetName
    ? getPieceImageUrl(pieceSetName, `w${mod.piece.toUpperCase()}`)
    : null;
  return (
    <div
      className={`relative flex cursor-default items-center gap-1.5 rounded-lg border px-2 py-1 text-xs ${t.bg} ${t.border} transition-transform hover:scale-105`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span>{mod.icon}</span>
      <span className="font-semibold text-white">{mod.name}</span>
      {hover && (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 w-52 -translate-x-1/2 rounded-xl border border-white/10 bg-[#0d1117] p-3 shadow-2xl">
          <p className="mb-1 text-xs font-bold text-white">{mod.name}</p>
          <TierBadge tier={mod.tier} />
          {mod.piece && (
            <div className="mt-1 flex items-center gap-1.5">
              {pieceImgUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={pieceImgUrl} alt={mod.piece} width={16} height={16} className="object-contain opacity-80" />
              )}
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                {{ p: "Pawns", n: "Knights", b: "Bishops", r: "Rooks", q: "Queen", k: "King" }[mod.piece]}
              </p>
            </div>
          )}
          <p className="mt-1 text-xs leading-relaxed text-slate-400">{mod.description}</p>
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[#0d1117]" />
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
/*  Main Page                                                          */
/* ══════════════════════════════════════════════════════════════════ */

type Phase = "lobby" | "briefing" | "playing" | "loot" | "extracted" | "wiped";

export default function EscapeChessPage() {
  /* ── Theme hooks ── */
  const boardTheme = useBoardTheme();
  const showCoordinates = useShowCoordinates();
  const customPieces = useCustomPieces();
  const pieceTheme = usePieceTheme();

  /* ── Preload sounds ── */
  useEffect(() => { preloadSounds(); }, []);

  /* ── Phase / raid state ── */
  const [phase, setPhase] = useState<Phase>("lobby");
  const [difficulty, setDifficulty] = useState<RaidDifficulty>("scav");
  const [raidState, setRaidState] = useState<RaidState>(() => createRaidState("scav"));

  /* ── Chess game ── */
  const [game, setGame] = useState(() => new Chess());
  const gameRef = useRef<Chess>(game);
  gameRef.current = game;

  /* ── AI ── */
  const [isThinking, setIsThinking] = useState(false);

  /* ── Board interaction ── */
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<Record<string, React.CSSProperties>>({});
  const [lastMoveHighlight, setLastMoveHighlight] = useState<Record<string, React.CSSProperties>>({});
  const [chaosMoves, setChaosMoves] = useState<ChaosMove[]>([]);
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const [boardSize, setBoardSize] = useState(0);

  /* ── Loot modal state ── */
  const [lootData, setLootData] = useState<{
    choices: ChaosModifier[];
    pieceFlavor: string;
    pieceName: string;
  } | null>(null);

  /* ── Result flash ── */
  const [resultFlavor, setResultFlavor] = useState("");

  /* ── Measure board ── */
  useEffect(() => {
    const el = boardContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setBoardSize(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ─────────────── Computed square styles ─────────────── */
  const extractZoneStyles = useMemo(() => {
    const sqs = EXTRACTION_ZONES[raidState.activeZone];
    return Object.fromEntries(sqs.map((s) => [s, EXTRACT_SQUARE_STYLE]));
  }, [raidState.activeZone]);

  const mergedSquareStyles = useMemo(() => ({
    ...extractZoneStyles,
    ...lastMoveHighlight,
    ...(selectedSquare ? { [selectedSquare]: SELECTED_STYLE } : {}),
    ...legalMoves,
  }), [extractZoneStyles, lastMoveHighlight, selectedSquare, legalMoves]);

  /* ─────────────── Legal move computation ─────────────── */
  const computeLegalMoves = useCallback((g: Chess, from: string, rs: RaidState) => {
    const stdMoves = g.moves({ square: from as Square, verbose: true });
    const styles: Record<string, React.CSSProperties> = {};
    for (const m of stdMoves) {
      styles[m.to] = m.captured ? LEGAL_CAPTURE_STYLE : LEGAL_MOVE_STYLE;
    }
    // Chaos moves from selected square
    const cm = getChaosMoves(g, rs.playerMods, "w", undefined, rs.enemyMods);
    const fromChaos = cm.filter((m) => m.from === from);
    for (const m of fromChaos) {
      if (!styles[m.to]) styles[m.to] = m.type === "capture" ? LEGAL_CAPTURE_STYLE : LEGAL_MOVE_STYLE;
    }
    setLegalMoves(styles);
    setChaosMoves(cm);
  }, []);

  /* ─────────────── Check for game end after a move ─────────────── */
  const checkGameEnd = useCallback((g: Chess, rs: RaidState, captureAt?: string): boolean => {
    // King captured (chaos move or direct capture)
    const board = g.board();
    let wKing = false; let bKing = false;
    for (const row of board) {
      for (const sq of row) {
        if (sq?.type === "k") { if (sq.color === "w") wKing = true; else bKing = true; }
      }
    }
    if (!wKing) {
      const flavor = getRandomFlavor(WIPE_REASONS.overthrown);
      setResultFlavor(flavor);
      playSound("mario-death");
      setPhase("wiped");
      return true;
    }
    if (!bKing) {
      // King captured = wipe for Black — this shouldn't end the raid; treat as normal capture
      return false;
    }

    // Check: player gets hit
    if (g.inCheck() && g.turn() === "b") {
      // Black is in check — this is fine for us
    }
    if (g.inCheck() && g.turn() === "w") {
      setRaidState((prev) => {
        const next = prev.hitsRemaining - 1;
        if (next <= 0) {
          const flavor = getRandomFlavor(WIPE_REASONS.hits);
          setResultFlavor(flavor);
          playSound("mario-death");
          setPhase("wiped");
          return { ...prev, hitsRemaining: 0 };
        }
        playSound("crowd-ooh");
        return { ...prev, hitsRemaining: next };
      });
    }

    // Standard checkmate / stalemate
    if (g.isCheckmate()) {
      if (g.turn() === "w") {
        const flavor = getRandomFlavor(WIPE_REASONS.checkmate);
        setResultFlavor(flavor);
        playSound("mario-death");
        setPhase("wiped");
        return true;
      }
      // Black checkmated = raid won
      const flavor = getRandomFlavor(EXTRACT_FLAVOR);
      setResultFlavor(flavor);
      playSound("airhorn");
      setPhase("extracted");
      return true;
    }

    // Move limit
    if (rs.movesUsed >= RAID_CONFIGS[rs.difficulty].moveLimit) {
      const flavor = getRandomFlavor(WIPE_REASONS.timelimit);
      setResultFlavor(flavor);
      playSound("mario-death");
      setPhase("wiped");
      return true;
    }

    return false;
  }, []);

  /* ─────────────── Extraction check ─────────────── */
  const checkExtraction = useCallback((g: Chess, rs: RaidState): boolean => {
    const zone = EXTRACTION_ZONES[rs.activeZone];
    const board = g.board();
    const files = "abcdefgh";
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const p = board[r][f];
        if (p?.color === "w") {
          const sq = `${files[f]}${8 - r}`;
          if (zone.includes(sq)) {
            const flavor = getRandomFlavor(EXTRACT_FLAVOR);
            setResultFlavor(flavor);
            playSound("airhorn");
            setPhase("extracted");
            return true;
          }
        }
      }
    }
    return false;
  }, []);

  /* ─────────────── AI Move ─────────────── */
  const makeAiMove = useCallback(async (g: Chess, rs: RaidState) => {
    if (g.isGameOver() || g.turn() !== "b") return;
    setIsThinking(true);
    try {
      const cfg = RAID_CONFIGS[rs.difficulty];
      const aiChaosMoves = getChaosMoves(g, rs.enemyMods, "b", undefined, rs.playerMods);

      // Chaos capture moves — pick the best material gain
      const captureMoves = aiChaosMoves
        .filter((m) => m.type === "capture")
        .map((m) => {
          const val: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900 };
          const target = g.get(m.to as Square);
          const attacker = g.get(m.from as Square);
          const gain = (val[target?.type ?? ""] ?? 0) - (val[attacker?.type ?? ""] ?? 0) * 0.35;
          return { m, gain };
        })
        .sort((a, b) => b.gain - a.gain);

      // Get standard Stockfish move
      const result = await stockfishPool.evaluateFen(g.fen(), cfg.depth);
      const stdMove = result?.bestMove;

      // Choose: chaos capture if gain > 0, else Stockfish
      let played = false;
      if (captureMoves.length > 0 && captureMoves[0].gain > 0 && Math.random() < 0.7) {
        const best = captureMoves[0].m;
        const ng = executeChaosMove(g, best, rs.enemyMods);
        if (ng) {
          setLastMoveHighlight({ [best.from]: LAST_MOVE_STYLE, [best.to]: LAST_MOVE_STYLE });
          setGame(ng);
          gameRef.current = ng;
          playSound("capture");
          played = true;

          const updated = { ...rs, movesUsed: rs.movesUsed + 1, movesSinceReinforcement: rs.movesSinceReinforcement + 1 };

          // Reinforcement check
          if (updated.movesSinceReinforcement >= cfg.reinforcementEvery) {
            const newMod = rollEnemyReinforcement(updated.enemyMods);
            if (newMod) {
              updated.enemyMods = [...updated.enemyMods, newMod];
              updated.movesSinceReinforcement = 0;
              updated.eventLog = [
                ...updated.eventLog,
                { id: Date.now(), type: "reinforcement", message: `⬆️ Enemy gained: ${newMod.name}`, icon: newMod.icon },
              ];
            } else {
              updated.movesSinceReinforcement = 0;
            }
          }

          setRaidState(updated);
          const ended = checkGameEnd(ng, updated);
          if (!ended) checkExtraction(ng, updated);
        }
      }

      if (!played && stdMove && stdMove !== "0000") {
        const from = stdMove.slice(0, 2);
        const to = stdMove.slice(2, 4);
        const promote = stdMove.length === 5 ? stdMove[4] as "q" | "r" | "b" | "n" : undefined;
        const captured = !!g.get(to as Square);
        const ng = new Chess(g.fen());
        const mv = ng.move({ from, to, promotion: promote ?? "q" });
        if (mv) {
          setLastMoveHighlight({ [from]: LAST_MOVE_STYLE, [to]: LAST_MOVE_STYLE });
          setGame(ng);
          gameRef.current = ng;
          playSound(captured ? "capture" : "move");

          const updated = { ...rs, movesUsed: rs.movesUsed + 1, movesSinceReinforcement: rs.movesSinceReinforcement + 1 };
          if (updated.movesSinceReinforcement >= cfg.reinforcementEvery) {
            const newMod = rollEnemyReinforcement(updated.enemyMods);
            if (newMod) {
              updated.enemyMods = [...updated.enemyMods, newMod];
              updated.movesSinceReinforcement = 0;
              updated.eventLog = [
                ...updated.eventLog,
                { id: Date.now(), type: "reinforcement", message: `⬆️ Enemy gained: ${newMod.name}`, icon: newMod.icon },
              ];
            } else {
              updated.movesSinceReinforcement = 0;
            }
          }
          setRaidState(updated);
          const ended = checkGameEnd(ng, updated);
          if (!ended) checkExtraction(ng, updated);
        }
      }
    } catch {
      // engine error — do a random legal move fallback
      const moves = g.moves();
      if (moves.length > 0) {
        const ng = new Chess(g.fen());
        ng.move(moves[Math.floor(Math.random() * moves.length)]);
        setGame(ng);
        gameRef.current = ng;
      }
    } finally {
      setIsThinking(false);
    }
  }, [checkGameEnd, checkExtraction]);

  /* ─────────────── Player Move Handler ─────────────── */
  const handleSquareClick = useCallback((square: string) => {
    const g = gameRef.current;
    if (isThinking || phase !== "playing" || g.turn() !== "w") return;
    if (lootData) return;

    const pieceOnSquare = g.get(square as Square);

    if (!selectedSquare) {
      // Select a white piece
      if (pieceOnSquare?.color === "w") {
        setSelectedSquare(square);
        computeLegalMoves(g, square, raidState);
      }
      return;
    }

    // Clicking same square → deselect
    if (square === selectedSquare) {
      setSelectedSquare(null);
      setLegalMoves({});
      return;
    }

    // Is this a chaos move?
    const chaosMv = chaosMoves.find((m) => m.from === selectedSquare && m.to === square);
    if (chaosMv) {
      const ng = executeChaosMove(g, chaosMv, raidState.playerMods);
      if (ng) {
        setSelectedSquare(null);
        setLegalMoves({});
        setLastMoveHighlight({ [selectedSquare]: LAST_MOVE_STYLE, [square]: LAST_MOVE_STYLE });
        const captured = chaosMv.type === "capture";
        playSound(captured ? "capture" : "move");

        const newRaidState = { ...raidState, movesUsed: raidState.movesUsed + 1, movesSinceReinforcement: raidState.movesSinceReinforcement + 1 };
        let finalGame = ng;
        let finalState = newRaidState;

        if (captured) {
          const capturedPiece = g.get(square as Square);
          if (capturedPiece && capturedPiece.type !== "k") {
            finalGame = recruitPiece(ng, capturedPiece.type);
            const pieceName = { p: "Pawn", n: "Knight", b: "Bishop", r: "Rook", q: "Queen", k: "King" }[capturedPiece.type] ?? capturedPiece.type;
            finalState = { ...newRaidState, eventLog: [...newRaidState.eventLog, { id: Date.now(), type: "loot" as const, message: `⚔️ Recruited: ${pieceName}`, icon: "⚔️" }] };
            const lootChoices = rollLootChoices(capturedPiece.type, finalState.playerMods);
            if (lootChoices && lootChoices.length > 0) {
              setGame(finalGame);
              gameRef.current = finalGame;
              setRaidState(finalState);
              setLootData({ choices: lootChoices, pieceFlavor: getLootFlavor(capturedPiece.type), pieceName });
              return;
            }
          }
        }

        setGame(finalGame);
        gameRef.current = finalGame;
        setRaidState(finalState);

        const ended = checkGameEnd(finalGame, finalState);
        if (ended) return;
        if (checkExtraction(finalGame, finalState)) return;
        setTimeout(() => makeAiMove(finalGame, finalState), AI_MOVE_DELAY);
      }
      return;
    }

    // Standard chess move
    const stdMv = g.moves({ square: selectedSquare as Square, verbose: true }).find((m) => m.to === square);
    if (stdMv) {
      const ng = new Chess(g.fen());
      const mv = ng.move({ from: selectedSquare, to: square, promotion: "q" });
      if (!mv) {
        setSelectedSquare(null);
        setLegalMoves({});
        return;
      }

      setSelectedSquare(null);
      setLegalMoves({});
      setLastMoveHighlight({ [selectedSquare]: LAST_MOVE_STYLE, [square]: LAST_MOVE_STYLE });
      playSound(mv.captured ? "capture" : "move");

      const newRaidState = { ...raidState, movesUsed: raidState.movesUsed + 1, movesSinceReinforcement: raidState.movesSinceReinforcement + 1 };
      let finalGame = ng;
      let finalState = newRaidState;

      if (mv.captured) {
        finalGame = recruitPiece(ng, mv.captured);
        const pieceName = { p: "Pawn", n: "Knight", b: "Bishop", r: "Rook", q: "Queen", k: "King" }[mv.captured] ?? mv.captured;
        finalState = { ...newRaidState, eventLog: [...newRaidState.eventLog, { id: Date.now(), type: "loot" as const, message: `⚔️ Recruited: ${pieceName}`, icon: "⚔️" }] };
        const lootChoices = rollLootChoices(mv.captured, finalState.playerMods);
        if (lootChoices && lootChoices.length > 0) {
          setGame(finalGame);
          gameRef.current = finalGame;
          setRaidState(finalState);
          setLootData({ choices: lootChoices, pieceFlavor: getLootFlavor(mv.captured), pieceName });
          return;
        }
      }

      setGame(finalGame);
      gameRef.current = finalGame;
      setRaidState(finalState);

      const ended = checkGameEnd(finalGame, finalState);
      if (ended) return;
      if (checkExtraction(finalGame, finalState)) return;
      setTimeout(() => makeAiMove(finalGame, finalState), AI_MOVE_DELAY);
      return;
    }

    // Clicked a different own piece → re-select
    if (pieceOnSquare?.color === "w") {
      setSelectedSquare(square);
      computeLegalMoves(g, square, raidState);
      return;
    }

    setSelectedSquare(null);
    setLegalMoves({});
  }, [isThinking, phase, lootData, selectedSquare, chaosMoves, raidState, computeLegalMoves, checkGameEnd, checkExtraction, makeAiMove]);

  const handleDrop = useCallback((from: string, to: string): boolean => {
    if (from === to) return false;
    const g = gameRef.current;
    if (isThinking || phase !== "playing" || lootData) return false;

    // Try chaos move first
    const cm = chaosMoves.find((m) => m.from === from && m.to === to);
    if (cm) {
      handleSquareClick(from);
      setTimeout(() => handleSquareClick(to), 10);
      return true;
    }

    const ng = new Chess(g.fen());
    const mv = ng.move({ from, to, promotion: "q" });
    if (!mv) return false;

    setSelectedSquare(null);
    setLegalMoves({});
    setLastMoveHighlight({ [from]: LAST_MOVE_STYLE, [to]: LAST_MOVE_STYLE });
    playSound(mv.captured ? "capture" : "move");

    const newRaidState = { ...raidState, movesUsed: raidState.movesUsed + 1, movesSinceReinforcement: raidState.movesSinceReinforcement + 1 };
    let finalGame = ng;
    let finalState = newRaidState;

    if (mv.captured) {
      finalGame = recruitPiece(ng, mv.captured);
      const pieceName = { p: "Pawn", n: "Knight", b: "Bishop", r: "Rook", q: "Queen", k: "King" }[mv.captured] ?? mv.captured;
      finalState = { ...newRaidState, eventLog: [...newRaidState.eventLog, { id: Date.now(), type: "loot" as const, message: `⚔️ Recruited: ${pieceName}`, icon: "⚔️" }] };
      const lootChoices = rollLootChoices(mv.captured, finalState.playerMods);
      if (lootChoices && lootChoices.length > 0) {
        setGame(finalGame);
        gameRef.current = finalGame;
        setRaidState(finalState);
        setLootData({ choices: lootChoices, pieceFlavor: getLootFlavor(mv.captured), pieceName });
        return true;
      }
    }

    setGame(finalGame);
    gameRef.current = finalGame;
    setRaidState(finalState);

    const ended = checkGameEnd(finalGame, finalState);
    if (ended) return true;
    if (checkExtraction(finalGame, finalState)) return true;
    setTimeout(() => makeAiMove(finalGame, finalState), AI_MOVE_DELAY);
    return true;
  }, [isThinking, phase, lootData, chaosMoves, raidState, handleSquareClick, checkGameEnd, checkExtraction, makeAiMove]);

  /* ─────────────── Loot resolved ─────────────── */
  const handleLootPick = useCallback((mod: ChaosModifier) => {
    setLootData(null);
    const g = gameRef.current;
    const newRaidState = {
      ...raidState,
      playerMods: [...raidState.playerMods, mod],
      eventLog: [...raidState.eventLog, { id: Date.now(), type: "loot" as const, message: `🎁 Looted: ${mod.name}`, icon: mod.icon }],
    };
    setRaidState(newRaidState);
    setPhase("playing");
    const ended = checkGameEnd(g, newRaidState);
    if (!ended && !checkExtraction(g, newRaidState)) {
      setTimeout(() => makeAiMove(g, newRaidState), AI_MOVE_DELAY);
    }
  }, [raidState, checkGameEnd, checkExtraction, makeAiMove]);

  const handleLootSkip = useCallback(() => {
    setLootData(null);
    const g = gameRef.current;
    setPhase("playing");
    const ended = checkGameEnd(g, raidState);
    if (!ended && !checkExtraction(g, raidState)) {
      setTimeout(() => makeAiMove(g, raidState), AI_MOVE_DELAY);
    }
  }, [raidState, checkGameEnd, checkExtraction, makeAiMove]);

  /* ─────────────── Start raid ─────────────── */
  const startRaid = useCallback(() => {
    const newState = createRaidState(difficulty);
    // Apply starting enemy mods
    const cfg = RAID_CONFIGS[difficulty];
    let enemyMods: ChaosModifier[] = [];
    for (let i = 0; i < cfg.enemyStartMods; i++) {
      const m = rollEnemyReinforcement(enemyMods);
      if (m) enemyMods = [...enemyMods, m];
    }
    const g = cfg.startingFen
      ? new Chess(cfg.startingFen)
      : new Chess();

    const state = { ...newState, enemyMods, status: "playing" as const };
    setRaidState(state);
    setGame(g);
    gameRef.current = g;
    setSelectedSquare(null);
    setLegalMoves({});
    setLastMoveHighlight({});
    setLootData(null);
    setPhase("playing");
    playSound("bell");
  }, [difficulty]);

  /* ─────────────── UI: Hit points ─────────────── */
  const cfg = RAID_CONFIGS[difficulty];

  const hpIcons = Array.from({ length: cfg.maxHits }, (_, i) => (
    <span key={i} className={i < raidState.hitsRemaining ? "text-red-400" : "text-slate-700"}>❤️</span>
  ));

  /* ─────────────── Move counter ─────────────── */
  const movesLeft = Math.max(0, cfg.moveLimit - raidState.movesUsed);
  const movesLeftPercent = (movesLeft / cfg.moveLimit) * 100;
  const moveLimitColor = movesLeftPercent > 50 ? "text-emerald-400" : movesLeftPercent > 25 ? "text-amber-400" : "text-red-400";

  /* ══════════════════ LOBBY ══════════════════ */
  if (phase === "lobby") {
    return (
      <div className="min-h-screen bg-[#030712] text-white">
        {/* Hero */}
        <div className="relative overflow-hidden border-b border-white/[0.06] bg-gradient-to-b from-[#0a0d14] to-[#030712] px-5 py-12 text-center md:py-16">
          <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 30% at 50% 0%, rgba(239,68,68,0.08) 0%, transparent 70%)" }} />
          <h1 className="relative text-4xl font-black tracking-tight text-white sm:text-5xl">
            🎮 Escape <span className="text-red-400">Chess</span>
          </h1>
          <p className="relative mt-3 text-base text-slate-400 sm:text-lg">
            A raid-style chess mode inspired by Escape from Tarkov.
          </p>
          <p className="relative mt-1.5 max-w-xl mx-auto text-sm text-slate-500">
            Move your <span className="text-white font-semibold">King</span> to the extraction zone. Capture enemy pieces to loot chaos modifiers. Survive reinforcements. Extract alive.
          </p>
        </div>

        {/* Difficulty selection */}
        <div className="mx-auto max-w-3xl px-5 py-10">
          <h2 className="mb-6 text-center text-sm font-bold uppercase tracking-widest text-slate-500">Choose Your Raid</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {(["scav", "pmc", "boss"] as RaidDifficulty[]).map((d) => {
              const c = RAID_CONFIGS[d];
              const selected = difficulty === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`flex flex-col gap-2 rounded-2xl border p-5 text-left transition-all duration-200 ${
                    selected
                      ? "border-red-500/50 bg-red-950/30 shadow-lg shadow-red-500/10"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{c.icon}</span>
                    <div>
                      <p className={`text-sm font-black uppercase tracking-wider ${c.flavorColor}`}>{c.name}</p>
                      <p className="text-[10px] text-slate-500">{c.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-400">{c.description}</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-[10px]">
                    <span className="rounded-full bg-slate-800/60 px-2 py-0.5 text-slate-400">⏱ {c.moveLimit} moves</span>
                    <span className="rounded-full bg-slate-800/60 px-2 py-0.5 text-slate-400">❤️ {c.maxHits} {c.maxHits === 1 ? "hit" : "hits"}</span>
                    <span className="rounded-full bg-slate-800/60 px-2 py-0.5 text-slate-400">⚙️ Depth {c.depth}</span>
                    {c.enemyStartMods > 0 && (
                      <span className="rounded-full bg-red-900/40 px-2 py-0.5 text-red-400">🔺 {c.enemyStartMods} enemy mod{c.enemyStartMods > 1 ? "s" : ""}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Start button */}
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setPhase("briefing")}
              className="rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 px-10 py-4 text-base font-black tracking-wide text-white shadow-lg shadow-red-600/30 transition-all hover:scale-105 hover:shadow-red-600/50"
            >
              EQUIP &amp; READY UP →
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════ BRIEFING ══════════════════ */
  if (phase === "briefing") {
    const c = RAID_CONFIGS[difficulty];
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030712] px-5">
        <div className="w-full max-w-lg rounded-2xl border border-white/[0.06] bg-[#090d14]/95 p-7 shadow-2xl text-center">
          <p className={`mb-2 text-xs font-bold uppercase tracking-widest ${c.flavorColor}`}>Mission Briefing</p>
          <div className="mb-4 text-5xl">{c.icon}</div>
          <h2 className="mb-1 text-2xl font-black text-white">{c.name}</h2>
          <p className={`mb-4 text-sm font-semibold ${c.flavorColor}`}>{c.subtitle}</p>
          <div className="mb-6 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
            <p className="text-sm leading-relaxed text-slate-300">{c.briefing}</p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-slate-800/40 p-3">
              <p className="mb-1 font-bold uppercase tracking-wider text-slate-500">Objective</p>
              <p className="text-slate-300">Move <span className="font-bold text-white">any piece</span> to the <span className="font-bold text-emerald-400">extraction zone</span> (highlighted green squares on rank 8)</p>
            </div>
            <div className="rounded-xl bg-slate-800/40 p-3">
              <p className="mb-1 font-bold uppercase tracking-wider text-slate-500">Loot System</p>
              <p className="text-slate-300">Capturing enemy pieces drops <span className="font-bold text-amber-400">chaos modifiers</span> — pick one to upgrade your pieces</p>
            </div>
            <div className="rounded-xl bg-slate-800/40 p-3">
              <p className="mb-1 font-bold uppercase tracking-wider text-slate-500">Survival</p>
              <p className="text-slate-300">Survive <span className="font-bold text-red-400">{c.maxHits} check{c.maxHits > 1 ? "s" : ""}</span> and extract within <span className="font-bold text-amber-400">{c.moveLimit} moves</span></p>
            </div>
            <div className="rounded-xl bg-slate-800/40 p-3">
              <p className="mb-1 font-bold uppercase tracking-wider text-slate-500">Extraction</p>
              <p className="text-slate-300">Zone is randomly <span className="font-bold text-emerald-400">Alfa</span> or <span className="font-bold text-emerald-400">Bravo</span> — revealed at raid start</p>
            </div>
          </div>

          <button
            type="button"
            onClick={startRaid}
            className="w-full rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 py-4 text-base font-black tracking-wide text-white shadow-lg shadow-red-600/30 transition-all hover:scale-[1.02]"
          >
            DEPLOY INTO RAID →
          </button>
          <button
            type="button"
            onClick={() => setPhase("lobby")}
            className="mt-3 w-full rounded-2xl border border-slate-700/50 py-2.5 text-xs font-semibold text-slate-500 transition-colors hover:text-white"
          >
            ← Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  /* ══════════════════ EXTRACTED ══════════════════ */
  if (phase === "extracted") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030712] px-5">
        <div className="w-full max-w-md rounded-2xl border border-emerald-500/30 bg-[#0a0f1a]/95 p-8 text-center shadow-2xl shadow-emerald-500/10">
          <div className="mb-4 text-6xl">🚁</div>
          <h2 className="mb-2 text-3xl font-black text-emerald-400">EXTRACTED</h2>
          <p className="mb-6 text-sm text-slate-300">{resultFlavor}</p>

          {raidState.playerMods.length > 0 && (
            <div className="mb-6">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Loot Secured</p>
              <div className="flex flex-wrap justify-center gap-2">
                {raidState.playerMods.map((m) => <ModChip key={m.id} mod={m} pieceSetName={pieceTheme.setName} />)}
              </div>
            </div>
          )}

          <div className="mb-6 flex justify-center gap-6 text-center text-sm">
            <div>
              <p className="text-2xl font-black text-white">{raidState.movesUsed}</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Moves</p>
            </div>
            <div>
              <p className="text-2xl font-black text-amber-400">{raidState.playerMods.length}</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Mods Looted</p>
            </div>
            <div>
              <p className="text-2xl font-black text-red-400">{raidState.hitsRemaining}</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">HP Remaining</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPhase("lobby")}
            className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 font-bold text-white transition-all hover:scale-[1.02]"
          >
            Raid Again
          </button>
        </div>
      </div>
    );
  }

  /* ══════════════════ WIPED ══════════════════ */
  if (phase === "wiped") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030712] px-5">
        <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[#0a0f1a]/95 p-8 text-center shadow-2xl shadow-red-500/10">
          <div className="mb-4 text-6xl">💀</div>
          <h2 className="mb-2 text-3xl font-black text-red-400">K.I.A.</h2>
          <p className="mb-6 text-sm text-slate-300">{resultFlavor}</p>

          <div className="mb-6 flex justify-center gap-6 text-center text-sm">
            <div>
              <p className="text-2xl font-black text-white">{raidState.movesUsed}</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Moves</p>
            </div>
            <div>
              <p className="text-2xl font-black text-amber-400">{raidState.playerMods.length}</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Mods Looted</p>
            </div>
          </div>

          <p className="mb-4 text-xs text-slate-500">All loot lost. Better luck next raid.</p>

          <button
            type="button"
            onClick={() => setPhase("lobby")}
            className="w-full rounded-2xl bg-gradient-to-r from-red-700 to-rose-700 py-3.5 font-bold text-white transition-all hover:scale-[1.02]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /* ══════════════════ PLAYING ══════════════════ */
  const extractZoneName = raidState.activeZone.toUpperCase();

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      {/* Loot Modal */}
      {lootData && (
        <LootModal
          choices={lootData.choices}
          pieceFlavor={lootData.pieceFlavor}
          pieceName={lootData.pieceName}
          pieceSetName={pieceTheme.setName}
          onPick={handleLootPick}
          onSkip={handleLootSkip}
        />
      )}

      {/* Top HUD */}
      <div className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#030712]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2.5">
          {/* Difficulty badge */}
          <span className={`shrink-0 text-xs font-black uppercase tracking-widest ${cfg.flavorColor}`}>{cfg.icon} {cfg.name}</span>

          {/* Move counter */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-1.5 w-24 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${movesLeftPercent}%`,
                  background: movesLeftPercent > 50 ? "#22c55e" : movesLeftPercent > 25 ? "#f59e0b" : "#ef4444",
                }}
              />
            </div>
            <span className={`text-xs font-bold tabular-nums ${moveLimitColor}`}>{movesLeft}m</span>
          </div>

          {/* HP */}
          <div className="flex gap-0.5 text-sm">{hpIcons}</div>

          {/* Extraction zone */}
          <span className="ml-auto rounded-full bg-emerald-950/60 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            📍 Zone {extractZoneName}
          </span>

          {/* AI thinking */}
          {isThinking && (
            <span className="text-[10px] text-slate-500 animate-pulse">AI thinking…</span>
          )}

          {/* Turn indicator */}
          {!isThinking && phase === "playing" && (
            <span className={`text-[10px] font-bold ${game.turn() === "w" ? "text-white" : "text-slate-500"}`}>
              {game.turn() === "w" ? "▶ Your Turn" : "⏳ Enemy"}
            </span>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div className="mx-auto flex max-w-6xl gap-4 px-4 py-4">

        {/* Left sidebar */}
        <aside className="hidden w-52 shrink-0 flex-col gap-3 lg:flex">
          {/* Your loadout */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-blue-400">Your Loadout</p>
            {raidState.playerMods.length === 0 ? (
              <p className="text-[10px] text-slate-600">No mods yet — capture pieces to loot</p>
            ) : (
              <div className="space-y-1.5">
                {raidState.playerMods.map((m) => <ModChip key={m.id} mod={m} pieceSetName={pieceTheme.setName} />)}
              </div>
            )}
          </div>

          {/* Enemy mods */}
          {raidState.enemyMods.length > 0 && (
            <div className="rounded-xl border border-red-900/30 bg-red-950/10 p-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-red-400">Enemy Intel</p>
              <div className="space-y-1.5">
                {raidState.enemyMods.map((m) => <ModChip key={m.id} mod={m} pieceSetName={pieceTheme.setName} />)}
              </div>
            </div>
          )}

          {/* Reinforcement timer */}
          {cfg.reinforcementEvery < 90 && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-orange-400">Reinforcements</p>
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-orange-500 transition-all"
                    style={{ width: `${(raidState.movesSinceReinforcement / cfg.reinforcementEvery) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] tabular-nums text-orange-400">
                  {cfg.reinforcementEvery - raidState.movesSinceReinforcement}
                </span>
              </div>
            </div>
          )}
        </aside>

        {/* Board */}
        <div className="flex min-w-0 flex-1 flex-col items-center">
          <div
            ref={boardContainerRef}
            className="relative w-full max-w-[580px]"
          >
            <Chessboard
              position={game.fen()}
              onSquareClick={handleSquareClick}
              onPieceDrop={handleDrop}
              boardOrientation="white"
              customSquareStyles={mergedSquareStyles}
              customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
              customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
              customPieces={customPieces}
              showBoardNotation={showCoordinates}
              arePiecesDraggable={phase === "playing" && !isThinking && !lootData}
              animationDuration={200}
            />
          </div>

          {/* Mobile HUD row */}
          <div className="mt-3 flex w-full max-w-[580px] items-center justify-between gap-4 lg:hidden">
            {raidState.playerMods.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {raidState.playerMods.map((m) => (
                  <ModChip key={m.id} mod={m} pieceSetName={pieceTheme.setName} />
                ))}
              </div>
            )}
            {raidState.enemyMods.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {raidState.enemyMods.map((m) => (
                  <ModChip key={m.id} mod={m} pieceSetName={pieceTheme.setName} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="hidden w-52 shrink-0 flex-col gap-3 lg:flex">
          {/* Event log */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 flex-1 min-h-0">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Raid Log</p>
            <div className="space-y-1.5 max-h-64 overflow-y-auto scrollbar-thin">
              {raidState.eventLog.length === 0 && (
                <p className="text-[10px] text-slate-600">No events yet…</p>
              )}
              {[...raidState.eventLog].reverse().map((e) => (
                <div key={e.id} className="rounded-lg bg-white/[0.02] px-2 py-1">
                  <p className={`text-[10px] leading-snug ${
                    e.type === "loot" ? "text-amber-400" :
                    e.type === "reinforcement" ? "text-red-400" :
                    e.type === "extraction" ? "text-emerald-400" :
                    "text-slate-400"
                  }`}>{e.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick rules */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Objective</p>
            <p className="text-[10px] leading-relaxed text-slate-400">
              Move <span className="font-bold text-white">any piece</span> to a{" "}
              <span className="font-bold text-emerald-400">green zone</span> square on rank 8.
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
              Capture pieces for loot. Survive within {cfg.moveLimit} moves.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
