import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About FireChess - Free Chess Analysis Tool",
  description:
    "FireChess is a free chess analysis tool that scans your Lichess and Chess.com games for repeated opening mistakes, missed tactics, and endgame blunders using Stockfish 18 WASM — all running privately in your browser.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 md:px-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Image
          src="/firechess-logo.png"
          alt="FireChess"
          width={56}
          height={56}
          className="h-14 w-14 rounded-2xl"
        />
        <div>
          <h1 className="text-3xl font-extrabold text-white">About FireChess</h1>
          <p className="mt-1 text-sm text-slate-400">
            The chess analysis tool that finds the mistakes you keep making
          </p>
        </div>
      </div>

      <div className="mt-10 space-y-10 text-sm leading-relaxed text-slate-300">
        {/* What is FireChess */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-white">What is FireChess?</h2>
          <p>
            FireChess is a free chess analysis platform that connects to your{" "}
            <a href="https://lichess.org" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
              Lichess
            </a>{" "}
            or{" "}
            <a href="https://chess.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
              Chess.com
            </a>{" "}
            account and scans hundreds of your games to find patterns in your play. Instead of
            reviewing one game at a time, FireChess aggregates data across your entire game
            history to show you the mistakes you keep repeating.
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
              <span className="text-slate-300">Actionable results</span> — opening leaks, missed
              tactics, endgame mistakes, radar charts, and interactive drills to practice your
              weakest positions.
            </li>
          </ol>
        </section>

        {/* What we scan */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-white">What We Scan</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: "📖",
                title: "Openings",
                desc: "Repeated positions where you consistently play the wrong move — your opening leaks.",
              },
              {
                icon: "⚡",
                title: "Tactics",
                desc: "Missed wins, forks, pins, and combinations across your games — your tactical blind spots.",
              },
              {
                icon: "♟️",
                title: "Endgames",
                desc: "Rook, pawn, and minor piece endgames where you lost winning positions or failed to hold draws.",
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
          <p>
            FireChess is free for up to 300 games with depth-12 analysis. The{" "}
            <Link href="/pricing" className="text-emerald-400 hover:underline">
              Pro plan
            </Link>{" "}
            unlocks up to 5,000 games, depth-24 analysis, unlimited tactics and endgame
            scanning, and saved reports on your Dashboard — all for $5/month.
          </p>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-white">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "Is FireChess free?",
                a: "Yes. The free tier lets you scan up to 300 games at depth 12. Pro users get higher limits and more features.",
              },
              {
                q: "Does FireChess store my games?",
                a: "No. Analysis runs in your browser. We only store reports you choose to save.",
              },
              {
                q: "What is an \"opening leak\"?",
                a: "A position you've reached multiple times and consistently played a suboptimal move. FireChess detects these patterns across your game history.",
              },
              {
                q: "Can I use this for cheating?",
                a: "No. FireChess analyzes past games for learning, not live games. Our Terms of Service prohibit using the tool to cheat.",
              },
              {
                q: "Which time controls are supported?",
                a: "All time controls — bullet, blitz, rapid, and classical. You can filter by time control in the scanner.",
              },
            ].map((faq) => (
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
          <Link
            href="/"
            className="mt-4 inline-block rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 py-3 text-sm font-bold text-slate-950 transition-shadow hover:shadow-glow-sm"
          >
            Start Scanning — It&apos;s Free
          </Link>
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
