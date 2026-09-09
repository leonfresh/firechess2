"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Chess } from "chess.js";
import { LoaderCircle, Play } from "lucide-react";
import type { PreviewPattern } from "./sample-data";
import s from "./modern.module.css";

const ExplanationModal = dynamic(() => import("@/components/explanation-modal").then(module => module.ExplanationModal), { ssr: false });

export function ExplainMove({ pattern }: { pattern: PreviewPattern }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<{ best: string[]; played: string[] } | null>(null);
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);

  async function explain() {
    if (busy) return;
    if (lines) { setOpen(true); return; }
    setBusy(true); setError("");
    try {
      const { stockfishClient } = await import("@/lib/stockfish-client");
      async function continuation(san: string) {
        const game = new Chess(pattern.fen);
        const first = game.move(san);
        const moves = [first.from + first.to + (first.promotion ?? "")];
        if (game.isGameOver()) return moves;
        const result = await stockfishClient.getPrincipalVariation(game.fen(), 9, 12);
        if (!result?.pvMoves.length) throw new Error("The engine could not generate a continuation. Please try again.");
        for (const uci of result.pvMoves) {
          const move = game.move({ from: uci.slice(0,2), to: uci.slice(2,4), promotion: uci[4] });
          moves.push(move.from + move.to + (move.promotion ?? ""));
        }
        return moves;
      }
      const best = await continuation(pattern.best);
      if (!active.current) return;
      const played = pattern.best === pattern.played ? [] : await continuation(pattern.played);
      if (active.current) { setLines({ best, played }); setOpen(true); }
    } catch (issue) {
      if (active.current) setError(issue instanceof Error ? issue.message : "Could not explain this move. Please try again.");
    } finally { if (active.current) setBusy(false); }
  }

  return <>
    <button className={s.secondaryButton} onClick={explain} disabled={busy}>{busy ? <LoaderCircle className={s.spinner} size={17} /> : <Play size={17} />}{busy ? "Analyzing continuations…" : "Explain this move"}</button>
    <p className={s.detailFootnote}>Watch the engine line, step through replies, and compare with the move played.</p>
    {error && <p className={s.formError} role="alert">{error}</p>}
    {open && lines && <ExplanationModal open onClose={() => setOpen(false)} variant={pattern.category === "Openings" ? "opening" : pattern.category === "Endgames" ? "endgame" : "tactic"} activeTab="best" fen={pattern.fen} uciMoves={lines.best} altUciMoves={lines.played} altUciLabel={`After ${pattern.played}`} boardOrientation={new Chess(pattern.fen).turn() === "w" ? "white" : "black"} autoPlay title={`Explain this move: ${pattern.best}`} subtitle="Engine continuation · depth 12" plainExplanation={`${pattern.explanation} These lines show the engine’s recommended replies; your opponent may choose differently.`} />}
  </>;
}
