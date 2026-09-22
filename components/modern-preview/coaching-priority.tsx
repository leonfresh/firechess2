"use client";

import { useEffect, useMemo, useState } from "react";
import { coachingPriority, coachingTheme, themeHabit } from "@/lib/report-coaching";
import { compareMission, readMission, type MissionSnapshot } from "@/lib/coaching-progress";
import type { PreviewPattern } from "./sample-data";
import { CATEGORIES, findingsByCategory, type PreviewScan } from "./report-data";
import s from "./modern.module.css";

function snapshot(scan: PreviewScan, theme: string): MissionSnapshot {
  const config = scan.config;
  const groups = findingsByCategory(scan.result!);
  const findings = new Set<string>();
  // Count stored findings, not the Free-plan preview. Do not count highlights as mistakes.
  for (const category of CATEGORIES) {
    if (category === "Brilliants") continue;
    for (const row of groups[category]) {
      if (coachingTheme({category, tags: "tags" in row ? row.tags : []}) !== theme) continue;
      findings.add(`${"fenBefore" in row ? row.fenBefore : row.fen}|${row.userMove}`);
    }
  }
  return {version: 1, scanId: scan.id, theme, count: findings.size, games: scan.result!.gamesAnalyzed,
    settings: JSON.stringify([config.engineDepth, config.cpThreshold, config.maxMoves, config.scanMode, [...config.speed].sort(), config.maxTactics, config.maxEndgames]),
    gameUrls: [...new Set((scan.result?.games ?? []).flatMap(g => g.gameUrl ? [g.gameUrl.replace(/\/$/, "")] : []))], createdAt: scan.createdAt ?? null};
}

export function CoachingPriority({ scan, patterns, onTrain, onReview }: { scan: PreviewScan; patterns: PreviewPattern[]; onTrain: (positions: PreviewPattern[]) => void; onReview: (pattern: PreviewPattern) => void }) {
  const priority = useMemo(() => coachingPriority(patterns), [patterns]);
  const storageKey = `firechess-mission-v1:${scan.source}:${scan.chessUsername.toLowerCase()}`;
  const [mission, setMission] = useState<MissionSnapshot | null>(null);
  const [saveStatus, setSaveStatus] = useState("");
  useEffect(() => { setSaveStatus(""); try { setMission(readMission(JSON.parse(localStorage.getItem(storageKey) ?? "null"))); } catch {setMission(null);} }, [storageKey]);
  const comparison = useMemo(() => mission ? compareMission(mission, snapshot(scan, mission.theme)) : null, [mission, scan]);
  if (!priority) return null;
  function saveMission() {
    const next = snapshot(scan, priority!.theme);
    setMission(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); setSaveStatus("Mission saved on this browser. Try it in your next three games, then scan a separate batch."); }
    catch { setSaveStatus("Mission is available for this visit, but browser storage is unavailable."); }
  }
  return <section className={s.habitRoadmap} aria-label="Your first focus">
    <span className={s.eyebrow}>YOUR FIRST FOCUS</span><h2>{priority.theme}</h2><p>{priority.mission}</p>
    <p>This theme appears in {priority.positions.length} distinct available position{priority.positions.length === 1 ? "" : "s"}. It is the most frequent theme in your accessible examples, not a diagnosis of all your games.</p>
    <div className={s.priorityExamples}>{priority.positions.slice(0, 3).map(p => <button className={s.secondaryButton} key={p.id} onClick={() => onReview(p)}><span>{p.played} → review this moment</span><small>{p.context}</small></button>)}</div>
    <button className={s.primaryButton} onClick={() => onTrain(priority.positions)}>Practice my first focus →</button>
    <div className={s.habitMission}><strong>Your next three games</strong><p>{priority.mission}</p><button className={s.secondaryButton} onClick={saveMission}>{mission ? "Use this report as my mission baseline" : "Save my next-game mission"}</button></div>
    {mission && <div className={s.missionComparison}><h3>Your saved mission · {mission.theme}</h3><p>{themeHabit(mission.theme)}</p><p>{comparison?.message}</p><small>Tracks recorded findings, not every occurrence. Scan limits and game selection can affect counts. Stored on this browser only.</small></div>}
    {saveStatus && <p role="status">{saveStatus}</p>}
  </section>;
}
