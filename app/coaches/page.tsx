"use client";

import { useState } from "react";
import Link from "next/link";

const FEATURES = [
  {
    icon: "📊",
    title: "Opening leak detection",
    desc: "Exact positions where a student bleeds points every time. Not just \"your Sicilian is bad\" — the specific move on move 9 they keep getting wrong.",
  },
  {
    icon: "⚔️",
    title: "Tactics missed under time pressure",
    desc: "Separates tactics they didn't see from tactics they didn't have time to see. Tells you whether it's a vision problem or a clock problem.",
  },
  {
    icon: "♟️",
    title: "Endgame mistakes by category",
    desc: "Categorized by type — Lucena, Philidor, pawn opposition, K+P vs K. You know exactly which endgame to drill in the next lesson.",
  },
  {
    icon: "🧠",
    title: "Mental game breakdown",
    desc: "Tilt detection, post-loss performance, momentum patterns. Useful for students whose problem is psychological, not technical.",
  },
  {
    icon: "📋",
    title: "Auto-generated study plan",
    desc: "FireChess builds a prioritized weekly plan from the scan. Your student arrives with a suggested plan and you can adjust from there.",
  },
  {
    icon: "⚡",
    title: "Works on Lichess and Chess.com",
    desc: "Students paste their username, pick the scan mode, and get results in under a minute. No PGN downloads or manual uploads.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "You get free Pro access",
    desc: "Try every feature at full depth before recommending it to anyone.",
  },
  {
    step: "2",
    title: "Share a promo code with students",
    desc: "They get a discounted or free month. You get a custom link to track referrals.",
  },
  {
    step: "3",
    title: "Earn 30% recurring commission",
    desc: "Any student who upgrades to Pro through your link pays you 30% every month they stay subscribed.",
  },
];

function PartnershipForm({ type }: { type: "coach" | "creator" }) {
  const [name, setName] = useState("");
  const [profile, setProfile] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCoach = type === "coach";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 5) {
      setError("Please write at least a few words.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email so we can reply.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const subject = isCoach ? "Coach Partnership Request" : "Creator Partnership Request";
      const fullMessage = [
        isCoach ? `Coach profile: ${profile || "(not provided)"}` : `Channel/profile: ${profile || "(not provided)"}`,
        name ? `Name: ${name}` : null,
        "",
        message.trim(),
      ].filter(Boolean).join("\n");
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: "other", subject, message: fullMessage, email: email.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
        <div className="mb-3 text-4xl">✅</div>
        <h3 className="text-lg font-semibold text-emerald-400">Message received!</h3>
        <p className="mt-2 text-sm text-slate-400">I&apos;ll reply within a few hours to set up your free Pro access, promo code, and affiliate link.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">
            Your name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isCoach ? "Magnus" : "ChessWithMagnus"}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">
            {isCoach ? "Lichess / Chess.com coach profile link" : "Channel or profile link"}
          </label>
          <input
            type="text"
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            placeholder={isCoach ? "lichess.org/coach/yourname" : "youtube.com/@yourchannel"}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-300">
          Email <span className="text-red-400">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-300">
          Anything else you want to mention <span className="text-slate-500">(optional)</span>
        </label>
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isCoach ? "How many students do you coach? Any questions about the tool?" : "How big is your audience? Any questions?"}
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
        />
      </div>
      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="btn-primary w-full py-3 text-base disabled:opacity-60"
      >
        {submitting ? "Sending..." : "Apply for partnership"}
      </button>
      <p className="text-center text-xs text-slate-500">Usually reply within a few hours.</p>
    </form>
  );
}

export default function CoachesPage() {
  return (
    <div className="relative min-h-screen">
      {/* Background orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="animate-float absolute -left-32 top-20 h-96 w-96 rounded-full bg-emerald-500/[0.07] blur-[100px]" />
        <div className="animate-float-delayed absolute -right-32 top-60 h-80 w-80 rounded-full bg-cyan-500/[0.06] blur-[100px]" />
        <div className="animate-float absolute bottom-40 left-1/3 h-72 w-72 rounded-full bg-violet-500/[0.05] blur-[100px]" />
      </div>

      <div className="relative z-10 px-6 py-16 md:px-10">
        <div className="mx-auto max-w-4xl space-y-20">

          {/* Hero */}
          <header className="animate-fade-in-up space-y-6 text-center">
            <span className="tag-cyan mx-auto">
              <span className="text-sm">♟</span> For Chess Coaches
            </span>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
              Your student shows up.<br />
              <span className="gradient-text">You already know what to fix.</span>
            </h1>
            <p className="mx-auto max-w-2xl text-base text-slate-400 md:text-lg">
              FireChess scans a player&apos;s last few hundred games and finds the exact patterns costing them points.
              Instead of spending the first 20 minutes of a lesson diagnosing the problem, you can spend all of it solving it.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
              <a href="#apply" className="btn-primary px-8 py-3 text-base">
                Get free Pro access
              </a>
              <Link href="/" className="btn-ghost px-8 py-3 text-base">
                Try the tool first
              </Link>
            </div>
          </header>

          {/* What a student report shows you */}
          <section className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white md:text-3xl">What a student&apos;s report shows you</h2>
              <p className="mt-2 text-slate-400">One scan, everything you need to plan your next lesson.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="glass-card space-y-2 p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-xl">
                      {f.icon}
                    </span>
                    <h3 className="font-semibold text-white">{f.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-400">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* How the partnership works */}
          <section className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white md:text-3xl">How the partnership works</h2>
              <p className="mt-2 text-slate-400">Free for you, discounted for your students, revenue share on upgrades.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {HOW_IT_WORKS.map((h) => (
                <div key={h.step} className="glass-card space-y-3 p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-xl font-black text-emerald-400">
                    {h.step}
                  </div>
                  <h3 className="font-bold text-white">{h.title}</h3>
                  <p className="text-sm text-slate-400">{h.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Commission callout */}
          <div className="glass-card border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.06] to-cyan-500/[0.04] p-8 text-center">
            <div className="mx-auto max-w-xl space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-3xl">
                💸
              </div>
              <h2 className="text-2xl font-bold text-white">30% recurring commission</h2>
              <p className="text-slate-400">
                For every student who upgrades to Pro through your link, you earn 30% of their subscription every month they stay.
                Pro is $5/mo, so one active student pays out $1.50/mo indefinitely — 10 students is a recurring $15/mo for zero extra work.
              </p>
              <a href="#apply" className="btn-primary mx-auto mt-2 inline-block px-8 py-3">
                Apply for a coach link
              </a>
            </div>
          </div>

          {/* FAQ */}
          <section className="space-y-6">
            <h2 className="text-center text-2xl font-bold text-white md:text-3xl">Common questions</h2>
            <div className="space-y-3">
              {[
                {
                  q: "Does the student need a paid account?",
                  a: "No. The free tier lets students scan up to 300 games and see opening leaks, tactics, and endgame results. Pro unlocks higher limits and deeper analysis.",
                },
                {
                  q: "How do promo codes work?",
                  a: "You get a custom code to share with students. They apply it at checkout for a discounted or free first month. You track how many students used it.",
                },
                {
                  q: "When and how do I get paid?",
                  a: "Payouts are handled manually right now via PayPal or bank transfer. Message me to set up your preferred method.",
                },
                {
                  q: "Does it work for all skill levels?",
                  a: "Yes. The tool is most useful for players rated 600-2000. Below that the games are too error-filled for pattern detection to be reliable. Above 2000 the tool still works but coaches at that level usually have their own methods.",
                },
                {
                  q: "Can I see a student's report without them sharing it?",
                  a: "You can run a scan on any public Lichess or Chess.com username right from the homepage. No account needed for the scan itself.",
                },
              ].map((item) => (
                <details key={item.q} className="glass-card group p-5">
                  <summary className="cursor-pointer list-none font-semibold text-white group-open:text-emerald-400">
                    {item.q}
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">{item.a}</p>
                </details>
              ))}
            </div>
          </section>

          {/* CTA / Form */}
          <section id="apply" className="glass-card space-y-6 p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">Ready to get started?</h2>
              <p className="mt-2 text-slate-400">
                Fill this in and I&apos;ll set up your free Pro account, promo code, and affiliate link within 24 hours.
              </p>
            </div>
            <PartnershipForm type="coach" />
          </section>

        </div>
      </div>
    </div>
  );
}
