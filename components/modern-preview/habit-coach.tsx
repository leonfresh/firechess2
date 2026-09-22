"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Chess } from "chess.js";
import { TRAINING_HABITS, describeReply, getPieceDanger, habitPositions, trainingHeading } from "@/lib/report-coaching";
import type { PreviewPattern } from "./sample-data";
import { PreviewBoard } from "./shared";
import s from "./modern.module.css";

export function HabitRoadmap({ rating, patterns, onTrain }: { rating?: number | null; patterns: PreviewPattern[]; onTrain: (positions: PreviewPattern[]) => void }) {
  const [selected, setSelected] = useState<string>("safety");
  const habit = TRAINING_HABITS.find(h => h.id === selected)!;
  const positions = habitPositions(patterns, selected);
  return <section className={s.habitRoadmap} aria-label="Training habits">
    <span className={s.eyebrow}>{trainingHeading(rating)}</span><h2>Build a habit. Test it in your games.</h2>
    <p>Choose one focus for this week. These are practice habits, not rules to follow regardless of the position.</p>
    <div className={s.habitChoices}>{TRAINING_HABITS.map((h, i) => <button key={h.id} aria-pressed={selected === h.id} onClick={() => setSelected(h.id)}><small>FOCUS {i + 1}</small><strong>{h.title}</strong><span>{habitPositions(patterns, h.id).length} available positions</span></button>)}</div>
    <div className={s.habitMission}><h3>{habit.title}</h3><p>{habit.cue}</p><strong>Your next-game habit</strong><p>{habit.mission}</p><button className={s.primaryButton} disabled={!positions.length} onClick={() => onTrain(positions)}>Train this habit · up to 6 positions →</button>{!positions.length && <p>This report has no available positions for this focus. You can still try the habit in your next game.</p>}</div>
    <p className={s.habitCredit}>Inspired by the habit-based approach in <a href="https://amanhambleton.com/lessons/" target="_blank" rel="noreferrer">Aman Hambleton / Chessbrah’s Building Habits</a>. Coaching and report exercises by FireChess.</p>
  </section>;
}

export function ThreatQuestions({ pattern, onInspect, onReady }: { pattern: PreviewPattern; onInspect: (square: string) => void; onReady: () => void }) {
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState("");
  const [chosenSquare, setChosenSquare] = useState("");
  const [attackers, setAttackers] = useState("");
  const [defenders, setDefenders] = useState("");
  const pieces = useMemo(() => getPieceDanger(pattern.fen, new Chess(pattern.fen).turn()), [pattern.fen]);
  const attacked = pieces.filter(p => p.attackers.length);
  const target = pieces.find(p => p.square === chosenSquare);
  function ready() { setStep(3); setMessage("Now predict their strongest reply, then choose your move."); onReady(); }
  return <div className={s.threatQuestions}>
    <strong>{step === 3 ? "Now choose your move" : `Before you move · ${step + 1} of 3`}</strong>
    {step === 0 && <><p>{pattern.lastMove ? `They just played ${pattern.lastMove.san} (${pattern.lastMove.from} → ${pattern.lastMove.to}). What changed? Look at the blue squares, the piece’s new attacks and any lines it opened.` : "The last move is unavailable in this saved position. Start by looking at their checks and captures."}</p><p>Are any of your pieces directly attacked, including your king?</p><div>{[true, false].map(value => <button className={s.secondaryButton} key={String(value)} onClick={() => { if (value === !!attacked.length) {setStep(1);setMessage(value ? "Yes. Find one of those pieces yourself." : "Correct: no direct attacks. Choose a piece to check its defenders; quiet threats can still exist.");} else setMessage("Look again at the enemy pieces and the squares they attack. Include pawn attacks, not pawn pushes."); }}>{value ? "Yes" : "No"}</button>)}</div></>}
    {step === 1 && <><p>{attacked.length ? "Which of your pieces is attacked? Choose any correct answer." : "Choose one of your pieces to examine."}</p><label>Piece <select value={chosenSquare} onChange={e => setChosenSquare(e.target.value)}><option value="">Choose a piece</option>{pieces.map(p => <option key={p.square} value={p.square}>{p.piece} on {p.square}</option>)}</select></label><button className={s.secondaryButton} disabled={!target} onClick={() => { if (target && (!attacked.length || target.attackers.length)) { setStep(2); setMessage("Now count without the arrows. You can reveal them if you need help."); } else setMessage("That piece has no direct attacker. Follow an enemy piece’s line to one of your pieces."); }}>Check this piece</button></>}
    {step === 2 && target && <><p>How many direct attackers and defenders does your {target.piece} on {target.square} have?</p><label>Attackers <input type="number" min="0" value={attackers} onChange={e => setAttackers(e.target.value)} /></label><label>Defenders <input type="number" min="0" value={defenders} onChange={e => setDefenders(e.target.value)} /></label><button className={s.secondaryButton} onClick={() => {if (attackers !== "" && defenders !== "" && Number(attackers) === target.attackers.length && Number(defenders) === target.defenders.length) {ready();setMessage("Good count. Check piece values, pins and capture order, then choose your move.");} else setMessage("Try following every attack toward that square. These geometric counts include pinned pieces.");}}>Check my count</button><button className={s.quietButton} onClick={() => onInspect(target.square)}>Show counting arrows</button></>}
    {message && <p role="status">{message}</p>}
    {step < 3 && <button className={s.quietButton} onClick={ready}>Go straight to the move</button>}
  </div>;
}

export function OpponentReply({ pattern, move, automatic = false }: { pattern: PreviewPattern; move: string; automatic?: boolean }) {
  const id = useId();
  const [requested, setRequested] = useState(automatic);
  const [reply, setReply] = useState<ReturnType<typeof describeReply> | null>(null);
  const [continuation, setContinuation] = useState<{fen: string; san: string; from: string; to: string; own: boolean}[]>([]);
  const [ply, setPly] = useState(0);
  const [comparison, setComparison] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!requested) return;
    let cancelled = false;
    setBusy(true); setReply(null); setContinuation([]); setPly(0); setMessage(""); setComparison("");
    async function analyze() {
      try {
        const board = new Chess(pattern.fen); board.move(move);
        if (board.isGameOver()) { if (!cancelled) setMessage("This move ends the game; there is no opponent reply."); return; }
        const { stockfishClient } = await import("@/lib/stockfish-client");
        const line = await stockfishClient.getPrincipalVariation(board.fen(), 4, 12);
        if (cancelled) return;
        if (!line?.pvMoves[0]) throw new Error("No reply");
        setReply(describeReply(board.fen(), line.pvMoves[0]));
        const steps = [];
        for (const [index, uci] of line.pvMoves.entries()) {
          try { const next = board.move({from: uci.slice(0,2), to: uci.slice(2,4), promotion: uci[4]}); steps.push({fen: board.fen(), san: next.san, from: next.from, to: next.to, own: index % 2 === 1}); }
          catch { break; }
        }
        setContinuation(steps);
        if (automatic) {
          const recommended = new Chess(pattern.fen); recommended.move(pattern.best);
          if (!recommended.isGameOver()) {
            const reference = await stockfishClient.getPrincipalVariation(recommended.fen(), 1, 12);
            if (!cancelled && reference && line.mateIn == null && reference.mateIn == null && Number.isFinite(line.cp) && Number.isFinite(reference.cp)) {
              setComparison(line.cp - reference.cp <= 35
                ? "At this search depth, your alternative is close to or better than the report’s recommendation. It is not a clear mistake. Compare the plans; this exercise still asks for the report move."
                : `At this search depth, the engine prefers ${pattern.best}. Follow both sides’ replies to see what your move allows.`);
            }
          }
        }
      } catch { if (!cancelled) setMessage("The engine reply is unavailable. Try again shortly."); }
      finally { if (!cancelled) setBusy(false); }
    }
    void analyze();
    return () => { cancelled = true; };
  }, [requested, pattern.fen, pattern.best, move, automatic]);
  const current = continuation[ply];
  return <div className={s.threatQuestions}><strong>After {move}, what can they do?</strong><p>{automatic ? "Let’s examine a concrete reply to your move." : "Predict their reply before checking the engine."}</p><button className={s.secondaryButton} disabled={busy} onClick={() => setRequested(v => !v)}>{busy ? "Checking their reply…" : requested ? "Close reply" : "Show an opponent reply"}</button>{requested && reply && <><p><strong>{reply.text}</strong> This is an engine candidate, not proof that your move loses material. Compare it with your plan.</p>{comparison && <p role="status">{comparison}</p>}{reply.pinnedDefenders.map(text => <p key={text}>{text}</p>)}{current && <p aria-live="polite">{current.own ? "You" : "They"}: {current.san} · move {ply + 1} of {continuation.length}</p>}<PreviewBoard id={`reply-${id}`} position={current?.fen ?? reply.fen} boardOrientation={new Chess(pattern.fen).turn() === "w" ? "white" : "black"} customArrows={[[current?.from ?? reply.from, current?.to ?? reply.to, current?.own ? "#63d5a2cc" : "#ef4444dd"]]} customSquareStyles={{[current?.from ?? reply.from]: {backgroundColor:"#6e8cc080"}, [current?.to ?? reply.to]: {backgroundColor:"#6e8cc0b3"}}} /><div><button className={s.secondaryButton} disabled={ply === 0} onClick={() => setPly(p => p - 1)}>Previous reply</button><button className={s.secondaryButton} disabled={ply + 1 >= continuation.length} onClick={() => setPly(p => p + 1)}>Next reply</button></div></>}{requested && message && <p role="status">{message}</p>}</div>;
}
