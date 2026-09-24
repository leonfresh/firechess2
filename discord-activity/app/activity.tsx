'use client';
import { DiscordLaunch } from './discord-launch';
import { WebsiteAccount } from './website-account';
import { ActivityResult } from './match-result';
import { connectDiscord } from './activity-connection';
import { ExploreNav } from './explore-nav';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { SessionProvider } from '@/components/session-provider';
import { ChaosPresentation } from '@/components/chaos-presentation';
import { discordCustomId, shareInvite } from './discord-sdk';
import { ActivityLobby, ActivityDraft, ActivityHud, ActivityOpponentReveal, ActivityAnomalyPicker, PowerArt } from './game-presentation';
import { getSoundVolume, setSoundVolume, getMemeVolume, setMemeVolume } from '@/lib/sounds';
import { prepareActivityAudio } from './sound-pack';

const presentation = { activity: true, invite: shareInvite, launchJoinCode: discordCustomId, Result: ActivityResult, AnomalyPicker: ActivityAnomalyPicker, Lobby: ActivityLobby, Draft: ActivityDraft, Hud: ActivityHud, PowerArt, OpponentReveal: ActivityOpponentReveal };
const ChaosChess = dynamic(() => import('../../app/chaos/page'), {
  ssr: false,
  loading: () => <p className="p-8 text-center text-white">Loading Chaos Chess…</p>,
});

export function Activity() {
  const [status, setStatus] = useState<'loading' | 'preview' | 'connected' | 'error'>('loading');
  const [error, setError] = useState('');
  const [soundOpen, setSoundOpen] = useState(false);
  const [volume, setVolume] = useState(0.35);
  const [memes,setMemes] = useState(0.55);

  useEffect(() => {
    let active = true;
    prepareActivityAudio(); setVolume(getSoundVolume()); setMemes(getMemeVolume());
    const embedded = new URLSearchParams(window.location.search).has('frame_id');
    if (!embedded) { setStatus('preview'); return; }
    const timer = setTimeout(() => {
      if (active) { setError('Discord did not connect. Check the Application ID and URL mappings, then reopen the Activity.'); setStatus('error'); }
    }, 90000);
    connectDiscord().then(() => { if (active) setStatus('connected'); })
      .catch((reason: unknown) => {
        if (active) { setError(reason instanceof Error ? reason.message : 'Discord connection failed.'); setStatus('error'); }
      }).finally(() => clearTimeout(timer));
    return () => { active = false; clearTimeout(timer); };
  }, []);

  if (status === 'loading' || status === 'error') {
    return <main className="activity-connection-screen"><div className="activity-connection-card"><img src="/activity/logo.svg" width="86" height="86" alt="" />
      <span className="eyebrow">THE NEXT MATCH</span><h1>Chaos Chess</h1>
      <p role="status" className="max-w-lg text-slate-300">{status === 'error' ? error : 'Connecting to Discord…'}</p>
      {status === 'error' && <button className="primary-action" onClick={() => window.location.reload()}>Try again</button>}
      {status === 'error' && <button className="secondary-action" onClick={() => setStatus('preview')}>Play casually</button>}
    </div></main>;
  }
  return <div className="chaos-activity">
    <header className="activity-nav">
      <div className="activity-brand"><img src="/activity/logo.svg" width="38" height="38" alt="" /><strong>CHAOS<span>CHESS</span></strong><small>PLAY A LITTLE DIFFERENT.</small></div>
      <div className="nav-tools">{status === 'connected' && <span className="connection-pill"><i />IN DISCORD</span>}
        <ExploreNav />
        <button className="sound-button" aria-expanded={soundOpen} onClick={() => setSoundOpen(!soundOpen)}>Sound {volume === 0 ? 'off' : 'on'}</button>
        {status === 'preview' && <WebsiteAccount />}
        <DiscordLaunch />
      </div>
      {soundOpen && <div className="sound-popover"><label htmlFor="activity-volume">Game volume <strong>{Math.round(volume * 100)}%</strong></label><input id="activity-volume" type="range" min="0" max="1" step="0.05" value={volume} onChange={e => { const v = Number(e.target.value); setVolume(v); setSoundVolume(v); }} /><label htmlFor="activity-memes">Meme reactions <strong>{Math.round(memes*100)}%</strong></label><input id="activity-memes" type="range" min="0" max="1" step="0.05" value={memes} onChange={e=>{const v=Number(e.target.value);setMemes(v);setMemeVolume(v);}} /><p>Short reactions for the chaos. Set memes to zero for just the game cues.</p><button onClick={() => { const v = volume ? 0 : 0.35; setVolume(v); setSoundVolume(v); }}>{volume ? 'Mute effects' : 'Enable effects'}</button></div>}
    </header>
    <ChaosPresentation.Provider value={presentation}><SessionProvider><ChaosChess /></SessionProvider></ChaosPresentation.Provider>
  </div>;
}
