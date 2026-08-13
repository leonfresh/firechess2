"use client";

import { useEffect, useState } from "react";
import { HeroDemoBoard } from "@/components/hero-demo-board";
import { useReducedMotion } from "@/lib/use-reduced-motion";

type Tab = "Overview" | "Opening Leaks" | "Strengths";
const TABS: Tab[] = ["Opening Leaks", "Overview", "Strengths"];

// ── Rating sparkline ────────────────────────────────────────────────────────
const CHART_POINTS: [number, number][] = [
  [0, 72],
  [4, 74],
  [8, 70],
  [12, 68],
  [16, 65],
  [20, 67],
  [24, 63],
  [28, 60],
  [32, 58],
  [36, 55],
  [40, 52],
  [44, 54],
  [48, 50],
  [52, 46],
  [56, 44],
  [60, 42],
  [64, 38],
  [68, 36],
  [72, 32],
  [76, 30],
  [80, 26],
  [84, 22],
  [88, 18],
  [92, 14],
  [96, 10],
  [100, 7],
];
function ratingPolyline() {
  return CHART_POINTS.map(([x, y]) => `${x},${y}`).join(" ");
}

// ── Board positions (rank 8 to rank 1, file a to h, '.' = empty) ───────────
// Ruy Lopez Exchange after 1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Bxc6 dxc6
const POS_RUY =
  "r.bqkbnr" +
  "pp...ppp" +
  "..p....." +
  "....p..." +
  "....P..." +
  ".....N.." +
  "PPPP.PPP" +
  "RNBQKB.R";

// Sicilian Najdorf after 1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6
const POS_SIC =
  "r.bqkb.r" +
  ".p..pppp" +
  "p..p.n.." +
  "........" +
  "...NP..." +
  "..N....." +
  "PPP..PPP" +
  "R.BQKB.R";

// King's Indian Averbakh after ...0-0 6.Bg5
const POS_KID =
  "r.bq.rk." +
  "ppp.ppbp" +
  "...p.np." +
  "......B." +
  "..PPP..." +
  "..N....." +
  "PP..BPPP" +
  "R..QK.NR";

const OVERVIEW_LEAKS = [
  {
    opening: "Ruy Lopez",
    variant: "Exchange Var.",
    games: 14,
    winRate: 29,
    loss: 1.17,
    pos: POS_RUY,
    played: "Qh5?!",
    best: "Nf3",
    note: "You keep jumping the queen before development finishes, so the same Exchange structure becomes a recurring leak.",
  },
  {
    opening: "Sicilian",
    variant: "Najdorf 6.Bg5",
    games: 9,
    winRate: 33,
    loss: 0.82,
    pos: POS_SIC,
    played: "Be3",
    best: "Bg5",
    note: "The scanner isolates this exact Najdorf branch and shows that the same setup keeps costing you the initiative.",
  },
  {
    opening: "King's Indian",
    variant: "Averbakh Var.",
    games: 7,
    winRate: 43,
    loss: 0.54,
    pos: POS_KID,
    played: "d5",
    best: "Bg5",
    note: "This line is quieter, but the same delayed clamp gives Black too much freedom in a structure you reach often.",
  },
] as const;

const HERO_INSIGHTS = [
  {
    title: "Premature trades",
    value: "6",
    accent: "text-fuchsia-300",
    note: "Exact exchanges that flatten your initiative.",
  },
  {
    title: "Released tension",
    value: "4",
    accent: "text-sky-300",
    note: "Moments where simplifying gave the opponent the easy version.",
  },
  {
    title: "Missed development",
    value: "5",
    accent: "text-violet-300",
    note: "Clear labels for lagging activity and king safety.",
  },
] as const;

function OpeningLeaksPanel({ paused }: { paused?: boolean }) {
  return (
    <div className="p-3 sm:p-4">
      <HeroDemoBoard paused={paused} />
    </div>
  );
}

function OverviewPanel() {
  return (
    <div className="space-y-3 p-3 sm:p-4">
      <div className="grid grid-cols-4 gap-2">
        {[
          {
            label: "Games",
            value: "147",
            color: "text-[#f0edf2]",
            dot: "#94a3b8",
          },
          {
            label: "Leaks",
            value: "23",
            color: "text-red-400",
            dot: "#f87171",
          },
          {
            label: "Accuracy",
            value: "71%",
            color: "text-emerald-400",
            dot: "#34d399",
          },
          {
            label: "Rating gain",
            value: "+86",
            color: "text-sky-300",
            dot: "#7dd3fc",
          },
        ].map(({ label, value, color, dot }) => (
          <div
            key={label}
            className="rounded-xl border border-[#1e1a24] bg-[#ff5a1f]/[0.03] p-2 text-center"
          >
            <svg viewBox="0 0 10 10" className="mx-auto mb-1 h-4 w-4">
              <circle
                cx="5"
                cy="5"
                r="3.5"
                fill={dot}
                fillOpacity="0.3"
                stroke={dot}
                strokeWidth="1"
              />
            </svg>
            <p className={`text-sm font-black tabular-nums ${color}`}>
              {value}
            </p>
            <p className="text-[8px] font-medium text-[#565061]">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid items-start gap-3 md:grid-cols-[minmax(0,1.45fr)_minmax(0,0.95fr)]">
        <div className="self-start rounded-xl border border-[#1e1a24] bg-[#ff5a1f]/[0.03] p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-bold text-white">
              Rating trend &mdash; last 147 games
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-white tabular-nums">
                1648
              </span>
              <span className="text-[10px] font-bold text-sky-300">+86</span>
            </div>
          </div>
          <div className="relative h-14">
            <svg
              viewBox="0 0 100 80"
              className="h-full w-full"
              preserveAspectRatio="none"
            >
              {[20, 40, 60].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  stroke="rgba(255,255,255,0.04)"
                  strokeWidth="0.8"
                />
              ))}
              <polygon
                points={`0,80 ${ratingPolyline()} 100,80`}
                fill="rgba(125,211,252,0.10)"
              />
              <polyline
                points={ratingPolyline()}
                fill="none"
                stroke="#7dd3fc"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="100" cy="7" r="2.5" fill="#7dd3fc" />
            </svg>
          </div>
          <div className="mt-2 flex items-center justify-between text-[9px] font-medium text-[#565061]">
            <span>Rating picture from your own archive</span>
            <span className="text-sky-300">Updated after every scan</span>
          </div>
        </div>

        <div className="rounded-xl border border-fuchsia-400/15 bg-[linear-gradient(160deg,rgba(232,121,249,0.12),rgba(15,23,42,0.7)_45%,rgba(56,189,248,0.08)_100%)] p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-fuchsia-200/85">
                Preview Of The Locked List
              </p>
              <p className="mt-1 text-[9px] leading-relaxed text-[#8d8696]">
                Concrete sample labels from the full report.
              </p>
            </div>
            <span className="rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-[9px] font-bold text-fuchsia-200">
              Live demo
            </span>
          </div>

          <div className="mt-2.5 space-y-1.5">
            {HERO_INSIGHTS.map(({ title, value, accent, note }) => (
              <div
                key={title}
                className="rounded-xl border border-[#1e1a24] bg-slate-950/35 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[9px] font-semibold text-white">{title}</p>
                  <span
                    className={`text-[11px] font-black tabular-nums ${accent}`}
                  >
                    {value}
                  </span>
                </div>
                <p className="mt-0.5 text-[8px] leading-relaxed text-[#565061]">
                  {note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="hidden gap-2 lg:grid lg:grid-cols-3">
        {[
          {
            title: "Visible before unlock",
            note: "Show real sample labels instead of only a blurred wall of results.",
          },
          {
            title: "Human-readable habits",
            note: "Premature trades and released tension beat vague 'positional issues'.",
          },
          {
            title: "Jump to the board",
            note: "Every label still points back to the exact position that created it.",
          },
        ].map(({ title, note }) => (
          <div
            key={title}
            className="rounded-lg border border-[#1e1a24] bg-[#ff5a1f]/[0.03] px-2.5 py-2"
          >
            <p className="text-[10px] font-semibold text-white">{title}</p>
            <p className="mt-1 text-[9px] leading-relaxed text-[#565061]">
              {note}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Radar data ──────────────────────────────────────────────────────────────
// Center (52,52), maxR=38. Hexagon, 6 axes, clockwise from top.
const CX = 52,
  CY = 52;
const RADAR_DIMS = [
  { label: "Accuracy", value: 71, x: 52, y: 25.02, weak: false },
  { label: "Opening", value: 34, x: 63.19, y: 45.54, weak: true },
  { label: "Tactics", value: 65, x: 73.39, y: 64.35, weak: false },
  { label: "Composure", value: 58, x: 52, y: 74.04, weak: false },
  { label: "Time Mgmt", value: 72, x: 28.3, y: 65.68, weak: false },
  { label: "Resilience", value: 61, x: 31.93, y: 40.41, weak: false },
];
const AXIS_TIPS = [
  { x: 52, y: 14 },
  { x: 84.91, y: 33 },
  { x: 84.91, y: 71 },
  { x: 52, y: 90 },
  { x: 19.09, y: 71 },
  { x: 19.09, y: 33 },
];
const LABEL_POS = [
  { x: 52, y: 4, anchor: "middle" as const },
  { x: 96, y: 30, anchor: "start" as const },
  { x: 96, y: 74, anchor: "start" as const },
  { x: 52, y: 100, anchor: "middle" as const },
  { x: 8, y: 74, anchor: "end" as const },
  { x: 8, y: 30, anchor: "end" as const },
];
const RINGS = [
  "52,42.5 60.23,47.25 60.23,56.75 52,61.5 43.77,56.75 43.77,47.25",
  "52,33 68.45,42.5 68.45,61.5 52,71 35.55,61.5 35.55,42.5",
  "52,23.5 76.68,37.75 76.68,66.25 52,80.5 27.32,66.25 27.32,37.75",
  "52,14 84.91,33 84.91,71 52,90 19.09,71 19.09,33",
];
const PLAYER_POLY = RADAR_DIMS.map((d) => `${d.x},${d.y}`).join(" ");

// ── Strengths panel ─────────────────────────────────────────────────────────
function StrengthsPanel() {
  const strengths = RADAR_DIMS.filter((d) => !d.weak && d.value >= 60).sort(
    (a, b) => b.value - a.value,
  );
  const weaknesses = RADAR_DIMS.filter((d) => d.weak || d.value < 55).sort(
    (a, b) => a.value - b.value,
  );

  return (
    <div className="space-y-3 p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold text-white">Your Chess Profile</p>
          <p className="text-[9px] text-[#565061]">Based on 147 games</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
            {strengths.length} strengths
          </span>
          <span className="rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-[9px] font-bold text-fuchsia-300">
            {weaknesses.length} weakness
          </span>
        </div>
      </div>

      {/* Radar + legend */}
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <svg viewBox="0 0 104 104" className="h-full w-full max-h-32">
            {RINGS.map((pts, i) => (
              <polygon
                key={i}
                points={pts}
                fill="none"
                stroke="rgba(255,255,255,0.07)"
                strokeWidth="0.6"
              />
            ))}
            {AXIS_TIPS.map((tip, i) => (
              <line
                key={i}
                x1={CX}
                y1={CY}
                x2={tip.x}
                y2={tip.y}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="0.6"
              />
            ))}
            <polygon
              points={PLAYER_POLY}
              fill="rgba(125,211,252,0.14)"
              stroke="#7dd3fc"
              strokeWidth="1.2"
            />
            {RADAR_DIMS.map((d, i) => (
              <circle
                key={i}
                cx={d.x}
                cy={d.y}
                r="2"
                fill={d.weak ? "#f472b6" : "#22c55e"}
              />
            ))}
            {RADAR_DIMS.map((d, i) => (
              <text
                key={i}
                x={LABEL_POS[i].x}
                y={LABEL_POS[i].y}
                fontSize="4.5"
                textAnchor={LABEL_POS[i].anchor}
                dominantBaseline="middle"
                fill={d.weak ? "#f9a8d4" : "rgba(148,163,184,0.8)"}
                fontWeight={d.weak ? "bold" : "normal"}
              >
                {d.label}
              </text>
            ))}
          </svg>
        </div>
        <div className="flex w-28 shrink-0 flex-col justify-center gap-1.5">
          {RADAR_DIMS.map((d) => (
            <div key={d.label} className="flex items-center gap-1.5">
              <div
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  d.value >= 70
                    ? "bg-emerald-400"
                    : d.value >= 55
                      ? "bg-slate-500"
                      : "bg-fuchsia-400"
                }`}
              />
              <span className="w-14 truncate text-[8px] text-[#8d8696]">
                {d.label}
              </span>
              <span
                className={`text-[8px] font-bold tabular-nums ${
                  d.value >= 70
                    ? "text-emerald-400"
                    : d.value >= 55
                      ? "text-[#f0edf2]"
                      : "text-fuchsia-300"
                }`}
              >
                {d.value}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top strengths */}
      <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-2.5">
        <p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-emerald-500">
          What you do well
        </p>
        <div className="space-y-2">
          {[
            {
              label: "Accuracy",
              value: 71,
              note: "Better than 68% of players your level",
            },
            {
              label: "Time Mgmt",
              value: 72,
              note: "Consistent clock usage in all phases",
            },
            {
              label: "Resilience",
              value: 61,
              note: "You recover well from difficult positions",
            },
          ].map(({ label, value, note }) => (
            <div key={label}>
              <div className="mb-0.5 flex items-center justify-between">
                <span className="text-[9px] font-semibold text-white">
                  {label}
                </span>
                <span className="text-[9px] font-bold text-emerald-400">
                  {value}%
                </span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-[#1e1a24]">
                <div
                  className="h-full rounded-full bg-emerald-500/60"
                  style={{ width: `${value}%` }}
                />
              </div>
              <p className="mt-0.5 text-[8px] text-[#565061]">{note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Weakness insight */}
      <div className="rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/[0.06] p-2.5">
        <p className="text-[9px] font-bold text-fuchsia-200">
          Main weakness: Opening preparation (34%)
        </p>
        <p className="mt-0.5 text-[8px] leading-relaxed text-[#565061]">
          Ruy Lopez and Sicilian handling costs you 1.1+ pawns per game. Fix
          this first.
        </p>
        <div className="mt-2.5">
          <div className="mb-0.5 flex items-center justify-between">
            <span className="text-[9px] font-semibold text-white">
              Opening prep
            </span>
            <span className="text-[9px] font-bold text-fuchsia-200">34%</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-[#1e1a24]">
            <div
              className="h-full rounded-full bg-fuchsia-400/80"
              style={{ width: "34%" }}
            />
          </div>
          <p className="mt-0.5 text-[8px] text-[#565061]">
            Most losses start with known Ruy Lopez and Sicilian structures.
          </p>
        </div>
        <div className="mt-2 flex items-center gap-1 text-[8px] font-semibold text-sky-300">
          <svg
            viewBox="0 0 16 16"
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 2v4m0 0l-2-2m2 2l2-2M4 10h8m-4 0v4"
            />
          </svg>
          Scan your games to get a full personalised plan
        </div>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export function HeroProductScreenshot({ paused }: { paused?: boolean }) {
  const [tab, setTab] = useState<Tab>("Opening Leaks");
  const reducedMotion = useReducedMotion();

  // Each tab has a different natural height inside the fixed-height frame.
  // `flex flex-col justify-center` vertically centers the active tab's content
  // (full width preserved) so the shorter "Opening Leaks" board sits balanced
  // in the frame instead of dumping all its slack at the bottom — no height
  // animation (which read as jank), no clipping of the taller tabs.
  const panelClass = (panel: Tab) =>
    `absolute inset-0 flex flex-col justify-center transition-opacity duration-300 ${
      tab === panel
        ? "pointer-events-auto opacity-100"
        : "pointer-events-none opacity-0"
    }`;

  useEffect(() => {
    // Don't auto-advance tabs when the user prefers reduced motion; the tabs
    // remain clickable so all three views are still reachable.
    if (paused || reducedMotion) return;

    const timeoutMs = tab === "Opening Leaks" ? 5600 : 4200;

    const timer = window.setTimeout(() => {
      setTab((current) => TABS[(TABS.indexOf(current) + 1) % TABS.length]);
    }, timeoutMs);

    return () => window.clearTimeout(timer);
  }, [paused, tab, reducedMotion]);

  return (
    <div className="relative w-full select-none">
      <div className="pointer-events-none absolute -inset-px rounded-[20px] bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.24),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(232,121,249,0.22),transparent_42%)] opacity-90" />
      <div className="relative overflow-hidden rounded-[18px] border border-[#1e1a24] bg-[linear-gradient(160deg,rgba(3,7,18,0.96),rgba(11,15,32,0.94)_52%,rgba(27,20,44,0.96))] shadow-[0_30px_90px_-40px_rgba(14,165,233,0.4)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e1a24] bg-[#ff5a1f]/[0.04] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-sky-400/30 to-fuchsia-500/30 text-[10px] font-black text-sky-100">
              M
            </span>
            <span className="text-[11px] font-bold text-white">
              Mass Analysis
            </span>
            <span className="rounded-full bg-sky-400/10 px-2 py-0.5 text-[9px] font-bold text-sky-200">
              147 games
            </span>
          </div>
          <span className="flex items-center gap-1.5 text-[9px] font-semibold text-fuchsia-200">
            <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-300" />
            Scan complete
          </span>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-0.5 border-b border-[#1e1a24] px-3 pt-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                t === tab ? "text-white" : "text-[#565061] hover:text-[#f0edf2]"
              }`}
            >
              {t === "Strengths"
                ? "Strengths Radar"
                : t === "Opening Leaks"
                  ? "Opening Leaks"
                  : t}
              {t === tab && (
                <span className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-gradient-to-r from-sky-400 via-violet-400 to-fuchsia-400" />
              )}
            </button>
          ))}
        </div>

        <div className="relative min-h-[24rem] sm:min-h-[31rem] lg:min-h-[34rem]">
          <div
            aria-hidden={tab !== "Opening Leaks"}
            className={panelClass("Opening Leaks")}
          >
            <OpeningLeaksPanel paused={paused || tab !== "Opening Leaks"} />
          </div>
          <div
            aria-hidden={tab !== "Overview"}
            className={panelClass("Overview")}
          >
            <OverviewPanel />
          </div>
          <div
            aria-hidden={tab !== "Strengths"}
            className={panelClass("Strengths")}
          >
            <StrengthsPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
