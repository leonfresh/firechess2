"use client";

/**
 * /chaos — Chaos Chess
 *
 * Play a full game of chess against Stockfish AI. At turn milestones
 * (5, 10, 15, 20, 25) the game freezes and you draft a permanent
 * modifier that changes how your pieces behave. The AI also drafts
 * its own modifier. Inspired by Clash Royale's CHAOS mode.
 *
 * Modifiers are cosmetic/narrative in this build — the board renders
 * the effects visually and logs them, while moves are played using
 * standard chess.js rules with Stockfish as the opponent.
 * Future: integrate fairy-stockfish.wasm for actual rule mutations.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import type { Square as CbSquare } from "react-chessboard/dist/chessboard/types";
import { Chessboard } from "react-chessboard";
import { EvalBar } from "@/components/eval-bar";
import { stockfishPool } from "@/lib/stockfish-client";
import { useBoardSize } from "@/lib/use-board-size";
import { useBoardTheme, useShowCoordinates, useCustomPieces } from "@/lib/use-coins";
import { playSound, preloadSounds } from "@/lib/sounds";
import {
  createChaosState,
  checkDraftTrigger,
  rollDraftChoices,
  applyDraft,
  getAiDraftMessage,
  getPhaseLabel,
  TIER_COLORS,
  TIER_LABELS,
  type ChaosState,
  type ChaosModifier,
  type ModifierTier,
} from "@/lib/chaos-chess";

/* ────────────────────────── Constants ────────────────────────── */

const AI_DEPTH = 12;
const AI_MOVE_DELAY = 600; // ms

type GameStatus = "setup" | "playing" | "drafting" | "game-over";
type GameResult = "white" | "black" | "draw" | null;

type MoveLogEntry = {
  moveNumber: number;
  white?: string;
  black?: string;
};

type EventLogEntry = {
  type: "draft" | "modifier" | "info" | "chaos";
  message: string;
  icon?: string;
  pepe?: string;
};

/* ────────────────────────── Pepe Emojis ────────────────────────── */

const PEPE = {
  // Reactions
  hmm:          "/pepe-emojis/3959-hmm.png",
  gigachad:     "/pepe-emojis/9088-pepe-gigachad.png",
  king:         "/pepe-emojis/11998-pepe-king.png",
  shocked:      "/pepe-emojis/monkaS.png",
  clown:        "/pepe-emojis/4825_PepeClown.png",
  sadge:        "/pepe-emojis/6757_Sadge.png",
  copium:       "/pepe-emojis/7332-copium.png",
  rage:         "/pepe-emojis/4178-pepe-rage.png",
  think:        "/pepe-emojis/60250-think.png",
  cry:          "/pepe-emojis/2982-pepecry.png",
  detective:    "/pepe-emojis/8557-peepodetective.png",
  pepeok:       "/pepe-emojis/81504-pepeok.png",
  poggies:      "/pepe-emojis/2230-poggies-peepo.png",
  galaxybrain:  "/pepe-emojis/26578-galaxybrainpepe.png",
  death:        "/pepe-emojis/4642-death.png",
  cringe:       "/pepe-emojis/9807-pepecringe.png",
  nosign:       "/pepe-emojis/3049-pepenosign.png",
  clownge:      "/pepe-emojis/1082-clownge.png",
  prayge:       "/pepe-emojis/4437-prayge.png",
  jesus:        "/pepe-emojis/3613-pepe-with-jesus.png",
  // Animated
  lmao:         "/pepe-emojis/animated/690612-pepe-lmao.gif",
  clap:         "/pepe-emojis/animated/80293-pepeclap.gif",
  hyped:        "/pepe-emojis/animated/88627-pepehype.gif",
  gamercry:     "/pepe-emojis/animated/411644-gamer-pepe-cry.gif",
  madpuke:      "/pepe-emojis/animated/84899-pepe-madpuke.gif",
  bigeyes:      "/pepe-emojis/animated/28654-bigeyes.gif",
  nope:         "/pepe-emojis/animated/41292-pepe-nopes.gif",
  clowntrain:   "/pepe-emojis/animated/59958-pepeclownblobtrain.gif",
  firesgun:     "/pepe-emojis/animated/815161-pepe-fires-gun.gif",
  toxic:        "/pepe-emojis/animated/972934-pepe-with-toxic-sign.gif",
  moneyrain:    "/pepe-emojis/animated/93659-pepemoneyrain.gif",
  loving:       "/pepe-emojis/animated/98260-pepe-loving.gif",
  cantwatch:    "/pepe-emojis/animated/pepe-with-hands-covering-ears.gif",
} as const;

/** Pepe reaction pools for different draft tier qualities */
const TIER_PEPES: Record<ModifierTier, string[]> = {
  common:    [PEPE.hmm, PEPE.pepeok, PEPE.think, PEPE.detective],
  rare:      [PEPE.bigeyes, PEPE.shocked, PEPE.poggies, PEPE.hyped],
  epic:      [PEPE.galaxybrain, PEPE.lmao, PEPE.firesgun, PEPE.clap],
  legendary: [PEPE.gigachad, PEPE.king, PEPE.moneyrain, PEPE.hyped],
};

/** Pick a random pepe for a tier */
function tierPepe(tier: ModifierTier): string {
  const pool = TIER_PEPES[tier];
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Meme sound map for events */
type MemeSoundName = "vine-boom" | "bruh" | "airhorn" | "nani" | "emotional-damage" | "roblox-oof" | "drumroll" | "reveal-stinger" | "crowd-ooh" | "sad-trombone" | "mario-death" | "record-scratch" | "applause-short" | "yeet";

const TIER_SOUNDS: Record<ModifierTier, MemeSoundName[]> = {
  common:    ["vine-boom"],
  rare:      ["crowd-ooh", "nani"],
  epic:      ["airhorn", "emotional-damage"],
  legendary: ["airhorn", "vine-boom"],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ────────────────────────── Particles ────────────────────────── */

function ChaosParticles() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {Array.from({ length: 20 }).map((_, i) => {
        const colors = ["#f97316", "#a855f7", "#ef4444", "#eab308", "#3b82f6"];
        const size = 2 + Math.random() * 4;
        const duration = 4 + Math.random() * 6;
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: colors[i % colors.length],
              left: `${5 + Math.random() * 90}%`,
              bottom: `${-5 + Math.random() * 10}%`,
              opacity: 0,
              animation: `chaos-float ${duration}s ease-out ${Math.random() * 5}s infinite`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes chaos-float {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          10% { opacity: 0.6; }
          50% { opacity: 0.3; }
          100% { transform: translateY(-100vh) scale(0.3); opacity: 0; }
        }
        @keyframes draft-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(168, 85, 247, 0.3); }
          50% { box-shadow: 0 0 40px rgba(168, 85, 247, 0.6); }
        }
        @keyframes card-appear {
          0% { transform: translateY(30px) scale(0.8); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes pepe-pop {
          0% { transform: scale(0) rotate(-15deg); opacity: 0; }
          50% { transform: scale(1.2) rotate(5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes pepe-float-away {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-120px) scale(0.5); opacity: 0; }
        }
        @keyframes pepe-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}

/* ────────────────────────── Floating Pepe Reaction ────────────────────────── */

function FloatingPepe({ src, onDone }: { src: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="pointer-events-none fixed z-[60]"
      style={{
        left: `${30 + Math.random() * 40}%`,
        top: `${20 + Math.random() * 30}%`,
        animation: "pepe-float-away 2.5s ease-out forwards",
      }}
    >
      <img src={src} alt="" className="h-16 w-16 object-contain" style={{ animation: "pepe-pop 0.3s ease-out" }} />
    </div>
  );
}

/* ────────────────────────── Draft Modal ────────────────────────── */

function DraftModal({
  phase,
  choices,
  onPick,
}: {
  phase: number;
  choices: ChaosModifier[];
  onPick: (mod: ChaosModifier) => void;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hoveredMod = choices.find((c) => c.id === hoveredId);

  // Play drumroll on mount
  useEffect(() => {
    playSound("drumroll");
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="relative mx-4 w-full max-w-2xl rounded-2xl border border-purple-500/30 bg-[#0a0f1a] p-6 md:p-8"
        style={{ animation: "draft-pulse 2s ease-in-out infinite" }}
      >
        {/* Header */}
        <div className="mb-6 text-center">
          {/* Pepe reacts to hovered tier */}
          <div className="mb-2 flex items-center justify-center gap-3">
            <img
              src={hoveredMod ? tierPepe(hoveredMod.tier) : PEPE.bigeyes}
              alt=""
              className="h-12 w-12 object-contain"
              style={{ animation: hoveredMod ? "pepe-pop 0.25s ease-out" : "pepe-bounce 1.5s ease-in-out infinite" }}
              key={hoveredId ?? "idle"}
            />
          </div>
          <h2 className="text-2xl font-bold text-white">CHAOS DRAFT</h2>
          <p className="mt-1 text-sm text-purple-400">
            Phase {phase} — {getPhaseLabel(phase)}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Choose a modifier to permanently buff your pieces
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {choices.map((mod, idx) => {
            const tier = TIER_COLORS[mod.tier];
            const isHovered = hoveredId === mod.id;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => onPick(mod)}
                onMouseEnter={() => setHoveredId(mod.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`group relative flex flex-col items-center rounded-xl border p-5 text-center transition-all duration-200 ${tier.bg} ${tier.border} ${tier.glow} ${
                  isHovered
                    ? "scale-105 border-white/30 shadow-lg"
                    : "hover:scale-[1.02]"
                }`}
                style={{
                  animation: `card-appear 0.4s ease-out ${idx * 0.1}s both`,
                }}
              >
                {/* Tier badge */}
                <span
                  className={`mb-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tier.text} ${tier.bg}`}
                >
                  {TIER_LABELS[mod.tier]}
                </span>

                {/* Icon */}
                <div className="mb-2 text-4xl">{mod.icon}</div>

                {/* Name */}
                <h3 className="mb-1 text-sm font-bold text-white">{mod.name}</h3>

                {/* Piece target */}
                {mod.piece && (
                  <span className="mb-2 text-[10px] uppercase tracking-wider text-slate-500">
                    {({ p: "Pawns", n: "Knights", b: "Bishops", r: "Rooks", q: "Queen", k: "King" })[mod.piece]}
                  </span>
                )}

                {/* Description */}
                <p className="text-xs leading-relaxed text-slate-400">
                  {mod.description}
                </p>

                {/* Pick hint */}
                <div
                  className={`mt-3 rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                    isHovered
                      ? "bg-white/10 text-white"
                      : "bg-white/5 text-slate-500"
                  }`}
                >
                  {isHovered ? "Draft This!" : "Click to Draft"}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────── Modifier sidebar ────────────────────────── */

function ModifierList({
  title,
  modifiers,
  color,
}: {
  title: string;
  modifiers: ChaosModifier[];
  color: string;
}) {
  if (modifiers.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <h3 className={`mb-2 text-xs font-bold uppercase tracking-wider ${color}`}>
        {title}
      </h3>
      <div className="space-y-1.5">
        {modifiers.map((mod) => (
          <div
            key={mod.id}
            className="flex items-start gap-2 rounded-lg bg-white/[0.03] px-2 py-1.5"
            title={mod.description}
          >
            <span className="text-base">{mod.icon}</span>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-white">
                {mod.name}
              </p>
              <p className="truncate text-[10px] text-slate-500">
                {mod.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────── Main Page ────────────────────────── */

export default function ChaosChessPage() {
  /* ── Board / theme hooks ── */
  const { ref: boardContainerRef, size: boardSize } = useBoardSize(480);
  const boardTheme = useBoardTheme();
  const showCoordinates = useShowCoordinates();
  const customPieces = useCustomPieces();

  /* ── Game state ── */
  const [game, setGame] = useState(() => new Chess());
  const [gameStatus, setGameStatus] = useState<GameStatus>("setup");
  const [gameResult, setGameResult] = useState<GameResult>(null);
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
  const [eval_, setEval] = useState(0);
  const [isThinking, setIsThinking] = useState(false);

  /* ── Chaos state ── */
  const [chaosState, setChaosState] = useState<ChaosState>(createChaosState);
  const [pendingPhase, setPendingPhase] = useState(0);

  /* ── Move log ── */
  const [moveLog, setMoveLog] = useState<MoveLogEntry[]>([]);
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);
  const moveLogRef = useRef<HTMLDivElement>(null);
  const eventLogRef = useRef<HTMLDivElement>(null);

  /* ── Board interaction state ── */
  const [selectedSquare, setSelectedSquare] = useState<CbSquare | null>(null);
  const [legalMoveSquares, setLegalMoveSquares] = useState<Record<string, React.CSSProperties>>({});
  const [lastMoveHighlight, setLastMoveHighlight] = useState<Record<string, React.CSSProperties>>({});

  /* ── Difficulty ── */
  const [aiLevel, setAiLevel] = useState<"easy" | "medium" | "hard">("medium");
  const aiDepth = aiLevel === "easy" ? 6 : aiLevel === "medium" ? 10 : 14;

  /* ── Floating pepe reactions ── */
  const [floatingPepes, setFloatingPepes] = useState<{ id: number; src: string }[]>([]);
  const pepeIdRef = useRef(0);

  const spawnPepe = useCallback((src: string) => {
    const id = ++pepeIdRef.current;
    setFloatingPepes((prev) => [...prev, { id, src }]);
  }, []);

  const removePepe = useCallback((id: number) => {
    setFloatingPepes((prev) => prev.filter((p) => p.id !== id));
  }, []);

  /* ── Preload sounds ── */
  useEffect(() => {
    preloadSounds();
  }, []);

  /* ── Scroll event log to bottom ── */
  useEffect(() => {
    eventLogRef.current?.scrollTo({ top: eventLogRef.current.scrollHeight, behavior: "smooth" });
  }, [eventLog]);

  /* ── Start game ── */
  const startGame = useCallback(
    (color: "white" | "black") => {
      const g = new Chess();
      setGame(g);
      setPlayerColor(color);
      setGameStatus("playing");
      setGameResult(null);
      setChaosState(createChaosState());
      setMoveLog([]);
      setFloatingPepes([]);
      setEventLog([
        { type: "info", message: "⚡ Chaos Chess begins! Modifiers will appear at turns 5, 10, 15, 20, and 25.", icon: "⚡", pepe: PEPE.hyped },
      ]);
      playSound("reveal-stinger");
      setEval(0);
      setSelectedSquare(null);
      setLegalMoveSquares({});
      setLastMoveHighlight({});

      if (color === "black") {
        // AI plays first as white
        setTimeout(() => makeAiMove(g), AI_MOVE_DELAY);
      }
    },
    [],
  );

  /* ── Check for game end ── */
  const checkGameEnd = useCallback((g: Chess) => {
    if (g.isCheckmate()) {
      const winner = g.turn() === "w" ? "black" : "white";
      setGameResult(winner);
      setGameStatus("game-over");
      const youWin = winner === playerColor;
      setEventLog((prev) => [
        ...prev,
        {
          type: "chaos",
          message: `♚ Checkmate! ${winner === "white" ? "White" : "Black"} wins!`,
          icon: "♚",
          pepe: youWin ? PEPE.gigachad : PEPE.gamercry,
        },
      ]);
      if (youWin) {
        playSound("airhorn");
        spawnPepe(PEPE.gigachad);
        setTimeout(() => spawnPepe(PEPE.clap), 400);
      } else {
        playSound("mario-death");
        spawnPepe(PEPE.gamercry);
      }
      return true;
    }
    if (g.isStalemate() || g.isDraw() || g.isThreefoldRepetition() || g.isInsufficientMaterial()) {
      setGameResult("draw");
      setGameStatus("game-over");
      setEventLog((prev) => [
        ...prev,
        {
          type: "info",
          message: g.isStalemate()
            ? "½-½ Stalemate!"
            : g.isInsufficientMaterial()
            ? "½-½ Insufficient material."
            : "½-½ Draw.",
          icon: "🤝",
          pepe: PEPE.hmm,
        },
      ]);
      playSound("sad-trombone");
      return true;
    }
    return false;
  }, [playerColor, spawnPepe]);

  /* ── Check draft trigger after a full move ── */
  const checkDraft = useCallback(
    (g: Chess, state: ChaosState) => {
      const fullMove = g.moveNumber();
      const phase = checkDraftTrigger(fullMove, state);
      if (phase > 0) {
        setPendingPhase(phase);
        const choices = rollDraftChoices(phase, state.playerModifiers);
        setChaosState((prev) => ({
          ...prev,
          isDrafting: true,
          draftingSide: "player",
          draftChoices: choices,
        }));
        setGameStatus("drafting");
        setEventLog((prev) => [
          ...prev,
          {
            type: "draft",
            message: `⏸️ Turn ${fullMove} — CHAOS DRAFT Phase ${phase}! Choose your modifier.`,
            icon: "⏸️",
            pepe: phase <= 2 ? PEPE.think : phase <= 4 ? PEPE.shocked : PEPE.galaxybrain,
          },
        ]);
        playSound("record-scratch");
        spawnPepe(phase >= 4 ? PEPE.shocked : PEPE.bigeyes);
        return true;
      }
      return false;
    },
    [spawnPepe],
  );

  /* ── AI move ── */
  const makeAiMove = useCallback(
    async (g: Chess) => {
      if (g.isGameOver()) return;
      setIsThinking(true);

      try {
        const result = await stockfishPool.evaluateFen(g.fen(), aiDepth);
        if (!result?.bestMove) {
          setIsThinking(false);
          return;
        }

        const from = result.bestMove.slice(0, 2) as CbSquare;
        const to = result.bestMove.slice(2, 4) as CbSquare;
        const promotion = result.bestMove.length > 4 ? result.bestMove[4] : undefined;

        const moveResult = g.move({ from, to, promotion });
        if (!moveResult) {
          setIsThinking(false);
          return;
        }

        // Sound
        if (g.isCheck()) playSound("check");
        else if (moveResult.captured) playSound("capture");
        else playSound("move");

        // Highlight
        setLastMoveHighlight({
          [from]: { backgroundColor: "rgba(255, 170, 0, 0.3)" },
          [to]: { backgroundColor: "rgba(255, 170, 0, 0.3)" },
        });

        // Move log
        setMoveLog((prev) => {
          const copy = [...prev];
          const mn = moveResult.color === "w" ? g.moveNumber() - 1 : g.moveNumber();
          const existing = copy.find((e) => e.moveNumber === mn);
          if (moveResult.color === "w") {
            if (existing) existing.white = moveResult.san;
            else copy.push({ moveNumber: mn, white: moveResult.san });
          } else {
            if (existing) existing.black = moveResult.san;
            else copy.push({ moveNumber: mn, black: moveResult.san });
          }
          return copy;
        });

        // Eval
        setEval(result.cp / 100);

        setGame(new Chess(g.fen()));

        if (!checkGameEnd(g)) {
          // Check draft after AI move (black's move completes a full move)
          checkDraft(g, chaosState);
        }
      } catch {
        // Engine error — just skip
      }

      setIsThinking(false);
    },
    [aiDepth, checkGameEnd, checkDraft, chaosState],
  );

  /* ── Player move ── */
  const handlePlayerMove = useCallback(
    (from: CbSquare, to: CbSquare) => {
      if (gameStatus !== "playing") return false;
      if (isThinking) return false;

      const isPlayerTurn =
        (playerColor === "white" && game.turn() === "w") ||
        (playerColor === "black" && game.turn() === "b");
      if (!isPlayerTurn) return false;

      // Try all possible promotions
      let moveResult = null;
      for (const promo of [undefined, "q", "r", "b", "n"] as const) {
        try {
          const g = new Chess(game.fen());
          const result = g.move({ from, to, promotion: promo });
          if (result) {
            moveResult = result;
            // Apply to real game
            game.move({ from, to, promotion: promo });
            break;
          }
        } catch {
          continue;
        }
      }

      if (!moveResult) return false;

      // Sound
      if (game.isCheck()) playSound("check");
      else if (moveResult.captured) playSound("capture");
      else playSound("move");

      // Highlight
      setLastMoveHighlight({
        [from]: { backgroundColor: "rgba(255, 170, 0, 0.3)" },
        [to]: { backgroundColor: "rgba(255, 170, 0, 0.3)" },
      });
      setSelectedSquare(null);
      setLegalMoveSquares({});

      // Move log
      setMoveLog((prev) => {
        const copy = [...prev];
        const mn = moveResult.color === "w" ? game.moveNumber() - 1 : game.moveNumber();
        const existing = copy.find((e) => e.moveNumber === mn);
        if (moveResult.color === "w") {
          if (existing) existing.white = moveResult.san;
          else copy.push({ moveNumber: mn, white: moveResult.san });
        } else {
          if (existing) existing.black = moveResult.san;
          else copy.push({ moveNumber: mn, black: moveResult.san });
        }
        return copy;
      });

      setGame(new Chess(game.fen()));

      if (checkGameEnd(game)) return true;

      // Check draft after player's move
      const drafted = checkDraft(game, chaosState);
      if (!drafted) {
        // AI responds
        setTimeout(() => makeAiMove(game), AI_MOVE_DELAY);
      }

      return true;
    },
    [game, gameStatus, playerColor, isThinking, checkGameEnd, checkDraft, makeAiMove, chaosState],
  );

  /* ── Square click for mobile ── */
  const handleSquareClick = useCallback(
    (square: CbSquare) => {
      if (gameStatus !== "playing" || isThinking) return;

      const isPlayerTurn =
        (playerColor === "white" && game.turn() === "w") ||
        (playerColor === "black" && game.turn() === "b");
      if (!isPlayerTurn) return;

      if (selectedSquare) {
        // Try to move
        const success = handlePlayerMove(selectedSquare, square);
        if (!success) {
          // Maybe clicked a different own piece
          const piece = game.get(square);
          if (piece && piece.color === game.turn()) {
            setSelectedSquare(square);
            const moves = game.moves({ square, verbose: true });
            const highlights: Record<string, React.CSSProperties> = {
              [square]: { backgroundColor: "rgba(255, 255, 0, 0.3)" },
            };
            for (const m of moves) {
              highlights[m.to] = {
                backgroundColor: m.captured
                  ? "rgba(255, 0, 0, 0.35)"
                  : "rgba(0, 180, 0, 0.25)",
                borderRadius: m.captured ? undefined : "50%",
              };
            }
            setLegalMoveSquares(highlights);
            playSound("select");
          } else {
            setSelectedSquare(null);
            setLegalMoveSquares({});
          }
        }
      } else {
        // Select own piece
        const piece = game.get(square);
        if (piece && piece.color === game.turn()) {
          setSelectedSquare(square);
          const moves = game.moves({ square, verbose: true });
          const highlights: Record<string, React.CSSProperties> = {
            [square]: { backgroundColor: "rgba(255, 255, 0, 0.3)" },
          };
          for (const m of moves) {
            highlights[m.to] = {
              backgroundColor: m.captured
                ? "rgba(255, 0, 0, 0.35)"
                : "rgba(0, 180, 0, 0.25)",
              borderRadius: m.captured ? undefined : "50%",
            };
          }
          setLegalMoveSquares(highlights);
          playSound("select");
        }
      }
    },
    [game, gameStatus, playerColor, isThinking, selectedSquare, handlePlayerMove],
  );

  /* ── Handle draft pick ── */
  const handleDraftPick = useCallback(
    (mod: ChaosModifier) => {
      const newState = applyDraft(chaosState, mod, pendingPhase);
      setChaosState(newState);
      setGameStatus("playing");
      setPendingPhase(0);

      const aiMsg = getAiDraftMessage(newState);
      const aiLastMod = newState.aiModifiers[newState.aiModifiers.length - 1];

      setEventLog((prev) => [
        ...prev,
        {
          type: "modifier",
          message: `You drafted: ${mod.icon} ${mod.name} — ${mod.description}`,
          icon: mod.icon,
          pepe: tierPepe(mod.tier),
        },
        ...(aiMsg
          ? [{ type: "modifier" as const, message: aiMsg, icon: "🤖", pepe: aiLastMod ? tierPepe(aiLastMod.tier) : PEPE.hmm }]
          : []),
        { type: "info" as const, message: "⏯️ Game resumed!", icon: "▶️" },
      ]);

      // Tier-based meme sound
      playSound(pickRandom(TIER_SOUNDS[mod.tier]));
      spawnPepe(tierPepe(mod.tier));

      // If it's AI's turn, make AI move
      const isAiTurn =
        (playerColor === "white" && game.turn() === "b") ||
        (playerColor === "black" && game.turn() === "w");
      if (isAiTurn) {
        setTimeout(() => makeAiMove(game), AI_MOVE_DELAY);
      }
    },
    [chaosState, pendingPhase, playerColor, game, makeAiMove],
  );

  /* ── Resign ── */
  const handleResign = useCallback(() => {
    const winner = playerColor === "white" ? "black" : "white";
    setGameResult(winner);
    setGameStatus("game-over");
    setEventLog((prev) => [
      ...prev,
      { type: "info", message: `🏳️ You resigned. ${winner === "white" ? "White" : "Black"} wins.`, icon: "🏳️", pepe: PEPE.sadge },
    ]);
    playSound("sad-trombone");
    spawnPepe(PEPE.sadge);
  }, [playerColor, spawnPepe]);

  /* ── Eval update ── */
  useEffect(() => {
    if (gameStatus !== "playing" && gameStatus !== "drafting") return;
    let cancelled = false;
    stockfishPool.evaluateFen(game.fen(), 10).then((r) => {
      if (!cancelled && r) {
        const cp = game.turn() === "w" ? r.cp : -r.cp;
        setEval(cp / 100);
      }
    });
    return () => { cancelled = true; };
  }, [game, gameStatus]);

  /* ── Next draft phase number for display ── */
  const nextDraftTurn = useMemo(() => {
    const nextPhase = chaosState.currentPhase + 1;
    if (nextPhase > chaosState.phaseTriggers.length) return null;
    return chaosState.phaseTriggers[nextPhase - 1];
  }, [chaosState]);

  /* ── Board squares merging ── */
  const mergedSquareStyles = useMemo(() => {
    return { ...lastMoveHighlight, ...legalMoveSquares };
  }, [lastMoveHighlight, legalMoveSquares]);

  /* ────────────────────────── Render ────────────────────────── */

  // Setup screen
  if (gameStatus === "setup") {
    return (
      <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-gradient-to-b from-[#030712] via-[#0a0f1a] to-[#030712]">
        <ChaosParticles />
        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-4 py-16 text-center">
          {/* Title */}
          <img
            src={PEPE.hyped}
            alt=""
            className="mb-3 h-16 w-16 object-contain"
            style={{ animation: "pepe-bounce 1.5s ease-in-out infinite" }}
          />
          <h1 className="mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-4xl font-black tracking-tight text-transparent md:text-5xl">
            CHAOS CHESS
          </h1>
          <p className="mb-8 max-w-md text-base text-slate-400">
            Play chess against Stockfish. Every 5 turns, the game freezes and you
            draft a wild modifier that permanently changes your pieces. Pure chaos.
          </p>

          {/* How it works */}
          <div className="mb-10 grid w-full max-w-lg gap-4 text-left md:grid-cols-3">
            {[
              { icon: "♟️", title: "Play", desc: "Normal chess rules vs Stockfish AI" },
              { icon: "⏸️", title: "Draft", desc: "At turns 5, 10, 15, 20, 25 — pick a modifier" },
              { icon: "💥", title: "Chaos", desc: "Modifiers stack — pieces get increasingly wild" },
            ].map((step) => (
              <div key={step.title} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                <div className="mb-2 text-2xl">{step.icon}</div>
                <h3 className="mb-1 text-sm font-bold text-white">{step.title}</h3>
                <p className="text-xs text-slate-500">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Difficulty */}
          <div className="mb-6">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">AI Difficulty</p>
            <div className="flex gap-2">
              {(["easy", "medium", "hard"] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setAiLevel(level)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-all ${
                    aiLevel === level
                      ? "bg-purple-500/20 text-purple-400 border border-purple-500/40"
                      : "bg-white/[0.04] text-slate-400 border border-white/[0.06] hover:bg-white/[0.08]"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
            Choose your side
          </p>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => startGame("white")}
              className="group flex flex-col items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-8 py-5 transition-all hover:border-white/[0.2] hover:bg-white/[0.08] hover:scale-105"
            >
              <span className="text-4xl">♔</span>
              <span className="text-sm font-bold text-white">White</span>
            </button>
            <button
              type="button"
              onClick={() => startGame("black")}
              className="group flex flex-col items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-8 py-5 transition-all hover:border-white/[0.2] hover:bg-white/[0.08] hover:scale-105"
            >
              <span className="text-4xl">♚</span>
              <span className="text-sm font-bold text-white">Black</span>
            </button>
          </div>

          {/* AnarchyChess callout */}
          <div className="mt-12 rounded-xl border border-orange-500/20 bg-orange-500/5 px-6 py-4 text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <img src={PEPE.clownge} alt="" className="h-8 w-8 object-contain" />
              <img src={PEPE.clowntrain} alt="" className="h-8 w-8 object-contain" />
            </div>
            <p className="text-sm text-orange-400">
              🧱 Yes, we have <span className="font-bold">Forced En Passant</span>, <span className="font-bold">The Knook</span>, and <span className="font-bold">Il Vaticano</span>.
            </p>
            <p className="mt-1 text-xs text-slate-500">You&apos;re welcome, r/AnarchyChess.</p>
          </div>
        </div>
      </div>
    );
  }

  // Game / Drafting / Game Over
  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-gradient-to-b from-[#030712] via-[#0a0f1a] to-[#030712]">
      <ChaosParticles />

      {/* Floating pepe reactions */}
      {floatingPepes.map((p) => (
        <FloatingPepe key={p.id} src={p.src} onDone={() => removePepe(p.id)} />
      ))}

      {/* Draft modal */}
      {gameStatus === "drafting" && chaosState.draftChoices.length > 0 && (
        <DraftModal
          phase={pendingPhase}
          choices={chaosState.draftChoices}
          onPick={handleDraftPick}
        />
      )}

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:gap-6 lg:px-8 lg:py-6">
        {/* ── Left sidebar: Modifiers ── */}
        <div className="order-3 flex w-full flex-col gap-3 lg:order-1 lg:w-56 xl:w-64">
          <ModifierList
            title="Your Modifiers"
            modifiers={chaosState.playerModifiers}
            color="text-purple-400"
          />
          <ModifierList
            title="AI Modifiers"
            modifiers={chaosState.aiModifiers}
            color="text-red-400"
          />

          {/* Next draft info */}
          {nextDraftTurn && gameStatus === "playing" && (
            <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 text-center">
              <p className="text-xs text-purple-400">
                ⚡ Next draft at turn <span className="font-bold">{nextDraftTurn}</span>
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">
                Current: turn {game.moveNumber()}
              </p>
            </div>
          )}
        </div>

        {/* ── Center: Board ── */}
        <div className="order-1 flex flex-1 flex-col items-center lg:order-2">
          {/* Header */}
          <div className="mb-3 flex w-full max-w-lg items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚡</span>
              <h1 className="text-lg font-bold text-white">Chaos Chess</h1>
              {gameStatus === "game-over" && (
                <div className="flex items-center gap-1.5">
                  <img
                    src={
                      gameResult === "draw" ? PEPE.hmm
                      : gameResult === playerColor ? PEPE.gigachad
                      : PEPE.gamercry
                    }
                    alt=""
                    className="h-7 w-7 object-contain"
                  />
                  <span className={`rounded px-2 py-0.5 text-xs font-bold ${
                    gameResult === playerColor
                      ? "bg-emerald-500/20 text-emerald-400"
                      : gameResult === "draw"
                      ? "bg-white/10 text-white"
                      : "bg-red-500/20 text-red-400"
                  }`}>
                    {gameResult === "draw"
                      ? "Draw"
                      : gameResult === playerColor
                      ? "You Win!"
                      : "You Lose"}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isThinking && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-orange-400" />
                  Thinking…
                </span>
              )}
            </div>
          </div>

          {/* AI label */}
          <div className="mb-1 flex w-full max-w-lg items-center gap-2 rounded-lg bg-white/[0.02] px-3 py-1.5">
            <span className="text-sm">🤖</span>
            <span className="text-xs font-medium text-slate-400">
              Stockfish ({aiLevel})
            </span>
            {chaosState.aiModifiers.length > 0 && (
              <div className="ml-auto flex gap-0.5">
                {chaosState.aiModifiers.map((m) => (
                  <span key={m.id} className="text-xs" title={`${m.name}: ${m.description}`}>
                    {m.icon}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Board */}
          <div ref={boardContainerRef} className="flex w-full max-w-lg items-start justify-center gap-2 sm:gap-3">
            <EvalBar evalCp={Math.round(eval_ * 100)} height={boardSize} />
            <Chessboard
              id="chaos-board"
              position={game.fen()}
              boardWidth={boardSize}
              boardOrientation={playerColor}
              onPieceDrop={(from, to) => handlePlayerMove(from as CbSquare, to as CbSquare)}
              onSquareClick={handleSquareClick}
              customSquareStyles={mergedSquareStyles}
              customBoardStyle={{
                borderRadius: "8px",
                boxShadow: "0 4px 30px rgba(0,0,0,0.4)",
              }}
              customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
              customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
              showBoardNotation={showCoordinates}
              customPieces={customPieces || undefined}
              animationDuration={200}
              arePiecesDraggable={gameStatus === "playing" && !isThinking}
            />
          </div>

          {/* Player label */}
          <div className="mt-1 flex w-full max-w-lg items-center gap-2 rounded-lg bg-white/[0.02] px-3 py-1.5">
            <span className="text-sm">👤</span>
            <span className="text-xs font-medium text-slate-400">
              You ({playerColor})
            </span>
            {chaosState.playerModifiers.length > 0 && (
              <div className="ml-auto flex gap-0.5">
                {chaosState.playerModifiers.map((m) => (
                  <span key={m.id} className="text-xs" title={`${m.name}: ${m.description}`}>
                    {m.icon}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="mt-3 flex gap-2">
            {gameStatus === "playing" && (
              <button
                type="button"
                onClick={handleResign}
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-400 transition-all hover:bg-red-500/20"
              >
                🏳️ Resign
              </button>
            )}
            {gameStatus === "game-over" && (
              <div className="flex flex-col items-center gap-3">
                {/* Game over pepe */}
                <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-5 py-3">
                  <img
                    src={
                      gameResult === playerColor ? PEPE.king
                      : gameResult === "draw" ? PEPE.copium
                      : PEPE.sadge
                    }
                    alt=""
                    className="h-14 w-14 object-contain"
                    style={{ animation: "pepe-bounce 1.5s ease-in-out infinite" }}
                  />
                  <div>
                    <p className="text-sm font-bold text-white">
                      {gameResult === playerColor ? "GG EZ" : gameResult === "draw" ? "At least it's not a loss..." : "Skill issue"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {gameResult === playerColor
                        ? "Stockfish never stood a chance."
                        : gameResult === "draw"
                        ? "Copium levels critical."
                        : "Maybe draft better next time."}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setGameStatus("setup")}
                  className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-xs font-medium text-purple-400 transition-all hover:bg-purple-500/20"
                >
                  ⚡ New Game
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Right sidebar: Event log + Move log ── */}
        <div className="order-2 flex w-full flex-col gap-3 lg:order-3 lg:w-56 xl:w-64">
          {/* Event log */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-purple-400">
              ⚡ Chaos Log
            </h3>
            <div
              ref={eventLogRef}
              className="max-h-48 space-y-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
            >
              {eventLog.map((entry, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-1.5 rounded px-2 py-1 text-[11px] leading-relaxed ${
                    entry.type === "draft"
                      ? "bg-purple-500/10 text-purple-300"
                      : entry.type === "modifier"
                      ? "bg-amber-500/10 text-amber-300"
                      : entry.type === "chaos"
                      ? "bg-red-500/10 text-red-300"
                      : "text-slate-500"
                  }`}
                >
                  {entry.pepe && (
                    <img src={entry.pepe} alt="" className="h-4 w-4 shrink-0 object-contain mt-0.5" />
                  )}
                  <span>{entry.message}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Move log */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              Moves
            </h3>
            <div
              ref={moveLogRef}
              className="max-h-40 space-y-0.5 overflow-y-auto font-mono text-[11px] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
            >
              {moveLog.map((entry) => (
                <div key={entry.moveNumber} className="flex gap-2 text-slate-400">
                  <span className="w-6 text-right text-slate-600">{entry.moveNumber}.</span>
                  <span className="w-14">{entry.white ?? ""}</span>
                  <span className="w-14">{entry.black ?? ""}</span>
                </div>
              ))}
              {moveLog.length === 0 && (
                <p className="text-center text-slate-600">No moves yet</p>
              )}
            </div>
          </div>

          {/* Quick info */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              Game Info
            </h3>
            <div className="space-y-1 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Turn</span>
                <span className="text-white">{game.moveNumber()}</span>
              </div>
              <div className="flex justify-between">
                <span>Side to move</span>
                <span className="text-white">{game.turn() === "w" ? "White" : "Black"}</span>
              </div>
              <div className="flex justify-between">
                <span>Modifiers drafted</span>
                <span className="text-white">{chaosState.playerModifiers.length + chaosState.aiModifiers.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Phase</span>
                <span className="text-white">{chaosState.currentPhase} / 5</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
