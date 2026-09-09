"use client";

import Link from "next/link";
import { AlertCircle, ArrowLeft, BookOpen, Check, Clock3, Crosshair, Flag, LoaderCircle, RotateCcw } from "lucide-react";
import type { AnalysisProgress } from "@/lib/client-analysis";
import type { PublicScanSessionPayload } from "@/lib/scan-session";
import s from "./modern.module.css";
import styles from "./scan-status.module.css";

type Props = {
  scan: PublicScanSessionPayload;
  progress: AnalysisProgress;
  perPhaseProgress: Partial<Record<AnalysisProgress["phase"], AnalysisProgress>>;
  sectionsReady: ReadonlySet<string>;
  isOwner: boolean;
  retryState: "idle" | "resetting" | "error";
  onRetry: () => void;
};

const sections = [
  { key: "openings", label: "Openings", icon: BookOpen, phases: ["parse", "aggregate", "eval"], mode: "openings" },
  { key: "tactics", label: "Tactics", icon: Crosshair, phases: ["tactics"], mode: "tactics" },
  { key: "endgames", label: "Endgames", icon: Flag, phases: ["endgames"], mode: "endgames" },
  { key: "time", label: "Time management", icon: Clock3, phases: ["time"], mode: "time-management" },
] as const;

export function ModernScanStatus({ scan, progress, perPhaseProgress, sectionsReady, isOwner, retryState, onRetry }: Props) {
  const failed = scan.status === "failed";
  const percent = Number.isFinite(progress.percent) ? Math.min(100, Math.max(0, Math.round(progress.percent))) : 0;
  const source = scan.source === "chesscom" ? "Chess.com" : scan.source === "lichess" ? "Lichess" : "PGN import";
  const activeSections = sections.filter(section => scan.scanMode === "both" || scan.scanMode === section.mode);

  return <div className={s.root} data-testid="modern-scan-status">
    <div className={styles.container}>
      <Link className={styles.back} href="/"><ArrowLeft size={15} />Back to analyzer</Link>
      <header className={styles.heading}>
        <span className={s.eyebrow}>{source} · YOUR PERSONAL CHESS BREAKDOWN</span>
        <h1>{failed ? "Let’s get your scan back on track." : "Your next insight is taking shape."}</h1>
        <p>{failed ? `We couldn’t finish ${scan.chessUsername}’s report.` : `We’re looking through ${scan.chessUsername}’s games for the patterns worth practicing.`}</p>
      </header>

      <section className={styles.statusCard} aria-label={failed ? "Scan error" : "Scan progress"}>
        <div className={styles.statusHeading}>
          <span className={`${styles.statusIcon} ${failed ? styles.failed : ""}`}>{failed ? <AlertCircle size={24} /> : <LoaderCircle size={24} className={styles.spinner} />}</span>
          <div><h2>{failed ? "Scan couldn’t finish" : isOwner ? progress.phase === "done" ? "Finishing your report" : progress.message : "Waiting for scan progress"}</h2>
            <p>{failed ? "Your scan settings are still here." : isOwner ? progress.detail ?? "Your report will open here as soon as the analysis is complete." : "Analysis runs in the browser that started this scan. Keep that tab open until it finishes."}</p></div>
          {!failed && isOwner && <strong className={styles.percent}>{percent}<span>%</span></strong>}
        </div>

        {failed ? <>
          <p className={styles.error} role="alert">{scan.error ?? "Something interrupted the analysis. Please try again."}</p>
          <div className={styles.actions}>
            {isOwner && !scan.savedReportId && <button className={s.primaryButton} disabled={retryState === "resetting"} onClick={onRetry}><RotateCcw size={16} />{retryState === "resetting" ? "Restarting…" : "Retry scan"}</button>}
            <Link className={s.secondaryButton} href="/#scan">Change scan settings</Link>
          </div>
          {retryState === "error" && <p className={styles.error} role="alert">We couldn’t restart the scan. Try again or start a new scan.</p>}
        </> : <>
          <div className={styles.progress} role="progressbar" aria-label="Overall scan progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={isOwner ? percent : undefined} aria-valuetext={isOwner ? `${percent}% complete` : "Waiting for the browser running this scan"}>
            <span style={{ width: `${isOwner ? percent : 0}%` }} />
          </div>
          <div className={styles.sections}>
            {activeSections.map(section => {
              const complete = sectionsReady.has(section.key);
              const phase = section.phases.map(key => perPhaseProgress[key]).filter(Boolean).at(-1);
              const running = Boolean(phase) && !complete;
              const Icon = section.icon;
              return <article key={section.key} className={complete ? styles.complete : running ? styles.active : ""}>
                {complete ? <Check size={19} /> : <Icon size={19} />}
                <div><h3>{section.label}</h3><p>{complete ? "Complete" : running ? phase?.total ? `${phase.current ?? 0} of ${phase.total}` : "Analyzing…" : "Queued"}</p></div>
              </article>;
            })}
          </div>
          <p className={styles.note} role="status">{sectionsReady.size > 0 ? `${sectionsReady.size} ${sectionsReady.size === 1 ? "section" : "sections"} complete. ` : ""}Keep this tab open while your games are analyzed.</p>
        </>}
      </section>
      <div className={styles.settings} aria-label="Scan settings">
        <div><span>Player</span><strong>{scan.chessUsername}</strong></div>
        <div><span>Game limit</span><strong>{scan.config.maxGames.toLocaleString()}</strong></div>
        <div><span>Engine depth</span><strong>{scan.config.engineDepth}</strong></div>
        <div><span>Platform</span><strong>{source}</strong></div>
      </div>
      {scan.expiresAt && !scan.savedReportId && <p className={styles.note}>This is a temporary report link. You can save the completed report to your account to keep it.</p>}
    </div>
  </div>;
}
