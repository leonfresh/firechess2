"use client";

import { useState } from "react";
import Link from "next/link";
import { comparableHistory, type ProgressReport } from "./progress-data";
import s from "./modern.module.css";

export function DashboardProgress({ reports, hasAccess, demo }: { reports: ProgressReport[]; hasAccess: boolean; demo: boolean }) {
  const [selectedId, setSelectedId] = useState("");
  const selected = reports.find(report => report.id === selectedId) ?? reports[0];
  const history = selected && hasAccess ? comparableHistory(reports,selected) : [];
  const delta = history.length > 1 ? history[history.length-1].estimatedAccuracy! - history[0].estimatedAccuracy! : null;
  return <section className={s.summaryCard} aria-label="Progress over time"><div className={s.sectionHeading}><div><span className={s.eyebrow}>WATCH YOUR HABITS CHANGE</span><h2>Progress over time</h2></div>{delta !== null && <strong className={s.progressDelta}>{delta > 0 ? "+" : ""}{delta.toFixed(1)}<small> percentage points</small></strong>}</div>
    {!hasAccess ? <div className={s.accessNote}><p>Pro compares your reports across separate game periods, so you can see how your accuracy changes.</p><Link href="/newpricing">Explore Pro →</Link></div> : <>
      {reports.length > 0 && <label className={s.progressSelect}>Compare reports like<select value={selected?.id ?? ""} onChange={event => setSelectedId(event.target.value)}>{reports.map((report,index) => <option key={report.id} value={report.id}>{report.chessUsername} · {report.source} · {report.scanMode ?? "sample"} · {index+1}</option>)}</select></label>}
      {history.length < 2 ? <p className={s.progressEmpty}>{demo ? "These public samples represent different players, not a personal progress history. " : "No comparable history yet. "}Save at least two scans for the same player, platform and settings, covering separate game periods. Overlapping scans and reports without game dates are excluded.</p> : <><div className={s.progressChart} role="img" aria-label={`Reported accuracy across ${history.length} separate game periods, changing by ${delta?.toFixed(1)} percentage points.`}>{history.map(report => <div key={report.id}><span>{report.estimatedAccuracy!.toFixed(1)}%</span><div className={s.progressBarWell}><i style={{height:`${report.estimatedAccuracy}%`}} /></div><small>{new Date(report.gamesEndDate!).toLocaleDateString(undefined,{month:"short",day:"numeric"})}</small></div>)}</div><details className={s.detailDisclosure}><summary>View exact values and game periods</summary><div className={s.tableScroll}><table className={s.dataTable}><thead><tr><th>Games from</th><th>Games through</th><th>Accuracy</th><th>Estimated rating</th><th>Weighted CP loss</th></tr></thead><tbody>{history.map(report => <tr key={report.id}><td>{new Date(report.gamesStartDate!).toLocaleDateString()}</td><td>{new Date(report.gamesEndDate!).toLocaleDateString()}</td><td>{report.estimatedAccuracy!.toFixed(1)}%</td><td>{report.estimatedRating ?? "—"}</td><td>{report.weightedCpLoss?.toFixed(1) ?? "—"}</td></tr>)}</tbody></table></div></details><p className={s.detailFootnote}>Reported accuracy measures scored positions. Differences between scans are descriptive and do not establish a rating improvement.</p></>}
    </>}
  </section>;
}
