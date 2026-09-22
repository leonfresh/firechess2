import Link from "next/link";
import { ArrowUpRight, Brain, Lightbulb } from "lucide-react";
import type { MentalStats } from "@/lib/types";
import s from "./modern.module.css";

type Metric = { label: string; value: number | undefined; unit?: string; detail: string };

function Metrics({ items }: { items: Metric[] }) {
  return <dl className={s.mentalMetrics}>{items.map(item => <div key={item.label}>
    <dt>{item.label}</dt>
    <dd>{item.value == null ? "—" : item.value}<span>{item.value == null ? "" : item.unit}</span></dd>
    <dd className={s.mentalMetricDescription}>{item.value == null ? "Not available in this scan." : item.detail}</dd>
  </div>)}</dl>;
}

export function ModernMentalGame({ mentalStats: m, hasProAccess }: { mentalStats: MentalStats; hasProAccess: boolean }) {
  return <section className={s.mentalMental} aria-label="Mental game insights">
    <header className={s.mentalHeading}><span className={s.mentalIcon}><Brain size={22} /></span><div><h3>Build a steadier playing routine</h3><p>{m.totalGames} games · {m.wins} wins · {m.losses} losses · {m.draws} draws</p></div></header>
    <Metrics items={[
      { label: "Consistency", value: m.stability, unit: "/100", detail: "How steady your results are across the analyzed games." },
      { label: "Losses after a loss", value: m.tiltRate, unit: "%", detail: "How often a loss was immediately followed by another loss." },
      { label: "Wins after a loss", value: m.postLossWinRate, unit: "%", detail: "Your win rate in the game immediately after a loss." },
      { label: "Lost on time", value: m.timeoutRate, unit: "%", detail: "Share of games that ended with your clock running out." },
      { label: "Longest streak", value: m.maxStreak, unit: m.streakType === "win" ? " wins" : " losses", detail: "Your longest run of the same result in these games." },
      { label: "Losses by resignation", value: m.resignRate, unit: "%", detail: "Share of your losses that ended in resignation." },
    ]} />
    <aside className={s.mentalTakeaway}><Lightbulb size={20} /><div><strong>A habit for your next session</strong><p>{m.tiltRate > 50 ? "After a loss, take a short break and review one turning point before starting another game." : m.timeoutRate > 15 ? "Keep time for a final threat check. Practice spotting checks and captures before calculating long lines." : "Keep a repeatable routine: check their threats, choose your move, then do one last check for hanging pieces."}</p></div></aside>
    {hasProAccess ? <div className={s.mentalAdvanced}>
      {m.archetype && <p className={s.mentalProfile}>Report profile: <strong>{m.archetype}</strong></p>}
      {!!m.recentForm?.length && <div className={s.mentalForm}><span>Last {m.recentForm.length} games</span><ol aria-label="Recent game results">{m.recentForm.map((result, index) => <li key={index} data-result={result} aria-label={`Game ${index + 1}: ${result === "W" ? "win" : result === "L" ? "loss" : "draw"}`}>{result}</li>)}</ol></div>}
      <h4>Results by color</h4>
      <div className={s.mentalColors}>{(["white", "black"] as const).map(color => {
        const rate = color === "white" ? m.whiteWinRate : m.blackWinRate;
        const games = color === "white" ? m.whiteGames : m.blackGames;
        return <article key={color}><div><h5>{color === "white" ? "White" : "Black"}</h5><span>{games == null ? "Game count unavailable" : `${games} games`}</span></div><strong>{rate == null ? "—" : `${rate}%`}<small>win rate</small></strong><div className={s.mentalTrack} aria-hidden="true"><span style={{ width: `${Math.max(0, Math.min(100, rate ?? 0))}%` }} /></div></article>;
      })}</div>
      <h4>Your results in more detail</h4>
      <Metrics items={[
        { label: "Wins after a win", value: m.postWinWinRate, unit: "%", detail: "Your win rate immediately after winning a game." },
        { label: "Early losses", value: m.earlyLossRate, unit: "%", detail: "Share of losses within the first 20 moves." },
        { label: "Long-game wins", value: m.comebackRate, unit: "%", detail: "Wins lasting 30 or more moves; this does not establish a comeback from a losing position." },
        { label: "Checkmate finishes", value: m.mateFinishRate, unit: "%", detail: "Share of wins that ended in checkmate." },
        { label: "Average win length", value: m.avgMovesWin, unit: " moves", detail: "Average full moves in your wins." },
        { label: "Average loss length", value: m.avgMovesLoss, unit: " moves", detail: "Average full moves in your losses." },
        { label: "Longest winning run", value: m.maxWinStreak, unit: " games", detail: "Consecutive wins in the analyzed games." },
        { label: "Longest losing run", value: m.maxLossStreak, unit: " games", detail: "Consecutive losses in the analyzed games." },
        { label: "Decisive games", value: m.decisiveness, unit: "%", detail: "Games ending in a win or a loss." },
        { label: "Draws", value: m.drawRate, unit: "%", detail: "Share of games ending in a draw." },
      ]} />
    </div> : <div className={s.mentalUpgrade}><div><strong>Explore your results over a session</strong><p>Pro adds recent form, results by color, game lengths and detailed streaks.</p></div><Link href="/newpricing">Explore Pro <ArrowUpRight size={16} /></Link></div>}
    <p className={s.mentalFootnote}>Based on game outcomes. These patterns describe results, not your emotional state.</p>
  </section>;
}
