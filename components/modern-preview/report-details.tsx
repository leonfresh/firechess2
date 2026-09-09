"use client";

import { ReportExtras } from "./report-extras";
import dynamic from "next/dynamic";
import Link from "next/link";
import { LockKeyhole, ArrowUpRight } from "lucide-react";
import { StrengthsRadar } from "@/components/radar-chart";
import { ScanMentalGame } from "@/components/scan-mental-game";
import { ScanStructuralStats } from "@/components/scan-structural-stats";
import type { PreviewScan } from "./report-data";
import s from "./modern.module.css";

const OpeningRankings = dynamic(() => import("@/components/opening-rankings").then(m => m.OpeningRankings), { ssr: false });
const PositionPerformance = dynamic(() => import("@/components/position-performance").then(m => m.PositionPerformance), { ssr: false });

function LockedDetails({ title, description }: { title: string; description: string }) {
  return <div className={s.accessNote}><LockKeyhole size={20} /><div><strong>{title}</strong><p>{description}</p></div><Link href="/newpricing">Unlock with Pro <ArrowUpRight size={14} /></Link></div>;
}

export function ReportDetails({ scan, filter, hasProAccess }: { scan: PreviewScan; filter: string; hasProAccess: boolean }) {
  const r = scan.result!;
  const meta = scan.reportMeta;
  const all = filter === "All findings";
  const endgame = r.endgameStats;
  const clock = r.timeManagement;
  const ai = r.aiAnalysis;
  const tags = new Map<string, number>();
  for (const row of filter === "Positional" ? r.positionalFindings ?? [] : r.missedTactics) for (const tag of row.tags ?? []) tags.set(tag, (tags.get(tag) ?? 0) + 1);

  return <div className={s.detailStack}>
    {all && <div className={s.overviewGrid}>
      <article className={s.summaryCard}><span className={s.eyebrow}>THE BIG PICTURE</span><h2>{meta?.vibeTitle ?? "Your game, in detail"}</h2><p>{meta?.reportSummary ?? ai?.verdict ?? "Explore the findings below to compare the moves played with the engine’s suggestions."}</p><div className={s.summaryNumbers}><div><strong>{meta?.consistencyScore ?? "—"}<small>/100</small></strong><span>Consistency</span></div><div><strong>{meta ? (meta.severeLeakRate * 100).toFixed(1) : "—"}<small>%</small></strong><span>High-cost error rate</span></div><div><strong>{meta?.sampleSize ?? "—"}</strong><span>Scored positions</span></div></div><small className={s.muted}>Accuracy describes the scored positions in this scan, not every move across all games.</small></article>
      {meta && <article className={s.radarCard}><span className={s.eyebrow}>YOUR PLAYING PROFILE</span><StrengthsRadar accuracy={meta.estimatedAccuracy} leakCount={r.leaks.length} repeatedPositions={r.repeatedPositions} tacticsCount={r.missedTactics.length} gamesAnalyzed={r.gamesAnalyzed} weightedCpLoss={meta.weightedCpLoss} severeLeakRate={meta.severeLeakRate} timeManagementScore={r.timeManagementScore} endgameTechniqueScore={meta.endgameTechniqueScore} /><p>Relative strengths from this scan’s analysis.</p></article>}
    </div>}
    {all && ai && <details className={s.detailDisclosure}><summary>Coach’s assessment <span>Strengths, weaknesses & next steps</span></summary>{hasProAccess ? <div className={s.coachDetailGrid}>{[{ name: "Build on these", items: ai.strengths }, { name: "Focus your practice", items: ai.weaknesses }, { name: "Your next steps", items: ai.nextSteps }].map(group => <article key={group.name}><h3>{group.name}</h3><ul>{group.items.map(item => <li key={item}>{item}</li>)}</ul></article>)}</div> : <LockedDetails title="Your personalized improvement plan" description="Unlock the full strengths, weaknesses and next-step assessment." />}</details>}
    {(all || filter === "Openings") && <details className={s.detailDisclosure} key={`openings-${filter}`} open={filter === "Openings"}><summary>Opening repertoire <span>{r.leaks.length} recurring leaks · {r.oneOffMistakes.length} one-off mistakes · rankings & results</span></summary>{hasProAccess ? <div className={s.legacyDetails}>{r.openingSummaries?.length ? <OpeningRankings openingSummaries={r.openingSummaries} /> : <p>No opening rankings were stored with this scan.</p>}<PositionPerformance leaks={r.leaks} hasProAccess={hasProAccess} /></div> : <LockedDetails title="Your complete opening repertoire" description="Explore three opening findings below. Pro adds every finding, opening ranking and performance breakdown." />}</details>}
    {(filter === "Tactics" || filter === "Positional") && <article className={s.summaryCard}><span className={s.eyebrow}>{filter === "Tactics" ? "TACTICAL THEMES" : "POSITIONAL HABITS"}</span><h2>What keeps showing up?</h2><p>Tags can overlap: a single position may contain several themes. Search the findings below to explore a theme.</p><div className={s.tagCloud}>{[...tags].sort((a,b) => b[1]-a[1]).map(([tag,count]) => <span key={tag}>{tag}<b>{count}</b></span>)}</div></article>}
    {(all || filter === "Endgames") && endgame && <details className={s.detailDisclosure} key={`endgames-${filter}`} open={filter === "Endgames"}><summary>Endgame technique <span>Conversion, defense & performance by piece type</span></summary><div className={s.detailContent}><div className={s.summaryNumbers}><div><strong>{endgame.totalPositions}</strong><span>Positions analyzed</span></div><div><strong>{endgame.conversionRate == null ? "—" : `${endgame.conversionRate.toFixed(1)}%`}</strong><span>Winning positions converted</span></div><div><strong>{endgame.holdRate == null ? "—" : `${endgame.holdRate.toFixed(1)}%`}</strong><span>Worse positions held</span></div></div>{hasProAccess ? <><div className={s.tableScroll}><table className={s.dataTable}><caption>Endgame performance by type</caption><thead><tr><th>Endgame</th><th>Positions</th><th>Mistakes</th><th>Avg. evaluation loss</th></tr></thead><tbody>{endgame.byType.map(row => <tr key={row.type}><td>{row.type}{row.type === endgame.weakestType ? <small>Focus area</small> : null}</td><td>{row.count}</td><td>{row.mistakes}</td><td>{row.avgCpLoss >= 10000 ? "Mate swing" : (row.avgCpLoss/100).toFixed(2)}</td></tr>)}</tbody></table></div><p className={s.detailFootnote}>Loss is shown in pawn units. These stored averages include forced-mate evaluations, which can inflate the value.</p></> : <LockedDetails title="Endgame performance by piece type" description="Unlock the complete breakdown and every endgame position to review." />}</div></details>}
    {(all || filter === "Clock") && clock && <details className={s.detailDisclosure} key={`clock-${filter}`} open={filter === "Clock"}><summary>Time management <span>{clock.gamesWithClockData} games with clock data · pacing & pressure</span></summary><div className={s.detailContent}><div className={s.summaryNumbers}><div><strong>{clock.score}<small>/100</small></strong><span>Time management</span></div><div><strong>{clock.avgTimePerMove.toFixed(1)}<small>s</small></strong><span>Average per move</span></div><div><strong>{clock.timeScrambleCount}</strong><span>Games with time scrambles</span></div></div>{hasProAccess ? <div className={s.breakdownGrid}>{[["Justified thinks",clock.justifiedThinks],["Efficient moves",clock.efficientMoves],["Wasted thinks",clock.wastedThinks],["Rushed moves",clock.rushedMoves]].map(([label,value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div> : <LockedDetails title="Understand your pacing under pressure" description="One clock moment is included below. Pro unlocks every moment and the full pacing breakdown." />}</div></details>}
    {(all || filter === "Positional") && r.structuralReport && <details className={s.detailDisclosure}><summary>Structures & winning positions <span>Pawn structures, king safety & castling choices</span></summary><div className={s.legacyDetails}>{hasProAccess ? <ScanStructuralStats report={r.structuralReport} /> : <LockedDetails title="Find the structures that work for you" description="Unlock results by pawn structure, king safety and castling choice." />}</div></details>}
    {all && r.mentalStats && <details className={s.detailDisclosure}><summary>Mental game <span>Streaks, resilience & results after a loss</span></summary><div className={s.legacyDetails}><ScanMentalGame mentalStats={r.mentalStats} hasProAccess={hasProAccess} /></div></details>}
    <ReportExtras scan={scan} filter={filter} hasProAccess={hasProAccess} />
    {all && !hasProAccess && <LockedDetails title="Track your progress over time" description="This preview shows one report. Pro history and comparisons help you see how your habits change across scans." />}
    {filter === "Brilliants" && <article className={s.summaryCard}><span className={s.eyebrow}>BUILD ON YOUR STRENGTHS</span><h2>{r.brilliantMoves?.length ?? 0} moments worth remembering.</h2>{r.brilliantMoves?.some(move => move.classificationVersion !== 2) && <p className={s.accessNote}>This saved scan uses the older brilliant detector. These highlights have not been revalidated under the new sacrifice criteria; a fresh scan is needed.</p>}<p>Review the report’s engine-highlighted moves, their explanations and source games. These are opportunities to recognize what you already do well.</p></article>}
  </div>;
}
