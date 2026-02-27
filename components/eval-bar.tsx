"use client";

import { useEvalBarSkin } from "@/lib/use-coins";

type EvalBarProps = {
  evalCp: number | null;
  height?: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function EvalBar({ evalCp, height = 340 }: EvalBarProps) {
  const skin = useEvalBarSkin();
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
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to bottom, ${skin.blackGradient[0]}, ${skin.blackGradient[1]})` }}
        />
        {/* White side */}
        <div
          className="absolute left-0 top-0 w-full transition-all duration-500 ease-out"
          style={{
            height: whiteHeight,
            background: isWhiteAdvantage
              ? `linear-gradient(to bottom, ${skin.whiteGradient[0]}, ${skin.whiteGradient[1]})`
              : `linear-gradient(to bottom, ${skin.whiteGradient[1]}, ${skin.whiteGradient[0]})`,
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
