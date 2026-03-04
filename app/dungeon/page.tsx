"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import type { Square as CbSquare } from "react-chessboard/dist/chessboard/types";
import { useBoardSize } from "@/lib/use-board-size";
import { useBoardTheme, useCustomPieces, useShowCoordinates } from "@/lib/use-coins";
import { playSound, preloadSounds } from "@/lib/sounds";
import {
  createRun,
  getDailySeed,
  rollPerks,
  calculateDamage,
  calculateHeal,
  calculateCoins,
  getStreakMultiplier,
  ALL_PERKS,
  ALL_EVENTS,
  NODE_INFO,
  RARITY_COLORS,
  type DungeonRun,
  type MapNode,
  type Perk,
  type MysteryEvent,
  type Difficulty,
  type NodeType,
} from "@/lib/dungeon";

/* ================================================================== */
/*  Lichess puzzle types                                                */
/* ================================================================== */

type LichessPuzzle = {
  game: { id: string; pgn: string; players: any[] };
  puzzle: {
    id: string;
    rating: number;
    plays: number;
    solution: string[];
    themes: string[];
    initialPly: number;
  };
  matchedTheme: string;
  difficulty: string;
};

function parsePgnMoves(pgn: string): string[] {
  return pgn
    .replace(/\{[^}]*\}/g, "")
    .replace(/\d+\.\s*/g, "")
    .replace(/1-0|0-1|1\/2-1\/2|\*/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function setupPuzzlePosition(pgn: string, initialPly: number) {
  const chess = new Chess();
  const moves = parsePgnMoves(pgn);
  for (let i = 0; i < Math.min(initialPly, moves.length); i++) {
    try { chess.move(moves[i]); } catch { break; }
  }
  const preTriggerFen = chess.fen();
  let triggerFrom = "";
  let triggerTo = "";
  let postTriggerFen = preTriggerFen;
  if (initialPly < moves.length) {
    try {
      const result = chess.move(moves[initialPly]);
      if (result) {
        triggerFrom = result.from;
        triggerTo = result.to;
        postTriggerFen = chess.fen();
      }
    } catch {}
  }
  const solverColor: "white" | "black" = new Chess(postTriggerFen).turn() === "w" ? "white" : "black";
  return { preTriggerFen, postTriggerFen, triggerFrom, triggerTo, solverColor };
}

/* ================================================================== */
/*  HP Bar Component                                                    */
/* ================================================================== */

function HpBar({ hp, maxHp }: { hp: number; maxHp: number }) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const color = pct > 60 ? "bg-emerald-500" : pct > 30 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-red-400">❤️ {hp}/{maxHp}</span>
      <div className="h-2.5 flex-1 rounded-full bg-white/[0.06] overflow-hidden min-w-[80px]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Perk Badge                                                          */
/* ================================================================== */

function PerkBadge({ perk, small }: { perk: Perk; small?: boolean }) {
  return (
    <div
      className={`rounded-lg border px-2 py-1 ${RARITY_COLORS[perk.rarity]} ${small ? "text-[10px]" : "text-xs"}`}
      title={perk.description}
    >
      <span className="mr-1">{perk.icon}</span>
      {perk.name}
      {perk.consumed && <span className="ml-1 opacity-50">(used)</span>}
    </div>
  );
}

/* ================================================================== */
/*  Dungeon Map Visualization                                           */
/* ================================================================== */

function DungeonMap({
  nodes,
  currentNodeId,
  currentFloor,
  perks,
  onSelectNode,
}: {
  nodes: MapNode[];
  currentNodeId: string;
  currentFloor: number;
  perks: Perk[];
  onSelectNode: (node: MapNode) => void;
}) {
  const hasScoutsMap = perks.some(p => p.id === "scouts-map");
  const visibleFloors = hasScoutsMap ? currentFloor + 3 : currentFloor + 2;

  // Group nodes by floor
  const floors = useMemo(() => {
    const byFloor = new Map<number, MapNode[]>();
    for (const n of nodes) {
      const arr = byFloor.get(n.floor) ?? [];
      arr.push(n);
      byFloor.set(n.floor, arr);
    }
    return byFloor;
  }, [nodes]);

  // Which nodes can the player move to?
  const currentNode = nodes.find(n => n.id === currentNodeId);
  const reachableIds = new Set(currentNode?.connections ?? []);

  // Display range: show a window of floors around current floor
  const startFloor = Math.max(0, currentFloor - 1);
  const endFloor = Math.min(Math.max(...Array.from(floors.keys())), visibleFloors);

  const displayFloors: number[] = [];
  for (let f = endFloor; f >= startFloor; f--) {
    displayFloors.push(f);
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
        Dungeon Map — Floor {currentFloor}
      </p>
      <div className="space-y-2">
        {displayFloors.map(floor => {
          const floorNodes = floors.get(floor) ?? [];
          return (
            <div key={floor} className="flex items-center justify-center gap-3">
              <span className="w-6 text-right text-[10px] font-mono text-slate-600">{floor}</span>
              <div className="flex gap-2">
                {[0, 1, 2].map(col => {
                  const node = floorNodes.find(n => n.col === col);
                  if (!node) {
                    // Boss floors only have col=1
                    if (floorNodes.length === 1 && floorNodes[0].col === 1 && col !== 1) return <div key={col} className="w-12 h-10" />;
                    return <div key={col} className="w-12 h-10" />;
                  }

                  const isCurrent = node.id === currentNodeId;
                  const isReachable = reachableIds.has(node.id);
                  const info = NODE_INFO[node.type];
                  const isHidden = floor > visibleFloors && !node.visited;

                  return (
                    <button
                      key={col}
                      type="button"
                      disabled={!isReachable}
                      onClick={() => isReachable && onSelectNode(node)}
                      className={`flex h-10 w-12 flex-col items-center justify-center rounded-lg border text-xs transition-all ${
                        isCurrent
                          ? "border-emerald-500/50 bg-emerald-500/20 ring-1 ring-emerald-500/30 scale-110"
                          : isReachable
                            ? "border-white/20 bg-white/[0.06] hover:bg-white/[0.12] hover:border-white/30 cursor-pointer"
                            : node.visited
                              ? "border-white/[0.04] bg-white/[0.01] opacity-40"
                              : isHidden
                                ? "border-white/[0.04] bg-white/[0.01] opacity-20"
                                : "border-white/[0.06] bg-white/[0.02] opacity-50"
                      }`}
                      title={`${info.label}${node.difficulty ? ` (${node.difficulty})` : ""}`}
                    >
                      <span className="text-sm leading-none">{isHidden ? "?" : info.icon}</span>
                      {!isHidden && (
                        <span className={`text-[8px] font-bold ${info.color}`}>
                          {node.type === "boss" ? "BOSS" : info.label.slice(0, 4).toUpperCase()}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Puzzle Battle Board                                                 */
/* ================================================================== */

function BattleBoard({
  puzzle,
  run,
  onSolved,
  onFailed,
}: {
  puzzle: LichessPuzzle;
  run: DungeonRun;
  onSolved: () => void;
  onFailed: () => void;
}) {
  const { ref: boardRef, size: boardSize } = useBoardSize(480, { evalBar: false });
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();
  const showCoords = useShowCoordinates();

  const hasSecondWind = run.perks.some(p => p.id === "second-wind" && !p.consumed);
  const hasGlassCannon = run.perks.some(p => p.id === "glass-cannon");
  const hasCursedMirror = run.perks.some(p => p.id === "cursed-mirror");
  const maxAttempts = hasSecondWind ? 2 : 1;

  const setup = useMemo(
    () => setupPuzzlePosition(puzzle.game.pgn, puzzle.puzzle.initialPly),
    [puzzle]
  );

  const [fen, setFen] = useState(setup.preTriggerFen);
  const [solutionIdx, setSolutionIdx] = useState(0);
  const [state, setState] = useState<"setup" | "solving" | "correct" | "wrong">("setup");
  const [attempts, setAttempts] = useState(0);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [wrongMove, setWrongMove] = useState<{ from: string; to: string } | null>(null);
  const [hintSquare, setHintSquare] = useState<string | null>(null);
  const [showPromoDialog, setShowPromoDialog] = useState(false);
  const [promoFrom, setPromoFrom] = useState<string | null>(null);
  const [promoTo, setPromoTo] = useState<string | null>(null);
  const puzzleSetupRef = useRef<typeof setup | null>(null);

  const orientation: "white" | "black" = useMemo(() => {
    const base = setup.solverColor;
    if (hasCursedMirror) return base === "white" ? "black" : "white";
    return base;
  }, [setup.solverColor, hasCursedMirror]);

  const sideToMove = useMemo(() => {
    try { return new Chess(fen).turn(); } catch { return "w"; }
  }, [fen]);

  const isDraggablePiece = useCallback(
    ({ piece }: { piece: string }) => {
      if (state !== "solving") return false;
      return piece.startsWith(sideToMove === "w" ? "w" : "b");
    },
    [state, sideToMove]
  );

  // Setup trigger move
  useEffect(() => {
    preloadSounds();
    puzzleSetupRef.current = setup;
    setFen(setup.preTriggerFen);
    setSolutionIdx(0);
    setState("setup");
    setAttempts(0);
    setLastMove(null);
    setWrongMove(null);
    setHintSquare(null);
  }, [setup]);

  useEffect(() => {
    if (state !== "setup" || !puzzleSetupRef.current) return;
    const s = puzzleSetupRef.current;
    const timer = setTimeout(() => {
      setFen(s.postTriggerFen);
      if (s.triggerFrom && s.triggerTo) {
        setLastMove({ from: s.triggerFrom, to: s.triggerTo });
      }
      setState("solving");
      playSound("move");
    }, 600);
    return () => clearTimeout(timer);
  }, [state]);

  // Glass cannon hint
  useEffect(() => {
    if (hasGlassCannon && state === "solving" && solutionIdx < puzzle.puzzle.solution.length) {
      const move = puzzle.puzzle.solution[solutionIdx];
      setHintSquare(move.slice(0, 2));
    } else {
      setHintSquare(null);
    }
  }, [hasGlassCannon, state, solutionIdx, puzzle.puzzle.solution]);

  const attemptMove = useCallback(
    (from: string, to: string, promotion?: string) => {
      if (state !== "solving") return false;
      const expected = puzzle.puzzle.solution[solutionIdx];
      if (!expected) return false;

      const expectedBase = expected.slice(0, 4);
      const expectedPromo = expected.slice(4, 5);

      if (from + to === expectedBase && expectedPromo && !promotion) {
        if (expectedPromo === "q") promotion = "q";
      }

      const matches = from + to === expectedBase && (!expectedPromo || promotion === expectedPromo);

      if (!matches) {
        playSound("wrong");
        setWrongMove({ from, to });
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        setTimeout(() => setWrongMove(null), 800);

        if (newAttempts >= maxAttempts) {
          setState("wrong");
          // Show correct move
          const correct = puzzle.puzzle.solution[solutionIdx];
          if (correct) {
            setTimeout(() => {
              const g = new Chess(fen);
              try {
                g.move({ from: correct.slice(0, 2), to: correct.slice(2, 4), promotion: correct.slice(4, 5) || undefined } as any);
                setFen(g.fen());
              } catch {}
            }, 600);
          }
          setTimeout(() => onFailed(), 2000);
        }
        return false;
      }

      // Correct move
      try {
        const chess = new Chess(fen);
        chess.move({ from: expected.slice(0, 2), to: expected.slice(2, 4), promotion: expectedPromo || undefined } as any);
        const newFen = chess.fen();
        setFen(newFen);
        setLastMove({ from: expected.slice(0, 2), to: expected.slice(2, 4) });
        setHintSquare(null);
        playSound("move");

        const nextIdx = solutionIdx + 1;
        if (nextIdx >= puzzle.puzzle.solution.length) {
          setState("correct");
          playSound("correct");
          setTimeout(() => onSolved(), 1000);
          return true;
        }

        setSolutionIdx(nextIdx);
        // Play opponent's response
        setTimeout(() => {
          const oppMove = puzzle.puzzle.solution[nextIdx];
          if (oppMove) {
            try {
              const c2 = new Chess(newFen);
              c2.move({ from: oppMove.slice(0, 2), to: oppMove.slice(2, 4), promotion: oppMove.slice(4, 5) || undefined } as any);
              setFen(c2.fen());
              setLastMove({ from: oppMove.slice(0, 2), to: oppMove.slice(2, 4) });
              setSolutionIdx(nextIdx + 1);
              playSound("move");
            } catch {}
          }
        }, 400);

        setAttempts(0);
        return true;
      } catch {
        return false;
      }
    },
    [state, solutionIdx, fen, puzzle, attempts, maxAttempts, onSolved, onFailed]
  );

  const onDrop = useCallback(
    (from: string, to: string, _piece: string) => {
      if (state !== "solving") return false;
      const chess = new Chess(fen);
      const piece = chess.get(from as Parameters<Chess["get"]>[0]);
      if (piece?.type === "p") {
        const rank = parseInt(to[1]);
        const isPromo = (piece.color === "w" && rank === 8) || (piece.color === "b" && rank === 1);
        if (isPromo) {
          setPromoFrom(from);
          setPromoTo(to);
          setShowPromoDialog(true);
          return false;
        }
      }
      attemptMove(from, to);
      return false;
    },
    [state, fen, attemptMove]
  );

  const onPromotionPieceSelect = useCallback(
    (piece?: string): boolean => {
      setShowPromoDialog(false);
      if (piece && promoFrom && promoTo) {
        const promo = piece[1]?.toLowerCase() ?? "q";
        attemptMove(promoFrom, promoTo, promo);
      }
      setPromoFrom(null);
      setPromoTo(null);
      return true;
    },
    [promoFrom, promoTo, attemptMove]
  );

  // Square styles
  const customSquareStyles: Record<string, React.CSSProperties> = {};
  if (lastMove && state === "solving") {
    customSquareStyles[lastMove.from] = { backgroundColor: "rgba(255, 170, 0, 0.20)" };
    customSquareStyles[lastMove.to] = { backgroundColor: "rgba(255, 170, 0, 0.30)" };
  }
  if (wrongMove) {
    customSquareStyles[wrongMove.to] = { backgroundColor: "rgba(239, 68, 68, 0.4)" };
  }
  if (hintSquare) {
    customSquareStyles[hintSquare] = { backgroundColor: "rgba(34, 197, 94, 0.3)" };
  }

  const statusLabel = state === "setup" ? "Watch the opponent's move…"
    : state === "solving" ? `Find the best move${attempts > 0 ? ` (attempt ${attempts + 1}/${maxAttempts})` : ""}`
    : state === "correct" ? "✅ Correct!"
    : "❌ Incorrect";

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Status */}
      <div className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
        state === "correct" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          : state === "wrong" ? "border-red-500/30 bg-red-500/10 text-red-400"
          : "border-white/[0.08] bg-white/[0.03] text-slate-400"
      }`}>
        {statusLabel}
      </div>

      {/* Puzzle info */}
      <div className="flex items-center gap-3 text-[11px] text-slate-500">
        <span>Rating: {puzzle.puzzle.rating}</span>
        <span>Theme: {puzzle.matchedTheme}</span>
      </div>

      {/* Board */}
      <div ref={boardRef} className="w-full max-w-[480px]">
        <Chessboard
          id="dungeon-battle"
          position={fen}
          boardOrientation={orientation}
          boardWidth={boardSize}
          onPieceDrop={onDrop as any}
          arePiecesDraggable={state === "solving"}
          isDraggablePiece={isDraggablePiece}
          animationDuration={200}
          customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
          customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
          showBoardNotation={showCoords}
          customSquareStyles={customSquareStyles}
          customPieces={customPieces}
          showPromotionDialog={showPromoDialog}
          promotionToSquare={promoTo as CbSquare | undefined}
          onPromotionPieceSelect={onPromotionPieceSelect}
        />
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Perk Selection Screen                                               */
/* ================================================================== */

function PerkSelect({
  choices,
  onPick,
  onSkip,
}: {
  choices: Perk[];
  onPick: (perk: Perk) => void;
  onSkip: () => void;
}) {
  return (
    <div className="text-center">
      <h2 className="mb-2 text-xl font-bold text-white">Choose a Perk</h2>
      <p className="mb-6 text-sm text-slate-400">Select one to add to your arsenal</p>
      <div className="flex flex-wrap justify-center gap-3">
        {choices.map(perk => (
          <button
            key={perk.id}
            type="button"
            onClick={() => onPick(perk)}
            className={`group flex w-48 flex-col items-center gap-2 rounded-2xl border p-4 transition-all hover:scale-105 hover:shadow-lg ${RARITY_COLORS[perk.rarity]}`}
          >
            <span className="text-3xl">{perk.icon}</span>
            <span className="text-sm font-bold">{perk.name}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">{perk.rarity}</span>
            <span className="text-xs opacity-80">{perk.description}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onSkip}
        className="mt-4 rounded-lg border border-white/[0.08] px-4 py-2 text-sm text-slate-500 transition-colors hover:text-white"
      >
        Skip
      </button>
    </div>
  );
}

/* ================================================================== */
/*  Mystery Event Screen                                                */
/* ================================================================== */

function EventScreen({
  event,
  onChoice,
}: {
  event: MysteryEvent;
  onChoice: (idx: number) => void;
}) {
  return (
    <div className="mx-auto max-w-md text-center">
      <span className="text-5xl">{event.icon}</span>
      <h2 className="mt-3 text-xl font-bold text-white">{event.title}</h2>
      <p className="mt-2 text-sm text-slate-400 italic">{event.description}</p>
      <div className="mt-6 space-y-2">
        {event.choices.map((choice, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChoice(i)}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-left transition-colors hover:border-white/[0.15] hover:bg-white/[0.06]"
          >
            <p className="text-sm font-medium text-white">{choice.label}</p>
            <p className="text-xs text-slate-500">{choice.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Rest Stop Screen                                                    */
/* ================================================================== */

function RestScreen({
  stats,
  onHeal,
  onUpgrade,
}: {
  stats: { hp: number; maxHp: number };
  onHeal: () => void;
  onUpgrade: () => void;
}) {
  const canHeal = stats.hp < stats.maxHp;
  return (
    <div className="mx-auto max-w-md text-center">
      <span className="text-5xl">🏕️</span>
      <h2 className="mt-3 text-xl font-bold text-white">Rest Stop</h2>
      <p className="mt-2 text-sm text-slate-400">Take a moment to recover…</p>
      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          disabled={!canHeal}
          onClick={onHeal}
          className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-30"
        >
          🧪 Rest & Heal (+30 HP)
        </button>
        <button
          type="button"
          onClick={onUpgrade}
          className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-400 transition-colors hover:bg-amber-500/20"
        >
          📖 Study & Upgrade (random perk)
        </button>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Shop Screen                                                         */
/* ================================================================== */

const SHOP_ITEMS = [
  { id: "shop-heal-30", name: "Health Potion", icon: "🧪", description: "Restore 30 HP", cost: 25 },
  { id: "shop-heal-full", name: "Full Heal", icon: "💖", description: "Restore to max HP", cost: 50 },
  { id: "shop-max-hp", name: "HP Upgrade", icon: "🪖", description: "+20 max HP", cost: 40 },
  { id: "shop-attack", name: "Whetstone", icon: "⚔️", description: "+1 Attack", cost: 30 },
  { id: "shop-defense", name: "Shield Polish", icon: "🛡️", description: "+1 Defense", cost: 30 },
  { id: "shop-luck", name: "Lucky Charm", icon: "🍀", description: "+2 Luck", cost: 35 },
  { id: "shop-perk", name: "Mystery Perk", icon: "🎁", description: "Random rare+ perk", cost: 60 },
];

function ShopScreen({
  coins,
  stats,
  onBuy,
  onLeave,
}: {
  coins: number;
  stats: { hp: number; maxHp: number };
  onBuy: (itemId: string) => void;
  onLeave: () => void;
}) {
  return (
    <div className="mx-auto max-w-md text-center">
      <span className="text-5xl">🏪</span>
      <h2 className="mt-3 text-xl font-bold text-white">Dungeon Shop</h2>
      <p className="mt-2 text-sm text-slate-400">Spend your hard-earned coins</p>
      <p className="mt-1 text-sm font-bold text-amber-400">💰 {coins} coins</p>
      <div className="mt-4 space-y-2">
        {SHOP_ITEMS.map(item => {
          const canAfford = coins >= item.cost;
          const isHealFull = item.id === "shop-heal-full" && stats.hp >= stats.maxHp;
          const isHeal30 = item.id === "shop-heal-30" && stats.hp >= stats.maxHp;
          const disabled = !canAfford || isHealFull || isHeal30;
          return (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => onBuy(item.id)}
              className="flex w-full items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-left transition-colors hover:bg-white/[0.06] disabled:opacity-30"
            >
              <span className="text-2xl">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{item.name}</p>
                <p className="text-xs text-slate-500">{item.description}</p>
              </div>
              <span className="text-sm font-bold text-amber-400">{item.cost} 🪙</span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onLeave}
        className="mt-4 rounded-lg border border-white/[0.08] px-4 py-2 text-sm text-slate-500 transition-colors hover:text-white"
      >
        Leave Shop
      </button>
    </div>
  );
}

/* ================================================================== */
/*  Run Summary Screen                                                  */
/* ================================================================== */

function RunSummary({
  run,
  onRestart,
  onDaily,
}: {
  run: DungeonRun;
  onRestart: () => void;
  onDaily: () => void;
}) {
  const stats = [
    { label: "Floors Cleared", value: run.floorsCleared, icon: "🏰" },
    { label: "Puzzles Solved", value: run.puzzlesSolved, icon: "✅" },
    { label: "Puzzles Failed", value: run.puzzlesFailed, icon: "❌" },
    { label: "Best Streak", value: run.bestStreak, icon: "🔥" },
    { label: "Coins Earned", value: run.coins, icon: "💰" },
    { label: "Perks Collected", value: run.perks.length, icon: "🎒" },
  ];

  return (
    <div className="mx-auto max-w-md text-center">
      <span className="text-6xl">{run.status === "victory" ? "🏆" : "💀"}</span>
      <h2 className="mt-3 text-2xl font-bold text-white">
        {run.status === "victory" ? "Victory!" : "Run Over"}
      </h2>
      <p className="mt-1 text-sm text-slate-400">
        {run.status === "victory"
          ? "You conquered the dungeon!"
          : `You fell on floor ${run.currentFloor}`}
      </p>

      {/* Stats grid */}
      <div className="mt-6 grid grid-cols-2 gap-2">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="text-2xl">{s.icon}</div>
            <div className="mt-1 text-lg font-bold text-white">{s.value}</div>
            <div className="text-[10px] text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Perks collected */}
      {run.perks.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Perks Collected</p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {run.perks.map(p => <PerkBadge key={p.id} perk={p} small />)}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-2">
        <button
          type="button"
          onClick={onRestart}
          className="rounded-xl bg-emerald-500/15 border border-emerald-500/20 px-4 py-3 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/25"
        >
          ⚔️ New Run
        </button>
        <button
          type="button"
          onClick={onDaily}
          className="rounded-xl bg-amber-500/15 border border-amber-500/20 px-4 py-3 text-sm font-medium text-amber-400 transition-colors hover:bg-amber-500/25"
        >
          📅 Daily Challenge
        </button>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Main Dungeon Page                                                   */
/* ================================================================== */

export default function DungeonPage() {
  const [run, setRun] = useState<DungeonRun | null>(null);
  const [puzzle, setPuzzle] = useState<LichessPuzzle | null>(null);
  const [loading, setLoading] = useState(false);
  const [eventMessage, setEventMessage] = useState<string | null>(null);
  const [showStartScreen, setShowStartScreen] = useState(true);

  /* ── Start a new run ── */
  const startRun = useCallback((seed?: number) => {
    const r = createRun(seed);
    setRun(r);
    setPuzzle(null);
    setShowStartScreen(false);
    setEventMessage(null);
  }, []);

  /* ── Fetch puzzle for a node ── */
  const fetchPuzzle = useCallback(async (difficulty: Difficulty) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dungeon?difficulty=${difficulty}&count=1`);
      const data = await res.json();
      if (data.puzzles?.length > 0) {
        setPuzzle(data.puzzles[0]);
      }
    } catch {}
    setLoading(false);
  }, []);

  /* ── Navigate to a node ── */
  const navigateToNode = useCallback(async (node: MapNode) => {
    if (!run) return;

    const updated = { ...run };
    updated.currentNodeId = node.id;
    updated.currentFloor = node.floor;

    // Mark visited
    const nodeIdx = updated.map.findIndex(n => n.id === node.id);
    if (nodeIdx >= 0) updated.map = [...updated.map];
    if (nodeIdx >= 0) updated.map[nodeIdx] = { ...updated.map[nodeIdx], visited: true };

    updated.floorsCleared = Math.max(updated.floorsCleared, node.floor);

    // Devil's Pawn damage every 3 floors
    if (run.perks.some(p => p.id === "devils-pawn") && node.floor > 0 && node.floor % 3 === 0) {
      updated.stats = { ...updated.stats, hp: Math.max(0, updated.stats.hp - 5) };
    }

    switch (node.type) {
      case "battle":
      case "elite":
      case "boss":
        updated.status = "battle";
        setRun(updated);
        await fetchPuzzle(node.difficulty ?? "easy");
        break;

      case "mystery": {
        const events = ALL_EVENTS;
        const event = events[Math.floor(Math.random() * events.length)];
        updated.status = "event";
        updated.activeEvent = event;
        setRun(updated);
        break;
      }

      case "shop":
        updated.status = "shop";
        setRun(updated);
        break;

      case "rest":
        updated.status = "rest";
        setRun(updated);
        break;

      default:
        updated.status = "exploring";
        setRun(updated);
    }
  }, [run, fetchPuzzle]);

  /* ── Puzzle solved ── */
  const handlePuzzleSolved = useCallback(() => {
    if (!run) return;
    const updated = { ...run };
    updated.puzzlesSolved++;
    updated.streak++;
    updated.bestStreak = Math.max(updated.bestStreak, updated.streak);
    updated.streakMultiplier = getStreakMultiplier(updated.streak, updated.perks);

    const currentNode = updated.map.find(n => n.id === updated.currentNodeId);
    const diff = currentNode?.difficulty ?? "easy";

    // Earn coins
    const earned = calculateCoins(diff, updated.streak, updated.perks);
    updated.coins += earned;

    // Heal
    const heal = calculateHeal(diff, updated.perks);
    if (heal > 0) {
      updated.stats = {
        ...updated.stats,
        hp: Math.min(updated.stats.maxHp, updated.stats.hp + heal),
      };
    }

    // Offer perks after elite, boss, or every 3 battles
    const shouldOfferPerk =
      currentNode?.type === "elite" ||
      currentNode?.type === "boss" ||
      updated.puzzlesSolved % 3 === 0;

    if (shouldOfferPerk) {
      const perkCount = currentNode?.type === "boss" ? 3 : currentNode?.type === "elite" ? 3 : 3;
      updated.perkChoices = rollPerks(perkCount, updated.perks, updated.stats.luck);
      updated.status = "perk-select";
    } else {
      updated.status = "exploring";
    }

    // Victory if floor 30 boss beaten
    if (currentNode?.type === "boss" && currentNode.floor >= 30) {
      updated.status = "victory";
    }

    setPuzzle(null);
    setRun(updated);
  }, [run]);

  /* ── Puzzle failed ── */
  const handlePuzzleFailed = useCallback(() => {
    if (!run) return;
    const updated = { ...run };
    updated.puzzlesFailed++;
    updated.streak = 0;
    updated.streakMultiplier = 1;

    const currentNode = updated.map.find(n => n.id === updated.currentNodeId);
    const diff = currentNode?.difficulty ?? "easy";

    // Take damage
    const damage = calculateDamage(diff, updated.stats, updated.perks);
    updated.stats = { ...updated.stats, hp: updated.stats.hp - damage };

    // Check for dodge (luck)
    const dodgeChance = Math.min(0.3, updated.stats.luck * 0.04);
    if (Math.random() < dodgeChance) {
      updated.stats.hp += damage; // refund
      setEventMessage("🍀 Lucky dodge! No damage taken.");
      setTimeout(() => setEventMessage(null), 2000);
    }

    // Death check
    if (updated.stats.hp <= 0) {
      // Phoenix Feather?
      const phoenixIdx = updated.perks.findIndex(p => p.id === "phoenix-feather" && !p.consumed);
      if (phoenixIdx >= 0) {
        updated.perks = [...updated.perks];
        updated.perks[phoenixIdx] = { ...updated.perks[phoenixIdx], consumed: true };
        updated.stats = { ...updated.stats, hp: 30 };
        setEventMessage("🔥 Phoenix Feather activated! Revived with 30 HP!");
        setTimeout(() => setEventMessage(null), 3000);
        updated.status = "exploring";
      } else {
        updated.status = "dead";
      }
    } else {
      updated.status = "exploring";
    }

    setPuzzle(null);
    setRun(updated);
  }, [run]);

  /* ── Perk selected ── */
  const handlePerkPick = useCallback((perk: Perk) => {
    if (!run) return;
    const updated = { ...run };
    updated.perks = [...updated.perks, perk];
    updated.perkChoices = [];
    updated.status = "exploring";

    // Apply stat effects
    if (perk.effects) {
      const s = { ...updated.stats };
      if (perk.effects.maxHp) s.maxHp += perk.effects.maxHp;
      if (perk.effects.hp) s.hp = Math.min(s.maxHp, s.hp + perk.effects.hp);
      if (perk.effects.attack) s.attack += perk.effects.attack;
      if (perk.effects.defense) s.defense += perk.effects.defense;
      if (perk.effects.luck) s.luck += perk.effects.luck;
      updated.stats = s;
    }

    // Immortal Game: heal to full
    if (perk.id === "immortal-game") {
      updated.stats = { ...updated.stats, hp: updated.stats.maxHp };
    }

    setRun(updated);
  }, [run]);

  const handlePerkSkip = useCallback(() => {
    if (!run) return;
    setRun({ ...run, perkChoices: [], status: "exploring" });
  }, [run]);

  /* ── Mystery event choice ── */
  const handleEventChoice = useCallback((idx: number) => {
    if (!run || !run.activeEvent) return;
    const event = run.activeEvent;
    const choice = event.choices[idx];
    const outcome = choice.outcome;
    const updated = { ...run };

    // Apply outcome
    if (outcome.hpChange) {
      updated.stats = {
        ...updated.stats,
        hp: Math.min(updated.stats.maxHp, Math.max(0, updated.stats.hp + outcome.hpChange)),
      };
    }
    if (outcome.coinsChange) {
      updated.coins = Math.max(0, updated.coins + outcome.coinsChange);
    }
    if (outcome.addPerk) {
      const fromCatalogue = ALL_PERKS.find((p: Perk) => p.id === outcome.addPerk);
      if (fromCatalogue) {
        updated.perks = [...updated.perks, fromCatalogue];
        if (fromCatalogue.effects) {
          const s = { ...updated.stats };
          if (fromCatalogue.effects.maxHp) s.maxHp += fromCatalogue.effects.maxHp;
          if (fromCatalogue.effects.hp) s.hp = Math.min(s.maxHp, s.hp + fromCatalogue.effects.hp);
          if (fromCatalogue.effects.attack) s.attack += fromCatalogue.effects.attack;
          if (fromCatalogue.effects.defense) s.defense += fromCatalogue.effects.defense;
          if (fromCatalogue.effects.luck) s.luck += fromCatalogue.effects.luck;
          updated.stats = s;
        }
      }
    }

    // Special event handling
    if (event.id === "chess-gambler" && idx === 0) {
      // 50/50 gamble
      if (Math.random() < 0.5) {
        updated.coins += 30;
        setEventMessage("🎲 You won! +30 coins!");
      } else {
        updated.coins = Math.max(0, updated.coins - 15);
        setEventMessage("🎲 You lost! −15 coins.");
      }
      setTimeout(() => setEventMessage(null), 2500);
    } else if (event.id === "treasure-room" && idx === 2) {
      // 50% perk
      if (Math.random() < 0.5) {
        const perks = rollPerks(1, updated.perks, updated.stats.luck);
        if (perks.length > 0) {
          updated.perks = [...updated.perks, perks[0]];
          setEventMessage(`🎁 You found: ${perks[0].icon} ${perks[0].name}!`);
        }
      } else {
        setEventMessage("Empty… nothing here.");
      }
      setTimeout(() => setEventMessage(null), 2500);
    } else if (event.id === "chess-spirit") {
      // Apply stat bonuses based on choice
      const s = { ...updated.stats };
      if (idx === 0) s.attack += 2;
      else if (idx === 1) { s.maxHp += 20; s.hp = Math.min(s.maxHp, s.hp + 20); }
      else if (idx === 2) s.luck += 3;
      updated.stats = s;
      setEventMessage(outcome.message);
      setTimeout(() => setEventMessage(null), 2500);
    } else if (event.id === "ancient-book") {
      const s = { ...updated.stats };
      if (idx === 0) s.attack += 2;
      else if (idx === 1) s.attack += 1;
      updated.stats = s;
      setEventMessage(outcome.message);
      setTimeout(() => setEventMessage(null), 2500);
    } else if (event.id === "fallen-knight" && idx === 0) {
      // Give random rare perk
      const perks = rollPerks(1, updated.perks, updated.stats.luck + 5); // boosted luck for rare
      if (perks.length > 0) {
        updated.perks = [...updated.perks, perks[0]];
        setEventMessage(`${perks[0].icon} The knight teaches you: ${perks[0].name}!`);
      }
      setTimeout(() => setEventMessage(null), 2500);
    } else if (event.id === "fallen-knight" && idx === 1) {
      const s = { ...updated.stats };
      s.defense += 1;
      s.attack += 1;
      updated.stats = s;
      setEventMessage(outcome.message);
      setTimeout(() => setEventMessage(null), 2500);
    } else if (event.id === "mysterious-gm" && idx === 0) {
      // Elite fight
      updated.status = "battle";
      updated.activeEvent = null;
      setRun(updated);
      fetchPuzzle("hard");
      return;
    } else {
      setEventMessage(outcome.message);
      setTimeout(() => setEventMessage(null), 2500);
    }

    // Death check after event
    if (updated.stats.hp <= 0) {
      const phoenixIdx = updated.perks.findIndex(p => p.id === "phoenix-feather" && !p.consumed);
      if (phoenixIdx >= 0) {
        updated.perks = [...updated.perks];
        updated.perks[phoenixIdx] = { ...updated.perks[phoenixIdx], consumed: true };
        updated.stats = { ...updated.stats, hp: 30 };
      } else {
        updated.status = "dead";
        updated.activeEvent = null;
        setRun(updated);
        return;
      }
    }

    updated.activeEvent = null;
    updated.status = "exploring";
    setRun(updated);
  }, [run, fetchPuzzle]);

  /* ── Rest actions ── */
  const handleRest = useCallback((action: "heal" | "upgrade") => {
    if (!run) return;
    const updated = { ...run };

    if (action === "heal") {
      updated.stats = {
        ...updated.stats,
        hp: Math.min(updated.stats.maxHp, updated.stats.hp + 30),
      };
      updated.status = "exploring";
    } else {
      // Upgrade — give a random perk
      updated.perkChoices = rollPerks(3, updated.perks, updated.stats.luck);
      updated.status = "perk-select";
    }

    setRun(updated);
  }, [run]);

  /* ── Shop buy ── */
  const handleShopBuy = useCallback((itemId: string) => {
    if (!run) return;
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item || run.coins < item.cost) return;

    const updated = { ...run };
    updated.coins -= item.cost;

    switch (itemId) {
      case "shop-heal-30":
        updated.stats = { ...updated.stats, hp: Math.min(updated.stats.maxHp, updated.stats.hp + 30) };
        break;
      case "shop-heal-full":
        updated.stats = { ...updated.stats, hp: updated.stats.maxHp };
        break;
      case "shop-max-hp":
        updated.stats = { ...updated.stats, maxHp: updated.stats.maxHp + 20, hp: updated.stats.hp + 20 };
        break;
      case "shop-attack":
        updated.stats = { ...updated.stats, attack: updated.stats.attack + 1 };
        break;
      case "shop-defense":
        updated.stats = { ...updated.stats, defense: updated.stats.defense + 1 };
        break;
      case "shop-luck":
        updated.stats = { ...updated.stats, luck: updated.stats.luck + 2 };
        break;
      case "shop-perk": {
        const perks = rollPerks(1, updated.perks, updated.stats.luck + 5);
        if (perks.length > 0) {
          updated.perks = [...updated.perks, perks[0]];
          if (perks[0].effects) {
            const s = { ...updated.stats };
            if (perks[0].effects.maxHp) s.maxHp += perks[0].effects.maxHp;
            if (perks[0].effects.hp) s.hp = Math.min(s.maxHp, s.hp + perks[0].effects.hp);
            if (perks[0].effects.attack) s.attack += perks[0].effects.attack;
            if (perks[0].effects.defense) s.defense += perks[0].effects.defense;
            if (perks[0].effects.luck) s.luck += perks[0].effects.luck;
            updated.stats = s;
          }
          setEventMessage(`🎁 You got: ${perks[0].icon} ${perks[0].name}!`);
          setTimeout(() => setEventMessage(null), 2500);
        }
        break;
      }
    }

    setRun(updated);
  }, [run]);

  /* ── Start screen ── */
  if (showStartScreen) {
    return (
      <div className="min-h-screen bg-[#030712]">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="animate-float absolute -left-32 top-20 h-96 w-96 rounded-full bg-red-500/[0.05] blur-[100px]" />
          <div className="animate-float-delayed absolute -right-32 top-40 h-80 w-80 rounded-full bg-purple-500/[0.05] blur-[100px]" />
        </div>
        <div className="relative z-10 mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 text-center">
          <span className="text-7xl">⚔️</span>
          <h1 className="mt-4 text-4xl font-extrabold text-white">Dungeon Tactics</h1>
          <p className="mt-2 text-sm text-slate-400">
            A roguelike chess puzzle adventure. Navigate a branching dungeon,
            solve tactical puzzles, collect perks, manage your HP, and fight bosses.
          </p>

          <div className="mt-8 flex flex-col gap-3 w-full max-w-xs">
            <button
              type="button"
              onClick={() => startRun()}
              className="rounded-xl bg-emerald-500/15 border border-emerald-500/20 px-4 py-3 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/25"
            >
              ⚔️ Start New Run
            </button>
            <button
              type="button"
              onClick={() => startRun(getDailySeed())}
              className="rounded-xl bg-amber-500/15 border border-amber-500/20 px-4 py-3 text-sm font-medium text-amber-400 transition-colors hover:bg-amber-500/25"
            >
              📅 Daily Challenge
            </button>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl">💀</div>
              <p className="text-xs text-slate-500 mt-1">Elites drop rare perks</p>
            </div>
            <div>
              <div className="text-2xl">🗡️</div>
              <p className="text-xs text-slate-500 mt-1">22 unique perks to find</p>
            </div>
            <div>
              <div className="text-2xl">🔥</div>
              <p className="text-xs text-slate-500 mt-1">Boss every 10 floors</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!run) return null;

  /* ── Dead or Victory ── */
  if (run.status === "dead" || run.status === "victory") {
    return (
      <div className="min-h-screen bg-[#030712]">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="animate-float absolute -left-32 top-20 h-96 w-96 rounded-full bg-red-500/[0.05] blur-[100px]" />
        </div>
        <div className="relative z-10 mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4">
          <RunSummary
            run={run}
            onRestart={() => startRun()}
            onDaily={() => startRun(getDailySeed())}
          />
        </div>
      </div>
    );
  }

  /* ── Main game layout ── */
  return (
    <div className="min-h-screen bg-[#030712]">
      {/* Background glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="animate-float absolute -left-32 top-20 h-96 w-96 rounded-full bg-red-500/[0.04] blur-[100px]" />
        <div className="animate-float-delayed absolute -right-32 top-40 h-80 w-80 rounded-full bg-purple-500/[0.04] blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚔️</span>
            <div>
              <h1 className="text-lg font-bold text-white">Dungeon Tactics</h1>
              <p className="text-[10px] text-slate-500">Floor {run.currentFloor}</p>
            </div>
          </div>

          <div className="flex-1" />

          {/* Stats bar */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <HpBar hp={run.stats.hp} maxHp={run.stats.maxHp} />
            <span className="text-amber-400 font-bold">💰 {run.coins}</span>
            {run.streak > 0 && (
              <span className="text-orange-400 font-bold">
                🔥 {run.streak} (×{run.streakMultiplier})
              </span>
            )}
            <div className="flex gap-2 text-slate-500">
              <span title="Attack">⚔️ {run.stats.attack}</span>
              <span title="Defense">🛡️ {run.stats.defense}</span>
              <span title="Luck">🍀 {run.stats.luck}</span>
            </div>
          </div>
        </div>

        {/* Event message toast */}
        {eventMessage && (
          <div className="mb-4 animate-bounce rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-center text-sm font-medium text-amber-400">
            {eventMessage}
          </div>
        )}

        {/* Main content — depends on status */}
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Center area */}
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            {run.status === "exploring" && (
              <div className="text-center">
                <span className="text-5xl">🗺️</span>
                <h2 className="mt-3 text-xl font-bold text-white">Choose Your Path</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Select a node on the map to continue your journey
                </p>
              </div>
            )}

            {run.status === "battle" && loading && (
              <div className="text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-emerald-400" />
                <p className="mt-4 text-sm text-slate-400">Summoning puzzle…</p>
              </div>
            )}

            {run.status === "battle" && puzzle && !loading && (
              <BattleBoard
                puzzle={puzzle}
                run={run}
                onSolved={handlePuzzleSolved}
                onFailed={handlePuzzleFailed}
              />
            )}

            {run.status === "perk-select" && (
              <PerkSelect
                choices={run.perkChoices}
                onPick={handlePerkPick}
                onSkip={handlePerkSkip}
              />
            )}

            {run.status === "event" && run.activeEvent && (
              <EventScreen
                event={run.activeEvent}
                onChoice={handleEventChoice}
              />
            )}

            {run.status === "rest" && (
              <RestScreen
                stats={run.stats}
                onHeal={() => handleRest("heal")}
                onUpgrade={() => handleRest("upgrade")}
              />
            )}

            {run.status === "shop" && (
              <ShopScreen
                coins={run.coins}
                stats={run.stats}
                onBuy={handleShopBuy}
                onLeave={() => setRun({ ...run, status: "exploring" })}
              />
            )}
          </div>

          {/* Sidebar — map + perks */}
          <div className="space-y-4 lg:order-first lg:order-none">
            <DungeonMap
              nodes={run.map}
              currentNodeId={run.currentNodeId}
              currentFloor={run.currentFloor}
              perks={run.perks}
              onSelectNode={navigateToNode}
            />

            {/* Perks inventory */}
            {run.perks.length > 0 && (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  🎒 Perks ({run.perks.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {run.perks.map((p, i) => <PerkBadge key={`${p.id}-${i}`} perk={p} small />)}
                </div>
              </div>
            )}

            {/* Run stats */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                Run Stats
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-slate-500">Puzzles Solved</div>
                <div className="text-right text-emerald-400 font-medium">{run.puzzlesSolved}</div>
                <div className="text-slate-500">Puzzles Failed</div>
                <div className="text-right text-red-400 font-medium">{run.puzzlesFailed}</div>
                <div className="text-slate-500">Best Streak</div>
                <div className="text-right text-orange-400 font-medium">{run.bestStreak}</div>
                <div className="text-slate-500">Coins Earned</div>
                <div className="text-right text-amber-400 font-medium">{run.coins}</div>
              </div>
            </div>

            {/* Abandon run */}
            <button
              type="button"
              onClick={() => { setRun(null); setShowStartScreen(true); }}
              className="w-full rounded-lg border border-red-500/10 px-3 py-1.5 text-xs text-red-400/60 transition-colors hover:text-red-400 hover:border-red-500/30"
            >
              Abandon Run
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
