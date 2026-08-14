"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Shield, Swords, Eye } from "lucide-react";

/**
 * OpponentScan — "Scan your opponent before you play them."
 *
 * Controversial by design. Uses the same /api/scans endpoint but frames
 * the UX around exploiting someone else's weaknesses. The copy is
 * deliberately provocative to drive sharing/debate.
 */
export function OpponentScan() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [source, setSource] = useState<"lichess" | "chesscom">("lichess");
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) {
      setError("Enter their username.");
      setState("error");
      return;
    }
    setState("loading");
    setError("");
    try {
      const res = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chessUsername: trimmed,
          config: {
            maxGames: 50,
            maxMoves: 15,
            engineDepth: 8,
            cpThreshold: 50,
            source,
            scanMode: "openings",
            speed: ["all"],
          },
        }),
      });
      const json = (await res.json()) as {
        id?: string;
        guestToken?: string | null;
        error?: string;
      };
      if (!res.ok || !json.id)
        throw new Error(json.error || "Could not create report.");
      router.push(`/report/${json.id}?mode=opponent`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setState("error");
    }
  };

  return (
    <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-red-500/[0.04] blur-[150px]" />
        <div className="absolute right-1/4 bottom-0 h-[400px] w-[400px] translate-x-1/2 rounded-full bg-[#ff5a1f]/[0.03] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/[0.08] px-4 py-1.5">
            <Swords className="h-3.5 w-3.5 text-red-400" />
            <span className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-red-300">
              Opponent intel
            </span>
          </div>
          <h2 className="mb-4 text-4xl font-extrabold leading-[1.08] tracking-[-0.03em] text-white sm:text-5xl">
            Know their weaknesses
            <br />
            <span className="font-serif italic text-[#ff5a1f]">before move one.</span>
          </h2>
          <p className="mx-auto max-w-xl text-lg leading-relaxed text-[#8d8696]">
            Enter any Lichess or Chess.com username. We&apos;ll scan their last 300
            games and show you exactly where they leak — so you can prepare
            the right opening, the right plan, and the right moment to strike.
          </p>
        </div>

        {/* Scan form */}
        <form
          onSubmit={onSubmit}
          className="mx-auto max-w-2xl overflow-hidden rounded-[1.5rem] border border-[#1e1a24] bg-[#121015] p-6 sm:p-8"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-400/30 to-transparent" />

          {/* Platform toggle */}
          <div className="mb-5 flex items-center justify-center gap-2">
            {(["lichess", "chesscom"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSource(s)}
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  source === s
                    ? "bg-[#ff5a1f] text-white shadow-[0_0_20px_rgba(255,90,31,0.25)]"
                    : "border border-[#1e1a24] text-[#8d8696] hover:border-[#ff5a1f]/20 hover:text-white"
                }`}
              >
                {s === "lichess" ? "Lichess" : "Chess.com"}
              </button>
            ))}
          </div>

          {/* Username input */}
          <div className="mb-5 flex items-center gap-3 overflow-hidden rounded-xl border border-[#1e1a24] bg-[#070608] px-4 py-3 transition-colors focus-within:border-[#ff5a1f]/30">
            <Eye className="h-5 w-5 shrink-0 text-[#565061]" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={
                source === "lichess"
                  ? "Their Lichess username"
                  : "Their Chess.com username"
              }
              className="flex-1 bg-transparent text-base text-white outline-none placeholder:text-[#565061]"
            />
          </div>

          {/* Error */}
          {state === "error" && error && (
            <p className="mb-4 text-center text-sm text-red-400">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={state === "loading"}
            className="nl3-cta nl3-cta-glow flex h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-[#ff5a1f] text-[15.5px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {state === "loading" ? (
              <>
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                </svg>
                Scanning their games...
              </>
            ) : (
              <>
                Scan their games — free
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          {/* Trust row */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs text-[#565061]">
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-[#ff5a1f]" />
              They won&apos;t know you scanned them
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-[#ff5a1f]" />
              Uses only public game data
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-[#ff5a1f]" />
              No account required
            </span>
          </div>
        </form>

        {/* Features grid */}
        <div className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-3">
          {[
            {
              icon: "🎯",
              title: "Opening leaks",
              desc: "See which openings they lose from — and prepare the right response.",
            },
            {
              icon: "⚡",
              title: "Tactical blind spots",
              desc: "Find the motifs they miss — forks, pins, back-rank mates.",
            },
            {
              icon: "🏁",
              title: "Endgame weaknesses",
              desc: "Know if they convert poorly — so you can trade into favorable endgames.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-[#1e1a24] bg-[#121015] p-5 transition-all duration-300 hover:border-[#ff5a1f]/20"
            >
              <div className="mb-3 text-2xl">{f.icon}</div>
              <h3 className="mb-1.5 text-[15px] font-semibold text-white">
                {f.title}
              </h3>
              <p className="text-[13px] leading-relaxed text-[#8d8696]">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
