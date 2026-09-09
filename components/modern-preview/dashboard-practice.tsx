"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import type { Report } from "./dashboard";
import s from "./modern.module.css";
const DailyChallenge=dynamic(()=>import("@/components/daily-challenge").then(m=>m.DailyChallenge),{ssr:false});
const StudyPlan=dynamic(()=>import("@/components/study-plan").then(m=>m.StudyPlanWidget),{ssr:false});
const Goal=dynamic(()=>import("@/components/goal-widget").then(m=>m.GoalWidget),{ssr:false});
const Repertoire=dynamic(()=>import("@/components/opening-repertoire").then(m=>m.RepertoirePanel),{ssr:false});
const Achievements=dynamic(()=>import("@/components/achievements").then(m=>m.AchievementsPanel),{ssr:false});
export function DashboardPractice({reports}:{reports:Report[]}) {
 const [player,setPlayer]=useState("");const keys=[...new Set(reports.map(r=>`${r.chessUsername} · ${r.source}`))];const selected=player||keys[0];const matching=reports.filter(r=>`${r.chessUsername} · ${r.source}`===selected);const latest=matching[0];const tactics=matching.flatMap(r=>r.missedTactics??[]);
 return <section className={s.detailStack} aria-label="Practice and planning"><div className={s.sectionHeading}><div><span className={s.eyebrow}>MAKE IT A HABIT</span><h2>Your practice workspace</h2></div>{keys.length>1&&<label>Practice player <select value={selected} onChange={e=>setPlayer(e.target.value)}>{keys.map(key=><option key={key}>{key}</option>)}</select></label>}</div>
 <div className={s.overviewGrid}><article className={s.summaryCard}>{tactics.length?<DailyChallenge allTactics={tactics}/>:<><h3>Daily practice</h3><p>Save a report with missed tactics to practice a position from your games.</p></>}</article><article className={s.summaryCard}><Goal currentAccuracy={latest?.estimatedAccuracy??null} currentRating={latest?.estimatedRating??null}/></article></div>
 <details className={s.detailDisclosure}><summary>Study plan <span>Your schedule and next steps</span></summary><div className={s.legacyDetails}><StudyPlan chessUsername={latest?.chessUsername} source={latest?.source}/></div></details>
 <details className={s.detailDisclosure} id="repertoire"><summary>Opening repertoire <span>Manage your saved opening moves</span></summary><div className={s.legacyDetails}><Repertoire/></div></details>
 <details className={s.detailDisclosure}><summary>Achievements <span>Your chess milestones</span></summary><div className={s.legacyDetails}><Achievements ctx={{totalReports:reports.length,totalGames:reports.reduce((n,r)=>n+r.gamesAnalyzed,0),totalLeaks:reports.reduce((n,r)=>n+(r.leakCount??0),0),totalTactics:reports.reduce((n,r)=>n+(r.tacticsCount??0),0),bestAccuracy:reports.some(r=>r.estimatedAccuracy!=null)?Math.max(...reports.map(r=>r.estimatedAccuracy??0)):null,bestRating:reports.some(r=>r.estimatedRating!=null)?Math.max(...reports.map(r=>r.estimatedRating??0)):null,longestStudyStreak:0,studyPlanProgress:0,uniqueUsernames:keys.length,scanModes:[...new Set(reports.map(r=>r.scanMode??"both"))],latestAccuracy:latest?.estimatedAccuracy??null,previousAccuracy:matching[1]?.estimatedAccuracy??null}}/></div></details></section>;
}
