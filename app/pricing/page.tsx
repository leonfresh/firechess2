import Link from "next/link";

const plans = [
  {
    icon: "🆓",
    name: "Free",
    price: "$0",
    subtitle: "Great for trying FireChess",
    features: [
      "Up to 100 recent games per scan",
      "Engine depth up to 12",
      "Core leak report + drill mode",
      "Lichess + Chess.com source support"
    ],
    cta: "Current baseline",
    highlight: false
  },
  {
    icon: "🚀",
    name: "Pro",
    price: "$9/mo",
    subtitle: "For serious improvers",
    features: [
      "Up to 500+ games per scan",
      "Higher engine depth (13-24)",
      "Priority analysis queue",
      "Advanced report exports + share templates"
    ],
    cta: "Upgrade with Stripe",
    highlight: true
  }
];

export default function PricingPage() {
  return (
    <div className="relative min-h-screen">
      {/* Animated orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="animate-float absolute -left-32 top-20 h-96 w-96 rounded-full bg-emerald-500/[0.07] blur-[100px]" />
        <div className="animate-float-delayed absolute -right-32 top-40 h-80 w-80 rounded-full bg-cyan-500/[0.06] blur-[100px]" />
        <div className="animate-float absolute bottom-20 left-1/3 h-72 w-72 rounded-full bg-fuchsia-500/[0.05] blur-[100px]" />
      </div>

      <div className="relative z-10 px-6 py-16 md:px-10">
        <section className="mx-auto w-full max-w-5xl space-y-16">

          {/* Hero */}
          <header className="animate-fade-in-up space-y-5 text-center">
            <span className="tag-fuchsia mx-auto">
              <span className="text-sm">♟</span> FireChess Pricing
            </span>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-white md:text-6xl lg:text-7xl">
              <span className="text-white">Choose your </span>
              <span className="gradient-text">training tier</span>
            </h1>
            <p className="mx-auto max-w-2xl text-base text-slate-400 md:text-lg">
              Start free, then unlock deeper analysis and bigger scan limits powered by Stockfish 18.
            </p>

            <div className="mx-auto mt-6 grid max-w-3xl gap-3 sm:grid-cols-3">
              {[
                { icon: "📊", text: "Leak analytics + reports" },
                { icon: "🧠", text: "Drill mode training" },
                { icon: "⚙️", text: "Stockfish 18 analysis" },
              ].map((item) => (
                <div key={item.text} className="glass-card flex items-center gap-3 px-4 py-3 text-sm text-slate-300">
                  <span className="text-lg">{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>
          </header>

          {/* Plan Cards */}
          <div className="grid gap-6 md:grid-cols-2">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`glass-card-hover relative p-6 md:p-8 ${
                  plan.highlight ? "border-emerald-500/20 shadow-glow" : ""
                }`}
              >
                {plan.highlight && (
                  <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-emerald-500/[0.06] to-transparent" />
                )}
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">
                      <span className="mr-2">{plan.icon}</span>
                      {plan.name}
                    </h2>
                    {plan.highlight && (
                      <span className="tag-emerald text-[11px]">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                        Most popular
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{plan.subtitle}</p>
                  <p className="mt-5 text-4xl font-black gradient-text-emerald">{plan.price}</p>

                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-slate-300">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mt-0.5 shrink-0 text-emerald-400" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    className={`mt-8 w-full py-3 text-sm font-semibold transition-all duration-300 ${
                      plan.highlight
                        ? "btn-primary"
                        : "btn-secondary h-auto"
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Comparison table */}
          <div className="glass-card overflow-hidden p-6">
            <h3 className="mb-4 text-lg font-bold text-white">Plan comparison</h3>
            <div className="overflow-hidden rounded-xl border border-white/[0.06]">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-white/[0.02]">
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">Feature</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">Free</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-emerald-400">Pro</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {[
                    ["Recent games per scan", "Up to 100", "500+"],
                    ["Engine depth", "Up to 12", "Up to 24"],
                    ["Advanced exports", "—", "✓"],
                    ["Priority queue", "—", "✓"],
                  ].map(([feature, free, pro]) => (
                    <tr key={feature} className="border-t border-white/[0.04]">
                      <td className="px-4 py-3 text-slate-400">{feature}</td>
                      <td className="px-4 py-3">{free}</td>
                      <td className="px-4 py-3 font-medium text-emerald-300">{pro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Why upgrade */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] p-6 md:p-8">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/[0.06] via-cyan-500/[0.04] to-fuchsia-500/[0.06]" />
            <div className="relative">
              <h3 className="text-lg font-bold text-white">Why upgrading matters</h3>
              <p className="mt-2 text-sm text-slate-400">
                Your support directly funds better FireChess: faster analysis, deeper opening intelligence, and more
                practical training workflows for the whole chess community.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  { icon: "🚀", text: "Faster product iteration" },
                  { icon: "🧪", text: "Better eval quality tooling" },
                  { icon: "🧠", text: "More guided training features" },
                ].map((item) => (
                  <div key={item.text} className="stat-card flex items-center gap-3 text-sm text-slate-300">
                    <span className="text-lg">{item.icon}</span>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Roadmap */}
          <div className="glass-card p-6 md:p-8">
            <h3 className="text-lg font-bold text-white">Development roadmap</h3>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                {
                  priority: true,
                  title: "Coaching mode",
                  desc: "Personalized drills, weakness tracking, and coach-style feedback loops."
                },
                {
                  priority: false,
                  title: "Study packs & exports",
                  desc: "Auto-generate practice sets by opening family and mistake severity."
                },
                {
                  priority: false,
                  title: "Progress timeline",
                  desc: "See if your opening leaks are shrinking week by week with trend charts."
                },
                {
                  priority: false,
                  title: "Coach/team dashboards",
                  desc: "Multi-player management for coaches and training groups."
                },
              ].map((item, i) => (
                <article
                  key={item.title}
                  className={`stat-card ${item.priority ? "border-emerald-500/20" : ""}`}
                >
                  {item.priority && (
                    <span className="tag-emerald mb-3 text-[10px]">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                      PRIORITY
                    </span>
                  )}
                  <h4 className="text-base font-semibold text-white">{i + 1}) {item.title}</h4>
                  <p className="mt-1 text-sm text-slate-400">{item.desc}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="text-center">
            <Link href="/" className="btn-secondary inline-flex items-center gap-2 px-6 py-2.5 text-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              Back to scanner
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
