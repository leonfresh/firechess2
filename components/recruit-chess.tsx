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
  type EncounterType,
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
  isBossRound,
} from "@/lib/recruit-chess";

import { playSound } from "@/lib/sounds";

import {
  getChaosMoves,
  executeChaosMove,
  getChaosAttackedSquares,
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

const LS_KEY = "recruit_chess_state_v3";

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
/*  Chaos check detection                                               */
/* ================================================================== */

/**
 * Returns true if the king of `kingColor` is currently attacked by any of
 * the opponent's chaos moves. This supplements chess.js's standard check
 * detection so the simulation respects chaos-range attacks.
 */
function isKingInChaosCheck(
  game: Chess,
  kingColor: Color,
  chaosState: ReturnType<typeof extractChaosStateFromArmy>,
): boolean {
  const attackerColor: Color = kingColor === "w" ? "b" : "w";
  const attackerMods =
    attackerColor === "w" ? chaosState.playerModifiers : chaosState.aiModifiers;
  if (attackerMods.length === 0) return false;

  // Find king square
  let kingSquare: Square | null = null;
  for (const row of game.board()) {
    for (const sq of row) {
      if (sq && sq.type === "k" && sq.color === kingColor) {
        kingSquare = sq.square as Square;
        break;
      }
    }
    if (kingSquare) break;
  }
  if (!kingSquare) return false;

  try {
    const defenderMods =
      kingColor === "w" ? chaosState.playerModifiers : chaosState.aiModifiers;
    const attacked = getChaosAttackedSquares(
      game,
      attackerMods,
      attackerColor,
      undefined,
    );
    void defenderMods;
    return attacked.has(kingSquare);
  } catch {
    return false;
  }
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
  const rawFen = providedStartFen ?? buildFightFen(playerArmy, opponentArmy);
  // Validate the FEN — chess.js throws on invalid FENs; fall back to a safe one.
  let startFen: string;
  try {
    new Chess(rawFen); // validation check only
    startFen = rawFen;
  } catch {
    startFen = buildFightFen(playerArmy, opponentArmy);
  }
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

    // Check: would this standard move leave our king exposed to a chaos attack?
    // If yes, Stockfish "blunders" into chaos-check — pick a random safe legal move.
    let actualFrom = from;
    let actualTo = to;
    let actualPromotion = promotion;
    try {
      const testGame = new Chess(game.fen());
      testGame.move({
        from,
        to,
        promotion: promotion as "q" | "r" | "b" | "n" | undefined,
      });
      if (isKingInChaosCheck(testGame, side, chaosState)) {
        // Try to find a legal move that doesn't leave us in chaos-check
        const legalMoves = game.moves({ verbose: true });
        const safeMoves = legalMoves.filter((m) => {
          try {
            const t = new Chess(game.fen());
            t.move(m.san);
            return !isKingInChaosCheck(t, side, chaosState);
          } catch {
            return false;
          }
        });
        const fallback =
          safeMoves.length > 0
            ? safeMoves[Math.floor(Math.random() * safeMoves.length)]
            : legalMoves[0];
        if (fallback) {
          actualFrom = fallback.from as Square;
          actualTo = fallback.to as Square;
          actualPromotion = fallback.promotion;
        }
      }
    } catch {
      // Safety: leave original move intact
    }

    const prevFen = game.fen();
    const capturedPiece = game.get(actualTo);
    const moveResult = game.move({
      from: actualFrom,
      to: actualTo,
      promotion: actualPromotion as "q" | "r" | "b" | "n" | undefined,
    });

    if (!moveResult) break;

    // Detect chaos check on the opponent king after this move
    const oppColor: Color = side === "w" ? "b" : "w";
    const inChaosCheck = isKingInChaosCheck(game, oppColor, chaosState);

    recorded.push({
      fen: prevFen,
      from: actualFrom,
      to: actualTo,
      isCapture: !!capturedPiece,
      isChaosMove: false,
      side: side === "w" ? "player" : "opponent",
      annotation: inChaosCheck ? "⚡ Chaos Check!" : undefined,
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
      try {
        const ghost = generateGhostBuild(prev.round, prev.commander!);
        const arrangeFen = buildFightFen(prev.army, ghost.army);
        return {
          ...prev,
          phase: "arrange",
          ghostOpponent: ghost,
          arrangeFen,
          fightResult: null,
        };
      } catch (err) {
        console.error("handleStartFight error:", err);
        return prev; // stay in shop on error
      }
    });
  }, []);

  // ── Arrange pieces ─────────────────────────────────────────────────
  const handleArrangePiece = useCallback(
    (from: string, to: string): boolean => {
      const toRank = parseInt(to[1]);
      if (toRank > 4) return false; // restrict to player's 4 rows
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

    simulateFight(army, ghost.army, cancelFightRef, gameState.arrangeFen)
      .then(({ startFen, endFen, moves, result }) => {
        if (cancelFightRef.current) return;
        setFight({
          status: "replaying",
          startFen,
          endFen,
          moves,
          replayIndex: 0,
          result,
        });
      })
      .catch((err) => {
        if (cancelFightRef.current) return;
        // Simulation failed (bad FEN, Stockfish unavailable, etc.)
        // Fall back to a timeout-result so the game can continue.
        console.error("Fight simulation error:", err);
        setFight((f) => ({ ...f, status: "idle" }));
        setGameState((prev) => {
          if (!prev || prev.phase !== "fight") return prev;
          return { ...prev, phase: "shop" };
        });
      });

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
      const isBoss = prev.ghostOpponent?.isBoss ?? false;
      // Boss victory bonus: heal HP + extra gold
      const bossHpBonus =
        isBoss && result.won
          ? prev.round === 8
            ? 0
            : prev.round === 6
              ? 3
              : 2
          : 0;
      const bossGoldBonus =
        isBoss && result.won
          ? prev.round === 8
            ? 0
            : prev.round === 6
              ? 5
              : 3
          : 0;
      // Boss defeat is more punishing: +1 extra HP damage
      const bossDamagePenalty = isBoss && !result.won ? 1 : 0;
      const newHp = Math.min(
        10,
        Math.max(
          0,
          prev.hp - result.hpDamageTaken - bossDamagePenalty + bossHpBonus,
        ),
      );
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
        gold: income + bossGoldBonus,
        winStreak: result.won ? prev.winStreak + 1 : 0,
        loseStreak: result.won ? 0 : prev.loseStreak + 1,
        roundResults: [...prev.roundResults, newResult],
        fightResult: result,
        ghostOpponent: null,
        pendingEncounterChoices: generateEncounterChoices(
          newRound,
          prev.commander!,
          result.playerSurvivingPieces,
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
          // Shrine is handled via UI piece-picker — falls through to a separate sub-screen
          break;

        case "library":
          // Library shows a piece-picker sub-screen — handled by handleLibraryApply
          break;

        case "forge":
          // Forge shows a pair-selector sub-screen — handled by handleForgeApply
          break;

        case "arena":
          newState.gold = prev.gold + (choice.goldGain ?? 0);
          playSound("airhorn");
          break;

        case "treasure-vault":
          // Give gold + free piece
          newState.gold = prev.gold + (choice.goldGain ?? 2);
          if (choice.freePiece) {
            const vaultPiece: RecruitedPiece = {
              id: `vault-${Date.now()}`,
              pieceType: choice.freePiece.pieceType,
              modifierId: choice.freePiece.modifierId,
              tier: choice.freePiece.tier,
              slot:
                prev.army.length < prev.maxArmySlots ? prev.army.length : null,
            };
            if (prev.army.length < prev.maxArmySlots) {
              newState.army = [...prev.army, vaultPiece];
            } else if (prev.bench.length < 2) {
              newState.bench = [...prev.bench, vaultPiece];
            }
          }
          playSound("bell-double");
          break;

        case "cursed-altar":
          newState.hp = Math.max(1, prev.hp - (choice.hpCost ?? 1));
          newState.gold = prev.gold + (choice.boonGold ?? 4);
          if (choice.freePiece) {
            const cursedPiece: RecruitedPiece = {
              id: `cursed-${Date.now()}`,
              pieceType: choice.freePiece.pieceType,
              modifierId: choice.freePiece.modifierId,
              tier: choice.freePiece.tier,
              slot:
                prev.army.length < prev.maxArmySlots ? prev.army.length : null,
            };
            if (prev.army.length < prev.maxArmySlots) {
              newState.army = [...prev.army, cursedPiece];
            } else if (prev.bench.length < 2) {
              newState.bench = [...prev.bench, cursedPiece];
            }
          }
          playSound("emotional-damage");
          break;
      }

      // For shrine, library, forge: don't advance to shop yet — the sub-screens do it
      if (
        choice.type === "shrine" ||
        choice.type === "library" ||
        choice.type === "forge"
      ) {
        return newState;
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

  // ── Apply library upgrade ──────────────────────────────────────────
  const handleLibraryApply = useCallback(
    (targetPieceId: string, goldCost: number) => {
      playSound("taco-bell-bong");
      setGameState((prev) => {
        if (!prev || prev.phase !== "encounter" || prev.gold < goldCost)
          return prev;
        const upgradePiece = (p: RecruitedPiece): RecruitedPiece =>
          p.id === targetPieceId && p.tier === "bronze"
            ? { ...p, tier: "silver" }
            : p;
        return {
          ...prev,
          phase: "shop",
          gold: prev.gold - goldCost,
          shop: generateShop(prev.round, prev.commander!, prev.shop),
          pendingEncounterChoices: undefined,
          army: prev.army.map(upgradePiece),
          bench: prev.bench.map(upgradePiece),
        };
      });
    },
    [],
  );

  // ── Apply forge (fuse 2 bronze → 1 silver) ────────────────────────
  const handleForgeApply = useCallback((pieceId1: string, pieceId2: string) => {
    playSound("bell-double");
    setGameState((prev) => {
      if (!prev || prev.phase !== "encounter") return prev;
      const all = [...prev.army, ...prev.bench];
      const p1 = all.find((p) => p.id === pieceId1);
      const p2 = all.find((p) => p.id === pieceId2);
      if (!p1 || !p2 || p1.pieceType !== p2.pieceType) return prev;
      if (p1.tier !== "bronze" || p2.tier !== "bronze") return prev;

      const forgedPiece: RecruitedPiece = {
        id: `forge-${Date.now()}`,
        pieceType: p1.pieceType,
        modifierId: p1.modifierId,
        tier: "silver",
        slot: null,
      };
      const removeIds = new Set([pieceId1, pieceId2]);
      const newAll = all
        .filter((p) => !removeIds.has(p.id))
        .concat(forgedPiece);
      const newArmy = newAll.slice(
        0,
        Math.min(prev.maxArmySlots, newAll.length),
      );
      const newBench = newAll.slice(newArmy.length).slice(0, 2);

      return {
        ...prev,
        phase: "shop",
        shop: generateShop(prev.round, prev.commander!, prev.shop),
        pendingEncounterChoices: undefined,
        army: newArmy,
        bench: newBench,
      };
    });
  }, []);

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
        onLibraryApply={handleLibraryApply}
        onForgeApply={handleForgeApply}
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
                className={`w-full py-3 rounded-xl font-bold text-lg disabled:opacity-40 transition-all hover:scale-[1.01] shadow-lg ${
                  isBossRound(gameState.round)
                    ? "bg-gradient-to-r from-red-700 to-rose-600 hover:from-red-600 hover:to-rose-500 shadow-red-900/40"
                    : "bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 shadow-red-900/30"
                }`}
              >
                {isBossRound(gameState.round)
                  ? `💀 Boss Fight — Round ${gameState.round}`
                  : `⚔️ Prepare Round ${gameState.round}`}
              </button>
              {isBossRound(gameState.round) && (
                <div className="mt-1.5 text-center text-xs text-red-400 animate-pulse">
                  ⚠️ Boss encounter ahead — prepare carefully!
                </div>
              )}
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
        <div
          className={`flex items-center justify-between mb-4 rounded-xl px-4 py-3 border ${
            ghost?.isBoss
              ? "bg-red-950/70 border-red-600/50"
              : "bg-gray-900/60 border-gray-800"
          }`}
        >
          <div className="text-sm">
            <div className="text-white font-bold">You</div>
            <div className="text-red-400 text-xs">{gameState.hp} HP ❤️</div>
          </div>
          <div className="text-center">
            {ghost?.isBoss && (
              <div className="text-red-400 font-bold text-xs tracking-widest mb-0.5 animate-pulse">
                {ghost.bossTitle}
              </div>
            )}
            <div
              className={`font-bold ${ghost?.isBoss ? "text-red-300" : "text-gray-400"}`}
            >
              ⚔️ Round {gameState.round}
            </div>
          </div>
          <div className="text-sm text-right">
            <div
              className={`font-bold ${ghost?.isBoss ? "text-red-300" : "text-gray-300"}`}
            >
              {ghost?.displayName ?? "Ghost"}
            </div>
            <div
              className={`text-xs ${ghost?.isBoss ? "text-red-400" : "text-purple-400"}`}
            >
              {ghost?.isBoss
                ? "⚠️ BOSS"
                : ghost?.isAI
                  ? "AI Ghost"
                  : "Player Ghost"}
            </div>
          </div>
        </div>

        {/* Boss tagline banner */}
        {ghost?.isBoss && ghost.bossTagline && fight.status !== "done" && (
          <div className="mb-3 px-4 py-2 rounded-lg bg-red-950/60 border border-red-700/50 text-red-300 text-xs text-center italic">
            {ghost.bossTagline}
          </div>
        )}

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
  // Show 4 rows (ranks 1-4) — two full rows of pieces for flexible formation
  const visibleRows = 4;
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
/*  Encounter SVG Icons                                                 */
/* ================================================================== */

function SvgDocks({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* water */}
      <rect x="0" y="26" width="40" height="14" rx="2" fill="#0e3a5c" />
      <path
        d="M0 28 Q5 25 10 28 Q15 31 20 28 Q25 25 30 28 Q35 31 40 28 L40 30 Q35 33 30 30 Q25 27 20 30 Q15 33 10 30 Q5 27 0 30Z"
        fill="#1d6fa4"
        opacity="0.7"
      />
      {/* ship hull */}
      <path
        d="M8 22 L32 22 L29 28 L11 28Z"
        fill="#6b7280"
        stroke="#9ca3af"
        strokeWidth="0.8"
      />
      {/* deck */}
      <rect
        x="10"
        y="18"
        width="20"
        height="4"
        rx="1"
        fill="#4b5563"
        stroke="#6b7280"
        strokeWidth="0.5"
      />
      {/* mast */}
      <line
        x1="20"
        y1="6"
        x2="20"
        y2="18"
        stroke="#9ca3af"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* sail */}
      <path d="M20 7 L30 13 L20 17Z" fill="#e5e7eb" opacity="0.9" />
      {/* dock planks */}
      <rect x="2" y="24" width="5" height="2" rx="0.5" fill="#92400e" />
      <rect x="33" y="24" width="5" height="2" rx="0.5" fill="#92400e" />
      <line
        x1="4.5"
        y1="22"
        x2="4.5"
        y2="26"
        stroke="#78350f"
        strokeWidth="1.2"
      />
      <line
        x1="35.5"
        y1="22"
        x2="35.5"
        y2="26"
        stroke="#78350f"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function SvgBlacksmith({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* anvil base */}
      <path
        d="M8 30 L32 30 L30 36 L10 36Z"
        fill="#374151"
        stroke="#6b7280"
        strokeWidth="0.8"
      />
      {/* anvil body */}
      <path
        d="M6 24 L34 24 L32 30 L8 30Z"
        fill="#4b5563"
        stroke="#6b7280"
        strokeWidth="0.8"
      />
      {/* anvil horn */}
      <path
        d="M6 22 C6 22 2 23 2 26 L8 26 L8 22Z"
        fill="#374151"
        stroke="#6b7280"
        strokeWidth="0.8"
      />
      {/* anvil top */}
      <rect
        x="8"
        y="20"
        width="24"
        height="4"
        rx="1"
        fill="#6b7280"
        stroke="#9ca3af"
        strokeWidth="0.8"
      />
      {/* hammer handle */}
      <line
        x1="28"
        y1="6"
        x2="20"
        y2="20"
        stroke="#92400e"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* hammer head */}
      <rect
        x="24"
        y="3"
        width="10"
        height="6"
        rx="1.5"
        fill="#9ca3af"
        stroke="#d1d5db"
        strokeWidth="0.8"
        transform="rotate(-30 28 6)"
      />
      {/* sparks */}
      <circle cx="22" cy="17" r="1" fill="#fbbf24" opacity="0.9" />
      <circle cx="25" cy="14" r="0.8" fill="#f97316" opacity="0.8" />
      <circle cx="19" cy="15" r="0.6" fill="#fef08a" opacity="0.7" />
      <line
        x1="21"
        y1="16"
        x2="18"
        y2="12"
        stroke="#fbbf24"
        strokeWidth="0.8"
        opacity="0.6"
      />
      <line
        x1="24"
        y1="15"
        x2="27"
        y2="11"
        stroke="#f97316"
        strokeWidth="0.8"
        opacity="0.6"
      />
    </svg>
  );
}

function SvgTavern({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* building */}
      <rect
        x="4"
        y="16"
        width="32"
        height="22"
        rx="1"
        fill="#292524"
        stroke="#57534e"
        strokeWidth="0.8"
      />
      {/* roof */}
      <path
        d="M2 18 L20 6 L38 18Z"
        fill="#7c2d12"
        stroke="#9a3412"
        strokeWidth="0.8"
      />
      {/* door */}
      <path
        d="M16 38 L16 27 Q20 24 24 27 L24 38Z"
        fill="#78350f"
        stroke="#92400e"
        strokeWidth="0.5"
      />
      {/* windows */}
      <rect
        x="6"
        y="20"
        width="7"
        height="7"
        rx="1"
        fill="#fbbf24"
        opacity="0.6"
        stroke="#d97706"
        strokeWidth="0.5"
      />
      <rect
        x="27"
        y="20"
        width="7"
        height="7"
        rx="1"
        fill="#fbbf24"
        opacity="0.6"
        stroke="#d97706"
        strokeWidth="0.5"
      />
      {/* sign */}
      <rect
        x="13"
        y="8"
        width="14"
        height="5"
        rx="1"
        fill="#92400e"
        stroke="#b45309"
        strokeWidth="0.5"
      />
      <line x1="16" y1="8" x2="16" y2="6" stroke="#b45309" strokeWidth="1" />
      <line x1="24" y1="8" x2="24" y2="6" stroke="#b45309" strokeWidth="1" />
      {/* mug */}
      <rect
        x="17.5"
        y="9"
        width="5"
        height="3"
        rx="0.5"
        fill="#fbbf24"
        opacity="0.8"
      />
    </svg>
  );
}

function SvgShrine({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* base platform */}
      <rect
        x="4"
        y="34"
        width="32"
        height="4"
        rx="1"
        fill="#3b0764"
        stroke="#7e22ce"
        strokeWidth="0.5"
      />
      {/* pillars */}
      <rect
        x="8"
        y="16"
        width="4"
        height="18"
        rx="1"
        fill="#4c1d95"
        stroke="#7c3aed"
        strokeWidth="0.5"
      />
      <rect
        x="28"
        y="16"
        width="4"
        height="18"
        rx="1"
        fill="#4c1d95"
        stroke="#7c3aed"
        strokeWidth="0.5"
      />
      {/* roof */}
      <path
        d="M3 18 L20 8 L37 18 L37 20 L3 20Z"
        fill="#6d28d9"
        stroke="#8b5cf6"
        strokeWidth="0.8"
      />
      <path d="M3 18 L20 8 L37 18Z" fill="#7c3aed" />
      {/* orb/crystal */}
      <circle cx="20" cy="27" r="5" fill="#a855f7" opacity="0.3" />
      <circle cx="20" cy="27" r="3.5" fill="#c084fc" opacity="0.6" />
      <circle cx="20" cy="27" r="2" fill="#e9d5ff" opacity="0.9" />
      {/* glow rays */}
      <line
        x1="20"
        y1="20"
        x2="20"
        y2="16"
        stroke="#c084fc"
        strokeWidth="0.8"
        opacity="0.5"
      />
      <line
        x1="25"
        y1="22"
        x2="28"
        y2="19"
        stroke="#c084fc"
        strokeWidth="0.8"
        opacity="0.5"
      />
      <line
        x1="15"
        y1="22"
        x2="12"
        y2="19"
        stroke="#c084fc"
        strokeWidth="0.8"
        opacity="0.5"
      />
      <line
        x1="25.5"
        y1="27"
        x2="29"
        y2="27"
        stroke="#c084fc"
        strokeWidth="0.8"
        opacity="0.4"
      />
      <line
        x1="14.5"
        y1="27"
        x2="11"
        y2="27"
        stroke="#c084fc"
        strokeWidth="0.8"
        opacity="0.4"
      />
    </svg>
  );
}

function SvgLibrary({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* bookshelf back */}
      <rect
        x="3"
        y="6"
        width="34"
        height="30"
        rx="1.5"
        fill="#1c1917"
        stroke="#44403c"
        strokeWidth="0.8"
      />
      {/* shelf dividers */}
      <line x1="3" y1="18" x2="37" y2="18" stroke="#44403c" strokeWidth="1.2" />
      <line x1="3" y1="30" x2="37" y2="30" stroke="#44403c" strokeWidth="1.2" />
      {/* top shelf books */}
      <rect x="5" y="8" width="4" height="9" rx="0.5" fill="#b91c1c" />
      <rect x="10" y="9" width="3" height="8" rx="0.5" fill="#1d4ed8" />
      <rect x="14" y="8" width="5" height="9" rx="0.5" fill="#15803d" />
      <rect x="20" y="9" width="3" height="8" rx="0.5" fill="#b45309" />
      <rect x="24" y="8" width="4" height="9" rx="0.5" fill="#7c3aed" />
      <rect x="29" y="9" width="3" height="8" rx="0.5" fill="#0f766e" />
      <rect x="33" y="8" width="3" height="9" rx="0.5" fill="#9f1239" />
      {/* middle shelf books */}
      <rect x="5" y="20" width="5" height="9" rx="0.5" fill="#0e7490" />
      <rect x="11" y="21" width="3" height="8" rx="0.5" fill="#7e22ce" />
      <rect x="15" y="20" width="4" height="9" rx="0.5" fill="#b45309" />
      <rect x="20" y="21" width="3" height="8" rx="0.5" fill="#166534" />
      <rect x="24" y="20" width="5" height="9" rx="0.5" fill="#9f1239" />
      <rect x="30" y="21" width="3" height="8" rx="0.5" fill="#1e40af" />
      <rect x="34" y="20" width="3" height="9" rx="0.5" fill="#a16207" />
      {/* bottom row (partial) */}
      <rect x="5" y="32" width="6" height="3" rx="0.5" fill="#374151" />
      <rect x="12" y="32" width="4" height="3" rx="0.5" fill="#374151" />
      {/* glowing open book */}
      <ellipse cx="28" cy="33" rx="8" ry="3" fill="#fef9c3" opacity="0.15" />
      <path
        d="M22 33 Q28 30 34 33"
        stroke="#fde68a"
        strokeWidth="1.2"
        fill="none"
        opacity="0.7"
      />
      <path
        d="M22 33 Q28 36 34 33"
        stroke="#fde68a"
        strokeWidth="1.2"
        fill="none"
        opacity="0.7"
      />
      <line
        x1="28"
        y1="30.5"
        x2="28"
        y2="35.5"
        stroke="#fde68a"
        strokeWidth="0.8"
        opacity="0.7"
      />
    </svg>
  );
}

function SvgForge({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* furnace body */}
      <rect
        x="6"
        y="14"
        width="28"
        height="22"
        rx="2"
        fill="#1c1917"
        stroke="#57534e"
        strokeWidth="0.8"
      />
      {/* furnace mouth */}
      <path d="M12 36 L12 24 Q20 20 28 24 L28 36Z" fill="#7c2d12" />
      <ellipse cx="20" cy="24" rx="8" ry="3" fill="#dc2626" opacity="0.6" />
      {/* fire */}
      <path
        d="M18 30 Q20 22 22 28 Q24 20 26 26 Q24 30 20 32 Q16 30 18 30Z"
        fill="#f97316"
        opacity="0.85"
      />
      <path
        d="M19 30 Q20 24 21 29 Q22 25 23 28 Q22 31 20 32 Q18 31 19 30Z"
        fill="#fde68a"
        opacity="0.9"
      />
      {/* chimney */}
      <rect
        x="15"
        y="6"
        width="10"
        height="8"
        rx="1"
        fill="#292524"
        stroke="#44403c"
        strokeWidth="0.7"
      />
      {/* smoke puffs */}
      <circle cx="20" cy="4" r="3" fill="#44403c" opacity="0.5" />
      <circle cx="23" cy="2" r="2" fill="#57534e" opacity="0.4" />
      <circle cx="17" cy="2.5" r="2.5" fill="#3b3229" opacity="0.45" />
      {/* tongs */}
      <line
        x1="5"
        y1="12"
        x2="14"
        y2="22"
        stroke="#9ca3af"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="7"
        y1="10"
        x2="16"
        y2="20"
        stroke="#9ca3af"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="13" cy="21" r="2" fill="#f97316" opacity="0.8" />
    </svg>
  );
}

function SvgArena({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* arena floor */}
      <ellipse
        cx="20"
        cy="30"
        rx="17"
        ry="6"
        fill="#1c1917"
        stroke="#57534e"
        strokeWidth="0.8"
      />
      {/* sand */}
      <ellipse cx="20" cy="29" rx="14" ry="5" fill="#92400e" opacity="0.5" />
      {/* walls */}
      <path
        d="M3 30 Q3 14 20 14 Q37 14 37 30"
        fill="none"
        stroke="#57534e"
        strokeWidth="1.5"
      />
      {/* arch segments */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = -Math.PI + (i / 5) * Math.PI;
        const x = 20 + 17 * Math.cos(angle);
        const y = 30 + 16 * Math.sin(angle);
        return (
          <line
            key={i}
            x1={x}
            y1={y}
            x2={x}
            y2={y - 3}
            stroke="#6b7280"
            strokeWidth="1"
          />
        );
      })}
      {/* crossed swords */}
      <line
        x1="14"
        y1="22"
        x2="26"
        y2="34"
        stroke="#d1d5db"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="26"
        y1="22"
        x2="14"
        y2="34"
        stroke="#d1d5db"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* sword guards */}
      <line
        x1="16"
        y1="20"
        x2="13"
        y2="23"
        stroke="#9ca3af"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="24"
        y1="20"
        x2="27"
        y2="23"
        stroke="#9ca3af"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SvgTreasureVault({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* chest body */}
      <rect
        x="4"
        y="20"
        width="32"
        height="18"
        rx="2"
        fill="#92400e"
        stroke="#b45309"
        strokeWidth="0.8"
      />
      {/* chest lid */}
      <path
        d="M4 20 Q4 12 20 12 Q36 12 36 20Z"
        fill="#a16207"
        stroke="#ca8a04"
        strokeWidth="0.8"
      />
      {/* metal band */}
      <rect
        x="16"
        y="17"
        width="8"
        height="4"
        rx="1"
        fill="#ca8a04"
        stroke="#fbbf24"
        strokeWidth="0.5"
      />
      {/* lock */}
      <rect
        x="17.5"
        y="26"
        width="5"
        height="4"
        rx="0.5"
        fill="#78716c"
        stroke="#a8a29e"
        strokeWidth="0.5"
      />
      <path
        d="M18.5 26 Q18.5 23 20 23 Q21.5 23 21.5 26"
        fill="none"
        stroke="#a8a29e"
        strokeWidth="1"
      />
      {/* coins spilling */}
      <ellipse cx="8" cy="22" rx="2.5" ry="1.2" fill="#fbbf24" />
      <ellipse cx="32" cy="22" rx="2.5" ry="1.2" fill="#fbbf24" />
      <ellipse cx="5" cy="24" rx="2" ry="1" fill="#f59e0b" opacity="0.8" />
      <ellipse cx="35" cy="24" rx="2" ry="1" fill="#f59e0b" opacity="0.8" />
      {/* gems on chest */}
      <polygon points="12,30 14,27 16,30 14,33" fill="#3b82f6" opacity="0.9" />
      <polygon points="24,30 26,27 28,30 26,33" fill="#ef4444" opacity="0.9" />
      {/* shimmer */}
      <line
        x1="20"
        y1="36"
        x2="20"
        y2="38"
        stroke="#fbbf24"
        strokeWidth="0.8"
        opacity="0.4"
      />
    </svg>
  );
}

function SvgCursedAltar({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* stone base */}
      <rect
        x="5"
        y="30"
        width="30"
        height="8"
        rx="1.5"
        fill="#1c1917"
        stroke="#44403c"
        strokeWidth="0.8"
      />
      {/* altar top slab */}
      <rect
        x="3"
        y="24"
        width="34"
        height="6"
        rx="1"
        fill="#292524"
        stroke="#57534e"
        strokeWidth="0.8"
      />
      {/* runes on altar */}
      <text
        x="9"
        y="30"
        fontSize="5"
        fill="#7f1d1d"
        opacity="0.9"
        fontFamily="serif"
      >
        ᚱ ᚷ ᚾ
      </text>
      {/* skull */}
      <circle
        cx="20"
        cy="18"
        r="5"
        fill="#374151"
        stroke="#6b7280"
        strokeWidth="0.7"
      />
      {/* eye sockets */}
      <ellipse cx="18" cy="17" rx="1.5" ry="2" fill="#111827" />
      <ellipse cx="22" cy="17" rx="1.5" ry="2" fill="#111827" />
      {/* glowing eyes */}
      <ellipse cx="18" cy="17" rx="0.8" ry="1.2" fill="#dc2626" opacity="0.8" />
      <ellipse cx="22" cy="17" rx="0.8" ry="1.2" fill="#dc2626" opacity="0.8" />
      {/* nose cavity */}
      <path d="M19.5 19 L20 20.5 L20.5 19Z" fill="#111827" />
      {/* teeth */}
      <line
        x1="17"
        y1="22"
        x2="17"
        y2="24"
        stroke="#6b7280"
        strokeWidth="1.2"
      />
      <line
        x1="19"
        y1="22"
        x2="19"
        y2="24"
        stroke="#6b7280"
        strokeWidth="1.2"
      />
      <line
        x1="21"
        y1="22"
        x2="21"
        y2="24"
        stroke="#6b7280"
        strokeWidth="1.2"
      />
      <line
        x1="23"
        y1="22"
        x2="23"
        y2="24"
        stroke="#6b7280"
        strokeWidth="1.2"
      />
      {/* smoke/curse aura */}
      <path
        d="M14 16 Q12 10 15 7 Q13 11 16 12 Q14 8 18 6 Q16 10 19 11 Q17 7 21 5 Q19 9 22 10 Q20 7 24 8 Q21 12 26 16"
        fill="none"
        stroke="#7f1d1d"
        strokeWidth="0.8"
        opacity="0.6"
      />
    </svg>
  );
}

const ENCOUNTER_SVG: Record<string, React.ReactNode> = {
  docks: <SvgDocks />,
  blacksmith: <SvgBlacksmith />,
  tavern: <SvgTavern />,
  shrine: <SvgShrine />,
  library: <SvgLibrary />,
  forge: <SvgForge />,
  arena: <SvgArena />,
  "treasure-vault": <SvgTreasureVault />,
  "cursed-altar": <SvgCursedAltar />,
};

/* ================================================================== */
/*  Encounter Screen                                                    */
/* ================================================================== */

function EncounterScreen({
  gameState,
  onChoose,
  onShrineApply,
  onLibraryApply,
  onForgeApply,
}: {
  gameState: RecruitGameState;
  onChoose: (choice: EncounterChoice) => void;
  onShrineApply: (targetPieceId: string, modifierId: string) => void;
  onLibraryApply: (targetPieceId: string, goldCost: number) => void;
  onForgeApply: (pieceId1: string, pieceId2: string) => void;
}) {
  const choices = gameState.pendingEncounterChoices ?? [];
  const [shrineChoice, setShrineChoice] = useState<EncounterChoice | null>(
    null,
  );
  const [libraryChoice, setLibraryChoice] = useState<EncounterChoice | null>(
    null,
  );
  const [forgeChoice, setForgeChoice] = useState<EncounterChoice | null>(null);
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [forgePieceIds, setForgePieceIds] = useState<string[]>([]);

  if (shrineChoice) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-2">
              {ENCOUNTER_SVG.shrine}
            </div>
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
                  className={`rounded-lg border p-2 text-left transition-all ${styles.bg} ${isSelected ? "border-purple-400 ring-2 ring-purple-500/40" : styles.border}`}
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
              onClick={() => {
                setShrineChoice(null);
                setSelectedPieceId(null);
              }}
              className="flex-1 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm transition-colors"
            >
              ← Back
            </button>
            <button
              disabled={!selectedPieceId}
              onClick={() => {
                if (selectedPieceId && shrineChoice.shrineModifierId)
                  onShrineApply(selectedPieceId, shrineChoice.shrineModifierId);
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

  if (libraryChoice) {
    const goldCost = libraryChoice.upgradeGoldCost ?? 3;
    const canAfford = gameState.gold >= goldCost;
    const upgradablePieces = gameState.army.filter((p) => p.tier === "bronze");
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-2">
              {ENCOUNTER_SVG.library}
            </div>
            <h2 className="text-2xl font-bold text-yellow-300">The Library</h2>
            <p className="text-gray-400 text-sm mt-1">
              Pay <span className="text-yellow-400 font-bold">{goldCost}g</span>{" "}
              to promote a Bronze piece to{" "}
              <span className="text-slate-300 font-semibold">Silver</span>. You
              have {gameState.gold}g.
            </p>
          </div>
          {upgradablePieces.length === 0 ? (
            <p className="text-center text-gray-500 text-sm mb-4">
              No Bronze pieces to upgrade.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {upgradablePieces.map((piece) => {
                const modDef = ALL_MODIFIERS.find(
                  (m) => m.id === piece.modifierId,
                );
                const styles = UPGRADE_TIER_STYLES[piece.tier];
                const isSelected = selectedPieceId === piece.id;
                return (
                  <button
                    key={piece.id}
                    onClick={() => setSelectedPieceId(piece.id)}
                    className={`rounded-lg border p-2 text-left transition-all ${styles.bg} ${isSelected ? "border-yellow-400 ring-2 ring-yellow-500/40" : styles.border}`}
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
          )}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setLibraryChoice(null);
                setSelectedPieceId(null);
              }}
              className="flex-1 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm transition-colors"
            >
              ← Back
            </button>
            <button
              disabled={
                !selectedPieceId || !canAfford || upgradablePieces.length === 0
              }
              onClick={() => {
                if (selectedPieceId) onLibraryApply(selectedPieceId, goldCost);
              }}
              className="flex-1 py-2 rounded-lg bg-yellow-700 hover:bg-yellow-600 disabled:opacity-40 font-semibold transition-colors"
            >
              Study ({goldCost}g) 📜
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (forgeChoice) {
    const bronzePieces = gameState.army
      .concat(gameState.bench)
      .filter((p) => p.tier === "bronze");
    const hasEnough = bronzePieces.length >= 2;
    const canFuse =
      forgePieceIds.length === 2 &&
      (() => {
        const [a, b] = forgePieceIds.map((id) =>
          bronzePieces.find((p) => p.id === id),
        );
        return a && b && a.pieceType === b.pieceType;
      })();
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-2">
              {ENCOUNTER_SVG.forge}
            </div>
            <h2 className="text-2xl font-bold text-orange-300">The Forge</h2>
            <p className="text-gray-400 text-sm mt-1">
              Select two identical Bronze pieces to fuse into one Silver.
            </p>
            {forgePieceIds.length > 0 && (
              <p className="text-orange-400 text-xs mt-1">
                {forgePieceIds.length}/2 selected
              </p>
            )}
          </div>
          {!hasEnough ? (
            <p className="text-center text-gray-500 text-sm mb-4">
              Need at least 2 Bronze pieces.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {bronzePieces.map((piece) => {
                const modDef = ALL_MODIFIERS.find(
                  (m) => m.id === piece.modifierId,
                );
                const styles = UPGRADE_TIER_STYLES[piece.tier];
                const isSelected = forgePieceIds.includes(piece.id);
                return (
                  <button
                    key={piece.id}
                    onClick={() => {
                      setForgePieceIds((prev) =>
                        prev.includes(piece.id)
                          ? prev.filter((id) => id !== piece.id)
                          : prev.length < 2
                            ? [...prev, piece.id]
                            : prev,
                      );
                    }}
                    className={`rounded-lg border p-2 text-left transition-all ${styles.bg} ${isSelected ? "border-orange-400 ring-2 ring-orange-500/40" : styles.border}`}
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
          )}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setForgeChoice(null);
                setForgePieceIds([]);
              }}
              className="flex-1 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm transition-colors"
            >
              ← Back
            </button>
            <button
              disabled={!canFuse}
              onClick={() => {
                if (forgePieceIds.length === 2)
                  onForgeApply(forgePieceIds[0], forgePieceIds[1]);
              }}
              className="flex-1 py-2 rounded-lg bg-orange-700 hover:bg-orange-600 disabled:opacity-40 font-semibold transition-colors"
            >
              Smelt 🔥
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
              library:
                "from-yellow-950/80 to-amber-900/40 border-yellow-500/30 hover:border-yellow-400/60",
              forge:
                "from-orange-950/80 to-red-900/40 border-orange-500/30 hover:border-orange-400/60",
              arena:
                "from-green-950/80 to-emerald-900/40 border-green-500/30 hover:border-green-400/60",
              "treasure-vault":
                "from-indigo-950/80 to-blue-900/40 border-indigo-500/30 hover:border-indigo-400/60",
              "cursed-altar":
                "from-red-950/80 to-rose-900/40 border-red-600/40 hover:border-red-500/60",
            };
            const classes = colorMap[choice.type] ?? colorMap.docks;

            const handleChoiceClick = () => {
              if (choice.type === "shrine") {
                setShrineChoice(choice);
              } else if (choice.type === "library") {
                setLibraryChoice(choice);
              } else if (choice.type === "forge") {
                setForgeChoice(choice);
              } else {
                onChoose(choice);
              }
            };

            return (
              <button
                key={choice.id}
                onClick={handleChoiceClick}
                className={`w-full text-left rounded-xl border p-4 bg-gradient-to-br ${classes} transition-all hover:scale-[1.01] hover:brightness-110`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl flex-shrink-0">
                    {ENCOUNTER_SVG[choice.type] ?? choice.icon}
                  </span>
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
                    {choice.type === "cursed-altar" && (
                      <div className="mt-1 text-xs text-red-400">
                        ⚠️ Sacrifice {choice.hpCost} HP
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
