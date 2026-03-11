"use client";

/**
 * /my-openings — Personal Opening Tree
 *
 * Scans your recent games (Lichess or Chess.com) and builds an interactive
 * opening tree showing how many times you played each move, your win/draw/loss
 * record from each position, and how it compares to the Lichess opening database.
 */

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Chess } from "chess.js";
import { Chessboard } from "@/components/chessboard-compat";
import { fetchExplorerMoves, type ExplorerResult } from "@/lib/lichess-explorer";
import { useBoardTheme, useCustomPieces, useShowCoordinates } from "@/lib/use-coins";
import { useBoardSize } from "@/lib/use-board-size";
import type { AnalysisSource } from "@/lib/client-analysis";

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

  const response = await fetch(url, { headers: { Accept: "application/x-ndjson" } });
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
      else if (g.status && !["started", "created"].includes(g.status)) winner = "draw";
      games.push({
        moveSans: g.moves.trim().split(/\s+/),
        whiteName: g.players?.white?.user?.name ?? "",
        blackName: g.players?.black?.user?.name ?? "",
        winner,
        openingName: g.opening?.name,
      });
      onProgress?.(games.length);
    } catch { /* skip malformed */ }
  };

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) parseLine(line);
      if (games.length >= maxGames) { reader.cancel(); break; }
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
  if (!archivesResp.ok) throw new Error(`Chess.com API error ${archivesResp.status}`);
  const { archives = [] } = await archivesResp.json() as { archives?: string[] };

  const reversed = [...archives].reverse();
  const games: SourceGame[] = [];

  for (const archiveUrl of reversed) {
    if (games.length >= maxGames) break;
    const resp = await fetch(archiveUrl);
    if (!resp.ok) continue;
    const data = await resp.json() as {
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
        const openingMatch = g.pgn.match(/\[Opening\s+"([^"]+)"\]/) ??
          g.pgn.match(/\[ECOUrl\s+"[^"]*\/([^"]+)"\]/);
        games.push({
          moveSans,
          whiteName: g.white?.username ?? "",
          blackName: g.black?.username ?? "",
          winner,
          openingName: openingMatch?.[1]?.replace(/-/g, " "),
        });
        onProgress?.(games.length);
      } catch { /* skip malformed */ }
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
      game.winner === playerColor ? "win" :
        game.winner === "draw" ? "draw" : "loss";

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
            san, uci, fenBefore, fenAfter,
            count: 0, wins: 0, draws: 0, losses: 0,
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
      } catch { break; }
    }
  }

  return root;
}

/* ── Navigation helpers ─────────────────────────────────────────────── */

function getFenAtPath(path: string[]): string {
  if (!path.length) return INITIAL_FEN;
  const chess = new Chess();
  for (const san of path) {
    try { chess.move(san); } catch { break; }
  }
  return chess.fen();
}

function getSideToMoveAtFen(fen: string): PlayerColor {
  return fen.split(" ")[1] === "w" ? "white" : "black";
}

/* ── Sub-components ─────────────────────────────────────────────────── */

function WinRateBar({
  wins, draws, losses,
}: { wins: number; draws: number; losses: number }) {
  const total = wins + draws + losses;
  if (!total) return null;
  const wp = (wins / total) * 100;
  const dp = (draws / total) * 100;
  const lp = (losses / total) * 100;
  return (
    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
      <div style={{ width: `${wp}%` }} className="bg-emerald-500/70 transition-all" />
      <div style={{ width: `${dp}%` }} className="bg-slate-500/50 transition-all" />
      <div style={{ width: `${lp}%` }} className="bg-red-500/50 transition-all" />
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
    winRate >= 55 ? "text-emerald-400" :
      winRate <= 40 ? "text-red-400" :
        "text-slate-400";

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          onSelect(path);
          if (sortedChildren.length > 0) setExpanded(e => !e);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onSelect(path);
            if (sortedChildren.length > 0) setExpanded(ex => !ex);
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
          <span className={`font-semibold ${isSelected ? "text-emerald-300" : ""}`}>{node.san}</span>
        </span>

        {/* Spacer */}
        <span className="flex-1" />

        {/* Count */}
        <span className="text-[11px] tabular-nums text-slate-500">{node.count}×</span>

        {/* Win% */}
        <span className={`text-[11px] tabular-nums font-medium ${winColor} min-w-[30px] text-right`}>
          {winRate}%
        </span>
      </div>

      {/* Win rate bar (when selected) */}
      {isSelected && total > 0 && (
        <div
          className="pb-1 pt-0.5"
          style={{ paddingLeft: `${22 + indent * 14}px`, paddingRight: "8px" }}
        >
          <WinRateBar wins={node.wins} draws={node.draws} losses={node.losses} />
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
        <p className="mb-2 truncate text-xs text-slate-500">{explorerData.openingName}</p>
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
            <div key={move.san} className={`rounded-lg border px-3 py-2 ${
              isTopPick && isUserMove
                ? "border-emerald-500/25 bg-emerald-500/10"
                : isTopPick
                  ? "border-blue-500/20 bg-blue-500/08"
                  : isUserMove
                    ? "border-amber-500/20 bg-amber-500/08"
                    : "border-white/[0.05] bg-white/[0.02]"
            }`}>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold text-slate-200">{move.san}</span>
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
                    : move.totalGames} games
                </span>
              </div>
              <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
                <div style={{ width: `${wp}%` }} className="bg-white/60 transition-all" />
                <div style={{ width: `${dp}%` }} className="bg-slate-500/50 transition-all" />
                <div style={{ width: `${lp}%` }} className="bg-zinc-800/80 transition-all" />
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

function MyOpeningsInner() {
  const searchParams = useSearchParams();
  const { ref: boardContainerRef, size: boardSize } = useBoardSize(480, { evalBar: false });
  const boardTheme = useBoardTheme();
  const customPieces = useCustomPieces();
  const showCoords = useShowCoordinates();

  /* form state */
  const [username, setUsername] = useState(() => searchParams.get("username") ?? "");
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

  /* derived */
  const currentFen = useMemo(() => getFenAtPath(selectedPath), [selectedPath]);
  const sideToMove = useMemo(() => getSideToMoveAtFen(currentFen), [currentFen]);

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

  const runScan = useCallback(async (
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
          ? await fetchLichessGames(user.trim(), games, (n) => setGamesFetched(n))
          : await fetchChessComGames(user.trim(), games, (n) => setGamesFetched(n));

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
  }, []);

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
    <div className="min-h-screen bg-[#050a12] text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
            <Link href="/" className="hover:text-slate-300 transition-colors">Home</Link>
            <span>·</span>
            <span className="text-slate-300">My Openings</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            My Opening Tree
          </h1>
          <p className="mt-2 text-slate-400 max-w-2xl">
            See every opening line you&apos;ve played, how often, and your win rate — compared to
            what the Lichess database recommends.
          </p>
        </div>

        {/* Scan form */}
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"
        >
          <div className="flex flex-wrap gap-3">
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

            {/* Games count */}
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2">
              <span className="text-xs text-slate-500 shrink-0">Games:</span>
              <input
                type="number"
                min={10}
                max={500}
                step={10}
                value={maxGames}
                onChange={(e) => setMaxGames(Number(e.target.value))}
                className="w-16 bg-transparent text-sm text-white outline-none"
              />
            </div>

            {/* Depth */}
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2">
              <span className="text-xs text-slate-500 shrink-0">Depth:</span>
              <select
                value={maxDepth}
                onChange={(e) => setMaxDepth(Number(e.target.value))}
                className="bg-transparent text-sm text-white outline-none"
              >
                {[8, 10, 12, 15, 20, 25].map((d) => (
                  <option key={d} value={d} className="bg-slate-900">{d} plies</option>
                ))}
              </select>
            </div>

            {/* Scan button */}
            <button
              type="submit"
              disabled={isLoading || !username.trim()}
              className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
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
                    style={{ width: `${Math.min(100, (gamesFetched / totalGames) * 100)}%` }}
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
                  <span className="font-semibold text-white">{totalGames}</span> games scanned
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">
                  <span className="font-semibold text-white">{rootSorted.reduce((s, n) => s + n.count, 0)}</span> positions mapped
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
                      onClick={() => setSelectedPath(selectedPath.slice(0, i + 1))}
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
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(280px,340px)_1fr]">

              {/* ── LEFT: Opening tree ─────────────── */}
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                <div className="border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-200">Opening Tree</h2>
                  <span className="text-[11px] text-slate-600">
                    {rootSorted.length} first moves
                  </span>
                </div>

                <div className="max-h-[600px] overflow-y-auto p-2 scrollbar-thin">
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

                {/* Legend */}
                <div className="border-t border-white/[0.05] px-4 py-2 flex items-center gap-4 text-[10px] text-slate-600">
                  <span>Win%</span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-1.5 w-3 rounded bg-emerald-500/70" />W
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-1.5 w-3 rounded bg-slate-500/50" />D
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-1.5 w-3 rounded bg-red-500/50" />L
                  </span>
                </div>
              </div>

              {/* ── RIGHT: Board + analysis ────────── */}
              <div className="space-y-4">

                {/* Board */}
                <div
                  ref={boardContainerRef}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4"
                >
                  <div className="flex justify-center">
                    <Chessboard
                      position={currentFen}
                      boardWidth={boardSize}
                      boardOrientation={boardOrientation}
                      arePiecesDraggable={false}
                      showBoardNotation={showCoords}
                      customDarkSquareStyle={{ backgroundColor: boardTheme.darkSquare }}
                      customLightSquareStyle={{ backgroundColor: boardTheme.lightSquare }}
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
                            <span className="text-slate-400">{explorerData.openingName}</span>
                          </>
                        )}
                      </>
                    )}
                    {selectedPath.length === 0 && (
                      <span>Starting position · Click a move in the tree to navigate</span>
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
                          const wr = total ? Math.round((child.wins / total) * 100) : 0;
                          const isTop = child.san === userTopMove;
                          const isDbBest = explorerData?.topPick?.san === child.san;
                          const moveNum = Math.floor(child.depth / 2) + 1;
                          const prefix = child.depth % 2 === 0
                            ? `${moveNum}.`
                            : `${moveNum}…`;

                          return (
                            <button
                              key={child.san}
                              type="button"
                              onClick={() => setSelectedPath([...selectedPath, child.san])}
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
                                  <span className="text-slate-600">{prefix} </span>
                                  <span className="font-semibold text-slate-100">{child.san}</span>
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
                                <WinRateBar wins={child.wins} draws={child.draws} losses={child.losses} />
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
                  Drill the openings you play most — reinforce the good moves and fix the mistakes
                  with spaced-repetition puzzles.
                </p>
                <Link
                  href={`/?username=${encodeURIComponent(username)}&source=${source}&scanMode=openings#settings`}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-400 active:scale-95"
                >
                  Run Full Analysis
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
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
                  Upload your games and get quizzed on the exact positions where you make opening
                  mistakes the most.
                </p>
                <Link
                  href="/train"
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-purple-500 active:scale-95"
                >
                  Go to Puzzles & Drills
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </div>
          </>
        )}

        {/* Idle state — show feature overview */}
        {scanState === "idle" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-2">
            {[
              {
                icon: "🌲",
                title: "Your Opening Tree",
                desc: "See every line you've played, how many times, and your W/D/L record for each path.",
              },
              {
                icon: "🔬",
                title: "Database Comparison",
                desc: "Compare your moves to the Lichess master game database — see where you deviate.",
              },
              {
                icon: "📊",
                title: "Move Statistics",
                desc: "Instantly see your most-played openings, win rates, and problem positions.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"
              >
                <div className="mb-2 text-2xl">{f.icon}</div>
                <h3 className="mb-1 text-sm font-semibold text-white">{f.title}</h3>
                <p className="text-xs text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
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
