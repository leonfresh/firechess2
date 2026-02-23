import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy - FireChess",
  description: "FireChess privacy policy — how we handle your data.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 md:px-10">
      <h1 className="text-3xl font-extrabold text-white">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: February 24, 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-300">
        <section>
          <h2 className="mb-3 text-lg font-bold text-white">1. Information We Collect</h2>
          <p>
            When you sign in with Google or Lichess, we receive your name, email address, and
            profile picture from the OAuth provider. We also store your chess username and the
            analysis reports you choose to save.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-white">2. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-slate-400">
            <li>Authenticate your account and manage your subscription</li>
            <li>Save analysis reports to your dashboard</li>
            <li>Process payments through Stripe</li>
            <li>Improve the service and fix bugs</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-white">3. Chess Game Data</h2>
          <p>
            FireChess fetches your publicly available game data from Lichess or Chess.com APIs.
            Game analysis is performed in your browser using Stockfish WASM. We do not store your
            raw game data on our servers — only the analysis reports you explicitly save.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-white">4. Payment Processing</h2>
          <p>
            Payments are processed by{" "}
            <a href="https://stripe.com/privacy" className="text-emerald-400 underline" target="_blank" rel="noopener noreferrer">
              Stripe
            </a>
            . We do not store your credit card details. Stripe handles all payment information
            in compliance with PCI DSS standards.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-white">5. Data Sharing</h2>
          <p>
            We do not sell, trade, or share your personal information with third parties, except
            as required for payment processing (Stripe) and authentication (Google, Lichess OAuth).
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-white">6. Data Retention & Deletion</h2>
          <p>
            You can delete your saved reports from the Dashboard at any time. If you wish to
            delete your account entirely, contact us at{" "}
            <span className="text-emerald-400">support@firechess.com</span>.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-white">7. Cookies</h2>
          <p>
            We use essential cookies for authentication sessions. We do not use tracking or
            advertising cookies.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-white">8. Changes</h2>
          <p>
            We may update this policy from time to time. Continued use of FireChess after changes
            constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-white">9. Contact</h2>
          <p>
            Questions about this policy? Email us at{" "}
            <span className="text-emerald-400">support@firechess.com</span>.
          </p>
        </section>
      </div>

      <div className="mt-12 border-t border-white/[0.06] pt-6">
        <Link href="/" className="text-sm text-emerald-400 hover:underline">
          &larr; Back to Home
        </Link>
      </div>
    </div>
  );
}
