"use client";

import { useState } from "react";
import Link from "next/link";

const CONTENT_IDEAS = [
  {
    icon: "🎬",
    title: "\"I analyzed my last 500 games\"",
    desc: "Run FireChess live on stream or in a video. Watch it find your opening leaks and missed tactics in real time. The results are always surprising.",
  },
  {
    icon: "👥",
    title: "Analyze a viewer's games",
    desc: "Ask a viewer to share their username. Scan their games on screen, roast their opening choices, and drill into why they keep blundering in the same position.",
  },
  {
    icon: "📈",
    title: "\"Why you're stuck at [rating]\"",
    desc: "FireChess tells you exactly which weakness is costing you the most ELO. Makes for a punchy thumbnail and a concrete answer instead of vague improvement tips.",
  },
  {
    icon: "🧠",
    title: "The mental game breakdown",
    desc: "Your tilt score, post-loss performance, momentum patterns. Most players have never seen this data about themselves. Reaction content gold.",
  },
  {
    icon: "🔥",
    title: "Opening leak deep dive",
    desc: "Pick one specific position that keeps coming up in your games, understand why you always play the wrong move there, and drill it live.",
  },
  {
    icon: "⚔️",
    title: "Tactics you missed and why",
    desc: "FireChess shows the board position, the move you played, what you should have played, and whether you were short on time. Walk through them one by one.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "You get free Pro access",
    desc: "Full access at the highest settings so you can create with the complete feature set.",
  },
  {
    step: "2",
    title: "You get a promo code for viewers",
    desc: "Share it in your description or pinned comment. Viewers get a discounted or free first month.",
  },
  {
    step: "3",
    title: "Earn 30% recurring commission",
    desc: "Any viewer who upgrades through your link earns you 30% of their subscription every month.",
  },
];

function PartnershipForm() {
  const [name, setName] = useState("");
  const [profile, setProfile] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const fullMessage = [
        `Channel/profile: ${profile || "(not provided)"}`,
        `Email: ${email || "(not provided)"}`,
        "",
        message.trim() || "(no additional message)",
      ].join("\n");
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: "other", subject: "Creator Partnership Request", message: fullMessage }),
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
      <div className="rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/5 p-8 text-center">
        <div className="mb-3 text-4xl">✅</div>
        <h3 className="text-lg font-semibold text-fuchsia-400">Message received!</h3>
        <p className="mt-2 text-sm text-slate-400">I&apos;ll reply within a few hours to set up your free Pro access, promo code, and affiliate link.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">Your name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ChessWithMagnus"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-fuchsia-500/50 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/30"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">Channel or profile link</label>
          <input
            type="text"
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            placeholder="youtube.com/@yourchannel"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-fuchsia-500/50 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/30"
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-300">
          Email <span className="text-slate-500">(for reply)</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-fuchsia-500/50 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/30"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-300">
          Anything else <span className="text-slate-500">(optional)</span>
        </label>
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Audience size, content style, any questions?"
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-fuchsia-500/50 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/30"
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

export default function YoutuberssPage() {
  return (
    <div className="relative min-h-screen">
      {/* Background orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="animate-float absolute -left-32 top-20 h-96 w-96 rounded-full bg-fuchsia-500/[0.07] blur-[100px]" />
        <div className="animate-float-delayed absolute -right-32 top-60 h-80 w-80 rounded-full bg-violet-500/[0.06] blur-[100px]" />
        <div className="animate-float absolute bottom-40 left-1/3 h-72 w-72 rounded-full bg-cyan-500/[0.05] blur-[100px]" />
      </div>

      <div className="relative z-10 px-6 py-16 md:px-10">
        <div className="mx-auto max-w-4xl space-y-20">

          {/* Hero */}
          <header className="animate-fade-in-up space-y-6 text-center">
            <span className="tag-fuchsia mx-auto">
              <span className="text-sm">🎬</span> For Content Creators
            </span>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
              Your viewers want to know<br />
              <span className="gradient-text">why they keep losing.</span>
            </h1>
            <p className="mx-auto max-w-2xl text-base text-slate-400 md:text-lg">
              FireChess scans a player&apos;s games and finds the exact patterns costing them rating points.
              Opening leaks, missed tactics, endgame blunders, tilt patterns. All in one report.
              It&apos;s a tool your audience will actually try.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
              <a href="#apply" className="btn-primary px-8 py-3 text-base">
                Get free Pro access
              </a>
              <Link href="/" className="btn-ghost px-8 py-3 text-base">
                Try it on your own games
              </Link>
            </div>
          </header>

          {/* Content ideas */}
          <section className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white md:text-3xl">Video ideas that write themselves</h2>
              <p className="mt-2 text-slate-400">Every scan produces results. Here are the formats that work best.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CONTENT_IDEAS.map((f) => (
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

          {/* What the tool actually does */}
          <section className="glass-card space-y-6 p-8">
            <h2 className="text-center text-2xl font-bold text-white md:text-3xl">What FireChess actually does</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: "📊", label: "Finds opening positions you keep misplaying across hundreds of games" },
                { icon: "⚔️", label: "Shows missed tactics and whether they happened under time pressure" },
                { icon: "♟️", label: "Categories endgame mistakes by type so you know exactly what to study" },
                { icon: "🧠", label: "Calculates tilt score, momentum, and post-loss performance drop" },
                { icon: "📋", label: "Auto-builds a weekly study plan ranked by what costs the most ELO" },
                { icon: "🔗", label: "Works on any public Lichess or Chess.com username, no signup needed to scan" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                  <span className="mt-0.5 text-lg">{item.icon}</span>
                  <p className="text-sm text-slate-300">{item.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* How the partnership works */}
          <section className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white md:text-3xl">How the partnership works</h2>
              <p className="mt-2 text-slate-400">Free for you, discounted for your viewers, revenue share on upgrades.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {HOW_IT_WORKS.map((h) => (
                <div key={h.step} className="glass-card space-y-3 p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500/20 to-violet-500/20 text-xl font-black text-fuchsia-400">
                    {h.step}
                  </div>
                  <h3 className="font-bold text-white">{h.title}</h3>
                  <p className="text-sm text-slate-400">{h.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Commission callout */}
          <div className="glass-card border-fuchsia-500/20 bg-gradient-to-r from-fuchsia-500/[0.06] to-violet-500/[0.04] p-8 text-center">
            <div className="mx-auto max-w-xl space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-fuchsia-500/15 text-3xl">
                💸
              </div>
              <h2 className="text-2xl font-bold text-white">30% recurring commission</h2>
              <p className="text-slate-400">
                Every viewer who upgrades to Pro through your link pays you 30% per month, indefinitely.
                Pro is $5/mo. If 50 viewers convert, that&apos;s $75/mo for a single video mention.
                The bigger the audience, the more it compounds.
              </p>
              <a href="#apply" className="btn-primary mx-auto mt-2 inline-block px-8 py-3">
                Apply for a creator link
              </a>
            </div>
          </div>

          {/* FAQ */}
          <section className="space-y-6">
            <h2 className="text-center text-2xl font-bold text-white md:text-3xl">Common questions</h2>
            <div className="space-y-3">
              {[
                {
                  q: "Do I need a minimum subscriber count?",
                  a: "No minimum. If you make chess content and your audience would find this useful, that's enough. Even a 500-subscriber channel can drive real signups.",
                },
                {
                  q: "Can I scan someone else's games on stream?",
                  a: "Yes. Any public Lichess or Chess.com username can be scanned from the homepage without an account. Perfect for live viewer analysis.",
                },
                {
                  q: "What does Pro unlock?",
                  a: "Pro raises the scan limit to 5,000 games, increases engine depth, unlocks unlimited tactics and endgame scanners, and adds the full mental game breakdown and study plan generator.",
                },
                {
                  q: "How do I get paid?",
                  a: "Payouts are handled manually right now via PayPal or bank transfer. Email me and we'll sort out your preferred method.",
                },
                {
                  q: "Can I get a custom promo code?",
                  a: "Yes. Just email me your channel name and I'll set up a code you can share in videos and descriptions.",
                },
              ].map((item) => (
                <details key={item.q} className="glass-card group p-5">
                  <summary className="cursor-pointer list-none font-semibold text-white group-open:text-fuchsia-400">
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
              <h2 className="text-2xl font-bold text-white">Ready to make something?</h2>
              <p className="mt-2 text-slate-400">
                Fill this in and I&apos;ll set up your free Pro account, promo code, and affiliate link within 24 hours.
              </p>
            </div>
            <PartnershipForm />
          </section>

        </div>
      </div>
    </div>
  );
}
