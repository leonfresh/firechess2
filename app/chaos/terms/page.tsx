import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Chaos Chess Terms of Service",
  description: "Terms for playing the Chaos Chess Discord Activity operated by FireChess.",
  alternates: { canonical: "https://firechess.com/chaos/terms" },
};

export default function ChaosTermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16 text-sm leading-relaxed text-slate-300 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-white [&_section]:mt-8 [&_a]:text-emerald-400 [&_a]:underline">
      <p className="mb-3 text-emerald-400">FireChess · Discord Activity</p>
      <h1 className="text-3xl font-extrabold text-white">Chaos Chess Terms of Service</h1>
      <p className="mt-3">Effective September 6, 2026</p>
      <section><h2>Agreement and service</h2><p>These terms govern the Chaos Chess Discord Activity operated by FireChess. By using the Activity you agree to these terms. If you do not agree, do not use it. Chaos Chess is an experimental chess variant with special powers, AI practice and multiplayer matches. It is developed by FireChess and is not endorsed or operated by Discord.</p></section>
      <section><h2>Eligibility and Discord</h2><p>You must be at least 13 and meet Discord&apos;s minimum age in your country, if higher. If you are not legally able to agree to these terms yourself, a parent or guardian must agree on your behalf. Your use of Discord remains subject to <a href="https://discord.com/terms">Discord&apos;s Terms of Service</a> and Community Guidelines. Discord determines platform access, server permissions and Activity availability.</p></section>
      <section><h2>Playing fairly</h2><p>You may use the Activity for lawful personal play. Do not harass other players, impersonate others, exploit bugs to disrupt matches, access rooms or data without permission, overload our services, bypass access restrictions or use the Activity for unlawful gambling. Share room codes only with people you intend to invite. Report bugs, abuse or safety concerns through <Link href="/feedback">FireChess support</Link> or our <a href="https://discord.gg/YS8fc4FtEk">Discord support server</a>.</p></section>
      <section><h2>Availability, progress and payments</h2><p>The current Discord Activity is free to play and uses guest identities. No paid subscription is required for this version. Any future paid features will disclose their price and applicable terms before purchase. Development changes, bugs, outages or cleared device storage may reset matches, preferences or progress. We do not guarantee uninterrupted access, accurate AI play or permanent preservation of game results.</p></section>
      <section><h2>Privacy</h2><p>Our <Link href="/chaos/privacy">Chaos Chess Privacy Policy</Link> explains guest identifiers, multiplayer records, device storage and how to request access or deletion. Using the Activity does not give us permission to read your Discord messages or access your microphone or camera.</p></section>
      <section><h2>Ownership and permitted use</h2><p>FireChess and its licensors retain rights in the game, artwork and branding. We give you a limited, non-exclusive permission to access and play the Activity subject to these terms. Third-party and open-source components remain governed by their own licenses; these terms do not limit rights those licenses grant you.</p></section>
      <section><h2>Suspension and ending use</h2><p>You may stop using the Activity at any time. We may restrict access when reasonably necessary to address misuse, security risks or legal obligations, and may change or discontinue the experimental service. You can contact support about a restriction or request deletion as described in the Privacy Policy.</p></section>
      <section><h2>Disclaimers and your legal rights</h2><p>To the extent allowed by applicable law, the Activity is provided as available without promises that it will be error-free or suitable for every purpose. We are not responsible for losses caused by service interruptions or lost game progress to the extent the law permits. Nothing in these terms excludes consumer guarantees or other rights that cannot lawfully be excluded, including applicable rights under Australian Consumer Law, or limits liability where doing so would be unlawful.</p></section>
      <section><h2>Updates and contact</h2><p>We may update these terms as the Activity changes. We will publish the effective date here and provide appropriate notice of material changes. If you disagree with updated terms, stop using the Activity. Questions, complaints and support requests can be sent through <Link href="/feedback">FireChess support</Link> or our <a href="https://discord.gg/YS8fc4FtEk">Discord support server</a>.</p></section>
      <nav className="mt-10 border-t border-white/10 pt-6"><Link href="/chaos/privacy">Chaos Chess Privacy Policy</Link> · <Link href="/">FireChess home</Link></nav>
    </article>
  );
}
