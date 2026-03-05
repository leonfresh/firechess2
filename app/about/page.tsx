import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FAQJsonLd } from "@/components/json-ld";

const FAQ_ITEMS = [
  {
    q: "Is FireChess free?",
    a: "Yes. The free tier lets you scan up to 300 games at depth 12, play Guess the Move, try the Puzzle Dungeon, and more. Pro unlocks higher limits, deeper analysis, and extra training modes.",
  },
  {
    q: "Does FireChess store my games?",
    a: "No. All analysis runs in your browser via Stockfish 18 WASM. We only store reports you explicitly choose to save to your Dashboard.",
  },
  {
    q: "What is an \"opening leak\"?",
    a: "A position you've reached multiple times and consistently played a suboptimal move. FireChess detects these patterns across your game history so you can fix them.",
  },
  {
    q: "Can I use this for cheating?",
    a: "No. FireChess analyzes past games for learning, not live games. Our Terms of Service prohibit using the tool to cheat.",
  },
  {
    q: "Which time controls are supported?",
    a: "All time controls — bullet, blitz, rapid, and classical. You can filter by time control in the scanner.",
  },
  {
    q: "What platforms are supported?",
    a: "FireChess works with both Lichess and Chess.com. Just enter your username and we'll fetch your games via their public APIs.",
  },
  {
    q: "Is there a lifetime option?",
    a: "Yes. We offer a Lifetime plan for a one-time payment that gives you Pro features forever. Check the Pricing page for details.",
  },
];

export const metadata: Metadata = {
  title: "About FireChess — Free Chess Analysis Tool",
  description:
    "FireChess is a free chess analysis platform with opening leak scanning, a puzzle dungeon, Guess the Elo roast mode, a weakness trainer, PGN analyzer, and more — all powered by Stockfish 18 WASM in your browser.",
  openGraph: {
    title: "About FireChess — Free Chess Analysis Tool",
    description:
      "Free chess analysis with opening leak scanning, puzzle dungeon, Guess the Elo, weakness trainer, and more — powered by Stockfish 18.",
    url: "https://firechess.com/about",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About FireChess — Free Chess Analysis Tool",
    description:
      "Free chess analysis platform with 10+ features. Powered by Stockfish 18.",
  },
  alternates: { canonical: "https://firechess.com/about" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 md:px-10">
      <FAQJsonLd
        questions={FAQ_ITEMS.map((f) => ({ question: f.q, answer: f.a }))}
      />

      {/* Header */}
      <div className="flex items-center gap-4">
        <Image
          src="/firechess-logo.png"
          alt="FireChess logo"
          width={56}
          height={56}
          className="h-14 w-14 rounded-2xl"
        />
        <div>
          <h1 className="text-3xl font-extrabold text-white">About FireChess</h1>
          <p className="mt-1 text-sm text-slate-400">
            The all-in-one chess improvement platform
          </p>
        </div>
      </div>

      <div className="mt-10 space-y-10 text-sm leading-relaxed text-slate-300">
        {/* What is FireChess */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-white">What is FireChess?</h2>
          <p>
            FireChess is a free chess analysis and training platform that connects to your{" "}
            <a href="https://lichess.org" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
              Lichess
            </a>{" "}
            or{" "}
            <a href="https://chess.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
              Chess.com
            </a>{" "}
            account and scans hundreds of your games to find patterns in your play. Instead of
            reviewing one game at a time, FireChess aggregates data across your entire game
            history to surface the mistakes you keep repeating — then helps you fix them with
            targeted training, puzzles, and interactive drills.
          </p>
        </section>

        {/* How it works */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-white">How It Works</h2>
          <ol className="list-inside list-decimal space-y-3 text-slate-400">
            <li>
              <span className="text-slate-300">Enter your chess username</span> — we fetch your
              publicly available games from the Lichess or Chess.com API.
            </li>
            <li>
              <span className="text-slate-300">Browser-side analysis</span> — Stockfish 18 runs
              entirely in your browser via WebAssembly (WASM). Your games never leave your device.
            </li>
            <li>
              <span className="text-slate-300">Pattern detection</span> — we group positions
              you&apos;ve reached multiple times and flag where you consistently play suboptimal moves.
            </li>
            <li>
              <span className="text-slate-300">Train your weaknesses</span> — drill your opening
              leaks, solve personalized puzzles, play through GM games, or dive into the Puzzle Dungeon.
            </li>
          </ol>
        </section>

        {/* Core Features */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-white">Core Features</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: "🔍",
                title: "Game Scanner",
                desc: "Scan up to 5,000 games for opening leaks, missed tactics, endgame mistakes, and time management issues. Strengths radar, motif patterns, and interactive drill mode included.",
                link: "/",
              },
              {
                icon: "📋",
                title: "PGN Analyzer",
                desc: "Paste any PGN for full move-by-move analysis with move classification (brilliant, best, good, inaccuracy, mistake, blunder), eval bar, and positional explanations.",
                link: "/analyze",
              },
              {
                icon: "🏋️",
                title: "Weakness Trainer",
                desc: "Six training modes including Weakness Puzzles, Speed Drills, Blunder Spotter, Opening Trainer, Endgame Gym, and Time Pressure — all drawn from your real games.",
                link: "/train",
              },
              {
                icon: "🏰",
                title: "Puzzle Dungeon",
                desc: "A roguelike puzzle adventure. Fight through dungeon nodes, solve increasingly difficult tactics, earn perks, battle bosses, and see how deep you can go.",
                link: "/dungeon",
              },
              {
                icon: "🤔",
                title: "Guess the Move",
                desc: "Play through famous grandmaster games and try to guess each move. Score points for matching the GM's choices and learn from the best.",
                link: "/guess",
              },
              {
                icon: "🔥",
                title: "Guess the Elo",
                desc: "Watch real games with hilarious Gotham-style roast commentary, then guess the players' Elo rating. Features 600+ unique roast lines and text-to-speech.",
                link: "/roast",
              },
              {
                icon: "📖",
                title: "Opening Explorer",
                desc: "Browse opening guides with win-rate statistics, key variations, and interactive boards. Filter by difficulty level and category.",
                link: "/openings",
              },
              {
                icon: "🏆",
                title: "Leaderboard",
                desc: "Compete with other players on the FireChess Score leaderboard. Compare accuracy, tactical skill, and endgame precision.",
                link: "/leaderboard",
              },
            ].map((item) => (
              <Link key={item.title} href={item.link} className="glass-card group space-y-2 p-4 transition-all hover:border-white/[0.08]">
                <span className="text-2xl">{item.icon}</span>
                <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">{item.title}</h3>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* What we scan */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-white">What the Scanner Detects</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: "📖",
                title: "Opening Leaks",
                desc: "Repeated positions where you consistently play the wrong move.",
              },
              {
                icon: "⚡",
                title: "Missed Tactics",
                desc: "Forks, pins, combinations, and wins you missed across your games.",
              },
              {
                icon: "♟️",
                title: "Endgame Mistakes",
                desc: "Rook, pawn, and minor piece endgames where you lost winning positions.",
              },
              {
                icon: "⏱️",
                title: "Time Management",
                desc: "Wasted time, rushed moves, and time pressure patterns.",
              },
            ].map((item) => (
              <div key={item.title} className="glass-card space-y-2 p-4">
                <span className="text-2xl">{item.icon}</span>
                <h3 className="font-semibold text-white">{item.title}</h3>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Dashboard & Progress */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-white">Dashboard & Progress Tracking</h2>
          <p className="mb-4">
            Your personal{" "}
            <Link href="/dashboard" className="text-emerald-400 hover:underline">
              Dashboard
            </Link>{" "}
            tracks your improvement over time with:
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "📊 Report History", desc: "All your saved scans with mini radar charts" },
              { label: "📈 Progress Charts", desc: "Track accuracy and rating trends over time" },
              { label: "🎯 Study Plans", desc: "Personalized daily plans with streak tracking" },
              { label: "🏅 Achievements", desc: "Unlock badges based on your analysis stats" },
              { label: "🎲 Daily Challenge", desc: "One puzzle per day from your missed tactics" },
              { label: "📋 Opening Repertoire", desc: "Save and review correct moves from your leaks" },
              { label: "📐 Percentile Rank", desc: "See where you rank among all FireChess users" },
              { label: "🎁 Daily Login Rewards", desc: "7-day streak calendar with coin rewards" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-2 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2">
                <span className="text-sm">{item.label}</span>
                <span className="text-xs text-slate-500">— {item.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Coin Shop */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-white">Cosmetics & Coin Shop</h2>
          <p>
            Earn coins by completing analyses, training sessions, daily challenges, and login streaks.
            Spend them in the{" "}
            <Link href="/shop" className="text-emerald-400 hover:underline">
              Coin Shop
            </Link>{" "}
            on custom board themes, piece sets, eval bar skins, profile titles, and avatar frames.
            All cosmetic — no pay-to-win.
          </p>
        </section>

        {/* Privacy */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-white">Privacy First</h2>
          <p>
            Your games are analyzed <strong className="text-white">entirely in your browser</strong>.
            Stockfish 18 runs as a WebAssembly module — no game data is sent to our servers. The
            only data we store is analysis reports you explicitly choose to save to your Dashboard.
            Read our full{" "}
            <Link href="/privacy" className="text-emerald-400 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </section>

        {/* Technology */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-white">Technology</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Stockfish 18", desc: "WASM engine" },
              { label: "Next.js 15", desc: "React framework" },
              { label: "Lichess API", desc: "Game data" },
              { label: "Chess.com API", desc: "Game data" },
            ].map((tech) => (
              <div key={tech.label} className="stat-card text-center">
                <p className="text-xs font-semibold text-emerald-400">{tech.label}</p>
                <p className="mt-0.5 text-[10px] text-slate-500">{tech.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Free vs Pro */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-white">Free vs Pro</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="glass-card space-y-2 p-4">
              <h3 className="font-semibold text-white">Free</h3>
              <p className="text-xs text-slate-400">
                300 games/scan, depth 12, 10 tactics & endgames per scan, all scan modes, strengths radar,
                opening explorer, Guess the Move, Puzzle Dungeon, Guess the Elo, save reports.
              </p>
            </div>
            <div className="glass-card space-y-2 border-emerald-500/20 p-4">
              <h3 className="font-semibold text-emerald-400">Pro — $5/mo</h3>
              <p className="text-xs text-slate-400">
                5,000 games/scan, depth up to 24, unlimited tactics & endgames, motif pattern analysis,
                time pressure detection, all 6 drill modes, deep study plans, and full mental game breakdown.
              </p>
            </div>
            <div className="glass-card space-y-2 border-cyan-500/20 p-4">
              <h3 className="font-semibold text-cyan-400">Lifetime — $59</h3>
              <p className="text-xs text-slate-400">
                Everything in Pro, forever. One-time founding member price — no recurring fees.
              </p>
            </div>
          </div>
          <p className="mt-3 text-center">
            <Link href="/pricing" className="text-emerald-400 hover:underline text-sm">
              See full plan comparison →
            </Link>
          </p>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-white">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQ_ITEMS.map((faq) => (
              <div key={faq.q} className="glass-card p-4">
                <h3 className="text-sm font-semibold text-white">{faq.q}</h3>
                <p className="mt-1 text-xs text-slate-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <p className="text-base font-semibold text-white">Ready to find your chess weaknesses?</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-block rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 py-3 text-sm font-bold text-slate-950 transition-shadow hover:shadow-glow-sm"
            >
              Start Scanning — It&apos;s Free
            </Link>
            <Link
              href="/dungeon"
              className="inline-block rounded-xl border border-white/[0.08] px-8 py-3 text-sm font-semibold text-slate-300 transition-colors hover:border-white/[0.15] hover:text-white"
            >
              Try the Puzzle Dungeon
            </Link>
          </div>
        </section>
      </div>

      <div className="mt-12 border-t border-white/[0.06] pt-6">
        <Link href="/" className="text-sm text-emerald-400 hover:underline">
          &larr; Back to Home
        </Link>
      </div>
    </div>
  );
}
