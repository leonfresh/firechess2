"use client";

/**
 * PercentileWidget — fetches percentile data from /api/percentile
 * and displays the user's rank relative to all FireChess users.
 */

import { useEffect, useState } from "react";

type PercentileData = {
  accuracyPercentile?: number;
  ratingPercentile?: number;
  totalReports: number;
};

type PercentileWidgetProps = {
  accuracy: number | null;
  rating: number | null;
};

export function PercentileWidget({ accuracy, rating }: PercentileWidgetProps) {
  const [data, setData] = useState<PercentileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (accuracy == null && rating == null) {
      setLoading(false);
      return;
    }

    const params = new URLSearchParams();
    if (accuracy != null) params.set("accuracy", accuracy.toFixed(2));
    if (rating != null) params.set("rating", rating.toFixed(0));

    fetch(`/api/percentile?${params.toString()}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accuracy, rating]);

  if (loading || !data || data.totalReports < 5) return null;

  const accPct = data.accuracyPercentile;
  const ratPct = data.ratingPercentile;

  return (
    <div className="glass-card space-y-4 p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-xl">
          🏆
        </span>
        <div>
          <h2 className="text-lg font-semibold text-white">
            How You Compare
          </h2>
          <p className="text-xs text-white/40">
            vs. {data.totalReports.toLocaleString()} FireChess reports
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {accPct != null && (
          <PercentileBar
            label="Accuracy"
            percentile={accPct}
            value={`${accuracy?.toFixed(1)}%`}
            color="emerald"
          />
        )}
        {ratPct != null && (
          <PercentileBar
            label="Estimated Rating"
            percentile={ratPct}
            value={`${Math.round(rating ?? 0)}`}
            color="cyan"
          />
        )}
      </div>

      {/* Motivational message */}
      {(accPct != null || ratPct != null) && (
        <p className="text-center text-xs text-white/30">
          {motivationalMessage(accPct, ratPct)}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Bar visual                                                          */
/* ------------------------------------------------------------------ */

function PercentileBar({
  label,
  percentile,
  value,
  color,
}: {
  label: string;
  percentile: number;
  value: string;
  color: "emerald" | "cyan";
}) {
  const bgColor =
    color === "emerald"
      ? "bg-emerald-500"
      : "bg-cyan-500";

  const textColor =
    color === "emerald"
      ? "text-emerald-400"
      : "text-cyan-400";

  const trackColor =
    color === "emerald"
      ? "bg-emerald-500/10"
      : "bg-cyan-500/10";

  return (
    <div className="space-y-2 rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/40">{label}</span>
        <span className="text-xs font-medium text-white/50">{value}</span>
      </div>

      {/* Progress bar */}
      <div className={`h-2 w-full overflow-hidden rounded-full ${trackColor}`}>
        <div
          className={`h-full rounded-full ${bgColor} transition-all duration-700`}
          style={{ width: `${Math.max(percentile, 2)}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className={`text-lg font-bold ${textColor}`}>
          Top {100 - percentile}%
        </span>
        <span className="text-[10px] text-white/25">
          Better than {percentile}% of players
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Motivational copy                                                   */
/* ------------------------------------------------------------------ */

function motivationalMessage(
  accPct: number | undefined,
  ratPct: number | undefined
): string {
  const best = Math.max(accPct ?? 0, ratPct ?? 0);

  if (best >= 90) return "Outstanding! You're in the elite tier of FireChess users.";
  if (best >= 75) return "Great work! You're well above average. Keep refining your game.";
  if (best >= 50) return "Solid performance! You're ahead of most players. Keep scanning to climb higher.";
  if (best >= 25) return "Good start! Regular analysis will help you climb the ranks.";
  return "Every master was once a beginner. Keep analyzing and improving!";
}
