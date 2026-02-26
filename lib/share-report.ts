"use client";

/**
 * Generates a shareable report card image using the Canvas API.
 * Returns a data URL (PNG) or triggers a download / native share.
 */

type ReportCardData = {
  username: string;
  source: string;
  accuracy: number;
  estimatedRating: number;
  avgCpLoss: number;
  severeLeakRate: number;
  gamesAnalyzed: number;
  leakCount: number;
  tacticsCount: number;
  grade: string;
  vibeTitle?: string;
};

const GRADE_COLORS: Record<string, string> = {
  S: "#a78bfa",  // violet
  A: "#34d399",  // emerald
  B: "#22d3ee",  // cyan
  C: "#fbbf24",  // amber
  D: "#f97316",  // orange
  F: "#f87171",  // red
};

function computeGrade(accuracy: number): string {
  if (accuracy >= 90) return "S";
  if (accuracy >= 80) return "A";
  if (accuracy >= 70) return "B";
  if (accuracy >= 55) return "C";
  if (accuracy >= 40) return "D";
  return "F";
}

export function generateReportCardImage(data: ReportCardData): string {
  const W = 600;
  const H = 400;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#0c1220");
  grad.addColorStop(0.5, "#0e1a2e");
  grad.addColorStop(1, "#0c1220");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Subtle glow circles
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = "#10b981";
  ctx.beginPath(); ctx.arc(100, 80, 180, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#06b6d4";
  ctx.beginPath(); ctx.arc(500, 320, 150, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  // Border
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

  // Header
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px system-ui, -apple-system, sans-serif";
  ctx.fillText("FireChess Report Card", 32, 44);

  // Username + source
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "14px system-ui, -apple-system, sans-serif";
  ctx.fillText(`${data.username} · ${data.source} · ${data.gamesAnalyzed} games`, 32, 68);

  // Grade circle
  const gradeColor = GRADE_COLORS[data.grade] ?? GRADE_COLORS.C;
  const centerX = W - 90;
  const centerY = 52;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 32, 0, Math.PI * 2);
  ctx.fillStyle = gradeColor + "20";
  ctx.fill();
  ctx.strokeStyle = gradeColor + "60";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = gradeColor;
  ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(data.grade, centerX, centerY + 12);
  ctx.textAlign = "left";

  // Divider
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(32, 90);
  ctx.lineTo(W - 32, 90);
  ctx.stroke();

  // Vibe title
  if (data.vibeTitle) {
    ctx.fillStyle = "#c084fc";
    ctx.font = "italic 13px system-ui, -apple-system, sans-serif";
    ctx.fillText(`"${data.vibeTitle}"`, 32, 116);
  }

  // Stats grid
  const statsY = data.vibeTitle ? 145 : 115;
  const stats: [string, string, string][] = [
    ["Accuracy", `${data.accuracy.toFixed(1)}%`, "#34d399"],
    ["Est. Rating", `${data.estimatedRating.toFixed(0)}`, "#34d399"],
    ["Avg CP Loss", `${(data.avgCpLoss / 100).toFixed(2)}`, "#22d3ee"],
    ["Leak Rate", `${(data.severeLeakRate * 100).toFixed(0)}%`, "#f87171"],
    ["Opening Leaks", `${data.leakCount}`, "#fbbf24"],
    ["Missed Tactics", `${data.tacticsCount}`, "#f97316"],
  ];

  const colW = (W - 64) / 3;
  const rowH = 80;
  stats.forEach(([label, value, color], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 32 + col * colW;
    const y = statsY + row * rowH;

    // Stat box
    ctx.fillStyle = "rgba(255,255,255,0.025)";
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    const boxW = colW - 12;
    const boxH = 62;
    roundedRect(ctx, x, y, boxW, boxH, 10);
    ctx.fill();
    ctx.stroke();

    // Label
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "11px system-ui, -apple-system, sans-serif";
    ctx.fillText(label, x + 12, y + 20);

    // Value
    ctx.fillStyle = color;
    ctx.font = "bold 20px system-ui, -apple-system, sans-serif";
    ctx.fillText(value, x + 12, y + 48);
  });

  // Footer
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.font = "11px system-ui, -apple-system, sans-serif";
  ctx.fillText("firechess.com — Analyze your chess, find your leaks", 32, H - 20);

  // Date
  ctx.textAlign = "right";
  ctx.fillText(new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), W - 32, H - 20);
  ctx.textAlign = "left";

  return canvas.toDataURL("image/png");
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Trigger download or native share of the report card image.
 */
export async function shareReportCard(data: Omit<ReportCardData, "grade">) {
  const grade = computeGrade(data.accuracy);
  const dataUrl = generateReportCardImage({ ...data, grade });

  // Convert data URL to blob
  const res = await fetch(dataUrl);
  const blob = await res.blob();

  // Try native share first (mobile), fallback to download
  if (navigator.share && navigator.canShare?.({ files: [new File([blob], "firechess-report.png", { type: "image/png" })] })) {
    try {
      await navigator.share({
        title: `FireChess Report — ${data.username}`,
        text: `${data.username}'s chess analysis: ${data.accuracy.toFixed(1)}% accuracy, est. ${data.estimatedRating.toFixed(0)} rating`,
        files: [new File([blob], "firechess-report.png", { type: "image/png" })],
      });
      return;
    } catch { /* user cancelled share — fallback to download */ }
  }

  // Fallback: download
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `firechess-report-${data.username}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
