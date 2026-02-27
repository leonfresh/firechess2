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
  const isMate = Math.abs(cp) >= 99000;
  const label = isMate
    ? (() => { const n = 100000 - Math.abs(cp); const sign = cp > 0 ? "+" : "-"; return n <= 0 ? `${sign}Mate` : `${sign}M${n}`; })()
    : `${pawns > 0 ? "+" : ""}${(Math.round(pawns * 10) / 10).toString()}`;

  const isWhiteAdvantage = cp >= 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative overflow-hidden rounded-lg border border-white/[0.08]"
        style={{ width: 24, height }}
        aria-label="Evaluation bar"
      >
        {/* Black side */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900" />
        {/* White side */}
        <div
          className="absolute left-0 top-0 w-full transition-all duration-500 ease-out"
          style={{
            height: whiteHeight,
            background: isWhiteAdvantage
              ? "linear-gradient(to bottom, #f1f5f9, #e2e8f0)"
              : "linear-gradient(to bottom, #e2e8f0, #cbd5e1)",
          }}
        />
        {/* Center line indicator */}
        <div className="absolute left-0 top-1/2 w-full border-t border-white/10" />
      </div>
      <span className={`font-mono text-[10px] font-semibold ${isWhiteAdvantage ? "text-slate-300" : "text-slate-500"}`}>
        {label}
      </span>
    </div>
  );
}
