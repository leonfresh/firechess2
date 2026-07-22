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

export function useReportAnalysis(scan: any): {
  analysis: AnalysisResult | null;
  loading: boolean;
  error: string | null;
} {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const result = scan?.result;
    if (!result) return;

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
        if (data?.coachNote) setAnalysis(data);
        else setError("Analysis unavailable");
      })
      .catch(() => setError("Could not connect"))
      .finally(() => setLoading(false));
  }, [scan]);

  return { analysis, loading, error };
}
