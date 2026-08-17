"use client";

/**
 * ProgressHighlights — compares the latest report to the previous one
 * for the same player and shows celebratory banners for improvements.
 */

type SavedReportSlim = {
  estimatedAccuracy: number | null;
  estimatedRating: number | null;
  weightedCpLoss: number | null;
  severeLeakRate: number | null;
  leakCount: number | null;
  tacticsCount: number | null;
  gamesAnalyzed: number;
  createdAt: string;
};

type ProgressHighlightsProps = {
  latest: SavedReportSlim;
  previous: SavedReportSlim;
};

type Highlight = {
  icon: string;
  label: string;
  detail: string;
  color: string; // tailwind color class
};

export function ProgressHighlights({
  latest,
  previous,
}: ProgressHighlightsProps) {
  const highlights: Highlight[] = [];

  // Accuracy improved
  if (
    latest.estimatedAccuracy != null &&
    previous.estimatedAccuracy != null &&
    latest.estimatedAccuracy > previous.estimatedAccuracy
  ) {
    const diff = (latest.estimatedAccuracy - previous.estimatedAccuracy).toFixed(
      1
    );
    highlights.push({
      icon: "🎯",
      label: "Accuracy Up!",
      detail: `+${diff}% accuracy (${previous.estimatedAccuracy.toFixed(1)}% → ${latest.estimatedAccuracy.toFixed(1)}%)`,
      color: "emerald",
    });
  }

  // Rating improved
  if (
    latest.estimatedRating != null &&
    previous.estimatedRating != null &&
    latest.estimatedRating > previous.estimatedRating
  ) {
    const diff = Math.round(
      latest.estimatedRating - previous.estimatedRating
    );
    highlights.push({
      icon: "📈",
      label: "Rating Climb!",
      detail: `+${diff} rating points (${Math.round(previous.estimatedRating)} → ${Math.round(latest.estimatedRating)})`,
      color: "cyan",
    });
  }

  // Fewer leaks
  if (
    latest.leakCount != null &&
    previous.leakCount != null &&
    latest.leakCount < previous.leakCount
  ) {
    const diff = previous.leakCount - latest.leakCount;
    highlights.push({
      icon: "🔧",
      label: "Fewer Leaks!",
      detail: `${diff} fewer opening leak${diff !== 1 ? "s" : ""} (${previous.leakCount} → ${latest.leakCount})`,
      color: "violet",
    });
  }

  // Fewer missed tactics
  if (
    latest.tacticsCount != null &&
    previous.tacticsCount != null &&
    latest.tacticsCount < previous.tacticsCount
  ) {
    const diff = previous.tacticsCount - latest.tacticsCount;
    highlights.push({
      icon: "⚡",
      label: "Sharper Tactics!",
      detail: `${diff} fewer missed tactic${diff !== 1 ? "s" : ""} (${previous.tacticsCount} → ${latest.tacticsCount})`,
      color: "amber",
    });
  }

  // Lower CP loss
  if (
    latest.weightedCpLoss != null &&
    previous.weightedCpLoss != null &&
    latest.weightedCpLoss < previous.weightedCpLoss
  ) {
    const diff = (previous.weightedCpLoss - latest.weightedCpLoss).toFixed(1);
    highlights.push({
      icon: "🧠",
      label: "Better Decisions!",
      detail: `−${diff} avg centipawn loss`,
      color: "fuchsia",
    });
  }

  // Lower severe leak rate
  if (
    latest.severeLeakRate != null &&
    previous.severeLeakRate != null &&
    latest.severeLeakRate < previous.severeLeakRate
  ) {
    const diff = (
      (previous.severeLeakRate - latest.severeLeakRate) *
      100
    ).toFixed(1);
    highlights.push({
      icon: "🛡️",
      label: "More Solid!",
      detail: `−${diff}% severe leak rate`,
      color: "teal",
    });
  }

  if (highlights.length === 0) return null;

  const bgMap: Record<string, string> = {
    emerald: "to-[#ff8c42]/[0.08] to-[#ff8c42]/[0.02]",
    cyan: "from-[#ff5a1f]/[0.08] to-[#ff8c42]/[0.02]",
    violet: "from-[#ff5a1f]/[0.08] to-[#ff8c42]/[0.02]",
    amber: "from-[#ff5a1f]/[0.08] to-[#ff8c42]/[0.02]",
    fuchsia: "from-[#ff5a1f]/[0.08] to-[#ff8c42]/[0.02]",
    teal: "from-teal-500/[0.08] to-teal-500/[0.02]",
  };

  const borderMap: Record<string, string> = {
    emerald: "border-emerald-500/20",
    cyan: "border-[#ff5a1f]/25",
    violet: "border-[#ff5a1f]/25",
    amber: "border-[#ff5a1f]/25",
    fuchsia: "border-[#ff5a1f]/25",
    teal: "border-teal-500/20",
  };

  const textMap: Record<string, string> = {
    emerald: "text-emerald-400",
    cyan: "text-[#ff8c42]",
    violet: "text-[#ff8c42]",
    amber: "text-[#ff8c42]",
    fuchsia: "text-[#ff8c42]",
    teal: "text-teal-400",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">🎉</span>
        <h2 className="text-lg font-semibold text-white">Progress Since Last Scan</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {highlights.map((h) => (
          <div
            key={h.label}
            className={`rounded-2xl border bg-gradient-to-br p-4 ${borderMap[h.color] ?? ""} ${bgMap[h.color] ?? ""}`}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1e1a24] text-xl">
                {h.icon}
              </span>
              <div>
                <p className={`text-sm font-bold ${textMap[h.color] ?? "text-white"}`}>
                  {h.label}
                </p>
                <p className="text-xs text-white/50">{h.detail}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
