'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * Game of the Week strip for entry points that are not /chaos/week itself: the
 * site front page and the Chaos lobby. Data comes from /api/chaos/week so the
 * strip, the page and the Discord post can never disagree.
 *
 * Tier colours are duplicated from lib/chaos-score on purpose — importing that
 * module would pull the whole modifier/anomaly catalogue into the client bundle
 * of the marketing page.
 */
const TIER_COLOR: Record<string, string> = {
  MYTHIC: '#d7fa64',
  LEGENDARY: '#f0b354',
  WILD: '#7dd3fc',
  SOLID: '#a3e635',
  QUIET: '#94a3b8',
};

type Winner = {
  roomId: string;
  white: string;
  black: string;
  winner: string;
  headline: string;
  blurb: string;
  score: number;
  tier: string;
  gamesScored?: number;
};

const clause = (headline: string) =>
  headline.replace(/^(White|Black) — /, '').replace(/^(White|Black) armed the /, 'armed the ');

export function ChaosWeekStrip({
  tone = 'chaos',
  thumbnail = false,
  className = '',
  label = 'Game of the Week',
  initial = null,
  initialGames = null,
}: {
  tone?: 'chaos' | 'site';
  thumbnail?: boolean;
  className?: string;
  label?: string;
  /** Server-fetched winner: renders in the HTML instead of after a client fetch. */
  initial?: Winner | null;
  initialGames?: number | null;
}) {
  const [winner, setWinner] = useState<Winner | null>(initial);
  const [games, setGames] = useState<number | null>(initialGames);

  useEffect(() => {
    if (initial) return;
    let alive = true;
    fetch('/api/chaos/week', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!alive || !data?.winner) return;
        setWinner(data.winner as Winner);
        setGames(typeof data.gamesScored === 'number' ? data.gamesScored : null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [initial]);

  if (!winner) return null;

  const site = tone === 'site';
  const accent = TIER_COLOR[winner.tier] ?? TIER_COLOR.QUIET;
  const won = winner.winner === 'draw' ? null : winner.winner === 'white' ? winner.white : winner.black;
  const lost = winner.winner === 'draw' ? null : winner.winner === 'white' ? winner.black : winner.white;
  const line = won && lost ? `${won} beat ${lost} — ${clause(winner.headline)}` : clause(winner.headline);

  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-xl px-4 py-3 ${className}`}
      style={
        site
          ? { border: '1px solid #ff793845', background: 'linear-gradient(110deg,#ff793814,#a879ff0b)', color: 'var(--text)' }
          : { border: '1px solid rgba(198,154,84,.35)', background: '#131f30', color: '#fff0c7' }
      }
    >
      {thumbnail && (
        <Link href={`/chaos/replay/${winner.roomId}`} className="hidden shrink-0 sm:block" aria-hidden="true" tabIndex={-1}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/api/chaos/week/image"
            alt=""
            width={150}
            height={79}
            className="rounded-md border border-white/10"
          />
        </Link>
      )}
      <span aria-hidden="true" className="text-lg leading-none">🏆</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: accent }}>
          <span>{label}</span>
          <span
            className="rounded-md px-1.5 py-0.5 text-[10px] font-black"
            style={{ background: `${accent}22`, border: `1px solid ${accent}55`, color: accent }}
          >
            {winner.score} {winner.tier}
          </span>
          {games !== null && <span style={{ color: 'var(--muted, #9fb6c6)' }}>{games} games scored</span>}
        </div>
        <p className="mt-1 truncate text-sm font-semibold">{line}</p>
        <p className="truncate text-xs" style={{ color: 'var(--muted, #9fb6c6)' }}>
          {winner.blurb}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href={`/chaos/replay/${winner.roomId}`}
          className="chaos-week-link rounded-lg px-3 py-1.5 text-xs font-bold transition-all"
          style={{ border: `1px solid ${accent}55`, background: `${accent}18`, color: accent }}
        >
          Watch the replay
        </Link>
        <Link
          href="/chaos/week"
          className="chaos-week-link text-xs font-semibold underline underline-offset-2"
          style={{ color: 'var(--muted, #9fb6c6)' }}
        >
          The week →
        </Link>
      </div>
    </div>
  );
}
