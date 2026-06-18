"use client";

import { FormEvent, useState } from "react";
import { Mail, Sparkles } from "lucide-react";

type Status = "idle" | "loading" | "done" | "error";

/**
 * Homepage lead-capture section.
 *
 * Lead magnet: a free weekly "weakness report" email that re-surfaces the
 * user's repeated mistakes. Posts to /api/subscribe which stores the email and
 * fires a welcome email via Resend (wired into the existing weekly-digest
 * nurture flow).
 */
export function EmailCapture() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source: "homepage",
          leadMagnet: "weekly-leak-report",
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setStatus("done");
      setMessage(
        "You're in! Check your inbox for your welcome email — and your first weakness report is one scan away.",
      );
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <section className="animate-fade-in-up mx-auto w-full max-w-5xl">
      <div
        className="relative overflow-hidden rounded-[2rem] px-5 py-8 shadow-[0_30px_100px_-56px_rgba(20,8,5,0.98)] sm:px-8 sm:py-10"
        style={{
          background:
            "linear-gradient(150deg, rgba(11, 9, 12, 0.97) 0%, rgba(20, 13, 16, 0.96) 54%, rgba(48, 22, 12, 0.95) 100%)",
        }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-200/35 to-transparent" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-orange-500/[0.08] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-amber-500/[0.06] blur-3xl" />

        <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          {/* ── Pitch ──────────────────────────────────────────────── */}
          <div className="space-y-3 text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full bg-orange-400/[0.07] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.28em] text-orange-100/70">
              <Sparkles className="h-3 w-3" />
              Free weekly leak report
            </span>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Get the mistakes costing you rating — every week, free.
            </h2>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-400 sm:text-base lg:mx-0">
              One email a week with the opening lines, tactics, and endgames
              that trip up players at your level. No spam. Unsubscribe in one
              click.
            </p>
          </div>

          {/* ── Form ───────────────────────────────────────────────── */}
          <div className="lg:pl-4">
            {status === "done" ? (
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] px-5 py-5 text-left">
                <span className="mt-0.5 text-2xl">✅</span>
                <div>
                  <p className="text-sm font-semibold text-emerald-200">
                    You&apos;re subscribed
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    {message}
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-3">
                <div
                  className={`flex flex-col gap-2 overflow-hidden rounded-2xl border bg-white/[0.04] p-1.5 transition-colors duration-200 sm:flex-row sm:items-center focus-within:border-orange-400/35 ${
                    status === "error"
                      ? "border-red-500/40"
                      : "border-orange-500/10"
                  }`}
                >
                  <div className="flex flex-1 items-center gap-2 px-3 py-2">
                    <Mail className="h-4 w-4 shrink-0 text-orange-300/70" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (status === "error") setStatus("idle");
                      }}
                      placeholder="you@email.com"
                      aria-label="Email address"
                      className="flex-1 bg-transparent text-base text-white outline-none placeholder:text-slate-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="btn-cta-fire inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white disabled:opacity-70"
                  >
                    {status === "loading" ? (
                      <>
                        <svg
                          className="h-4 w-4 animate-spin"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-90"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Subscribing…
                      </>
                    ) : (
                      <>Get my free report →</>
                    )}
                  </button>
                </div>

                {status === "error" && (
                  <p className="px-2 text-xs text-red-400">{message}</p>
                )}
                <p className="px-2 text-[11px] text-slate-500">
                  Join improvers getting weekly insights. Unsubscribe anytime.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
