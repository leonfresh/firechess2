"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Chess, type Square } from "chess.js";
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Check, ChevronLeft, ChevronRight, CircleHelp, Clock3, Copy, Crosshair, Flag, FlipVertical2, LayoutGrid, Lightbulb, RotateCcw, ShieldCheck, Sparkles, Target, Trophy } from "lucide-react";
import { type PreviewPattern } from "./sample-data";
import { PreviewBoard, PreviewHeader } from "./shared";
import s from "./modern.module.css";

import { useSession } from "@/components/session-provider";
import { SAMPLE_REPORTS } from "@/lib/sample-reports";
import { buildReportPositions, findingsByCategory, CATEGORIES, FREE_FINDING_LIMITS, type PreviewScan } from "./report-data";
import { ExplainMove } from "./explain-move";
import { ReportWorkspace } from "./report-workspace";
import { ReportDetails } from "./report-details";
const FILTERS = ["All findings", ...CATEGORIES] as const;
type Filter = typeof FILTERS[number];

function StudyPosition({ pattern, onComplete, onNext, hasNext, onPrevious, positionIndex, positionCount, reportUrl }: { onPrevious: () => void; positionIndex: number; positionCount: number; reportUrl: string; pattern: PreviewPattern; onComplete: (id: string) => void; onNext: () => void; hasNext: boolean }) {
  const [sideline, setSideline] = useState(pattern.sideline);
  useEffect(() => {
    if (pattern.category !== "Openings" || pattern.sideline) return;
    let cancelled = false;
    import("./sideline-data").then(module => module.lookupSideline(pattern)).then(result => {
      if (!cancelled && result) setSideline(result);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [pattern]);
  const sidelineColor = sideline?.approved ? "#6366f1" : undefined;
  const [mode, setMode] = useState<"review" | "practice">("review");
  const [moveShown, setMoveShown] = useState<"position" | "played" | "best">("position");
  const [flipped, setFlipped] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [showArrows, setShowArrows] = useState(true);
  const [hint, setHint] = useState(false);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [solved, setSolved] = useState(false);
  const [reviewFen, setReviewFen] = useState<string | null>(null);
  const [reviewMove, setReviewMove] = useState("");
  const chess = new Chess(reviewFen ?? pattern.fen);
  const side = new Chess(pattern.fen).turn() === "w" ? "white" : "black";
  if (!reviewFen && moveShown !== "position") chess.move(moveShown === "played" ? pattern.played : pattern.best);

  const playedArrow = new Chess(pattern.fen).move(pattern.played);
  const boardArrows: [string, string, string][] = mode === "review" && !reviewFen && moveShown === "position" && (showArrows || hint)
    ? [...(showArrows && pattern.played !== pattern.best ? [[playedArrow.from, playedArrow.to, sidelineColor ?? "#ff7938bb"] as [string,string,string]] : []), [pattern.from, pattern.to, "#63d5a2cc"]]
    : [];

  function reset(practice: boolean) {
    setReviewFen(null); setReviewMove("");
    setMode(practice ? "practice" : "review"); setMoveShown("position"); setSelectedSquare(null); setHint(false); setFeedback(""); setAnswer(""); setSolved(false);
  }

  function tryMove(move: string | { from: string; to: string; promotion?: string }) {
    if (mode === "review") {
      try {
        const attempt = chess.move(move);
        setReviewFen(chess.fen()); setReviewMove(attempt.san); setSelectedSquare(null); setHint(false); setFeedback(""); return true;
      } catch { setFeedback("That move is not legal in this position."); setSelectedSquare(null); return false; }
    }
    if (solved) return false;
    try {
      const attempt = new Chess(pattern.fen).move(move);
      if (attempt.from === pattern.from && attempt.to === pattern.to && attempt.promotion === pattern.promotion) {
        setSolved(true); setMoveShown("best"); setFeedback(`That’s it — ${pattern.best}. ${pattern.habit}`); setSelectedSquare(null); onComplete(pattern.id); return true;
      }
      setFeedback(`${attempt.san} is legal, but there’s a better move. Take another look.`);
    } catch { setFeedback("That move isn’t legal in this position. Try again."); }
    setSelectedSquare(null); return false;
  }

  function selectSquare(square: string) {
    if (mode === "practice" && solved) return;
    const game = mode === "review" ? chess : new Chess(pattern.fen);
    const piece = game.get(square as Square);
    if (piece?.color === game.turn()) { setSelectedSquare(square); return; }
    if (selectedSquare) tryMove({ from: selectedSquare, to: square, promotion: pattern.promotion ?? "q" });
  }

  function submitAnswer(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (answer.trim()) tryMove(answer.trim()); }

  return <section className={s.studyPanel} data-category={pattern.category} aria-label="Position review">
    <div className={s.studyHeader}><div><span className={s.eyebrow}>{pattern.category.toUpperCase()} / POSITION REVIEW</span><h2>{pattern.title}</h2></div><div className={s.segment}><button aria-pressed={mode === "review"} onClick={() => reset(false)}>Review</button><button aria-pressed={mode === "practice"} onClick={() => reset(true)}><Target size={14} />Practice</button></div></div>
    <nav className={s.positionNavigation} aria-label="Browse report positions"><button className={s.secondaryButton} disabled={positionIndex === 0} onClick={onPrevious}><ChevronLeft size={16} />Previous position</button><span aria-live="polite">Position {positionIndex + 1} of {positionCount}</span><button className={s.secondaryButton} disabled={!hasNext} onClick={onNext}>Next position<ChevronRight size={16} /></button></nav>
    <div className={s.studyGrid}>
      <div className={s.boardColumn}>
        <div className={s.boardContext}><span><span className={chess.turn() === "w" ? s.whitePieceDot : s.blackPieceDot} />{chess.turn() === "w" ? "White" : "Black"} to move</span><span>{mode === "practice" ? "Find the best move" : "Drag pieces to explore"}</span></div>
        <PreviewBoard id={`preview-study-${pattern.id}`} position={chess.fen()} boardOrientation={flipped ? (side === "white" ? "black" : "white") : side}
          arePiecesDraggable={mode === "review" || !solved}
          onSquareClick={selectSquare}
          onPieceDrop={(from, to) => tryMove({ from, to, promotion: pattern.promotion ?? "q" })}
          customArrows={boardArrows}
          customSquareStyles={selectedSquare ? { [selectedSquare]: { backgroundColor: "#e9b361" } } : !reviewFen && moveShown === "best" ? { [pattern.to]: { backgroundColor: "#a7c18b" } } : {}}
        />
        <div className={s.boardToolbar}><div><button aria-label="Reset position" onClick={() => { setReviewFen(null); setReviewMove(""); setMoveShown("position"); setSelectedSquare(null); setSolved(false); setFeedback(""); }}><RotateCcw size={16} /></button><button aria-label="Flip board" onClick={() => setFlipped(!flipped)}><FlipVertical2 size={16} /></button></div><span>{reviewFen ? `Exploring: ${reviewMove}` : moveShown === "position" ? "Starting position" : moveShown === "played" ? `Played: ${pattern.played}` : `Best move: ${pattern.best}`}</span><button aria-label="Show starting position" disabled={!reviewFen && moveShown === "position"} onClick={() => {setReviewFen(null);setReviewMove("");setMoveShown("position");setSelectedSquare(null);setFeedback("");}}><ChevronLeft size={19} /></button></div>
        {mode === "review" && <div className={s.arrowLegend}><button className={s.quietButton} aria-pressed={showArrows} onClick={() => setShowArrows(!showArrows)}>{showArrows ? "Hide arrows" : "Show arrows"}</button><span><i className={s.greenDot} />Best move</span><span><i className={s.orangeDot} style={{background:sidelineColor}} />{sideline?.approved ? "Sideline played" : "Played move"}</span></div>}
        {mode === "review" && feedback && <p role="status" className={s.hintText}>{feedback}</p>}
        {mode === "practice" ? <form className={s.moveForm} onSubmit={submitAnswer}><label htmlFor={`move-${pattern.id}`}>Move a piece, or enter your move</label><div><input id={`move-${pattern.id}`} value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="e.g. Nf3" autoComplete="off" autoCapitalize="none" disabled={solved} /><button className={s.secondaryButton} disabled={solved || !answer.trim()}>Check move <ArrowRight size={14} /></button></div></form> : <div className={s.moveCompare}><button onClick={() => {setReviewFen(null);setSelectedSquare(null);setFeedback("");setMoveShown("played");}} aria-pressed={!reviewFen && moveShown === "played"}><span className={s.orangeDot} style={{background:sidelineColor}} />You played <strong>{pattern.played}</strong></button><button onClick={() => {setReviewFen(null);setSelectedSquare(null);setFeedback("");setMoveShown("best");}} aria-pressed={!reviewFen && moveShown === "best"}><span className={s.greenDot} />{sideline?.approved ? "Engine preference" : "Better move"} <strong>{pattern.best}</strong></button></div>}
      </div>
      <div className={s.coachColumn}>
        <div className={s.coachLabel}><Sparkles size={16} /><span>{mode === "practice" ? "YOUR TURN" : "THE IDEA BEHIND THE MOVE"}</span></div>
        <h3>{mode === "practice" ? "Make the better move." : pattern.opening}</h3>
        <p className={s.coachContext}>{pattern.context}</p>
        {sideline?.approved && <aside className={s.sidelineNote} aria-label="Offbeat sideline"><strong>Offbeat sideline</strong><p>{sideline.games != null && sideline.score != null ? `${pattern.played} scores ${(sideline.score * 100).toFixed(0)}% across ${sideline.games.toLocaleString("en-US")} Lichess database games (wins + half of draws).` : "Your scan identified this move as a known practical sideline."} The engine prefers {pattern.best}; practical results do not establish that the line is objectively sound.</p></aside>}
        {mode === "review" ? <><div className={s.coachText}><span>What happened</span><p>{pattern.explanation}</p></div><div className={s.habitCard}><Lightbulb size={19} /><div><strong>Take this into your next game</strong><p>{pattern.habit}</p></div></div><button className={s.primaryButton} onClick={() => reset(true)}><Target size={17} />Practice this position <ArrowRight size={17} /></button><button className={s.quietButton} onClick={() => { setReviewFen(null); setHint(!hint); setMoveShown("position"); }}><CircleHelp size={15} />{hint ? "Hide move hint" : "Show a move hint"}</button>{hint ? <p className={s.hintText}>{pattern.hint}</p> : null}</> : <><div className={s.coachText}><span>Put the idea into practice</span><p>Select a piece and its destination, drag it to a square, or type your move below the board.</p></div><div className={`${s.practiceFeedback} ${solved ? s.solved : ""}`} role="status" aria-live="polite">{solved ? <Check size={22} /> : <Crosshair size={22} />}<p>{feedback || `Find the best move for ${side}. Your practice progress is saved on this device when browser storage is available.`}</p></div>{!solved ? <><button className={s.secondaryButton} onClick={() => setHint(!hint)}><Lightbulb size={16} />{hint ? "Hide hint" : "Give me a hint"}</button>{hint ? <p className={s.hintText}>{pattern.hint}</p> : null}<button className={s.quietButton} onClick={() => { reset(false); setMoveShown("best"); }}>Show the answer</button></> : <button className={s.primaryButton} onClick={hasNext ? onNext : () => reset(false)}>{hasNext ? "Next position" : "Back to review"}<ArrowRight size={17} /></button>}</>}
        {mode === "review" && <ExplainMove pattern={pattern} />}<div className={s.tagCloud}>{pattern.tags?.map(tag => <span key={tag}>{tag}</span>)}</div>{pattern.gameUrl && <a href={pattern.gameUrl} target="_blank" rel="noreferrer" className={s.textLink}>Open source game <ArrowUpRight size={14} /></a>}<Link href={reportUrl} className={s.originalLink}>Open the original full report <ArrowUpRight size={14} /></Link>
      </div>
    </div>
  </section>;
}

export function ModernReport({ scan }: { scan: PreviewScan }) {
  const { plan } = useSession();
  const hasProAccess = plan === "pro" || plan === "lifetime";
  const patterns = useMemo(() => buildReportPositions(scan.result!, hasProAccess), [scan.result, hasProAccess]);
  const groups = useMemo(() => findingsByCategory(scan.result!), [scan.result]);
  const [filter, setFilter] = useState<Filter>("All findings");
  const [selectedId, setSelectedId] = useState("");
  const [completed, setCompleted] = useState<string[]>([]);
  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(`modern-report-practice:${scan.id}`) ?? "[]");
      if (Array.isArray(saved)) setCompleted(saved.filter((id): id is string => typeof id === "string").slice(0, 10000));
    } catch { /* Practice remains available when storage is disabled. */ }
  }, [scan.id]);
  function completePosition(id: string) {
    const next = completed.includes(id) ? completed : [...completed, id];
    setCompleted(next);
    try { localStorage.setItem(`modern-report-practice:${scan.id}`, JSON.stringify(next)); } catch { /* Keep in-memory progress. */ }
  }
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [copyMessage, setCopyMessage] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const visible = patterns.filter(p => (filter === "All findings" || p.category === filter) && `${p.title} ${p.tags?.join(" ")} ${p.context} ${p.played} ${p.best}`.toLowerCase().includes(query.toLowerCase()));
  const selected = visible.find(p => p.id === selectedId) ?? visible[0];
  const currentIndex = selected ? visible.findIndex(p => p.id === selected.id) : -1;
  const total = (item: Filter) => item === "All findings" ? CATEGORIES.reduce((n,c) => n+groups[c].length,0) : groups[item].length;
  const lockedCount = hasProAccess ? 0 : CATEGORIES.filter(category => filter === "All findings" || category === filter).reduce((count,category) => count + Math.max(0, groups[category].length - FREE_FINDING_LIMITS[category]), 0);
  const pageCount = Math.ceil(visible.length / 8);
  const currentPage = Math.min(page, Math.max(0,pageCount-1));
  const reportUrl = `/report/${scan.id}?view=classic`;
  const sample = SAMPLE_REPORTS.find(r => r.reportId === scan.id);
  const meta = scan.reportMeta;
  function changeFilter(next: Filter) { setFilter(next); setQuery(""); setPage(0); setSelectedId(""); }
  async function copyLink() {
    try { await navigator.clipboard.writeText(`${window.location.origin}/report/${scan.id}`); setCopyMessage("Report link copied"); }
    catch { setCopyMessage("Copy the report URL from your address bar."); }
  }
  return <div className={s.root}><PreviewHeader report /><div className={s.reportLayout}>
    <aside className={s.sidebar} aria-label="Report navigation"><Link className={s.backLink} href="/"><ArrowLeft size={15} />Back to analyzer</Link><span className={s.sidebarLabel}>YOUR REPORT</span><nav>{FILTERS.map((item,i) => { const Icon = [LayoutGrid,BookOpen,Crosshair,Flag,Sparkles,Clock3,LayersIcon][i]; return <button key={item} onClick={() => changeFilter(item)} aria-current={filter === item ? "page" : undefined}><Icon size={18} />{item === "All findings" ? "Overview" : item}<span>{total(item)}</span></button>; })}</nav><div className={s.sidebarDivider} /><span className={s.sidebarLabel}>KEEP IMPROVING</span><Link className={s.sidebarLink} href="/newtraining"><Target size={18} />Training center<ArrowUpRight size={13} /></Link><Link className={s.sidebarLink} href="/newdashboard"><Clock3 size={18} />Saved reports<ArrowUpRight size={13} /></Link><div className={s.sidebarNote}><span className={s.smallIcon}><Lightbulb size={18} /></span><h3>One idea at a time.</h3><p>Review a position, then put the better move into practice.</p><div className={s.progressTrack}><span style={{ width: `${patterns.length ? completed.length / patterns.length * 100 : 0}%` }} /></div><span>{completed.length} of {patterns.length} available positions practiced</span></div></aside>
    <div className={s.reportMain}><div className={s.reportBreadcrumb}><span>Analysis <ChevronRight size={13} />{sample ? "Sample report" : "Your report"}</span><button onClick={copyLink} className={s.quietButton}><Copy size={14} />Copy report link</button></div>{copyMessage && <p role="status" className={s.copyStatus}>{copyMessage}</p>}
      <header className={s.reportTitle}><div className={s.reportIdentity}>{sample?.imageUrl && <Image src={sample.imageUrl} alt="" width={52} height={52} />}<div><div className={s.reportOverline}>{scan.source === "chesscom" ? "CHESS.COM" : scan.source.toUpperCase()} <span>•</span> {sample ? "SAVED SAMPLE SCAN" : "ANALYZED SCAN"}</div><h1>{scan.chessUsername}<span>’s report</span></h1></div></div><button className={s.secondaryButton} onClick={() => setShowDetails(!showDetails)} aria-expanded={showDetails}><BookOpen size={15} />Scan details</button></header>
      {showDetails && <div className={s.scanDetails}><strong>Analysis settings</strong><p>{scan.config.maxGames} game limit · First {scan.config.maxMoves} opening moves · Engine depth {scan.config.engineDepth} · {scan.config.cpThreshold}cp threshold · {scan.config.speed.join(", ")} time controls</p><p>These results come from the stored scan. Findings may overlap across categories. Practice progress is saved on this device when browser storage is available.</p><Link href={reportUrl}>Open original report <ArrowUpRight size={14} /></Link></div>}
      <div className={s.reportMetrics}><div><span>Games analyzed</span><strong>{scan.result!.gamesAnalyzed}<span> games</span></strong></div><div><span>Reported accuracy</span><strong>{meta?.estimatedAccuracy.toFixed(1) ?? "—"}<span>%</span></strong></div><div><span>Recurring opening leaks</span><strong>{scan.result!.leaks.length}</strong></div><div><span>Findings across sections</span><strong>{total("All findings")}</strong></div></div>
      <div className={s.filterBar} aria-label="Report sections">{FILTERS.map(item => <button key={item} onClick={() => changeFilter(item)} aria-pressed={filter === item}>{item === "All findings" ? "Overview" : item}<span>{total(item)}</span></button>)}</div>
      <ReportDetails scan={scan} filter={filter} hasProAccess={hasProAccess} />
      <div className={s.reportSectionTitle} id="position-workspace"><div><h2>{filter === "All findings" ? "Turn findings into progress" : `${filter} · position review`}</h2><p>Choose a finding. Compare the moves. Practice the idea.</p></div><span className={s.sampleLabel}>{total(filter)} stored findings</span></div>
      <div className={s.findingTools}><label>Search available positions<input type="search" placeholder="Opening, theme, move or game…" value={query} onChange={e => {setQuery(e.target.value);setPage(0);setSelectedId("");}} /></label><span>{visible.length} playable positions{!hasProAccess ? " on your Free plan" : " available"}</span></div>
      {!hasProAccess && <div className={s.accessNote}><ShieldCheck size={18} /><p>{lockedCount > 0 ? `${lockedCount} more ${filter === "All findings" ? "findings" : filter.toLowerCase() + " findings"} found. ` : ""}Free includes three openings, tactics and endgames, plus one brilliant move, clock moment and positional example. Review and practice every unlocked position.</p><Link href="/newpricing">Unlock full report <ArrowUpRight size={14} /></Link></div>}
      <div className={s.patternList} aria-label="Select a position">{visible.slice(currentPage*8,currentPage*8+8).map((pattern,i) => <button key={pattern.id} data-category={pattern.category} className={selected?.id === pattern.id ? s.patternSelected : ""} onClick={() => setSelectedId(pattern.id)} aria-pressed={selected?.id === pattern.id}><span className={s.patternNumber}>{completed.includes(pattern.id) ? <Check size={17} /> : String(currentPage*8+i+1).padStart(2,"0")}</span><span><strong>{pattern.title}</strong><small>{pattern.category} · {pattern.severity}</small></span><ChevronRight size={16} /></button>)}</div>
      {pageCount > 1 && <div className={s.pagination}><button className={s.secondaryButton} disabled={currentPage === 0} onClick={() => {setPage(currentPage-1);setSelectedId(visible[(currentPage-1)*8].id);}}><ChevronLeft size={16} />Previous</button><span>Page {currentPage+1} of {pageCount}</span><button className={s.secondaryButton} disabled={currentPage+1 >= pageCount} onClick={() => {setPage(currentPage+1);setSelectedId(visible[(currentPage+1)*8].id);}}>Next<ChevronRight size={16} /></button></div>}
      {selected ? <StudyPosition key={selected.id} pattern={selected} reportUrl={reportUrl} positionIndex={currentIndex} positionCount={visible.length} onPrevious={() => {setSelectedId(visible[currentIndex-1].id);setPage(Math.floor((currentIndex-1)/8));}} onComplete={completePosition} hasNext={currentIndex < visible.length-1} onNext={() => {setSelectedId(visible[currentIndex+1].id);setPage(Math.floor((currentIndex+1)/8));}} /> : <div className={s.scanDetails}><h3>No playable positions match this selection.</h3><p>Try another search or section. Some older findings do not include a legal engine continuation.</p><Link href={reportUrl}>View the original findings</Link></div>}
      <ReportWorkspace id={scan.id} /><section className={`${s.summaryCard} ${s.reportActionCard}`}><span className={s.eyebrow}>YOUR NEXT SESSION</span><h2>Keep working on one idea.</h2><p>Choose a section above and practice its available positions. Your completed positions are remembered on this device.</p><div className={s.arrowLegend}><Link className={s.primaryButton} href="/newtraining">Open training center <ArrowRight size={16} /></Link><Link className={s.secondaryButton} href={reportUrl}>Manage or save this report <ArrowUpRight size={15} /></Link></div></section><div className={s.reportFooter}><span><Trophy size={16} />Keep building on what works.</span><Link href={reportUrl}>Open original report <ArrowUpRight size={15} /></Link></div>
    </div></div></div>;
}
function LayersIcon({ size }: { size: number }) { return <LayoutGrid size={size} />; }
