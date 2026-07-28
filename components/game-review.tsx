"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess, type PieceSymbol } from "chess.js";
import { Chessboard, type CbSquare } from "@/components/chessboard-compat";
import { EvalBar } from "@/components/eval-bar";
import { MoveBadge } from "@/components/move-badge";
import { VRMCoach } from "@/components/vrm-coach";
import { stockfishClient, stockfishPool } from "@/lib/stockfish-client";
import { useBoardSize } from "@/lib/use-board-size";
import {
  classifyMoveQuality,
  buildMoveQualityCommentary,
  MOVE_CLASSIFICATION_COLORS,
  MOVE_CLASSIFICATION_EMOJI,
  MOVE_CLASSIFICATION_LABELS,
  type MoveClassification,
} from "@/lib/move-quality";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Upload, X } from "lucide-react";
import type { CSSProperties } from "react";

const PUZZLE_BADGE_ASSET: Partial<Record<MoveClassification, string>> = {
  brilliant: "brilliant",
  best: "best",
  good: "good",
  inaccuracy: "inaccuracy",
  mistake: "mistake",
  blunder: "blunder",
};

function toWhitePerspective(fen: string, cp: number) {
  return fen.includes(" w ") ? cp : -cp;
}

function toSan(fen: string, uci: string | null) {
  if (!uci || !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) return null;
  try {
    const chess = new Chess(fen);
    const move = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: (uci.slice(4, 5) || undefined) as PieceSymbol | undefined });
    return move?.san ?? null;
  } catch { return null; }
}

export type GameMeta = {
  white: string | null;
  black: string | null;
  result: string | null;
  date?: string | null;
  event?: string | null;
  eco?: string | null;
  pgn?: string;
  orientation?: "white" | "black";
};

async function fetchLichessGames(username: string): Promise<GameMeta[]> {
  try {
    const res = await fetch(`/api/proxy?url=${encodeURIComponent(`https://lichess.org/api/games/user/${encodeURIComponent(username)}?max=20&pgnInJson=true`)}`);
    if (!res.ok) throw new Error("Lichess user not found");
    const text = await res.text();
    return text.trim().split("\n").filter(Boolean).map((line) => {
      try {
        const g = JSON.parse(line);
        const w = g.players?.white?.user?.name ?? "?";
        const b = g.players?.black?.user?.name ?? "?";
        return {
          white: w, black: b,
          result: g.winner ? `${g.winner} wins` : "draw",
          date: g.createdAt ? new Date(g.createdAt).toLocaleDateString() : null,
          pgn: g.pgn, eco: g.opening?.eco ?? null,
          orientation: b.toLowerCase() === username.toLowerCase() ? "black" as const : "white" as const,
        };
      } catch { return null; }
    }).filter(Boolean) as GameMeta[];
  } catch { return []; }
}

async function fetchChesscomGames(username: string): Promise<GameMeta[]> {
  try {
    const now = new Date();
    const res = await fetch(`/api/proxy?url=${encodeURIComponent(`https://api.chess.com/pub/player/${encodeURIComponent(username)}/games/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`)}`);
    if (!res.ok) throw new Error("Chess.com user not found");
    const data = await res.json();
    return (data.games ?? []).slice(-20).map((g: any) => {
      const w = g.white?.username ?? "?";
      const b = g.black?.username ?? "?";
      return {
        white: w, black: b,
        result: g.white?.result === "win" ? "1-0" : g.black?.result === "win" ? "0-1" : "½-½",
        date: g.end_time ? new Date(g.end_time * 1000).toLocaleDateString() : null,
        pgn: g.pgn, eco: g.eco ?? null,
        orientation: b.toLowerCase() === username.toLowerCase() ? "black" as const : "white" as const,
      };
    });
  } catch { return []; }
}

// ── PGN input screen ──
function PgnTab({ onLoad }: { onLoad: (pgn: string) => void }) {
  const [text, setText] = useState("");
  return (
    <div className="space-y-4">
      <textarea value={text} onChange={(e) => setText(e.target.value)}
        placeholder="1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 ..." rows={6}
        className="w-full rounded-xl border border-white/[0.08] bg-black/30 p-4 font-mono text-sm text-slate-200 placeholder-slate-600 focus:border-orange-500/30 focus:outline-none" />
      <button onClick={() => text.trim() && onLoad(text.trim())} disabled={!text.trim()}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
        <Upload className="h-4 w-4" /> Analyze Game
      </button>
    </div>
  );
}

function ImportTab({ label, fetchFn, onLoad }: { label: string; fetchFn: (u: string) => Promise<GameMeta[]>; onLoad: (pgn: string, orientation?: "white" | "black") => void }) {
  const [username, setUsername] = useState("");
  const [games, setGames] = useState<GameMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(`fc-review-username-${label.toLowerCase()}`);
      if (saved) setUsername(saved);
    } catch { /* ignore */ }
  }, [label]);

  useEffect(() => {
    try {
      window.localStorage.setItem(`fc-review-username-${label.toLowerCase()}`, username);
    } catch { /* ignore */ }
  }, [username, label]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && username.trim() && !loading) document.getElementById(`import-btn-${label}`)?.click(); }}
          placeholder={`${label} username`}
          className="flex-1 rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:border-orange-500/30 focus:outline-none" />
        <button id={`import-btn-${label}`} onClick={async () => { setLoading(true); setErr(null); setGames([]); const result = await fetchFn(username); if (result.length === 0) setErr("No games found."); else setGames(result); setLoading(false); }}
          disabled={!username.trim() || loading}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? "Loading..." : "Import"}
        </button>
      </div>
      {err && <p className="text-sm text-red-400">{err}</p>}
      {games.length > 0 && (
        <div className="max-h-[300px] space-y-1 overflow-y-auto rounded-xl border border-white/[0.08] bg-black/20 p-2">
          {games.map((g, i) => (
            <button key={i} onClick={() => g.pgn && onLoad(g.pgn, g.orientation)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs text-slate-300 transition hover:bg-white/[0.06]">
              <span className="shrink-0 font-semibold text-slate-400">{g.white} vs {g.black}</span>
              <span className="text-slate-500">{g.result}</span>
              <span className="ml-auto text-slate-600">{g.date}</span>
            </button>
          ))}
        </div>
      )}
      <p className="text-xs text-slate-500">Shows the 20 most recent games.</p>
    </div>
  );
}

// ── Move type ──
type ParsedMove = { san: string; fenBefore: string; fenAfter: string; moveNumber: number; color: "w" | "b"; uci?: string };

const CLASSIFICATION_DOT: Record<MoveClassification, string> = {
  brilliant: "bg-cyan-400",
  best: "bg-emerald-400",
  good: "bg-emerald-300/60",
  inaccuracy: "bg-amber-400",
  mistake: "bg-orange-400",
  blunder: "bg-red-400",
  book: "bg-slate-500",
};

export function GameReview({ initialPgn }: { initialPgn?: string }) {
  const [gameLoaded, setGameLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parsed game data
  const [parsedMoves, setParsedMoves] = useState<ParsedMove[]>([]);
  const [meta, setMeta] = useState<{ white: string | null; black: string | null; result: string | null } | null>(null);
  const [currentPly, setCurrentPly] = useState(0);
  const [prevMoveSquares, setPrevMoveSquares] = useState<string[]>([]);
  const [evalHistory, setEvalHistory] = useState<number[]>([]);
  const [inputTab, setInputTab] = useState<"pgn" | "lichess" | "chesscom">("pgn");
  const [llmSummary, setLlmSummary] = useState<any>(null);
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmCommentary, setLlmCommentary] = useState<Record<number, string>>({});
  const [showCoachModal, setShowCoachModal] = useState(false);
  const [playingPv, setPlayingPv] = useState<{ fens: string[]; moves: string[] } | null>(null);
  const [pvFenIndex, setPvFenIndex] = useState(-1);
  const [allEvals, setAllEvals] = useState<any[]>([]);
  const [batchAnalyzing, setBatchAnalyzing] = useState(false);
  const moveReviewRequestRef = useRef(0);
  const moveListRef = useRef<HTMLDivElement>(null);

  const { ref: boardContainerRef, size: boardSize } = useBoardSize(520, { evalBar: true, minSize: 320 });

  const [boardOrientation, setBoardOrientation] = useState<"white" | "black">("white");

  // Parse PGN
  const loadGame = useCallback((pgnText: string, orientation?: "white" | "black") => {
    setError(null);
    try {
      const chess = new Chess();
      chess.loadPgn(pgnText);
      const history = chess.history({ verbose: true });
      if (history.length === 0) {
        setError("Invalid PGN. Check the format.");
        return;
      }
      const parsed: ParsedMove[] = [];
      const replay = new Chess();
      for (const m of history) {
        const fenBefore = replay.fen();
        replay.move(m.san);
        parsed.push({
          san: m.san,
          fenBefore,
          fenAfter: replay.fen(),
          moveNumber: Math.floor(parsed.length / 2) + 1,
          color: parsed.length % 2 === 0 ? "w" : "b",
          uci: m.from + m.to + (m.promotion || ""),
        });
      }
      setMeta({
        white: chess.header()["White"] || null,
        black: chess.header()["Black"] || null,
        result: chess.header()["Result"] || null,
      });
      setParsedMoves(parsed);
      setCurrentPly(0);
      setPrevMoveSquares([]);
      setEvalHistory([]);
      setGameLoaded(true);
      setBoardOrientation(orientation ?? "white");
      setLlmSummary(null);
      setLlmCommentary({});
      setShowCoachModal(false);
      setAllEvals([]);
      setBatchAnalyzing(false);
    } catch {
      setError("Invalid PGN. Check the format.");
    }
  }, []);

  // Auto-load initialPgn (e.g. from ?pgn= query param)
  useEffect(() => {
    if (initialPgn && !gameLoaded && parsedMoves.length === 0) {
      loadGame(initialPgn);
    }
  }, [initialPgn, gameLoaded, parsedMoves.length, loadGame]);

  // Play PV animation: step through best continuation FENs
  useEffect(() => {
    if (!playingPv) { setPvFenIndex(-1); return; }
    let i = 0;
    setPvFenIndex(0);
    const interval = setInterval(() => {
      i++;
      if (i >= playingPv.fens.length) { clearInterval(interval); setPlayingPv(null); return; }
      setPvFenIndex(i);
    }, 900);
    return () => clearInterval(interval);
  }, [playingPv]);

  // Batch analysis
  useEffect(() => {
    if (!gameLoaded || parsedMoves.length === 0 || allEvals.length > 0 || batchAnalyzing) return;
    let cancelled = false;
    setBatchAnalyzing(true);
    setLlmLoading(false);

    (async () => {
      try {
        const results: any[] = [];
        const chess = new Chess();

        const startEval = await stockfishClient.evaluateFen(chess.fen(), 14);

        for (let ply = 0; ply < parsedMoves.length; ply++) {
          const move = parsedMoves[ply];
          const fenBefore = move.fenBefore;
          const fenAfter = move.fenAfter;

          const topMoves = await stockfishPool.getTopMoves(fenBefore, 3, 14);
          const afterEval = await stockfishClient.evaluateFen(fenAfter, 14);

          const beforeEval = topMoves[0] ?? null;
          const cpBefore = toWhitePerspective(fenBefore, beforeEval?.cp ?? 20);
          const cpAfter = toWhitePerspective(fenAfter, afterEval?.cp ?? (ply > 0 ? results[ply - 1]?.cpAfter ?? 20 : 20));
          const evalBeforeMover = move.color === "w" ? cpBefore : -cpBefore;
          const evalAfterMover = move.color === "w" ? cpAfter : -cpAfter;
          const cpLoss = Math.max(0, evalBeforeMover - evalAfterMover);
          const isBestMove = beforeEval?.bestMove === move.uci ||
            (beforeEval?.bestMove && move.uci?.startsWith(beforeEval.bestMove.slice(0, 4)) && cpLoss <= 5);
          const classification = classifyMoveQuality({
            cpLoss,
            isBestMove: !!isBestMove,
            evalBeforeMover,
            evalAfterMover,
            fenBefore,
            moveUci: move.uci ?? null,
            moveIndex: ply,
          });
          const bestMoveSan = toSan(fenBefore, beforeEval?.bestMove ?? null);

          const topLines = topMoves.slice(0, 3).map((l: any) => ({
            uci: l.bestMove ?? "",
            san: toSan(fenBefore, l.bestMove ?? null),
            cp: l.cp,
            mateIn: l.mateIn ?? null,
            pv: l.pvMoves ?? [],
          }));

          results.push({
            ply,
            san: move.san,
            fenBefore,
            fenAfter,
            cpBefore,
            cpAfter,
            cpLoss,
            classification,
            bestMove: beforeEval?.bestMove ?? null,
            bestMoveSan,
            topLines,
            uci: move.uci ?? "",
            commentary: buildMoveQualityCommentary({
              classification,
              cpLoss,
              evalBefore: cpBefore,
              evalAfter: cpAfter,
              bestMoveSan,
            }),
          });
        }

        if (cancelled) return;
        setAllEvals(results);
        setBatchAnalyzing(false);
        setEvalHistory(results.map((r) => r.cpAfter));

        // Fire LLM
        setLlmLoading(true);
        const llmTimeout = setTimeout(() => { setLlmLoading(false); }, 30000);
        const allMoves = results.map((r: any) => ({
          ply: r.ply,
          san: r.san,
          color: r.ply % 2 === 0 ? "w" : "b",
          classification: r.classification,
          cpLoss: Math.round(r.cpLoss),
          evalBefore: r.cpBefore,
          evalAfter: r.cpAfter,
        }));
        const blunders = results.filter((r: any) => r.classification === "blunder").length;
        const brilliants = results.filter((r: any) => r.classification === "brilliant").length;
        const avgLoss = results.reduce((s: number, r: any) => s + r.cpLoss, 0) / Math.max(1, results.length);
        const accuracy = Math.round(Math.max(0, Math.min(100, 100 - avgLoss / 5)));

        fetch("/api/review/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            white: meta?.white ?? "?",
            black: meta?.black ?? "?",
            result: meta?.result ?? "*",
            totalMoves: parsedMoves.length,
            moves: allMoves,
            blunderCount: blunders,
            brilliantCount: brilliants,
            accuracy,
          }),
        }).then((r) => r.ok ? r.json() : null).then((data) => {
          if (data?.summary) { setLlmSummary(data); setLlmCommentary(data.commentary ?? {}); setShowCoachModal(true); }
        }).catch(() => {}).finally(() => { clearTimeout(llmTimeout); if (!cancelled) setLlmLoading(false); });
      } catch (e) {
        if (!cancelled) { setBatchAnalyzing(false); setLlmLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [gameLoaded, parsedMoves, meta]);

  // Auto-scroll move list to current move
  useEffect(() => {
    if (!moveListRef.current || currentPly === 0) return;
    const el = moveListRef.current;
    const row = el.children[Math.floor((currentPly - 1) / 2)] as HTMLElement | undefined;
    if (row) {
      const rowTop = row.offsetTop;
      const rowHeight = row.offsetHeight;
      const viewTop = el.scrollTop;
      const viewHeight = el.clientHeight;
      if (rowTop < viewTop || rowTop + rowHeight > viewTop + viewHeight) {
        el.scrollTo({ top: rowTop - viewHeight / 2 + rowHeight, behavior: "smooth" });
      }
    }
  }, [currentPly]);

  // Current move data from pre-computed allEvals
  const lastMove = currentPly > 0 ? parsedMoves[currentPly - 1] : null;
  const currentMoveEval = currentPly > 0 && allEvals.length > 0 ? allEvals[currentPly - 1] : null;
  const currentFen = useMemo(() => {
    if (currentPly === 0) return new Chess().fen();
    return parsedMoves[currentPly - 1]?.fenAfter ?? new Chess().fen();
  }, [parsedMoves, currentPly]);

  const displayFen = pvFenIndex >= 0 && playingPv ? playingPv.fens[pvFenIndex] : currentFen;

  const judgement = useMemo(() => {
    if (!currentMoveEval) return null;
    return {
      square: currentMoveEval.uci.slice(2, 4),
      classification: currentMoveEval.classification as MoveClassification,
      cpLoss: currentMoveEval.cpLoss,
      evalBefore: currentMoveEval.cpBefore,
      evalAfter: currentMoveEval.cpAfter,
      bestMoveSan: currentMoveEval.bestMoveSan,
      topLines: currentMoveEval.topLines ?? [],
      bestPv: currentMoveEval.topLines?.[0]?.pv ?? [],
      commentary: currentMoveEval.commentary,
    };
  }, [currentMoveEval]);

  const bestMoveArrow = useMemo(() => {
    if (!currentMoveEval || !currentMoveEval.bestMove || currentMoveEval.bestMove === currentMoveEval.uci) return [];
    const uci = currentMoveEval.bestMove;
    if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) return [];
    return [[uci.slice(0, 2), uci.slice(2, 4), "rgba(34,197,94,0.7)"]] as any;
  }, [currentMoveEval]);

  useEffect(() => {
    if (currentMoveEval) {
      setPrevMoveSquares([currentMoveEval.uci.slice(0, 2), currentMoveEval.uci.slice(2, 4)]);
    } else {
      setPrevMoveSquares([]);
    }
    if (playingPv) setPlayingPv(null);
  }, [currentMoveEval]);

  const squareStyles = useMemo(() => {
    const styles: Record<string, CSSProperties> = {};
    if (prevMoveSquares.length >= 2) {
      styles[prevMoveSquares[0]] = { backgroundColor: "rgba(20,168,152,0.38)" };
      styles[prevMoveSquares[1]] = { backgroundColor: "rgba(20,168,152,0.60)" };
    }
    return styles;
  }, [prevMoveSquares]);

  const customSquareRenderer = useMemo(() => {
    return ((props: any) => {
      const square = props?.square as string | undefined;
      const classification = square && judgement?.square === square ? judgement.classification : null;
      const asset = classification ? PUZZLE_BADGE_ASSET[classification] : null;
      return (
        <div style={props?.style} className="relative h-full w-full">
          {props?.children}
          {classification && asset ? (
            <img
              src={`/move-badges/${asset}.svg`}
              alt={MOVE_CLASSIFICATION_LABELS[classification]}
              title={MOVE_CLASSIFICATION_LABELS[classification]}
              className="pointer-events-none absolute -right-1 -top-1 z-40 h-7 w-7 drop-shadow-lg"
            />
          ) : classification ? (
            <MoveBadge classification={classification} variant="corner" />
          ) : null}
        </div>
      );
    }) as any;
  }, [judgement]);

  // Keyboard nav
  const keyboardHandler = useCallback((e: KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") { setCurrentPly((p) => Math.min(p + 1, parsedMoves.length)); e.preventDefault(); }
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { setCurrentPly((p) => Math.max(p - 1, 0)); e.preventDefault(); }
    else if (e.key === "Home") { setCurrentPly(0); e.preventDefault(); }
    else if (e.key === "End") { setCurrentPly(parsedMoves.length); e.preventDefault(); }
  }, [parsedMoves.length]);

  useEffect(() => { window.addEventListener("keydown", keyboardHandler); return () => window.removeEventListener("keydown", keyboardHandler); }, [keyboardHandler]);

  // Stats
  const stats = useMemo(() => {
    if (allEvals.length === 0) return null;
    const blunders = allEvals.filter((r) => r.classification === "blunder").length;
    const mistakes = allEvals.filter((r) => r.classification === "mistake").length;
    const inaccuracies = allEvals.filter((r) => r.classification === "inaccuracy").length;
    const brilliants = allEvals.filter((r) => r.classification === "brilliant").length;
    const avgLoss = allEvals.reduce((s, r) => s + r.cpLoss, 0) / allEvals.length;
    const accuracy = Math.round(Math.max(0, Math.min(100, 100 - avgLoss / 5)));
    return { blunders, mistakes, inaccuracies, brilliants, accuracy };
  }, [allEvals]);

  // Coach commentary for current move
  const coachCommentary = useMemo(() => {
    if (currentPly === 0) return null;
    return llmCommentary[currentPly - 1] ?? null;
  }, [llmCommentary, currentPly]);

  if (!gameLoaded) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
          <h2 className="mb-2 text-lg font-bold text-white">Game Review</h2>
          <p className="mb-6 text-sm text-slate-400">
            Paste a PGN, or load your recent games from Lichess or Chess.com.
          </p>
          <div className="mb-6 flex gap-1 rounded-xl border border-white/[0.08] bg-black/20 p-1">
            {(["pgn", "lichess", "chesscom"] as const).map((tab) => (
              <button key={tab} onClick={() => setInputTab(tab)}
                className={`flex-1 rounded-lg px-4 py-2 text-xs font-semibold transition ${inputTab === tab ? "bg-orange-500/20 text-orange-200" : "text-slate-400 hover:text-white"}`}>
                {tab === "pgn" ? "PGN" : tab === "lichess" ? "Lichess" : "Chess.com"}
              </button>
            ))}
          </div>
          {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
          {inputTab === "pgn" && <PgnTab onLoad={(pgn) => loadGame(pgn)} />}
          {inputTab === "lichess" && <ImportTab label="Lichess" fetchFn={fetchLichessGames} onLoad={(pgn) => loadGame(pgn)} />}
          {inputTab === "chesscom" && <ImportTab label="Chess.com" fetchFn={fetchChesscomGames} onLoad={(pgn) => loadGame(pgn)} />}
          <p className="mt-4 text-xs text-slate-500">Use arrow keys ← → to navigate moves after loading.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      {/* Board panel */}
      <div className="space-y-4">
        {/* Game header */}
        <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-3">
          <div className="flex-1 truncate">
            <p className="text-sm font-bold text-white">{meta?.white ?? "?"} vs {meta?.black ?? "?"}</p>
            <p className="text-xs text-slate-400">{meta?.result ?? "*"} · {parsedMoves.length} moves</p>
          </div>
          {batchAnalyzing && (
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[10px] text-amber-300">
              Analyzing {allEvals.length}/{parsedMoves.length}...
            </span>
          )}
          {!batchAnalyzing && llmLoading && (
            <span className="rounded-full bg-sky-500/10 px-3 py-1 text-[10px] text-sky-300">Coach analyzing...</span>
          )}
          {!batchAnalyzing && !llmLoading && llmSummary && (
            <button onClick={() => setShowCoachModal(true)}
              className="rounded-full bg-orange-500/15 px-3 py-1 text-[10px] font-semibold text-orange-300 transition hover:bg-orange-500/25">
              Coach Notes
            </button>
          )}
        </div>

        {/* Stats bar */}
        {stats && (
          <div className="grid grid-cols-5 gap-2">
            <div className="rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2 text-center">
              <p className="text-[10px] text-slate-500">Accuracy</p>
              <p className="text-sm font-bold text-white">{stats.accuracy}%</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2 text-center">
              <p className="text-[10px] text-slate-500">Brilliant</p>
              <p className="text-sm font-bold text-cyan-300">{stats.brilliants}</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2 text-center">
              <p className="text-[10px] text-slate-500">Mistakes</p>
              <p className="text-sm font-bold text-amber-300">{stats.mistakes}</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2 text-center">
              <p className="text-[10px] text-slate-500">Blunders</p>
              <p className="text-sm font-bold text-red-300">{stats.blunders}</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2 text-center">
              <p className="text-[10px] text-slate-500">Moves</p>
              <p className="text-sm font-bold text-slate-300">{parsedMoves.length}</p>
            </div>
          </div>
        )}

        {/* Board + Eval bar */}
        <div ref={boardContainerRef} className="flex gap-3">
          <div className="min-w-0 flex-1">
            <Chessboard
              id="game-review"
              position={displayFen}
              boardWidth={boardSize}
              arePiecesDraggable={false}
              boardOrientation={boardOrientation}
              customBoardStyle={{ borderRadius: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
              customDarkSquareStyle={{ backgroundColor: "#779952" }}
              customLightSquareStyle={{ backgroundColor: "#edeed1" }}
              customSquareStyles={squareStyles}
              customSquare={customSquareRenderer}
              customArrows={bestMoveArrow}
            />
          </div>
          <EvalBar evalCp={judgement?.evalAfter ?? 20} height={boardSize} />
        </div>

        {/* Move info + judgement */}
        {judgement && (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-white">
                  {lastMove?.moveNumber}{lastMove?.color === "w" ? "." : "..."}
                </span>
                <span className="text-lg font-semibold text-white">{lastMove?.san}</span>
                <MoveBadge classification={judgement.classification} />
              </div>
              <div className="text-xs text-slate-400">
                {(judgement.evalAfter / 100).toFixed(1)} · loss: {judgement.cpLoss}
              </div>
            </div>

            {/* Multi-PV: top engine lines */}
            {judgement.topLines && judgement.topLines.length > 0 && (
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Top engine lines</p>
                  {judgement.bestPv.length > 1 && judgement.classification !== "best" && !playingPv && (
                    <button onClick={() => {
                      const chess = new Chess(currentMoveEval?.fenBefore ?? currentFen);
                      const fens: string[] = [chess.fen()];
                      const moves: string[] = [];
                      for (const uci of judgement.bestPv) {
                        try { const move = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.slice(4, 5) || undefined }); moves.push(move.san); fens.push(chess.fen()); }
                        catch { break; }
                      }
                      if (fens.length > 1) setPlayingPv({ fens, moves });
                    }} className="text-[10px] text-emerald-400 transition hover:text-emerald-300">▶ Play best</button>
                  )}
                  {playingPv && <button onClick={() => setPlayingPv(null)} className="text-[10px] text-red-400">■ Stop</button>}
                </div>
                {judgement.topLines.map((line: any, i: number) => {
                  const isPlayed = line.san === lastMove?.san;
                  const cpWhite = toWhitePerspective(currentFen, line.cp);
                  return (
                    <div key={i} className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs ${
                      isPlayed ? "bg-orange-500/10 text-orange-200" : "text-slate-400"
                    }`}>
                      <span className="w-4 shrink-0 font-mono text-[10px] text-slate-500">{i + 1}.</span>
                      <span className="font-semibold">{line.san || "(unknown)"}</span>
                      <span className={`ml-auto font-mono ${cpWhite > 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {(cpWhite / 100).toFixed(1)}
                      </span>
                      {line.mateIn && <span className="text-yellow-400">M{Math.abs(line.mateIn)}</span>}
                      {isPlayed && <span className="text-[10px] text-orange-400">played</span>}
                    </div>
                  );
                })}
              </div>
            )}

            <p className="mt-2 text-sm text-slate-400">
              {MOVE_CLASSIFICATION_EMOJI[judgement.classification]} {judgement.commentary}
            </p>
            {judgement.bestMoveSan && judgement.classification !== "best" && judgement.classification !== "book" && (
              <p className="mt-1 text-xs text-emerald-400">Best: {judgement.bestMoveSan} <span className="text-slate-500">(green arrow on board)</span></p>
            )}
          </div>
        )}

        {/* Eval graph */}
        {evalHistory.length > 0 && (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400">Evaluation graph</p>
              <p className="text-[10px] text-slate-500">White advantage →</p>
            </div>
            <div className="relative h-24 overflow-hidden rounded-lg bg-black/40">
              <svg viewBox={`0 ${-60} ${Math.max(1, evalHistory.length - 1)} 120`} className="h-full w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="evalFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(249,115,22)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="rgb(249,115,22)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polyline points={evalHistory.map((cp, i) => `${i},${-cp / 30}`).join(" ")}
                  fill="none" stroke="rgb(249, 115, 22)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                <line x1="0" y1="0" x2={Math.max(1, evalHistory.length - 1)} y2="0" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                {/* Fill under curve */}
                <polygon
                  points={`0,60 ${evalHistory.map((cp, i) => `${i},${-cp / 30}`).join(" ")} ${evalHistory.length - 1},60`}
                  fill="url(#evalFill)"
                />
                {/* Current position marker */}
                {currentPly > 0 && (
                  <circle cx={currentPly - 1} cy={-evalHistory[currentPly - 1] / 30} r="4" fill="rgb(249,115,22)" stroke="white" strokeWidth="1.5" />
                )}
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Right sidebar: Moves */}
      <div className="space-y-4">
        {/* Coach (avatar + notes) — fixed height, scrollable so it never shifts layout */}
        <div className="h-[430px] overflow-y-auto">
          <VRMCoach
            classification={judgement?.classification ?? null}
            commentary={coachCommentary ?? judgement?.commentary ?? null}
            bestMoveSan={judgement?.bestMoveSan ?? null}
            cpLoss={judgement?.cpLoss}
            isVisible={gameLoaded}
          />
        </div>
        {/* Move list */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03]">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <p className="text-xs font-semibold text-slate-400">Moves</p>
            <span className="text-xs text-slate-500">{currentPly > 0 ? `${currentPly}/${parsedMoves.length}` : "Start"}</span>
          </div>

          {/* Nav buttons */}
          <div className="flex items-center justify-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
            <button onClick={() => setCurrentPly(0)} disabled={currentPly === 0}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-30"> <ChevronsLeft className="h-4 w-4" /> </button>
            <button onClick={() => setCurrentPly((p) => Math.max(p - 1, 0))} disabled={currentPly === 0}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-30"> <ChevronLeft className="h-5 w-5" /> </button>
            <span className="min-w-[80px] text-center text-[11px] font-medium text-slate-400">
              {currentPly === 0 ? "Start" : `Move ${Math.ceil(currentPly / 2)}`}
            </span>
            <button onClick={() => setCurrentPly((p) => Math.min(p + 1, parsedMoves.length))} disabled={currentPly === parsedMoves.length}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-30"> <ChevronRight className="h-5 w-5" /> </button>
            <button onClick={() => setCurrentPly(parsedMoves.length)} disabled={currentPly === parsedMoves.length}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-30"> <ChevronsRight className="h-4 w-4" /> </button>
          </div>

          {/* Move list */}
          <div ref={moveListRef} className="max-h-[380px] overflow-y-auto">
            <div className="divide-y divide-white/[0.04]">
              {Array.from({ length: Math.ceil(parsedMoves.length / 2) }).map((_, round) => {
                const wMove = parsedMoves[round * 2];
                const bMove = parsedMoves[round * 2 + 1];
                const wPly = round * 2;
                const bPly = round * 2 + 1;
                const isCurrentRow = currentPly === wPly + 1 || currentPly === bPly + 1;
                return (
                  <div key={round} className={`grid grid-cols-[36px_1fr_1fr] gap-1 px-3 py-2 text-xs transition-colors ${isCurrentRow ? "bg-orange-500/[0.08]" : "hover:bg-white/[0.02]"}`}>
                    <span className="flex items-center text-slate-500">{round + 1}.</span>
                    <button onClick={() => setCurrentPly(wPly + 1)}
                      className={`flex min-w-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left transition ${currentPly === wPly + 1 ? "bg-orange-500/15 text-orange-200" : "text-white hover:bg-white/[0.04]"}`}>
                      <span className="min-w-[3ch] truncate font-medium">{wMove.san}</span>
                      <span className={`ml-auto h-2 w-2 shrink-0 rounded-full ${allEvals[wPly] ? (CLASSIFICATION_DOT[allEvals[wPly].classification as MoveClassification] ?? "bg-slate-500") : "bg-transparent"}`} />
                    </button>
                    {bMove ? (
                      <button onClick={() => setCurrentPly(bPly + 1)}
                        className={`flex min-w-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left transition ${currentPly === bPly + 1 ? "bg-orange-500/15 text-orange-200" : "text-white hover:bg-white/[0.04]"}`}>
                        <span className="min-w-[3ch] truncate font-medium">{bMove.san}</span>
                        <span className={`ml-auto h-2 w-2 shrink-0 rounded-full ${allEvals[bPly] ? (CLASSIFICATION_DOT[allEvals[bPly].classification as MoveClassification] ?? "bg-slate-500") : "bg-transparent"}`} />
                      </button>
                    ) : <span />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <button onClick={() => { setGameLoaded(false); setParsedMoves([]); setCurrentPly(0); setMeta(null); setEvalHistory([]); setAllEvals([]); setLlmSummary(null); setLlmCommentary({}); }}
          className="w-full rounded-xl border border-white/[0.08] px-4 py-2.5 text-xs text-slate-400 transition hover:bg-white/[0.04] hover:text-white">
          ← New game
        </button>
      </div>

      {/* Coach modal */}
      {showCoachModal && llmSummary && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-[rgba(2,6,23,0.82)] px-4 py-8 backdrop-blur-sm sm:items-center" onClick={() => setShowCoachModal(false)}>
          <div className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[2rem] border border-orange-500/20 bg-[rgba(6,11,26,0.97)] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowCoachModal(false)} className="absolute right-4 top-4 text-slate-500 transition hover:text-white">
              <X className="h-5 w-5" />
            </button>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20">
                <span className="text-lg">🧠</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white">Coach Analysis</p>
                <p className="text-xs text-slate-400">{meta?.white} vs {meta?.black}</p>
              </div>
            </div>

            <p className="mb-4 text-sm leading-relaxed text-slate-200">{llmSummary.summary}</p>

            {llmSummary.verdict && (
              <div className="mb-4 rounded-xl border border-orange-500/10 bg-orange-500/[0.04] p-4">
                <p className="text-sm font-semibold text-orange-200">&ldquo;{llmSummary.verdict}&rdquo;</p>
              </div>
            )}

            {llmSummary.moveAdvice && (llmSummary.moveAdvice.opening || llmSummary.moveAdvice.middlegame || llmSummary.moveAdvice.endgame) && (
              <div className="mb-4 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phase Advice</p>
                {llmSummary.moveAdvice.opening && <p className="rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-slate-300"><span className="font-semibold text-slate-400">Opening:</span> {llmSummary.moveAdvice.opening}</p>}
                {llmSummary.moveAdvice.middlegame && <p className="rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-slate-300"><span className="font-semibold text-slate-400">Middlegame:</span> {llmSummary.moveAdvice.middlegame}</p>}
                {llmSummary.moveAdvice.endgame && <p className="rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-slate-300"><span className="font-semibold text-slate-400">Endgame:</span> {llmSummary.moveAdvice.endgame}</p>}
              </div>
            )}

            {Object.keys(llmCommentary).length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Key Move Notes</p>
                <div className="space-y-1.5">
                  {Object.entries(llmCommentary).slice(0, 10).map(([ply, note]) => {
                    const move = allEvals[parseInt(ply)];
                    if (!move) return null;
                    return (
                      <button key={ply} onClick={() => { setCurrentPly(parseInt(ply) + 1); setShowCoachModal(false); }}
                        className="flex w-full gap-2 rounded-lg px-3 py-2 text-left text-xs text-slate-300 transition hover:bg-white/[0.04]">
                        <span className="shrink-0 font-semibold text-slate-500">{Math.floor(parseInt(ply) / 2) + 1}{parseInt(ply) % 2 === 0 ? "." : "..."}</span>
                        <span>{note}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
