"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import type { Square as CbSquare } from "react-chessboard/dist/chessboard/types";
import { useBoardSize } from "@/lib/use-board-size";
import { useBoardTheme, useCustomPieces, useShowCoordinates } from "@/lib/use-coins";
import { playSound, preloadSounds } from "@/lib/sounds";
import { playDungeonSound, preloadDungeonSounds } from "@/lib/dungeon-sounds";
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
/*  Floating Particles                                                  */
/* ================================================================== */

function DungeonParticles({ variant = "embers" }: { variant?: "embers" | "sparkle" | "ash" }) {
  const colors =
    variant === "embers" ? ["#f97316", "#ef4444", "#fbbf24"] :
    variant === "sparkle" ? ["#fbbf24", "#a78bfa", "#34d399"] :
    ["#64748b", "#475569", "#94a3b8"];

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {Array.from({ length: 18 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${2 + Math.random() * 3}px`,
            height: `${2 + Math.random() * 3}px`,
            backgroundColor: colors[i % colors.length],
            left: `${5 + Math.random() * 90}%`,
            bottom: `${-5 + Math.random() * 10}%`,
            opacity: 0,
            animation: `dungeon-ember-float ${4 + Math.random() * 6}s ease-out ${Math.random() * 5}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ================================================================== */
/*  SVG Node Shape Renderers                                            */
/* ================================================================== */

function SvgNodeShape({ type, x, y, isCurrent, isReachable, isVisited, isHidden }: {
  type: NodeType;
  x: number;
  y: number;
  isCurrent: boolean;
  isReachable: boolean;
  isVisited: boolean;
  isHidden: boolean;
}) {
  const info = NODE_INFO[type];
  const size = type === "boss" ? 28 : 22;

  // Colors
  const fillColor =
    isCurrent ? "rgba(16, 185, 129, 0.25)" :
    isReachable ? "rgba(147, 197, 253, 0.12)" :
    isVisited ? "rgba(255, 255, 255, 0.03)" :
    isHidden ? "rgba(255, 255, 255, 0.02)" :
    "rgba(255, 255, 255, 0.05)";

  const strokeColor =
    isCurrent ? "#10b981" :
    isReachable ? "rgba(147, 197, 253, 0.5)" :
    isVisited ? "rgba(255, 255, 255, 0.08)" :
    isHidden ? "rgba(255, 255, 255, 0.06)" :
    "rgba(255, 255, 255, 0.12)";

  const opacity = isHidden ? 0.3 : isVisited && !isCurrent ? 0.5 : 1;

  // Hexagon path
  const hexPoints = (cx: number, cy: number, r: number) => {
    return Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(" ");
  };

  // Diamond path
  const diamondPoints = (cx: number, cy: number, r: number) =>
    `${cx},${cy - r} ${cx + r * 0.75},${cy} ${cx},${cy + r} ${cx - r * 0.75},${cy}`;

  const shape = type === "boss" || type === "battle" ? (
    <polygon points={hexPoints(x, y, size)} fill={fillColor} stroke={strokeColor} strokeWidth={isCurrent ? 2.5 : 1.5} />
  ) : type === "elite" ? (
    <polygon points={diamondPoints(x, y, size)} fill={fillColor} stroke={strokeColor} strokeWidth={isCurrent ? 2.5 : 1.5} />
  ) : (
    <circle cx={x} cy={y} r={size * 0.85} fill={fillColor} stroke={strokeColor} strokeWidth={isCurrent ? 2.5 : 1.5} />
  );

  // Glow effect for boss
  const glow = type === "boss" && !isHidden ? (
    <polygon
      points={hexPoints(x, y, size + 4)}
      fill="none"
      stroke="rgba(220, 38, 38, 0.3)"
      strokeWidth={1}
      className="dungeon-boss-throb"
    />
  ) : null;

  // Pulse ring for current node
  const pulse = isCurrent ? (
    <circle
      cx={x} cy={y} r={size + 6}
      fill="none"
      stroke="rgba(16, 185, 129, 0.3)"
      strokeWidth={1.5}
      className="dungeon-node-pulse"
      style={{ transformOrigin: `${x}px ${y}px` }}
    />
  ) : null;

  return (
    <g opacity={opacity} className={isReachable && !isCurrent ? "cursor-pointer" : ""}>
      {glow}
      {pulse}
      {shape}
      <text
        x={x}
        y={y + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={type === "boss" ? 20 : 16}
        className="select-none"
      >
        {isHidden ? "?" : info.icon}
      </text>
      {!isHidden && (
        <text
          x={x}
          y={y + size + 12}
          textAnchor="middle"
          fontSize={9}
          fontWeight="bold"
          fill={
            type === "boss" ? "#ef4444" :
            type === "elite" ? "#c084fc" :
            type === "battle" ? "#60a5fa" :
            type === "mystery" ? "#a78bfa" :
            type === "shop" ? "#fbbf24" :
            type === "rest" ? "#34d399" :
            "#94a3b8"
          }
          className="select-none"
        >
          {type === "boss" ? "BOSS" : info.label}
        </text>
      )}
    </g>
  );
}

/* ================================================================== */
/*  HP Bar Component                                                    */
/* ================================================================== */

function HpBar({ hp, maxHp }: { hp: number; maxHp: number }) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const color = pct > 60 ? "bg-emerald-500" : pct > 30 ? "bg-amber-500" : "bg-red-500";
  const glowColor = pct > 60 ? "shadow-emerald-500/30" : pct > 30 ? "shadow-amber-500/30" : "shadow-red-500/30";
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-red-400">❤️ {hp}/{maxHp}</span>
      <div className={`h-3 flex-1 rounded-full bg-white/[0.06] overflow-hidden min-w-[80px] shadow-sm ${glowColor}`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
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
/*  Dungeon Map Visualization (SVG)                                     */
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
  const visibleFloors = hasScoutsMap ? currentFloor + 4 : currentFloor + 3;

  const floors = useMemo(() => {
    const byFloor = new Map<number, MapNode[]>();
    for (const n of nodes) {
      const arr = byFloor.get(n.floor) ?? [];
      arr.push(n);
      byFloor.set(n.floor, arr);
    }
    return byFloor;
  }, [nodes]);

  const currentNode = nodes.find(n => n.id === currentNodeId);
  const reachableIds = new Set(currentNode?.connections ?? []);

  const startFloor = Math.max(0, currentFloor - 2);
  const endFloor = Math.min(Math.max(...Array.from(floors.keys())), visibleFloors);

  const displayFloors: number[] = [];
  for (let f = endFloor; f >= startFloor; f--) {
    displayFloors.push(f);
  }

  // SVG layout
  const COL_W = 120;
  const ROW_H = 85;
  const PAD_X = 70;
  const PAD_Y = 45;
  const svgWidth = 2 * COL_W + 2 * PAD_X;
  const svgHeight = displayFloors.length * ROW_H + PAD_Y + 25;

  // Build position map
  const nodePositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();
    displayFloors.forEach((floor, rowIdx) => {
      const floorNodes = floors.get(floor) ?? [];
      floorNodes.forEach(node => {
        positions.set(node.id, {
          x: node.col * COL_W + PAD_X,
          y: rowIdx * ROW_H + PAD_Y,
        });
      });
    });
    return positions;
  }, [displayFloors, floors]);

  // Collect visible connection lines
  const connections = useMemo(() => {
    const lines: { from: { x: number; y: number }; to: { x: number; y: number }; isReachable: boolean; fromId: string; toId: string }[] = [];
    const visibleNodeIds = new Set(nodePositions.keys());
    for (const [nodeId, fromPos] of nodePositions) {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) continue;
      for (const connId of node.connections) {
        if (!visibleNodeIds.has(connId)) continue;
        const toPos = nodePositions.get(connId);
        if (!toPos) continue;
        lines.push({
          from: fromPos,
          to: toPos,
          isReachable: currentNode?.id === nodeId && reachableIds.has(connId),
          fromId: nodeId,
          toId: connId,
        });
      }
    }
    return lines;
  }, [nodePositions, nodes, currentNode, reachableIds]);

  return (
    <div className="mx-auto w-full max-w-lg dungeon-screen-enter">
      {/* Title */}
      <div className="mb-3 text-center">
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center justify-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>Dungeon Map</span>
        </h2>
        <p className="text-xs text-slate-500">Floor {currentFloor}</p>
      </div>

      {/* SVG Map */}
      <div className="relative rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-3 overflow-hidden">
        {/* Fog overlay at top */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-16 z-10"
          style={{ background: "linear-gradient(to bottom, rgba(3,7,18,0.9) 0%, transparent 100%)" }}
        />

        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full"
          style={{ maxHeight: "50vh" }}
        >
          <defs>
            {/* Glow filter */}
            <filter id="node-glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Reachable path gradient */}
            <linearGradient id="reachable-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Connection lines */}
          {connections.map((conn, i) => {
            const midY = (conn.from.y + conn.to.y) / 2;
            const pathD = `M ${conn.from.x} ${conn.from.y} C ${conn.from.x} ${midY}, ${conn.to.x} ${midY}, ${conn.to.x} ${conn.to.y}`;
            return (
              <g key={`conn-${i}`}>
                {/* Shadow line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={conn.isReachable ? "rgba(147, 197, 253, 0.15)" : "rgba(255,255,255,0.04)"}
                  strokeWidth={conn.isReachable ? 6 : 2}
                />
                {/* Main line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={conn.isReachable ? "url(#reachable-grad)" : "rgba(255,255,255,0.08)"}
                  strokeWidth={conn.isReachable ? 2.5 : 1}
                  strokeLinecap="round"
                  strokeDasharray={conn.isReachable ? "6 4" : "none"}
                  className={conn.isReachable ? "dungeon-path-active" : ""}
                />
              </g>
            );
          })}

          {/* Floor numbers */}
          {displayFloors.map((floor, rowIdx) => (
            <text
              key={`floor-${floor}`}
              x={12}
              y={rowIdx * ROW_H + PAD_Y + 3}
              fontSize={10}
              fontFamily="monospace"
              fill="rgba(148, 163, 184, 0.5)"
              textAnchor="middle"
            >
              {floor}
            </text>
          ))}

          {/* Nodes */}
          {displayFloors.map(floor => {
            const floorNodes = floors.get(floor) ?? [];
            return floorNodes.map(node => {
              const pos = nodePositions.get(node.id);
              if (!pos) return null;

              const isCurrent = node.id === currentNodeId;
              const isReachable = reachableIds.has(node.id);
              const isHidden = floor > visibleFloors && !node.visited;

              return (
                <g
                  key={node.id}
                  onClick={() => isReachable && onSelectNode(node)}
                  className={isReachable ? "cursor-pointer" : ""}
                  role={isReachable ? "button" : undefined}
                  tabIndex={isReachable ? 0 : undefined}
                >
                  {/* Hit area (invisible larger target) */}
                  {isReachable && (
                    <circle cx={pos.x} cy={pos.y} r={30} fill="transparent" />
                  )}
                  <SvgNodeShape
                    type={node.type}
                    x={pos.x}
                    y={pos.y}
                    isCurrent={isCurrent}
                    isReachable={isReachable}
                    isVisited={node.visited}
                    isHidden={isHidden}
                  />
                </g>
              );
            });
          })}
        </svg>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Move Indicator (tick / cross overlay)                               */
/* ================================================================== */

function DungeonMoveIndicator({
  square,
  type,
  orientation,
  boardSize,
}: {
  square: string;
  type: "correct" | "wrong";
  orientation: "white" | "black";
  boardSize: number;
}) {
  const file = square.charCodeAt(0) - 97;
  const rank = parseInt(square[1]) - 1;
  const sqSize = boardSize / 8;
  const x = orientation === "white" ? file * sqSize : (7 - file) * sqSize;
  const y = orientation === "white" ? (7 - rank) * sqSize : rank * sqSize;
  const size = Math.max(18, Math.round(sqSize * 0.36));

  return (
    <div
      className="pointer-events-none absolute z-20 flex items-center justify-center rounded-full font-bold shadow-lg"
      style={{
        left: x + sqSize - size - 2,
        top: y + 2,
        width: size,
        height: size,
        fontSize: size * 0.65,
        lineHeight: 1,
        backgroundColor: type === "correct" ? "#22c55e" : "#ef4444",
        color: "#fff",
        animation: "indicator-pop 0.15s ease-out",
      }}
    >
      {type === "correct" ? "✓" : "✗"}
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
  const { ref: boardRef, size: boardSize } = useBoardSize(720, { evalBar: false });
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();
  const showCoords = useShowCoordinates();

  // Visual effect states
  const [shaking, setShaking] = useState(false);
  const [glowCorrect, setGlowCorrect] = useState(false);
  const [flashDamage, setFlashDamage] = useState(false);
  const [moveIndicator, setMoveIndicator] = useState<{ square: string; type: "correct" | "wrong" } | null>(null);

  const currentNode = run.map.find(n => n.id === run.currentNodeId);
  const isBoss = currentNode?.type === "boss";
  const isElite = currentNode?.type === "elite";

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
        playDungeonSound("damage");
        setWrongMove({ from, to });
        setMoveIndicator({ square: to, type: "wrong" });
        setShaking(true);
        setTimeout(() => setShaking(false), 500);
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        setTimeout(() => { setWrongMove(null); setMoveIndicator(null); }, 800);

        if (newAttempts >= maxAttempts) {
          setState("wrong");
          setFlashDamage(true);
          setTimeout(() => setFlashDamage(false), 600);
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
        setMoveIndicator({ square: expected.slice(2, 4), type: "correct" });
        setHintSquare(null);
        playSound("move");

        const nextIdx = solutionIdx + 1;
        if (nextIdx >= puzzle.puzzle.solution.length) {
          setState("correct");
          playSound("correct");
          setGlowCorrect(true);
          setTimeout(() => setGlowCorrect(false), 1000);
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
              setMoveIndicator(null);
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
    <div className="w-full flex flex-col items-center gap-3 dungeon-screen-enter relative">
      {/* Damage flash overlay */}
      {flashDamage && (
        <div className="fixed inset-0 z-50 pointer-events-none bg-red-500/20 dungeon-damage-flash" />
      )}

      {/* Boss vignette */}
      {isBoss && (
        <div className="fixed inset-0 z-0 pointer-events-none dungeon-boss-vignette rounded-3xl" />
      )}

      {/* Battle type badge */}
      <div className={`flex items-center gap-2 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wider border ${
        isBoss ? "border-red-500/30 bg-red-500/10 text-red-400" :
        isElite ? "border-purple-500/30 bg-purple-500/10 text-purple-400" :
        "border-blue-500/20 bg-blue-500/5 text-blue-400"
      }`}>
        {isBoss ? "⚔️ Boss Battle" : isElite ? "💀 Elite Fight" : "⚔️ Battle"}
      </div>

      {/* Status */}
      <div className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
        state === "correct" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          : state === "wrong" ? "border-red-500/30 bg-red-500/10 text-red-400"
          : "border-white/[0.08] bg-white/[0.03] text-slate-400"
      }`}>
        {statusLabel}
      </div>

      {/* Puzzle info */}
      <div className="flex items-center gap-3 text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          {puzzle.puzzle.rating}
        </span>
        <span>{puzzle.matchedTheme}</span>
      </div>

      {/* Board — ref container must have NO transforms for drag accuracy */}
      <div ref={boardRef} className="w-full max-w-[720px]">
        <div
          className={`relative overflow-hidden rounded-xl transition-shadow ${
            shaking ? "dungeon-shake" : ""
          } ${
            glowCorrect ? "dungeon-correct-glow" : ""
          }`}
        >
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
          {moveIndicator && (
            <DungeonMoveIndicator
              square={moveIndicator.square}
              type={moveIndicator.type}
              orientation={orientation}
              boardSize={boardSize}
            />
          )}
        </div>
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
    <div className="text-center dungeon-screen-enter">
      <div className="text-4xl mb-2">🗡️</div>
      <h2 className="mb-1 text-xl font-bold text-white">Choose a Perk</h2>
      <p className="mb-6 text-sm text-slate-400">Select one to add to your arsenal</p>
      <div className="flex flex-wrap justify-center gap-4">
        {choices.map((perk, idx) => (
          <button
            key={perk.id}
            type="button"
            onClick={() => {
              playDungeonSound("perkPickup");
              onPick(perk);
            }}
            className={`dungeon-stagger-${idx + 1} dungeon-perk-shimmer group flex w-52 flex-col items-center gap-2 rounded-2xl border p-5 transition-all hover:scale-105 hover:shadow-lg ${RARITY_COLORS[perk.rarity]}`}
          >
            <span className="text-4xl drop-shadow-lg">{perk.icon}</span>
            <span className="text-sm font-bold">{perk.name}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              perk.rarity === "legendary" ? "bg-amber-500/20 text-amber-400" :
              perk.rarity === "epic" ? "bg-purple-500/20 text-purple-400" :
              perk.rarity === "rare" ? "bg-blue-500/20 text-blue-400" :
              perk.rarity === "cursed" ? "bg-red-500/20 text-red-400" :
              "bg-white/[0.06] text-slate-500"
            }`}>
              {perk.rarity}
            </span>
            <span className="text-xs opacity-80">{perk.description}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onSkip}
        className="mt-5 rounded-lg border border-white/[0.08] px-4 py-2 text-sm text-slate-500 transition-all hover:text-white hover:border-white/20"
      >
        Skip →
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
  useEffect(() => { playDungeonSound("event"); }, []);

  return (
    <div className="mx-auto max-w-md text-center dungeon-screen-enter">
      {/* Atmospheric purple glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0" style={{
          background: "radial-gradient(circle at 50% 40%, rgba(139, 92, 246, 0.08) 0%, transparent 60%)"
        }} />
      </div>

      <div className="relative z-10">
        <span className="text-6xl drop-shadow-lg">{event.icon}</span>
        <h2 className="mt-3 text-xl font-bold text-white">{event.title}</h2>
        <p className="mt-2 text-sm text-slate-400 italic leading-relaxed">{event.description}</p>
        <div className="mt-6 space-y-2">
          {event.choices.map((choice, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChoice(i)}
              className={`dungeon-stagger-${i + 1} w-full rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 text-left transition-all hover:border-purple-500/30 hover:bg-purple-500/5 hover:shadow-lg hover:shadow-purple-500/5 group`}
            >
              <p className="text-sm font-medium text-white group-hover:text-purple-200 transition-colors">{choice.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{choice.description}</p>
            </button>
          ))}
        </div>
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
    <div className="mx-auto max-w-md text-center dungeon-screen-enter">
      {/* Warm campfire glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0" style={{
          background: "radial-gradient(circle at 50% 60%, rgba(251, 146, 60, 0.06) 0%, transparent 50%)"
        }} />
      </div>

      <div className="relative z-10">
        {/* Animated campfire */}
        <div className="relative inline-block">
          <span className="text-6xl">🏕️</span>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-orange-500/20 blur-xl" style={{
            animation: "dungeon-torch-flicker 1.5s ease-in-out infinite"
          }} />
        </div>
        <h2 className="mt-3 text-xl font-bold text-white">Rest Stop</h2>
        <p className="mt-2 text-sm text-slate-400">Take a moment to recover…</p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            disabled={!canHeal}
            onClick={() => {
              playDungeonSound("heal");
              onHeal();
            }}
            className="dungeon-stagger-1 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4 text-sm font-medium text-emerald-400 transition-all hover:bg-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/10 disabled:opacity-30"
          >
            🧪 Rest & Heal (+30 HP)
          </button>
          <button
            type="button"
            onClick={() => {
              playDungeonSound("perkPickup");
              onUpgrade();
            }}
            className="dungeon-stagger-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-4 text-sm font-medium text-amber-400 transition-all hover:bg-amber-500/20 hover:shadow-lg hover:shadow-amber-500/10"
          >
            📖 Study & Upgrade (random perk)
          </button>
        </div>
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
    <div className="mx-auto max-w-md text-center dungeon-screen-enter">
      {/* Golden ambient */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0" style={{
          background: "radial-gradient(circle at 50% 40%, rgba(251, 191, 36, 0.05) 0%, transparent 60%)"
        }} />
      </div>

      <div className="relative z-10">
        <span className="text-6xl">🏪</span>
        <h2 className="mt-3 text-xl font-bold text-white">Dungeon Shop</h2>
        <p className="mt-2 text-sm text-slate-400">Spend your hard-earned coins</p>
        <p className="mt-1 text-sm font-bold text-amber-400 flex items-center justify-center gap-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v12M6 12h12" />
          </svg>
          {coins} coins
        </p>
        <div className="mt-4 space-y-2">
          {SHOP_ITEMS.map((item, idx) => {
            const canAfford = coins >= item.cost;
            const isHealFull = item.id === "shop-heal-full" && stats.hp >= stats.maxHp;
            const isHeal30 = item.id === "shop-heal-30" && stats.hp >= stats.maxHp;
            const disabled = !canAfford || isHealFull || isHeal30;
            return (
              <button
                key={item.id}
                type="button"
                disabled={disabled}
                onClick={() => {
                  playDungeonSound("shopBuy");
                  onBuy(item.id);
                }}
                className={`dungeon-stagger-${Math.min(idx + 1, 4)} flex w-full items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-left transition-all hover:bg-amber-500/5 hover:border-amber-500/20 hover:shadow-lg hover:shadow-amber-500/5 disabled:opacity-30 disabled:hover:bg-white/[0.03] disabled:hover:border-white/[0.08] disabled:hover:shadow-none`}
              >
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.description}</p>
                </div>
                <span className="text-sm font-bold text-amber-400 whitespace-nowrap">{item.cost} 🪙</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onLeave}
          className="mt-5 rounded-lg border border-white/[0.08] px-4 py-2 text-sm text-slate-500 transition-all hover:text-white hover:border-white/20"
        >
          Leave Shop →
        </button>
      </div>
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
  const isVictory = run.status === "victory";

  useEffect(() => {
    playDungeonSound(isVictory ? "victory" : "death");
  }, [isVictory]);

  const stats = [
    { label: "Floors Cleared", value: run.floorsCleared, icon: "🏰" },
    { label: "Puzzles Solved", value: run.puzzlesSolved, icon: "✅" },
    { label: "Puzzles Failed", value: run.puzzlesFailed, icon: "❌" },
    { label: "Best Streak", value: run.bestStreak, icon: "🔥" },
    { label: "Coins Earned", value: run.coins, icon: "💰" },
    { label: "Perks Collected", value: run.perks.length, icon: "🎒" },
  ];

  return (
    <div className="mx-auto max-w-md text-center dungeon-screen-enter">
      <span className={`text-7xl inline-block ${isVictory ? "dungeon-victory-glow" : ""}`}>
        {isVictory ? "🏆" : "💀"}
      </span>
      <h2 className={`mt-3 text-3xl font-bold ${isVictory ? "text-amber-400 dungeon-victory-glow" : "text-red-400"}`}>
        {isVictory ? "Victory!" : "Run Over"}
      </h2>
      <p className="mt-1 text-sm text-slate-400">
        {isVictory
          ? "You conquered the dungeon!"
          : `You fell on floor ${run.currentFloor}`}
      </p>

      {/* Stats grid */}
      <div className="mt-6 grid grid-cols-2 gap-2">
        {stats.map((s, i) => (
          <div key={s.label} className={`dungeon-stagger-${Math.min(i + 1, 4)} rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-all hover:bg-white/[0.04]`}>
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
          className="rounded-xl bg-emerald-500/15 border border-emerald-500/20 px-4 py-3 text-sm font-medium text-emerald-400 transition-all hover:bg-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/10"
        >
          ⚔️ New Run
        </button>
        <button
          type="button"
          onClick={onDaily}
          className="rounded-xl bg-amber-500/15 border border-amber-500/20 px-4 py-3 text-sm font-medium text-amber-400 transition-all hover:bg-amber-500/25 hover:shadow-lg hover:shadow-amber-500/10"
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
    preloadDungeonSounds();
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
    playDungeonSound("footstep");

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
        playDungeonSound(node.type === "boss" ? "bossIntro" : "battleStart");
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
    if (earned > 0) playDungeonSound("coin");

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
        <DungeonParticles variant="embers" />
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="animate-float absolute -left-32 top-20 h-96 w-96 rounded-full bg-red-500/[0.05] blur-[100px]" />
          <div className="animate-float-delayed absolute -right-32 top-40 h-80 w-80 rounded-full bg-purple-500/[0.05] blur-[100px]" />
          {/* Central glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-orange-500/[0.06] blur-[80px]" />
        </div>
        <div className="relative z-10 mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 text-center">
          {/* SVG Sword decoration */}
          <div className="relative">
            <svg width="80" height="80" viewBox="0 0 80 80" className="drop-shadow-lg">
              <defs>
                <linearGradient id="sword-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
              {/* Sword blade */}
              <path d="M40 8 L46 50 L40 56 L34 50 Z" fill="url(#sword-grad)" opacity="0.9" />
              {/* Guard */}
              <rect x="28" y="50" width="24" height="4" rx="2" fill="#d97706" />
              {/* Handle */}
              <rect x="37" y="54" width="6" height="14" rx="1" fill="#92400e" />
              {/* Pommel */}
              <circle cx="40" cy="72" r="4" fill="#b45309" />
              {/* Blade highlight */}
              <path d="M40 12 L43 48 L40 52 Z" fill="rgba(255,255,255,0.15)" />
            </svg>
            <div className="absolute -inset-4 rounded-full bg-amber-500/10 blur-xl animate-pulse-slow" />
          </div>

          <h1 className="mt-6 text-5xl font-extrabold">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-orange-400 to-red-500">
              Dungeon Tactics
            </span>
          </h1>
          <p className="mt-3 text-sm text-slate-400 max-w-sm leading-relaxed">
            A roguelike chess puzzle adventure. Navigate a branching dungeon,
            solve tactical puzzles, collect perks, manage your HP, and fight bosses.
          </p>

          <div className="mt-8 flex flex-col gap-3 w-full max-w-xs">
            <button
              type="button"
              onClick={() => startRun()}
              className="group relative overflow-hidden rounded-xl bg-emerald-500/15 border border-emerald-500/20 px-4 py-3.5 text-sm font-medium text-emerald-400 transition-all hover:bg-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/10"
            >
              <span className="relative z-10">⚔️ Start New Run</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </button>
            <button
              type="button"
              onClick={() => startRun(getDailySeed())}
              className="group relative overflow-hidden rounded-xl bg-amber-500/15 border border-amber-500/20 px-4 py-3.5 text-sm font-medium text-amber-400 transition-all hover:bg-amber-500/25 hover:shadow-lg hover:shadow-amber-500/10"
            >
              <span className="relative z-10">📅 Daily Challenge</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </button>
          </div>

          {/* Feature badges */}
          <div className="mt-10 grid grid-cols-3 gap-6 text-center">
            {[
              { icon: "💀", label: "Elites drop rare perks" },
              { icon: "🗡️", label: "22 unique perks to find" },
              { icon: "🔥", label: "Boss every 10 floors" },
            ].map((feat, i) => (
              <div key={i} className={`dungeon-stagger-${i + 1}`}>
                <div className="text-3xl">{feat.icon}</div>
                <p className="text-xs text-slate-500 mt-1.5 leading-tight">{feat.label}</p>
              </div>
            ))}
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
        <DungeonParticles variant={run.status === "victory" ? "sparkle" : "ash"} />
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className={`animate-float absolute -left-32 top-20 h-96 w-96 rounded-full blur-[100px] ${
            run.status === "victory" ? "bg-amber-500/[0.06]" : "bg-red-500/[0.05]"
          }`} />
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
  const currentNodeForLayout = run.map.find(n => n.id === run.currentNodeId);
  const isBossBattle = run.status === "battle" && currentNodeForLayout?.type === "boss";

  return (
    <div className="min-h-screen bg-[#030712]">
      {/* Background glows — dynamic based on status */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {run.status === "battle" ? (
          <>
            <div className="animate-float absolute -left-32 top-20 h-96 w-96 rounded-full bg-red-500/[0.04] blur-[100px]" />
            {isBossBattle && (
              <div className="absolute inset-0" style={{
                background: "radial-gradient(circle at 50% 50%, rgba(220, 38, 38, 0.06) 0%, transparent 60%)"
              }} />
            )}
          </>
        ) : run.status === "exploring" ? (
          <>
            <div className="animate-float absolute -left-32 top-20 h-96 w-96 rounded-full bg-emerald-500/[0.03] blur-[100px]" />
            <div className="animate-float-delayed absolute -right-32 top-40 h-80 w-80 rounded-full bg-blue-500/[0.03] blur-[100px]" />
          </>
        ) : (
          <>
            <div className="animate-float absolute -left-32 top-20 h-96 w-96 rounded-full bg-purple-500/[0.04] blur-[100px]" />
            <div className="animate-float-delayed absolute -right-32 top-40 h-80 w-80 rounded-full bg-amber-500/[0.04] blur-[100px]" />
          </>
        )}
      </div>

      {/* Subtle particles */}
      {run.status === "battle" && <DungeonParticles variant="embers" />}

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-white/[0.06] bg-gradient-to-r from-white/[0.03] to-transparent p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="relative">
              <svg width="28" height="28" viewBox="0 0 28 28" className="drop-shadow">
                <defs>
                  <linearGradient id="topbar-sword" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
                <path d="M14 3 L17 17 L14 20 L11 17 Z" fill="url(#topbar-sword)" />
                <rect x="10" y="17" width="8" height="2" rx="1" fill="#d97706" />
                <rect x="12.5" y="19" width="3" height="5" rx="0.5" fill="#92400e" />
                <circle cx="14" cy="26" r="1.5" fill="#b45309" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Dungeon Tactics</h1>
              <p className="text-[10px] text-slate-500 font-mono">Floor {run.currentFloor}</p>
            </div>
          </div>

          <div className="flex-1" />

          {/* Stats bar */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <HpBar hp={run.stats.hp} maxHp={run.stats.maxHp} />
            <span className="text-amber-400 font-bold flex items-center gap-0.5">💰 {run.coins}</span>
            {run.streak > 0 && (
              <span className="text-orange-400 font-bold">
                🔥 {run.streak} <span className="text-orange-300">(×{run.streakMultiplier})</span>
              </span>
            )}
            <div className="flex gap-2 text-slate-500">
              <span title="Attack" className="hover:text-slate-300 transition-colors">⚔️ {run.stats.attack}</span>
              <span title="Defense" className="hover:text-slate-300 transition-colors">🛡️ {run.stats.defense}</span>
              <span title="Luck" className="hover:text-slate-300 transition-colors">🍀 {run.stats.luck}</span>
            </div>
          </div>
        </div>

        {/* Event message toast */}
        {eventMessage && (
          <div className="mb-4 animate-bounce rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-center text-sm font-medium text-amber-400">
            {eventMessage}
          </div>
        )}

        {/* Perks bar (compact, always visible) */}
        {run.perks.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-1">🎒 Perks</span>
            {run.perks.map((p, i) => <PerkBadge key={`${p.id}-${i}`} perk={p} small />)}
          </div>
        )}

        {/* Main content — single full-width panel, one view at a time */}
        <div className="flex flex-col items-center">
          {/* Exploring: show map full-width */}
          {run.status === "exploring" && (
            <div className="w-full max-w-2xl">
              <DungeonMap
                nodes={run.map}
                currentNodeId={run.currentNodeId}
                currentFloor={run.currentFloor}
                perks={run.perks}
                onSelectNode={navigateToNode}
              />

              {/* Run stats — compact row */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Solved</span>
                  <span className="font-bold text-emerald-400">{run.puzzlesSolved}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Failed</span>
                  <span className="font-bold text-red-400">{run.puzzlesFailed}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Best Streak</span>
                  <span className="font-bold text-orange-400">{run.bestStreak}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Coins</span>
                  <span className="font-bold text-amber-400">{run.coins}</span>
                </div>
              </div>

              {/* Abandon run */}
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => { setRun(null); setShowStartScreen(true); }}
                  className="rounded-lg border border-red-500/10 px-4 py-1.5 text-xs text-red-400/60 transition-colors hover:text-red-400 hover:border-red-500/30"
                >
                  Abandon Run
                </button>
              </div>
            </div>
          )}

          {/* Battle — full-width board, no map */}
          {run.status === "battle" && loading && (
            <div className="text-center min-h-[400px] flex flex-col items-center justify-center">
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

          {/* Perk selection */}
          {run.status === "perk-select" && (
            <PerkSelect
              choices={run.perkChoices}
              onPick={handlePerkPick}
              onSkip={handlePerkSkip}
            />
          )}

          {/* Mystery event */}
          {run.status === "event" && run.activeEvent && (
            <EventScreen
              event={run.activeEvent}
              onChoice={handleEventChoice}
            />
          )}

          {/* Rest */}
          {run.status === "rest" && (
            <RestScreen
              stats={run.stats}
              onHeal={() => handleRest("heal")}
              onUpgrade={() => handleRest("upgrade")}
            />
          )}

          {/* Shop */}
          {run.status === "shop" && (
            <ShopScreen
              coins={run.coins}
              stats={run.stats}
              onBuy={handleShopBuy}
              onLeave={() => setRun({ ...run, status: "exploring" })}
            />
          )}
        </div>
      </div>
    </div>
  );
}
