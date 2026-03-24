"use client";

/**
 * Recruit Chess — Main orchestrator component.
 *
 * Phases:
 *   commander-select → shop → [fight → round-result] x8 → game-over
 *
 * The fight runs fully client-side:
 *  1. Both armies are placed on a real chess board (buildFightFen)
 *  2. Stockfish plays both sides via stockfishPool.evaluateFen
 *  3. Chaos modifiers are active from turn 1 (via getChaosMoves + executeChaosMove)
 *  4. All moves are recorded as FEN snapshots for animated replay
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Chess, type Color, type Square } from "chess.js";
import dynamic from "next/dynamic";
import type { ChessboardCompatProps } from "@/components/chessboard-compat";

import {
  type RecruitGameState,
  type RecruitedPiece,
  type ShopSlot,
  type FightResult,
  type FightMove,
  type GhostBuild,
  type CommanderId,
  type UpgradeTier,
  type EncounterChoice,
  COMMANDERS,
  getCommander,
  createInitialGameState,
  generateShop,
  rerollShop,
  checkUpgrade,
  buildFightFen,
  extractChaosStateFromArmy,
  countMaterial,
  countPieces,
  calcHpDamage,
  calcGoldIncome,
  generateGhostBuild,
  generateEncounterChoices,
  getShopTierLabel,
  UPGRADE_TIER_STYLES,
  ALL_MODIFIERS,
} from "@/lib/recruit-chess";

import { playSound } from "@/lib/sounds";

import {
  getChaosMoves,
  executeChaosMove,
  type ChaosMove,
} from "@/lib/chaos-moves";

import { stockfishPool } from "@/lib/stockfish-client";

// Lazy-load the board (WASM Stockfish can't SSR)
const ChessboardCompat = dynamic<ChessboardCompatProps>(
  () => import("@/components/chessboard-compat").then((m) => m.Chessboard),
  { ssr: false },
);

/* ================================================================== */
/*  Constants                                                           */
/* ================================================================== */

const MAX_ROUNDS = 8;
const MAX_FIGHT_PLIES = 100;
const FIGHT_REPLAY_SPEED_MS = 600; // ms between moves during replay
const STOCKFISH_DEPTH = 8;

const PIECE_VALUES: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

const PIECE_LABELS: Record<string, string> = {
  p: "Pawn",
  n: "Knight",
  b: "Bishop",
  r: "Rook",
  q: "Queen",
  k: "King",
};

const PIECE_ICONS: Record<string, string> = {
  p: "♟",
  n: "♞",
  b: "♝",
  r: "♜",
  q: "♛",
  k: "♚",
};

const LS_KEY = "recruit_chess_state_v2";

/* ================================================================== */
/*  Fairy piece SVGs + overlay icons (from chaos chess assets)         */
/* ================================================================== */

const RECRUIT_FAIRY_SVGS: Record<string, { w: string; b: string }> = {
  camel: { w: "/pieces/fairy/wCa.svg", b: "/pieces/fairy/bCa.svg" },
  "night-rider": { w: "/pieces/fairy/wNR.svg", b: "/pieces/fairy/bNR.svg" },
  amazon: { w: "/pieces/fairy/wAm.svg", b: "/pieces/fairy/bAm.svg" },
  "dragon-bishop": { w: "/pieces/fairy/wDb.svg", b: "/pieces/fairy/bDb.svg" },
  "dragon-rook": { w: "/pieces/fairy/wDr.svg", b: "/pieces/fairy/bDr.svg" },
  "pawn-charge": { w: "/pieces/fairy/wPC.svg", b: "/pieces/fairy/bPC.svg" },
  "pawn-capture-forward": {
    w: "/pieces/fairy/wPB.svg",
    b: "/pieces/fairy/bPB.svg",
  },
  railgun: { w: "/pieces/fairy/wRG.svg", b: "/pieces/fairy/bRG.svg" },
  "rook-cannon": { w: "/pieces/fairy/wRC.svg", b: "/pieces/fairy/bRC.svg" },
  "collateral-rook": { w: "/pieces/fairy/wC.svg", b: "/pieces/fairy/bC.svg" },
  "king-ascension": { w: "/pieces/fairy/wEK.svg", b: "/pieces/fairy/bEK.svg" },
  "kings-chains": { w: "/pieces/fairy/wKB.svg", b: "/pieces/fairy/bKB.svg" },
};

const RECRUIT_MOD_ICONS: Record<string, string> = {
  "pawn-charge": "🚀",
  "pawn-capture-forward": "🗡️",
  "dragon-bishop": "🐉",
  "dragon-rook": "🔥",
  "nuclear-queen": "☢️",
  "phantom-rook": "👻",
  "bishop-bounce": "🏓",
  railgun: "💣",
  "night-rider": "🌙",
  camel: "🐪",
  amazon: "⚡",
  "king-ascension": "👑",
  "kings-chains": "⛓️",
  "bishop-cannon": "💥",
  "collateral-rook": "💢",
  "rook-cannon": "🪃",
  "pawn-promotion-early": "⭐",
};

/** Meme sounds per modifier tier (mirrors chaos chess TIER_SOUNDS) */
const TIER_SOUNDS: Record<string, string[]> = {
  common: ["bruh", "roblox-oof"],
  rare: ["crowd-ooh", "record-scratch", "honk"],
  epic: ["airhorn", "emotional-damage", "bro-serious"],
  legendary: ["airhorn", "yeet"],
};

function pickSound(tier: string): Parameters<typeof playSound>[0] {
  const pool = TIER_SOUNDS[tier] ?? TIER_SOUNDS.common;
  return pool[Math.floor(Math.random() * pool.length)] as Parameters<
    typeof playSound
  >[0];
}

/* ================================================================== */
/*  Custom piece renderer for fight board                              */
/* ================================================================== */

const PIECE_CHARS: Record<string, string> = {
  p: "P",
  n: "N",
  b: "B",
  r: "R",
  q: "Q",
  k: "K",
};
const TIER_ORDER: UpgradeTier[] = ["bronze", "silver", "gold"];

function buildRecruitCustomPieces(
  playerArmy: Array<Pick<RecruitedPiece, "pieceType" | "modifierId" | "tier">>,
  opponentArmy: Array<
    Pick<RecruitedPiece, "pieceType" | "modifierId" | "tier">
  >,
): Record<
  string,
  (props: { squareWidth: number; square?: string }) => React.ReactElement
> {
  type PieceFn = (props: {
    squareWidth: number;
    square?: string;
  }) => React.ReactElement;
  function getBestMods(
    army: typeof playerArmy,
  ): Map<string, { modifierId: string; tier: UpgradeTier }> {
    const map = new Map<string, { modifierId: string; tier: UpgradeTier }>();
    for (const piece of army) {
      const existing = map.get(piece.pieceType);
      if (
        !existing ||
        TIER_ORDER.indexOf(piece.tier) > TIER_ORDER.indexOf(existing.tier)
      ) {
        map.set(piece.pieceType, {
          modifierId: piece.modifierId,
          tier: piece.tier,
        });
      }
    }
    return map;
  }

  const custom: Record<string, PieceFn> = {};

  function addCustomPiece(
    pieceCode: string,
    colorChar: "w" | "b",
    modifierId: string,
    tier: UpgradeTier,
  ) {
    const svgPaths = RECRUIT_FAIRY_SVGS[modifierId];
    // Modifiers without a fairy SVG still get an overlay via customSquareStyles
    if (!svgPaths) return;

    const icon = RECRUIT_MOD_ICONS[modifierId];
    const isPhantom = modifierId === "phantom-rook";
    const glowFilter =
      tier === "gold"
        ? "drop-shadow(0 0 5px gold) drop-shadow(0 0 2px orange)"
        : tier === "silver"
          ? "drop-shadow(0 0 4px #94a3b8)"
          : undefined;
    const svgSrc = svgPaths[colorChar];

    const Component: PieceFn = ({ squareWidth }) => (
      <div
        style={{
          width: squareWidth,
          height: squareWidth,
          position: "relative",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={svgSrc}
          style={{
            width: "100%",
            height: "100%",
            filter:
              [isPhantom ? "opacity(0.65)" : "", glowFilter ?? ""]
                .filter(Boolean)
                .join(" ") || undefined,
          }}
          alt=""
          draggable={false}
        />
        {icon && (
          <span
            style={{
              position: "absolute",
              bottom: 1,
              right: 1,
              fontSize: Math.max(8, Math.floor(squareWidth * 0.22)),
              lineHeight: 1,
              pointerEvents: "none",
              filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.8))",
            }}
          >
            {icon}
          </span>
        )}
      </div>
    );
    custom[pieceCode] = Component;
  }

  const playerMods = getBestMods(playerArmy);
  const opponentMods = getBestMods(opponentArmy);

  for (const [pieceType, { modifierId, tier }] of playerMods) {
    addCustomPiece("w" + PIECE_CHARS[pieceType], "w", modifierId, tier);
  }
  for (const [pieceType, { modifierId, tier }] of opponentMods) {
    addCustomPiece("b" + PIECE_CHARS[pieceType], "b", modifierId, tier);
  }

  return custom;
}

/* ================================================================== */
/*  Fight simulation                                                    */
/* ================================================================== */

type FightStatus = "idle" | "simulating" | "replaying" | "done";

interface FightState {
  status: FightStatus;
  startFen: string;
  endFen: string;
  moves: FightMove[];
  replayIndex: number;
  result: FightResult | null;
}

/**
 * Run the fight simulation and return all recorded moves + result.
 * This runs fully async with Stockfish WASM.
 */
async function simulateFight(
  playerArmy: Pick<RecruitedPiece, "pieceType" | "modifierId" | "tier">[],
  opponentArmy: Pick<RecruitedPiece, "pieceType" | "modifierId" | "tier">[],
  cancelRef: React.MutableRefObject<boolean>,
  providedStartFen?: string,
): Promise<{
  moves: FightMove[];
  result: FightResult;
  startFen: string;
  endFen: string;
}> {
  const startFen = providedStartFen ?? buildFightFen(playerArmy, opponentArmy);
  const chaosState = extractChaosStateFromArmy(playerArmy, opponentArmy);

  let game = new Chess(startFen);
  const recorded: FightMove[] = [];
  let plyCount = 0;

  while (plyCount < MAX_FIGHT_PLIES) {
    if (cancelRef.current) break;

    // Check standard terminal conditions
    if (game.isGameOver()) break;

    // Check if either king is missing (chaos captures can remove kings)
    const whiteKingAlive = game
      .board()
      .flat()
      .some((p) => p && p.type === "k" && p.color === "w");
    const blackKingAlive = game
      .board()
      .flat()
      .some((p) => p && p.type === "k" && p.color === "b");
    if (!whiteKingAlive || !blackKingAlive) break;

    const side = game.turn() as Color;
    const mySideMods =
      side === "w" ? chaosState.playerModifiers : chaosState.aiModifiers;
    const oppMods =
      side === "w" ? chaosState.aiModifiers : chaosState.playerModifiers;

    // Get Stockfish's best standard move
    const sfResult = await stockfishPool.evaluateFen(
      game.fen(),
      STOCKFISH_DEPTH,
    );
    if (cancelRef.current) break;

    const bestStdMove = sfResult?.bestMove ?? null;

    // Get chaos moves for this side
    let chaosMoves: ChaosMove[] = [];
    try {
      chaosMoves = getChaosMoves(game, mySideMods, side, undefined, oppMods);
    } catch {
      // Safety: chaos move gen can throw on unusual board states
      chaosMoves = [];
    }

    // Score each chaos capture by material gain
    const scoredChaos = chaosMoves
      .filter((cm) => cm.type === "capture")
      .map((cm) => {
        const captured = game.get(cm.to as Square);
        const captureVal = captured ? (PIECE_VALUES[captured.type] ?? 0) : 0;
        const sideEffectVal = (cm.sideEffects ?? []).reduce((sum, sq) => {
          const p = game.get(sq as Square);
          if (p && p.color !== side) return sum + (PIECE_VALUES[p.type] ?? 0);
          return sum;
        }, 0);
        return { move: cm, score: captureVal + sideEffectVal };
      })
      .sort((a, b) => b.score - a.score);

    // SF-aware chaos selection:
    // Evaluate the position after each top chaos capture at lower depth.
    // If it's at least as good as the current position eval, prefer chaos.
    let useChaos = false;
    let chosenChaosMove: ChaosMove | null = null;

    const sfCpForUs = sfResult?.cp ?? 0; // current position eval from our side's POV

    for (const { move: cm, score: naiveScore } of scoredChaos.slice(0, 4)) {
      if (naiveScore < 1) break;

      try {
        // King capture is always the right move
        const captured = game.get(cm.to as Square);
        if (captured?.type === "k") {
          useChaos = true;
          chosenChaosMove = cm;
          break;
        }

        const testGame = executeChaosMove(
          new Chess(game.fen()),
          cm,
          mySideMods,
          oppMods,
        );
        if (!testGame) continue;

        // Check if opponent's king was captured by a sideEffect
        const oppKingAlive = testGame
          .board()
          .flat()
          .some((p) => p && p.type === "k" && p.color !== side);
        if (!oppKingAlive) {
          useChaos = true;
          chosenChaosMove = cm;
          break;
        }

        const chaosEval = await stockfishPool.evaluateFen(
          testGame.fen(),
          Math.max(4, STOCKFISH_DEPTH - 3),
        );
        if (cancelRef.current) break;

        // chaosEval.cp is from the new side-to-move (opponent) POV.
        // Our advantage after chaos move = -(opponent's cp).
        const chaosCpForUs = -(chaosEval?.cp ?? 0);

        // Prefer chaos if it's within 100cp of SF's best OR a high-value grab
        if (chaosCpForUs > sfCpForUs - 100 || naiveScore >= 6) {
          useChaos = true;
          chosenChaosMove = cm;
          break;
        }
      } catch {
        // executeChaosMove or Stockfish eval failed — skip this candidate
        continue;
      }
    }
    if (cancelRef.current) break;

    if (useChaos && chosenChaosMove) {
      const prevFen = game.fen();
      const newGame = executeChaosMove(
        game,
        chosenChaosMove,
        mySideMods,
        oppMods,
      );
      if (!newGame) {
        // Chaos move failed — fall through to standard
        useChaos = false;
      } else {
        const modDef = ALL_MODIFIERS.find(
          (m) => m.id === chosenChaosMove!.modifierId,
        );
        recorded.push({
          fen: prevFen,
          from: chosenChaosMove.from,
          to: chosenChaosMove.to,
          isCapture: true,
          isChaosMove: true,
          chaosLabel: modDef?.name ?? chosenChaosMove.modifierId,
          side: side === "w" ? "player" : "opponent",
          annotation: `${modDef?.name ?? "Chaos"}: ${chosenChaosMove.label}`,
          sideEffectSquares: chosenChaosMove.sideEffects as
            | string[]
            | undefined,
        });
        game = newGame;
        plyCount++;
        continue;
      }
    }

    // Standard Stockfish move
    if (!bestStdMove) break;

    const from = bestStdMove.slice(0, 2) as Square;
    const to = bestStdMove.slice(2, 4) as Square;
    const promotion = bestStdMove.length === 5 ? bestStdMove[4] : undefined;

    const prevFen = game.fen();
    const capturedPiece = game.get(to);
    const moveResult = game.move({
      from,
      to,
      promotion: promotion as "q" | "r" | "b" | "n" | undefined,
    });

    if (!moveResult) break;

    recorded.push({
      fen: prevFen,
      from,
      to,
      isCapture: !!capturedPiece,
      isChaosMove: false,
      side: side === "w" ? "player" : "opponent",
    });

    plyCount++;
  }

  // Determine result
  const whiteKingAlive = game
    .board()
    .flat()
    .some((p) => p && p.type === "k" && p.color === "w");
  const blackKingAlive = game
    .board()
    .flat()
    .some((p) => p && p.type === "k" && p.color === "b");

  let won = false;
  let reason: FightResult["reason"] = "timeout";

  if (game.isCheckmate()) {
    won = game.turn() === "b"; // it's black's turn = white delivered checkmate
    reason = "checkmate";
  } else if (!blackKingAlive) {
    won = true;
    reason = "checkmate";
  } else if (!whiteKingAlive) {
    won = false;
    reason = "checkmate";
  } else if (game.isStalemate() || game.isDraw()) {
    // Compare material at end of draw
    const wMat = countMaterial(game, "w");
    const bMat = countMaterial(game, "b");
    won = wMat > bMat;
    reason = game.isStalemate() ? "stalemate" : "material";
  } else {
    // Timeout: compare material
    const wMat = countMaterial(game, "w");
    const bMat = countMaterial(game, "b");
    won = wMat >= bMat;
    reason = "material";
  }

  const winnerColor: Color = won ? "w" : "b";
  const loserColor: Color = won ? "b" : "w";
  const hpDmg = calcHpDamage(game, winnerColor);

  return {
    startFen,
    endFen: game.fen(),
    moves: recorded,
    result: {
      won,
      reason,
      hpDamageTaken: won ? 0 : hpDmg,
      hpDamageDealt: won ? hpDmg : 0,
      replayMoves: recorded,
      playerSurvivingPieces: countPieces(game, "w"),
      opponentSurvivingPieces: countPieces(game, "b"),
    },
  };
}

/* ================================================================== */
/*  Main component                                                      */
/* ================================================================== */

export function RecruitChess() {
  const [gameState, setGameState] = useState<RecruitGameState | null>(null);
  const [fight, setFight] = useState<FightState>({
    status: "idle",
    startFen: "",
    endFen: "",
    moves: [],
    replayIndex: 0,
    result: null,
  });

  const cancelFightRef = useRef(false);
  const replayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── localStorage persistence ──────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as RecruitGameState;
        // Reset mid-fight / arrange phases — simulation can't be resumed from storage
        if (parsed.phase === "fight" || parsed.phase === "arrange") {
          parsed.phase = "shop";
          parsed.ghostOpponent = null;
          parsed.arrangeFen = undefined;
        }
        // Validate required fields exist before restoring state
        const isValid =
          parsed.round !== undefined &&
          parsed.phase &&
          Array.isArray(parsed.army) &&
          Array.isArray(parsed.bench) &&
          Array.isArray(parsed.shop) &&
          Array.isArray(parsed.roundResults);
        if (isValid) {
          setGameState(parsed);
        } else {
          localStorage.removeItem(LS_KEY);
        }
      }
    } catch {
      localStorage.removeItem(LS_KEY);
    }
  }, []);

  useEffect(() => {
    if (gameState) {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(gameState));
      } catch {
        // Storage full or unavailable — silently skip
      }
    } else {
      localStorage.removeItem(LS_KEY);
    }
  }, [gameState]);

  // ── Commander selection ────────────────────────────────────────────
  const handleSelectCommander = useCallback((id: CommanderId) => {
    playSound("intro-jingle");
    setGameState(createInitialGameState(id));
  }, []);

  // ── Shop actions ───────────────────────────────────────────────────
  const handleBuyPiece = useCallback((slotId: string) => {
    setGameState((prev) => {
      if (!prev || prev.phase !== "shop") return prev;
      const slot = prev.shop.find((s) => s.id === slotId);
      if (!slot || prev.gold < slot.cost) return prev;
      if (prev.army.length >= prev.maxArmySlots && prev.bench.length >= 2)
        return prev; // no room

      const upgradeInfo = checkUpgrade(
        prev.army,
        prev.bench,
        { pieceType: slot.pieceType, modifierId: slot.modifierId },
        prev.commander!,
      );

      let newArmy = [...prev.army];
      let newBench = [...prev.bench];

      if (upgradeInfo?.shouldUpgrade) {
        playSound("bell-double");
        // Remove matched cards and add an upgraded one
        const toRemoveIds = new Set(upgradeInfo.matchingIds);
        const allPieces = [...newArmy, ...newBench].filter(
          (p) => !toRemoveIds.has(p.id),
        );
        // Create upgraded piece
        const upgradedPiece: RecruitedPiece = {
          id: `upg-${slotId}`,
          pieceType: slot.pieceType,
          modifierId: slot.modifierId,
          tier: upgradeInfo.upgradeTo,
          slot:
            newArmy.find((p) => toRemoveIds.has(p.id))?.slot ??
            allPieces.length,
        };
        // Re-assign to army if space, else bench
        const newArmyPieces = allPieces.filter((p) =>
          newArmy.some((a) => a.id === p.id),
        );
        const newBenchPieces = allPieces.filter((p) =>
          newBench.some((b) => b.id === p.id),
        );
        if (newArmyPieces.length < prev.maxArmySlots) {
          newArmy = [...newArmyPieces, upgradedPiece];
          newBench = newBenchPieces;
        } else {
          newArmy = newArmyPieces;
          newBench = [...newBenchPieces, upgradedPiece].slice(0, 2);
        }
      } else {
        playSound("bell");
        // Just add piece
        const newPiece: RecruitedPiece = {
          id: `p-${slotId}-${Date.now()}`,
          pieceType: slot.pieceType,
          modifierId: slot.modifierId,
          tier: "bronze",
          slot: newArmy.length < prev.maxArmySlots ? newArmy.length : null,
        };
        if (newArmy.length < prev.maxArmySlots) {
          newArmy = [...newArmy, newPiece];
        } else if (newBench.length < 2) {
          newBench = [...newBench, newPiece];
        } else {
          return prev; // no room
        }
      }

      return {
        ...prev,
        gold: prev.gold - slot.cost,
        army: newArmy,
        bench: newBench,
        shop: prev.shop.filter((s) => s.id !== slotId),
      };
    });
  }, []);

  const handleSellPiece = useCallback((pieceId: string) => {
    playSound("bruh");
    setGameState((prev) => {
      if (!prev || prev.phase !== "shop") return prev;
      const piece =
        prev.army.find((p) => p.id === pieceId) ||
        prev.bench.find((p) => p.id === pieceId);
      if (!piece) return prev;
      const sellValue =
        piece.tier === "gold" ? 3 : piece.tier === "silver" ? 2 : 1;
      return {
        ...prev,
        gold: prev.gold + sellValue,
        army: prev.army.filter((p) => p.id !== pieceId),
        bench: prev.bench.filter((p) => p.id !== pieceId),
      };
    });
  }, []);

  const handleReroll = useCallback(() => {
    playSound("record-scratch");
    setGameState((prev) => {
      if (!prev || prev.phase !== "shop" || prev.gold < 1) return prev;
      return {
        ...prev,
        gold: prev.gold - 1,
        shop: rerollShop(prev.shop, prev.round, prev.commander!),
      };
    });
  }, []);

  const handleFreezeSlot = useCallback((slotId: string) => {
    setGameState((prev) => {
      if (!prev || prev.phase !== "shop") return prev;
      return {
        ...prev,
        shop: prev.shop.map((s) =>
          s.id === slotId ? { ...s, frozen: !s.frozen } : s,
        ),
      };
    });
  }, []);

  const handleLevelUp = useCallback(() => {
    playSound("taco-bell-bong");
    setGameState((prev) => {
      if (!prev || prev.phase !== "shop" || prev.gold < 4) return prev;
      if (prev.maxArmySlots >= 10) return prev;
      return {
        ...prev,
        gold: prev.gold - 4,
        maxArmySlots: prev.maxArmySlots + 1,
      };
    });
  }, []);

  // ── Start fight ────────────────────────────────────────────────────
  const handleStartFight = useCallback(() => {
    playSound("drumroll");
    setGameState((prev) => {
      if (!prev || prev.phase !== "shop") return prev;
      const ghost = generateGhostBuild(prev.round, prev.commander!);
      const arrangeFen = buildFightFen(prev.army, ghost.army);
      return {
        ...prev,
        phase: "arrange",
        ghostOpponent: ghost,
        arrangeFen,
        fightResult: null,
      };
    });
  }, []);

  // ── Arrange pieces ─────────────────────────────────────────────────
  const handleArrangePiece = useCallback(
    (from: string, to: string): boolean => {
      const toRank = parseInt(to[1]);
      if (toRank > 4) return false; // restrict to player's zone
      setGameState((prev) => {
        if (!prev || prev.phase !== "arrange" || !prev.arrangeFen) return prev;
        try {
          const g = new Chess(prev.arrangeFen);
          const piece = g.get(from as Square);
          if (!piece || piece.color !== "w") return prev;
          const occupant = g.get(to as Square);
          g.remove(from as Square);
          if (occupant && occupant.color === "w") {
            g.remove(to as Square);
            g.put(occupant, from as Square);
          } else if (occupant) {
            // Don't displace opponent pieces
            g.put(piece, from as Square);
            return prev;
          }
          g.put(piece, to as Square);
          return { ...prev, arrangeFen: g.fen() };
        } catch {
          return prev;
        }
      });
      return true;
    },
    [],
  );

  // ── Proceed to fight from arrange ──────────────────────────────────
  const handleProceedToFight = useCallback(() => {
    setGameState((prev) => {
      if (!prev || prev.phase !== "arrange") return prev;
      return { ...prev, phase: "fight" };
    });
  }, []);

  // ── Run fight simulation when phase === "fight" ────────────────────
  useEffect(() => {
    if (!gameState || gameState.phase !== "fight" || fight.status !== "idle")
      return;

    const army = gameState.army;
    const ghost = gameState.ghostOpponent;
    if (!ghost) return;

    cancelFightRef.current = false;
    setFight((f) => ({ ...f, status: "simulating" }));

    simulateFight(army, ghost.army, cancelFightRef, gameState.arrangeFen).then(
      ({ startFen, endFen, moves, result }) => {
        if (cancelFightRef.current) return;
        setFight({
          status: "replaying",
          startFen,
          endFen,
          moves,
          replayIndex: 0,
          result,
        });
      },
    );

    return () => {
      cancelFightRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.phase, gameState?.ghostOpponent]);

  // ── Advance replay ─────────────────────────────────────────────────
  useEffect(() => {
    if (fight.status !== "replaying") return;

    if (fight.replayIndex >= fight.moves.length) {
      // Replay done — show result
      replayTimerRef.current = setTimeout(() => {
        setFight((f) => ({ ...f, status: "done" }));
      }, 1200);
      return;
    }

    replayTimerRef.current = setTimeout(() => {
      // Play sound for current move before advancing
      const currentMove = fight.moves[fight.replayIndex];
      if (currentMove) {
        if (currentMove.isChaosMove) {
          const modDef = ALL_MODIFIERS.find(
            (m) => m.name === currentMove.chaosLabel,
          );
          const tier = modDef?.tier ?? "common";
          try {
            playSound(pickSound(tier));
          } catch {}
        } else if (currentMove.isCapture) {
          try {
            playSound("capture");
          } catch {}
        } else {
          try {
            playSound("move");
          } catch {}
        }
      }
      setFight((f) => ({ ...f, replayIndex: f.replayIndex + 1 }));
    }, FIGHT_REPLAY_SPEED_MS);

    return () => {
      if (replayTimerRef.current) clearTimeout(replayTimerRef.current);
    };
  }, [fight.status, fight.replayIndex, fight.moves.length]);

  // ── Apply fight result when replay done ───────────────────────────
  const handleContinueAfterFight = useCallback(() => {
    const result = fight.result;
    if (!result) return;

    // Play win/lose sound
    try {
      playSound(result.won ? "airhorn" : "sad-trombone");
    } catch {}

    setGameState((prev) => {
      if (!prev) return prev;
      const income = calcGoldIncome(
        prev.round,
        result.won ? prev.winStreak + 1 : 0,
        result.won ? 0 : prev.loseStreak + 1,
      );
      const newHp = Math.max(0, prev.hp - result.hpDamageTaken);
      const newRound = prev.round + 1;
      const isGameOver = newHp <= 0 || newRound > MAX_ROUNDS;

      const newResult = {
        round: prev.round,
        won: result.won,
        hpChange: result.won ? 0 : -result.hpDamageTaken,
        ghostName: prev.ghostOpponent?.displayName ?? "Ghost",
      };

      if (isGameOver) {
        return {
          ...prev,
          hp: newHp,
          phase: "game-over",
          roundResults: [...prev.roundResults, newResult],
          fightResult: result,
          winStreak: result.won ? prev.winStreak + 1 : 0,
          loseStreak: result.won ? 0 : prev.loseStreak + 1,
        };
      }

      // Go to encounter phase before next shop
      return {
        ...prev,
        phase: "encounter",
        round: newRound,
        hp: newHp,
        gold: income,
        winStreak: result.won ? prev.winStreak + 1 : 0,
        loseStreak: result.won ? 0 : prev.loseStreak + 1,
        roundResults: [...prev.roundResults, newResult],
        fightResult: result,
        ghostOpponent: null,
        pendingEncounterChoices: generateEncounterChoices(
          newRound,
          prev.commander!,
        ),
      };
    });

    setFight({
      status: "idle",
      startFen: "",
      endFen: "",
      moves: [],
      replayIndex: 0,
      result: null,
    });
  }, [fight.result]);

  // ── Apply encounter choice ─────────────────────────────────────────
  const handleEncounterChoice = useCallback((choice: EncounterChoice) => {
    playSound("select");
    setGameState((prev) => {
      if (!prev || prev.phase !== "encounter") return prev;

      let newState = { ...prev };

      switch (choice.type) {
        case "docks":
          newState.gold = prev.gold + (choice.goldGain ?? 4);
          playSound("bell-double");
          break;

        case "blacksmith":
          newState.maxArmySlots = Math.min(10, prev.maxArmySlots + 1);
          playSound("taco-bell-bong");
          break;

        case "tavern":
          if (choice.freePiece) {
            const freePiece: RecruitedPiece = {
              id: `merc-${Date.now()}`,
              pieceType: choice.freePiece.pieceType,
              modifierId: choice.freePiece.modifierId,
              tier: choice.freePiece.tier,
              slot:
                prev.army.length < prev.maxArmySlots ? prev.army.length : null,
            };
            if (prev.army.length < prev.maxArmySlots) {
              newState.army = [...prev.army, freePiece];
            } else if (prev.bench.length < 2) {
              newState.bench = [...prev.bench, freePiece];
            }
            playSound("bell");
          }
          break;

        case "shrine":
          // Shrine is handled via UI piece-picker — state will be updated
          // by a separate handleShrineApply callback. For now just return.
          // (The EncounterScreen shows a piece picker for shrine choices.)
          break;
      }

      // Transition to shop
      newState.phase = "shop";
      newState.shop = generateShop(prev.round, prev.commander!, prev.shop);
      newState.pendingEncounterChoices = undefined;
      return newState;
    });
  }, []);

  // ── Apply shrine imbue ─────────────────────────────────────────────
  const handleShrineApply = useCallback(
    (targetPieceId: string, modifierId: string) => {
      playSound("reveal-stinger");
      setGameState((prev) => {
        if (!prev || prev.phase !== "encounter") return prev;
        const updatePiece = (p: RecruitedPiece): RecruitedPiece =>
          p.id === targetPieceId ? { ...p, modifierId } : p;
        return {
          ...prev,
          phase: "shop",
          shop: generateShop(prev.round, prev.commander!, prev.shop),
          pendingEncounterChoices: undefined,
          army: prev.army.map(updatePiece),
          bench: prev.bench.map(updatePiece),
        };
      });
    },
    [],
  );

  // ── Derived fight board position ──────────────────────────────────
  // Each FightMove records the FEN *before* it was applied.
  // So after `replayIndex` moves have been shown:
  //   - moves[replayIndex].fen  = FEN before the next (not-yet-shown) move
  //                             = the board state we want to display now
  //   - When replayIndex === moves.length, show endFen (the terminal position)
  const currentFightFen = useMemo(() => {
    if (fight.status === "idle") return null;
    if (fight.status === "simulating") return fight.startFen || null;
    if (fight.moves.length === 0) return fight.endFen || fight.startFen;

    if (fight.replayIndex >= fight.moves.length) {
      return fight.endFen || fight.startFen;
    }
    return fight.moves[fight.replayIndex].fen;
  }, [
    fight.startFen,
    fight.endFen,
    fight.moves,
    fight.replayIndex,
    fight.status,
  ]);

  // ── Last move highlight ───────────────────────────────────────────
  const lastMoveHighlight = useMemo(() => {
    if (fight.replayIndex === 0 || fight.moves.length === 0) return {};
    const last = fight.moves[fight.replayIndex - 1];
    if (!last) return {};
    const highlight = {
      [last.from]: { backgroundColor: "rgba(255, 255, 0, 0.3)" },
      [last.to]: { backgroundColor: "rgba(255, 255, 0, 0.5)" },
    };
    if (last.sideEffectSquares) {
      for (const sq of last.sideEffectSquares) {
        highlight[sq] = { backgroundColor: "rgba(255, 100, 0, 0.5)" };
      }
    }
    return highlight;
  }, [fight.moves, fight.replayIndex]);

  // ── Render ────────────────────────────────────────────────────────
  if (!gameState) {
    return <CommanderSelectScreen onSelect={handleSelectCommander} />;
  }

  if (gameState.phase === "game-over") {
    return (
      <GameOverScreen
        state={gameState}
        onRestart={() => {
          localStorage.removeItem(LS_KEY);
          setGameState(null);
        }}
      />
    );
  }

  if (gameState.phase === "encounter") {
    return (
      <EncounterScreen
        gameState={gameState}
        onChoose={handleEncounterChoice}
        onShrineApply={handleShrineApply}
      />
    );
  }

  if (gameState.phase === "arrange") {
    return (
      <ArrangeScreen
        gameState={gameState}
        onArrangePiece={handleArrangePiece}
        onProceed={handleProceedToFight}
        onBack={() =>
          setGameState((p) =>
            p
              ? {
                  ...p,
                  phase: "shop",
                  ghostOpponent: null,
                  arrangeFen: undefined,
                }
              : p,
          )
        }
      />
    );
  }

  if (gameState.phase === "fight") {
    return (
      <FightScreen
        gameState={gameState}
        fight={fight}
        currentFen={currentFightFen ?? fight.startFen}
        lastMoveHighlight={lastMoveHighlight}
        onContinue={handleContinueAfterFight}
      />
    );
  }

  return (
    <ShopScreen
      gameState={gameState}
      onBuy={handleBuyPiece}
      onSell={handleSellPiece}
      onReroll={handleReroll}
      onFreeze={handleFreezeSlot}
      onLevelUp={handleLevelUp}
      onFight={handleStartFight}
    />
  );
}

/* ================================================================== */
/*  Commander Select Screen                                             */
/* ================================================================== */

function CommanderSelectScreen({
  onSelect,
}: {
  onSelect: (id: CommanderId) => void;
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">⚔️</div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-amber-400 to-yellow-200 bg-clip-text text-transparent">
            Recruit Chess
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Draft your army. Upgrade your pieces. Watch Stockfish unleash chaos.
          </p>
        </div>

        <h2 className="text-xl font-semibold text-gray-300 mb-5 text-center">
          Choose your Commander
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {COMMANDERS.map((cmd) => (
            <button
              key={cmd.id}
              onClick={() => onSelect(cmd.id)}
              className={`
                relative rounded-xl border p-5 text-left cursor-pointer
                bg-gradient-to-br ${cmd.bgGradient} ${cmd.borderClass}
                hover:scale-[1.02] transition-all duration-200
                hover:brightness-110
              `}
              style={{
                boxShadow: `0 0 24px ${cmd.glowColor}`,
              }}
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl">{cmd.icon}</span>
                <div>
                  <div className={`font-bold text-lg ${cmd.accentColor}`}>
                    {cmd.name}
                  </div>
                  <div className="text-sm text-gray-400 italic">
                    {cmd.tagline}
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-300 mb-3 leading-relaxed">
                {cmd.passive}
              </div>

              <div className="flex flex-wrap gap-1">
                {cmd.startingPieces.map((sp, i) => (
                  <PieceChip
                    key={i}
                    pieceType={sp.pieceType}
                    modifierId={sp.modifierId}
                    tier={sp.tier}
                    small
                  />
                ))}
              </div>

              <div className={`mt-3 text-xs font-semibold ${cmd.accentColor}`}>
                {cmd.passiveIcon} Starting Bonus
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Shop Screen                                                         */
/* ================================================================== */

function ShopScreen({
  gameState,
  onBuy,
  onSell,
  onReroll,
  onFreeze,
  onLevelUp,
  onFight,
}: {
  gameState: RecruitGameState;
  onBuy: (slotId: string) => void;
  onSell: (pieceId: string) => void;
  onReroll: () => void;
  onFreeze: (slotId: string) => void;
  onLevelUp: () => void;
  onFight: () => void;
}) {
  const tierInfo = getShopTierLabel(gameState.round);
  const canFight = gameState.army.length > 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 bg-gray-900/60 rounded-xl px-4 py-3 border border-gray-800">
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-gray-500">Round</span>{" "}
              <span className="text-white font-bold text-lg">
                {gameState.round}
              </span>
              <span className="text-gray-500">/{MAX_ROUNDS}</span>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    i < gameState.hp ? "bg-red-500" : "bg-gray-700"
                  }`}
                />
              ))}
              <span className="ml-1 text-sm text-red-400">
                {gameState.hp} HP
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-yellow-400 font-bold">
              💰 {gameState.gold} gold
            </div>
            <div className="text-xs text-gray-500">
              Army {gameState.army.length}/{gameState.maxArmySlots}
            </div>
            {gameState.winStreak >= 2 && (
              <div className="text-xs text-green-400">
                🔥 {gameState.winStreak} win streak
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Shop Panel */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-semibold text-gray-200">Shop</span>
                <span className="ml-2 text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                  Tier {tierInfo.tier} · {tierInfo.label}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onReroll}
                  disabled={gameState.gold < 1}
                  className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-40 border border-gray-700 transition-colors"
                >
                  🔄 Reroll (1g)
                </button>
                <button
                  onClick={onLevelUp}
                  disabled={gameState.gold < 4 || gameState.maxArmySlots >= 10}
                  className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-40 border border-gray-700 transition-colors"
                >
                  ⬆ Level ({gameState.maxArmySlots >= 10 ? "MAX" : "4g"})
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {gameState.shop.map((slot) => (
                <ShopCard
                  key={slot.id}
                  slot={slot}
                  gold={gameState.gold}
                  armyFull={
                    gameState.army.length >= gameState.maxArmySlots &&
                    gameState.bench.length >= 2
                  }
                  onBuy={() => onBuy(slot.id)}
                  onFreeze={() => onFreeze(slot.id)}
                />
              ))}
              {gameState.shop.length === 0 && (
                <div className="text-center text-gray-600 py-6 text-sm">
                  Shop is empty. Reroll or fight!
                </div>
              )}
            </div>

            <div className="mt-4">
              <button
                onClick={onFight}
                disabled={!canFight}
                className="w-full py-3 rounded-xl font-bold text-lg bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 disabled:opacity-40 transition-all hover:scale-[1.01] shadow-lg shadow-red-900/30"
              >
                ⚔️ Prepare Round {gameState.round}
              </button>
            </div>

            {/* Round history */}
            {gameState.roundResults.length > 0 && (
              <div className="mt-4">
                <div className="text-xs text-gray-500 mb-2">Round History</div>
                <div className="flex gap-2 flex-wrap">
                  {gameState.roundResults.map((r) => (
                    <div
                      key={r.round}
                      className={`text-xs px-2 py-1 rounded ${
                        r.won
                          ? "bg-green-900/50 text-green-400 border border-green-800"
                          : "bg-red-900/50 text-red-400 border border-red-800"
                      }`}
                    >
                      R{r.round} {r.won ? "✓" : "✗"}
                      {!r.won && ` ${r.hpChange}`}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Army Panel */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-gray-200">
                Your Army{" "}
                <span className="text-sm text-gray-500">
                  ({gameState.army.length}/{gameState.maxArmySlots})
                </span>
              </span>
              {gameState.commander && (
                <span className="text-xs text-gray-500">
                  {COMMANDERS.find((c) => c.id === gameState.commander)?.icon}{" "}
                  {COMMANDERS.find((c) => c.id === gameState.commander)?.name}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {gameState.army.map((piece) => (
                <PieceCard
                  key={piece.id}
                  piece={piece}
                  onSell={() => onSell(piece.id)}
                />
              ))}
              {Array.from({
                length: Math.max(
                  0,
                  gameState.maxArmySlots - gameState.army.length,
                ),
              }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="rounded-lg border border-dashed border-gray-800 h-[72px] flex items-center justify-center text-gray-700 text-xs"
                >
                  empty slot
                </div>
              ))}
            </div>

            {gameState.bench.length > 0 && (
              <>
                <div className="text-xs text-gray-500 mb-2">
                  Bench ({gameState.bench.length}/2)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {gameState.bench.map((piece) => (
                    <PieceCard
                      key={piece.id}
                      piece={piece}
                      onSell={() => onSell(piece.id)}
                      isBench
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Fight Screen                                                        */
/* ================================================================== */

function FightScreen({
  gameState,
  fight,
  currentFen,
  lastMoveHighlight,
  onContinue,
}: {
  gameState: RecruitGameState;
  fight: FightState;
  currentFen: string;
  lastMoveHighlight: Record<string, React.CSSProperties>;
  onContinue: () => void;
}) {
  const ghost = gameState.ghostOpponent;
  const lastMove =
    fight.replayIndex > 0 ? fight.moves[fight.replayIndex - 1] : null;

  const progressPct =
    fight.moves.length > 0
      ? Math.round((fight.replayIndex / fight.moves.length) * 100)
      : 0;

  // Build custom fairy piece renderers based on both armies
  const customPieces = useMemo(
    () => (ghost ? buildRecruitCustomPieces(gameState.army, ghost.army) : {}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gameState.army, ghost?.army],
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center p-4">
      <div className="max-w-2xl w-full">
        {/* Fight header */}
        <div className="flex items-center justify-between mb-4 bg-gray-900/60 rounded-xl px-4 py-3 border border-gray-800">
          <div className="text-sm">
            <div className="text-white font-bold">You</div>
            <div className="text-red-400 text-xs">{gameState.hp} HP ❤️</div>
          </div>
          <div className="text-gray-400 font-bold">
            ⚔️ Round {gameState.round}
          </div>
          <div className="text-sm text-right">
            <div className="text-gray-300 font-bold">
              {ghost?.displayName ?? "Ghost"}
            </div>
            <div className="text-purple-400 text-xs">
              {ghost?.isAI ? "AI Ghost" : "Player Ghost"}
            </div>
          </div>
        </div>

        {/* Board */}
        <div className="relative rounded-xl overflow-hidden border border-gray-800 mb-4">
          {fight.status === "simulating" && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
              <div className="text-2xl mb-3">⚔️</div>
              <div className="text-white font-bold mb-1">Simulating fight…</div>
              <div className="text-gray-400 text-sm">
                Stockfish is calculating
              </div>
              <div className="mt-3 flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          <ChessboardCompat
            position={currentFen}
            boardWidth={Math.min(
              560,
              typeof window !== "undefined" ? window.innerWidth - 32 : 560,
            )}
            arePiecesDraggable={false}
            customSquareStyles={lastMoveHighlight}
            customDarkSquareStyle={{ backgroundColor: "#2d2937" }}
            customLightSquareStyle={{ backgroundColor: "#403a50" }}
            customPieces={customPieces}
          />
        </div>

        {/* Annotation */}
        {lastMove && (
          <div
            className={`mb-3 px-4 py-2 rounded-lg text-sm text-center ${
              lastMove.isChaosMove
                ? "bg-purple-900/50 border border-purple-700/50 text-purple-300"
                : lastMove.isCapture
                  ? "bg-red-900/40 border border-red-800/40 text-red-300"
                  : "bg-gray-800/60 border border-gray-700/40 text-gray-400"
            }`}
          >
            {lastMove.isChaosMove && (
              <span className="font-bold mr-1">✨ {lastMove.chaosLabel}!</span>
            )}
            {lastMove.annotation ?? (
              <span>
                {lastMove.side === "player"
                  ? "You"
                  : (ghost?.displayName ?? "Ghost")}{" "}
                {lastMove.isCapture ? "captured" : "moved"} {lastMove.from} →{" "}
                {lastMove.to}
              </span>
            )}
          </div>
        )}

        {/* Progress bar */}
        {fight.status === "replaying" && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>
                Move {fight.replayIndex}/{fight.moves.length}
              </span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Result overlay */}
        {fight.status === "done" && fight.result && (
          <FightResultCard
            result={fight.result}
            ghostName={ghost?.displayName ?? "Ghost"}
            onContinue={onContinue}
          />
        )}
      </div>
    </div>
  );
}

function FightResultCard({
  result,
  ghostName,
  onContinue,
}: {
  result: FightResult;
  ghostName: string;
  onContinue: () => void;
}) {
  return (
    <div
      className={`rounded-xl border p-5 text-center ${
        result.won
          ? "bg-green-950/60 border-green-700/40"
          : "bg-red-950/60 border-red-700/40"
      }`}
    >
      <div className="text-4xl mb-2">{result.won ? "🏆" : "💀"}</div>
      <div
        className={`text-2xl font-bold mb-1 ${
          result.won ? "text-green-400" : "text-red-400"
        }`}
      >
        {result.won ? "Victory!" : "Defeat"}
      </div>
      <div className="text-sm text-gray-400 mb-3">
        {result.reason === "checkmate"
          ? result.won
            ? `Checkmate — ${ghostName} king captured`
            : "Your king was captured!"
          : result.reason === "stalemate"
            ? "Stalemate — decided by material"
            : `${result.won ? "Won" : "Lost"} on material`}
      </div>

      {!result.won && (
        <div className="text-red-400 text-sm mb-3">
          -{result.hpDamageTaken} HP
        </div>
      )}

      <div className="flex justify-center gap-6 text-sm text-gray-500 mb-4">
        <div>
          <div className="font-bold text-white">
            {result.playerSurvivingPieces}
          </div>
          <div>your pieces</div>
        </div>
        <div>
          <div className="font-bold text-white">
            {result.opponentSurvivingPieces}
          </div>
          <div>enemy pieces</div>
        </div>
      </div>

      <button
        onClick={onContinue}
        className="w-full py-2.5 rounded-lg font-semibold bg-gray-800 hover:bg-gray-700 transition-colors border border-gray-700"
      >
        Continue →
      </button>
    </div>
  );
}

/* ================================================================== */
/*  Arrange Screen                                                      */
/* ================================================================== */

function ArrangeScreen({
  gameState,
  onArrangePiece,
  onProceed,
  onBack,
}: {
  gameState: RecruitGameState;
  onArrangePiece: (from: string, to: string) => boolean;
  onProceed: () => void;
  onBack: () => void;
}) {
  const ghost = gameState.ghostOpponent;
  const arrangeFen = gameState.arrangeFen ?? "";

  const boardWidth =
    typeof window !== "undefined" ? Math.min(480, window.innerWidth - 32) : 480;
  const squareSize = boardWidth / 8;
  // Show 3 rows (ranks 1-3) to cover main pieces + pawns + overflow
  const visibleRows = 3;
  const clipHeight = squareSize * visibleRows;

  const customPieces = useMemo(
    () => (ghost ? buildRecruitCustomPieces(gameState.army, ghost.army) : {}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gameState.army, ghost?.army],
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-xl w-full">
        <div className="text-center mb-4">
          <div className="text-3xl mb-1">🗡️</div>
          <h2 className="text-xl font-bold mb-0.5">Arrange Your Formation</h2>
          <p className="text-gray-400 text-sm">
            Drag your pieces to the best positions before battle.
          </p>
        </div>

        {/* Board clipped to show only 3 bottom rows (player's zone) */}
        <div
          className="rounded-xl overflow-hidden border border-gray-700 mx-auto"
          style={{
            width: boardWidth,
            height: clipHeight,
            position: "relative",
          }}
        >
          <div style={{ position: "absolute", bottom: 0, left: 0 }}>
            <ChessboardCompat
              position={arrangeFen}
              boardWidth={boardWidth}
              arePiecesDraggable={true}
              isDraggablePiece={({ piece }) => piece[0] === "w"}
              onPieceDrop={(from, to) => {
                const rank = parseInt(to[1]);
                if (rank > visibleRows) return false;
                return onArrangePiece(from, to);
              }}
              customDarkSquareStyle={{ backgroundColor: "#2d2937" }}
              customLightSquareStyle={{ backgroundColor: "#403a50" }}
              customPieces={customPieces}
            />
          </div>
          {/* Label overlay */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs text-gray-500 bg-black/60 px-2 py-0.5 rounded-b-md">
              Your starting zone — drag to rearrange
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-2 justify-center text-xs text-gray-500">
          {gameState.army.map((p) => {
            const modDef = ALL_MODIFIERS.find((m) => m.id === p.modifierId);
            const icon = RECRUIT_MOD_ICONS[p.modifierId] ?? "";
            return (
              <span
                key={p.id}
                className={`px-2 py-0.5 rounded-full border ${UPGRADE_TIER_STYLES[p.tier].border} ${UPGRADE_TIER_STYLES[p.tier].bg}`}
              >
                {PIECE_ICONS[p.pieceType]}
                {icon} {modDef?.name ?? p.modifierId}
              </span>
            );
          })}
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors text-sm"
          >
            ← Back to Shop
          </button>
          <button
            onClick={onProceed}
            className="flex-[2] py-2.5 rounded-xl font-bold bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 transition-all hover:scale-[1.01] shadow-lg shadow-red-900/30"
          >
            ⚔️ Launch Attack
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Game Over Screen                                                    */
/* ================================================================== */

function GameOverScreen({
  state,
  onRestart,
}: {
  state: RecruitGameState;
  onRestart: () => void;
}) {
  const wins = state.roundResults.filter((r) => r.won).length;
  const cmd = state.commander ? getCommander(state.commander) : null;
  const survived = state.round - 1;

  const shareText = `⚔️ Recruit Chess: Survived ${survived} rounds with ${cmd?.name ?? "a commander"}, went ${wins}-${survived - wins}! Play at firechess.co/recruit`;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="text-5xl mb-4">{state.hp <= 0 ? "☠️" : "🏆"}</div>
        <h1 className="text-3xl font-bold mb-1">
          {state.hp <= 0 ? "Your army fell" : "Champion!"}
        </h1>
        <p className="text-gray-400 mb-6">
          {state.hp <= 0
            ? `You survived ${survived} rounds`
            : "You conquered all 8 rounds!"}
        </p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <Stat label="Rounds Won" value={wins} />
          <Stat label="Rounds Played" value={survived} />
          <Stat label="Final HP" value={state.hp} />
        </div>

        {cmd && (
          <div className="mb-4 text-sm text-gray-500">
            Commander: {cmd.icon} {cmd.name}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              navigator.clipboard?.writeText(shareText);
            }}
            className="py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors text-sm"
          >
            📋 Copy Share Text
          </button>
          <button
            onClick={onRestart}
            className="py-3 rounded-xl font-bold bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 transition-all"
          >
            ⚔️ Play Again
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-3">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

/* ================================================================== */
/*  Shared piece UI components                                          */
/* ================================================================== */

function PieceChip({
  pieceType,
  modifierId,
  tier,
  small,
}: {
  pieceType: string;
  modifierId: string;
  tier: UpgradeTier;
  small?: boolean;
}) {
  const styles = UPGRADE_TIER_STYLES[tier];
  const modDef = ALL_MODIFIERS.find((m) => m.id === modifierId);

  return (
    <div
      className={`
        inline-flex items-center gap-1 rounded-md border
        ${styles.bg} ${styles.border}
        ${small ? "px-1.5 py-0.5 text-xs" : "px-2 py-1 text-xs"}
      `}
    >
      <span>{PIECE_ICONS[pieceType] ?? "?"}</span>
      <span className={styles.text}>{modDef?.name ?? modifierId}</span>
      {tier !== "bronze" && <span className="text-[10px]">{styles.icon}</span>}
    </div>
  );
}

function PieceCard({
  piece,
  onSell,
  isBench,
}: {
  piece: RecruitedPiece;
  onSell: () => void;
  isBench?: boolean;
}) {
  const styles = UPGRADE_TIER_STYLES[piece.tier];
  const modDef = ALL_MODIFIERS.find((m) => m.id === piece.modifierId);
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={`
        relative rounded-lg border p-2 cursor-pointer group
        ${styles.bg} ${styles.border}
        ${piece.tier !== "bronze" ? `shadow-md ${styles.glow}` : ""}
        ${isBench ? "opacity-75" : ""}
      `}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-center gap-2">
        <div className="text-2xl">{PIECE_ICONS[piece.pieceType] ?? "?"}</div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-200 truncate">
            {PIECE_LABELS[piece.pieceType]}
          </div>
          <div className={`text-xs truncate ${styles.text}`}>
            {modDef?.name ?? piece.modifierId}
          </div>
        </div>
        {piece.tier !== "bronze" && (
          <div className="ml-auto text-sm">{styles.icon}</div>
        )}
      </div>

      {showActions && (
        <div className="absolute inset-0 rounded-lg bg-black/80 flex items-center justify-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSell();
            }}
            className="text-xs px-2 py-1 bg-red-900/80 hover:bg-red-800 rounded border border-red-700/50 text-red-300"
          >
            Sell +{piece.tier === "gold" ? 3 : piece.tier === "silver" ? 2 : 1}g
          </button>
        </div>
      )}
    </div>
  );
}

function ShopCard({
  slot,
  gold,
  armyFull,
  onBuy,
  onFreeze,
}: {
  slot: ShopSlot;
  gold: number;
  armyFull: boolean;
  onBuy: () => void;
  onFreeze: () => void;
}) {
  const modDef = ALL_MODIFIERS.find((m) => m.id === slot.modifierId);
  const canAfford = gold >= slot.cost;
  const tierColors: Record<string, string> = {
    common: "text-gray-400",
    rare: "text-blue-400",
    epic: "text-purple-400",
    legendary: "text-amber-400",
  };

  return (
    <div
      className={`
        flex items-center gap-3 rounded-lg border p-3
        ${slot.frozen ? "bg-blue-950/40 border-blue-700/40" : "bg-gray-900/50 border-gray-800"}
      `}
    >
      <div className="text-3xl flex-shrink-0">
        {PIECE_ICONS[slot.pieceType] ?? "?"}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-200">
            {PIECE_LABELS[slot.pieceType]}
          </span>
          <span
            className={`text-xs font-medium ${tierColors[slot.modifierTier] ?? "text-gray-400"}`}
          >
            {slot.modifierTier}
          </span>
        </div>
        <div className="text-xs text-gray-400 truncate">
          {modDef?.name ?? slot.modifierId}
        </div>
        {modDef?.description && (
          <div className="text-xs text-gray-600 truncate mt-0.5">
            {modDef.description}
          </div>
        )}
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-yellow-400 font-bold text-sm">💰{slot.cost}</span>
        <div className="flex gap-1">
          <button
            onClick={onFreeze}
            className="text-xs px-2 py-1 rounded bg-blue-900/50 hover:bg-blue-800/60 border border-blue-800/50 text-blue-300 transition-colors"
            title="Freeze / unfreeze slot"
          >
            {slot.frozen ? "🔓" : "❄️"}
          </button>
          <button
            onClick={onBuy}
            disabled={!canAfford || armyFull}
            className="text-xs px-3 py-1 rounded bg-amber-700 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed font-semibold transition-colors"
          >
            Buy
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Encounter Screen                                                    */
/* ================================================================== */

function EncounterScreen({
  gameState,
  onChoose,
  onShrineApply,
}: {
  gameState: RecruitGameState;
  onChoose: (choice: EncounterChoice) => void;
  onShrineApply: (targetPieceId: string, modifierId: string) => void;
}) {
  const choices = gameState.pendingEncounterChoices ?? [];
  const [shrineChoice, setShrineChoice] = useState<EncounterChoice | null>(
    null,
  );
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);

  if (shrineChoice) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">⛩️</div>
            <h2 className="text-2xl font-bold text-purple-300">The Shrine</h2>
            <p className="text-gray-400 text-sm mt-1">
              Choose a piece to imbue with{" "}
              <span className="text-purple-300 font-semibold">
                {ALL_MODIFIERS.find(
                  (m) => m.id === shrineChoice.shrineModifierId,
                )?.name ?? shrineChoice.shrineModifierId}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {gameState.army.map((piece) => {
              const modDef = ALL_MODIFIERS.find(
                (m) => m.id === piece.modifierId,
              );
              const styles = UPGRADE_TIER_STYLES[piece.tier];
              const isSelected = selectedPieceId === piece.id;
              return (
                <button
                  key={piece.id}
                  onClick={() => setSelectedPieceId(piece.id)}
                  className={`
                    rounded-lg border p-2 text-left transition-all
                    ${styles.bg} ${isSelected ? "border-purple-400 ring-2 ring-purple-500/40" : styles.border}
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {PIECE_ICONS[piece.pieceType] ?? "?"}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-gray-200">
                        {PIECE_LABELS[piece.pieceType]}
                      </div>
                      <div className={`text-xs truncate ${styles.text}`}>
                        {modDef?.name ?? piece.modifierId}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShrineChoice(null)}
              className="flex-1 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm transition-colors"
            >
              ← Back
            </button>
            <button
              disabled={!selectedPieceId}
              onClick={() => {
                if (selectedPieceId && shrineChoice.shrineModifierId) {
                  onShrineApply(selectedPieceId, shrineChoice.shrineModifierId);
                }
              }}
              className="flex-1 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 disabled:opacity-40 font-semibold transition-colors"
            >
              Imbue ✨
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🗺️</div>
          <h2 className="text-2xl font-bold mb-1">Before the next battle…</h2>
          <p className="text-gray-400 text-sm">
            Round {gameState.round} — Choose where to go
          </p>
          {gameState.roundResults.length > 0 && (
            <div
              className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                gameState.roundResults.at(-1)?.won
                  ? "bg-green-900/50 text-green-400 border border-green-800"
                  : "bg-red-900/50 text-red-400 border border-red-800"
              }`}
            >
              {gameState.roundResults.at(-1)?.won ? "⚔️ Victory!" : "💀 Defeat"}
            </div>
          )}
        </div>

        <div className="grid gap-4">
          {choices.map((choice) => {
            const colorMap: Record<string, string> = {
              docks:
                "from-blue-950/80 to-cyan-900/40 border-blue-500/30 hover:border-blue-400/60",
              blacksmith:
                "from-stone-950/80 to-gray-900/40 border-stone-500/30 hover:border-stone-400/60",
              tavern:
                "from-amber-950/80 to-yellow-900/40 border-amber-500/30 hover:border-amber-400/60",
              shrine:
                "from-purple-950/80 to-violet-900/40 border-purple-500/30 hover:border-purple-400/60",
            };
            const classes = colorMap[choice.type] ?? colorMap.docks;

            return (
              <button
                key={choice.id}
                onClick={() => {
                  if (choice.type === "shrine") {
                    setShrineChoice(choice);
                  } else {
                    onChoose(choice);
                  }
                }}
                className={`
                  w-full text-left rounded-xl border p-4
                  bg-gradient-to-br ${classes}
                  transition-all hover:scale-[1.01] hover:brightness-110
                `}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{choice.icon}</span>
                  <div>
                    <div className="font-bold text-base text-white mb-0.5">
                      {choice.title}
                    </div>
                    <div className="text-sm text-gray-300 leading-snug">
                      {choice.description}
                    </div>
                    {choice.freePiece && (
                      <div className="mt-2">
                        <PieceChip
                          pieceType={choice.freePiece.pieceType}
                          modifierId={choice.freePiece.modifierId}
                          tier={choice.freePiece.tier}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
