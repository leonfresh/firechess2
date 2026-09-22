import type { Metadata } from 'next';
import Link from 'next/link';
import { getChaosWeek, weekKey } from '@/lib/chaos-week';
import { CHAOS_TIER_STYLE } from '@/lib/chaos-score';
import { ChaosWeekShare } from '@/components/chaos-week-share';

export const dynamic = 'force-dynamic';

const WEEK_IMAGE = '/api/chaos/week/image?days=7';

/** The score lib reports sides ("White"/"Black"); readers want player names. */
type Named = { headline: string; white: string; black: string };
const namedHeadline = (entry: Named) =>
  entry.headline.replace(/^White — /, `${entry.white} — `).replace(/^Black — /, `${entry.black} — `);

export async function generateMetadata(): Promise<Metadata> {
  const week = await getChaosWeek();
  const title = week.winner
    ? `Game of the Week — ${namedHeadline(week.winner)}`
    : 'Chaos Chess — Game of the Week';
  const description = week.winner
    ? `${week.winner.white} vs ${week.winner.black} · Chaos Score ${week.winner.score} (${week.winner.tier}) · ${week.winner.blurb}`
    : 'The single most chaotic Chess game of the week, scored on powers, anomalies and king captures.';
  return {
    title,
    description,
    alternates: { canonical: '/chaos/week' },
    openGraph: {
      title,
      description,
      url: '/chaos/week',
      type: 'article',
      images: [{ url: WEEK_IMAGE, width: 1200, height: 630, alt: 'Chaos Chess Game of the Week' }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [WEEK_IMAGE] },
  };
}

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', timeZone: 'UTC' });

export default async function ChaosWeekPage() {
  const week = await getChaosWeek();
  const winner = week.winner;
  const label = winner ? weekKey(new Date(winner.endedAt)) : week.weekKey;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-[#d7fa64]">
          <span className="font-bold">Chaos Chess</span>
          <span className="text-slate-600">/</span>
          <span>Game of the Week</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400">{label}</span>
        </div>
        <h1 className="text-3xl font-black text-[#fff0c7] sm:text-4xl">
          The most unhinged Chaos game of the last 7 days
        </h1>
        <p className="max-w-3xl text-sm text-slate-400">
          Every archived match from {dateLabel(week.windowStart)} to {dateLabel(week.windowEnd)} was scored on chaos
          events — signature powers that reached the board, anomalies played, king captures, rare endings. No engine
          accuracy: a clean Stockfish game is a bad Chaos game.
        </p>
      </header>

      {!winner ? (
        <section className="rounded-2xl border border-white/10 bg-[#131f30] p-6 text-sm text-slate-300">
          <p className="mb-3">No archived matches in this window yet — be the first on the board.</p>
          <Link href="/chaos" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-300">
            Play Chaos Chess
          </Link>
        </section>
      ) : (
        <>
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${WEEK_IMAGE}&v=${label}`}
                alt={`Chaos Chess Game of the Week: ${namedHeadline(winner)}`}
                width={1200}
                height={630}
                className="w-full rounded-2xl border border-[#c69a54]/40"
              />
              <p className="text-xs text-slate-500">
                Scores are 0-100 and chaos-weighted. {week.gamesScored} games scored this window.
              </p>
            </div>

            <div className="flex flex-col gap-5">
              <div className="rounded-2xl border border-white/10 bg-[#131f30] p-5">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-black" style={{ color: CHAOS_TIER_STYLE[winner.tier].color }}>
                    {winner.score}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: CHAOS_TIER_STYLE[winner.tier].color }}>
                    {winner.tier}
                  </span>
                  <span className="ml-auto text-xs text-slate-500">
                    {winner.rated ? 'Rated' : 'Friendly'} · {winner.timeControl} · {winner.platform}
                  </span>
                </div>
                <h2 className="mt-3 text-lg font-bold text-[#fff0c7]">{namedHeadline(winner)}</h2>
                <p className="mt-1 text-sm text-slate-400">{winner.blurb}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {winner.badges.map((badge) => (
                    <span
                      key={`${badge.icon}-${badge.name}`}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200"
                    >
                      {badge.icon} {badge.name}
                      <span className="text-slate-500"> · {badge.detail}</span>
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/chaos/replay/${winner.roomId}`}
                    className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-300 transition-all hover:bg-emerald-500/20"
                  >
                    📺 Watch the replay
                  </Link>
                  <Link href="/chaos" className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition-all hover:bg-white/10">
                    ⚡ Play Chaos Chess
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#131f30] p-5">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Chaos timeline</h3>
                <ol className="mt-3 flex flex-col gap-2">
                  {winner.events.slice(0, 6).map((event, index) => (
                    <li key={`${event.label}-${index}`} className="flex items-start gap-3 text-sm text-slate-300">
                      <span className="text-base leading-5">{event.icon}</span>
                      <span>
                        {event.label}
                        <span className="text-slate-500">{event.ply ? ` · ply ${event.ply}` : ''}</span>
                      </span>
                    </li>
                  ))}
                  {winner.events.length === 0 && <li className="text-sm text-slate-400">A quiet, positional grind.</li>}
                </ol>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#131f30] p-5">
                <ChaosWeekShare
                  matchId={winner.roomId}
                  headline={`${winner.headline} — Chaos Chess Game of the Week`}
                  image={WEEK_IMAGE}
                />
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Top 5 of the week</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {week.podium.map((entry, index) => (
                <Link
                  key={entry.id}
                  href={`/chaos/replay/${entry.roomId}`}
                  className="flex flex-col gap-2 rounded-xl border border-white/10 bg-[#131f30] p-4 transition-all hover:border-[#c69a54]/40"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>#{index + 1} · {dateLabel(entry.endedAt)}</span>
                    <span className="font-bold" style={{ color: CHAOS_TIER_STYLE[entry.tier].color }}>
                      {entry.score} {entry.tier}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-[#fff0c7]">{namedHeadline(entry)}</div>
                  <div className="text-xs text-slate-400">
                    {entry.white} vs {entry.black} · {entry.plies} plies
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[#c69a54]/30 bg-[#131f30] p-5">
            <h2 className="text-sm font-bold text-[#fff0c7]">Why there is no accuracy score here</h2>
            <p className="mt-2 text-sm text-slate-400">
              Chaos Chess is not chess: a Nuclear Queen deletes a 3x3, a Kamikaze Bishop removes itself and anomalies
              reroute the board. Stockfish accuracy would rate those games nonsense and reward the blandest play. The
              Chaos Score rewards what makes a game worth sharing — powers that actually reached the board, anomalies,
              king captures, comeback endings and rarity — computed from the archived replay, never from an engine.
            </p>
          </section>
        </>
      )}
    </main>
  );
}
