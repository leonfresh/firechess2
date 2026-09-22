"use client";

import { buildTrainingSession, coachingTheme, coachingThemes, countingArrows, getPieceDanger, humanExplanation, themeHabit, themeQuote } from "@/lib/report-coaching";
import { buildReviewSession, exerciseKey, readPracticeMemory, recordPractice, type PracticeMemory, type PracticeOutcome } from "@/lib/coaching-progress";
import { CoachingPriority } from "./coaching-priority";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useMemo, useState, type FormEvent } from "react";
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
import { HabitRoadmap, ThreatQuestions, OpponentReply } from "./habit-coach";
import { ReportDetails } from "./report-details";
const FILTERS = ["All findings", ...CATEGORIES] as const;
type Filter = typeof FILTERS[number];

function StudyPosition({ onOutcome, initialPractice = false, onFinish, pattern, onComplete, onNext, hasNext, onPrevious, positionIndex, positionCount, reportUrl }: { onOutcome?: (pattern: PreviewPattern, outcome: PracticeOutcome) => void; initialPractice?: boolean; onFinish?: () => void; onPrevious: () => void; positionIndex: number; positionCount: number; reportUrl: string; pattern: PreviewPattern; onComplete: (id: string) => void; onNext: () => void; hasNext: boolean }) {
  const studyId = useId();
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
  const [mode, setMode] = useState<"review" | "practice">(initialPractice ? "practice" : "review");
  const [counting, setCounting] = useState(false);
  const [countSquare, setCountSquare] = useState<string | null>(null);
  const [reviewLastMove, setReviewLastMove] = useState<PreviewPattern["lastMove"]>();
  const [showDanger, setShowDanger] = useState(true);
  const [moveShown, setMoveShown] = useState<"position" | "played" | "best">("position");
  const [flipped, setFlipped] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [showArrows, setShowArrows] = useState(true);
  const [hint, setHint] = useState(false);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [attemptedMove, setAttemptedMove] = useState("");
  const [solved, setSolved] = useState(false);
  const [reviewFen, setReviewFen] = useState<string | null>(null);
  const [reviewMove, setReviewMove] = useState("");
  const chess = new Chess(reviewFen ?? pattern.fen);
  const side = new Chess(pattern.fen).turn() === "w" ? "white" : "black";
  if (!reviewFen && moveShown !== "position") chess.move(moveShown === "played" ? pattern.played : pattern.best);

  const theme = coachingTheme(pattern);
  const quote = themeQuote(theme);
  const danger = getPieceDanger(chess.fen(), side === "white" ? "w" : "b");
  const dangerStyles = (mode === "review" || counting) && showDanger ? Object.fromEntries(danger.map(p => [p.square, { boxShadow: `inset 0 0 0 5px ${{red: "#ef4444cc", yellow: "#facc15cc", green: "#22c55e77"}[p.level]}` }])) : {};
  const countedPiece = danger.find(p => p.square === countSquare) ?? danger.find(p => p.level === "red") ?? danger.find(p => p.attackers.length) ?? danger[0];
  const lastMove = reviewFen ? reviewLastMove : moveShown === "position" ? pattern.lastMove : new Chess(pattern.fen).move(moveShown === "played" ? pattern.played : pattern.best);
  const lastMoveStyles = lastMove ? { [lastMove.from]: { backgroundColor: "#6e8cc080" }, [lastMove.to]: { backgroundColor: "#6e8cc0b3" } } : {};
  const playedArrow = new Chess(pattern.fen).move(pattern.played);
  const boardArrows: [string, string, string][] = mode === "review" && !reviewFen && moveShown === "position" && (showArrows || hint)
    ? [...(showArrows && pattern.played !== pattern.best ? [[playedArrow.from, playedArrow.to, sidelineColor ?? "#ff7938bb"] as [string,string,string]] : []), [pattern.from, pattern.to, "#63d5a2cc"]]
    : [];

  function reset(practice: boolean) {
    setReviewFen(null); setReviewMove(""); setCounting(false); setCountSquare(null);
    setAttemptedMove(""); setMode(practice ? "practice" : "review"); setMoveShown("position"); setSelectedSquare(null); setHint(false); setFeedback(""); setAnswer(""); setSolved(false);
  }

  function tryMove(move: string | { from: string; to: string; promotion?: string }) {
    if (mode === "review") {
      try {
        const attempt = chess.move(move);
        setReviewFen(chess.fen()); setReviewLastMove({from: attempt.from, to: attempt.to, san: attempt.san}); setReviewMove(attempt.san); setSelectedSquare(null); setHint(false); setFeedback(""); return true;
      } catch { setFeedback("That move is not legal in this position."); setSelectedSquare(null); return false; }
    }
    if (solved) return false;
    try {
      const attempt = new Chess(pattern.fen).move(move);
      if (attempt.from === pattern.from && attempt.to === pattern.to && attempt.promotion === pattern.promotion) {
        setSolved(true); setMoveShown("best"); setFeedback(`That’s it — ${pattern.best}. ${themeHabit(theme)}`); setSelectedSquare(null); onComplete(pattern.id); onOutcome?.(pattern, "solved"); return true;
      }
      onOutcome?.(pattern, "missed"); setAttemptedMove(attempt.san); setFeedback(`${attempt.san} is legal, but differs from the report’s recommended move. Check their reply and compare your options.`);
    } catch { setFeedback("That move isn’t legal in this position. Try again."); }
    setSelectedSquare(null); return false;
  }

  function selectSquare(square: string) {
    if (counting) { if (danger.some(p => p.square === square)) setCountSquare(square); return; }
    if (mode === "practice" && solved) return;
    const game = mode === "review" ? chess : new Chess(pattern.fen);
    const piece = game.get(square as Square);
    if (piece?.color === game.turn()) { setSelectedSquare(square); return; }
    if (selectedSquare) tryMove({ from: selectedSquare, to: square, promotion: pattern.promotion ?? "q" });
  }

  function submitAnswer(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (answer.trim()) tryMove(answer.trim()); }

  return <section className={s.studyPanel} data-category={pattern.category} aria-label="Position review">
    <div className={s.studyHeader}><div><span className={s.eyebrow}>{pattern.category.toUpperCase()} / POSITION REVIEW</span><h2>{mode === "practice" ? theme : pattern.title}</h2></div><div className={s.segment}><button aria-pressed={mode === "review"} onClick={() => reset(false)}>Review</button><button aria-pressed={mode === "practice"} onClick={() => reset(true)}><Target size={14} />Practice</button></div></div>
    <nav className={s.positionNavigation} aria-label="Browse report positions"><button className={s.secondaryButton} disabled={positionIndex === 0} onClick={onPrevious}><ChevronLeft size={16} />Previous position</button><span aria-live="polite">Position {positionIndex + 1} of {positionCount}</span><button className={s.secondaryButton} disabled={!hasNext && !onFinish} onClick={hasNext ? onNext : onFinish}>{!hasNext && onFinish ? "Finish session" : "Next position"}<ChevronRight size={16} /></button></nav>
    <div className={s.studyGrid}>
      <div className={s.boardColumn}>
        <div className={s.boardContext}><span><span className={chess.turn() === "w" ? s.whitePieceDot : s.blackPieceDot} />{chess.turn() === "w" ? "White" : "Black"} to move</span><span>{counting ? "Choose a piece to count" : mode === "practice" ? "Find the best move" : "Drag pieces to explore"}</span></div>
        <PreviewBoard id={`preview-study-${studyId}`} position={chess.fen()} boardOrientation={flipped ? (side === "white" ? "black" : "white") : side}
          arePiecesDraggable={!counting && (mode === "review" || !solved)}
          onSquareClick={selectSquare}
          onPieceDrop={(from, to) => tryMove({ from, to, promotion: pattern.promotion ?? "q" })}
          customArrows={counting ? countingArrows(countedPiece) : boardArrows}
          customSquareStyles={{ ...lastMoveStyles, ...Object.fromEntries(Object.entries(dangerStyles).map(([square, style]) => [square, { ...lastMoveStyles[square], ...style }])), ...(selectedSquare ? { [selectedSquare]: { backgroundColor: "#e9b361" } } : {}) }}
        />
        <div className={s.boardToolbar}><div><button aria-label="Reset position" onClick={() => { setReviewFen(null); setReviewMove(""); setMoveShown("position"); setSelectedSquare(null); setSolved(false); setFeedback(""); }}><RotateCcw size={16} /></button><button aria-label="Flip board" onClick={() => setFlipped(!flipped)}><FlipVertical2 size={16} /></button></div><span>{reviewFen ? `Exploring: ${reviewMove}` : moveShown === "position" ? "Starting position" : moveShown === "played" ? `Played: ${pattern.played}` : `Best move: ${pattern.best}`}</span><button aria-label="Show starting position" disabled={!reviewFen && moveShown === "position"} onClick={() => {setReviewFen(null);setReviewMove("");setMoveShown("position");setSelectedSquare(null);setFeedback("");}}><ChevronLeft size={19} /></button></div>
        {mode === "review" && !counting && <div className={s.arrowLegend}><button className={s.quietButton} aria-pressed={showArrows} onClick={() => setShowArrows(!showArrows)}>{showArrows ? "Hide arrows" : "Show arrows"}</button><span><i className={s.greenDot} />Best move</span><span><i className={s.orangeDot} style={{background:sidelineColor}} />{sideline?.approved ? "Sideline played" : "Played move"}</span></div>}
        <p className={s.lastMoveLabel}>{lastMove ? `Last move: ${lastMove.san} · ${lastMove.from} → ${lastMove.to} (blue squares)` : "Last move unavailable in this saved position."}</p>
        <div className={s.countingPanel}>
          <button className={s.secondaryButton} aria-pressed={counting} onClick={() => {setCounting(v => !v); setSelectedSquare(null);}}>{counting ? "Close counting guide · move pieces" : "Count attackers & defenders"}</button>
          {counting && <><p><strong>Red arrows:</strong> enemy attackers → your piece. <strong>Yellow arrows:</strong> your defenders → that same piece.</p><label>Count around <select value={countedPiece?.square ?? ""} onChange={e => setCountSquare(e.target.value)}>{danger.map(p => <option key={p.square} value={p.square}>{p.piece} on {p.square}</option>)}</select></label>{countedPiece && <p role="status">{countedPiece.piece} on {countedPiece.square}: {countedPiece.attackers.length} attacker(s), {countedPiece.defenders.length} defender(s). Click one of your pieces to count around it.</p>}<p>Follow the arrows from each attacking or defending piece. Counts include pinned pieces; calculate captures in order and compare piece values.</p></>}
        </div>
        {(mode === "review" || counting) && <div className={s.dangerPanel}>
          <button className={s.secondaryButton} aria-pressed={showDanger} onClick={() => setShowDanger(v => !v)}>{showDanger ? "Hide" : "Show"} opponent threat map</button>
          {showDanger && <><p><strong>Red:</strong> king attacked or attackers outnumber defenders. <strong>Yellow:</strong> attacked, with equal or more defenders. <strong>Green:</strong> no direct attack.</p><p>For your {side} pieces in the displayed position. Counts include pinned pieces; piece values, move order and tactical threats still need calculation.</p><ul>{danger.filter(p => p.attackers.length > 0).map(p => <li key={p.square}><strong>{p.square} · {p.piece}</strong>: {p.attackers.length} attacker(s) ({p.attackers.join(", ")}), {p.defenders.length} defender(s){p.defenders.length ? ` (${p.defenders.join(", ")})` : ""}</li>)}</ul>{!danger.some(p => p.attackers.length) && <p>No direct attacks on your pieces. Still check what your opponent could threaten next.</p>}</>}
        </div>}
        {mode === "review" && feedback && <p role="status" className={s.hintText}>{feedback}</p>}
        {mode === "practice" ? <form className={s.moveForm} onSubmit={submitAnswer}><label htmlFor={`move-${studyId}`}>Move a piece, or enter your move</label><div><input id={`move-${studyId}`} value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="e.g. Nf3" autoComplete="off" autoCapitalize="none" disabled={solved} /><button className={s.secondaryButton} disabled={solved || !answer.trim()}>Check move <ArrowRight size={14} /></button></div></form> : <div className={s.moveCompare}><button onClick={() => {setReviewFen(null);setSelectedSquare(null);setFeedback("");setMoveShown("played");}} aria-pressed={!reviewFen && moveShown === "played"}><span className={s.orangeDot} style={{background:sidelineColor}} />You played <strong>{pattern.played}</strong></button><button onClick={() => {setReviewFen(null);setSelectedSquare(null);setFeedback("");setMoveShown("best");}} aria-pressed={!reviewFen && moveShown === "best"}><span className={s.greenDot} />{sideline?.approved ? "Engine preference" : "Better move"} <strong>{pattern.best}</strong></button></div>}
      </div>
      <div className={s.coachColumn}>
        <div className={s.coachLabel}><Sparkles size={16} /><span>{mode === "practice" ? "YOUR TURN" : "THE IDEA BEHIND THE MOVE"}</span></div>
        <h3>{mode === "practice" ? "Make the better move." : theme}</h3>
        <p className={s.coachContext}>{mode === "review" ? pattern.context : "First scan their checks, captures and threats. Then choose your move."}</p>
        {mode === "practice" && !solved && <ThreatQuestions pattern={pattern} onInspect={square => {setCounting(true);setCountSquare(square);}} onReady={() => setCounting(false)} />}
        {mode === "review" && sideline?.approved && <aside className={s.sidelineNote} aria-label="Offbeat sideline"><strong>Offbeat sideline</strong><p>{sideline.games != null && sideline.score != null ? `${pattern.played} scores ${(sideline.score * 100).toFixed(0)}% across ${sideline.games.toLocaleString("en-US")} Lichess database games (wins + half of draws).` : "Your scan identified this move as a known practical sideline."} The engine prefers {pattern.best}; practical results do not establish that the line is objectively sound.</p></aside>}
        {mode === "review" ? <><div className={s.coachText}><span>What happened</span><p>{humanExplanation(pattern)}</p>{quote && <blockquote className={s.gmQuote}>“{quote.quote}”<cite>— {quote.author}</cite></blockquote>}<details><summary>Engine details</summary><p>{pattern.explanation}</p></details></div><div className={s.habitCard}><Lightbulb size={19} /><div><strong>Take this into your next game</strong><p>{themeHabit(theme)}</p></div></div><button className={s.primaryButton} onClick={() => reset(true)}><Target size={17} />Practice this position <ArrowRight size={17} /></button><button className={s.quietButton} onClick={() => { setReviewFen(null); setHint(!hint); setMoveShown("position"); }}><CircleHelp size={15} />{hint ? "Hide move hint" : "Show a move hint"}</button>{hint ? <p className={s.hintText}>{pattern.hint}</p> : null}</> : <><div className={s.coachText}><span>Put the idea into practice</span><p>Select a piece and its destination, drag it to a square, or type your move below the board.</p></div><div className={`${s.practiceFeedback} ${solved ? s.solved : ""}`} role="status" aria-live="polite">{solved ? <Check size={22} /> : <Crosshair size={22} />}<p>{feedback || `Find the best move for ${side}. Your practice progress is saved on this device when browser storage is available.`}</p></div>{!solved ? <><button className={s.secondaryButton} onClick={() => setHint(!hint)}><Lightbulb size={16} />{hint ? "Hide hint" : "Give me a hint"}</button>{hint ? <p className={s.hintText}>{pattern.hint}</p> : null}<button className={s.quietButton} onClick={() => { onOutcome?.(pattern, "revealed"); reset(false); setMoveShown("best"); }}>Show the answer</button></> : <button className={s.primaryButton} onClick={hasNext ? onNext : onFinish ?? (() => reset(false))}>{hasNext ? "Next position" : onFinish ? "Finish session" : "Back to review"}<ArrowRight size={17} /></button>}</>}

        {(mode === "review" || (attemptedMove && !solved)) && <OpponentReply automatic={mode === "practice"} key={`${mode}-${attemptedMove}`} pattern={pattern} move={mode === "review" ? pattern.played : attemptedMove} />}
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
  const [themeFilter, setThemeFilter] = useState("");
  const [themeLimit, setThemeLimit] = useState(6);
  const [session, setTrainingSession] = useState<PreviewPattern[]>([]);
  const [sessionIndex, setSessionIndex] = useState(0);
  const [sessionSolved, setSessionSolved] = useState<string[]>([]);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [sessionRun, setSessionRun] = useState(0);
  const [sessionMissed, setSessionMissed] = useState<string[]>([]);
  const [memory, setMemory] = useState<PracticeMemory>({});
  const [memoryStatus, setMemoryStatus] = useState("");
  const memoryKey = `firechess-practice-v1:${scan.source}:${scan.chessUsername.toLowerCase()}`;
  useEffect(() => {
    try { setMemory(readPracticeMemory(JSON.parse(localStorage.getItem(memoryKey) ?? "{}"))); }
    catch { setMemory({}); }
  }, [memoryKey]);
  function recordOutcome(pattern: PreviewPattern, outcome: PracticeOutcome) {
    const next = recordPractice(memory, pattern, outcome, Date.now());
    setMemory(next);
    try { localStorage.setItem(memoryKey, JSON.stringify(next)); }
    catch { setMemoryStatus("Review progress is kept for this visit only because browser storage is unavailable."); }
  }
  function finishTraining() {
    let next = memory;
    for (const pattern of session) {
      if (!sessionSolved.includes(pattern.id)) next = recordPractice(next, pattern, "missed", Date.now());
    }
    setMemory(next);
    try { localStorage.setItem(memoryKey, JSON.stringify(next)); }
    catch { setMemoryStatus("Review progress is kept for this visit only because browser storage is unavailable."); }
    setSessionFinished(true);
  }
  const reviewSession = buildReviewSession(patterns, memory, Date.now());
  const scheduledCount = patterns.filter(p => memory[exerciseKey(p)]?.due > Date.now()).length;
  const retryPositions = session.filter(p => !sessionSolved.includes(p.id) || sessionMissed.includes(p.id));
  function startSession(pool = patterns, preserveOrder = false) {
    setSessionMissed([]); setTrainingSession(preserveOrder ? pool.slice(0, 6) : buildTrainingSession(pool, completed)); setSessionIndex(0); setSessionSolved([]); setSessionFinished(false); setSessionRun(v => v + 1);
  }
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
  const completedAvailable = patterns.filter(p => completed.includes(p.id)).length;
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [copyMessage, setCopyMessage] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const themeGroups = Object.entries(patterns.filter(p => filter === "All findings" || p.category === filter).reduce<Record<string, number>>((counts, p) => { for (const theme of coachingThemes(p)) counts[theme] = (counts[theme] ?? 0) + 1; return counts; }, {})).sort((a,b) => b[1] - a[1]);
  const visible = patterns.filter(p => (!themeFilter || coachingThemes(p).includes(themeFilter)) && (filter === "All findings" || p.category === filter) && `${p.title} ${coachingThemes(p).join(" ")} ${p.tags?.join(" ")} ${p.context} ${p.played} ${p.best}`.toLowerCase().includes(query.toLowerCase()));
  const selected = visible.find(p => p.id === selectedId) ?? visible[0];
  const currentIndex = selected ? visible.findIndex(p => p.id === selected.id) : -1;
  const total = (item: Filter) => item === "All findings" ? CATEGORIES.reduce((n,c) => n+groups[c].length,0) : groups[item].length;
  const lockedCount = hasProAccess ? 0 : CATEGORIES.filter(category => filter === "All findings" || category === filter).reduce((count,category) => count + Math.max(0, groups[category].length - FREE_FINDING_LIMITS[category]), 0);
  const pageCount = Math.ceil(visible.length / 8);
  const currentPage = Math.min(page, Math.max(0,pageCount-1));
  const reportUrl = `/report/${scan.id}?view=classic`;
  const sample = SAMPLE_REPORTS.find(r => r.reportId === scan.id);
  const meta = scan.reportMeta;
  function changeFilter(next: Filter) { setThemeLimit(6); setThemeFilter(""); setFilter(next); setQuery(""); setPage(0); setSelectedId(""); }

  const sectionLabel = (item: Filter) => item === "All findings" ? "Overview" : item;
  const sectionIndex = FILTERS.indexOf(filter);
  const nextSection = FILTERS[sectionIndex + 1];
  // Pager at the foot of every section: switch tab and land at the top of the
  // new section instead of stranding the reader at the bottom of the page.
  function goToSection(next: Filter) { changeFilter(next); requestAnimationFrame(() => document.getElementById("report-sections")?.scrollIntoView({ block: "start", behavior: "smooth" })); }
  async function copyLink() {
    try { await navigator.clipboard.writeText(`${window.location.origin}/report/${scan.id}`); setCopyMessage("Report link copied"); }
    catch { setCopyMessage("Copy the report URL from your address bar."); }
  }
  return <div className={s.root}><PreviewHeader report /><div className={s.reportLayout}>
    <aside className={s.sidebar} aria-label="Report navigation"><Link className={s.backLink} href="/"><ArrowLeft size={15} />Back to analyzer</Link><span className={s.sidebarLabel}>YOUR REPORT</span><nav>{FILTERS.map((item,i) => { const Icon = [LayoutGrid,BookOpen,Crosshair,Flag,Sparkles,Clock3,LayersIcon][i]; return <button key={item} onClick={() => changeFilter(item)} aria-current={filter === item ? "page" : undefined}><Icon size={18} />{item === "All findings" ? "Overview" : item}<span>{total(item)}</span></button>; })}</nav><div className={s.sidebarDivider} /><span className={s.sidebarLabel}>KEEP IMPROVING</span><Link className={s.sidebarLink} href="/newtraining"><Target size={18} />Training center<ArrowUpRight size={13} /></Link><Link className={s.sidebarLink} href="/newdashboard"><Clock3 size={18} />Saved reports<ArrowUpRight size={13} /></Link><div className={s.sidebarNote}><span className={s.smallIcon}><Lightbulb size={18} /></span><h3>One idea at a time.</h3><p>Review a position, then put the better move into practice.</p><div className={s.progressTrack}><span style={{ width: `${patterns.length ? completedAvailable / patterns.length * 100 : 0}%` }} /></div><span>{completedAvailable} of {patterns.length} available positions practiced</span></div></aside>
    <div className={s.reportMain}><div className={s.reportBreadcrumb}><span>Analysis <ChevronRight size={13} />{sample ? "Sample report" : "Your report"}</span><button onClick={copyLink} className={s.quietButton}><Copy size={14} />Copy report link</button></div>{copyMessage && <p role="status" className={s.copyStatus}>{copyMessage}</p>}
      <header className={s.reportTitle}><div className={s.reportIdentity}>{sample?.imageUrl && <Image src={sample.imageUrl} alt="" width={52} height={52} />}<div><div className={s.reportOverline}>{scan.source === "chesscom" ? "CHESS.COM" : scan.source.toUpperCase()} <span>•</span> {sample ? "SAVED SAMPLE SCAN" : "ANALYZED SCAN"}</div><h1>{scan.chessUsername}<span>’s report</span></h1></div></div><button className={s.secondaryButton} onClick={() => setShowDetails(!showDetails)} aria-expanded={showDetails}><BookOpen size={15} />Scan details</button></header>
      {showDetails && <div className={s.scanDetails}><strong>Analysis settings</strong><p>{scan.config.maxGames} game limit · First {scan.config.maxMoves} opening moves · Engine depth {scan.config.engineDepth} · {scan.config.cpThreshold}cp threshold · {scan.config.speed.join(", ")} time controls</p><p>These results come from the stored scan. Findings may overlap across categories. Practice progress is saved on this device when browser storage is available.</p><Link href={reportUrl}>Open original report <ArrowUpRight size={14} /></Link></div>}
      <div className={s.reportMetrics}><div><span>Games analyzed</span><strong>{scan.result!.gamesAnalyzed}<span> games</span></strong></div><div><span>Reported accuracy</span><strong>{meta?.estimatedAccuracy.toFixed(1) ?? "—"}<span>%</span></strong></div><div><span>Recurring opening leaks</span><strong>{scan.result!.leaks.length}</strong></div><div><span>Findings across sections</span><strong>{total("All findings")}</strong></div></div>
      <div className={s.filterBar} id="report-sections" aria-label="Report sections">{FILTERS.map(item => <button key={item} onClick={() => changeFilter(item)} aria-pressed={filter === item}>{item === "All findings" ? "Overview" : item}<span>{total(item)}</span></button>)}</div>
      <ReportDetails scan={scan} filter={filter} hasProAccess={hasProAccess} />
      <CoachingPriority scan={scan} patterns={patterns} onTrain={positions => {startSession(positions); requestAnimationFrame(() => document.getElementById("report-training")?.scrollIntoView({block:"start"}));}} onReview={pattern => {changeFilter("All findings");setSelectedId(pattern.id);setPage(Math.floor(patterns.findIndex(p => p.id === pattern.id) / 8));requestAnimationFrame(() => document.getElementById("position-workspace")?.scrollIntoView({block:"start"}));}} />
      <section className={`${s.summaryCard} ${s.sessionCard}`} id="report-training">
        <span className={s.eyebrow}>YOUR REPORT · FOCUSED TRAINING</span><h2>Turn this report into your next good habit.</h2><p>A focused session from your own positions: spot the threat, count attackers and defenders, then find the better move. Up to six positions, balanced across your themes.</p>
        <button className={s.primaryButton} disabled={!patterns.length} onClick={() => startSession()}><Target size={18} />{session.length ? "Generate a fresh session" : "Generate my training session"}<ArrowRight size={16} /></button>
        <div className={s.reviewQueue}><strong>Keep the idea, not just the answer</strong><p>{reviewSession.length ? `${reviewSession.length} positions ready: due reviews first, then new available positions with themes you found difficult.` : "No reviews due yet. Missed or revealed answers return after a day; successful recall spaces reviews out to three, then seven days."}{scheduledCount > 0 ? ` ${scheduledCount} available position${scheduledCount === 1 ? "" : "s"} scheduled for a later visit.` : ""}</p>{reviewSession.length > 0 && <button className={s.secondaryButton} onClick={() => startSession(reviewSession, true)}>Review & try similar positions</button>}{memoryStatus && <p role="status">{memoryStatus}</p>}</div>
        {sessionFinished && <div className={s.habitMission}><h3>Take one habit into your next three games</h3><p>{session[0] ? themeHabit(coachingTheme(session[0])) : "Check their threats before choosing your move."}</p><p>{retryPositions.length ? `${retryPositions.length} positions were missed, revealed or left unsolved. Practise them again now, and check your review queue on a later visit.` : "You found each recommended move. Come back later to test recall without looking at the answer."}</p>{retryPositions.length > 0 && <button className={s.secondaryButton} onClick={() => startSession(retryPositions)}>Retry these positions</button>}</div>}
        {!patterns.length && <p>No playable positions are available in this scan yet.</p>}
        {session.length > 0 && <div className={s.sessionProgress} role="status">{sessionFinished ? `Session complete · ${sessionSolved.length} of ${session.length} solved` : `Position ${sessionIndex + 1} of ${session.length} · ${sessionSolved.length} solved`}<p>{sessionFinished ? "Use the threat check before every move in your next game. Repeat these positions later to make the habit stick." : "Try each position before revealing the answer. Skipped positions don’t count as solved."}</p></div>}
      </section>
      <HabitRoadmap rating={scan.result?.playerRating} patterns={patterns} onTrain={positions => {startSession(positions); requestAnimationFrame(() => document.getElementById("report-training")?.scrollIntoView({block: "start"}));}} />
      {session.length > 0 && !sessionFinished && <><StudyPosition onOutcome={(pattern, outcome) => {recordOutcome(pattern, outcome);if (outcome !== "solved") setSessionMissed(ids => ids.includes(pattern.id) ? ids : [...ids, pattern.id]);}} key={`session-${sessionRun}-${sessionIndex}`} initialPractice onFinish={finishTraining} pattern={session[sessionIndex]} reportUrl={reportUrl} positionIndex={sessionIndex} positionCount={session.length} onPrevious={() => setSessionIndex(i => i - 1)} hasNext={sessionIndex < session.length - 1} onNext={() => setSessionIndex(i => i + 1)} onComplete={id => { completePosition(id); setSessionSolved(ids => ids.includes(id) ? ids : [...ids, id]); }} /><button className={s.secondaryButton} onClick={finishTraining}>Finish session</button></>}
      <section className={s.themeSection} aria-label="Coaching themes"><div className={s.reportSectionTitle}><div><span className={s.eyebrow}>START WITH AN IDEA</span><h2>{filter === "Positional" ? "Your positional themes" : "Your themes, in human terms"}</h2><p>Choose a theme to review its positions. A position can appear in more than one theme. Free includes practice for up to six positions per category.</p></div></div><div className={s.themeGrid} id="report-theme-grid">{themeGroups.slice(0, themeLimit).map(([theme, count]) => { const quote = themeQuote(theme); return <button key={theme} aria-pressed={themeFilter === theme} onClick={() => { setThemeFilter(themeFilter === theme ? "" : theme); setQuery(""); setPage(0); setSelectedId(""); document.getElementById("position-workspace")?.scrollIntoView({block:"start"}); }}><span>{count} position{count === 1 ? "" : "s"}</span><h3>{theme}</h3>{quote ? <blockquote>“{quote.quote}”<cite>— {quote.author}</cite></blockquote> : <p>{themeHabit(theme)}</p>}<strong>Explore this theme →</strong></button>; })}</div>{themeGroups.length > 6 && <div className={s.themeMore}><span role="status">Showing {Math.min(themeLimit, themeGroups.length)} of {themeGroups.length} themes</span>{themeLimit < themeGroups.length && <button className={s.secondaryButton} aria-controls="report-theme-grid" onClick={() => setThemeLimit(limit => limit + 6)}>Show more themes <span>({themeGroups.length - themeLimit} more)</span></button>}</div>}</section>
      <div className={s.reportSectionTitle} id="position-workspace"><div><h2>{filter === "All findings" ? "Turn findings into progress" : `${filter} · position review`}</h2><p>Choose a theme or position. Spot the threat. Practice the idea.</p></div><span className={s.sampleLabel}>{total(filter)} stored findings</span></div>
      {themeFilter && <button className={s.secondaryButton} onClick={() => {setThemeFilter("");setPage(0);}}>Theme: {themeFilter} · Clear filter</button>}
      <div className={s.findingTools}><label>Search available positions<input type="search" placeholder="Opening, theme, move or game…" value={query} onChange={e => {setQuery(e.target.value);setPage(0);setSelectedId("");}} /></label><span>{visible.length} playable positions{!hasProAccess ? " on your Free plan" : " available"}</span></div>
      {!hasProAccess && <div className={s.accessNote}><ShieldCheck size={18} /><p>{lockedCount > 0 ? `${lockedCount} more ${filter === "All findings" ? "findings" : filter.toLowerCase() + " findings"} found. ` : ""}Free includes up to six positions in each category per report: openings, tactics, endgames, positional, brilliant moves and time management. Theme coaching, threat maps and training are included for those positions. Pro unlocks the full report.</p><Link href="/newpricing">Unlock full report <ArrowUpRight size={14} /></Link></div>}
      <div className={s.patternList} aria-label="Select a position">{visible.slice(currentPage*8,currentPage*8+8).map((pattern,i) => <button key={pattern.id} data-category={pattern.category} className={selected?.id === pattern.id ? s.patternSelected : ""} onClick={() => setSelectedId(pattern.id)} aria-pressed={selected?.id === pattern.id}><span className={s.patternNumber}>{completed.includes(pattern.id) ? <Check size={17} /> : String(currentPage*8+i+1).padStart(2,"0")}</span><span><strong>{pattern.title}</strong><small>{pattern.category} · {pattern.severity}</small></span><ChevronRight size={16} /></button>)}</div>
      {pageCount > 1 && <div className={s.pagination}><button className={s.secondaryButton} disabled={currentPage === 0} onClick={() => {setPage(currentPage-1);setSelectedId(visible[(currentPage-1)*8].id);}}><ChevronLeft size={16} />Previous</button><span>Page {currentPage+1} of {pageCount}</span><button className={s.secondaryButton} disabled={currentPage+1 >= pageCount} onClick={() => {setPage(currentPage+1);setSelectedId(visible[(currentPage+1)*8].id);}}>Next<ChevronRight size={16} /></button></div>}
      {selected ? <StudyPosition onOutcome={recordOutcome} key={selected.id} pattern={selected} reportUrl={reportUrl} positionIndex={currentIndex} positionCount={visible.length} onPrevious={() => {setSelectedId(visible[currentIndex-1].id);setPage(Math.floor((currentIndex-1)/8));}} onComplete={completePosition} hasNext={currentIndex < visible.length-1} onNext={() => {setSelectedId(visible[currentIndex+1].id);setPage(Math.floor((currentIndex+1)/8));}} /> : <div className={s.scanDetails}><h3>No playable positions match this selection.</h3><p>Try another search or section. Some older findings do not include a legal engine continuation.</p><Link href={reportUrl}>View the original findings</Link></div>}
      <ReportWorkspace id={scan.id} /><section className={`${s.summaryCard} ${s.reportActionCard}`}><span className={s.eyebrow}>YOUR NEXT SESSION</span><h2>Keep working on one idea.</h2><p>Choose a section above and practice its available positions. Your completed positions are remembered on this device.</p><div className={s.arrowLegend}><Link className={s.primaryButton} href="#report-training">Build a session from this report <ArrowRight size={16} /></Link><Link className={s.secondaryButton} href={reportUrl}>Manage or save this report <ArrowUpRight size={15} /></Link></div></section><nav className={s.sectionPager} aria-label="Report section navigation"><span className={s.sectionPagerStatus}>Section {sectionIndex + 1} of {FILTERS.length} · <strong>{sectionLabel(filter)}</strong></span>{nextSection ? <button className={s.primaryButton} onClick={() => goToSection(nextSection)}>Next: {sectionLabel(nextSection)}<ArrowRight size={16} /></button> : <button className={s.secondaryButton} onClick={() => goToSection("All findings")}><LayoutGrid size={15} />Back to overview</button>}</nav><div className={s.reportFooter}><span><Trophy size={16} />Keep building on what works.</span><Link href={reportUrl}>Open original report <ArrowUpRight size={15} /></Link></div>
    </div></div></div>;
}
function LayersIcon({ size }: { size: number }) { return <LayoutGrid size={size} />; }
