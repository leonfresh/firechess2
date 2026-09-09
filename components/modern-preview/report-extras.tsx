"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { pickBestGame } from "@/lib/best-game";
import { crossReferenceTimeAndPositional } from "@/lib/time-positional-crossref";
import type { OpeningIdea } from "@/lib/types";
import type { PreviewScan } from "./report-data";
import s from "./modern.module.css";

const OpeningIdeas = dynamic(() => import("@/components/opening-ideas").then(m => m.OpeningIdeas), { ssr: false });
const BestGameReplay = dynamic(() => import("@/components/best-game-replay").then(m => m.BestGameReplay), { ssr: false });
const AnalysisBoardModal = dynamic(() => import("@/components/analysis-board-modal").then(m => m.AnalysisBoardModal), { ssr: false });
const TimePositionalCrossRef = dynamic(() => import("@/components/time-positional-crossref").then(m => m.TimePositionalCrossRef), { ssr: false });

export function ReportExtras({ scan, filter, hasProAccess }: { scan: PreviewScan; filter: string; hasProAccess: boolean }) {
  const [idea, setIdea] = useState<OpeningIdea | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const result = scan.result!;
  const bestGame = useMemo(() => pickBestGame({ username: scan.chessUsername, games: result.games, brilliantMoves: result.brilliantMoves?.filter(move => move.classificationVersion === 2), missedTactics: result.missedTactics, endgameMistakes: result.endgameMistakes }), [result, scan.chessUsername]);
  const crossRef = useMemo(() => crossReferenceTimeAndPositional(result.timeManagement?.moments ?? [], result.positionalFindings ?? []), [result]);
  const all = filter === "All findings";
  return <>
    {(all || filter === "Openings") && <details className={s.detailDisclosure} onToggle={e => { const open = e.currentTarget.open; setExpanded(previous => ({...previous, openings:open})); }}><summary>Opening alternatives <span>Database suggestions from your recurring positions</span></summary><div className={s.legacyDetails}>{!hasProAccess ? <p>Pro adds database alternatives and their results. <Link href="/newpricing">Unlock opening ideas →</Link></p> : !result.openingIdeas?.length ? <p>No database alternatives were stored in this scan. A fresh full scan can look for ideas from recurring positions.</p> : expanded.openings && <OpeningIdeas ideas={result.openingIdeas} onOpenAnalysis={setIdea} />}</div></details>}
    {(all || filter === "Brilliants") && bestGame && <details className={s.detailDisclosure} onToggle={e => { const open = e.currentTarget.open; setExpanded(previous => ({...previous, replay:open})); }}><summary>Standout game replay <span>Revisit the finish, move by move</span></summary><div className={s.legacyDetails}>{expanded.replay && <BestGameReplay bestGame={bestGame} />}<Link className={s.textLink} href={`/best-game/${scan.id}`}>Open the full game replay →</Link></div></details>}
    {(all || filter === "Clock" || filter === "Positional") && result.timeManagement && <details className={s.detailDisclosure} onToggle={e => { const open = e.currentTarget.open; setExpanded(previous => ({...previous, clock:open})); }}><summary>When the clock affects your decisions <span>Time pressure, positional habits and targeted lessons</span></summary><div className={s.legacyDetails}>{hasProAccess ? expanded.clock && <TimePositionalCrossRef report={crossRef} /> : <p>Connect rushed decisions with recurring positional habits and build a lesson around them. <Link href="/newpricing">Unlock with Pro →</Link></p>}</div></details>}
    {idea && <AnalysisBoardModal open onClose={() => setIdea(null)} fen={idea.fenBefore} orientation={idea.sideToMove} title={idea.suggestedOpeningName ?? idea.openingName ?? "Opening alternative"} subtitle={`Explore ${idea.suggestedMove} instead of ${idea.userMove}`} />}
  </>;
}
