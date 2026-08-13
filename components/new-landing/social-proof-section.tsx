"use client";

import { ArrowRight, Flame, MessageCircle, Shield, Users } from "lucide-react";

const TESTIMONIALS = [
  {
    quote:
      "FireChess found a leak in my London System that I'd been repeating for 200+ games. Fixed it in a week and gained 80 points.",
    author: "ChessImprover42",
    rating: "1847 → 1923",
    role: "Club player",
  },
  {
    quote:
      "The drill positions are exactly what I needed. No more generic puzzle rush — just my actual mistakes, repeated until I stopped making them.",
    author: "TacticalTina",
    rating: "1520 → 1680",
    role: "Tournament player",
  },
  {
    quote:
      "I was skeptical about another analysis tool, but the pattern recognition is genuinely different. It found blindspots I didn't know I had.",
    author: "EndgameEric",
    rating: "2105 → 2210",
    role: "Expert",
  },
];

const STATS = [
  { icon: Users, value: "50,000+", label: "Players scanned" },
  { icon: Flame, value: "2.4M", label: "Games analyzed" },
  { icon: Shield, value: "94%", label: "Report accuracy" },
];

export function SocialProofSection() {
  return (
    <section className="relative px-4 py-24 sm:px-6 lg:px-8">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/[0.02] to-transparent" />

      <div className="relative mx-auto max-w-7xl">
        {/* Stats bar */}
        <div className="mb-20 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex items-center justify-center gap-4 rounded-2xl border border-[#1e1a24] bg-[#0c0f15] p-6"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {stat.value}
                  </div>
                  <div className="text-sm text-[#565061]">{stat.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Testimonials */}
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full border border-[#1e1a24] bg-[#ff5a1f]/[0.04] px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-[#8d8696]">
            Testimonials
          </span>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Players are{" "}
            <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              actually improving
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[#8d8696]">
            Real results from real players who fixed their repeating mistakes.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((testimonial, index) => (
            <div
              key={testimonial.author}
              className="group relative rounded-2xl border border-[#1e1a24] bg-[#0c0f15] p-6 transition-all duration-500 hover:border-orange-500/20 hover:bg-orange-500/[0.02]"
            >
              {/* Quote icon */}
              <div className="mb-4 text-4xl text-orange-500/20">"</div>

              <p className="mb-6 leading-relaxed text-[#f0edf2]">
                {testimonial.quote}
              </p>

              <div className="flex items-center justify-between border-t border-[#1e1a24] pt-4">
                <div>
                  <div className="font-semibold text-white">
                    {testimonial.author}
                  </div>
                  <div className="text-sm text-[#565061]">
                    {testimonial.role}
                  </div>
                </div>
                <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                  {testimonial.rating}
                </div>
              </div>

              {/* Hover accent */}
              <div className="absolute bottom-0 left-0 h-1 w-0 rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500 group-hover:w-full" />
            </div>
          ))}
        </div>

        {/* Discord CTA */}
        <div className="mt-16 overflow-hidden rounded-2xl border border-[#1e1a24] bg-gradient-to-r from-[#5865F2]/10 to-[#5865F2]/5 p-8 sm:p-12">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5865F2]/20 text-[#5865F2]">
                <MessageCircle className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  Join the FireChess community
                </h3>
                <p className="text-[#8d8696]">
                  Get help, share your progress, and discuss chess improvement.
                </p>
              </div>
            </div>
            <a
              href="https://discord.gg/firechess"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-xl bg-[#5865F2] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#4752C4]"
            >
              Join Discord
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
