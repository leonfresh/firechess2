"use client";

import type { MentalStats } from "@/lib/types";

function HelpTip({ text }: { text: string }) {
  return (
    <span className="group relative ml-1 inline-flex">
      <span className="flex h-[15px] w-[15px] cursor-help items-center justify-center rounded-full border border-[#1e1a24] bg-[#ff5a1f]/[0.05] text-[9px] font-bold leading-none text-[#565061] transition-colors group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10 group-hover:text-emerald-400">
        ?
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-[9999] mb-2 w-48 -translate-x-1/2 rounded-lg border border-[#1e1a24] bg-slate-900/95 px-3 py-2 text-[11px] font-normal normal-case leading-snug tracking-normal text-[#f0edf2] opacity-0 shadow-xl backdrop-blur-sm transition-opacity group-hover:opacity-100">
        {text}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-900/95" />
      </span>
    </span>
  );
}

export function MentalGameLoading() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#1e1a24] p-6 md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/[0.06] via-amber-500/[0.04] to-rose-500/[0.06]" />
      <div className="relative">
        <h2 className="text-xl font-bold text-white">Mental Game</h2>
        <p className="mt-1 text-xs text-[#565061]">
          Analysing result patterns across your games...
        </p>
        <div className="space-y-4 animate-pulse py-2">
          {[1, 2, 3].map((index) => (
            <div
              key={index}
              className="rounded-xl border border-[#1e1a24] bg-[#ff5a1f]/[0.03] p-4"
            >
              <div className="flex gap-4">
                <div className="h-16 w-16 shrink-0 rounded-xl bg-[#1e1a24]" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3.5 w-3/4 rounded bg-[#1e1a24]" />
                  <div className="h-3 w-1/2 rounded bg-[#1e1a24]" />
                  <div className="h-3 w-2/3 rounded bg-[#1e1a24]" />
                </div>
              </div>
            </div>
          ))}
          <p className="text-center text-xs text-[#565061]">
            Calculating stability, tilt rate, streaks and more...
          </p>
        </div>
      </div>
    </div>
  );
}

export function ScanMentalGame({
  mentalStats,
  hasProAccess,
}: {
  mentalStats: MentalStats;
  hasProAccess: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#1e1a24] p-6 md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/[0.08] via-amber-500/[0.05] to-rose-500/[0.08]" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-violet-500/10 blur-[60px]" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-amber-500/10 blur-[60px]" />

      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-white">Mental Game</h2>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/20 bg-violet-500/[0.08] px-3 py-1 text-xs font-medium text-violet-400">
              🧠 Psychology
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-500/20 bg-slate-500/[0.08] px-3 py-1 text-xs font-medium text-[#8d8696]">
              {mentalStats.totalGames} games · {mentalStats.wins}W{" "}
              {mentalStats.losses}L {mentalStats.draws}D
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: "🧘",
              label: "Stability",
              value: `${mentalStats.stability}`,
              sub:
                mentalStats.stability >= 70
                  ? "Steady"
                  : mentalStats.stability >= 40
                    ? "Average"
                    : "Volatile",
              color:
                mentalStats.stability >= 70
                  ? "text-emerald-400"
                  : mentalStats.stability >= 40
                    ? "text-amber-400"
                    : "text-red-400",
              help: "Mental consistency between games. High means predictable performance, low means performance swings between sessions.",
            },
            {
              icon: "🌡️",
              label: "Tilt",
              value: `${mentalStats.tiltRate}%`,
              sub:
                mentalStats.tiltRate <= 30
                  ? "Resilient"
                  : mentalStats.tiltRate <= 50
                    ? "Moderate"
                    : "Tilts Often",
              color:
                mentalStats.tiltRate <= 30
                  ? "text-emerald-400"
                  : mentalStats.tiltRate <= 50
                    ? "text-amber-400"
                    : "text-red-400",
              help: "How often a loss is immediately followed by another loss. Lower is better and means you recover well.",
            },
            {
              icon: "💪",
              label: "Post-Loss",
              value: `${mentalStats.postLossWinRate}%`,
              sub:
                mentalStats.postLossWinRate >= 40
                  ? "Recovers"
                  : mentalStats.postLossWinRate >= 25
                    ? "Struggles"
                    : "Spirals",
              color:
                mentalStats.postLossWinRate >= 40
                  ? "text-emerald-400"
                  : mentalStats.postLossWinRate >= 25
                    ? "text-amber-400"
                    : "text-red-400",
              help: "Win rate in the game immediately after a loss. High means strong bounce-back ability.",
            },
          ].map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className="flex items-center gap-2">
                <span className="text-base">{stat.icon}</span>
                <p className="text-[11px] font-medium uppercase tracking-wider text-[#565061]">
                  {stat.label}
                  <HelpTip text={stat.help} />
                </p>
              </div>
              <p className={`mt-1 text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </p>
              <p className={`mt-0.5 text-xs ${stat.color} opacity-70`}>
                {stat.sub}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: "⏱️",
              label: "Timeouts",
              value: `${mentalStats.timeoutRate}%`,
              sub:
                mentalStats.timeoutRate <= 5
                  ? "Rare"
                  : mentalStats.timeoutRate <= 15
                    ? "Sometimes"
                    : "Frequent",
              color:
                mentalStats.timeoutRate <= 5
                  ? "text-cyan-400"
                  : mentalStats.timeoutRate <= 15
                    ? "text-amber-400"
                    : "text-red-400",
              help: "Percentage of games lost on time. High can indicate a time management issue.",
            },
            {
              icon: "🔥",
              label: "Max Streak",
              value: `${mentalStats.maxStreak}`,
              sub:
                mentalStats.maxStreak <= 4
                  ? `${mentalStats.streakType === "win" ? "Win" : "Loss"} · Normal`
                  : mentalStats.maxStreak <= 8
                    ? `${mentalStats.streakType === "win" ? "Win" : "Loss"} · Notable`
                    : `${mentalStats.streakType === "win" ? "Win" : "Loss"} · Extreme`,
              color:
                mentalStats.streakType === "win"
                  ? "text-emerald-400"
                  : "text-red-400",
              help: "Longest consecutive win or loss streak across the analysed games.",
            },
            {
              icon: "🏳️",
              label: "Resigns",
              value: `${mentalStats.resignRate}%`,
              sub:
                mentalStats.resignRate <= 50
                  ? "Fights On"
                  : mentalStats.resignRate <= 75
                    ? "Normal"
                    : "Quick Quitter",
              color:
                mentalStats.resignRate <= 50
                  ? "text-cyan-400"
                  : mentalStats.resignRate <= 75
                    ? "text-amber-400"
                    : "text-red-400",
              help: "Percentage of losses that ended in resignation. Very high may indicate giving up too early.",
            },
          ].map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className="flex items-center gap-2">
                <span className="text-base">{stat.icon}</span>
                <p className="text-[11px] font-medium uppercase tracking-wider text-[#565061]">
                  {stat.label}
                  <HelpTip text={stat.help} />
                </p>
              </div>
              <p className={`mt-1 text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </p>
              <p className={`mt-0.5 text-xs ${stat.color} opacity-70`}>
                {stat.sub}
              </p>
            </div>
          ))}
        </div>

        {hasProAccess ? (
          <>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {mentalStats.archetype ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/[0.1] px-4 py-1.5 text-sm font-semibold text-violet-300">
                  {mentalStats.archetype}
                </span>
              ) : null}
              {mentalStats.recentForm && mentalStats.recentForm.length > 0 ? (
                <div className="flex items-center gap-1">
                  <span className="mr-1 text-[10px] font-medium uppercase tracking-wider text-[#565061]">
                    Last {mentalStats.recentForm.length}
                  </span>
                  {mentalStats.recentForm.map((result, index) => (
                    <span
                      key={`${result}-${index}`}
                      className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${
                        result === "W"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : result === "L"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-slate-500/20 text-[#8d8696]"
                      }`}
                    >
                      {result}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="mt-4">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-[#565061]">
                Color Performance
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-xl border border-[#1e1a24] bg-[#ff5a1f]/[0.03] px-3.5 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ff5a1f]/10 text-sm">
                    ♔
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#8d8696]">
                        White · {mentalStats.whiteGames ?? 0} games
                      </span>
                      <span
                        className={`text-sm font-bold ${(mentalStats.whiteWinRate ?? 0) >= 55 ? "text-emerald-400" : (mentalStats.whiteWinRate ?? 0) >= 45 ? "text-amber-400" : "text-red-400"}`}
                      >
                        {mentalStats.whiteWinRate ?? 0}%
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#1e1a24]">
                      <div
                        className="h-full rounded-full bg-[#ff5a1f]/60 transition-all"
                        style={{ width: `${mentalStats.whiteWinRate ?? 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-[#1e1a24] bg-[#ff5a1f]/[0.03] px-3.5 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-700/50 text-sm">
                    ♚
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#8d8696]">
                        Black · {mentalStats.blackGames ?? 0} games
                      </span>
                      <span
                        className={`text-sm font-bold ${(mentalStats.blackWinRate ?? 0) >= 55 ? "text-emerald-400" : (mentalStats.blackWinRate ?? 0) >= 45 ? "text-amber-400" : "text-red-400"}`}
                      >
                        {mentalStats.blackWinRate ?? 0}%
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#1e1a24]">
                      <div
                        className="h-full rounded-full bg-slate-400/60 transition-all"
                        style={{ width: `${mentalStats.blackWinRate ?? 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-[#565061]">
                Deep Breakdown
              </p>
              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  {
                    icon: "🚀",
                    label: "Momentum",
                    value: `${mentalStats.postWinWinRate ?? 0}%`,
                    sub:
                      (mentalStats.postWinWinRate ?? 0) >= 55
                        ? "Snowballs"
                        : (mentalStats.postWinWinRate ?? 0) >= 40
                          ? "Steady"
                          : "Resets",
                    color:
                      (mentalStats.postWinWinRate ?? 0) >= 55
                        ? "text-emerald-400"
                        : (mentalStats.postWinWinRate ?? 0) >= 40
                          ? "text-amber-400"
                          : "text-red-400",
                    help: "Win rate in the game after a win. High means you build momentum from victories.",
                  },
                  {
                    icon: "💥",
                    label: "Early Losses",
                    value: `${mentalStats.earlyLossRate ?? 0}%`,
                    sub:
                      (mentalStats.earlyLossRate ?? 0) <= 15
                        ? "Rare"
                        : (mentalStats.earlyLossRate ?? 0) <= 30
                          ? "Some"
                          : "Frequent",
                    color:
                      (mentalStats.earlyLossRate ?? 0) <= 15
                        ? "text-emerald-400"
                        : (mentalStats.earlyLossRate ?? 0) <= 30
                          ? "text-amber-400"
                          : "text-red-400",
                    help: "Percentage of losses within the first 20 moves. High means early blunders or mental disengagement.",
                  },
                  {
                    icon: "↩️",
                    label: "Comebacks",
                    value: `${mentalStats.comebackRate ?? 0}%`,
                    sub:
                      (mentalStats.comebackRate ?? 0) >= 60
                        ? "Fighter"
                        : (mentalStats.comebackRate ?? 0) >= 35
                          ? "Average"
                          : "Gives Up",
                    color:
                      (mentalStats.comebackRate ?? 0) >= 60
                        ? "text-emerald-400"
                        : (mentalStats.comebackRate ?? 0) >= 35
                          ? "text-amber-400"
                          : "text-red-400",
                    help: "Percentage of wins that required 30+ moves. High suggests you keep fighting from worse positions.",
                  },
                  {
                    icon: "⚔️",
                    label: "Mate Finish",
                    value: `${mentalStats.mateFinishRate ?? 0}%`,
                    sub:
                      (mentalStats.mateFinishRate ?? 0) >= 40
                        ? "Ruthless"
                        : (mentalStats.mateFinishRate ?? 0) >= 20
                          ? "Normal"
                          : "Rare",
                    color:
                      (mentalStats.mateFinishRate ?? 0) >= 40
                        ? "text-emerald-400"
                        : (mentalStats.mateFinishRate ?? 0) >= 20
                          ? "text-cyan-400"
                          : "text-[#8d8696]",
                    help: "Percentage of wins that ended in checkmate instead of resignation or flagging.",
                  },
                ].map((stat) => (
                  <div key={stat.label} className="stat-card">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{stat.icon}</span>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-[#565061]">
                        {stat.label}
                        <HelpTip text={stat.help} />
                      </p>
                    </div>
                    <p className={`mt-1 text-2xl font-bold ${stat.color}`}>
                      {stat.value}
                    </p>
                    <p className={`mt-0.5 text-xs ${stat.color} opacity-70`}>
                      {stat.sub}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-4">
              {[
                {
                  icon: "✅",
                  label: "Avg Win Length",
                  value: `${mentalStats.avgMovesWin ?? 0}`,
                  sub: "moves",
                  color: "text-emerald-400",
                  help: "Average number of full moves in your wins.",
                },
                {
                  icon: "❌",
                  label: "Avg Loss Length",
                  value: `${mentalStats.avgMovesLoss ?? 0}`,
                  sub: "moves",
                  color: "text-red-400",
                  help: "Average number of full moves in your losses.",
                },
                {
                  icon: "📈",
                  label: "Best Run",
                  value: `${mentalStats.maxWinStreak ?? 0}W`,
                  sub:
                    (mentalStats.maxWinStreak ?? 0) >= 7
                      ? "Hot Streak"
                      : (mentalStats.maxWinStreak ?? 0) >= 4
                        ? "Solid"
                        : "Short",
                  color: "text-emerald-400",
                  help: "Longest consecutive winning streak in the analysed games.",
                },
                {
                  icon: "📉",
                  label: "Worst Run",
                  value: `${mentalStats.maxLossStreak ?? 0}L`,
                  sub:
                    (mentalStats.maxLossStreak ?? 0) >= 6
                      ? "Danger Zone"
                      : (mentalStats.maxLossStreak ?? 0) >= 4
                        ? "Notable"
                        : "Manageable",
                  color:
                    (mentalStats.maxLossStreak ?? 0) >= 6
                      ? "text-red-400"
                      : (mentalStats.maxLossStreak ?? 0) >= 4
                        ? "text-amber-400"
                        : "text-cyan-400",
                  help: "Longest consecutive losing streak. Long streaks may indicate tilt.",
                },
              ].map((stat) => (
                <div key={stat.label} className="stat-card">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{stat.icon}</span>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-[#565061]">
                      {stat.label}
                      <HelpTip text={stat.help} />
                    </p>
                  </div>
                  <p className={`mt-1 text-2xl font-bold ${stat.color}`}>
                    {stat.value}
                  </p>
                  <p className={`mt-0.5 text-xs ${stat.color} opacity-70`}>
                    {stat.sub}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="stat-card">
                <div className="flex items-center gap-2">
                  <span className="text-base">⚔️</span>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-[#565061]">
                    Decisiveness
                    <HelpTip text="Percentage of games that ended decisively. High means aggressive play and playing for the win." />
                  </p>
                </div>
                <p
                  className={`mt-1 text-2xl font-bold ${(mentalStats.decisiveness ?? 0) >= 85 ? "text-violet-400" : "text-cyan-400"}`}
                >
                  {mentalStats.decisiveness ?? 0}%
                </p>
                <p
                  className={`mt-0.5 text-xs opacity-70 ${(mentalStats.decisiveness ?? 0) >= 85 ? "text-violet-400" : "text-cyan-400"}`}
                >
                  {(mentalStats.decisiveness ?? 0) >= 85
                    ? "All or Nothing"
                    : (mentalStats.decisiveness ?? 0) >= 70
                      ? "Plays to Win"
                      : "Draw-Prone"}
                </p>
              </div>

              <div className="stat-card">
                <div className="flex items-center gap-2">
                  <span className="text-base">🤝</span>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-[#565061]">
                    Draw Rate
                    <HelpTip text="Percentage of games ending in a draw. Compare it against your pool and time control." />
                  </p>
                </div>
                <p className="mt-1 text-2xl font-bold text-[#f0edf2]">
                  {mentalStats.drawRate ?? 0}%
                </p>
                <p className="mt-0.5 text-xs text-[#8d8696] opacity-70">
                  {(mentalStats.drawRate ?? 0) >= 20
                    ? "Frequent Draws"
                    : (mentalStats.drawRate ?? 0) >= 8
                      ? "Average"
                      : "Rarely Draws"}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="relative mt-5">
            <div className="pointer-events-none select-none blur-[6px]">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/[0.1] px-4 py-1.5 text-sm font-semibold text-violet-300">
                  🧊 Ice Veins
                </span>
                <div className="flex items-center gap-1">
                  <span className="mr-1 text-[10px] font-medium uppercase tracking-wider text-[#565061]">
                    Last 10
                  </span>
                  {["W", "L", "W", "W", "D", "L", "W", "W", "L", "W"].map(
                    (result, index) => (
                      <span
                        key={`${result}-${index}`}
                        className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${
                          result === "W"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : result === "L"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-slate-500/20 text-[#8d8696]"
                        }`}
                      >
                        {result}
                      </span>
                    ),
                  )}
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-xl border border-[#1e1a24] bg-[#ff5a1f]/[0.03] px-3.5 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ff5a1f]/10 text-sm">
                    ♔
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#8d8696]">
                        White · 42 games
                      </span>
                      <span className="text-sm font-bold text-emerald-400">
                        58.3%
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#1e1a24]">
                      <div className="h-full w-[58%] rounded-full bg-[#ff5a1f]/60" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-[#1e1a24] bg-[#ff5a1f]/[0.03] px-3.5 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-700/50 text-sm">
                    ♚
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#8d8696]">
                        Black · 38 games
                      </span>
                      <span className="text-sm font-bold text-amber-400">
                        47.2%
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#1e1a24]">
                      <div className="h-full w-[47%] rounded-full bg-slate-400/60" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-4">
                {["Momentum", "Early Losses", "Comebacks", "Mate Finish"].map(
                  (label) => (
                    <div key={label} className="stat-card">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-[#565061]">
                        {label}
                      </p>
                      <p className="mt-1 text-2xl font-bold text-emerald-400">
                        42%
                      </p>
                      <p className="mt-0.5 text-xs text-emerald-400 opacity-70">
                        Average
                      </p>
                    </div>
                  ),
                )}
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-4">
                {["Avg Win Len", "Avg Loss Len", "Best Run", "Worst Run"].map(
                  (label) => (
                    <div key={label} className="stat-card">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-[#565061]">
                        {label}
                      </p>
                      <p className="mt-1 text-2xl font-bold text-cyan-400">
                        28
                      </p>
                      <p className="mt-0.5 text-xs text-cyan-400 opacity-70">
                        moves
                      </p>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="rounded-2xl border border-violet-500/30 bg-slate-900/90 px-6 py-4 text-center shadow-2xl backdrop-blur-sm">
                <p className="text-lg font-bold text-white">
                  🔒 Pro Mental Breakdown
                </p>
                <p className="mt-1.5 max-w-xs text-xs text-[#8d8696]">
                  Unlock your emotional archetype, color win rates, momentum
                  analysis, comeback rate, game length trends, and streak
                  details.
                </p>
                <a
                  href="/pricing"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
                >
                  Upgrade to Pro
                </a>
              </div>
            </div>
          </div>
        )}

        <div className="section-divider mt-6" />
        <div className="mt-4">
          <p className="text-xs text-[#565061]">
            Based on {mentalStats.totalGames} game outcomes · Psychology
            estimates
          </p>
        </div>
      </div>
    </div>
  );
}
