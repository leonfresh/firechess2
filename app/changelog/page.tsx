"use client";

import Link from "next/link";
import { useEffect } from "react";

/* ─────────────────────────────────────────────
 * Changelog data — add newest entries at the TOP.
 * Bump LATEST_VERSION whenever you add a new entry.
 * ───────────────────────────────────────────── */

import { LATEST_VERSION } from "@/lib/constants";

type ChangeType = "feature" | "improvement" | "fix" | "design";

interface ChangeEntry {
  version: number;
  date: string;
  title: string;
  description: string;
  changes: { type: ChangeType; text: string }[];
}

const CHANGELOG: ChangeEntry[] = [
  {
    version: 9,
    date: "Feb 27, 2026",
    title: "Collapsible Sections & Mate Eval Fix",
    description:
      "Report sections are now collapsible in list view to save vertical space, and eval displays throughout the app correctly show \"Mate in X\" instead of nonsensical 999+ values.",
    changes: [
      { type: "improvement", text: "Opening Leaks, Missed Tactics, and Endgame Analysis sections are now collapsible — click the header to toggle open/closed" },
      { type: "improvement", text: "Chevron icon on each section header rotates to indicate open/closed state with a smooth animation" },
      { type: "fix", text: "Opening leak cards no longer show \"990.0\" or \"999+\" for mate scores — now correctly displays \"+M3\", \"-Mate\", etc." },
      { type: "fix", text: "Eval bar label now shows \"M3\" / \"Mate\" for mate positions instead of raw centipawn values like \"+990.0\"" },
      { type: "fix", text: "Endgame \"Worst Blunder\" stat now shows \"Mate\" when the worst miss was a missed mate (matches the tactics section behaviour)" },
    ],
  },
  {
    version: 8,
    date: "Feb 27, 2026",
    title: "Endgame & Tactics Fixes, Opening Quality-of-Life",
    description:
      "Major endgame stat fix, ranked category breakdowns for both endgames and tactics, improved opening name coverage, bigger Opening Rankings boards, and hero/card design upgrades.",
    changes: [
      { type: "fix", text: "Endgame conversion rate & hold rate fixed — was showing ~11% even for GMs because game outcomes from resignation/timeout were silently ignored (only checkmate/stalemate were counted)" },
      { type: "fix", text: "Endgame start eval now captured regardless of whose turn it is — previously skipped ~50% of endgames" },
      { type: "improvement", text: "Endgame categories now ranked worst \u2192 best with numbered badges (#1, #2\u2026), red/amber/green color gradient, and WEAKEST / BEST labels" },
      { type: "improvement", text: "Tactic motif patterns now ranked worst \u2192 best by average CP loss (instead of by count) with the same numbered badge + color gradient system" },
      { type: "improvement", text: "Opening leak cards now show the opening name immediately from source data (Lichess/Chess.com) instead of waiting for the Explorer API" },
      { type: "improvement", text: "Opening Rankings boards enlarged from 72px to 120px with a 2-column grid layout on desktop" },
      { type: "design", text: "Hero demo board enlarged and redesigned with Pattern Detected callout, Eval Shift section, and horizontal badge row" },
      { type: "design", text: "Opening leak cards redesigned with hero-style Pattern Detected gradient callout and Before/After eval comparison" },
      { type: "fix", text: "Opening Rankings no longer stuck on loading — removed serial Lichess Explorer API calls, now renders instantly from scan data" },
      { type: "fix", text: "Opening Rankings boards no longer clip pieces (removed rounded corners) and use the user\u2019s board theme" },
      { type: "improvement", text: "Opening Rankings require at least 5 games per opening to appear (filters out noise)" },
    ],
  },
  {
    version: 7,
    date: "Feb 27, 2026",
    title: "Study Plans, Opening Rankings & Retention Upgrades",
    description:
      "Personalised study plans, opening rankings with mini boards, mental-game stats saved to your dashboard, plus a full retention suite: achievements, goals, rescan reminders, shareable report cards, weekly email digests, daily challenge puzzles, progress highlights, opening repertoire, percentile comparison, and a coin economy with a cosmetic shop.",
    changes: [
      { type: "feature", text: "Coin Economy — earn virtual coins from scans (+15), daily challenges (+10/+3), study tasks (+5), achievements (+20), and repertoire saves (+2)" },
      { type: "feature", text: "Coin Shop — spend earned coins on 10 board colour themes (Ocean, Midnight, Coral, Walnut, Ice, Royal, Neon, Candy, Ember) and 6 profile titles" },
      { type: "feature", text: "Board Themes — purchased themes apply instantly to every chessboard across the app (drill mode, tactic cards, mistake cards, endgame cards, daily challenge, repertoire, hero board)" },
      { type: "feature", text: "Profile Titles — equippable titles (Chess Student, Tactician, Strategist, Master Analyst, Elite Scholar, Grandmaster) shown as a badge on the dashboard header" },
      { type: "feature", text: "Coin balance badge in the navbar — shows your current coin count next to the Dashboard link" },
      { type: "feature", text: "Daily Challenge — a daily puzzle from your own missed tactics, with streak tracking and answer reveal, right on the dashboard" },
      { type: "feature", text: "Progress Highlights — celebratory banners show what improved since your last scan (accuracy, rating, fewer leaks, sharper tactics, etc.)" },
      { type: "feature", text: "Opening Repertoire — save correct moves from any leak card to build a personal opening repertoire you can review on the dashboard" },
      { type: "feature", text: "Percentile Comparison — see how your accuracy and rating rank against all FireChess users with visual progress bars and motivational messages" },
      { type: "feature", text: "Study Plan system — after every scan a weekly study plan is generated with targeted tasks based on your weaknesses" },
      { type: "feature", text: "Per-player study plans — each chess username gets its own independent study plan with separate streaks and progress" },
      { type: "feature", text: "Opening Rankings — new section showing all your openings with mini chessboards, colour badges, W/D/L record, sorted by win-rate (lowest first)" },
      { type: "feature", text: "Mental Game stats now saved to dashboard — composure, tilt score, and archetype persist across sessions" },
      { type: "feature", text: "Tactics toggle in Openings mode — flip a switch to also scan for missed tactics without leaving openings mode" },
      { type: "feature", text: "Achievements & Badges — 22 unlockable badges on the dashboard based on scan count, accuracy milestones, ratings, streaks, and more" },
      { type: "feature", text: "Goal Setting widget — set a target rating or accuracy goal and track your progress on the dashboard with a visual progress bar" },
      { type: "feature", text: "Rescan Reminder — dashboard banner nudges you to rescan if your last analysis is more than 7 days old" },
      { type: "feature", text: "Share Report Card — Canvas-generated 600×400 PNG image of your report card that you can share on social or download" },
      { type: "feature", text: "Weekly Email Digest — opt-in weekly email summary with scan activity, study plan streak, and motivational prompt (Vercel Cron, Resend)" },
      { type: "design", text: "Save-to-Dashboard CTA redesigned — feature pills replaced with a 2×2 card grid (Study Plan, Progress Charts, Daily Streaks, Track Accuracy)" },
      { type: "improvement", text: "Study plans fully ungated — all users get full weekly tasks, streaks, and progress tracking (better for retention)" },
      { type: "improvement", text: "Dashboard player filter now persists to localStorage and auto-selects your username on first visit" },
      { type: "improvement", text: "Drill button cards replaced plain text buttons — each drill option is now a styled card with icon + description" },
      { type: "improvement", text: "Free user opening move cap raised from 15 to 30 moves" },
      { type: "improvement", text: "Endgame categories expanded — \"Minor Piece\" replaced with specific types: Knight vs Bishop, Bishop vs Knight, Two Bishops, Two Knights, Bishop + Knight, Knight vs Knight, Bishop vs Bishop" },
      { type: "improvement", text: "\"Other\" endgame category replaced with Queen + Rook, Queen + Minor, Rook + Bishop, Rook + Knight, and Complex — every endgame now gets a meaningful label" },
      { type: "improvement", text: "Endgame cards now show a contextual coaching tip specific to each endgame type (e.g. Lucena/Philidor for rook endings, opposition for pawn endings)" },
      { type: "improvement", text: "Endgame overview adds Mistake Rate, Worst Blunder, and Failed Conversions stats plus detailed advice for your weakest endgame type" },
      { type: "improvement", text: "Tactics overview now shows Total Eval Lost, Worst Miss, Time Pressure correlation, and a diagnostic coaching insight" },
      { type: "improvement", text: "Tactic cards now show contextual tips based on the mistake type — CCT checklist, time pressure advice, pin/skewer awareness, and more" },
      { type: "fix", text: "Study plan now generates correctly even when a duplicate report is saved" },
      { type: "fix", text: "Tactical Eye radar dimension no longer shows NaN when no tactics are found" },
    ],
  },
  {
    version: 6,
    date: "Feb 26, 2026",
    title: "Feedback System + Admin Panel",
    description:
      "Users can now submit feedback directly from the app. Admin panel added for reviewing and managing submissions.",
    changes: [
      { type: "feature", text: "New /feedback page with category picker (Bug, Feature Request, Question, Other) and message form" },
      { type: "feature", text: "Admin-only feedback viewer at /admin/feedback with status management (New → Read → Resolved)" },
      { type: "improvement", text: "Feedback link added to navbar, profile dropdown, and mobile menu" },
      { type: "improvement", text: "Admin users see an Admin Panel link in the profile dropdown" },
    ],
  },
  {
    version: 5,
    date: "Feb 26, 2026",
    title: "Deep Analysis Cards Redesign",
    description:
      "The expanded insight cards got a complete visual overhaul — each section is now its own card with better hierarchy, and every dimension shows your personal key stat at the top.",
    changes: [
      { type: "design", text: "Detailed Analysis and What This Means are now separate bordered cards with emoji icons (🔍 / 💡)" },
      { type: "design", text: "Study Plan steps are individual cards — step 1 gets an accent gradient border to highlight priority" },
      { type: "feature", text: "Key Stat pill at the top of each expanded card shows your personal metric at a glance" },
      { type: "improvement", text: "Quick Tip renamed to Quick Win with ⚡ icon — styled as an accent-colored action card" },
    ],
  },
  {
    version: 4,
    date: "Feb 26, 2026",
    title: "Save Report CTA + Dashboard Incentive",
    description:
      "Big call-to-action card at the end of every report to save results to your dashboard and track improvement over time.",
    changes: [
      { type: "feature", text: "New gradient CTA card after the report with progress tracking pitch and feature pills" },
      { type: "feature", text: "Card shows contextual copy for signed-in vs anonymous users" },
      { type: "improvement", text: "After saving, the card swaps to a confirmation state with a View Dashboard link" },
    ],
  },
  {
    version: 3,
    date: "Feb 26, 2026",
    title: "Magic Link Sign-in & Lifetime Plan",
    description:
      "You can now sign in with just your email — no password needed. Plus a new one-time Lifetime plan for founding members.",
    changes: [
      { type: "feature", text: "Email magic link sign-in via Resend — enter your email, click the link, you're in" },
      { type: "feature", text: "Lifetime Pro plan ($59 one-time) — full Pro features forever with no recurring fees" },
      { type: "improvement", text: "Pricing page redesigned with 3-column layout and launch pricing card" },
      { type: "improvement", text: "Account page shows Lifetime badge and \"Active forever\" status" },
      { type: "fix", text: "Lifetime users are now protected from accidental Stripe subscription downgrades" },
    ],
  },
  {
    version: 2,
    date: "Feb 26, 2026",
    title: "Promotion Codes & Free Tier Improvements",
    description:
      "Stripe checkout now supports promotion codes, and the free tier got more generous sample limits.",
    changes: [
      { type: "feature", text: "Promo code field now appears at Stripe checkout" },
      { type: "improvement", text: "Free tier now shows 10 sample tactics and 10 sample endgames per scan" },
    ],
  },
  {
    version: 1,
    date: "Feb 24, 2026",
    title: "Initial Release — Stop Making the Same Mistakes",
    description:
      "The first public release of FireChess. Scan hundreds of your Lichess or Chess.com games and discover the patterns holding you back — all powered by Stockfish 18 running privately in your browser.",
    changes: [
      { type: "feature", text: "Opening Leak Detection — find repeated positions where you consistently play the wrong move, with drill mode to practice the correct lines" },
      { type: "feature", text: "Missed Tactics Scanner — surface forks, pins, skewers, and combinations you overlooked across your games, with motif tagging" },
      { type: "feature", text: "Endgame Mistake Scanner — catch losing moves in rook, pawn, and minor piece endgames with position-by-position breakdowns" },
      { type: "feature", text: "Strengths & Weaknesses Radar — six-dimension profile (Accuracy, Opening Prep, Tactical Eye, Composure, Time Mgmt, Resilience) with tiered insight cards" },
      { type: "feature", text: "Report Card — letter grades (S/A/B/C/D/F) for overall accuracy with estimated rating, centipawn loss, and severe leak rate" },
      { type: "feature", text: "Mental Game Stats — composure score, tilt detection, post-loss performance tracking, and player archetype classification" },
      { type: "feature", text: "Interactive Drill Mode — practice your opening leaks with a real board, move-by-move hints, and sound effects" },
      { type: "feature", text: "Opening Explorer integration — every mistake card links to the Lichess opening database for that position" },
      { type: "feature", text: "Move Explanations — see Best Move, Your Move, and Database Move with plain-English reasoning for each flagged position" },
      { type: "feature", text: "Eval Bar — real-time engine evaluation bar on every interactive board" },
      { type: "feature", text: "Scan Modes — choose between Openings, Tactics, Endgames, or scan everything at once" },
      { type: "feature", text: "Dashboard — save reports and track your progress over time with comparison charts" },
      { type: "feature", text: "Lichess + Chess.com support — works with both platforms, fetches games from public APIs" },
      { type: "feature", text: "Stockfish 18 WASM — all analysis runs client-side in your browser via WebAssembly, no data sent to servers" },
      { type: "feature", text: "Multi-worker scanning — parallel Stockfish workers for faster analysis (auto-scales to device cores)" },
      { type: "feature", text: "Google + Lichess OAuth sign-in — authenticate with your existing accounts" },
      { type: "feature", text: "Free + Pro tiers with Stripe billing — free tier for up to 300 games, Pro for up to 5,000 with deeper analysis" },
    ],
  },
];

/* ─── Helpers ─── */

const TYPE_STYLES: Record<ChangeType, { label: string; bg: string; text: string; border: string }> = {
  feature:     { label: "New",         bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  improvement: { label: "Improved",    bg: "bg-cyan-500/10",    text: "text-cyan-400",    border: "border-cyan-500/20" },
  fix:         { label: "Fix",         bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/20" },
  design:      { label: "Design",      bg: "bg-fuchsia-500/10", text: "text-fuchsia-400", border: "border-fuchsia-500/20" },
};

const TYPE_ICONS: Record<ChangeType, string> = {
  feature: "✨",
  improvement: "📈",
  fix: "🔧",
  design: "🎨",
};

/* ─── Page ─── */

export default function ChangelogPage() {
  // Mark as seen when user visits
  useEffect(() => {
    try {
      localStorage.setItem("firechess_changelog_seen", String(LATEST_VERSION));
    } catch {}
  }, []);

  const totalChanges = CHANGELOG.reduce((s, e) => s + e.changes.length, 0);

  return (
    <div className="min-h-screen bg-[#030712]">
      <div className="mx-auto max-w-3xl px-5 py-16 md:px-10 md:py-24">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-cyan-500/20 text-3xl shadow-lg">
            📋
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Dev Notes
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            What&apos;s new in FireChess — {CHANGELOG.length} update{CHANGELOG.length !== 1 ? "s" : ""}, {totalChanges} changes
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-white"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to FireChess
          </Link>
        </div>

        {/* Timeline */}
        <div className="relative space-y-8">
          {/* Vertical line */}
          <div className="pointer-events-none absolute left-[19px] top-2 bottom-2 hidden w-px bg-gradient-to-b from-fuchsia-500/30 via-cyan-500/20 to-transparent md:block" />

          {CHANGELOG.map((entry, ei) => (
            <div key={entry.version} className="relative">
              {/* Timeline dot (desktop) */}
              <div className="pointer-events-none absolute left-[12px] top-7 hidden h-4 w-4 rounded-full border-2 border-fuchsia-500/40 bg-[#030712] md:block">
                <div className="absolute inset-1 rounded-full bg-fuchsia-500/60" />
              </div>

              {/* Card */}
              <div
                className={`animate-fade-in-up overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.03] to-transparent md:ml-10`}
                style={{ animationDelay: `${ei * 80}ms` }}
              >
                {/* Card header */}
                <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-5 py-4 md:px-6">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-fuchsia-500/15 text-lg">
                    {ei === 0 ? "🔥" : "📦"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-bold text-white">{entry.title}</h2>
                    <p className="text-xs text-slate-500">{entry.date} · v{entry.version}</p>
                  </div>
                  {ei === 0 && (
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      Latest
                    </span>
                  )}
                </div>

                {/* Description */}
                <div className="px-5 pt-4 md:px-6">
                  <p className="text-[13px] leading-relaxed text-slate-400">{entry.description}</p>
                </div>

                {/* Change items */}
                <div className="space-y-2 px-5 pb-5 pt-4 md:px-6">
                  {entry.changes.map((change, ci) => {
                    const style = TYPE_STYLES[change.type];
                    const icon = TYPE_ICONS[change.type];
                    return (
                      <div
                        key={ci}
                        className={`flex gap-3 rounded-xl border ${style.border} bg-gradient-to-r from-white/[0.02] to-transparent p-3 transition-all hover:from-white/[0.04]`}
                      >
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${style.bg} text-sm`}>
                          {icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="mb-0.5 flex items-center gap-2">
                            <span className={`rounded-md ${style.bg} px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${style.text}`}>
                              {style.label}
                            </span>
                          </div>
                          <p className="text-[12px] leading-relaxed text-slate-300">{change.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-xs text-slate-600">
            More updates coming soon — follow{" "}
            <a
              href="https://x.com/firechess"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 underline decoration-slate-700 transition-colors hover:text-white"
            >
              @firechess
            </a>{" "}
            for announcements
          </p>
        </div>
      </div>
    </div>
  );
}
