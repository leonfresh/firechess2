'use client';
import { useState } from 'react';
import { tagShareUrl } from '@/lib/chaos-share-tag';

/**
 * Share controls for the Game of the Week. On the website the canonical link is
 * the replay page; inside the Discord Activity the same match lives at
 * chaos.firechess.com/share?match=… so the {@link baseUrl} prop can override it.
 */
export function ChaosWeekShare({
  matchId,
  headline,
  image,
  baseUrl,
}: {
  matchId: string;
  headline: string;
  image: string;
  baseUrl?: string;
}) {
  const [status, setStatus] = useState('');
  const url = tagShareUrl(baseUrl ?? (typeof window !== 'undefined' ? `${window.location.origin}/chaos/replay/${matchId}` : `/chaos/replay/${matchId}`), 'week');

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: headline, text: headline, url });
      else {
        await navigator.clipboard.writeText(url);
        setStatus('Replay link copied!');
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) setStatus('Sharing unavailable. Copy the link below.');
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
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
      anchor.download = 'chaos-game-of-the-week.png';
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(href), 10000);
      setStatus('Card downloaded.');
    } catch {
      setStatus('Could not download the card. Please try again.');
    }
  }

  function post() {
    const text = `${headline}\n\nGame of the Week on Chaos Chess → ${url}`;
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={share}
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-300 transition-all hover:bg-emerald-500/20"
        >
          Share
        </button>
        <button
          type="button"
          onClick={download}
          className="rounded-lg border border-[#c69a54]/40 bg-[#c69a54]/10 px-4 py-2 text-sm font-bold text-[#fff0c7] transition-all hover:bg-[#c69a54]/20"
        >
          Download card
        </button>
        <button
          type="button"
          onClick={copy}
          className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-white/10"
        >
          Copy link
        </button>
        <button
          type="button"
          onClick={post}
          className="rounded-lg border border-sky-500/25 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-300 transition-all hover:bg-sky-500/20"
        >
          Post on X
        </button>
      </div>
      <input
        aria-label="Replay link"
        readOnly
        value={url}
        onFocus={(event) => event.target.select()}
        className="w-full rounded-lg border border-white/10 bg-[#17283d] px-3 py-2 text-xs text-[#fff0c7]"
      />
      <p role="status" className="text-xs text-slate-400">
        {status}
      </p>
    </div>
  );
}
