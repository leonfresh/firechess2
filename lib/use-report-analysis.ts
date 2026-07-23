import { useEffect, useState } from "react";

export type SectionKey = "openings" | "tactics" | "endgames" | "positional";

export type AnalysisResult = {
  badges: Array<{ label: string; tier: "positive" | "neutral" | "negative"; explanation: string }>;
  verdict: string;
  strengths: string[];
  weaknesses: string[];
  nextSteps: string[];
  coachNote: string;
  sectionNotes: Record<SectionKey, string>;
};

const SAVE_CACHE_KEY = "fc-ai-analysis-saved-";

export function useReportAnalysis(scan: any): {
  analysis: AnalysisResult | null;
  loading: boolean;
  error: string | null;
} {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const scanId = scan?.id;
    const result = scan?.result;
    // Wait for scan to be complete so all data fields are populated
    if (!result || !scanId || scan.status !== "ready") return;

    // 1. Check if analysis is already persisted in the DB (scan.result.aiAnalysis)
    if (result.aiAnalysis?.coachNote) {
      setAnalysis(result.aiAnalysis as AnalysisResult);
      return;
    }

    // 2. Check localStorage as fallback (for in-progress scans)
    try {
      const cached = window.localStorage.getItem("fc-ai-analysis-" + scanId);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.coachNote) {
          setAnalysis(parsed);
          return;
        }
      }
    } catch { /* ignore */ }

    const leaks = result.leaks ?? [];
    const byReach = [...leaks].sort((a: any, b: any) => (b.reachCount || 0) - (a.reachCount || 0));
    const summary = {
      gamesAnalyzed: result.gamesAnalyzed || 0,
      openingLeaks: leaks.length,
      missedTactics: (result.missedTactics || []).length,
      endgameMistakes: (result.endgameMistakes || []).length,
      repeatedPositions: result.repeatedPositions || 0,
      timeManagementScore: result.timeManagementScore ?? null,
      estimatedRating: result.reportMeta?.estimatedRating ?? null,
      consistencyScore: result.reportMeta?.consistencyScore ?? null,
      topMotif: result.reportMeta?.topTag || "General",
      topLeakOpenings: byReach.slice(0, 5).map((l: any) => l.openingName).filter(Boolean),
      playerUsername: scan.chessUsername || "Player",
      scanMode: scan.scanMode || "both",
      endgameConversionRate: result.endgameStats?.conversionRate ?? null,
      endgameAvgCpLoss: result.endgameStats?.avgCpLoss ?? null,
      endgameWeakestType: result.endgameStats?.weakestType ?? null,
    };

    if (summary.gamesAnalyzed < 5) return;

    setLoading(true);
    setError(null);

    fetch("/api/report/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(summary),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.coachNote) {
          // Validate: LLM must not contradict the data (common hallucination)
          const rawCounts = {
            missedTactics: summary.missedTactics,
            endgameMistakes: summary.endgameMistakes,
            openingLeaks: summary.openingLeaks,
          };
          const text = JSON.stringify(data).toLowerCase();
          for (const [key, val] of Object.entries(rawCounts)) {
            if (val > 0 && (text.includes("zero " + key.replace(/([A-Z])/g, " $1").toLowerCase()) || text.includes("no " + key.replace(/([A-Z])/g, " $1").toLowerCase()))) {
              // LLM hallucinated — fall back to a safe default
              data.coachNote = `Analysis detected ${summary.missedTactics} missed tactics, ${summary.endgameMistakes} endgame mistakes, and ${summary.openingLeaks} opening leaks across ${summary.gamesAnalyzed} games.`;
              data.verdict = `Player with ${summary.missedTactics} missed tactics, ${summary.endgameMistakes} endgame mistakes, and ${summary.openingLeaks} opening leaks.`;
              data.badges = [];
              data.sectionNotes = {};
              break;
            }
          }
          setAnalysis(data);
          // Persist aiAnalysis into the scan's result in DB
          const currentResult = scan.result || {};
          fetch(`/api/scans/${scanId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "x-scan-owner-token": scan.guestToken || "",
            },
            body: JSON.stringify({
              result: { ...currentResult, aiAnalysis: data },
            }),
          }).catch(() => {}); // fire-and-forget
          // Also cache locally
          try {
            window.localStorage.setItem("fc-ai-analysis-" + scanId, JSON.stringify(data));
          } catch { /* quota */ }
        } else {
          setError("Analysis unavailable");
        }
      })
      .catch(() => setError("Could not connect"))
      .finally(() => setLoading(false));
  }, [scan]);

  return { analysis, loading, error };
}
