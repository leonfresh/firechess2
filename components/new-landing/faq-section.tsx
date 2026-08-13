"use client";

import { useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";

const FAQS = [
  {
    question: "Is FireChess really free?",
    answer:
      "Yes. You can scan up to 300 games with Stockfish 18 analysis completely free. No credit card required. Pro plans unlock unlimited games, deeper analysis, and personalized drill positions.",
  },
  {
    question: "How does the analysis work?",
    answer:
      "We connect to your Lichess or Chess.com account, download your recent games, and run them through Stockfish 18. Our AI then identifies patterns in your mistakes — opening leaks, missed tactics, endgame errors — and turns each one into a trainable position.",
  },
  {
    question: "What makes FireChess different from other analysis tools?",
    answer:
      "Most tools show you mistakes game-by-game. FireChess finds the patterns across ALL your games — the specific openings where you consistently lose, the tactical motifs you always miss, the endgame positions you keep misplaying. Then we turn those patterns into personalized drills.",
  },
  {
    question: "How long does a scan take?",
    answer:
      "Most scans complete in under 60 seconds for 300 games. Pro scans with deeper analysis may take 2-3 minutes. You'll see results as they're ready, so you don't have to wait for the full scan.",
  },
  {
    question: "Do I need to install anything?",
    answer:
      "No. FireChess runs entirely in your browser using Stockfish 18 WASM. Your games never leave your device unless you choose to save them to your account.",
  },
  {
    question: "Can I export my reports?",
    answer:
      "Yes. Pro and Lifetime members can export full reports as PDF or PNG. Free users can view reports online and share them with a link.",
  },
];

export function FaqSection({ onScanClick }: { onScanClick?: () => void }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="relative px-4 py-24 sm:px-6 lg:px-8">
      {/* Background */}
      <div className="pointer-events-none absolute right-0 top-1/4 h-[300px] w-[300px] rounded-full bg-orange-500/[0.03] blur-[80px]" />

      <div className="relative mx-auto max-w-4xl">
        {/* Section header */}
        <div className="mb-12 text-center">
          <span className="mb-4 inline-block rounded-full border border-[#1e1a24] bg-[#ff5a1f]/[0.04] px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-[#8d8696]">
            FAQ
          </span>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Common questions
          </h2>
          <p className="text-lg text-[#8d8696]">
            Everything you need to know about FireChess.
          </p>
        </div>

        {/* FAQ items */}
        <div className="space-y-4">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`overflow-hidden rounded-xl border transition-all duration-300 ${
                  isOpen
                    ? "border-orange-500/20 bg-orange-500/[0.03]"
                    : "border-[#1e1a24] bg-[#0c0f15] hover:border-[#ff5a1f]/25"
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between p-6 text-left"
                >
                  <span
                    className={`font-medium transition-colors ${
                      isOpen ? "text-orange-400" : "text-white"
                    }`}
                  >
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-[#8d8696] transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isOpen ? "max-h-96" : "max-h-0"
                  }`}
                >
                  <p className="px-6 pb-6 leading-relaxed text-[#8d8696]">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Final CTA */}
        <div className="mt-16 text-center">
          <p className="mb-6 text-lg text-[#8d8696]">
            Ready to find your patterns?
          </p>
          <button
            onClick={onScanClick}
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-8 py-4 text-base font-semibold text-white transition-all hover:opacity-90"
          >
            Scan my games — free
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>
          <p className="mt-4 text-sm text-[#565061]">
            No credit card required · Free forever
          </p>
        </div>
      </div>
    </section>
  );
}
