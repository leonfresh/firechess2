"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Chess } from "chess.js";
import { Chessboard } from "@/components/chessboard-compat";
import {
  fetchExplorerMoves,
  type ExplorerResult,
} from "@/lib/lichess-explorer";
import {
  useBoardTheme,
  useCustomPieces,
  useShowCoordinates,
} from "@/lib/use-coins";
import type { AnalysisSource } from "@/lib/client-analysis";
import { stockfishClient } from "@/lib/stockfish-client";

/* ── Constants ─────────────────────────────────────────────────────── */

const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const DEFAULT_MAX_GAMES = 100;
const DEFAULT_MAX_DEPTH = 15; // plies

/* ── Types ─────────────────────────────────────────────────────────── */

type PlayerColor = "white" | "black";
type ColorFilter = "both" | "white" | "black";
type ScanState = "idle" | "fetching" | "building" | "done" | "error";

type SourceGame = {
  moveSans: string[];
  whiteName: string;
  blackName: string;
  winner: "white" | "black" | "draw" | undefined;
  openingName?: string;
};

type TreeNode = {
  san: string;
  uci: string;
  fenBefore: string;
  fenAfter: string;
  count: number;
  wins: number;
  draws: number;
  losses: number;
  depth: number; // 0-indexed ply
  children: Map<string, TreeNode>;
};

/* ── Game fetching ─────────────────────────────────────────────────── */

async function fetchLichessGames(
  username: string,
  maxGames: number,
  onProgress?: (n: number) => void,
): Promise<SourceGame[]> {
  const url =
    `https://lichess.org/api/games/user/${encodeURIComponent(username)}` +
    `?max=${maxGames}&moves=true&tags=false&opening=true&clocks=false&evals=false&pgnInJson=false`;

  const response = await fetch(url, {
    headers: { Accept: "application/x-ndjson" },
  });
  if (!response.ok) throw new Error(`Lichess API error ${response.status}`);

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  const games: SourceGame[] = [];
  let buffer = "";

  const parseLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      const g = JSON.parse(trimmed) as {
        moves?: string;
        winner?: string;
        status?: string;
        players?: {
          white?: { user?: { name?: string } };
          black?: { user?: { name?: string } };
        };
        opening?: { name?: string };
      };
      if (!g.moves) return;
      let winner: "white" | "black" | "draw" | undefined;
      if (g.winner === "white") winner = "white";
      else if (g.winner === "black") winner = "black";
      else if (g.status && !["started", "created"].includes(g.status))
        winner = "draw";
      games.push({
        moveSans: g.moves.trim().split(/\s+/),
        whiteName: g.players?.white?.user?.name ?? "",
        blackName: g.players?.black?.user?.name ?? "",
        winner,
        openingName: g.opening?.name,
      });
      onProgress?.(games.length);
    } catch {
      /* skip malformed */
    }
  };

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) parseLine(line);
      if (games.length >= maxGames) {
        reader.cancel();
        break;
      }
    }
    if (buffer.trim()) parseLine(buffer);
  } else {
    const text = await response.text();
    for (const line of text.split("\n")) parseLine(line);
  }

  return games.slice(0, maxGames);
}

async function fetchChessComGames(
  username: string,
  maxGames: number,
  onProgress?: (n: number) => void,
): Promise<SourceGame[]> {
  const baseUrl = `https://api.chess.com/pub/player/${encodeURIComponent(username)}/games`;
  const archivesResp = await fetch(`${baseUrl}/archives`);
  if (!archivesResp.ok)
    throw new Error(`Chess.com API error ${archivesResp.status}`);
  const { archives = [] } = (await archivesResp.json()) as {
    archives?: string[];
  };

  const reversed = [...archives].reverse();
  const games: SourceGame[] = [];

  for (const archiveUrl of reversed) {
    if (games.length >= maxGames) break;
    const resp = await fetch(archiveUrl);
    if (!resp.ok) continue;
    const data = (await resp.json()) as {
      games?: Array<{
        pgn?: string;
        white?: { username?: string };
        black?: { username?: string };
      }>;
    };
    const archiveGames = [...(data.games ?? [])].reverse();
    for (const g of archiveGames) {
      if (games.length >= maxGames) break;
      if (!g.pgn) continue;
      try {
        const chess = new Chess();
        chess.loadPgn(g.pgn, { strict: false });
        const moveSans = chess.history();
        if (!moveSans.length) continue;
        const resultMatch = g.pgn.match(/\[Result\s+"([^"]+)"\]/);
        const result = resultMatch?.[1] ?? "*";
        let winner: "white" | "black" | "draw" | undefined;
        if (result === "1-0") winner = "white";
        else if (result === "0-1") winner = "black";
        else if (result === "1/2-1/2") winner = "draw";
        const openingMatch =
          g.pgn.match(/\[Opening\s+"([^"]+)"\]/) ??
          g.pgn.match(/\[ECOUrl\s+"[^"]*\/([^"]+)"\]/);
        games.push({
          moveSans,
          whiteName: g.white?.username ?? "",
          blackName: g.black?.username ?? "",
          winner,
          openingName: openingMatch?.[1]?.replace(/-/g, " "),
        });
        onProgress?.(games.length);
      } catch {
        /* skip malformed */
      }
    }
  }

  return games.slice(0, maxGames);
}

/* ── Tree builder ──────────────────────────────────────────────────── */

function buildTree(
  games: SourceGame[],
  username: string,
  colorFilter: ColorFilter,
  maxDepth: number,
): Map<string, TreeNode> {
  const root = new Map<string, TreeNode>();
  const norm = username.toLowerCase();

  for (const game of games) {
    const isWhite = game.whiteName.toLowerCase() === norm;
    const isBlack = game.blackName.toLowerCase() === norm;
    if (!isWhite && !isBlack) continue;

    const playerColor: PlayerColor = isWhite ? "white" : "black";
    if (colorFilter !== "both" && playerColor !== colorFilter) continue;

    const outcome =
      game.winner === playerColor
        ? "win"
        : game.winner === "draw"
          ? "draw"
          : "loss";

    const chess = new Chess();
    let currentMap = root;

    for (let i = 0; i < game.moveSans.length && i < maxDepth; i++) {
      const token = game.moveSans[i];
      const fenBefore = chess.fen();

      try {
        const mv = chess.move(token);
        if (!mv) break;

        const san = mv.san;
        const uci = mv.from + mv.to + (mv.promotion ?? "");
        const fenAfter = chess.fen();

        let node = currentMap.get(san);
        if (!node) {
          node = {
            san,
            uci,
            fenBefore,
            fenAfter,
            count: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            depth: i,
            children: new Map(),
          };
          currentMap.set(san, node);
        }

        node.count++;
        if (outcome === "win") node.wins++;
        else if (outcome === "draw") node.draws++;
        else node.losses++;

        currentMap = node.children;
      } catch {
        break;
      }
    }
  }

  return root;
}

/* ── Navigation helpers ─────────────────────────────────────────────── */

function getFenAtPath(path: string[]): string {
  if (!path.length) return INITIAL_FEN;
  const chess = new Chess();
  for (const san of path) {
    try {
      chess.move(san);
    } catch {
      break;
    }
  }
  return chess.fen();
}

function getSideToMoveAtFen(fen: string): PlayerColor {
  return fen.split(" ")[1] === "w" ? "white" : "black";
}

/* ── Visual Tree Layout ─────────────────────────────────────────────── */

const VT_NODE_W = 80;
const VT_NODE_H = 40;
const VT_COL_W = 120; // column stride (left-edge to left-edge)
const VT_ROW_SZ = 48; // vertical pixels per leaf slot
const VT_MX = 14; // horizontal margin
const VT_MY = 28; // top margin (room for depth labels)
const VT_MAX_CH = 3; // max children shown per node
const VT_MAX_D = 8; // default visible depth — deeper nodes expand on click

type VTNode = {
  node: TreeNode;
  path: string[];
  cx: number;
  cy: number;
};

type VTEdge = {
  from: VTNode;
  to: VTNode;
  frac: number; // 0-1, relative to global max count (for stroke width)
  wr: number; // 0-1 win rate of destination node
  onPath: boolean; // true when this edge is on the selected path
};

function buildVTLayout(
  tree: Map<string, TreeNode>,
  selectedPath: string[],
  expandedPaths: Set<string>,
): { nodes: VTNode[]; edges: VTEdge[]; W: number; H: number } {
  const nodes: VTNode[] = [];
  const edges: VTEdge[] = [];

  // Find global max count for proportional edge widths
  let globalMax = 1;
  const scanMax = (m: Map<string, TreeNode>) => {
    for (const n of m.values()) {
      if (n.count > globalMax) globalMax = n.count;
      scanMax(n.children);
    }
  };
  scanMax(tree);

  // Count leaf slots occupied by a subtree rooted at `map`, starting at `depth`
  const countSlots = (
    m: Map<string, TreeNode>,
    depth: number,
    parentPath: string[],
  ): number => {
    if (depth >= VT_MAX_D && !expandedPaths.has(parentPath.join(","))) return 1;
    const top = [...m.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, VT_MAX_CH);
    if (!top.length) return 1;
    return top.reduce(
      (s, c) => s + countSlots(c.children, depth + 1, [...parentPath, c.san]),
      0,
    );
  };

  let totalSlots = 0;

  // Recursive layout: places nodes into the SVG coordinate space
  const layout = (
    m: Map<string, TreeNode>,
    depth: number,
    slotOffset: number, // cumulative slot offset from top
    parent: VTNode | null,
    prefix: string[],
  ): void => {
    const top = [...m.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, VT_MAX_CH);
    if (!top.length) return;
    if (depth >= VT_MAX_D && !expandedPaths.has(prefix.join(","))) return;

    let off = slotOffset;
    for (const ch of top) {
      const slots = countSlots(ch.children, depth + 1, [...prefix, ch.san]);
      const cx = VT_MX + depth * VT_COL_W + VT_NODE_W / 2;
      const cy = VT_MY + (off + slots / 2) * VT_ROW_SZ;
      const path = [...prefix, ch.san];
      const vn: VTNode = { node: ch, path, cx, cy };
      nodes.push(vn);

      if (parent) {
        const tot = ch.wins + ch.draws + ch.losses;
        const onPath =
          path.length <= selectedPath.length &&
          path.every((s, i) => selectedPath[i] === s);
        edges.push({
          from: parent,
          to: vn,
          frac: Math.max(0.05, ch.count / globalMax),
          wr: tot ? ch.wins / tot : 0.5,
          onPath,
        });
      }

      layout(ch.children, depth + 1, off, vn, path);
      off += slots;
    }
    if (depth === 0) totalSlots = off;
  };

  layout(tree, 0, 0, null, []);

  const maxDepthUsed = nodes.length
    ? nodes.reduce((m2, n) => Math.max(m2, n.node.depth), 0) + 1
    : 0;
  const W = VT_MX * 2 + maxDepthUsed * VT_COL_W + VT_NODE_W;
  const H = VT_MY * 2 + Math.max(1, totalSlots) * VT_ROW_SZ;
  return { nodes, edges, W, H };
}

/* ── Node auto-tagger ───────────────────────────────────────────────── */

function getNodeTag(node: TreeNode): { label: string; color: string } | null {
  const total = node.wins + node.draws + node.losses;
  if (total < 5) return null;
  const wr = node.wins / total;
  if (wr >= 0.65) return { label: "Strong", color: "#10b981" };
  if (wr < 0.35) return { label: "Weak", color: "#ef4444" };
  if (wr < 0.45) return { label: "Study", color: "#f59e0b" };
  return null;
}

/* ── VisualTree SVG component ────────────────────────────────────────── */

const VisualTree = React.memo(function VisualTree({
  tree,
  selectedPath,
  onSelect,
}: {
  tree: Map<string, TreeNode>;
  selectedPath: string[];
  onSelect: (path: string[]) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedPaths, setExpandedPaths] = React.useState<Set<string>>(
    new Set(),
  );
  // ── Pan state ───────────────────────────────────────────────────────────────
  const [spaceHeld, setSpaceHeld] = useState(false);
  const spaceRef = useRef(false); // read in event handlers w/o stale closure
  const panRef = useRef<{
    startX: number;
    startY: number;
    scrollLeft: number;
    scrollTop: number;
  } | null>(null);
  const [grabbing, setGrabbing] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      const tag = (document.activeElement?.tagName ?? "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      spaceRef.current = true;
      setSpaceHeld(true);
      e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      spaceRef.current = false;
      setSpaceHeld(false);
      panRef.current = null;
      setGrabbing(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // Shared pan start helper
  const startPan = useCallback(
    (clientX: number, clientY: number, el: HTMLDivElement) => {
      panRef.current = {
        startX: clientX,
        startY: clientY,
        scrollLeft: el.scrollLeft,
        scrollTop: el.scrollTop,
      };
      setGrabbing(true);
    },
    [],
  );

  const applyPan = useCallback((clientX: number, clientY: number) => {
    if (!panRef.current || !scrollRef.current) return;
    scrollRef.current.scrollLeft =
      panRef.current.scrollLeft - (clientX - panRef.current.startX);
    scrollRef.current.scrollTop =
      panRef.current.scrollTop - (clientY - panRef.current.startY);
  }, []);

  const endPan = useCallback(() => {
    panRef.current = null;
    setGrabbing(false);
  }, []);

  // Overlay (spacebar mode) handlers
  const onOverlayDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = scrollRef.current;
      if (!el) return;
      startPan(e.clientX, e.clientY, el);
      e.currentTarget.setPointerCapture(e.pointerId);
      e.preventDefault();
    },
    [startPan],
  );

  // Scroll-container empty-area drag handlers (no spacebar needed)
  const onContainerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (spaceRef.current) return; // overlay handles it
      const isOnNode = (e.target as Element).closest("[data-vtnode]") !== null;
      if (isOnNode) return;
      const el = scrollRef.current;
      if (!el) return;
      startPan(e.clientX, e.clientY, el);
      e.currentTarget.setPointerCapture(e.pointerId);
      e.preventDefault();
    },
    [startPan],
  );

  const { nodes, edges, W, H } = useMemo(
    () => buildVTLayout(tree, selectedPath, expandedPaths),
    [tree, selectedPath, expandedPaths],
  );

  // Auto-scroll to keep the selected node centred in the viewport
  useEffect(() => {
    if (!scrollRef.current || !selectedPath.length) return;
    const sel = nodes.find(
      (n) =>
        n.path.length === selectedPath.length &&
        n.path.every((s, i) => selectedPath[i] === s),
    );
    if (!sel) return;
    const el = scrollRef.current;
    el.scrollTo({
      left: Math.max(0, sel.cx - el.clientWidth / 2),
      top: Math.max(0, sel.cy - el.clientHeight / 2),
      behavior: "smooth",
    });
  }, [selectedPath, nodes]);

  if (!nodes.length) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-slate-600">
        No moves found for this filter
      </div>
    );
  }

  return (
    <div style={{ height: "100%", position: "relative" }}>
      {/* Scroll & pan container */}
      <div
        ref={scrollRef}
        className="overflow-auto overscroll-contain"
        style={{ height: "100%", cursor: grabbing ? "grabbing" : "default" }}
        onPointerDown={onContainerDown}
        onPointerMove={(e) => applyPan(e.clientX, e.clientY)}
        onPointerUp={endPan}
        onPointerCancel={endPan}
      >
        <svg
          width={W}
          height={Math.max(H, 200)}
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: "block" }}
        >
          <defs>
            {/* Glow filter for selected nodes / path edges */}
            <filter id="vtGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation="3.5"
                result="blurred"
              />
              <feMerge>
                <feMergeNode in="blurred" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Subtle node shadow */}
            <filter id="vtShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow
                dx="0"
                dy="2"
                stdDeviation="4"
                floodColor="#000"
                floodOpacity="0.5"
              />
            </filter>
            {/* Glow for selected node halo */}
            <filter id="nodeHalo" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation="6"
                result="blur"
              />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Subtle vertical guide lines per column */}
          {Array.from(new Set(nodes.map((n) => n.node.depth)))
            .sort((a, b) => a - b)
            .map((d) => {
              const x = VT_MX + d * VT_COL_W + VT_NODE_W / 2;
              return (
                <line
                  key={d}
                  x1={x}
                  y1={VT_MY - 4}
                  x2={x}
                  y2={Math.max(H, 200)}
                  stroke="#1e293b"
                  strokeWidth={1}
                  strokeDasharray="3 7"
                />
              );
            })}

          {/* Column depth labels */}
          {Array.from(new Set(nodes.map((n) => n.node.depth)))
            .sort((a, b) => a - b)
            .map((d) => {
              const x = VT_MX + d * VT_COL_W + VT_NODE_W / 2;
              const isWhite = d % 2 === 0;
              const mNum = Math.floor(d / 2) + 1;
              const label = isWhite ? `${mNum}. White` : `${mNum}… Black`;
              const badgeW = 48;
              return (
                <g key={d}>
                  <rect
                    x={x - badgeW / 2}
                    y={3}
                    width={badgeW}
                    height={13}
                    rx={6}
                    fill={
                      isWhite ? "rgba(248,250,252,0.06)" : "rgba(30,41,59,0.5)"
                    }
                  />
                  <text
                    x={x}
                    y={13}
                    textAnchor="middle"
                    fill={isWhite ? "#94a3b8" : "#64748b"}
                    fontSize={7}
                    fontWeight="600"
                    fontFamily="ui-sans-serif, system-ui, sans-serif"
                    letterSpacing={0.4}
                  >
                    {label}
                  </text>
                </g>
              );
            })}

          {/* Edges — drawn beneath nodes */}
          {edges.map((edge, i) => {
            const x1 = edge.from.cx + VT_NODE_W / 2;
            const y1 = edge.from.cy;
            const x2 = edge.to.cx - VT_NODE_W / 2;
            const y2 = edge.to.cy;
            const dx = x2 - x1;
            const color =
              edge.wr > 0.55
                ? "#10b981"
                : edge.wr < 0.4
                  ? "#ef4444"
                  : "#64748b";
            const sw = edge.onPath
              ? 2.5 + edge.frac * 2
              : 0.8 + edge.frac * 1.8;
            const opacity = edge.onPath ? 0.9 : 0.18 + edge.frac * 0.38;
            return (
              <path
                key={i}
                d={`M ${x1} ${y1} C ${x1 + dx * 0.45} ${y1} ${x2 - dx * 0.45} ${y2} ${x2} ${y2}`}
                fill="none"
                stroke={edge.onPath ? "#10b981" : color}
                strokeWidth={sw}
                opacity={opacity}
                filter={edge.onPath ? "url(#vtGlow)" : undefined}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((vn) => {
            const isSelected =
              vn.path.length === selectedPath.length &&
              vn.path.every((s, i) => selectedPath[i] === s);
            const isAncestor =
              !isSelected &&
              vn.path.length < selectedPath.length &&
              vn.path.every((s, i) => selectedPath[i] === s);

            const nx = vn.cx - VT_NODE_W / 2;
            const ny = vn.cy - VT_NODE_H / 2;
            const tot = vn.node.wins + vn.node.draws + vn.node.losses;
            const wr = tot ? vn.node.wins / tot : 0.5;
            const wp = Math.round(wr * 100);

            // Bottom WDL bar widths (pixels)
            const barInner = VT_NODE_W - 8;
            const winW = tot ? Math.round((vn.node.wins / tot) * barInner) : 0;
            const drawW = tot
              ? Math.round((vn.node.draws / tot) * barInner)
              : 0;
            const lossW = Math.max(0, barInner - winW - drawW);

            // Count badge dimensions
            const countStr =
              vn.node.count >= 1000
                ? `${(vn.node.count / 1000).toFixed(1)}k`
                : String(vn.node.count);
            const badgeFill =
              vn.node.count >= 50
                ? "rgba(16,185,129,0.22)"
                : vn.node.count >= 10
                  ? "rgba(59,130,246,0.2)"
                  : "rgba(71,85,105,0.3)";
            const badgeStroke =
              vn.node.count >= 50
                ? "rgba(16,185,129,0.5)"
                : vn.node.count >= 10
                  ? "rgba(59,130,246,0.45)"
                  : "rgba(71,85,105,0.4)";
            const badgeText =
              vn.node.count >= 50
                ? "#34d399"
                : vn.node.count >= 10
                  ? "#93c5fd"
                  : "#94a3b8";

            const borderColor = isSelected
              ? "#10b981"
              : isAncestor
                ? "#60a5fa"
                : wr > 0.55
                  ? "rgba(16,185,129,0.45)"
                  : wr < 0.4
                    ? "rgba(239,68,68,0.45)"
                    : "rgba(51,65,85,0.9)";

            const bgFill = isSelected
              ? "rgba(16,185,129,0.11)"
              : isAncestor
                ? "rgba(59,130,246,0.07)"
                : "rgba(11,18,35,0.85)";

            const textFill = isSelected
              ? "#6ee7b7"
              : isAncestor
                ? "#93c5fd"
                : "#e2e8f0";

            const isWhiteMove = vn.node.depth % 2 === 0;
            const mNum = Math.floor(vn.node.depth / 2) + 1;
            const prefix = isWhiteMove ? `${mNum}.` : `${mNum}…`;

            const nodeKey = vn.path.join(",");
            const isExpanded = expandedPaths.has(nodeKey);
            const hasHiddenChildren =
              vn.node.children.size > 0 && vn.node.depth >= VT_MAX_D - 1;

            return (
              <g
                key={nodeKey}
                data-vtnode="true"
                onClick={() => {
                  onSelect(vn.path);
                  if (hasHiddenChildren) {
                    setExpandedPaths((prev) => {
                      const next = new Set(prev);
                      if (next.has(nodeKey)) next.delete(nodeKey);
                      else next.add(nodeKey);
                      return next;
                    });
                  }
                }}
                style={{ cursor: "pointer" }}
              >
                {/* Outer glow for selected */}
                {isSelected && (
                  <rect
                    x={nx - 3}
                    y={ny - 3}
                    width={VT_NODE_W + 6}
                    height={VT_NODE_H + 6}
                    rx={8}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth={1.5}
                    opacity={0.25}
                    filter="url(#nodeHalo)"
                  />
                )}

                {/* Main node rect */}
                <rect
                  x={nx}
                  y={ny}
                  width={VT_NODE_W}
                  height={VT_NODE_H}
                  rx={6}
                  fill={bgFill}
                  stroke={borderColor}
                  strokeWidth={isSelected || isAncestor ? 1.5 : 0.8}
                  filter={isSelected ? "url(#vtShadow)" : undefined}
                />

                {/* SAN — main label */}
                <text
                  x={nx + 5}
                  y={ny + 16}
                  fill={textFill}
                  fontSize={11}
                  fontWeight="700"
                  fontFamily="ui-monospace, monospace"
                >
                  {vn.node.san}
                </text>

                {/* Win% (top-right) */}
                <text
                  x={nx + VT_NODE_W - 4}
                  y={ny + 16}
                  fill={
                    wr > 0.55 ? "#6ee7b7" : wr < 0.4 ? "#f87171" : "#64748b"
                  }
                  fontSize={9}
                  fontWeight="600"
                  textAnchor="end"
                  fontFamily="ui-sans-serif, sans-serif"
                >
                  {wp}%
                </text>

                {/* Count badge (small, bottom-right) */}
                {(() => {
                  const bw = countStr.length * 5 + 8;
                  const bx = nx + VT_NODE_W - bw - 3;
                  const by = ny + VT_NODE_H - 18;
                  return (
                    <>
                      <rect
                        x={bx}
                        y={by}
                        width={bw}
                        height={12}
                        rx={6}
                        fill={badgeFill}
                        stroke={badgeStroke}
                        strokeWidth={0.7}
                      />
                      <text
                        x={bx + bw / 2}
                        y={by + 9}
                        fill={badgeText}
                        fontSize={7}
                        fontWeight="700"
                        textAnchor="middle"
                        fontFamily="ui-sans-serif, sans-serif"
                      >
                        {countStr}×
                      </text>
                    </>
                  );
                })()}

                {/* WDL bar strip at bottom of node */}
                <rect
                  x={nx + 4}
                  y={ny + VT_NODE_H - 5}
                  width={barInner}
                  height={4}
                  rx={2}
                  fill="rgba(255,255,255,0.04)"
                />
                {winW > 0 && (
                  <rect
                    x={nx + 4}
                    y={ny + VT_NODE_H - 5}
                    width={winW}
                    height={4}
                    rx={2}
                    fill="#10b981"
                    opacity={0.7}
                  />
                )}
                {drawW > 0 && (
                  <rect
                    x={nx + 4 + winW}
                    y={ny + VT_NODE_H - 5}
                    width={drawW}
                    height={4}
                    fill="#64748b"
                    opacity={0.55}
                  />
                )}
                {lossW > 0 && (
                  <rect
                    x={nx + 4 + winW + drawW}
                    y={ny + VT_NODE_H - 5}
                    width={lossW}
                    height={4}
                    rx={2}
                    fill="#ef4444"
                    opacity={0.4}
                  />
                )}

                {/* Tag indicator — left edge stripe only (no label, too small) */}
                {(() => {
                  const tag = getNodeTag(vn.node);
                  if (!tag) return null;
                  return (
                    <rect
                      x={nx}
                      y={ny + 5}
                      width={3}
                      height={VT_NODE_H - 10}
                      rx={1.5}
                      fill={tag.color}
                      opacity={0.85}
                    />
                  );
                })()}

                {/* Expand badge for nodes with hidden children */}
                {hasHiddenChildren && (
                  <>
                    <rect
                      x={nx + VT_NODE_W / 2 - 8}
                      y={ny + VT_NODE_H + 2}
                      width={16}
                      height={10}
                      rx={5}
                      fill={
                        isExpanded
                          ? "rgba(16,185,129,0.25)"
                          : "rgba(71,85,105,0.4)"
                      }
                      stroke={isExpanded ? "#34d399" : "#64748b"}
                      strokeWidth={0.8}
                    />
                    <text
                      x={nx + VT_NODE_W / 2}
                      y={ny + VT_NODE_H + 10}
                      textAnchor="middle"
                      fill={isExpanded ? "#34d399" : "#94a3b8"}
                      fontSize={8}
                      fontWeight="700"
                      fontFamily="ui-sans-serif, sans-serif"
                    >
                      {isExpanded ? "−" : "+"}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      {/* end scroll container */}
      {/* Spacebar pan overlay — covers the whole tree, blocks node clicks */}
      {spaceHeld && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            cursor: grabbing ? "grabbing" : "grab",
          }}
          onPointerDown={onOverlayDown}
          onPointerMove={(e) => applyPan(e.clientX, e.clientY)}
          onPointerUp={endPan}
          onPointerCancel={endPan}
        />
      )}
    </div>
  );
});

/* ── Dot Tree (compact minimap) ──────────────────────────────────────── */

const DT_R = 6; // dot radius
const DT_COL_W = 28; // column stride (center-to-center)
const DT_ROW_SZ = 18; // vertical pixels per leaf slot
const DT_MX = 14; // horizontal margin
const DT_MY = 22; // top margin (room for depth labels)
const DT_MAX_CH = 4; // max children shown per node
const DT_MAX_D = 14; // show more depth than visual mode

function buildDotLayout(
  tree: Map<string, TreeNode>,
  selectedPath: string[],
): { nodes: VTNode[]; edges: VTEdge[]; W: number; H: number } {
  const nodes: VTNode[] = [];
  const edges: VTEdge[] = [];

  let globalMax = 1;
  const scanMax = (m: Map<string, TreeNode>) => {
    for (const n of m.values()) {
      if (n.count > globalMax) globalMax = n.count;
      scanMax(n.children);
    }
  };
  scanMax(tree);

  const countSlots = (m: Map<string, TreeNode>, depth: number): number => {
    if (depth >= DT_MAX_D) return 1;
    const top = [...m.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, DT_MAX_CH);
    if (!top.length) return 1;
    return top.reduce((s, c) => s + countSlots(c.children, depth + 1), 0);
  };

  let totalSlots = 0;

  const layout = (
    m: Map<string, TreeNode>,
    depth: number,
    slotOffset: number,
    parent: VTNode | null,
    prefix: string[],
  ): void => {
    if (depth >= DT_MAX_D) return;
    const top = [...m.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, DT_MAX_CH);
    if (!top.length) return;

    let off = slotOffset;
    for (const ch of top) {
      const slots = countSlots(ch.children, depth + 1);
      const cx = DT_MX + depth * DT_COL_W + DT_R;
      const cy = DT_MY + (off + slots / 2) * DT_ROW_SZ;
      const path = [...prefix, ch.san];
      const vn: VTNode = { node: ch, path, cx, cy };
      nodes.push(vn);

      if (parent) {
        const tot = ch.wins + ch.draws + ch.losses;
        const onPath =
          path.length <= selectedPath.length &&
          path.every((s, i) => selectedPath[i] === s);
        edges.push({
          from: parent,
          to: vn,
          frac: Math.max(0.05, ch.count / globalMax),
          wr: tot ? ch.wins / tot : 0.5,
          onPath,
        });
      }

      layout(ch.children, depth + 1, off, vn, path);
      off += slots;
    }
    if (depth === 0) totalSlots = off;
  };

  layout(tree, 0, 0, null, []);

  const maxDepthUsed = nodes.length
    ? nodes.reduce((mx, n) => Math.max(mx, n.node.depth), 0) + 1
    : 0;
  const W = DT_MX * 2 + maxDepthUsed * DT_COL_W + DT_R * 2;
  const H = DT_MY * 2 + Math.max(1, totalSlots) * DT_ROW_SZ;
  return { nodes, edges, W, H };
}

const DotTreeView = React.memo(function DotTreeView({
  tree,
  selectedPath,
  onSelect,
}: {
  tree: Map<string, TreeNode>;
  selectedPath: string[];
  onSelect: (path: string[]) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    svgX: number;
    svgY: number;
    vn: VTNode;
  } | null>(null);
  const panRef = useRef<{
    startX: number;
    startY: number;
    scrollLeft: number;
    scrollTop: number;
  } | null>(null);
  const [grabbing, setGrabbing] = useState(false);

  const startPan = useCallback(
    (clientX: number, clientY: number, el: HTMLDivElement) => {
      panRef.current = {
        startX: clientX,
        startY: clientY,
        scrollLeft: el.scrollLeft,
        scrollTop: el.scrollTop,
      };
      setGrabbing(true);
    },
    [],
  );

  const applyPan = useCallback((clientX: number, clientY: number) => {
    if (!panRef.current || !scrollRef.current) return;
    scrollRef.current.scrollLeft =
      panRef.current.scrollLeft - (clientX - panRef.current.startX);
    scrollRef.current.scrollTop =
      panRef.current.scrollTop - (clientY - panRef.current.startY);
  }, []);

  const endPan = useCallback(() => {
    panRef.current = null;
    setGrabbing(false);
  }, []);

  const onContainerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const isOnNode = (e.target as Element).closest("[data-dtnode]") !== null;
      if (isOnNode) return;
      const el = scrollRef.current;
      if (!el) return;
      startPan(e.clientX, e.clientY, el);
      e.currentTarget.setPointerCapture(e.pointerId);
      e.preventDefault();
    },
    [startPan],
  );

  const { nodes, edges, W, H } = useMemo(
    () => buildDotLayout(tree, selectedPath),
    [tree, selectedPath],
  );

  // Auto-scroll to keep selected node visible
  useEffect(() => {
    if (!scrollRef.current || !selectedPath.length) return;
    const sel = nodes.find(
      (n) =>
        n.path.length === selectedPath.length &&
        n.path.every((s, i) => selectedPath[i] === s),
    );
    if (!sel) return;
    const el = scrollRef.current;
    el.scrollTo({
      left: Math.max(0, sel.cx - el.clientWidth / 2),
      top: Math.max(0, sel.cy - el.clientHeight / 2),
      behavior: "smooth",
    });
  }, [selectedPath, nodes]);

  if (!nodes.length) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-slate-600">
        No moves found for this filter
      </div>
    );
  }

  return (
    <div style={{ height: "100%", position: "relative" }}>
      <div
        ref={scrollRef}
        className="overflow-auto overscroll-contain"
        style={{ height: "100%", cursor: grabbing ? "grabbing" : "default" }}
        onPointerDown={onContainerDown}
        onPointerMove={(e) => {
          applyPan(e.clientX, e.clientY);
        }}
        onPointerUp={endPan}
        onPointerCancel={endPan}
      >
        <svg
          width={W}
          height={Math.max(H, 120)}
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: "block" }}
          onMouseLeave={() => setTooltip(null)}
        >
          <defs>
            <filter id="dtGlow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation="3.5"
                result="blurred"
              />
              <feMerge>
                <feMergeNode in="blurred" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Depth column labels */}
          {Array.from(new Set(nodes.map((n) => n.node.depth)))
            .sort((a, b) => a - b)
            .map((d) => {
              const x = DT_MX + d * DT_COL_W + DT_R;
              const isWhite = d % 2 === 0;
              const mNum = Math.floor(d / 2) + 1;
              return (
                <text
                  key={d}
                  x={x}
                  y={13}
                  textAnchor="middle"
                  fill={isWhite ? "#475569" : "#334155"}
                  fontSize={6}
                  fontWeight="600"
                  fontFamily="ui-sans-serif, system-ui, sans-serif"
                >
                  {isWhite ? `${mNum}W` : `${mNum}B`}
                </text>
              );
            })}

          {/* Edges */}
          {edges.map((edge, i) => {
            const x1 = edge.from.cx + DT_R;
            const y1 = edge.from.cy;
            const x2 = edge.to.cx - DT_R;
            const y2 = edge.to.cy;
            const color =
              edge.wr >= 0.55
                ? "#10b981"
                : edge.wr < 0.4
                  ? "#ef4444"
                  : "#64748b";
            const sw = edge.onPath
              ? 1.5 + edge.frac * 1.5
              : 0.5 + edge.frac * 0.8;
            const opacity = edge.onPath ? 0.9 : 0.12 + edge.frac * 0.28;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={edge.onPath ? "#10b981" : color}
                strokeWidth={sw}
                opacity={opacity}
              />
            );
          })}

          {/* Dots */}
          {nodes.map((vn) => {
            const isSelected =
              vn.path.length === selectedPath.length &&
              vn.path.every((s, i) => selectedPath[i] === s);
            const isAncestor =
              !isSelected &&
              vn.path.length < selectedPath.length &&
              vn.path.every((s, i) => selectedPath[i] === s);

            const tot = vn.node.wins + vn.node.draws + vn.node.losses;
            const wr = tot ? vn.node.wins / tot : 0.5;
            const dotFill =
              tot < 3
                ? "#1e293b"
                : wr >= 0.55
                  ? "#10b981"
                  : wr >= 0.48
                    ? "#eab308"
                    : wr >= 0.4
                      ? "#f97316"
                      : "#ef4444";

            const strokeColor = isSelected
              ? "#ffffff"
              : isAncestor
                ? "#93c5fd"
                : "rgba(0,0,0,0.35)";
            const r = isSelected ? DT_R + 2 : DT_R;
            const nodeKey = vn.path.join(",");

            return (
              <g
                key={nodeKey}
                data-dtnode="true"
                style={{ cursor: "pointer" }}
                onClick={() => onSelect(vn.path)}
                onMouseEnter={() =>
                  setTooltip({ svgX: vn.cx, svgY: vn.cy, vn })
                }
                onMouseLeave={() => setTooltip(null)}
              >
                {/* Selected glow halo */}
                {isSelected && (
                  <circle
                    cx={vn.cx}
                    cy={vn.cy}
                    r={r + 5}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth={1}
                    opacity={0.3}
                    filter="url(#dtGlow)"
                  />
                )}
                <circle
                  cx={vn.cx}
                  cy={vn.cy}
                  r={r}
                  fill={dotFill}
                  stroke={strokeColor}
                  strokeWidth={isSelected || isAncestor ? 1.5 : 0.7}
                  opacity={tot < 3 ? 0.35 : 0.92}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Floating tooltip — portal-style absolute overlay */}
      {tooltip &&
        (() => {
          const { svgX, svgY, vn } = tooltip;
          const scrollLeft = scrollRef.current?.scrollLeft ?? 0;
          const scrollTop = scrollRef.current?.scrollTop ?? 0;
          const tot = vn.node.wins + vn.node.draws + vn.node.losses;
          const wr = tot ? Math.round((vn.node.wins / tot) * 100) : 0;
          const isWhiteMove = vn.node.depth % 2 === 0;
          const mNum = Math.floor(vn.node.depth / 2) + 1;
          const prefix = isWhiteMove ? `${mNum}.` : `${mNum}…`;
          const color =
            tot < 3
              ? "#94a3b8"
              : wr >= 55
                ? "#34d399"
                : wr >= 48
                  ? "#fde047"
                  : wr >= 40
                    ? "#fb923c"
                    : "#f87171";
          return (
            <div
              style={{
                position: "absolute",
                left: svgX - scrollLeft + DT_R + 10,
                top: svgY - scrollTop - 24,
                pointerEvents: "none",
                zIndex: 20,
              }}
              className="rounded-lg border border-white/[0.13] bg-slate-900/95 px-2.5 py-1.5 shadow-xl backdrop-blur-sm"
            >
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-xs font-bold text-slate-100">
                  {prefix}
                  {vn.node.san}
                </span>
                {tot >= 3 && (
                  <span className="text-[11px] font-semibold" style={{ color }}>
                    {wr}%
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-[10px] text-slate-500">
                {tot >= 3
                  ? `${vn.node.wins}W · ${vn.node.draws}D · ${vn.node.losses}L`
                  : `${vn.node.count} game${vn.node.count !== 1 ? "s" : ""} (too few)`}
              </div>
            </div>
          );
        })()}

      {/* Legend */}
      <div className="pointer-events-none absolute bottom-2 left-2 flex flex-wrap items-center gap-2 rounded-lg border border-white/[0.06] bg-slate-950/80 px-2.5 py-1 backdrop-blur-sm">
        {(
          [
            { fill: "#10b981", label: "≥55%" },
            { fill: "#eab308", label: "48–55%" },
            { fill: "#f97316", label: "40–48%" },
            { fill: "#ef4444", label: "<40%" },
            { fill: "#1e293b", label: "few games", dim: true },
          ] as { fill: string; label: string; dim?: boolean }[]
        ).map(({ fill, label, dim }) => (
          <div key={label} className="flex items-center gap-1">
            <svg width={8} height={8} style={{ display: "block" }}>
              <circle
                cx={4}
                cy={4}
                r={4}
                fill={fill}
                opacity={dim ? 0.4 : 0.9}
              />
            </svg>
            <span className="text-[9px] text-slate-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

/* ── Sub-components ─────────────────────────────────────────────────── */

function WinRateBar({
  wins,
  draws,
  losses,
}: {
  wins: number;
  draws: number;
  losses: number;
}) {
  const total = wins + draws + losses;
  if (!total) return null;
  const wp = (wins / total) * 100;
  const dp = (draws / total) * 100;
  const lp = (losses / total) * 100;
  return (
    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
      <div
        style={{ width: `${wp}%` }}
        className="bg-emerald-500/70 transition-all"
      />
      <div
        style={{ width: `${dp}%` }}
        className="bg-slate-500/50 transition-all"
      />
      <div
        style={{ width: `${lp}%` }}
        className="bg-red-500/50 transition-all"
      />
    </div>
  );
}

function TreeNodeRow({
  node,
  path,
  selectedPath,
  onSelect,
  indent,
  username,
  norm,
}: {
  node: TreeNode;
  path: string[];
  selectedPath: string[];
  onSelect: (path: string[]) => void;
  indent: number;
  username: string;
  norm: string;
}) {
  const isSelected =
    selectedPath.length === path.length &&
    selectedPath.every((s, i) => s === path[i]);

  const isAncestor =
    path.length < selectedPath.length &&
    path.every((s, i) => s === selectedPath[i]);

  const [expanded, setExpanded] = useState(isAncestor || isSelected);

  // Auto-expand if this node is on the selected path
  useEffect(() => {
    if (isAncestor || isSelected) setExpanded(true);
  }, [isAncestor, isSelected]);

  const sortedChildren = useMemo(
    () => [...node.children.values()].sort((a, b) => b.count - a.count),
    [node.children],
  );

  const total = node.wins + node.draws + node.losses;
  const winRate = total ? Math.round((node.wins / total) * 100) : 0;
  const isWhiteMove = node.depth % 2 === 0;
  const moveNum = Math.floor(node.depth / 2) + 1;
  const prefix = isWhiteMove ? `${moveNum}.` : `${moveNum}…`;

  const winColor =
    winRate >= 55
      ? "text-emerald-400"
      : winRate <= 40
        ? "text-red-400"
        : "text-slate-400";

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          onSelect(path);
          if (sortedChildren.length > 0) setExpanded((e) => !e);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onSelect(path);
            if (sortedChildren.length > 0) setExpanded((ex) => !ex);
          }
        }}
        className={`flex cursor-pointer select-none items-center gap-1.5 rounded-lg py-1 pr-2 text-sm transition-colors ${
          isSelected
            ? "bg-emerald-500/15 text-emerald-300"
            : isAncestor
              ? "bg-white/[0.03] text-slate-300"
              : "hover:bg-white/[0.04] text-slate-400 hover:text-slate-200"
        }`}
        style={{ paddingLeft: `${6 + indent * 14}px` }}
      >
        {/* Expand icon */}
        <span className="w-3 shrink-0 text-center text-[10px] text-slate-600">
          {sortedChildren.length > 0 ? (expanded ? "▾" : "▸") : "·"}
        </span>

        {/* Move notation */}
        <span className="font-mono text-xs">
          <span className="text-slate-600">{prefix}</span>
          <span
            className={`font-semibold ${isSelected ? "text-emerald-300" : ""}`}
          >
            {node.san}
          </span>
        </span>

        {/* Spacer */}
        <span className="flex-1" />

        {/* Count */}
        <span className="text-[11px] tabular-nums text-slate-500">
          {node.count}×
        </span>

        {/* Win% */}
        <span
          className={`text-[11px] tabular-nums font-medium ${winColor} min-w-[30px] text-right`}
        >
          {winRate}%
        </span>

        {/* Auto-tag badge */}
        {(() => {
          const tag = getNodeTag(node);
          if (!tag) return null;
          const bg =
            tag.color === "#10b981"
              ? "bg-emerald-500/15 text-emerald-400"
              : tag.color === "#ef4444"
                ? "bg-red-500/15 text-red-400"
                : "bg-amber-500/15 text-amber-400";
          return (
            <span
              className={`ml-1 shrink-0 rounded px-1 py-0.5 text-[9px] font-bold ${bg}`}
            >
              {tag.label}
            </span>
          );
        })()}
      </div>

      {/* Win rate bar (when selected) */}
      {isSelected && total > 0 && (
        <div
          className="pb-1 pt-0.5"
          style={{ paddingLeft: `${22 + indent * 14}px`, paddingRight: "8px" }}
        >
          <WinRateBar
            wins={node.wins}
            draws={node.draws}
            losses={node.losses}
          />
          <div className="mt-0.5 flex justify-between text-[10px] text-slate-600">
            <span>{node.wins}W</span>
            <span>{node.draws}D</span>
            <span>{node.losses}L</span>
          </div>
        </div>
      )}

      {/* Children */}
      {expanded && sortedChildren.length > 0 && (
        <div>
          {sortedChildren.map((child) => (
            <TreeNodeRow
              key={child.san}
              node={child}
              path={[...path, child.san]}
              selectedPath={selectedPath}
              onSelect={onSelect}
              indent={indent + 1}
              username={username}
              norm={norm}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Explorer panel ─────────────────────────────────────────────────── */

function ExplorerPanel({
  explorerData,
  loading,
  userTopMove,
}: {
  explorerData: ExplorerResult | null;
  loading: boolean;
  userTopMove: string | null;
}) {
  if (loading) {
    return (
      <div className="space-y-2 py-2 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-4 w-full rounded bg-white/[0.06]" />
          </div>
        ))}
      </div>
    );
  }

  if (!explorerData || !explorerData.moves.length) {
    return (
      <p className="py-2 text-center text-xs text-slate-600">
        {explorerData?.failed
          ? "Explorer data unavailable right now"
          : "Out of opening book"}
      </p>
    );
  }

  const top3 = explorerData.moves.slice(0, 6);

  return (
    <div className="space-y-1">
      {explorerData.openingName && (
        <p className="mb-2 truncate text-xs text-slate-500">
          {explorerData.openingName}
        </p>
      )}
      <div className="space-y-1">
        {top3.map((move) => {
          const total = move.white + move.draws + move.black;
          const wp = total ? Math.round((move.white / total) * 100) : 0;
          const dp = total ? Math.round((move.draws / total) * 100) : 0;
          const lp = total ? Math.round((move.black / total) * 100) : 0;
          const isTopPick = explorerData.topPick?.san === move.san;
          const isUserMove = userTopMove === move.san;

          return (
            <div
              key={move.san}
              className={`rounded-lg border px-3 py-2 ${
                isTopPick && isUserMove
                  ? "border-emerald-500/25 bg-emerald-500/10"
                  : isTopPick
                    ? "border-blue-500/20 bg-blue-500/08"
                    : isUserMove
                      ? "border-amber-500/20 bg-amber-500/08"
                      : "border-white/[0.05] bg-white/[0.02]"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold text-slate-200">
                  {move.san}
                </span>
                {isTopPick && (
                  <span className="rounded px-1 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-300">
                    DB best
                  </span>
                )}
                {isUserMove && !isTopPick && (
                  <span className="rounded px-1 py-0.5 text-[10px] font-bold bg-amber-500/15 text-amber-400">
                    your pick
                  </span>
                )}
                <span className="ml-auto text-xs tabular-nums text-slate-500">
                  {move.totalGames >= 1000
                    ? `${(move.totalGames / 1000).toFixed(0)}k`
                    : move.totalGames}{" "}
                  games
                </span>
              </div>
              <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
                <div
                  style={{ width: `${wp}%` }}
                  className="bg-white/60 transition-all"
                />
                <div
                  style={{ width: `${dp}%` }}
                  className="bg-slate-500/50 transition-all"
                />
                <div
                  style={{ width: `${lp}%` }}
                  className="bg-zinc-800/80 transition-all"
                />
              </div>
              <div className="mt-0.5 flex justify-between text-[10px] text-slate-600">
                <span>{wp}%</span>
                <span>{dp}%</span>
                <span>{lp}%</span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="pt-1 text-right text-[10px] text-slate-600">
        Lichess master games
      </p>
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────────────── */

/* ── Draggable floating board panel ─────────────────────────────────── */

interface DraggablePanelProps {
  currentFen: string;
  boardOrientation: "white" | "black";
  squareStyles: Record<string, React.CSSProperties>;
  customPieces: ReturnType<typeof useCustomPieces>;
  showCoords: boolean;
  boardTheme: ReturnType<typeof useBoardTheme>;
  selectedPath: string[];
  sideToMove: "white" | "black";
  explorerData: ExplorerResult | null;
  explorerLoading: boolean;
  currentNodeChildren: TreeNode[];
  userTopMove: string | null;
  sfBestMove: string | null;
  sfLoading: boolean;
  boardArrows: [string, string, string][];
  onClose: () => void;
  onSelectMove: (san: string) => void;
}

function DraggablePanel({
  currentFen,
  boardOrientation,
  squareStyles,
  customPieces,
  showCoords,
  boardTheme,
  selectedPath,
  sideToMove,
  explorerData,
  explorerLoading,
  currentNodeChildren,
  userTopMove,
  sfBestMove,
  sfLoading,
  boardArrows,
  onClose,
  onSelectMove,
}: DraggablePanelProps) {
  /* ── Detect mobile ── */
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* ── Desktop drag state ── */
  const [pos, setPos] = useState({ x: 20, y: 80 });
  const dragRef = useRef<{
    sx: number;
    sy: number;
    ox: number;
    oy: number;
  } | null>(null);

  useEffect(() => {
    if (!isMobile) setPos({ x: Math.max(20, window.innerWidth - 420), y: 80 });
  }, [isMobile]);

  const onHandlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isMobile) return;
      const ox = pos.x,
        oy = pos.y;
      dragRef.current = { sx: e.clientX, sy: e.clientY, ox, oy };
      const onMove = (ev: PointerEvent) => {
        if (!dragRef.current) return;
        setPos({
          x: Math.max(
            0,
            Math.min(
              dragRef.current.ox + ev.clientX - dragRef.current.sx,
              window.innerWidth - 380,
            ),
          ),
          y: Math.max(
            60,
            Math.min(
              dragRef.current.oy + ev.clientY - dragRef.current.sy,
              window.innerHeight - 60,
            ),
          ),
        });
      };
      const onUp = () => {
        dragRef.current = null;
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
      };
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
      e.currentTarget.setPointerCapture(e.pointerId);
      e.preventDefault();
    },
    [pos.x, pos.y, isMobile],
  );

  /* ── Mobile bottom-sheet swipe-to-dismiss ── */
  const [sheetY, setSheetY] = useState(0);
  const swipeRef = useRef<{ startY: number } | null>(null);

  const onSheetDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    swipeRef.current = { startY: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);
  const onSheetMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!swipeRef.current) return;
    setSheetY(Math.max(0, e.clientY - swipeRef.current.startY));
  }, []);
  const onSheetUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!swipeRef.current) return;
      const dy = e.clientY - swipeRef.current.startY;
      swipeRef.current = null;
      if (dy > 120) {
        onClose();
        setSheetY(0);
      } else {
        setSheetY(0);
      }
    },
    [onClose],
  );

  /* ── Shared panel body ── */
  const panelTitle =
    selectedPath.length > 0
      ? (explorerData?.openingName ?? selectedPath[selectedPath.length - 1])
      : "Starting position";

  const panelBody = (
    <>
      {/* Chessboard */}
      <div className="p-3">
        <Chessboard
          position={currentFen}
          boardOrientation={boardOrientation}
          arePiecesDraggable={false}
          showBoardNotation={showCoords}
          customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
          customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
          customSquareStyles={squareStyles}
          customPieces={customPieces}
          customArrows={boardArrows}
        />
      </div>

      {/* Stockfish indicator */}
      <div className="flex items-center gap-2 px-4 pb-2 text-[11px]">
        {sfLoading ? (
          <>
            <span className="inline-block h-3 w-3 animate-spin rounded-full border border-emerald-500 border-t-transparent" />
            <span className="text-slate-600">Analysing…</span>
          </>
        ) : sfBestMove ? (
          <>
            <span className="font-semibold text-emerald-400">♙</span>
            <span className="text-slate-500">SF best:</span>
            <span className="font-mono font-bold text-emerald-300">
              {sfBestMove.slice(0, 2)}→{sfBestMove.slice(2, 4)}
            </span>
            {boardArrows[0]?.[2] === "#3b82f6" && (
              <span className="ml-1 rounded bg-blue-500/15 px-1 py-0.5 text-[9px] font-bold text-blue-300">
                your move ✓
              </span>
            )}
          </>
        ) : null}
      </div>

      {/* Position info */}
      <div className="flex flex-wrap items-center gap-2 px-4 pb-3 text-xs text-slate-500 border-b border-white/[0.06]">
        {selectedPath.length > 0 ? (
          <>
            <span>
              Move {Math.ceil(selectedPath.length / 2)} ·{" "}
              {sideToMove === "white" ? "White" : "Black"} to move
            </span>
            {explorerData?.openingName && (
              <>
                <span className="text-slate-700">·</span>
                <span className="text-slate-400">
                  {explorerData.openingName}
                </span>
              </>
            )}
          </>
        ) : (
          <span>Starting position · tap a move in the tree to navigate</span>
        )}
      </div>

      {/* Your moves from here */}
      {currentNodeChildren.length > 0 && (
        <div className="p-3 border-b border-white/[0.06]">
          <h4 className="mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Your moves from here
          </h4>
          <div className="space-y-1.5">
            {[...currentNodeChildren]
              .sort((a, b) => b.count - a.count)
              .slice(0, 5)
              .map((child) => {
                const total = child.wins + child.draws + child.losses;
                const wr = total ? Math.round((child.wins / total) * 100) : 0;
                const isTop = child.san === userTopMove;
                const isDbBest = explorerData?.topPick?.san === child.san;
                const moveNum = Math.floor(child.depth / 2) + 1;
                const prefix =
                  child.depth % 2 === 0 ? `${moveNum}.` : `${moveNum}…`;
                return (
                  <button
                    key={child.san}
                    type="button"
                    onClick={() => onSelectMove(child.san)}
                    className={`w-full rounded-lg border px-2.5 py-2 text-left transition-colors ${
                      isTop && isDbBest
                        ? "border-emerald-500/20 bg-emerald-500/08 hover:bg-emerald-500/12"
                        : isDbBest
                          ? "border-blue-500/15 bg-blue-500/05 hover:bg-blue-500/10"
                          : "border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-sm">
                        <span className="text-slate-600">{prefix} </span>
                        <span className="font-semibold text-slate-100">
                          {child.san}
                        </span>
                      </span>
                      {isTop && (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 rounded px-1">
                          top
                        </span>
                      )}
                      {isDbBest && (
                        <span className="text-[10px] font-bold text-blue-300 bg-blue-400/10 rounded px-1">
                          DB best
                        </span>
                      )}
                      <span className="ml-auto text-xs tabular-nums text-slate-500">
                        {child.count}× · {wr}%
                      </span>
                    </div>
                    <div className="mt-1">
                      <WinRateBar
                        wins={child.wins}
                        draws={child.draws}
                        losses={child.losses}
                      />
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* Explorer */}
      <div className="p-3">
        <h4 className="mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Lichess Explorer
        </h4>
        <ExplorerPanel
          explorerData={explorerData}
          loading={explorerLoading}
          userTopMove={userTopMove}
        />
      </div>
    </>
  );

  /* ── Mobile: full-width bottom sheet ── */
  if (isMobile) {
    return (
      <>
        {/* Dim backdrop */}
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        {/* Sheet */}
        <div
          className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl border-t border-white/[0.14] bg-[#0a1628]/98 backdrop-blur-xl shadow-2xl overflow-hidden"
          style={{
            maxHeight: "calc(100dvh - 64px)",
            transform: `translateY(${sheetY}px)`,
            transition: swipeRef.current
              ? "none"
              : "transform 0.22s cubic-bezier(0.32,0.72,0,1)",
          }}
        >
          {/* Swipe handle */}
          <div
            className="shrink-0 select-none pt-2.5 pb-2 px-4 cursor-ns-resize touch-none"
            onPointerDown={onSheetDown}
            onPointerMove={onSheetMove}
            onPointerUp={onSheetUp}
            onPointerCancel={onSheetUp}
          >
            <div className="mx-auto mb-2.5 h-1 w-12 rounded-full bg-white/20" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 truncate max-w-[80%]">
                {panelTitle}
              </span>
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={onClose}
                className="rounded-lg p-1 text-slate-500 hover:bg-white/[0.07] hover:text-white transition-colors"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
          </div>
          {/* Body */}
          <div className="overflow-y-auto flex-1">{panelBody}</div>
        </div>
      </>
    );
  }

  /* ── Desktop: draggable floating panel ── */
  return (
    <div
      className="fixed z-30 w-[380px] rounded-2xl border border-white/[0.12] bg-[#0a1628]/95 backdrop-blur-xl shadow-2xl overflow-hidden"
      style={{ left: pos.x, top: pos.y }}
    >
      {/* Drag handle */}
      <div
        className="flex items-center justify-between px-4 py-2.5 cursor-grab active:cursor-grabbing border-b border-white/[0.07] bg-white/[0.02] select-none"
        onPointerDown={onHandlePointerDown}
      >
        <div className="flex items-center gap-2 min-w-0">
          <svg
            className="h-4 w-4 text-white/20 shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <circle cx="7" cy="4" r="1.5" />
            <circle cx="13" cy="4" r="1.5" />
            <circle cx="7" cy="10" r="1.5" />
            <circle cx="13" cy="10" r="1.5" />
            <circle cx="7" cy="16" r="1.5" />
            <circle cx="13" cy="16" r="1.5" />
          </svg>
          <span className="text-xs font-semibold text-slate-400 truncate">
            {panelTitle}
          </span>
        </div>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onClose}
          className="ml-2 shrink-0 rounded-lg p-1 text-slate-500 hover:bg-white/[0.07] hover:text-white transition-colors"
          aria-label="Close panel"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>
      {/* Body */}
      <div
        className="overflow-y-auto"
        style={{ maxHeight: "calc(100dvh - 160px)" }}
      >
        {panelBody}
      </div>
    </div>
  );
}

function MyOpeningsInner() {
  const searchParams = useSearchParams();
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();
  const showCoords = useShowCoordinates();

  /* form state */
  const [username, setUsername] = useState(
    () => searchParams.get("username") ?? "",
  );
  const [source, setSource] = useState<AnalysisSource>(
    (searchParams.get("source") as AnalysisSource) ?? "lichess",
  );
  const [maxGames, setMaxGames] = useState(DEFAULT_MAX_GAMES);
  const [maxDepth, setMaxDepth] = useState(DEFAULT_MAX_DEPTH);
  const [colorFilter, setColorFilter] = useState<ColorFilter>("both");

  /* scan state */
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [error, setError] = useState("");
  const [gamesFetched, setGamesFetched] = useState(0);
  const [totalGames, setTotalGames] = useState(0);

  /* tree state */
  const [tree, setTree] = useState<Map<string, TreeNode>>(new Map());
  const [selectedPath, setSelectedPath] = useState<string[]>([]);

  /* explorer state */
  const [explorerData, setExplorerData] = useState<ExplorerResult | null>(null);
  const [explorerLoading, setExplorerLoading] = useState(false);

  /* view mode for opening tree panel */
  const [viewMode, setViewMode] = useState<"visual" | "list" | "dots">(
    "visual",
  );

  /* default to list view on mobile (after mount to avoid SSR mismatch) */
  useEffect(() => {
    if (window.innerWidth < 640) setViewMode("list");
  }, []);

  /* floating board panel */
  const [panelOpen, setPanelOpen] = useState(false);

  /* stockfish analysis */
  const [sfBestMove, setSfBestMove] = useState<string | null>(null);
  const [sfLoading, setSfLoading] = useState(false);
  const sfFenRef = useRef<string>("");

  /* derived */
  const currentFen = useMemo(() => getFenAtPath(selectedPath), [selectedPath]);
  const sideToMove = useMemo(
    () => getSideToMoveAtFen(currentFen),
    [currentFen],
  );

  const currentNodeChildren = useMemo(() => {
    if (!selectedPath.length) return [...tree.values()];
    let map = tree;
    let node: TreeNode | undefined;
    for (const san of selectedPath) {
      node = map.get(san);
      if (!node) return [];
      map = node.children;
    }
    return [...(node?.children.values() ?? [])];
  }, [tree, selectedPath]);

  const userTopMove = useMemo(() => {
    const children = currentNodeChildren;
    if (!children.length) return null;
    return [...children].sort((a, b) => b.count - a.count)[0]?.san ?? null;
  }, [currentNodeChildren]);

  const userTopMoveUci = useMemo(() => {
    const sorted = [...currentNodeChildren].sort((a, b) => b.count - a.count);
    return sorted[0]?.uci ?? null;
  }, [currentNodeChildren]);

  /* Stockfish arrows: green = SF best, amber = user's top, blue = both match */
  const boardArrows = useMemo((): [string, string, string][] => {
    const sfFrom = sfBestMove?.slice(0, 2);
    const sfTo = sfBestMove?.slice(2, 4);
    const uFrom = userTopMoveUci?.slice(0, 2);
    const uTo = userTopMoveUci?.slice(2, 4);
    const matches = sfFrom && uFrom && sfFrom === uFrom && sfTo === uTo;
    if (matches) return [[sfFrom!, sfTo!, "#3b82f6"]]; // blue = user plays best
    const arrows: [string, string, string][] = [];
    if (sfFrom && sfTo) arrows.push([sfFrom, sfTo, "#10b981"]); // green = SF best
    if (uFrom && uTo) arrows.push([uFrom, uTo, "#f59e0b"]); // amber = user's move
    return arrows;
  }, [sfBestMove, userTopMoveUci]);

  const rootSorted = useMemo(
    () => [...tree.values()].sort((a, b) => b.count - a.count),
    [tree],
  );

  /* board square styles */
  const squareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};
    // Highlight last move from selected node
    if (selectedPath.length > 0) {
      const node = (() => {
        let map = tree;
        let n: TreeNode | undefined;
        for (const san of selectedPath) {
          n = map.get(san);
          if (!n) return null;
          map = n.children;
        }
        return n ?? null;
      })();
      if (node) {
        const from = node.uci.slice(0, 2);
        const to = node.uci.slice(2, 4);
        styles[from] = { backgroundColor: "rgba(255, 215, 0, 0.18)" };
        styles[to] = { backgroundColor: "rgba(255, 215, 0, 0.30)" };
      }
    }
    return styles;
  }, [selectedPath, tree]);

  /* Auto-start if url has username */
  const autoStarted = useRef(false);
  useEffect(() => {
    const urlUser = searchParams.get("username");
    if (urlUser && !autoStarted.current && scanState === "idle") {
      autoStarted.current = true;
      void runScan(urlUser, source, maxGames, maxDepth, colorFilter);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Fetch explorer on path change */
  useEffect(() => {
    if (scanState !== "done") return;
    setExplorerData(null);
    setExplorerLoading(true);
    fetchExplorerMoves(currentFen, sideToMove)
      .then((data) => setExplorerData(data))
      .catch(() => setExplorerData(null))
      .finally(() => setExplorerLoading(false));
  }, [currentFen, sideToMove, scanState]);

  /* Stockfish best-move analysis */
  useEffect(() => {
    if (scanState !== "done") return;
    setSfBestMove(null);
    setSfLoading(true);
    const thisFen = currentFen;
    sfFenRef.current = thisFen;
    stockfishClient
      .evaluateFen(thisFen, 14)
      .then((result) => {
        if (sfFenRef.current !== thisFen) return;
        setSfBestMove(result?.bestMove ?? null);
      })
      .catch(() => {
        /* silently ignore */
      })
      .finally(() => {
        if (sfFenRef.current === thisFen) setSfLoading(false);
      });
  }, [currentFen, scanState]);

  const runScan = useCallback(
    async (
      user: string,
      src: AnalysisSource,
      games: number,
      depth: number,
      color: ColorFilter,
    ) => {
      if (!user.trim()) return;
      setScanState("fetching");
      setError("");
      setGamesFetched(0);
      setTotalGames(games);
      setTree(new Map());
      setSelectedPath([]);
      setExplorerData(null);

      try {
        const fetched =
          src === "lichess"
            ? await fetchLichessGames(user.trim(), games, (n) =>
                setGamesFetched(n),
              )
            : await fetchChessComGames(user.trim(), games, (n) =>
                setGamesFetched(n),
              );

        setScanState("building");
        // Yield to browser before heavy CPU work
        await new Promise((r) => setTimeout(r, 0));
        const built = buildTree(fetched, user.trim(), color, depth);
        setTree(built);
        setTotalGames(fetched.length);
        setScanState("done");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch games");
        setScanState("error");
      }
    },
    [],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      void runScan(username, source, maxGames, maxDepth, colorFilter);
    },
    [username, source, maxGames, maxDepth, colorFilter, runScan],
  );

  const handleColorChange = useCallback(
    (newColor: ColorFilter) => {
      setColorFilter(newColor);
      if (scanState === "done" && totalGames > 0) {
        // Rebuild tree with new filter
        setScanState("building");
        setTimeout(() => {
          // Re-run scan with cached data won't work directly; just re-scan
          setSelectedPath([]);
          void runScan(username, source, maxGames, maxDepth, newColor);
        }, 0);
      }
    },
    [scanState, totalGames, username, source, maxGames, maxDepth, runScan],
  );

  /* board orientation: use user's color filter, fallback white */
  const boardOrientation: "white" | "black" =
    colorFilter === "black" ? "black" : "white";

  const isLoading = scanState === "fetching" || scanState === "building";
  const isDone = scanState === "done";

  /* ── Render ─────────────────────────────────────────────────────── */

  return (
    <div className="relative min-h-screen bg-[#050a12] text-white overflow-hidden">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-48 left-1/4 h-[500px] w-[500px] rounded-full bg-emerald-500/[0.05] blur-[110px]" />
        <div className="absolute top-1/3 right-1/4 h-80 w-80 rounded-full bg-cyan-500/[0.04] blur-[90px]" />
        <div className="absolute bottom-1/4 left-1/3 h-64 w-64 rounded-full bg-blue-500/[0.04] blur-[80px]" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
            <Link href="/" className="hover:text-slate-300 transition-colors">
              Home
            </Link>
            <span>·</span>
            <span className="text-slate-300">My Openings</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              My Opening Tree
            </span>
          </h1>
          <p className="mt-2 text-slate-400 max-w-2xl">
            See every opening line you&apos;ve played, how often, and your win
            rate — compared to what the Lichess database recommends.
          </p>
        </div>

        {/* Scan form */}
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {/* Source toggle + username */}
            <div className="flex min-w-0 flex-1 items-center gap-0 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.04] pl-1 pr-0">
              {/* Source buttons */}
              <div className="flex shrink-0 gap-0.5 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setSource("lichess")}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                    source === "lichess"
                      ? "bg-white/[0.1] text-white shadow"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Lichess
                </button>
                <button
                  type="button"
                  onClick={() => setSource("chesscom")}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                    source === "chesscom"
                      ? "bg-white/[0.1] text-white shadow"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Chess.com
                </button>
              </div>
              <div className="mx-2 h-4 w-px bg-white/[0.08]" />
              {/* Username input */}
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your username"
                className="flex-1 bg-transparent py-2 pr-3 text-sm text-white placeholder-slate-600 outline-none"
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            {/* Games count + Depth — share a row on mobile */}
            <div className="flex gap-3">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2">
                <span className="text-xs text-slate-500 shrink-0">Games:</span>
                <input
                  type="number"
                  min={10}
                  max={500}
                  step={10}
                  value={maxGames}
                  onChange={(e) => setMaxGames(Number(e.target.value))}
                  className="w-full min-w-0 bg-transparent text-sm text-white outline-none"
                />
              </div>

              <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2">
                <span className="text-xs text-slate-500 shrink-0">Depth:</span>
                <select
                  value={maxDepth}
                  onChange={(e) => setMaxDepth(Number(e.target.value))}
                  className="w-full bg-transparent text-sm text-white outline-none"
                >
                  {[8, 10, 12, 15, 20, 25].map((d) => (
                    <option key={d} value={d} className="bg-slate-900">
                      {d} plies
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Scan button */}
            <button
              type="submit"
              disabled={isLoading || !username.trim()}
              className="w-full rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              {isLoading ? "Scanning…" : "Scan Games"}
            </button>
          </div>
        </form>

        {/* Loading state */}
        {isLoading && (
          <div className="mb-8 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              <span className="text-slate-300 text-sm">
                {scanState === "fetching"
                  ? `Downloading games… (${gamesFetched}/${totalGames})`
                  : "Building opening tree…"}
              </span>
            </div>
            {scanState === "fetching" && totalGames > 0 && (
              <div className="mx-auto max-w-xs">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{
                      width: `${Math.min(100, (gamesFetched / totalGames) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error state */}
        {scanState === "error" && error && (
          <div className="mb-8 rounded-xl border border-red-500/20 bg-red-500/08 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Results */}
        {isDone && (
          <>
            {/* Stats bar */}
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-sm">
                <span className="text-slate-400">
                  <span className="font-semibold text-white">{totalGames}</span>{" "}
                  games scanned
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">
                  <span className="font-semibold text-white">
                    {rootSorted.reduce((s, n) => s + n.count, 0)}
                  </span>{" "}
                  positions mapped
                </span>
              </div>

              {/* Color filter */}
              <div className="flex items-center rounded-lg border border-white/[0.07] bg-white/[0.03] p-0.5">
                {(["both", "white", "black"] as ColorFilter[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleColorChange(c)}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors capitalize ${
                      colorFilter === c
                        ? "bg-white/[0.08] text-white"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {c === "both" ? "Both colors" : `As ${c}`}
                  </button>
                ))}
              </div>

              {/* Reset path */}
              {selectedPath.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedPath([])}
                  className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-xs text-slate-400 transition-colors hover:text-white"
                >
                  ↩ Reset to start
                </button>
              )}
            </div>

            {/* Current path breadcrumb */}
            {selectedPath.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-1 text-sm text-slate-500">
                <button
                  type="button"
                  onClick={() => setSelectedPath([])}
                  className="text-slate-600 hover:text-slate-300 transition-colors"
                >
                  Start
                </button>
                {selectedPath.map((san, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <span className="text-slate-700">›</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedPath(selectedPath.slice(0, i + 1))
                      }
                      className={`font-mono ${
                        i === selectedPath.length - 1
                          ? "text-emerald-400 font-semibold"
                          : "hover:text-slate-300 transition-colors"
                      }`}
                    >
                      {san}
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Main 2-column layout */}
            <div
              className={`grid grid-cols-1 gap-6 ${
                viewMode === "visual" || viewMode === "dots"
                  ? "xl:grid-cols-[1fr_minmax(360px,460px)]"
                  : "lg:grid-cols-[minmax(280px,340px)_1fr]"
              }`}
            >
              {/* ── LEFT: Opening tree ─────────────── */}
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden flex flex-col">
                {/* Tab header */}
                <div className="border-b border-white/[0.06] px-4 py-3 flex items-center gap-3 shrink-0">
                  <div className="flex rounded-lg border border-white/[0.07] bg-white/[0.03] p-0.5 gap-0.5">
                    <button
                      type="button"
                      onClick={() => setViewMode("visual")}
                      className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                        viewMode === "visual"
                          ? "bg-emerald-500/15 text-emerald-300 shadow"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      🌲 Visual
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("dots")}
                      className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                        viewMode === "dots"
                          ? "bg-blue-500/15 text-blue-300 shadow"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      ● Dots
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                        viewMode === "list"
                          ? "bg-white/[0.08] text-slate-200 shadow"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      📋 List
                    </button>
                  </div>
                  {viewMode === "visual" && (
                    <span className="ml-auto text-[10px] text-slate-600">
                      top {VT_MAX_CH}/node · {VT_MAX_D} lvls ·{" "}
                      <span className="hidden sm:inline">hold space or</span>{" "}
                      drag blank area to pan
                    </span>
                  )}
                  {viewMode === "dots" && (
                    <span className="ml-auto text-[10px] text-slate-600">
                      hover dot to inspect · click to select
                    </span>
                  )}
                  {viewMode === "list" && (
                    <span className="ml-auto text-[11px] text-slate-600">
                      {rootSorted.length} first moves
                    </span>
                  )}
                </div>

                {/* Tree content */}
                {viewMode === "visual" ? (
                  <div className="min-h-[200px] bg-[#07101a]">
                    <VisualTree
                      tree={tree}
                      selectedPath={selectedPath}
                      onSelect={setSelectedPath}
                    />
                  </div>
                ) : viewMode === "dots" ? (
                  <div
                    className="min-h-[200px] bg-[#07101a]"
                    style={{ minHeight: 200 }}
                  >
                    <DotTreeView
                      tree={tree}
                      selectedPath={selectedPath}
                      onSelect={(path) => {
                        setSelectedPath(path);
                        if (path.length > 0) setPanelOpen(true);
                      }}
                    />
                  </div>
                ) : (
                  <div className="max-h-[520px] overflow-y-auto p-2 scrollbar-thin">
                    {rootSorted.length === 0 ? (
                      <p className="py-8 text-center text-sm text-slate-600">
                        No games found for this filter
                      </p>
                    ) : (
                      rootSorted.map((node) => (
                        <TreeNodeRow
                          key={node.san}
                          node={node}
                          path={[node.san]}
                          selectedPath={selectedPath}
                          onSelect={setSelectedPath}
                          indent={0}
                          username={username}
                          norm={username.toLowerCase()}
                        />
                      ))
                    )}
                  </div>
                )}

                {/* Legend */}
                <div className="mt-auto border-t border-white/[0.05] px-4 py-2 flex items-center gap-4 text-[10px] text-slate-600 shrink-0">
                  <span>Win rate</span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-1.5 w-3 rounded bg-emerald-500/70" />
                    W
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-1.5 w-3 rounded bg-slate-500/50" />
                    D
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-1.5 w-3 rounded bg-red-500/50" />
                    L
                  </span>
                  {viewMode === "visual" && (
                    <span className="ml-auto flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <span className="inline-block h-px w-6 bg-emerald-500/60" />
                        on path
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="inline-block h-[1px] w-6 bg-slate-500/40" />
                        branch
                      </span>
                    </span>
                  )}
                </div>
              </div>

              {/* ── RIGHT: Board + analysis ────────── */}
              <div className="space-y-4">
                {/* Board */}
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <div className="w-full max-w-[480px] mx-auto">
                    <Chessboard
                      position={currentFen}
                      boardOrientation={boardOrientation}
                      arePiecesDraggable={false}
                      showBoardNotation={showCoords}
                      customDarkSquareStyle={{
                        backgroundColor: boardTheme.darkSquare,
                      }}
                      customLightSquareStyle={{
                        backgroundColor: boardTheme.lightSquare,
                      }}
                      customSquareStyles={squareStyles}
                      customPieces={customPieces}
                    />
                  </div>

                  {/* Position info */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    {selectedPath.length > 0 && (
                      <>
                        <span>
                          Move {Math.ceil(selectedPath.length / 2)} ·{" "}
                          {sideToMove === "white" ? "White" : "Black"} to move
                        </span>
                        {explorerData?.openingName && (
                          <>
                            <span className="text-slate-700">·</span>
                            <span className="text-slate-400">
                              {explorerData.openingName}
                            </span>
                          </>
                        )}
                      </>
                    )}
                    {selectedPath.length === 0 && (
                      <span>
                        Starting position · Click a move in the tree to navigate
                      </span>
                    )}
                  </div>
                </div>

                {/* Your moves from this position */}
                {currentNodeChildren.length > 0 && (
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                    <h3 className="mb-3 text-sm font-semibold text-slate-200">
                      Your moves from here
                    </h3>
                    <div className="space-y-2">
                      {[...currentNodeChildren]
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 6)
                        .map((child) => {
                          const total = child.wins + child.draws + child.losses;
                          const wr = total
                            ? Math.round((child.wins / total) * 100)
                            : 0;
                          const isTop = child.san === userTopMove;
                          const isDbBest =
                            explorerData?.topPick?.san === child.san;
                          const moveNum = Math.floor(child.depth / 2) + 1;
                          const prefix =
                            child.depth % 2 === 0
                              ? `${moveNum}.`
                              : `${moveNum}…`;

                          return (
                            <button
                              key={child.san}
                              type="button"
                              onClick={() =>
                                setSelectedPath([...selectedPath, child.san])
                              }
                              className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                                isTop && isDbBest
                                  ? "border-emerald-500/20 bg-emerald-500/08 hover:bg-emerald-500/12"
                                  : isDbBest
                                    ? "border-blue-500/15 bg-blue-500/05 hover:bg-blue-500/10"
                                    : "border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04]"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm">
                                  <span className="text-slate-600">
                                    {prefix}{" "}
                                  </span>
                                  <span className="font-semibold text-slate-100">
                                    {child.san}
                                  </span>
                                </span>
                                {isTop && (
                                  <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 rounded px-1 py-0.5">
                                    most played
                                  </span>
                                )}
                                {isDbBest && (
                                  <span className="text-[10px] font-bold text-blue-300 bg-blue-400/10 rounded px-1 py-0.5">
                                    DB best
                                  </span>
                                )}
                                <span className="ml-auto text-xs tabular-nums text-slate-500">
                                  {child.count}× · {wr}%
                                </span>
                              </div>
                              <div className="mt-1.5">
                                <WinRateBar
                                  wins={child.wins}
                                  draws={child.draws}
                                  losses={child.losses}
                                />
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Explorer panel */}
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <h3 className="mb-3 text-sm font-semibold text-slate-200">
                    Lichess Explorer
                  </h3>
                  <ExplorerPanel
                    explorerData={explorerData}
                    loading={explorerLoading}
                    userTopMove={userTopMove}
                  />
                </div>
              </div>
            </div>

            {/* ── Bottom CTAs ────────────────────────────────────── */}
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Practice CTA */}
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/05 p-6">
                <div className="mb-1 text-2xl">🎯</div>
                <h3 className="mb-1 text-base font-semibold text-white">
                  Practice These Positions
                </h3>
                <p className="mb-4 text-sm text-slate-400">
                  Drill the openings you play most — reinforce the good moves
                  and fix the mistakes with spaced-repetition puzzles.
                </p>
                <Link
                  href={`/?username=${encodeURIComponent(username)}&source=${source}&scanMode=openings#settings`}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-400 active:scale-95"
                >
                  Run Full Analysis
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
              </div>

              {/* Personalized puzzles CTA */}
              <div className="rounded-2xl border border-purple-500/20 bg-purple-500/05 p-6">
                <div className="mb-1 text-2xl">🧠</div>
                <h3 className="mb-1 text-base font-semibold text-white">
                  Personalized Opening Drill
                </h3>
                <p className="mb-4 text-sm text-slate-400">
                  Upload your games and get quizzed on the exact positions where
                  you make opening mistakes the most.
                </p>
                <Link
                  href="/train"
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-purple-500 active:scale-95"
                >
                  Go to Puzzles & Drills
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </>
        )}

        {/* Idle state — show feature overview */}
        {scanState === "idle" && (
          <div className="space-y-6">
            {/* Visual tree preview hint */}
            <div className="rounded-2xl border border-emerald-500/10 bg-gradient-to-br from-emerald-500/5 to-transparent p-6">
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                {/* Mini SVG tree preview */}
                <div className="shrink-0 overflow-hidden rounded-xl border border-white/[0.06] bg-[#07101a] p-3">
                  <svg
                    width={220}
                    height={120}
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Root */}
                    <rect
                      x={8}
                      y={44}
                      width={64}
                      height={32}
                      rx={6}
                      fill="rgba(16,185,129,0.12)"
                      stroke="#10b981"
                      strokeWidth={1.5}
                    />
                    <text
                      x={16}
                      y={56}
                      fill="#94a3b8"
                      fontSize={8}
                      fontFamily="monospace"
                    >
                      1.
                    </text>
                    <text
                      x={16}
                      y={68}
                      fill="#6ee7b7"
                      fontSize={11}
                      fontWeight="700"
                      fontFamily="monospace"
                    >
                      e4
                    </text>
                    <text
                      x={60}
                      y={56}
                      fill="#374151"
                      fontSize={8}
                      fontFamily="sans-serif"
                      textAnchor="end"
                    >
                      42×
                    </text>
                    <text
                      x={60}
                      y={68}
                      fill="#6ee7b7"
                      fontSize={9}
                      fontWeight="600"
                      fontFamily="sans-serif"
                      textAnchor="end"
                    >
                      58%
                    </text>
                    {/* e4 bottom bar */}
                    <rect
                      x={10}
                      y={70}
                      width={60}
                      height={3}
                      rx={1.5}
                      fill="#10b981"
                      opacity={0.5}
                    />
                    {/* Edge e4→e5 */}
                    <path
                      d="M 72 60 C 90 60 92 36 110 36"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth={2}
                      opacity={0.7}
                    />
                    {/* Edge e4→c5 */}
                    <path
                      d="M 72 60 C 90 60 92 84 110 84"
                      fill="none"
                      stroke="#64748b"
                      strokeWidth={1.5}
                      opacity={0.5}
                    />
                    {/* e5 */}
                    <rect
                      x={110}
                      y={20}
                      width={56}
                      height={32}
                      rx={6}
                      fill="rgba(59,130,246,0.08)"
                      stroke="rgba(59,130,246,0.5)"
                      strokeWidth={1}
                    />
                    <text
                      x={118}
                      y={32}
                      fill="#94a3b8"
                      fontSize={8}
                      fontFamily="monospace"
                    >
                      1…
                    </text>
                    <text
                      x={118}
                      y={44}
                      fill="#93c5fd"
                      fontSize={11}
                      fontWeight="700"
                      fontFamily="monospace"
                    >
                      e5
                    </text>
                    <text
                      x={155}
                      y={44}
                      fill="#374151"
                      fontSize={9}
                      fontWeight="600"
                      fontFamily="sans-serif"
                      textAnchor="end"
                    >
                      61%
                    </text>
                    {/* c5 */}
                    <rect
                      x={110}
                      y={68}
                      width={56}
                      height={32}
                      rx={6}
                      fill="rgba(15,23,42,0.8)"
                      stroke="rgba(51,65,85,0.9)"
                      strokeWidth={0.8}
                    />
                    <text
                      x={118}
                      y={80}
                      fill="#334155"
                      fontSize={8}
                      fontFamily="monospace"
                    >
                      1…
                    </text>
                    <text
                      x={118}
                      y={92}
                      fill="#e2e8f0"
                      fontSize={11}
                      fontWeight="700"
                      fontFamily="monospace"
                    >
                      c5
                    </text>
                    <text
                      x={155}
                      y={92}
                      fill="#94a3b8"
                      fontSize={9}
                      fontWeight="600"
                      fontFamily="sans-serif"
                      textAnchor="end"
                    >
                      52%
                    </text>
                    {/* depth label */}
                    <text
                      x={40}
                      y={10}
                      textAnchor="middle"
                      fill="#1e3a2f"
                      fontSize={7}
                      fontFamily="sans-serif"
                    >
                      1. WHITE
                    </text>
                    <text
                      x={138}
                      y={10}
                      textAnchor="middle"
                      fill="#1e3a2f"
                      fontSize={7}
                      fontFamily="sans-serif"
                    >
                      1. BLACK
                    </text>
                  </svg>
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-lg">🌲</span>
                    <h3 className="text-base font-semibold text-white">
                      Visual Opening Tree
                    </h3>
                    <span className="rounded-full border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      NEW
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 max-w-sm">
                    Enter your username above and scan your games to see an
                    interactive node graph of every opening line you&apos;ve
                    played — with win rates, move frequencies, and Lichess
                    database comparisons.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                {
                  icon: "🔬",
                  title: "Database Comparison",
                  desc: "Compare your moves to the Lichess master game database — discover where you deviate from theory.",
                },
                {
                  icon: "📊",
                  title: "Move Statistics",
                  desc: "See your most-played openings, win rates by line, and positions where you consistently struggle.",
                },
                {
                  icon: "🎯",
                  title: "Practice Weak Lines",
                  desc: "Identify openings where your win rate is low and drill them with targeted puzzles.",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"
                >
                  <div className="mb-2 text-2xl">{f.icon}</div>
                  <h3 className="mb-1 text-sm font-semibold text-white">
                    {f.title}
                  </h3>
                  <p className="text-xs text-slate-500">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── Active overlay: full-viewport below navbar when scanning / done ─── */}
      {scanState !== "idle" && (
        <div
          className="fixed left-0 right-0 bottom-0 z-30 flex flex-col bg-[#050a12] text-white overflow-hidden"
          style={{ top: 60 }}
        >
          {/* Subtle ambient glows */}
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden"
            aria-hidden
          >
            <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-emerald-500/[0.04] blur-[100px]" />
            <div className="absolute bottom-1/4 right-0 h-64 w-64 rounded-full bg-cyan-500/[0.03] blur-[80px]" />
          </div>

          {/* ── Compact toolbar ── */}
          <div className="relative shrink-0 border-b border-white/[0.07] bg-[#050a12]/95 backdrop-blur flex flex-col">
            {/* Row 1: always visible — back link + form */}
            <div className="flex items-center gap-2 px-3 py-2 sm:px-4">
              {/* Back / title */}
              <Link
                href="/"
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors shrink-0"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-3.5 w-3.5"
                >
                  <path
                    fillRule="evenodd"
                    d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="hidden sm:inline font-semibold text-slate-300">
                  Opening Tree
                </span>
              </Link>
              <div className="h-4 w-px bg-white/[0.06] shrink-0" />

              {/* Compact rescan form */}
              <form
                onSubmit={handleSubmit}
                className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0"
              >
                <div className="flex shrink-0 rounded-lg border border-white/[0.08] bg-white/[0.04] p-0.5">
                  <button
                    type="button"
                    onClick={() => setSource("lichess")}
                    className={`rounded-md px-1.5 sm:px-2 py-0.5 text-[11px] font-semibold transition-colors ${source === "lichess" ? "bg-white/[0.1] text-white" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    Lichess
                  </button>
                  <button
                    type="button"
                    onClick={() => setSource("chesscom")}
                    className={`rounded-md px-1.5 sm:px-2 py-0.5 text-[11px] font-semibold transition-colors ${source === "chesscom" ? "bg-white/[0.1] text-white" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    Chess.com
                  </button>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  className="flex-1 min-w-0 max-w-[130px] sm:max-w-[160px] rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-xs text-white placeholder-slate-600 outline-none focus:border-emerald-500/40"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="submit"
                  disabled={isLoading || !username.trim()}
                  className="shrink-0 rounded-lg bg-emerald-500/90 px-2.5 sm:px-3 py-1 text-xs font-semibold text-white transition-all hover:bg-emerald-400 disabled:opacity-40"
                >
                  {isLoading ? "…" : "Scan"}
                </button>
              </form>

              {/* Stats pill (sm+) */}
              {isDone && (
                <div className="hidden sm:flex shrink-0 items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-[11px] text-slate-400">
                  <span>
                    <span className="font-semibold text-white">
                      {totalGames}
                    </span>{" "}
                    games
                  </span>
                  <span className="text-slate-700">·</span>
                  <span>
                    <span className="font-semibold text-white">
                      {rootSorted.reduce((s, n) => s + n.count, 0)}
                    </span>{" "}
                    positions
                  </span>
                </div>
              )}
            </div>

            {/* Row 2: done-state controls */}
            {isDone && (
              <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 border-t border-white/[0.04]">
                {/* Color filter */}
                <div className="shrink-0 flex items-center rounded-lg border border-white/[0.07] bg-white/[0.03] p-0.5">
                  {(["both", "white", "black"] as ColorFilter[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleColorChange(c)}
                      className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${colorFilter === c ? "bg-white/[0.08] text-white" : "text-slate-500 hover:text-slate-300"}`}
                    >
                      {c === "both" ? (
                        <span className="hidden sm:inline">Both</span>
                      ) : c === "white" ? (
                        "⬜"
                      ) : (
                        "⬛"
                      )}
                      {c === "both" && <span className="sm:hidden">⬜⬛</span>}
                    </button>
                  ))}
                </div>

                {/* View mode toggle */}
                <div className="shrink-0 flex items-center rounded-lg border border-white/[0.07] bg-white/[0.03] p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode("visual")}
                    title="Visual tree"
                    className={`rounded-md px-2 py-0.5 text-[11px] font-semibold transition-all ${viewMode === "visual" ? "bg-emerald-500/15 text-emerald-300" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    🌲
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("dots")}
                    title="Dot map — compact win-rate overview"
                    className={`rounded-md px-2 py-0.5 text-[11px] font-semibold transition-all ${viewMode === "dots" ? "bg-blue-500/15 text-blue-300" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    ●
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    title="List view"
                    className={`rounded-md px-2 py-0.5 text-[11px] font-semibold transition-all ${viewMode === "list" ? "bg-white/[0.08] text-slate-200" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    📋
                  </button>
                </div>

                {/* Show/hide board panel */}
                <button
                  type="button"
                  onClick={() => setPanelOpen((v) => !v)}
                  title={panelOpen ? "Hide board" : "Show board"}
                  className={`shrink-0 rounded-lg border px-2.5 py-1 text-[11px] transition-colors ${
                    panelOpen
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-white/[0.07] bg-white/[0.03] text-slate-400 hover:text-white"
                  }`}
                >
                  ♟ <span className="hidden sm:inline">Board</span>
                </button>

                {/* Breadcrumb — last 4 moves */}
                {selectedPath.length > 0 && (
                  <div className="hidden lg:flex shrink-0 items-center gap-1 text-[11px] text-slate-500 ml-auto max-w-[240px] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setSelectedPath([])}
                      className="text-slate-600 hover:text-slate-300 shrink-0 transition-colors"
                    >
                      Start
                    </button>
                    {selectedPath.slice(-4).map((san, i, arr) => (
                      <span
                        key={i}
                        className="flex items-center gap-1 shrink-0"
                      >
                        <span className="text-slate-700">›</span>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedPath(
                              selectedPath.slice(
                                0,
                                selectedPath.length - arr.length + i + 1,
                              ),
                            )
                          }
                          className={`font-mono transition-colors ${i === arr.length - 1 ? "text-emerald-400 font-semibold" : "hover:text-slate-300"}`}
                        >
                          {san}
                        </button>
                      </span>
                    ))}
                    {selectedPath.length > 4 && (
                      <span className="text-slate-700 shrink-0">…</span>
                    )}
                  </div>
                )}

                {/* Mini breadcrumb path pill for small screens */}
                {selectedPath.length > 0 && (
                  <div className="lg:hidden ml-auto flex items-center gap-1 text-[11px] overflow-hidden max-w-[120px] sm:max-w-[200px]">
                    <button
                      type="button"
                      onClick={() => setSelectedPath(selectedPath.slice(0, -1))}
                      className="shrink-0 text-slate-600 hover:text-slate-300 transition-colors"
                      title="Go back one move"
                    >
                      ‹
                    </button>
                    <span className="font-mono text-emerald-400 font-semibold truncate">
                      {selectedPath[selectedPath.length - 1]}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedPath([])}
                      className="shrink-0 text-slate-700 hover:text-slate-400 transition-colors text-[9px]"
                      title="Reset to start"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Loading ── */}
          {isLoading && (
            <div className="relative flex flex-1 items-center justify-center">
              <div className="text-center">
                <span className="inline-block h-7 w-7 animate-spin rounded-full border-[3px] border-emerald-500 border-t-transparent" />
                <p className="mt-3 text-sm text-slate-300">
                  {scanState === "fetching"
                    ? `Downloading games… (${gamesFetched} / ${totalGames})`
                    : "Building opening tree…"}
                </p>
                {scanState === "fetching" && totalGames > 0 && (
                  <div className="mt-3 mx-auto max-w-xs">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{
                          width: `${Math.min(100, (gamesFetched / totalGames) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {scanState === "error" && error && (
            <div className="relative flex flex-1 items-center justify-center">
              <div className="text-center max-w-md">
                <div className="rounded-xl border border-red-500/20 bg-red-500/08 p-6 text-sm text-red-300">
                  {error}
                </div>
                <button
                  type="button"
                  onClick={() => setScanState("idle")}
                  className="mt-4 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  ← Back to search
                </button>
              </div>
            </div>
          )}

          {/* ── Done: full-height tree ── */}
          {isDone && (
            <div className="relative flex-1 min-h-0">
              {viewMode === "visual" ? (
                <div className="h-full bg-[#07101a]">
                  <VisualTree
                    tree={tree}
                    selectedPath={selectedPath}
                    onSelect={(path) => {
                      setSelectedPath(path);
                      if (path.length > 0) setPanelOpen(true);
                    }}
                  />
                </div>
              ) : viewMode === "dots" ? (
                <div className="h-full bg-[#07101a]">
                  <DotTreeView
                    tree={tree}
                    selectedPath={selectedPath}
                    onSelect={(path) => {
                      setSelectedPath(path);
                      if (path.length > 0) setPanelOpen(true);
                    }}
                  />
                </div>
              ) : (
                <div className="h-full overflow-y-auto">
                  <div className="mx-auto max-w-2xl p-4">
                    {rootSorted.length === 0 ? (
                      <p className="py-8 text-center text-sm text-slate-600">
                        No games found for this filter
                      </p>
                    ) : (
                      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                        <div className="border-b border-white/[0.05] px-4 py-2 flex items-center justify-between">
                          <span className="text-xs text-slate-500">
                            {rootSorted.length} first moves
                          </span>
                          <div className="flex items-center gap-3 text-[10px] text-slate-600">
                            <span className="flex items-center gap-1">
                              <span className="inline-block h-1.5 w-3 rounded bg-emerald-500/70" />
                              W
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="inline-block h-1.5 w-3 rounded bg-slate-500/50" />
                              D
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="inline-block h-1.5 w-3 rounded bg-red-500/50" />
                              L
                            </span>
                          </div>
                        </div>
                        <div className="p-2">
                          {rootSorted.map((node) => (
                            <TreeNodeRow
                              key={node.san}
                              node={node}
                              path={[node.san]}
                              selectedPath={selectedPath}
                              onSelect={(path) => {
                                setSelectedPath(path);
                                if (path.length > 0) setPanelOpen(true);
                              }}
                              indent={0}
                              username={username}
                              norm={username.toLowerCase()}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Draggable floating board panel ─── */}
      {isDone && panelOpen && (
        <DraggablePanel
          currentFen={currentFen}
          boardOrientation={boardOrientation}
          squareStyles={squareStyles}
          customPieces={customPieces}
          showCoords={showCoords}
          boardTheme={boardTheme}
          selectedPath={selectedPath}
          sideToMove={sideToMove}
          explorerData={explorerData}
          explorerLoading={explorerLoading}
          currentNodeChildren={currentNodeChildren}
          userTopMove={userTopMove}
          sfBestMove={sfBestMove}
          sfLoading={sfLoading}
          boardArrows={boardArrows}
          onClose={() => setPanelOpen(false)}
          onSelectMove={(san) => setSelectedPath([...selectedPath, san])}
        />
      )}
    </div>
  );
}

export default function MyOpeningsPage() {
  return (
    <Suspense>
      <MyOpeningsInner />
    </Suspense>
  );
}
