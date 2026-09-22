'use client';
import { useState } from 'react';

/**
 * The big share card shown after a match — win OR loss. Renders the same card the
 * OG tags use (/api/chaos/share/image) so the preview, the download and the
 * Discord unfurl are the same image, then offers the friendly share paths.
 *
 * Website play shares /chaos/replay/<roomId>; the Discord Activity deployment
 * passes its own baseUrl (chaos.firechess.com/share?match=…).
 */
export function ChaosShareButton({
  matchId,
  baseUrl,
  headline,
  autoOpen = false,
}: {
  matchId: string;
  baseUrl?: string;
  headline?: string;
  autoOpen?: boolean;
}) {
  const [open, setOpen] = useState(autoOpen);
  const [status, setStatus] = useState('');
  const image = `/api/chaos/share/image?match=${encodeURIComponent(matchId)}`;
  const square = `/api/chaos/share/image?match=${encodeURIComponent(matchId)}&size=square`;

  const replayUrl = () =>
    baseUrl ??
    (typeof window !== 'undefined'
      ? `${window.location.origin}/chaos/replay/${encodeURIComponent(matchId)}`
      : `/chaos/replay/${encodeURIComponent(matchId)}`);

  async function share() {
    const url = replayUrl();
    const text = headline ? `${headline}\n\n${url}` : `A Chaos Chess match worth watching\n\n${url}`;
    try {
      if (navigator.share) await navigator.share({ title: 'Chaos Chess', text, url });
      else {
        await navigator.clipboard.writeText(text);
        setStatus('Replay link copied!');
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) setStatus('Sharing unavailable. Copy the link below.');
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(replayUrl());
      setStatus('Replay link copied!');
    } catch {
      setStatus('Copy failed — select the link below.');
    }
  }

  async function download() {
    try {
      const response = await fetch(image);
      if (!response.ok) throw new Error('card');
      const blob = await response.blob();
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.download = 'chaos-chess-match.png';
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(href), 10000);
      setStatus('Card downloaded.');
    } catch {
      setStatus('Could not download the card. Please try again.');
    }
  }

  function post() {
    const url = replayUrl();
    const text = headline ? `${headline}\n\nChaos Chess → ${url}` : `Chaos Chess → ${url}`;
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  }

  const button = 'rounded-lg border px-3 py-2 text-xs font-semibold transition-all';

  return (
    <div className="w-full rounded-xl border border-[#c69a54]/35 bg-[#17283d] p-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 text-left text-sm font-bold text-[#fff0c7]"
      >
        <span>🎴 Share this match</span>
        <span className="text-xs font-medium text-slate-400">{open ? 'Hide card' : 'Big card · replay link'}</span>
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-3">
          {/* The card is the artefact: same image Discord unfurls from the replay link. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt="Your Chaos Chess match card"
            className="w-full rounded-lg border border-white/10"
            onError={() => setStatus('Card is still rendering — try Download in a second.')}
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={share} className={`${button} border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20`}>
              Share
            </button>
            <button type="button" onClick={download} className={`${button} border-[#c69a54]/40 bg-[#c69a54]/10 text-[#fff0c7] hover:bg-[#c69a54]/20`}>
              Download card
            </button>
            <button type="button" onClick={copy} className={`${button} border-white/15 bg-white/5 text-slate-300 hover:bg-white/10`}>
              Copy link
            </button>
            <a
              href={square}
              target="_blank"
              rel="noopener noreferrer"
              className={`${button} border-white/15 bg-white/5 text-slate-300 hover:bg-white/10`}
            >
              Square card
            </a>
            <button type="button" onClick={post} className={`${button} border-sky-500/25 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20`}>
              Post on X
            </button>
          </div>
          <input
            aria-label="Replay link"
            readOnly
            value={replayUrl()}
            onFocus={(event) => event.target.select()}
            className="w-full rounded-lg border border-white/10 bg-[#0f1c2b] px-3 py-2 text-[11px] text-[#fff0c7]"
          />
          <p role="status" className="text-[11px] text-slate-400">
            {status}
          </p>
        </div>
      )}
    </div>
  );
}
