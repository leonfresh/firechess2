"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

/**
 * Design pitch — chess-native visual direction (real 3D burning board,
 * PGN/eval-bar/annotation-glyph vocabulary, avatars instead of stock
 * icons). Full homepage + report parity. Not linked from the live site.
 *
 * v6: revamped against 2026 award-winning web design research
 * (Awwwards/CSSDA site-of-the-year coverage) — restraint over spectacle,
 * a single disciplined accent instead of gradients everywhere, editorial
 * serif headlines, scroll-revealed sections, and an asymmetric feature
 * layout instead of a uniform card grid ("a confident grid that breaks
 * at exactly the right moments").
 */

const FireChessBoard = dynamic(() => import("@/components/pitch/fire-chess-board"), {
  ssr: false,
  loading: () => <div className="h-full w-full" />,
});

const CHAR = "#0a0806";
const CHAR_2 = "#140f0a";
const CHAR_3 = "#1d1510";
const ASH = "#8a8072";
const ASH_DIM = "#4a4238";
const PAPER = "#f4eedf";
const PAPER_DIM = "#cabfa8";
const EMBER = "#ff5c24";
const EMBER_DEEP = "#a11f0c";
const EMBER_HOT = "#ffb15c";
const WHITE_HOT = "#ffe9c7";

const RING = `conic-gradient(${WHITE_HOT}, ${EMBER_HOT}, ${EMBER}, ${EMBER_DEEP}, ${EMBER}, ${EMBER_HOT}, ${WHITE_HOT})`;
const CARD = "rounded-2xl border shadow-[0_8px_30px_-12px_rgba(0,0,0,0.5)]";
const BTN = "rounded-xl transition-all duration-300";
const H = "font-serif font-bold tracking-tight text-balance";

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={style}
      className={`transition-all duration-700 ease-out ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${className}`}
    >
      {children}
    </div>
  );
}

function Avatar({ initials, size = 46 }: { initials: string; size?: number }) {
  return (
    <div className="shrink-0 rounded-full p-[2px]" style={{ width: size, height: size, background: RING }}>
      <div
        className="flex h-full w-full items-center justify-center rounded-full font-mono font-bold"
        style={{ background: CHAR_3, color: PAPER, fontSize: size * 0.3 }}
      >
        {initials}
      </div>
    </div>
  );
}

const SUPPORTING_FEATURES = [
  { title: "Pattern recognition", copy: "Identifies recurring mistakes across hundreds of games at once." },
  { title: "Personalized drills", copy: "Turns every mistake into a trainable position, not a generic puzzle." },
  { title: "Progress tracking", copy: "Watch your accuracy on each leak improve scan over scan." },
  { title: "Tactical blindspots", copy: "Discover the tactical motifs you consistently miss." },
  { title: "Endgame analysis", copy: "Find exactly where your endgame technique goes wrong." },
  { title: "Instant results", copy: "Get your full report in under 60 seconds, no waiting around." },
];

const SAMPLES = [
  { initials: "HN", name: "Hikaru Nakamura", role: "GM · World #2", peak: "3300 peak", leaks: "5", tactics: "66", endgames: "115" },
  { initials: "MC", name: "Magnus Carlsen", role: "GM · World #1", peak: "3377 peak", leaks: "1", tactics: "38", endgames: "100" },
  { initials: "LR", name: "Levy Rozman", role: "IM · GothamChess", peak: "2453 peak", leaks: "5", tactics: "135", endgames: "258" },
  { initials: "AB", name: "Alexandra Botez", role: "WFM · Botez Live", peak: "2267 peak", leaks: "6", tactics: "237", endgames: "376" },
  { initials: "AB", name: "Andrea Botez", role: "Streamer · Botez Live", peak: "2070 peak", leaks: "8", tactics: "189", endgames: "240" },
  { initials: "ER", name: "Eric Rosen", role: "IM · Oh no my queen", peak: "2400 peak", leaks: "4", tactics: "130", endgames: "341" },
  { initials: "T1", name: "Tyler1", role: "Streamer · PogChamps", peak: "1596 peak", leaks: "15", tactics: "246", endgames: "245" },
  { initials: "XQ", name: "xQc", role: "Streamer · PogChamps", peak: "804 peak", leaks: "15", tactics: "155", endgames: "164" },
  { initials: "MK", name: "MoistCr1TiKaL", role: "Streamer · PogChamps", peak: "619 peak", leaks: "4", tactics: "298", endgames: "237" },
];

const TESTIMONIALS = [
  { initials: "CI", name: "ChessImprover42", role: "Club player", quote: "FireChess found a leak in my London System I'd been repeating for 200+ games. Fixed it in a week and gained 80 points.", from: "1847", to: "1923" },
  { initials: "TT", name: "TacticalTina", role: "Tournament player", quote: "The drill positions are exactly what I needed. No more generic puzzle rush — just my actual mistakes, repeated until I stopped making them.", from: "1520", to: "1680" },
  { initials: "EE", name: "EndgameEric", role: "Expert", quote: "I was skeptical about another analysis tool, but the pattern recognition is genuinely different. It found blindspots I didn't know I had.", from: "2105", to: "2210" },
];

const LEAKS = [
  { flag: "??", heat: "hot", title: "Italian Game · hangs the e5 pawn every time", meta: "seen 22x · −0.8 avg", width: "82%" },
  { flag: "?!", heat: "warm", title: "Najdorf · drifts passive after 6.Be3", meta: "seen 14x · −0.6 avg", width: "46%" },
  { flag: "??", heat: "hot", title: "Caro-Kann · loses a tempo on the bishop retreat", meta: "seen 9x · −1.1 avg", width: "82%" },
  { flag: "!!", heat: "cool", title: "Found the rook sac on move 31, cold", meta: "seen 1x · +5.4 swing", width: "18%" },
];

const FAQS = [
  { q: "Is FireChess really free?", a: "Yes. Scan up to 300 games with Stockfish 18 analysis completely free, no card required. Pro unlocks unlimited games, deeper analysis, and more drill positions." },
  { q: "How does the analysis work?", a: "We pull your recent games from Lichess or Chess.com and run them through Stockfish 18, then find the patterns across all of them — not just game by game." },
  { q: "What makes FireChess different?", a: "Most tools show mistakes game by game. FireChess finds the openings you consistently lose, the tactics you always miss, and turns those patterns into drills." },
  { q: "How long does a scan take?", a: "Most scans finish in under 60 seconds for 300 games. Pro scans with deeper analysis can take 2–3 minutes, with results streaming in as they're ready." },
  { q: "Do I need to install anything?", a: "No. FireChess runs in your browser using Stockfish 18 WASM. Your games never leave your device unless you save them to your account." },
  { q: "Can I export my reports?", a: "Yes — Pro and Lifetime members can export full reports as PDF or PNG. Free users can view and share reports by link." },
];

const flagColor: Record<string, string> = { hot: EMBER, warm: PAPER_DIM, cool: WHITE_HOT };
const barGradient: Record<string, string> = {
  hot: `linear-gradient(90deg, ${EMBER_DEEP}, ${EMBER})`,
  warm: `linear-gradient(90deg, ${ASH_DIM}, ${PAPER_DIM})`,
  cool: `linear-gradient(90deg, ${EMBER_HOT}, ${WHITE_HOT})`,
};

export default function NewLanding2Page() {
  return (
    <div
      className="min-h-screen [font-variant-numeric:tabular-nums]"
      style={{ background: CHAR, color: PAPER, fontFamily: 'ui-sans-serif, "Helvetica Neue", Arial, sans-serif' }}
    >
      <div
        className="border-b py-2 text-center font-mono text-[11px] uppercase tracking-[0.14em]"
        style={{ background: CHAR_2, borderColor: ASH_DIM, color: EMBER_HOT }}
      >
        Direction pitch v6 — revamped against 2026 award-winning design research
      </div>

      {/* ── Hero ── */}
      <header className="relative flex min-h-[88vh] items-center overflow-hidden py-20">
        <div
          className="pointer-events-none absolute -right-[8%] -top-[10%] h-[60vw] max-h-[900px] w-[60vw] max-w-[900px] blur-2xl"
          style={{ background: `radial-gradient(circle, rgba(255,92,36,0.14), transparent 65%)` }}
        />
        <div className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-8 lg:grid-cols-[1fr_0.92fr]">
          <div>
            <p className="mb-6 font-mono text-xs uppercase tracking-[0.14em]" style={{ color: EMBER_HOT }}>
              Stockfish 18 &middot; free forever
            </p>
            <h1 className={`${H} mb-6 text-5xl leading-[1.02] sm:text-6xl lg:text-7xl`}>
              Your chess is{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: `linear-gradient(100deg, ${EMBER_DEEP} 0%, ${EMBER} 45%, ${EMBER_HOT} 75%, ${WHITE_HOT} 100%)` }}
              >
                on fire.
              </span>
              <br />
              Wrong kind.
            </h1>
            <p className="mb-8 max-w-[48ch] text-lg leading-relaxed" style={{ color: PAPER_DIM }}>
              FireChess replays every game you&apos;ve ever lost the plot in, finds the move where it went wrong, and{" "}
              <b style={{ color: PAPER }}>drills it until it stops happening.</b>
            </p>
            <div className="mb-10 flex flex-wrap items-center gap-5">
              <button
                className={`${BTN} px-6 py-4 font-mono text-sm font-bold hover:scale-[1.02] hover:shadow-[0_0_40px_-10px_rgba(255,92,36,0.6)]`}
                style={{ background: EMBER, color: CHAR }}
              >
                Scan my games — free
              </button>
              <button className="font-mono text-sm underline decoration-1 underline-offset-4 transition-colors" style={{ color: ASH, textDecorationColor: ASH_DIM }}>
                See a real report &rarr;
              </button>
            </div>
            <div className="flex gap-9 border-t pt-5" style={{ borderColor: ASH_DIM }}>
              {[["2.4M+", "Games analyzed"], ["156K", "Leaks found"], ["+247", "Avg. rating gain"]].map(([n, l]) => (
                <div key={l}>
                  <b className="block font-mono text-xl font-bold">{n}</b>
                  <span className="text-[11.5px]" style={{ color: ASH }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div
              className="pointer-events-none absolute -inset-[14%] rounded-full blur-3xl"
              style={{ background: `radial-gradient(circle, rgba(255,92,36,0.2), transparent 68%)` }}
            />
            <div
              className="relative z-10 mx-auto aspect-square w-[92%] max-w-[460px] overflow-hidden rounded-3xl border shadow-[0_50px_90px_-30px_rgba(0,0,0,0.7)]"
              style={{ borderColor: ASH_DIM, background: CHAR_2 }}
            >
              <FireChessBoard />
            </div>
            <div
              className="absolute -left-5 bottom-6 z-20 flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.6)] backdrop-blur-md"
              style={{ background: "rgba(20,15,10,0.85)", borderColor: ASH_DIM }}
            >
              <div className="relative h-[62px] w-5 overflow-hidden rounded-full border" style={{ borderColor: ASH_DIM, background: CHAR_2 }}>
                <div className="gauge-fill absolute inset-x-0 bottom-0 rounded-full" />
              </div>
              <div>
                <div className="font-mono text-[12.5px] font-bold" style={{ color: EMBER_HOT }}>25. Qxd5??</div>
                <div className="mt-0.5 font-mono text-[10.5px]" style={{ color: ASH }}>live eval &middot; +5.4</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Scan console ── */}
      <section className="border-t py-24" style={{ borderColor: ASH_DIM }}>
        <div className="mx-auto max-w-6xl px-8">
          <Reveal className="mb-10 max-w-[62ch]">
            <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color: EMBER_HOT }}>01 &middot; ignition</p>
            <h2 className={`${H} text-3xl`}>Point it at your games. It does the rest.</h2>
          </Reveal>
          <Reveal className={`relative overflow-hidden ${CARD}`}>
            <div style={{ background: CHAR_3, borderColor: ASH_DIM }} className="relative">
              <div className="absolute inset-y-0 left-0 w-[3px]" style={{ background: EMBER }} />
              <div className="grid grid-cols-1 gap-10 p-8 pl-9 lg:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.08em]" style={{ color: ASH }}>Source</p>
                  <div className="mb-6 flex flex-wrap gap-5 font-mono text-xs">
                    {["Lichess", "Chess.com", "PGN file"].map((s, i) => (
                      <span key={s} className="pb-1" style={i === 0 ? { color: PAPER, borderBottom: `2px solid ${EMBER}` } : { color: ASH }}>
                        {s}
                      </span>
                    ))}
                  </div>
                  <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.08em]" style={{ color: ASH }}>Username</p>
                  <div className="mb-6 rounded-xl border px-4 py-3 font-mono text-sm" style={{ borderColor: ASH_DIM, background: CHAR_2, color: PAPER_DIM }}>
                    MagnusCarlsen
                  </div>
                  <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.08em]" style={{ color: ASH }}>Scan for</p>
                  <div className="mb-7 flex flex-wrap gap-5 font-mono text-xs">
                    {["Openings", "Tactics", "Endgames", "Everything"].map((m) => (
                      <span key={m} style={m === "Everything" ? { color: PAPER, borderBottom: `2px solid ${EMBER}`, paddingBottom: 4 } : { color: ASH }}>
                        {m}
                      </span>
                    ))}
                  </div>
                  <button
                    className={`${BTN} w-full py-4 text-center font-mono text-sm font-bold hover:scale-[1.01] hover:shadow-[0_0_30px_-8px_rgba(255,92,36,0.6)]`}
                    style={{ background: EMBER, color: CHAR }}
                  >
                    Ignite scan
                  </button>
                </div>
                <div>
                  {[["Games", "300", "75%"], ["Moves per game", "30", "50%"], ["Engine depth", "12", "40%"]].map(([label, val, w]) => (
                    <div key={label} className="mb-6">
                      <div className="mb-1.5 flex justify-between font-mono text-[11.5px]" style={{ color: ASH }}>
                        <span>{label}</span>
                        <b style={{ color: PAPER }}>{val}</b>
                      </div>
                      <div className="relative h-1 overflow-hidden rounded-full" style={{ background: CHAR_2 }}>
                        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: w, background: EMBER }} />
                      </div>
                    </div>
                  ))}
                  <p className="mt-8 font-mono text-[12.5px]" style={{ color: ASH }}>
                    Most scans finish in under a minute. <span style={{ color: EMBER_HOT }}>Results stream in as they&apos;re found.</span>
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── How it works — plain editorial columns, no cards ── */}
      <section className="border-t py-24" style={{ borderColor: ASH_DIM, background: CHAR_2 }}>
        <div className="mx-auto max-w-6xl px-8">
          <Reveal className="mb-14 max-w-[62ch]">
            <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color: EMBER_HOT }}>02 &middot; the burn arc</p>
            <h2 className={`${H} mb-3 text-3xl`}>From scan to fixed, in three steps</h2>
            <p className="max-w-[58ch] text-[15.5px] leading-relaxed" style={{ color: ASH }}>
              The same mistake shown here goes from hot to cold — no setup, first report in under a minute.
            </p>
          </Reveal>
          <Reveal className="grid grid-cols-1 divide-y md:grid-cols-3 md:divide-x md:divide-y-0" style={{ borderColor: ASH_DIM }}>
            {[
              { n: "01", color: ASH, title: "Connect your accounts", copy: "Link Lichess or Chess.com in seconds. We pull up to 300 recent games and run them through Stockfish 18 — free." },
              { n: "02", color: EMBER, title: "We find where it's hot", copy: "The engine flags the exact moves where your position stopped being fine and started burning." },
              { n: "03", color: WHITE_HOT, title: "Drill it cold", copy: "Every leak becomes a training position. Repeat it until the mistake stops costing you games." },
            ].map((s, i) => (
              <div key={s.n} className={`py-8 md:py-0 md:px-10 ${i === 0 ? "md:pl-0" : ""} ${i === 2 ? "md:pr-0" : ""}`} style={{ borderColor: ASH_DIM }}>
                <span className={`${H} mb-4 block text-4xl`} style={{ color: s.color }}>{s.n}</span>
                <h3 className="mb-2 text-[17px] font-bold">{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: ASH }}>{s.copy}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── Features — asymmetric: one signature feature + a plain list ── */}
      <section className="border-t py-24" style={{ borderColor: ASH_DIM }}>
        <div className="mx-auto max-w-6xl px-8">
          <Reveal className="mb-12 max-w-[62ch]">
            <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color: EMBER_HOT }}>what it finds</p>
            <h2 className={`${H} text-3xl`}>Everything you need to stop repeating mistakes</h2>
          </Reveal>
          <Reveal className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.1fr]">
            <div className={`${CARD} p-9`} style={{ background: CHAR_3, borderColor: ASH_DIM }}>
              <span className={`${H} mb-5 block text-5xl`} style={{ color: EMBER }}>??</span>
              <h3 className="mb-2 text-xl font-bold">Opening leak detection</h3>
              <p className="text-[15px] leading-relaxed" style={{ color: ASH }}>
                Find the exact moves where your openings fall apart — and how many rating points it&apos;s cost you.
                The one feature every other stat in this report gets built on top of.
              </p>
            </div>
            <div className="flex flex-col divide-y" style={{ borderColor: ASH_DIM }}>
              {SUPPORTING_FEATURES.map((f) => (
                <div key={f.title} className="flex items-baseline justify-between gap-6 py-4">
                  <h3 className="text-sm font-bold">{f.title}</h3>
                  <p className="max-w-[38ch] text-right text-[13px] leading-snug" style={{ color: ASH }}>{f.copy}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Sample reports ── */}
      <section className="border-t py-24" style={{ borderColor: ASH_DIM, background: CHAR_2 }}>
        <div className="mx-auto max-w-6xl px-8">
          <Reveal className="mb-10 max-w-[62ch]">
            <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color: EMBER_HOT }}>sample reports</p>
            <h2 className={`${H} text-3xl`}>See what we found for players like you</h2>
          </Reveal>
          <Reveal className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SAMPLES.map((r) => (
              <div key={r.name} className={`${CARD} flex flex-col gap-3.5 p-6 transition-transform duration-300 hover:-translate-y-1`} style={{ background: CHAR_3, borderColor: ASH_DIM }}>
                <div className="flex items-center gap-3">
                  <Avatar initials={r.initials} />
                  <div>
                    <b className="block text-[14.5px] font-bold">{r.name}</b>
                    <span className="font-mono text-[11.5px]" style={{ color: ASH }}>{r.role}</span>
                  </div>
                </div>
                <span className="self-start rounded-full border px-2.5 py-0.5 font-mono text-[11px]" style={{ borderColor: ASH_DIM, color: ASH }}>{r.peak}</span>
                <div className="flex gap-5 border-t pt-3.5" style={{ borderColor: ASH_DIM }}>
                  <div><b className="block font-mono text-[15px] font-bold" style={{ color: EMBER }}>{r.leaks}</b><span className="text-[10px]" style={{ color: ASH }}>leaks</span></div>
                  <div><b className="block font-mono text-[15px] font-bold">{r.tactics}</b><span className="text-[10px]" style={{ color: ASH }}>tactics</span></div>
                  <div><b className="block font-mono text-[15px] font-bold">{r.endgames}</b><span className="text-[10px]" style={{ color: ASH }}>endgames</span></div>
                </div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="border-t py-24" style={{ borderColor: ASH_DIM }}>
        <div className="mx-auto max-w-6xl px-8">
          <Reveal className="mb-10 max-w-[62ch]">
            <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color: EMBER_HOT }}>players are actually improving</p>
            <h2 className={`${H} text-3xl`}>Real results from real players</h2>
          </Reveal>
          <Reveal className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className={`${CARD} p-7`} style={{ background: CHAR_3, borderColor: ASH_DIM }}>
                <p className="mb-5 text-[14.5px] leading-relaxed" style={{ color: PAPER_DIM }}>&ldquo;{t.quote}&rdquo;</p>
                <div className="border-t pt-4" style={{ borderColor: ASH_DIM }}>
                  <div className="mb-2.5 flex items-center gap-3">
                    <Avatar initials={t.initials} size={34} />
                    <div>
                      <b className="text-[13px]">{t.name}</b>
                      <div className="font-mono text-[11px]" style={{ color: ASH }}>{t.role}</div>
                    </div>
                  </div>
                  <div className="font-mono text-[13px]">
                    <span style={{ color: ASH }}>{t.from}</span> &rarr; <span className="font-bold" style={{ color: EMBER_HOT }}>{t.to}</span>
                  </div>
                </div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="border-t py-24" style={{ borderColor: ASH_DIM, background: CHAR_2 }}>
        <div className="mx-auto max-w-6xl px-8">
          <Reveal className="mb-10 max-w-[62ch]">
            <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color: EMBER_HOT }}>simple pricing</p>
            <h2 className={`${H} text-3xl`}>Start free. Upgrade when it&apos;s paying off.</h2>
          </Reveal>
          <Reveal className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-3">
            <div className={`flex flex-col ${CARD} p-7`} style={{ background: CHAR_3, borderColor: ASH_DIM }}>
              <h3 className="mb-3 text-sm font-bold">Free</h3>
              <div className="mb-6 font-mono text-[32px] font-bold">$0</div>
              <ul className="mb-6 flex flex-1 flex-col gap-2 text-[13px]" style={{ color: PAPER_DIM }}>
                {["Up to 300 games per scan", "Full opening-leak detection + drills", "10 tactics + 10 endgames per scan", "Strengths radar + mental-game stats"].map((li) => (
                  <li key={li}><span className="font-mono" style={{ color: EMBER }}>+ </span>{li}</li>
                ))}
              </ul>
              <button className={`${BTN} border py-3 text-center font-mono text-[13.5px] font-bold hover:bg-white/[0.04]`} style={{ borderColor: ASH_DIM, color: PAPER }}>Start free</button>
            </div>
            <div className={`relative flex flex-col ${CARD} p-7 shadow-[0_20px_50px_-15px_rgba(255,92,36,0.25)]`} style={{ background: CHAR_3, borderColor: EMBER, borderWidth: 2 }}>
              <span className="absolute -top-3 left-6 rounded-full px-3 py-1 font-mono text-[10px] font-bold tracking-wide" style={{ background: EMBER, color: CHAR }}>37% off &middot; most popular</span>
              <h3 className="mb-3 text-sm font-bold">Pro</h3>
              <div className="font-mono text-[32px] font-bold">$5<span className="text-[13px] font-normal" style={{ color: ASH }}>/mo</span></div>
              <div className="mb-6 font-mono text-xs line-through" style={{ color: ASH_DIM }}>$8/mo</div>
              <ul className="mb-6 flex flex-1 flex-col gap-2 text-[13px]" style={{ color: PAPER_DIM }}>
                {["Everything in Free, plus —", "Unlimited games, tactics & endgames", "Engine depth up to 24", "Motif analysis + brilliant-move detection"].map((li) => (
                  <li key={li}><span className="font-mono" style={{ color: EMBER }}>+ </span>{li}</li>
                ))}
              </ul>
              <button className={`${BTN} py-3 text-center font-mono text-[13.5px] font-bold hover:scale-[1.02]`} style={{ background: EMBER, color: CHAR }}>Go Pro</button>
            </div>
            <div className={`flex flex-col ${CARD} p-7`} style={{ background: CHAR_3, borderColor: ASH_DIM }}>
              <h3 className="mb-3 text-sm font-bold">Lifetime</h3>
              <div className="font-mono text-[32px] font-bold">$59</div>
              <div className="mb-6 font-mono text-xs line-through" style={{ color: ASH_DIM }}>$99</div>
              <ul className="mb-6 flex flex-1 flex-col gap-2 text-[13px]" style={{ color: PAPER_DIM }}>
                {["Everything in Pro — forever", "One-time payment, no subscription", "Lock in founding-member pricing"].map((li) => (
                  <li key={li}><span className="font-mono" style={{ color: EMBER }}>+ </span>{li}</li>
                ))}
              </ul>
              <button className={`${BTN} border py-3 text-center font-mono text-[13.5px] font-bold hover:bg-white/[0.04]`} style={{ borderColor: ASH_DIM, color: PAPER }}>Get Lifetime</button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-t py-24" style={{ borderColor: ASH_DIM }}>
        <div className="mx-auto max-w-6xl px-8">
          <Reveal className="mb-10 max-w-[62ch]">
            <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color: EMBER_HOT }}>faq</p>
            <h2 className={`${H} text-3xl`}>Common questions</h2>
          </Reveal>
          <Reveal className="divide-y" style={{ borderColor: ASH_DIM }}>
            {FAQS.map((f) => (
              <details key={f.q} className="faq-item py-5">
                <summary className="flex cursor-default list-none items-center justify-between text-[15px] font-bold">
                  {f.q}
                  <span className="font-mono text-lg" style={{ color: EMBER }}>+</span>
                </summary>
                <p className="mt-3.5 max-w-[65ch] text-sm leading-relaxed" style={{ color: ASH }}>{f.a}</p>
              </details>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="border-t py-28 text-center" style={{ borderColor: ASH_DIM, background: CHAR_2 }}>
        <div className="mx-auto max-w-6xl px-8">
          <Reveal>
            <h2 className={`${H} mb-8 text-4xl sm:text-5xl`}>Ready to find your patterns?</h2>
            <button
              className={`${BTN} px-6 py-4 font-mono text-sm font-bold hover:scale-[1.02] hover:shadow-[0_0_40px_-10px_rgba(255,92,36,0.6)]`}
              style={{ background: EMBER, color: CHAR }}
            >
              Scan my games — free
            </button>
          </Reveal>
        </div>
      </section>

      <footer className="py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-8 font-mono text-[12.5px]" style={{ color: ASH }}>
          <span>firechess</span>
          <span>blog &middot; pricing &middot; about &middot; discord</span>
        </div>
      </footer>

      <div className="py-8 text-center">
        <span className="rounded-full border px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em]" style={{ borderColor: ASH_DIM, color: ASH }}>
          &#9660; report page &#9660;
        </span>
      </div>

      {/* ── Report page mock ── */}
      <section className="py-24" style={{ background: CHAR_2 }}>
        <div className="mx-auto max-w-6xl px-8">
          <Reveal className="mb-10 max-w-[62ch]">
            <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color: EMBER_HOT }}>the report, reframed</p>
            <h2 className={`${H} text-3xl`}>Not a stat dashboard. An autopsy.</h2>
          </Reveal>
          <Reveal>
            <div className={`relative overflow-hidden ${CARD} p-9`} style={{ background: CHAR_3, borderColor: ASH_DIM }}>
              <div className="absolute inset-y-0 left-0 w-[3px]" style={{ background: EMBER }} />
              <div className="mb-7 flex items-start justify-between gap-6 border-b pb-7 pl-3" style={{ borderColor: ASH_DIM }}>
                <div className="flex items-start gap-3">
                  <Avatar initials="MC" />
                  <div>
                    <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.1em]" style={{ color: ASH }}>Magnus_Carlsen &middot; 300 games &middot; lichess</p>
                    <p className={`${H} text-[27px]`}>&ldquo;Brilliant until move 22, then vibes&rdquo;</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-[30px] font-bold" style={{ color: EMBER_HOT }}>2077</div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: ASH }}>Est. rating</div>
                </div>
              </div>
              <div className="flex flex-col gap-2.5 pl-3">
                {LEAKS.map((l) => (
                  <div key={l.title} className="grid grid-cols-[46px_1fr_auto] items-center gap-4 rounded-xl p-2.5 transition-colors hover:bg-white/[0.02]">
                    <span className="text-center font-mono text-[17px] font-bold" style={{ color: flagColor[l.heat] }}>{l.flag}</span>
                    <div>
                      <b className="block text-[14.5px] font-bold">{l.title}</b>
                      <span className="font-mono text-xs" style={{ color: ASH }}>{l.meta}</span>
                    </div>
                    <div className="relative h-1.5 w-[120px] overflow-hidden rounded-full" style={{ background: CHAR_2 }}>
                      <div className="absolute inset-0 rounded-full" style={{ width: l.width, background: barGradient[l.heat] }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <p className="mt-8 max-w-[68ch] text-[13.5px] leading-relaxed" style={{ color: ASH }}>
            <b style={{ color: PAPER_DIM }}>What changed in v6, and why:</b> research on 2026&apos;s actual
            award-winning sites kept surfacing the same note — winners are <i>balanced, not extreme</i>, and
            lean on one disciplined accent rather than gradients on every element. So gradients here are now
            reserved for exactly two places (the hero headline, the report&apos;s leak-severity bars); everything
            else is solid ember. Headlines moved to a serif for an editorial voice instead of generic bold-sans.
            Sections now reveal on scroll instead of sitting static. And the uniform card grids in &ldquo;how it
            works&rdquo; and &ldquo;features&rdquo; were broken on purpose — plain typographic columns and an
            asymmetric signature-feature layout, so the page has rhythm instead of repeating the same box forty times.
          </p>
        </div>
      </section>

      <style jsx>{`
        @keyframes gauge-rise {
          0%, 12% { height: 22%; }
          42%, 58% { height: 88%; }
          88%, 100% { height: 22%; }
        }
        .gauge-fill {
          height: 22%;
          background: linear-gradient(180deg, ${WHITE_HOT} 0%, ${EMBER_HOT} 30%, ${EMBER} 60%, ${EMBER_DEEP} 100%);
          animation: gauge-rise 5s ease-in-out infinite;
        }
        .faq-item summary::-webkit-details-marker {
          display: none;
        }
        .faq-item[open] summary span {
          transform: rotate(45deg);
          display: inline-block;
        }
        @media (prefers-reduced-motion: reduce) {
          .gauge-fill {
            animation: none !important;
            height: 60%;
          }
        }
      `}</style>
    </div>
  );
}
