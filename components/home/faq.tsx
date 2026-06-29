import { ChevronDown } from "lucide-react";

/**
 * Landing-page FAQ — handles the objections that otherwise stall a first scan:
 * "is it actually free?" and "do I have to hand over my password?". Answers are
 * kept truthful and match the real free/Pro split. Uses native <details> so it
 * works without JS and stays accessible.
 */
const FAQS: { q: string; a: string }[] = [
  {
    q: "Is FireChess free?",
    a: "Yes — scanning your games is free, no credit card. The free tier covers opening-leak detection across your recent games, the full report card, strengths radar, mental-game stats, and a sample of tactics and endgames. Pro unlocks unlimited tactic and endgame scanning plus deeper breakdowns.",
  },
  {
    q: "Do I have to give you my password?",
    a: "No. FireChess only reads your public games from your Lichess or Chess.com username — it never asks for your password or account access. You can also paste a PGN instead of connecting a username at all.",
  },
  {
    q: "Which sites does it work with?",
    a: "Lichess and Chess.com. You can also paste PGN from over-the-board games or other apps, and clocks and ratings are picked up automatically when present.",
  },
  {
    q: "How does it find my mistakes?",
    a: "It analyzes your games with Stockfish 18 and looks for patterns across all of them — the same leak in the same position, the tactics you keep missing, the endgames you fumble — then turns each one into a position you can drill.",
  },
];

export function Faq() {
  return (
    <section className="scroll-reveal">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="text-center text-3xl font-extrabold text-white md:text-4xl">
          Frequently asked questions
        </h2>
        <div className="mt-10 space-y-3">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition-colors hover:border-white/[0.14]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-white">
                {f.q}
                <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-300/90">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
