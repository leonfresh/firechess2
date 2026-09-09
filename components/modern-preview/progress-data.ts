export type ProgressReport = {
  estimatedRating?: number | null; weightedCpLoss?: number | null;
  id: string; chessUsername: string; source: string; estimatedAccuracy: number | null;
  gamesStartDate?: number | null; gamesEndDate?: number | null;
  scanMode?: string; engineDepth?: number | null; maxMoves?: number | null; cpThreshold?: number | null; maxGames?: number | null;
};

/** Compare like-for-like scans of separate game periods, never save timestamps. */
export function comparableHistory(reports: ProgressReport[], selected: ProgressReport) {
  const fields = ["scanMode", "engineDepth", "maxMoves", "cpThreshold", "maxGames"] as const;
  if (fields.some(field => selected[field] == null)) return [];
  const candidates = reports.filter(report =>
    report.chessUsername.toLowerCase() === selected.chessUsername.toLowerCase() &&
    report.source === selected.source && fields.every(field => report[field] === selected[field]) &&
    typeof report.estimatedAccuracy === "number" && Number.isFinite(report.estimatedAccuracy) && report.estimatedAccuracy >= 0 && report.estimatedAccuracy <= 100 &&
    typeof report.gamesStartDate === "number" && Number.isFinite(report.gamesStartDate) &&
    typeof report.gamesEndDate === "number" && Number.isFinite(report.gamesEndDate) && report.gamesEndDate >= report.gamesStartDate,
  ).sort((a,b) => b.gamesEndDate! - a.gamesEndDate!);
  const separate: ProgressReport[] = [];
  for (const report of candidates) {
    if (!separate.length || report.gamesEndDate! < separate[separate.length-1].gamesStartDate!) separate.push(report);
  }
  return separate.slice(0,8).reverse();
}
