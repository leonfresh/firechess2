"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess, type PieceSymbol } from "chess.js";
import { Chessboard, type CbSquare } from "@/components/chessboard-compat";
import { EvalBar } from "@/components/eval-bar";
import { MoveBadge } from "@/components/move-badge";
import { stockfishClient } from "@/lib/stockfish-client";
import { useBoardSize } from "@/lib/use-board-size";
import {
  classifyMoveQuality,
  buildMoveQualityCommentary,
  MOVE_CLASSIFICATION_COLORS,
  MOVE_CLASSIFICATION_EMOJI,
  MOVE_CLASSIFICATION_LABELS,
  type MoveClassification,
} from "@/lib/move-quality";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Upload } from "lucide-react";
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
};

async function fetchLichessGames(username: string): Promise<GameMeta[]> {
  try {
    const res = await fetch(`https://lichess.org/api/games/user/${encodeURIComponent(username)}?max=20&pgnInJson=true`, {
      headers: { "Accept": "application/x-ndjson" },
    });
    if (!res.ok) throw new Error("Lichess user not found");
    const text = await res.text();
    return text.trim().split("\n").filter(Boolean).map((line) => {
      try {
        const g = JSON.parse(line);
        return { white: g.players?.white?.user?.name ?? "?", black: g.players?.black?.user?.name ?? "?", result: g.winner ? `${g.winner} wins` : "draw", date: g.createdAt ? new Date(g.createdAt).toLocaleDateString() : null, pgn: g.pgn, eco: g.opening?.eco ?? null };
      } catch { return null; }
    }).filter(Boolean) as GameMeta[];
  } catch { return []; }
}

async function fetchChesscomGames(username: string): Promise<GameMeta[]> {
  try {
    const now = new Date();
    const res = await fetch(`https://api.chess.com/pub/player/${encodeURIComponent(username)}/games/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`);
    if (!res.ok) throw new Error("Chess.com user not found");
    const data = await res.json();
    return (data.games ?? []).slice(-20).map((g: any) => ({
      white: g.white?.username ?? "?", black: g.black?.username ?? "?", result: g.white?.result === "win" ? "1-0" : g.black?.result === "win" ? "0-1" : "½-½",
      date: g.end_time ? new Date(g.end_time * 1000).toLocaleDateString() : null, pgn: g.pgn, eco: g.eco ?? null,
    }));
  } catch { return []; }
}

// ── PGN input screen (unchanged) ──
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

function ImportTab({ label, fetchFn, onLoad }: { label: string; fetchFn: (u: string) => Promise<GameMeta[]>; onLoad: (pgn: string) => void }) {
  const [username, setUsername] = useState("");
  const [games, setGames] = useState<GameMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={username} onChange={(e) => setUsername(e.target.value)}
          placeholder={`${label} username`}
          className="flex-1 rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:border-orange-500/30 focus:outline-none" />
        <button onClick={async () => { setLoading(true); setErr(null); setGames([]); const result = await fetchFn(username); if (result.length === 0) setErr("No games found."); else setGames(result); setLoading(false); }}
          disabled={!username.trim() || loading}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? "Loading..." : "Import"}
        </button>
      </div>
      {err && <p className="text-sm text-red-400">{err}</p>}
      {games.length > 0 && (
        <div className="max-h-[300px] space-y-1 overflow-y-auto rounded-xl border border-white/[0.08] bg-black/20 p-2">
          {games.map((g, i) => (
            <button key={i} onClick={() => g.pgn && onLoad(g.pgn)}
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

// ── Move type (unchanged) ──
type ParsedMove = { san: string; fenBefore: string; fenAfter: string; moveNumber: number; color: "w" | "b"; uci?: string };
type MoveJudgement = { square: string; classification: MoveClassification; cpLoss: number; evalBefore: number; evalAfter: number; bestMoveSan: string | null; commentary: string };

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
  const [allEvals, setAllEvals] = useState<any[]>([]);
  const [batchAnalyzing, setBatchAnalyzing] = useState(false);
  const moveReviewRequestRef = useRef(0);

  const { ref: boardContainerRef, size: boardSize } = useBoardSize(440, { evalBar: true, minSize: 240 });

  // Parse PGN
  const loadGame = useCallback((pgnText: string) => {
    setError(null);
    try {
      const chess = new Chess();
      chess.loadPgn(pgnText);
      const history = chess.history({ verbose: true });
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
      setLlmSummary(null);
      setLlmCommentary({});
      setAllEvals([]);
      setBatchAnalyzing(false);
    } catch {
      setError("Invalid PGN. Check the format.");
    }
  }, []);

  // ── Batch analysis: evaluate ALL moves upfront (like Lichess) ──
  useEffect(() => {
    if (!gameLoaded || parsedMoves.length === 0 || allEvals.length > 0) return;
    setBatchAnalyzing(true);

    (async () => {
      const results: any[] = [];
      const chess = new Chess();

      // Evaluate starting position
      const startEval = await stockfishClient.evaluateFen(chess.fen(), 14);

      for (let ply = 0; ply < parsedMoves.length; ply++) {
        const move = parsedMoves[ply];
        const fenBefore = move.fenBefore;
        const fenAfter = move.fenAfter;

        // Evaluate position before the move (for best move comparison)
        const beforeEval = await stockfishClient.evaluateFen(fenBefore, 14);
        // Evaluate position after the move
        const afterEval = await stockfishClient.evaluateFen(fenAfter, 14);

        const cpBefore = toWhitePerspective(fenBefore, beforeEval?.cp ?? 20);
        const cpAfter = toWhitePerspective(fenAfter, afterEval?.cp ?? (ply > 0 ? results[ply - 1].cpAfter : 20));
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

      setAllEvals(results);
      setBatchAnalyzing(false);
      setEvalHistory(results.map((r) => r.cpAfter));

      // Now fire LLM with all the data
      setLlmLoading(true);
      const keyMoments = results
        .filter((r) => r.classification === "blunder" || r.classification === "brilliant" || r.cpLoss > 100 || Math.abs(r.cpAfter - (r.ply > 0 ? results[r.ply - 1].cpAfter : 20)) > 150)
        .slice(0, 20)
        .map((r) => ({
          moveNumber: Math.floor(r.ply / 2) + 1,
          san: r.san,
          color: r.ply % 2 === 0 ? "w" : "b",
          classification: r.classification,
          cpLoss: Math.round(r.cpLoss),
          evalBefore: r.cpBefore,
          evalAfter: r.cpAfter,
          isCritical: true,
        }));
      const blunders = results.filter((r) => r.classification === "blunder").length;
      const brilliants = results.filter((r) => r.classification === "brilliant").length;
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
          keyMoments,
          blunderCount: blunders,
          brilliantCount: brilliants,
          accuracy,
        }),
      }).then((r) => r.ok ? r.json() : null).then((data) => {
        if (data?.summary) { setLlmSummary(data); setLlmCommentary(data.commentary ?? {}); }
      }).catch(() => {}).finally(() => setLlmLoading(false));
    })();
  }, [gameLoaded, parsedMoves, meta]);

  // Current move data from pre-computed allEvals
  const lastMove = currentPly > 0 ? parsedMoves[currentPly - 1] : null;
  const currentMoveEval = currentPly > 0 && allEvals.length > 0 ? allEvals[currentPly - 1] : null;
  const currentFen = useMemo(() => {
    if (currentPly === 0) return new Chess().fen();
    return parsedMoves[currentPly - 1]?.fenAfter ?? new Chess().fen();
  }, [parsedMoves, currentPly]);

  // Derive judgement from pre-computed eval
  const judgement = useMemo(() => {
    if (!currentMoveEval) return null;
    return {
      square: currentMoveEval.uci.slice(2, 4),
      classification: currentMoveEval.classification as MoveClassification,
      cpLoss: currentMoveEval.cpLoss,
      evalBefore: currentMoveEval.cpBefore,
      evalAfter: currentMoveEval.cpAfter,
      bestMoveSan: currentMoveEval.bestMoveSan,
      commentary: currentMoveEval.commentary,
    };
  }, [currentMoveEval]);

  // Update prev move squares when current ply changes
  useEffect(() => {
    if (currentMoveEval) {
      setPrevMoveSquares([currentMoveEval.uci.slice(0, 2), currentMoveEval.uci.slice(2, 4)]);
    } else {
      setPrevMoveSquares([]);
    }
  }, [currentMoveEval]);

  // Square styles: last move highlight
  const squareStyles = useMemo(() => {
    const styles: Record<string, CSSProperties> = {};
    if (prevMoveSquares.length >= 2) {
      styles[prevMoveSquares[0]] = { backgroundColor: "rgba(20,168,152,0.38)" };
      styles[prevMoveSquares[1]] = { backgroundColor: "rgba(20,168,152,0.60)" };
    }
    return styles;
  }, [prevMoveSquares]);

  // Best move arrow
  const bestMoveArrow = useMemo(() => {
    const bestMove = judgement?.bestMoveSan ? parsedMoves.find(m => m.san === judgement.bestMoveSan) : null;
    return [] as [string, string, string][];
  }, [judgement, parsedMoves]);

  // Piece badge on the destination square
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
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* Board panel */}
      <div className="space-y-4">
        {/* Game header */}
        <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-3">
          <div className="flex-1 truncate">
            <p className="text-sm font-bold text-white">{meta?.white ?? "?"} vs {meta?.black ?? "?"}</p>
            <p className="text-xs text-slate-400">{meta?.result ?? "*"} · {parsedMoves.length} moves</p>
          </div>
          {batchAnalyzing && <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[10px] text-amber-300">Analyzing {allEvals.length}/{parsedMoves.length} moves...</span>}
          {!batchAnalyzing && llmLoading && <span className="rounded-full bg-sky-500/10 px-3 py-1 text-[10px] text-sky-300">Coach analyzing...</span>}
        </div>

        {/* LLM Summary */}
        {llmSummary && (
          <div className="rounded-2xl border border-sky-500/15 bg-gradient-to-r from-sky-500/[0.05] to-transparent p-5">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-sky-400">Coach Summary</p>
            <p className="text-sm leading-relaxed text-slate-200">{llmSummary.summary}</p>
            {llmSummary.verdict && (
              <p className="mt-2 text-sm font-semibold text-sky-200">&ldquo;{llmSummary.verdict}&rdquo;</p>
            )}
            {llmSummary.moveAdvice && (
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-slate-400">
                {llmSummary.moveAdvice.opening && <span>♟ {llmSummary.moveAdvice.opening}</span>}
                {llmSummary.moveAdvice.middlegame && <span>⚔ {llmSummary.moveAdvice.middlegame}</span>}
                {llmSummary.moveAdvice.endgame && <span>🏁 {llmSummary.moveAdvice.endgame}</span>}
              </div>
            )}
          </div>
        )}

        {/* Board + Eval bar */}
        <div ref={boardContainerRef} className="flex gap-3">
          <div className="min-w-0 flex-1">
            <Chessboard
              id="game-review"
              position={currentFen}
              boardWidth={boardSize}
              arePiecesDraggable={false}
              customBoardStyle={{ borderRadius: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
              customDarkSquareStyle={{ backgroundColor: "#779952" }}
              customLightSquareStyle={{ backgroundColor: "#edeed1" }}
              customSquareStyles={squareStyles}
              customSquare={customSquareRenderer}
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
                cp loss: {judgement.cpLoss} · {(judgement.evalAfter / 100).toFixed(1)}
              </div>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              {MOVE_CLASSIFICATION_EMOJI[judgement.classification]} {judgement.commentary}
            </p>
            {judgement.bestMoveSan && judgement.classification !== "best" && judgement.classification !== "book" && (
              <p className="mt-1 text-xs text-emerald-400">Best: {judgement.bestMoveSan}</p>
            )}
            {/* LLM per-move commentary */}
            {llmCommentary[currentPly - 1] && (
              <div className="mt-3 rounded-lg border border-sky-500/10 bg-sky-500/[0.04] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-400">Coach</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-300">{llmCommentary[currentPly - 1]}</p>
              </div>
            )}
          </div>
        )}

        {/* Eval graph */}
        {evalHistory.length > 0 && (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
            <p className="mb-2 text-xs font-semibold text-slate-400">Evaluation graph</p>
            <div className="relative h-24 overflow-hidden rounded-lg bg-black/40">
              <svg viewBox={`0 ${-60} ${Math.max(1, evalHistory.length - 1)} 120`} className="h-full w-full" preserveAspectRatio="none">
                <polyline points={evalHistory.map((cp, i) => `${i},${-cp / 30}`).join(" ")}
                  fill="none" stroke="rgb(249, 115, 22)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                <line x1="0" y1="0" x2={Math.max(1, evalHistory.length - 1)} y2="0" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Move list sidebar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
          <p className="text-xs font-semibold text-slate-400">Moves</p>
          <span className="text-xs text-slate-500">{currentPly > 0 ? `${currentPly}/${parsedMoves.length}` : "Start"}</span>
        </div>

        {/* Nav buttons */}
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
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
        <div className="max-h-[500px] overflow-y-auto rounded-2xl border border-white/[0.08] bg-white/[0.03]">
          <div className="divide-y divide-white/[0.04]">
            {Array.from({ length: Math.ceil(parsedMoves.length / 2) }).map((_, round) => {
              const wMove = parsedMoves[round * 2];
              const bMove = parsedMoves[round * 2 + 1];
              const wPly = round * 2;
              const bPly = round * 2 + 1;
              return (
                <div key={round} className={`grid grid-cols-[40px_1fr_1fr] gap-1 px-3 py-1.5 text-xs transition-colors ${currentPly === wPly + 1 || currentPly === bPly + 1 ? "bg-orange-500/10" : "hover:bg-white/[0.02]"}`}>
                  <span className="text-slate-500">{round + 1}.</span>
                  {wMove && (
                    <button onClick={() => setCurrentPly(wPly + 1)}
                      className={`flex items-center gap-1.5 rounded px-1.5 py-1 text-left transition ${currentPly === wPly + 1 ? "bg-orange-500/15" : ""}`}>
                      <span className="text-white">{wMove.san}</span>
                    </button>
                  )}
                  {bMove ? (
                    <button onClick={() => setCurrentPly(bPly + 1)}
                      className={`flex items-center gap-1.5 rounded px-1.5 py-1 text-left transition ${currentPly === bPly + 1 ? "bg-orange-500/15" : ""}`}>
                      <span className="text-white">{bMove.san}</span>
                    </button>
                  ) : <span />}
                </div>
              );
            })}
          </div>
        </div>

        <button onClick={() => { setGameLoaded(false); setParsedMoves([]); setCurrentPly(0); setMeta(null); setEvalHistory([]); setAllEvals([]); }}
          className="w-full rounded-xl border border-white/[0.08] px-4 py-2.5 text-xs text-slate-400 transition hover:bg-white/[0.04] hover:text-white">
          ← New game
        </button>
      </div>
    </div>
  );
}
