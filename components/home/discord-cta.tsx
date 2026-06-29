import { ArrowRight } from "lucide-react";

const DISCORD_INVITE = "https://discord.gg/y9NCXcdvs8";

/** Discord brand glyph (lucide has no brand icon for it). */
function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.444.864-.608 1.249a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.036A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028ZM8.02 15.331c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
    </svg>
  );
}

/**
 * Discord community CTA — inspired by opal.google's "Join our Discord" block.
 * A calm, centered section: one short heading and one obvious action.
 */
export function DiscordCta() {
  return (
    <section className="scroll-reveal">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-indigo-400/15 bg-gradient-to-b from-indigo-500/[0.08] via-indigo-500/[0.03] to-transparent px-6 py-12 text-center sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute left-1/2 top-0 h-56 w-[28rem] -translate-x-1/2 rounded-full bg-indigo-500/15 blur-[110px]" />

        <div className="relative mx-auto flex max-w-xl flex-col items-center gap-6">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
            <DiscordIcon className="h-6 w-6" />
          </span>

          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Join our Discord for support
            <br className="hidden sm:block" /> and sharing feedback
          </h2>

          <p className="max-w-md text-base leading-relaxed text-slate-400">
            Get help, request features, and swap leaks with other players
            sharpening their game with FireChess.
          </p>

          <a
            href={DISCORD_INVITE}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex w-full max-w-md items-center justify-between gap-3 rounded-full border border-white/10 bg-white/[0.04] py-2 pl-5 pr-2 transition-colors hover:border-indigo-400/30 hover:bg-white/[0.06]"
          >
            <span className="flex items-center gap-2.5 text-sm font-semibold text-slate-200">
              <DiscordIcon className="h-4 w-4 text-indigo-300" />
              discord.gg/y9NCXcdvs8
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors group-hover:bg-indigo-400">
              Join
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
