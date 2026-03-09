"use client";

/**
 * /chaos — Chaos Chess
 *
 * Play chess against Stockfish AI or another player. At turn milestones
 * (5, 10, 15, 20, 25) the game freezes and you draft a permanent
 * modifier that changes how your pieces behave. Modifiers actually work —
 * the custom move engine generates extra legal moves beyond standard chess.
 *
 * Supports: vs AI, vs Friend (room code invite), and random matchmaking.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Color, type PieceSymbol } from "chess.js";
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
import {
  getChaosMoves,
  executeChaosMove,
  applyPostMoveEffects,
  applyDraftEffect,
  type ChaosMove,
} from "@/lib/chaos-moves";

/* ────────────────────────── Constants ────────────────────────── */

const AI_MOVE_DELAY = 600;
const POLL_INTERVAL = 1500;

type GameMode = "ai" | "friend" | "matchmake";
type GameStatus = "setup" | "waiting" | "playing" | "drafting" | "game-over";
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

/** Meme sound pools per tier */
type ChaosSound = "vine-boom" | "crowd-ooh" | "nani" | "airhorn" | "emotional-damage";

const TIER_SOUNDS: Record<ModifierTier, ChaosSound[]> = {
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
                <div className="mb-2 text-5xl">{mod.icon}</div>

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

/* ────────────────────────── Modifier Tooltip ────────────────────────── */

function ModifierTooltip({
  mod,
  children,
}: {
  mod: ChaosModifier;
  children: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  const tier = TIER_COLORS[mod.tier];

  return (
    <div
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 z-[80] mb-2 w-56 -translate-x-1/2 rounded-xl border border-white/10 bg-[#0d1117] p-3 shadow-2xl shadow-black/50"
          style={{ animation: "card-appear 0.15s ease-out" }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-2xl">{mod.icon}</span>
            <div>
              <p className="text-sm font-bold text-white">{mod.name}</p>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${tier.text}`}>
                {TIER_LABELS[mod.tier]}
              </span>
            </div>
          </div>
          {mod.piece && (
            <p className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">
              Affects: {({ p: "Pawns", n: "Knights", b: "Bishops", r: "Rooks", q: "Queen", k: "King" } as Record<string, string>)[mod.piece]}
            </p>
          )}
          <p className="text-xs leading-relaxed text-slate-400">{mod.description}</p>
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[#0d1117]" />
        </div>
      )}
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
          <ModifierTooltip key={mod.id} mod={mod}>
            <div className="flex items-start gap-2.5 rounded-lg bg-white/[0.03] px-2.5 py-2 cursor-default transition-colors hover:bg-white/[0.06]">
              <span className="text-2xl leading-none">{mod.icon}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {mod.name}
                </p>
                <p className="truncate text-[11px] text-slate-500">
                  {mod.description}
                </p>
              </div>
            </div>
          </ModifierTooltip>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────── Inline modifier icons (next to player name) ────────────────────────── */

function InlineModifierIcons({ modifiers }: { modifiers: ChaosModifier[] }) {
  if (modifiers.length === 0) return null;
  return (
    <div className="ml-auto flex gap-1">
      {modifiers.map((m) => (
        <ModifierTooltip key={m.id} mod={m}>
          <span className="text-xl cursor-default transition-transform hover:scale-125">
            {m.icon}
          </span>
        </ModifierTooltip>
      ))}
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

  /* ── Mode / multiplayer ── */
  const [gameMode, setGameMode] = useState<GameMode>("ai");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string>("");
  const [joinCode, setJoinCode] = useState<string>("");
  const [matchmakeState, setMatchmakeState] = useState<"idle" | "searching" | "found">("idle");
  const [opponentLabel, setOpponentLabel] = useState<string>("Opponent");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFenRef = useRef<string>("");

  /* ── Chaos state ── */
  const [chaosState, setChaosState] = useState<ChaosState>(createChaosState);
  const [pendingPhase, setPendingPhase] = useState(0);
  const [capturedPawns, setCapturedPawns] = useState({ w: 0, b: 0 });

  /* ── Chaos moves (extra legal moves from modifiers) ── */
  const [availableChaosMoves, setAvailableChaosMoves] = useState<ChaosMove[]>([]);

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

  /* ── Cleanup polling on unmount ── */
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  /* ── Recompute chaos moves when board/modifiers change ── */
  const recomputeChaosMoves = useCallback(
    (g: Chess, cs: ChaosState) => {
      const color: Color = g.turn() === "w"
        ? (playerColor === "white" ? "w" : "b")
        : (playerColor === "black" ? "b" : "w");
      const isPlayerTurn =
        (playerColor === "white" && g.turn() === "w") ||
        (playerColor === "black" && g.turn() === "b");
      if (isPlayerTurn) {
        const chaosMvs = getChaosMoves(g, cs.playerModifiers, g.turn() as Color);
        setAvailableChaosMoves(chaosMvs);
      } else {
        setAvailableChaosMoves([]);
      }
    },
    [playerColor],
  );

  /* ── Helper: add move to log ── */
  const addMoveToLog = useCallback((g: Chess, san: string, moveColor: "w" | "b") => {
    setMoveLog((prev) => {
      const copy = [...prev];
      const mn = moveColor === "w" ? g.moveNumber() - 1 : g.moveNumber();
      const existing = copy.find((e) => e.moveNumber === mn);
      if (moveColor === "w") {
        if (existing) existing.white = san;
        else copy.push({ moveNumber: mn, white: san });
      } else {
        if (existing) existing.black = san;
        else copy.push({ moveNumber: mn, black: san });
      }
      return copy;
    });
  }, []);

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

  /* ── Apply post-move effects (collateral rook, nuclear queen) ── */
  const applyPostMove = useCallback(
    (g: Chess, from: CbSquare, to: CbSquare, captured: boolean, pieceType: PieceSymbol, color: Color, mods: ChaosModifier[]) => {
      const result = applyPostMoveEffects(g, from as any, to as any, captured, pieceType, color, mods);
      if (result) {
        if (mods.some((m) => m.id === "collateral-rook") && pieceType === "r" && captured) {
          setEventLog((prev) => [...prev, { type: "chaos", message: "💥 Collateral Damage! The rook destroyed the piece behind its target!", icon: "💥", pepe: PEPE.firesgun }]);
          spawnPepe(PEPE.firesgun);
          playSound("vine-boom");
        }
        if (mods.some((m) => m.id === "nuclear-queen") && pieceType === "q" && captured) {
          setEventLog((prev) => [...prev, { type: "chaos", message: "☢️ NUCLEAR QUEEN! All surrounding pieces destroyed!", icon: "☢️", pepe: PEPE.madpuke }]);
          spawnPepe(PEPE.madpuke);
          playSound("airhorn");
        }
        return result;
      }
      return g;
    },
    [spawnPepe],
  );

  /* ── AI move (with chaos modifiers) ── */
  const makeAiMove = useCallback(
    async (g: Chess, cs: ChaosState) => {
      if (g.isGameOver()) return;
      setIsThinking(true);

      try {
        // AI can also use chaos moves
        const aiColor = playerColor === "white" ? "b" : "w";
        const aiChaosMoves = getChaosMoves(g, cs.aiModifiers, aiColor as Color);

        // 30% chance to pick a chaos move if available
        if (aiChaosMoves.length > 0 && Math.random() < 0.3) {
          const chaosMove = pickRandom(aiChaosMoves);
          const newGame = executeChaosMove(g, chaosMove, cs.aiModifiers);
          if (newGame) {
            const label = chaosMove.label;
            addMoveToLog(newGame, `⚡${label.split("(")[0].trim()}`, aiColor as "w" | "b");
            setLastMoveHighlight({
              [chaosMove.from]: { backgroundColor: "rgba(255, 100, 0, 0.4)" },
              [chaosMove.to]: { backgroundColor: "rgba(255, 100, 0, 0.4)" },
            });
            setEventLog((prev) => [...prev, { type: "chaos", message: `🤖 AI used: ${chaosMove.label}`, icon: "🤖", pepe: PEPE.shocked }]);
            playSound("nani");
            setGame(newGame);
            setIsThinking(false);
            if (!checkGameEnd(newGame)) {
              checkDraft(newGame, cs);
              recomputeChaosMoves(newGame, cs);
            }
            return;
          }
        }

        // Normal Stockfish move
        const result = await stockfishPool.evaluateFen(g.fen(), aiDepth);
        if (!result?.bestMove) {
          setIsThinking(false);
          return;
        }

        const from = result.bestMove.slice(0, 2) as CbSquare;
        const to = result.bestMove.slice(2, 4) as CbSquare;
        const promotion = result.bestMove.length > 4 ? result.bestMove[4] : undefined;

        const pieceAtFrom = g.get(from as any);
        const moveResult = g.move({ from, to, promotion });
        if (!moveResult) {
          setIsThinking(false);
          return;
        }

        // Sound
        if (g.isCheck()) playSound("check");
        else if (moveResult.captured) playSound("capture");
        else playSound("move");

        // Track captured pawns
        if (moveResult.captured === "p") {
          setCapturedPawns((prev) => ({
            ...prev,
            [moveResult.color === "w" ? "b" : "w"]: prev[moveResult.color === "w" ? "b" as const : "w" as const] + 1,
          }));
        }

        // Highlight
        setLastMoveHighlight({
          [from]: { backgroundColor: "rgba(255, 170, 0, 0.3)" },
          [to]: { backgroundColor: "rgba(255, 170, 0, 0.3)" },
        });

        addMoveToLog(g, moveResult.san, moveResult.color);
        setEval(result.cp / 100);

        // Apply post-move chaos effects
        const aiMods = cs.aiModifiers;
        let finalGame: Chess = g;
        if (moveResult.captured && pieceAtFrom) {
          const afterEffects = applyPostMove(g, from, to, true, pieceAtFrom.type, pieceAtFrom.color as Color, aiMods);
          if (afterEffects !== g) {
            finalGame = afterEffects;
          }
        }

        setGame(new Chess(finalGame.fen()));

        if (!checkGameEnd(finalGame)) {
          checkDraft(finalGame, cs);
          recomputeChaosMoves(new Chess(finalGame.fen()), cs);
        }
      } catch {
        // Engine error
      }

      setIsThinking(false);
    },
    [playerColor, aiDepth, checkGameEnd, checkDraft, addMoveToLog, applyPostMove, recomputeChaosMoves],
  );

  /* ── Start game ── */
  const startGame = useCallback(
    (color: "white" | "black", mode: GameMode = "ai") => {
      const g = new Chess();
      setGame(g);
      setPlayerColor(color);
      setGameMode(mode);
      setGameStatus("playing");
      setGameResult(null);
      const cs = createChaosState();
      setChaosState(cs);
      setMoveLog([]);
      setFloatingPepes([]);
      setCapturedPawns({ w: 0, b: 0 });
      setAvailableChaosMoves([]);
      setEventLog([
        { type: "info", message: `⚡ Chaos Chess begins! ${mode === "ai" ? "vs Stockfish" : "vs Player"}. Modifiers appear at turns 5, 10, 15, 20, 25.`, icon: "⚡", pepe: PEPE.hyped },
      ]);
      playSound("reveal-stinger");
      setEval(0);
      setSelectedSquare(null);
      setLegalMoveSquares({});
      setLastMoveHighlight({});
      recomputeChaosMoves(g, cs);

      if (mode === "ai" && color === "black") {
        setTimeout(() => makeAiMove(g, cs), AI_MOVE_DELAY);
      }
    },
    [makeAiMove, recomputeChaosMoves],
  );

  /* ── Multiplayer: Create room ── */
  const createRoom = useCallback(async (color: "white" | "black") => {
    try {
      const res = await fetch("/api/chaos/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostColor: color }),
      });
      const data = await res.json();
      if (data.error) {
        setEventLog((prev) => [...prev, { type: "info", message: `❌ ${data.error}`, icon: "❌" }]);
        return;
      }
      setRoomId(data.roomId);
      setRoomCode(data.roomCode);
      setPlayerColor(color);
      setGameMode("friend");
      setGameStatus("waiting");
      setOpponentLabel("Waiting for friend…");
      setEventLog([{ type: "info", message: `🏠 Room created! Code: ${data.roomCode}. Share it with a friend!`, icon: "🏠", pepe: PEPE.detective }]);

      // Start polling for guest
      startPolling(data.roomId, color);
    } catch {
      setEventLog((prev) => [...prev, { type: "info", message: "❌ Failed to create room. Are you signed in?", icon: "❌" }]);
    }
  }, []);

  /* ── Multiplayer: Join room ── */
  const joinRoom = useCallback(async () => {
    if (joinCode.length !== 6) return;
    try {
      const res = await fetch("/api/chaos/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode: joinCode.toUpperCase() }),
      });
      const data = await res.json();
      if (data.error) {
        setEventLog((prev) => [...prev, { type: "info", message: `❌ ${data.error}`, icon: "❌" }]);
        return;
      }
      setRoomId(data.roomId);
      setRoomCode(joinCode.toUpperCase());
      const guestColor = data.hostColor === "white" ? "black" : "white";
      setPlayerColor(guestColor as "white" | "black");
      setGameMode("friend");
      setGameStatus("playing");
      setOpponentLabel("Friend");
      const cs = data.chaosState ? data.chaosState as ChaosState : createChaosState();
      setChaosState(cs);
      const g = new Chess(data.fen);
      setGame(g);
      setMoveLog([]);
      setFloatingPepes([]);
      setCapturedPawns({ w: 0, b: 0 });
      setEventLog([{ type: "info", message: `🎮 Joined room ${joinCode.toUpperCase()}! You are ${guestColor}. Game on!`, icon: "🎮", pepe: PEPE.hyped }]);
      playSound("reveal-stinger");
      recomputeChaosMoves(g, cs);

      // Start polling for opponent moves
      startPolling(data.roomId, guestColor);
    } catch {
      setEventLog((prev) => [...prev, { type: "info", message: "❌ Failed to join room.", icon: "❌" }]);
    }
  }, [joinCode, recomputeChaosMoves]);

  /* ── Multiplayer: Matchmaking ── */
  const startMatchmaking = useCallback(async () => {
    setMatchmakeState("searching");
    setEventLog([{ type: "info", message: "🔍 Searching for opponent…", icon: "🔍", pepe: PEPE.detective }]);

    try {
      // Try to find an existing room
      const res = await fetch("/api/chaos/matchmake");
      const data = await res.json();

      if (data.roomId) {
        // Found one!
        setRoomId(data.roomId);
        setRoomCode(data.roomCode);
        const guestColor = data.hostColor === "white" ? "black" : "white";
        setPlayerColor(guestColor as "white" | "black");
        setGameMode("matchmake");
        setGameStatus("playing");
        setMatchmakeState("found");
        setOpponentLabel("Random Opponent");
        const cs = createChaosState();
        setChaosState(cs);
        const g = new Chess();
        setGame(g);
        setMoveLog([]);
        setFloatingPepes([]);
        setCapturedPawns({ w: 0, b: 0 });
        setEventLog([{ type: "info", message: "🎯 Opponent found! Game on!", icon: "🎯", pepe: PEPE.hyped }]);
        playSound("reveal-stinger");
        spawnPepe(PEPE.hyped);
        recomputeChaosMoves(g, cs);
        startPolling(data.roomId, guestColor);
        return;
      }

      // No room found — create one for matchmaking
      const createRes = await fetch("/api/chaos/matchmake", {
        method: "POST",
      });
      const createData = await createRes.json();
      if (createData.error) {
        setMatchmakeState("idle");
        setEventLog((prev) => [...prev, { type: "info", message: `❌ ${createData.error}`, icon: "❌" }]);
        return;
      }

      setRoomId(createData.roomId);
      setRoomCode(createData.roomCode);
      setPlayerColor(createData.hostColor === "white" ? "white" : "black");
      setGameMode("matchmake");
      setGameStatus("waiting");
      setOpponentLabel("Searching…");
      setEventLog([{ type: "info", message: "⏳ In matchmaking queue. Waiting for opponent…", icon: "⏳", pepe: PEPE.prayge }]);

      startPolling(createData.roomId, createData.hostColor);
    } catch {
      setMatchmakeState("idle");
      setEventLog((prev) => [...prev, { type: "info", message: "❌ Matchmaking failed. Are you signed in?", icon: "❌" }]);
    }
  }, [spawnPepe, recomputeChaosMoves]);

  /* ── Polling for multiplayer state ── */
  const startPolling = useCallback((rId: string, myColor: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    lastFenRef.current = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/chaos/move?roomId=${rId}`);
        if (!res.ok) return;
        const data = await res.json();

        // Room got a guest — start the game
        if (data.status === "playing" && data.guestId) {
          setGameStatus((prev) => {
            if (prev === "waiting") {
              setOpponentLabel("Opponent");
              setEventLog((p) => [...p, { type: "info", message: "🎮 Opponent joined! Game on!", icon: "🎮", pepe: PEPE.hyped }]);
              playSound("reveal-stinger");
              const cs = data.chaosState ? data.chaosState as ChaosState : createChaosState();
              setChaosState(cs);
              const g = new Chess(data.fen);
              setGame(g);
              return "playing";
            }
            return prev;
          });
        }

        // Check for new moves
        if (data.fen && data.fen !== lastFenRef.current) {
          lastFenRef.current = data.fen;
          const g = new Chess(data.fen);
          setGame(g);
          if (data.chaosState) setChaosState(data.chaosState as ChaosState);
          if (data.lastMoveFrom && data.lastMoveTo) {
            setLastMoveHighlight({
              [data.lastMoveFrom]: { backgroundColor: "rgba(255, 170, 0, 0.3)" },
              [data.lastMoveTo]: { backgroundColor: "rgba(255, 170, 0, 0.3)" },
            });
            playSound("move");
          }
          setCapturedPawns({ w: data.capturedPawnsWhite ?? 0, b: data.capturedPawnsBlack ?? 0 });

          // Check game end from FEN
          if (g.isCheckmate() || g.isStalemate() || g.isDraw()) {
            checkGameEnd(g);
            if (pollRef.current) clearInterval(pollRef.current);
          } else {
            // Check draft
            const cs = data.chaosState ? data.chaosState as ChaosState : createChaosState();
            checkDraft(g, cs);
            recomputeChaosMoves(g, cs);
          }
        }

        if (data.status === "finished") {
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // Poll error — ignore
      }
    }, POLL_INTERVAL);
  }, [checkGameEnd, checkDraft, recomputeChaosMoves]);

  /* ── Send move to server (multiplayer) ── */
  const sendMoveToServer = useCallback(
    async (g: Chess, from: string, to: string, cs: ChaosState) => {
      if (!roomId) return;
      try {
        await fetch("/api/chaos/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId,
            from,
            to,
            newFen: g.fen(),
            chaosState: cs,
            lastMoveFrom: from,
            lastMoveTo: to,
            capturedPawnsWhite: capturedPawns.w,
            capturedPawnsBlack: capturedPawns.b,
            status: g.isGameOver() ? "finished" : "playing",
          }),
        });
        lastFenRef.current = g.fen();
      } catch {
        // Upload error
      }
    },
    [roomId, capturedPawns],
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

      // First check if this is a chaos move
      const chaosMove = availableChaosMoves.find(
        (m) => m.from === from && m.to === to,
      );

      if (chaosMove) {
        const newGame = executeChaosMove(game, chaosMove, chaosState.playerModifiers);
        if (!newGame) return false;

        playSound("capture");
        setLastMoveHighlight({
          [from]: { backgroundColor: "rgba(168, 85, 247, 0.4)" },
          [to]: { backgroundColor: "rgba(168, 85, 247, 0.4)" },
        });
        setSelectedSquare(null);
        setLegalMoveSquares({});
        addMoveToLog(newGame, `⚡${chaosMove.label.split("(")[0].trim()}`, game.turn() as "w" | "b");
        setEventLog((prev) => [...prev, { type: "chaos", message: `⚡ You used: ${chaosMove.label}`, icon: "⚡", pepe: tierPepe("rare") }]);
        spawnPepe(PEPE.lmao);
        playSound("vine-boom");

        setGame(newGame);

        if (checkGameEnd(newGame)) return true;
        const drafted = checkDraft(newGame, chaosState);

        // Multiplayer: send to server
        if (gameMode !== "ai") {
          sendMoveToServer(newGame, from, to, chaosState);
        }

        if (!drafted && gameMode === "ai") {
          setTimeout(() => makeAiMove(newGame, chaosState), AI_MOVE_DELAY);
        }
        recomputeChaosMoves(newGame, chaosState);
        return true;
      }

      // Standard chess.js move
      let moveResult = null;
      const pieceAtFrom = game.get(from as any);
      for (const promo of [undefined, "q", "r", "b", "n"] as const) {
        try {
          const tmp = new Chess(game.fen());
          const result = tmp.move({ from, to, promotion: promo });
          if (result) {
            moveResult = result;
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

      // Track captured pawns
      if (moveResult.captured === "p") {
        setCapturedPawns((prev) => ({
          ...prev,
          [moveResult.color === "w" ? "b" : "w"]: prev[moveResult.color === "w" ? "b" as const : "w" as const] + 1,
        }));
      }

      // Highlight
      setLastMoveHighlight({
        [from]: { backgroundColor: "rgba(255, 170, 0, 0.3)" },
        [to]: { backgroundColor: "rgba(255, 170, 0, 0.3)" },
      });
      setSelectedSquare(null);
      setLegalMoveSquares({});

      addMoveToLog(game, moveResult.san, moveResult.color);

      // Apply post-move chaos effects (collateral rook, nuclear queen)
      let finalGame: Chess = game;
      if (moveResult.captured && pieceAtFrom) {
        const afterEffects = applyPostMove(game, from, to, true, pieceAtFrom.type, pieceAtFrom.color as Color, chaosState.playerModifiers);
        if (afterEffects !== game) {
          finalGame = afterEffects;
        }
      }

      const newG = new Chess(finalGame.fen());
      setGame(newG);

      if (checkGameEnd(newG)) return true;

      const drafted = checkDraft(newG, chaosState);

      // Multiplayer: send to server
      if (gameMode !== "ai") {
        sendMoveToServer(newG, from, to, chaosState);
      }

      if (!drafted && gameMode === "ai") {
        setTimeout(() => makeAiMove(newG, chaosState), AI_MOVE_DELAY);
      }
      recomputeChaosMoves(newG, chaosState);

      return true;
    },
    [game, gameStatus, playerColor, isThinking, chaosState, gameMode, availableChaosMoves, checkGameEnd, checkDraft, makeAiMove, addMoveToLog, applyPostMove, sendMoveToServer, spawnPepe, recomputeChaosMoves],
  );

  /* ── Square click for mobile + to show legal moves ── */
  const handleSquareClick = useCallback(
    (square: CbSquare) => {
      if (gameStatus !== "playing" || isThinking) return;

      const isPlayerTurn =
        (playerColor === "white" && game.turn() === "w") ||
        (playerColor === "black" && game.turn() === "b");
      if (!isPlayerTurn) return;

      if (selectedSquare) {
        const success = handlePlayerMove(selectedSquare, square);
        if (!success) {
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
            // Add chaos move highlights for this square
            for (const cm of availableChaosMoves.filter((m) => m.from === square)) {
              highlights[cm.to] = {
                backgroundColor: cm.type === "capture"
                  ? "rgba(168, 85, 247, 0.5)"
                  : "rgba(168, 85, 247, 0.3)",
                borderRadius: cm.type === "capture" ? undefined : "50%",
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
          // Add chaos move highlights for this square (purple)
          for (const cm of availableChaosMoves.filter((m) => m.from === square)) {
            highlights[cm.to] = {
              backgroundColor: cm.type === "capture"
                ? "rgba(168, 85, 247, 0.5)"
                : "rgba(168, 85, 247, 0.3)",
              borderRadius: cm.type === "capture" ? undefined : "50%",
            };
          }
          setLegalMoveSquares(highlights);
          playSound("select");
        }
      }
    },
    [game, gameStatus, playerColor, isThinking, selectedSquare, handlePlayerMove, availableChaosMoves],
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
        ...(gameMode === "ai" && aiMsg
          ? [{ type: "modifier" as const, message: aiMsg, icon: "🤖", pepe: aiLastMod ? tierPepe(aiLastMod.tier) : PEPE.hmm }]
          : []),
        { type: "info" as const, message: "⏯️ Game resumed!", icon: "▶️" },
      ]);

      // Apply one-time draft effects (knight horde, undead army)
      const pColor = playerColor === "white" ? "w" : "b";
      const draftResult = applyDraftEffect(game, mod, pColor as Color, capturedPawns[pColor as "w" | "b"]);
      let currentGame = game;
      if (draftResult) {
        currentGame = draftResult;
        setGame(draftResult);
        setEventLog((prev) => [...prev, { type: "chaos", message: `🎭 ${mod.name} effect activated! Check the board!`, icon: "🎭", pepe: PEPE.galaxybrain }]);
        spawnPepe(PEPE.galaxybrain);
      }

      // Tier-based meme sound
      playSound(pickRandom(TIER_SOUNDS[mod.tier]));
      spawnPepe(tierPepe(mod.tier));

      recomputeChaosMoves(currentGame, newState);

      // Send updated state for multiplayer
      if (gameMode !== "ai" && roomId) {
        sendMoveToServer(currentGame, "", "", newState);
      }

      // If it's AI's turn, make AI move
      if (gameMode === "ai") {
        const isAiTurn =
          (playerColor === "white" && currentGame.turn() === "b") ||
          (playerColor === "black" && currentGame.turn() === "w");
        if (isAiTurn) {
          setTimeout(() => makeAiMove(currentGame, newState), AI_MOVE_DELAY);
        }
      }
    },
    [chaosState, pendingPhase, playerColor, game, gameMode, makeAiMove, roomId, capturedPawns, sendMoveToServer, spawnPepe, recomputeChaosMoves],
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
    if (pollRef.current) clearInterval(pollRef.current);
    if (gameMode !== "ai" && roomId) {
      // Mark room as finished
      fetch("/api/chaos/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, from: "", to: "", newFen: game.fen(), status: "finished" }),
      });
    }
  }, [playerColor, spawnPepe, gameMode, roomId, game]);

  /* ── Eval update ── */
  useEffect(() => {
    if (gameMode !== "ai") return;
    if (gameStatus !== "playing" && gameStatus !== "drafting") return;
    let cancelled = false;
    stockfishPool.evaluateFen(game.fen(), 10).then((r) => {
      if (!cancelled && r) {
        const cp = game.turn() === "w" ? r.cp : -r.cp;
        setEval(cp / 100);
      }
    });
    return () => { cancelled = true; };
  }, [game, gameStatus, gameMode]);

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

  /* ── Active chaos moves count badge ── */
  const chaosMovesCount = availableChaosMoves.length;

  /* ────────────────────────── Render ────────────────────────── */

  // Setup screen
  if (gameStatus === "setup") {
    return (
      <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-gradient-to-b from-[#030712] via-[#0a0f1a] to-[#030712]">
        <ChaosParticles />
        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-4 py-12 text-center">
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
            Play chess with wild modifiers. Every 5 turns, draft a permanent buff
            that actually changes how your pieces move. Pure chaos.
          </p>

          {/* How it works */}
          <div className="mb-10 grid w-full max-w-lg gap-4 text-left md:grid-cols-3">
            {[
              { icon: "♟️", title: "Play", desc: "Normal chess rules + chaos modifiers" },
              { icon: "⏸️", title: "Draft", desc: "At turns 5, 10, 15, 20, 25 — pick a modifier" },
              { icon: "💥", title: "Chaos", desc: "Modifiers actually work — pieces gain new moves!" },
            ].map((step) => (
              <div key={step.title} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                <div className="mb-2 text-2xl">{step.icon}</div>
                <h3 className="mb-1 text-sm font-bold text-white">{step.title}</h3>
                <p className="text-xs text-slate-500">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* ── Mode Tabs ── */}
          <div className="mb-6 flex gap-2">
            {(["ai", "friend", "matchmake"] as GameMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setGameMode(mode)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  gameMode === mode
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/40"
                    : "bg-white/[0.04] text-slate-400 border border-white/[0.06] hover:bg-white/[0.08]"
                }`}
              >
                {mode === "ai" ? "🤖 vs AI" : mode === "friend" ? "👥 vs Friend" : "🎲 Matchmake"}
              </button>
            ))}
          </div>

          {/* ── AI Mode ── */}
          {gameMode === "ai" && (
            <>
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

              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">Choose your side</p>
              <div className="flex gap-4">
                <button type="button" onClick={() => startGame("white", "ai")}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-8 py-5 transition-all hover:border-white/[0.2] hover:bg-white/[0.08] hover:scale-105">
                  <span className="text-4xl">♔</span>
                  <span className="text-sm font-bold text-white">White</span>
                </button>
                <button type="button" onClick={() => startGame("black", "ai")}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-8 py-5 transition-all hover:border-white/[0.2] hover:bg-white/[0.08] hover:scale-105">
                  <span className="text-4xl">♚</span>
                  <span className="text-sm font-bold text-white">Black</span>
                </button>
              </div>
            </>
          )}

          {/* ── Friend Mode ── */}
          {gameMode === "friend" && (
            <div className="flex w-full max-w-md flex-col gap-6">
              {/* Create room */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <p className="mb-3 text-sm font-bold text-white">Create a Room</p>
                <p className="mb-4 text-xs text-slate-500">Choose your color and share the code with a friend</p>
                <div className="flex justify-center gap-3">
                  <button type="button" onClick={() => createRoom("white")}
                    className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-5 py-3 text-sm font-medium text-white transition-all hover:bg-white/[0.1]">
                    ♔ Play White
                  </button>
                  <button type="button" onClick={() => createRoom("black")}
                    className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-5 py-3 text-sm font-medium text-white transition-all hover:bg-white/[0.1]">
                    ♚ Play Black
                  </button>
                </div>
              </div>

              {/* Join room */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <p className="mb-3 text-sm font-bold text-white">Join a Room</p>
                <p className="mb-4 text-xs text-slate-500">Enter the 6-character code your friend shared</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="ABCDEF"
                    className="flex-1 rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-center font-mono text-lg font-bold uppercase tracking-[0.3em] text-white outline-none placeholder:text-slate-600 focus:border-purple-500/40"
                  />
                  <button
                    type="button"
                    onClick={joinRoom}
                    disabled={joinCode.length !== 6}
                    className="rounded-lg bg-purple-500/20 px-5 py-2.5 text-sm font-medium text-purple-400 transition-all hover:bg-purple-500/30 disabled:opacity-40"
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Matchmake Mode ── */}
          {gameMode === "matchmake" && (
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-slate-400">Find a random opponent to play Chaos Chess against</p>
              <button
                type="button"
                onClick={startMatchmaking}
                disabled={matchmakeState === "searching"}
                className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-8 py-4 text-lg font-bold text-purple-400 transition-all hover:bg-purple-500/20 hover:scale-105 disabled:opacity-50"
              >
                {matchmakeState === "searching" ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
                    Searching…
                  </span>
                ) : (
                  "🎲 Find Opponent"
                )}
              </button>
              <p className="text-xs text-slate-600">(Requires sign in)</p>
            </div>
          )}

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

  // Waiting for opponent screen
  if (gameStatus === "waiting") {
    return (
      <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-gradient-to-b from-[#030712] via-[#0a0f1a] to-[#030712]">
        <ChaosParticles />
        <div className="relative z-10 mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
          <img
            src={PEPE.prayge}
            alt=""
            className="mb-4 h-20 w-20 object-contain"
            style={{ animation: "pepe-bounce 1.5s ease-in-out infinite" }}
          />
          <h1 className="mb-3 text-2xl font-bold text-white">Waiting for Opponent</h1>

          {roomCode && (
            <div className="mb-6">
              <p className="mb-2 text-sm text-slate-400">Share this code with your friend:</p>
              <div className="flex items-center gap-3 rounded-xl border border-purple-500/30 bg-purple-500/10 px-6 py-4">
                <span className="font-mono text-3xl font-black tracking-[0.4em] text-purple-400">{roomCode}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(roomCode);
                    setEventLog((prev) => [...prev, { type: "info", message: "📋 Code copied!", icon: "📋" }]);
                  }}
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white transition hover:bg-white/20"
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
            {matchmakeState === "searching" ? "Looking for opponent…" : "Waiting for them to join…"}
          </div>

          <button
            type="button"
            onClick={() => {
              setGameStatus("setup");
              if (pollRef.current) clearInterval(pollRef.current);
              setMatchmakeState("idle");
            }}
            className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-400 transition-all hover:bg-red-500/20"
          >
            Cancel
          </button>

          {/* Event log for errors */}
          {eventLog.length > 0 && (
            <div className="mt-6 w-full space-y-1">
              {eventLog.slice(-3).map((e, i) => (
                <div key={i} className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs text-slate-500">
                  {e.pepe && <img src={e.pepe} alt="" className="h-4 w-4 object-contain" />}
                  <span>{e.message}</span>
                </div>
              ))}
            </div>
          )}
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
            title={gameMode === "ai" ? "AI Modifiers" : "Opponent Modifiers"}
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

          {/* Chaos moves indicator */}
          {chaosMovesCount > 0 && gameStatus === "playing" && (
            <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 text-center">
              <p className="text-xs text-purple-400">
                ⚡ <span className="font-bold">{chaosMovesCount}</span> chaos {chaosMovesCount === 1 ? "move" : "moves"} available!
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">
                Click a piece to see purple-highlighted chaos moves
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
              {gameMode !== "ai" && roomCode && (
                <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-400">
                  {roomCode}
                </span>
              )}
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

          {/* Opponent label */}
          <div className="mb-1 flex w-full max-w-lg items-center gap-2 rounded-lg bg-white/[0.02] px-3 py-1.5">
            <span className="text-sm">{gameMode === "ai" ? "🤖" : "👤"}</span>
            <span className="text-xs font-medium text-slate-400">
              {gameMode === "ai" ? `Stockfish (${aiLevel})` : opponentLabel}
            </span>
            <InlineModifierIcons modifiers={chaosState.aiModifiers} />
          </div>

          {/* Board */}
          <div ref={boardContainerRef} className="flex w-full max-w-lg items-start justify-center gap-2 sm:gap-3">
            {gameMode === "ai" && <EvalBar evalCp={Math.round(eval_ * 100)} height={boardSize} />}
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
            <InlineModifierIcons modifiers={chaosState.playerModifiers} />
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
                        ? "They never stood a chance."
                        : gameResult === "draw"
                        ? "Copium levels critical."
                        : "Maybe draft better next time."}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setGameStatus("setup");
                    setRoomId(null);
                    setRoomCode("");
                    setMatchmakeState("idle");
                    if (pollRef.current) clearInterval(pollRef.current);
                  }}
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
                <span>Mode</span>
                <span className="text-white">{gameMode === "ai" ? "vs AI" : gameMode === "friend" ? "vs Friend" : "Matchmade"}</span>
              </div>
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
              {chaosMovesCount > 0 && (
                <div className="flex justify-between">
                  <span>Chaos moves</span>
                  <span className="font-bold text-purple-400">{chaosMovesCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
