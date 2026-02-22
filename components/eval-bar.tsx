"use client";

type EvalBarProps = {
  evalCp: number | null;
  height?: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function EvalBar({ evalCp, height = 340 }: EvalBarProps) {
  const cp = typeof evalCp === "number" ? evalCp : 0;
  const pawns = cp / 100;
  const normalized = clamp(pawns, -4, 4);
  const whiteRatio = 0.5 + normalized / 8;
  const whiteHeight = `${Math.round(whiteRatio * 100)}%`;
  const roundedPawns = Math.round(pawns * 10) / 10;
  const label = `${roundedPawns > 0 ? "+" : ""}${roundedPawns.toString()}`;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative overflow-hidden rounded-md border border-slate-700"
        style={{ width: 22, height }}
        aria-label="Evaluation bar"
      >
        <div className="absolute inset-0 bg-slate-900" />
        <div className="absolute left-0 top-0 w-full bg-slate-100" style={{ height: whiteHeight }} />
      </div>
      <span className="text-xs font-mono text-slate-300">{label}</span>
    </div>
  );
}
