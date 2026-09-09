"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ChevronDown, FileText, LoaderCircle, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { useSession } from "@/components/session-provider";
import { scanOwnerStorageKey } from "@/lib/scan-session";
import s from "./modern.module.css";
import { FREE_SCAN_GAMES } from "./report-data";

export function ScanForm() {
  const router = useRouter();
  const { plan, loading: sessionLoading } = useSession();
  const pro = plan === "pro" || plan === "lifetime";
  const [source, setSource] = useState<"chesscom" | "lichess" | "pgn">("chesscom");
  const [username, setUsername] = useState("");
  const [games, setGames] = useState(String(FREE_SCAN_GAMES));
  const [moves, setMoves] = useState("30");
  const [depth, setDepth] = useState("12");
  const [threshold, setThreshold] = useState("50");
  const [speeds, setSpeeds] = useState<string[]>(["all"]);
  const [since, setSince] = useState("");
  const [until, setUntil] = useState("");
  const [scanMode, setScanMode] = useState("both");
  const [pgn, setPgn] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const [prefsReady,setPrefsReady]=useState(false);
  useEffect(()=>{
    if(sessionLoading || prefsReady)return;
    try {const p=JSON.parse(localStorage.getItem("fc-scan-prefs")||"null");if(p){if(["chesscom","lichess","pgn"].includes(p.source))setSource(p.source);if(typeof p.username==="string")setUsername(p.username);const bounded=(v:unknown,min:number,max:number,fallback:number)=>String(typeof v==="number"&&Number.isFinite(v)?Math.min(max,Math.max(min,Math.round(v))):fallback);setGames(bounded(p.gameCount,1,pro?10000:50,50));setMoves(bounded(p.moveCount,1,30,30));setDepth(bounded(p.engineDepth,6,pro?24:12,12));setThreshold(bounded(p.cpThreshold,1,1000,50));}}catch{}setPrefsReady(true);
  },[sessionLoading,prefsReady,pro]);
  useEffect(()=>{if(!prefsReady)return;try{localStorage.setItem("fc-scan-prefs",JSON.stringify({username,source,gameCount:Number(games),moveCount:Number(moves),engineDepth:Number(depth),cpThreshold:Number(threshold)}));}catch{}},[prefsReady,username,source,games,moves,depth,threshold]);

  function toggleSpeed(value: string) {
    setSpeeds(previous => {
      if (value === "all") return ["all"];
      const next = previous.includes(value) ? previous.filter(v => v !== value) : [...previous.filter(v => v !== "all"),value];
      return next.length ? next : ["all"];
    });
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const name = username.trim();
    if (!name) { setError(source === "pgn" ? "Enter the player name used in your PGN." : "Enter your chess username to start a scan."); return; }
    if (source !== "pgn" && !/^[a-zA-Z0-9_-]{2,30}$/.test(name)) { setError("Use your username, not a profile link. Letters, numbers, underscores and hyphens are supported."); return; }
    if ([[games,1,pro ? 10000 : FREE_SCAN_GAMES],[moves,1,30],[depth,6,pro ? 24 : 12],[threshold,1,1000]].some(([value,min,max]) => !Number.isInteger(Number(value)) || Number(value)<Number(min) || Number(value)>Number(max))) { setError("Check the game, move, depth and threshold limits shown below."); return; }
    if (source === "pgn" && (!pgn.trim() || new Blob([pgn]).size > 2*1024*1024 || (pgn.match(/^\[Event\s/gm) ?? []).length > 250)) { setError("Paste or upload a PGN with up to 250 games and 2 MB."); return; }
    const start = since ? new Date(`${since}T00:00:00`).getTime() : null;
    const end = until ? new Date(`${until}T23:59:59.999`).getTime() : null;
    if ((start !== null && !Number.isFinite(start)) || (end !== null && !Number.isFinite(end)) || (start !== null && end !== null && start > end)) { setError("Choose a valid date range with the start before the end."); return; }
    setPending(true); setError("");
    try {
      const response = await fetch("/api/scans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chessUsername: name, config: { source, scanMode, maxGames: Number(games), maxMoves: Number(moves), engineDepth: Number(depth), cpThreshold: Number(threshold), speed: source === "pgn" ? ["all"] : speeds, since: source === "pgn" ? null : start, until: source === "pgn" ? null : end, ...(source === "pgn" ? {pgnText:pgn} : {}) } }) });
      const result = await response.json() as { id?: string; guestToken?: string; error?: string };
      if (!response.ok || !result.id) throw new Error(result.error || "We couldn’t start the scan. Please try again.");
      if (result.guestToken) {
        try { localStorage.setItem(scanOwnerStorageKey(result.id), result.guestToken); }
        catch { throw new Error("Enable browser storage or sign in to continue with your report."); }
      }
      try { localStorage.setItem("modern-last-scan", result.id); } catch {}
      router.push(`/report/${result.id}`);
    } catch (issue) { setError(issue instanceof Error ? issue.message : "Connection interrupted. Please try again."); setPending(false); }
  }

  return <form className={s.scanForm} onSubmit={submit} noValidate id="scan">
    <fieldset disabled={pending} className={s.scanFieldset}>
      <div className={s.platforms} aria-label="Chess platform">{[{id:"chesscom",label:"♟ Chess.com"},{id:"lichess",label:"♘ Lichess"},{id:"pgn",label:"Import PGN"}].map(item => <button type="button" key={item.id} aria-pressed={source === item.id} onClick={() => {setSource(item.id as typeof source);setError("");}}>{item.id === "pgn" && <FileText size={14} />}{item.label}</button>)}</div>
      <label htmlFor="preview-username" className={s.inputLabel}>{source === "pgn" ? "Your player name in the PGN" : `Your ${source === "chesscom" ? "Chess.com" : "Lichess"} username`}</label>
      <div className={s.scanInputRow}><span className={s.atSign}>@</span><input id="preview-username" autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder={source === "pgn" ? "Exact player name" : "Enter username"} value={username} onChange={e => {setUsername(e.target.value);setError("");}} aria-invalid={Boolean(error)} aria-describedby={error ? "scan-error" : undefined} /><button className={s.primaryButton} disabled={pending}>{pending ? <><LoaderCircle className={s.spinner} size={17} />Starting…</> : <>Scan my games <ArrowRight size={17} /></>}</button></div>
      {source === "pgn" && <div className={s.pgnImport}><label>Paste PGN<textarea value={pgn} onChange={e => setPgn(e.target.value)} placeholder={'[Event "My game"]\n[White "Your name"]\n…'} rows={5} /></label><label>Or upload a .pgn file <input type="file" accept=".pgn,text/plain" onChange={async e => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 2*1024*1024) {setError("PGN files must be 2 MB or smaller.");return;} try {setPgn(await file.text());setError("");} catch {setError("Could not read that file. Try pasting the PGN.");} }} /></label><small>Up to 250 games · 2 MB maximum</small></div>}
      <div className={s.quickSettings}><label>Games<input type="number" min={1} max={pro ? 10000 : FREE_SCAN_GAMES} value={games} onChange={e => setGames(e.target.value)} /><small>{pro ? "Up to 10,000" : `Up to ${FREE_SCAN_GAMES} free`}</small></label><label>Opening moves<input type="number" min={1} max={30} value={moves} onChange={e => setMoves(e.target.value)} /><small>First 1–30 moves</small></label><label>Engine depth<input type="number" min={6} max={pro ? 24 : 12} value={depth} onChange={e => setDepth(e.target.value)} /><small>{pro ? "Depth 6–24" : "Depth 6–12"}</small></label></div>
      <details className={s.advancedSettings}><summary><SlidersHorizontal size={15} />Customize your scan <ChevronDown size={15} /></summary><div className={s.advancedContent}><label>Analysis focus<select value={scanMode} onChange={e => setScanMode(e.target.value)}><option value="both">Full report</option><option value="openings">Openings</option><option value="tactics">Tactics</option><option value="endgames">Endgames</option><option value="time-management">Time management</option></select></label><label>Mistake threshold (centipawns)<input type="number" value={threshold} min={1} max={1000} onChange={e => setThreshold(e.target.value)} /><small>50cp = half a pawn. Lower values include subtler mistakes.</small></label>{source !== "pgn" && <><div className={s.dateRange}><label>Games from<input type="date" value={since} onChange={e => setSince(e.target.value)} /></label><label>Games through<input type="date" value={until} min={since || undefined} onChange={e => setUntil(e.target.value)} /></label></div><fieldset className={s.speedChoices}><legend>Time controls</legend>{["all","bullet","blitz","rapid","classical"].map(value => <button type="button" key={value} aria-pressed={speeds.includes(value)} onClick={() => toggleSpeed(value)}>{value === "all" ? "All speeds" : value}</button>)}</fieldset></>}<p>More games and greater depth take longer to analyze. {pro ? "Your Pro depth controls are enabled." : <Link href="/newpricing">Pro unlocks depth 24.</Link>}</p></div></details>
      {error && <p id="scan-error" role="alert" className={s.formError}>{error}</p>}
      <p className={s.scanFoot}>Preparing for an opponent? Enter their public username above to scan their games.</p><div className={s.scanFoot}><span><ShieldCheck size={14} />No password. No credit card.</span><span>{source === "pgn" ? "PGN import" : "Your public games"}</span></div>
    </fieldset>
  </form>;
}
