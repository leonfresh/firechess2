import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service - FireChess",
  description: "FireChess terms of service — rules and conditions for using our platform.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 md:px-10">
      <h1 className="text-3xl font-extrabold text-white">Terms of Service</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: February 24, 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-300">
        <section>
          <h2 className="mb-3 text-lg font-bold text-white">1. Acceptance of Terms</h2>
          <p>
            By accessing or using FireChess (&quot;the Service&quot;), you agree to be bound by these
            Terms of Service. If you do not agree, do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-white">2. Description of Service</h2>
          <p>
            FireChess provides chess game analysis tools that scan your publicly available games
            from Lichess and Chess.com. Analysis is performed in your browser using Stockfish
            WASM. We offer both free and paid subscription tiers.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-white">3. Account & Authentication</h2>
          <p>
            You may sign in using Google or Lichess OAuth. You are responsible for maintaining
            the security of your account credentials. You must not impersonate other users or
            analyze accounts you do not own without permission.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-white">4. Subscriptions & Payments</h2>
          <ul className="list-inside list-disc space-y-1 text-slate-400">
            <li>Pro subscriptions are billed monthly through Stripe.</li>
            <li>You may cancel at any time — access continues until the end of the billing period.</li>
            <li>Refunds are handled on a case-by-case basis.{" "}
              <Link href="/feedback" className="text-emerald-400 hover:underline">Contact support</Link>.</li>
            <li>Prices may change with 30 days&apos; notice to existing subscribers.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-white">5. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-slate-400">
            <li>Use the Service to cheat in online chess games</li>
            <li>Attempt to reverse-engineer, scrape, or exploit the Service</li>
            <li>Abuse API rate limits or make automated requests beyond normal usage</li>
            <li>Use the Service for any unlawful purpose</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-white">6. Intellectual Property</h2>
          <p>
            FireChess, its design, code, and branding are the property of FireChess. Stockfish
            is open-source software licensed under the GPL. Your analysis data and saved reports
            belong to you.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-white">7. Disclaimer</h2>
          <p>
            The Service is provided &quot;as is&quot; without warranties of any kind. Analysis results
            are based on engine evaluation and may not perfectly reflect optimal play. We are
            not responsible for rating changes or competitive outcomes based on our analysis.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-white">8. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, FireChess shall not be liable for any
            indirect, incidental, or consequential damages arising from your use of the Service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-white">9. Termination</h2>
          <p>
            We reserve the right to suspend or terminate accounts that violate these terms.
            You may delete your account at any time by{" "}
            <Link href="/feedback" className="text-emerald-400 hover:underline">contacting support</Link>.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-white">10. Changes</h2>
          <p>
            We may update these terms from time to time. Material changes will be communicated
            via email or in-app notice. Continued use after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-white">11. Contact</h2>
          <p>
            Questions?{" "}
            <Link href="/feedback" className="text-emerald-400 hover:underline">Contact us through our support page</Link>.
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
