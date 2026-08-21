"use client";

/**
 * /feedback — Public feedback / support form.
 * Users can submit bug reports, feature requests, questions, or other feedback.
 */

import { useState } from "react";
import { useSession } from "@/components/session-provider";
import Link from "next/link";

const CATEGORIES = [
  { value: "bug", label: "Bug Report", icon: "🐛" },
  { value: "feature", label: "Feature Request", icon: "💡" },
  { value: "question", label: "Question", icon: "❓" },
  { value: "other", label: "Other", icon: "💬" },
] as const;

export default function FeedbackPage() {
  const { authenticated, user } = useSession();
  const [category, setCategory] = useState<string>("feature");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 5) {
      setError("Please write at least 5 characters.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          subject: subject.trim() || undefined,
          message: message.trim(),
          email: authenticated ? undefined : email || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }
      const data = await res.json();
      setTicketId(data.ticketId ?? null);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070608] text-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Feedback &amp; Support
          </h1>
          <p className="mt-3 text-[#8d8696]">
            Found a bug? Have an idea? We&apos;d love to hear from you.
          </p>
        </div>

        {submitted ? (
          /* ── Success state ─────────────────────────────────────── */
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
            <div className="mb-4 text-5xl">✅</div>
            <h2 className="text-xl font-semibold text-emerald-400">
              Ticket Created!
            </h2>
            <p className="mt-2 text-[#8d8696]">
              We&apos;ll review your submission and follow up if needed.
            </p>
            {authenticated && ticketId && (
              <Link
                href={`/support/${ticketId}`}
                className="mt-4 inline-block text-sm text-[#ff8c42] hover:underline"
              >
                View your ticket →
              </Link>
            )}

            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                onClick={() => {
                  setSubmitted(false);
                  setMessage("");
                  setSubject("");
                  setCategory("feature");
                  setTicketId(null);
                }}
                className="rounded-lg border border-[#2a2434] px-5 py-2.5 text-sm font-medium text-[#f0edf2] transition hover:border-[#3a3444] hover:text-white"
              >
                Submit another
              </button>
              <Link
                href="/"
                className="rounded-lg bg-[#ff5a1f] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#ff8c42]"
              >
                Back to Home
              </Link>
            </div>
          </div>
        ) : (
          /* ── Feedback form ─────────────────────────────────────── */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category picker */}
            <fieldset>
              <legend className="mb-3 text-sm font-medium text-[#f0edf2]">
                Category
              </legend>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`rounded-xl border px-4 py-3 text-center text-sm font-medium transition ${
                      category === cat.value
                        ? "border-[#ff5a1f]/40 bg-[#ff5a1f]/[0.08] text-[#ff8c42]"
                        : "border-[#2a2434] bg-[#121015] text-[#8d8696] hover:border-[#3a3444] hover:text-[#f0edf2]"
                    }`}
                  >
                    <span className="mb-1 block text-lg">{cat.icon}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Subject */}
            <div>
              <label
                htmlFor="subject"
                className="mb-2 block text-sm font-medium text-[#f0edf2]"
              >
                Subject{" "}
                <span className="text-[#565061]">(optional)</span>
              </label>
              <input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your issue or idea"
                className="w-full rounded-xl border border-[#2a2434] bg-[#121015] px-4 py-3 text-sm text-white placeholder-[#565061] transition focus:border-[#ff5a1f]/50 focus:outline-none focus:ring-1 focus:ring-[#ff5a1f]/30"
              />
            </div>

            {/* Message */}
            <div>
              <label
                htmlFor="message"
                className="mb-2 block text-sm font-medium text-[#f0edf2]"
              >
                Your Message
              </label>
              <textarea
                id="message"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue, idea, or question…"
                className="w-full rounded-xl border border-[#2a2434] bg-[#121015] px-4 py-3 text-sm text-white placeholder-[#565061] transition focus:border-[#ff5a1f]/50 focus:outline-none focus:ring-1 focus:ring-[#ff5a1f]/30"
              />
            </div>

            {/* Email (only for anonymous users) */}
            {!authenticated && (
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-[#f0edf2]"
                >
                  Email{" "}
                  <span className="text-[#565061]">(optional — for follow-up)</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-[#2a2434] bg-[#121015] px-4 py-3 text-sm text-white placeholder-[#565061] transition focus:border-[#ff5a1f]/50 focus:outline-none focus:ring-1 focus:ring-[#ff5a1f]/30"
                />
              </div>
            )}

            {/* Signed-in indicator */}
            {authenticated && user && (
              <p className="text-xs text-[#565061]">
                Submitting as{" "}
                <span className="text-[#f0edf2]">{user.name ?? user.email}</span>
              </p>
            )}

            {/* Error */}
            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[#ff5a1f] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-black/30 transition hover:-translate-y-0.5 disabled:opacity-50"
            >
              {submitting ? "Sending…" : "Send Feedback"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
