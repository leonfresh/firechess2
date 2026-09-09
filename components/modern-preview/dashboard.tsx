"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock3, Crosshair, RefreshCw, Target } from "lucide-react";
import { useSession } from "@/components/session-provider";
import { SAMPLE_REPORTS } from "@/lib/sample-reports";
import { DashboardPractice } from "./dashboard-practice";
import type { MissedTactic } from "@/lib/types";
import { DashboardProgress } from "./dashboard-progress";
import type { ProgressReport } from "./progress-data";
import { PreviewHeader } from "./shared";
import s from "./modern.module.css";

export type Report = ProgressReport & { id: string; missedTactics?: MissedTactic[]; estimatedRating?: number | null; scanSessionId?: string | null; chessUsername: string; source: string; gamesAnalyzed: number; estimatedAccuracy: number | null; leakCount: number | null; tacticsCount: number | null; createdAt: string; reportMeta?: { vibeTitle?: string } | null };

export function ModernDashboard({ demo = false }: { demo?: boolean }) {
  const { authenticated, loading, user, plan } = useSession();
  const [reports, setReports] = useState<Report[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [recent, setRecent] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const pro = demo || plan === "pro" || plan === "lifetime";
  useEffect(() => {
    try { const id = localStorage.getItem("modern-last-scan"); if (id && /^[a-f0-9-]{36}$/i.test(id)) setRecent(id); } catch {}
  }, []);
  useEffect(() => {
    if (demo) {
      setReports(SAMPLE_REPORTS.filter(report => report.reportId).map(report => ({ id:report.reportId, scanSessionId:report.reportId, chessUsername:report.username, source:report.source, gamesAnalyzed:report.highlights.gamesScanned ?? 0, estimatedAccuracy:null, leakCount:report.highlights.openingLeaks ?? null, tacticsCount:report.highlights.missedTactics ?? null, createdAt:"" })));
      setBusy(false); setError(""); return;
    }
    if (!authenticated) { setReports([]); return; }
    const controller = new AbortController();
    setBusy(true); setError("");
    fetch("/api/reports", { signal:controller.signal }).then(async response => {
      if (!response.ok) throw new Error(response.status === 401 ? "Your session expired. Sign in again to view your reports." : "Could not load your reports. Please retry.");
      const data = await response.json();
      if (!Array.isArray(data.reports)) throw new Error("The report list could not be read.");
      if (!controller.signal.aborted) setReports(data.reports);
    }).catch(issue => { if (!controller.signal.aborted) setError(issue.message); }).finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [authenticated, refresh, demo]);
  useEffect(() => {
    const counts: Record<string,number> = {};
    for (const report of reports) {
      if (!report.scanSessionId) continue;
      try { const entries: unknown = JSON.parse(localStorage.getItem(`modern-report-practice:${report.scanSessionId}`) ?? "[]"); if (Array.isArray(entries)) counts[report.id] = new Set(entries.filter(item => typeof item === "string")).size; } catch {}
    }
    setProgress(counts);
  }, [reports]);
  const available = pro ? reports : reports.slice(0,1);
  const filtered = available.filter(report => `${report.chessUsername} ${report.source}`.toLowerCase().includes(query.toLowerCase()));
  const latest = reports[0];
  const [deleting,setDeleting] = useState<string | null>(null);
  async function deleteReport(id: string) {
    if (demo || deleting || !window.confirm("Delete this saved report? This cannot be undone.")) return;
    setDeleting(id);
    try { const response = await fetch(`/api/reports?id=${encodeURIComponent(id)}`, {method:"DELETE"}); if (!response.ok) throw new Error("Could not delete the report. Please retry."); setReports(previous=>previous.filter(report=>report.id!==id)); }
    catch (error) { setError(error instanceof Error ? error.message : "Could not delete report."); }
    finally {setDeleting(null);}
  }
  const href = (report: Report) => report.scanSessionId ? `/report/${report.scanSessionId}` : "/dashboard";

  return <div className={s.root}><PreviewHeader /><div className={s.dashboardContainer}>
    <header className={s.dashboardHeading}><div><span className={s.eyebrow}>YOUR CHESS, MOVING FORWARD</span><h1>{demo ? "Your sample workspace." : authenticated ? `Welcome back${user?.name ? `, ${user.name.split(" ")[0]}` : ""}.` : "Your next move starts here."}</h1><p>Return to your games, focus your practice and see what changes.</p></div><Link className={s.primaryButton} href="/#scan">New scan <ArrowRight size={17} /></Link></header>
    {demo && <div className={s.accessNote}><p>Sample dashboard · public player reports. These are not your saved reports. Account history and plan access are unchanged.</p><Link href="/newdashboard">Back to my dashboard →</Link></div>}
    {!demo && loading ? <p className={s.scanDetails} role="status">Loading your account…</p> : !authenticated && !demo ? <section className={s.summaryCard}><span className={s.eyebrow}>KEEP YOUR INSIGHTS TOGETHER</span><h2>Your reports. Your practice. One place.</h2><p>Sign in to find saved reports and pick up where you left off. You can explore a sample before creating an account.</p><div className={s.arrowLegend}><Link className={s.primaryButton} href="/auth/signin?callbackUrl=%2Fnewdashboard">Sign in <ArrowRight size={16} /></Link><Link className={s.secondaryButton} href="/report/8c8d499e-1f04-4121-aabc-71a818b98ce6">Explore sample report</Link><Link className={s.secondaryButton} href="/newdashboard?demo=1">Preview dashboard</Link></div></section> : <>
      <div className={s.reportMetrics}><div><span>{demo ? "Public samples" : "Saved reports"}</span><strong>{busy ? "—" : reports.length}</strong></div><div><span>Latest scan</span><strong>{latest?.gamesAnalyzed ?? "—"}<span> games</span></strong></div><div><span>Latest accuracy</span><strong>{latest?.estimatedAccuracy?.toFixed(1) ?? "—"}<span>%</span></strong></div><div><span>Your plan</span><strong>{demo ? "Sample" : plan === "lifetime" ? "Lifetime" : pro ? "Pro" : "Free"}</strong></div></div>
      {error ? <div className={s.accessNote} role="alert"><p>{error}</p><button className={s.secondaryButton} onClick={() => setRefresh(n=>n+1)}><RefreshCw size={15} />Retry</button></div> : busy ? <p role="status" className={s.scanDetails}>Loading saved reports…</p> : latest ? <section className={s.dashboardResume}><div><span className={s.eyebrow}>{demo ? "EXPLORE A PUBLIC REPORT" : "PICK UP WHERE YOU LEFT OFF"}</span><h2>{latest.chessUsername}’s report</h2><p>{latest.reportMeta?.vibeTitle ?? "Turn your latest findings into your next practice session."}</p><span>{progress[latest.id] ?? 0} positions practiced on this device</span></div><Link className={s.primaryButton} href={href(latest)}>Continue reviewing <ArrowRight size={17} /></Link></section> : <section className={s.summaryCard}><h2>Your first report is the starting point.</h2><p>Scan your games, then save the completed report to your account. It will appear here.</p><div className={s.arrowLegend}><Link href="/#scan" className={s.primaryButton}>Scan my games <ArrowRight size={16} /></Link></div></section>}
      {!busy && !error && <DashboardProgress reports={reports} hasAccess={pro} demo={demo} />}
      {!demo && authenticated && !busy && <DashboardPractice reports={available} />}
      <section className={s.dashboardHistory}><div className={s.sectionHeading}><div><span className={s.eyebrow}>YOUR ANALYSIS LIBRARY</span><h2>Saved reports</h2></div><button className={s.quietButton} disabled={busy} onClick={()=>setRefresh(n=>n+1)}><RefreshCw size={15} />Refresh</button></div><div className={s.findingTools}><label>Find a report<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Player or platform…" /></label><Link href="/dashboard" className={s.textLink}>Open legacy report archive →</Link></div>
        {!busy && !error && filtered.length === 0 && reports.length > 0 && <p className={s.scanDetails}>No available reports match your search.</p>}
        <div className={s.dashboardReports}>{filtered.map(report=><div key={report.id}><Link className={s.dashboardReport} key={report.id} href={href(report)}><span className={s.smallIcon}><BookOpen size={20} /></span><div><h3>{report.chessUsername}</h3><p>{report.source === "chesscom" ? "Chess.com" : report.source} · {report.gamesAnalyzed} games · {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : "Public sample"}</p><small>{report.scanSessionId ? `${progress[report.id] ?? 0} positions practiced` : "Legacy report · opens in original dashboard"}</small></div><div className={s.dashboardAccuracy}><strong>{report.estimatedAccuracy == null ? "—" : `${report.estimatedAccuracy.toFixed(1)}%`}</strong><span>Accuracy</span></div><ArrowRight size={18} /></Link>{!demo && <button className={s.quietButton} disabled={Boolean(deleting)} onClick={()=>deleteReport(report.id)}>{deleting===report.id?"Deleting…":"Delete saved report"}</button>}</div>)}</div>
        {!pro && reports.length > 1 && <div className={s.accessNote}><Clock3 size={20} /><p>Your latest report is available here. Pro adds your full history; {reports.length-1} earlier reports are saved.</p><Link href="/newpricing">Explore Pro →</Link></div>}
      </section>
    </>}
    {recent && <div className={s.accessNote}><Clock3 size={18} /><p>Started a scan on this device?</p><Link href={`/report/${recent}`}>Continue last scan →</Link></div>}
    <div className={s.dashboardTools}>{[{title:"Focused practice",text:"Build recognition with positions and drills.",href:"/newtraining",icon:Target},{title:"Your repertoire",text:"Manage saved opening ideas and study tools.",href:"/newdashboard#repertoire",icon:BookOpen},{title:"Explore a report",text:"See how findings turn into practical ideas.",href:"/report/8c8d499e-1f04-4121-aabc-71a818b98ce6",icon:Crosshair}].map(item=><Link key={item.title} href={item.href}><item.icon size={24} /><h3>{item.title}</h3><p>{item.text}</p><ArrowRight size={17} /></Link>)}</div>
  </div></div>;
}
