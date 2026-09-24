'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './chaos-week-strip.module.css';

/**
 * Game of the Week strip for entry points that are not /chaos/week itself: the
 * site front page and the Chaos lobby. Data comes from /api/chaos/week so the
 * strip, the page and the Discord post can never disagree.
 *
 * Tier colours are duplicated from lib/chaos-score on purpose — importing that
 * module would pull the whole modifier/anomaly catalogue into the client bundle
 * of the marketing page.
 */
type Winner = {
  id?: string;
  plies?: number;
  timeControl?: string;
  watchReasons?: string[];
  moment?: {fen: string; label: string} | null;
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
  replayBase,
  weekHref,
  weekLabel,
}: {
  tone?: 'chaos' | 'site';
  thumbnail?: boolean;
  className?: string;
  label?: string;
  /** Where the replay lives. Defaults to /watch?match= inside the Discord Activity, which has
   *  no /chaos routes, and /chaos/replay/ on the website. */
  replayBase?: string;
  /** Where the full week lives. Defaults by environment. */
  weekHref?: string;
  weekLabel?: string;
  /** Server-fetched winner: renders in the HTML instead of after a client fetch. */
  initial?: Winner | null;
  initialGames?: number | null;
}) {
  const [winner, setWinner] = useState<Winner | null>(initial);
  const [loaded, setLoaded] = useState(!!initial);
  const [games, setGames] = useState<number | null>(initialGames);
  /** The Discord Activity serves this component from chaos.firechess.com (or in an iframe with
   *  ?frame_id=) and has no /chaos/* routes: replays are /watch?match=<id> there. */
  const [activityHost, setActivityHost] = useState(false);
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      setActivityHost(
        /(^|\.)chaos\.firechess\.com$/.test(window.location.hostname) || params.has('frame_id'),
      );
    } catch {
      /* SSR or a locked-down frame: keep the website links. */
    }
  }, []);

  useEffect(() => {
    if (initial) return;
    let alive = true;
    fetch('/api/chaos/week', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!alive || !data) return;
        setLoaded(true);
        setWinner(data.winner as Winner | null);
        setGames(typeof data.gamesScored === 'number' ? data.gamesScored : null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [initial]);

  if (!winner) return loaded ? <section className={`${styles.card} ${styles.empty} ${className}`} aria-label={label}>
    <span className={styles.fallback} aria-hidden="true">♛</span><div className={styles.content}>
      <div className={styles.kicker}>✦ {label}</div><h3>Your game could be next.</h3>
      <p className={styles.reason}>Sign in and finish a match against another signed-in player. The most exciting eligible replay takes the spotlight.</p>
      <p className={styles.meta}>No eligible replay this week yet. Guest games don’t enter the weekly selection.</p>
    </div>
  </section> : null;

  const replayHref = `${replayBase ?? (activityHost ? '/watch?match=' : '/chaos/replay/')}${encodeURIComponent(winner.id ?? winner.roomId)}`;
  const fullWeekHref = weekHref ?? (activityHost ? '/watch?tab=archive' : '/chaos/week');
  const fullWeekLabel = weekLabel ?? (activityHost ? 'All replays →' : 'The week →');
  const site = tone === 'site';
  const ranks = winner.moment?.fen.split(' ')[0].split('/') ?? [];
  const squares = ranks.length === 8 ? ranks.flatMap(rank => [...rank].flatMap(c => /[1-8]/.test(c) ? Array(Number(c)).fill('') : [c])) : [];
  const board = winner.winner === 'black' ? [...squares].reverse() : squares;
  return (
    <section className={`${styles.card} ${site ? styles.site : ''} ${className}`} aria-label={label}>
      <Link href={replayHref} className={styles.preview} aria-label={`Watch ${winner.white} versus ${winner.black}`}>
        {board.length === 64 ? <div className={styles.board} aria-hidden="true">{board.map((piece, i) =>
          <span key={i} className={(Math.floor(i / 8) + i % 8) % 2 ? styles.dark : styles.light}>
            {piece && <img src={`/activity/pieces/${piece === piece.toUpperCase() ? 'w' : 'b'}${piece.toUpperCase()}.svg`} alt="" width={40} height={40} loading="lazy" />}
          </span>)}
        </div> : <span className={styles.fallback} aria-hidden="true">♛</span>}
        <span className={styles.play} aria-hidden="true">▶</span>
        <span className={styles.previewCaption}>REPLAY THE CHAOS</span>
      </Link>
      <div className={styles.content}>
        <div className={styles.kicker}><span>✦ {label}</span><span>THIS WEEK</span></div>
        <h3>{winner.watchReasons?.[0]?.replace(/Winner recovered a (\d+)-point material deficit/, '$1 points down. Still won.') ?? clause(winner.headline).replace(/^[^\p{L}]+/u, '')}</h3>
        <p className={styles.players}><span>{winner.white}</span><small>vs</small><span>{winner.black}</span></p>
        <p className={styles.reason}>{winner.watchReasons?.slice(1).join(' · ') || 'A match worth watching. See how it unfolded.'}</p>
        <div className={styles.meta}>{winner.plies ? <span>{Math.ceil(winner.plies / 2)} moves</span> : null}{winner.timeControl && <span>{winner.timeControl}</span>}{games !== null && <span>Picked from {games} eligible games</span>}</div>
        <p className={styles.eligibility}>Want the spotlight? Both players must be signed in to qualify.</p>
        <div className={styles.actions}><Link href={replayHref} className={styles.watch}>Watch replay <span aria-hidden="true">↗</span></Link><Link href={fullWeekHref} className={styles.archive}>{fullWeekLabel}</Link></div>
      </div>
    </section>
  );
}
