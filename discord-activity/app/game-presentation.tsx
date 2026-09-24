'use client';
import {ChaosAchievements} from '@/components/chaos-achievements';
import {ActivityCareer} from './career';
import {ChaosWatchButton} from '@/components/chaos-watch';
import { chaosIdentityHeaders } from '@/lib/chaos-client-identity';
import { useEffect, useRef, useState } from 'react';
import type { ChaosLobbyViewProps, ChaosDraftViewProps, ChaosHudProps, ChaosOpponentRevealProps } from '@/components/chaos-presentation';
import { playSound } from '@/lib/sounds';
import { getGuestId } from '@/lib/guest-id';
import type { AnomalyDefinition } from '@/lib/chaos-anomalies';
import { PowerArt } from './power-art';
export { PowerArt } from './power-art';
import { ActivityReplays } from './replays';
import { ChaosWeekStrip } from '@/components/chaos-week-strip';
import { ActivityCollection } from './collection';
import { CHAOS_TIME_CONTROLS } from '@/lib/chaos-clock';
import { useChaosAccount } from '@/lib/use-chaos-account';
import { ChaosRatedStatus } from '@/components/chaos-rated-status';
import { connectedParticipants, discordGuildId, discordInstanceId, inviteToInstance, participantLabel, type DiscordParticipant } from './discord-sdk';

export function ActivityLobby(props: ChaosLobbyViewProps) {
  const account = useChaosAccount();
  const [mode, setMode] = useState<'friends' | 'practice' | 'online'>('online');
  const [rooms, setRooms] = useState<{ roomCode: string; timeControlSeconds: number | null; incrementSeconds: number; name: string; rating: number | null; games: number; ratedEligible: boolean; yours: boolean; sameInstance?: boolean }[]>([]);
  const [seekTab,setSeekTab]=useState<'lobby'|'quick'>('quick');
  const [challengeFilter,setChallengeFilter]=useState<'all'|'clock'>('all');
  const [roomsLoaded,setRoomsLoaded]=useState(false);
  const [roomsError, setRoomsError] = useState('');
  const [inCall,setInCall]=useState<DiscordParticipant[]>([]);
  const [invited,setInvited]=useState(false);
  const [server,setServer]=useState<{players:number;games:number;rated:number;top:{name:string;rating:number;rank:number;yours:boolean}[]}|null>(null);
  /** Discord user ids in this activity instance, so the lobby can tell who is already here. */
  useEffect(() => {
    let active = true;
    const load = async () => { const people = await connectedParticipants(); if (active) setInCall(people); };
    void load(); const timer = setInterval(load, 20000);
    return () => { active = false; clearInterval(timer); };
  }, []);
  /** Server standing: "your server played N games". Only inside a guild launch. */
  useEffect(() => {
    const guild = discordGuildId();
    if (!guild) return;
    const controller = new AbortController();
    fetch(`/api/chaos/server?guild=${guild}`, {headers: {'X-Guest-Id': getGuestId(), ...chaosIdentityHeaders()}, signal: controller.signal, cache: 'no-store'})
      .then(r => r.ok ? r.json() : null).then(d => { if (d && !controller.signal.aborted) setServer(d); }).catch(() => {});
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (mode !== 'online') return;
    const controller = new AbortController();
    let fetching=false;
    async function refresh() {
      if(fetching || document.visibilityState==='hidden')return;
      fetching=true;
      try {
        const instance = discordInstanceId();
        const scope = instance ? `&instance=${encodeURIComponent(instance)}` : '';
        const response = await fetch(`/api/chaos/matchmake?list=1${scope}`, {headers: {'X-Guest-Id': getGuestId(), ...chaosIdentityHeaders()}, signal: controller.signal, cache: 'no-store'});
        if (!response.ok) throw new Error('Could not load rooms');
        const data = await response.json();
        if (!controller.signal.aborted) {setRooms(data.rooms); setRoomsError(''); setRoomsLoaded(true);}
      } catch { if (!controller.signal.aborted) setRoomsError('Challenge list unavailable. You can still use quick matchmaking.'); } finally {fetching=false;}
    }
    void refresh(); const timer = setInterval(refresh, 5000);
    return () => {controller.abort(); clearInterval(timer);};
  }, [mode]);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState('');
  /** Everyone in this activity instance except me, and my row in this server's standing. */
  const othersInCall = inCall.filter(person => `discord_${person.id}` !== account.data?.player?.id);
  const youHere = server?.top.find(row => row.yours);
  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true); setLocalError('');
    try { await action(); } catch { setLocalError('Could not connect. Please try again.'); }
    finally { setBusy(false); }
  }
  return <main className="activity-lobby">
    <section className="lobby-intro">
      <div className="eyebrow"><span /> CHESS WITH A TWIST</div>
      <h1>Small pieces.<br /><em>Big trouble.</em></h1>
      <p>Draft ridiculous powers. Surprise your friends.<br className="wide-only" /> Make the board your playground.</p>
    <ActivityCollection shopEntry />
      <div className="lobby-shortcuts"><div className="destination-heading"><span className="eyebrow">EXPLORE THE ARENA</span></div>
      <nav className="destination-grid" aria-label="Community and games"><ActivityCareer card/><ActivityCollection card/><ChaosWatchButton card label="Watch live" initialTab="live"/><ActivityReplays card/></nav>
      </div>
      <button type="button" className="community-link" onClick={()=>window.open('https://discord.gg/YS8fc4FtEk','_blank','noopener,noreferrer')} aria-label="Join our Discord community (opens in a new tab)"><span><strong>Join our Discord community</strong><small>Find rivals, share feedback, and talk Chaos Chess.</small></span><span aria-hidden="true">↗</span></button>
      <div className="how-it-works"><span><b>01</b> Play chess</span><span><b>02</b> Pick a power</span><span><b>03</b> Cause trouble</span></div>
      <details className="first-match-guide"><summary>First match? Here’s how it works.</summary><ol>
        <li>Choose an opening anomaly, or skip it. Both players finish choosing before the board unlocks.</li>
        <li>Click your piece to see its moves. Click it again to deselect, or choose a highlighted square to move.</li>
        <li>Every five turns, draft a power. White chooses first, then Black. Wait for both picks before continuing.</li>
      </ol><p>Your powers stay with you for the match. Open your power stash to read their rules.</p></details>
    </section>
    <section className="play-panel" aria-label="Start a game">
      <div className="panel-heading"><span className="eyebrow">THE NEXT MATCH</span><span className="pill">2 PLAYERS</span></div>
      <h2>Who’s playing?</h2>
      {(inCall.length > 0 || discordInstanceId()) && <div className="call-strip" data-alone={othersInCall.length === 0 ? 'true' : 'false'}>
        <span className="call-copy">
          <b>{othersInCall.length ? `${othersInCall.length} other player${othersInCall.length === 1 ? '' : 's'} in this call` : 'You’re the only one here right now'}</b>
          <small>{othersInCall.length ? othersInCall.map(participantLabel).join(', ') : 'Invite the channel and start a game together'}</small>
        </span>
        <button type="button" className="call-invite" onClick={async () => { if (await inviteToInstance()) setInvited(true); }}>{invited ? 'Invite sent!' : 'Invite to play'}</button>
      </div>}
      <div className="mode-tabs" aria-label="Game mode">
        <button aria-pressed={mode === 'online'} onClick={() => setMode('online')}>Find opponent<small style={{display:'block',marginTop:4}}>Rated when eligible</small></button>
        <button aria-pressed={mode === 'friends'} onClick={() => setMode('friends')}>With a friend<small style={{display:'block',marginTop:4}}>Rated when both sign in</small></button>
        <button aria-pressed={mode === 'practice'} onClick={() => setMode('practice')}>Practice vs AI<small style={{display:'block',marginTop:4}}>No rating changes</small></button>
      </div>
      {mode !== 'practice' && <fieldset className="clock-picker"><legend>Match clock</legend><div>
        {CHAOS_TIME_CONTROLS.map(c => <button key={c.label} aria-pressed={!props.unlimited && props.clockLabel === c.label} onClick={() => props.setClockLabel(c.label)}>{c.label}<small>{c.base / 60} min + {c.inc}s / move</small></button>)}
        <button aria-pressed={props.unlimited} onClick={() => props.setUnlimited(true)}>No rush<small>Casual · no rating</small></button>
      </div><p>Both clocks pause while picking powers.</p></fieldset>}
      <ChaosRatedStatus mode={mode} unlimited={props.unlimited} compact />
      {server && (server.games > 0 || server.top.length > 0) && <section className="server-standing" aria-label="This server">
        <span className="eyebrow">THIS SERVER · LAST 7 DAYS</span>
        <strong>{server.games} game{server.games === 1 ? '' : 's'} · {server.players} player{server.players === 1 ? '' : 's'}{server.rated ? ` · ${server.rated} rated` : ''}</strong>
        {server.top[0] && <p>Top of this server: {server.top[0].name} · {server.top[0].rating}</p>}
        {youHere && <p>You’re #{youHere.rank} here · {youHere.rating}</p>}
      </section>}
      {mode === 'online' ? <div className="activity-matchmaking">

        <div className="challenge-filters" aria-label="Find an opponent"><button aria-pressed={seekTab==='quick'} onClick={()=>setSeekTab('quick')}>Quick pairing</button><button aria-pressed={seekTab==='lobby'} onClick={()=>setSeekTab('lobby')}>Lobby · {rooms.length}</button></div>
        <div hidden={seekTab!=='quick'}>{props.matchmaking}</div>
        <section hidden={seekTab!=='lobby'} className="challenge-board" aria-labelledby="challenge-title">
          <div className="challenge-heading"><div><span className="eyebrow">THE LOBBY</span><h3 id="challenge-title">Open challenges</h3></div><span className="challenge-live">Live · {rooms.length}</span></div>
          <p>Pick a rival. Click their challenge to start.</p>
          <div className="challenge-filters" aria-label="Challenge filter"><button aria-pressed={challengeFilter==='all'} onClick={()=>setChallengeFilter('all')}>All clocks</button><button aria-pressed={challengeFilter==='clock'} onClick={()=>setChallengeFilter('clock')}>My clock · {props.unlimited?'No rush':props.clockLabel}</button></div>
          <div className="challenge-columns" aria-hidden="true"><span>Player / rating</span><span>Clock / mode</span><span /></div>
          {roomsError ? <p role="status">{roomsError}</p> : !roomsLoaded ? <p role="status">Looking for challengers…</p> : <>
            {rooms.filter(r=>challengeFilter==='all'||(props.unlimited?(r.timeControlSeconds??0)<=0:`${(r.timeControlSeconds??0)/60}+${r.incrementSeconds}`===props.clockLabel)).map(room=><button type="button" className="challenge-row" data-call={room.sameInstance?'true':undefined} key={room.roomCode} disabled={busy||(!room.yours&&rooms.some(r=>r.yours))} onClick={()=>void run(async()=>{
              if(room.yours){
                window.dispatchEvent(new Event('chaos-cancel-seek'));
                const response=await fetch('/api/chaos/matchmake',{method:'DELETE',headers:{'X-Guest-Id':getGuestId(),...chaosIdentityHeaders()},credentials:'include'});
                if(!response.ok)throw new Error('Could not cancel');
                setRooms(previous=>previous.filter(r=>!r.yours));
              } else await props.joinOpenRoom(room.roomCode);
            })} aria-label={`${room.yours?'Cancel your challenge':`Play ${room.name}`}, ${room.rating??'unrated'}, ${(room.timeControlSeconds??0)<=0?'No rush':`${room.timeControlSeconds!/60}+${room.incrementSeconds}`}${room.sameInstance?' in this call':''} `}>
              <span className="challenge-player"><strong>{room.yours?'You':room.name}</strong><small>{room.rating===null?'Unrated':`${room.rating}${room.games<10?'?':''}`}{room.yours?' · Seeking a game':''}</small></span>
              <span><strong>{(room.timeControlSeconds??0)<=0?'No rush':`${room.timeControlSeconds!/60}+${room.incrementSeconds}`}</strong><small>{!room.ratedEligible ? 'Casual' : account.isLoading ? 'Checking eligibility' : account.error ? 'Eligibility unavailable' : account.data?.player ? 'Rated eligible' : 'Casual · sign in for rated'}{room.sameInstance && <em className="call-flag"> · in this call</em>}</small></span><span className="challenge-arrow" aria-hidden="true">{room.yours?'Cancel':'↗'}</span>
            </button>)}
            {!rooms.some(r=>challengeFilter==='all'||(props.unlimited?(r.timeControlSeconds??0)<=0:`${(r.timeControlSeconds??0)/60}+${r.incrementSeconds}`===props.clockLabel))&&<div className="challenge-empty"><strong>No challengers{challengeFilter==='clock'?' on this clock':''} yet.</strong><p>Post a challenge with your selected clock. Other players can join you here.</p></div>}
          </>}
          <p className="challenge-note">Updates every 5 seconds. ? = provisional rating. Rated games require both players to sign in with FireChess or Discord and make a move.{rooms.some(r=>r.yours)?' Cancel your current search before choosing another challenge.':''}</p>
                  <button className="primary-action" onClick={()=>setSeekTab('quick')}>{rooms.some(r=>r.yours)?'Manage your search':'Find opponent / post challenge'}<span aria-hidden="true">↗</span></button>
        </section>
      </div> : mode === 'friends' ? <>
        <p className="panel-copy">Room codes play for rating too: both players must be signed in, the clock must be timed, and each must make a move. Only the first three games between the same two players each day count. No rush games are always casual.</p>
        <button className="primary-action" disabled={busy} onClick={() => run(() => props.createRoom('white'))}>{busy ? 'Connecting…' : 'Create friend match'}<span aria-hidden="true">↗</span></button>
        <div className="join-divider"><span>Already have a code?</span></div>
        <form className="join-form" onSubmit={e => { e.preventDefault(); if (props.joinCode.length === 6) void run(props.joinRoom); }}>
          <label className="sr-only" htmlFor="friend-code">Six-character room code</label>
          <input id="friend-code" placeholder="ABCDEF" value={props.joinCode} maxLength={6} autoComplete="off" spellCheck={false}
            onChange={e => props.setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} />
          <button disabled={busy || props.joinCode.length !== 6}>Join match</button>
        </form>
      </> : <>
        <p className="panel-copy">Try a few powers before your friends arrive. You can take your time.</p>
        <label className="field-label" htmlFor="ai-difficulty">YOUR OPPONENT</label>
        <select id="ai-difficulty" value={props.difficulty} onChange={e => props.setDifficulty(e.target.value as 'beginner' | 'easy' | 'medium' | 'hard')}>
          <option value="beginner">Beginner · learn the ropes</option><option value="easy">Easy · warm up</option><option value="medium">Medium · a fair challenge</option><option value="hard">Hard · bring your best</option>
        </select>
        <button className="primary-action" onClick={() => props.startPractice('white')}>Play as White <span aria-hidden="true">↗</span></button>
        <button className="secondary-action" onClick={() => props.startPractice('black')}>Play as Black</button>
      </>}
      {(props.error || localError) && <p className="connection-error" role="alert">{localError || props.error?.replace(/^❌\s*/, '')}</p>}
      <div className="panel-footer"><span aria-hidden="true">✦</span> New powers every 5 turns. Every match plays differently.</div>
    </section>
    <section className="lobby-destinations" aria-label="Explore Chaos Chess">
      <div className="destination-heading"><span className="eyebrow">AROUND THE ARENA</span><span>More ways to play along</span></div>
      <div className="arena-highlights"><ChaosWeekStrip
        className="mt-3 mb-3"
        replayBase="/watch?match="
        weekHref="/watch?tab=archive"
        weekLabel="All replays →"
      />
      <div id="achievements" tabIndex={-1}><ChaosAchievements /></div></div>
    </section>
  </main>;
}

export function ActivityDraft(props: ChaosDraftViewProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const card = props.choices.find(mod => mod.id === selected);
  useEffect(() => { dialog.current?.focus(); }, []);
  const locked = !!card && !!props.unlockedIds && !props.unlockedIds.has(card.id);
  return <div className="draft-backdrop" data-picked={props.picked}><div ref={dialog} tabIndex={-1} className="activity-draft modifier-draft" data-choice-count={props.choices.length} role="dialog" aria-modal="true" aria-labelledby="draft-heading"
    onKeyDown={e => {
      if (e.key !== 'Tab') return;
      const targets = Array.from(dialog.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') || []);
      const first = targets[0], last = targets.at(-1);
      if (!first || !last) { e.preventDefault(); return; }
      if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }}>
    <div className="draft-title"><div><span className="eyebrow">POWER PICK / {props.phase}</span><h2 id="draft-heading">Time to bend the rules.</h2><p>Choose one upgrade. It stays with you for the rest of the match.</p></div>
      {props.countdown !== null && <span className="draft-countdown" role="timer">{props.countdown}s</span>}
    </div>
    <div className="power-choices">{props.choices.map((mod,index) => <button key={mod.id} className="power-choice" data-tier={mod.tier} data-revealed={props.revealedCards.has(index)} aria-pressed={selected === mod.id}
      aria-label={props.revealedCards.has(index) ? `${mod.name}. ${mod.description}` : `Mystery power ${index+1}`}
      style={{animationDelay:`${index*100}ms`}} disabled={!props.ready || props.picked} onClick={() => { setSelected(mod.id); playSound('select'); }}>
      <div className="power-flipper"><div className="power-back" aria-hidden="true"><span>✦</span><strong>CHAOS</strong><small>EXPECT THE UNEXPECTED</small></div><div className="power-front" aria-hidden={!props.revealedCards.has(index)}>
      <PowerArt id={mod.id} piece={mod.piece || 'p'} />
      <div className="power-copy"><span className="power-tier">{mod.tier}{props.unlockedIds && !props.unlockedIds.has(mod.id) ? ' · preview' : ''}</span><h3>{mod.name}</h3><p>{mod.description}</p>{mod.warning && <small>{mod.warning}</small>}</div>
      <span className="selection-dot" aria-hidden="true">{selected === mod.id ? '✓' : '+'}</span>
      </div></div>
    </button>)}</div>
    <div className="draft-selected-detail" aria-live="polite">{card ? <><strong>{card.name}</strong><p>{card.description}</p>{card.warning && <small>{card.warning}</small>}</> : <p>Choose a card to read its power.</p>}</div>
    <div className="draft-footer"><p aria-live="polite">{props.picked ? 'Power selected. Back to the board…' : !props.ready ? 'Dealing your powers…' : card ? `${card.name}${locked ? ' · one-time preview' : ' · ready to draft'}` : 'Select a card to inspect it, then confirm.'}</p>
      <div>{props.onReroll && <button className="secondary-action" disabled={!card || props.picked} onClick={() => { if (card) { props.onReroll?.(card); setSelected(null); } }}>Reroll selected</button>}
      <button className="primary-action" disabled={!card || !props.ready || props.picked} onClick={() => { if (card) props.onPick(card, locked); }}>{locked ? 'Preview this power' : 'Take this power'} <span aria-hidden="true">↗</span></button></div>
    </div>
  </div></div>;
}

export function ActivityHud(props: ChaosHudProps) {
  return <aside className="activity-hud" aria-label="Match powers">
    <div className="arena-round"><span>ROUND <strong>{String(props.turn).padStart(2,'0')}</strong></span><div className="round-pips" aria-label={props.nextDraft ? `Next power at turn ${props.nextDraft}` : 'All powers drafted'}>{[5,10,15,20,25].map(n=><i key={n} data-done={props.turn>n} />)}</div><small>{props.nextDraft ? `POWER PICK AT TURN ${props.nextDraft}` : 'FULL POWER. MAKE IT COUNT.'}</small></div>
    {(['theirs','yours'] as const).map(side=><section key={side} className="power-loadout" data-side={side} aria-label={side==='yours'?'Your powers':'Opponent powers'}>
      <div className="loadout-heading"><h2>{side==='yours'?'Your powers':'Opponent powers'}</h2><span>{props[side].length}</span></div>
      <div className="stash-cards">{props[side].map(mod=><details key={mod.id} className="stash-card"><summary><PowerArt id={mod.id} piece={mod.piece || 'p'}/><span><small>{mod.tier}</small><strong>{mod.name}</strong></span><b>+</b></summary><p>{mod.description}</p>{mod.warning && <p>{mod.warning}</p>}</details>)}
      {!props[side].length && <p className="empty-loadout">No powers drafted yet.</p>}</div>
    </section>)}
    {props.anomalies.length>0 && <details className="match-history"><summary>Match anomalies</summary>{props.anomalies.map((a,i)=><p key={i}><strong>{a.name}</strong> · {a.description}</p>)}</details>}
    <details className="match-history"><summary>Match history <span>↗</span></summary><div>{props.moves.length ? props.moves.map((m,i)=><p key={i}>{m}</p>) : <p>Your opening move starts the story.</p>}{props.events.slice(-6).map((e,i)=><p key={`e${i}`}>{e}</p>)}</div></details>
  </aside>;
}

export function ActivityOpponentReveal({mod,phase,revealed,onDismiss}: ChaosOpponentRevealProps) {
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => { close.current?.focus(); }, []);
  return <div className="draft-backdrop opponent-reveal-backdrop" onClick={onDismiss}>
    <section className="activity-draft opponent-reveal" role="dialog" aria-modal="true" aria-labelledby="opponent-reveal-heading"
      onClick={e=>e.stopPropagation()} onKeyDown={e=>{if(e.key==='Escape')onDismiss(); if(e.key==='Tab'){e.preventDefault();close.current?.focus();}}}>
      <div className="draft-title"><div><span className="eyebrow">OPPONENT / POWER PICK {phase}</span><h2 id="opponent-reveal-heading">They’ve got a new trick.</h2><p>Watch their next move.</p></div></div>
      <div className="power-choice opponent-power-card" data-tier={mod.tier} data-revealed={revealed}>
        <div className="power-flipper"><div className="power-back" aria-hidden="true"><span>✦</span><strong>CHAOS</strong><small>EXPECT THE UNEXPECTED</small></div>
          <div className="power-front" aria-hidden={!revealed}><PowerArt id={mod.id} piece={mod.piece || 'p'} />
            <div className="power-copy"><span className="power-tier">{mod.tier}</span><h3>{mod.name}</h3><p>{mod.description}</p>{mod.warning && <small>{mod.warning}</small>}</div>
          </div>
        </div>
      </div>
      <button ref={close} className="primary-action" onClick={onDismiss}>Back to the board <span aria-hidden="true">↗</span></button>
    </section>
  </div>;
}

export function ActivityAnomalyPicker(props: {choices: AnomalyDefinition[]; revealed: boolean[]; selected: AnomalyDefinition | null; onSelect: (value: AnomalyDefinition)=>void; onPick: (value: AnomalyDefinition)=>void; onSkip: ()=>void; waiting: boolean; countdown: number | null}) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(()=>{root.current?.focus();},[]);
  const ready = props.revealed.every(Boolean);
  return <div className="draft-backdrop"><div ref={root} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="anomaly-title" className="activity-draft anomaly-draft" onKeyDown={e=>{
    if(e.key!=='Tab')return;
    const buttons=Array.from(root.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')||[]);
    const first=buttons[0],last=buttons.at(-1);
    if(!first||!last){e.preventDefault();return;}
    if(e.shiftKey&&(document.activeElement===first||document.activeElement===root.current)){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }}>
    <div className="draft-title"><div><span className="eyebrow">YOUR OPENING TWIST</span><h2 id="anomaly-title">Pick your kind of chaos.</h2><p>One match-long ability. Every choice is yours.</p></div>{props.countdown!==null&&!props.waiting&&<span className="draft-countdown" role="timer">{props.countdown}s</span>}</div>
    {props.waiting ? <div className="anomaly-wait" role="status"><img src="/activity/logo.svg" alt=""/><h3>Your opponent is choosing…</h3><p>Your anomaly is ready. The match starts when you both finish.</p></div> : <>
    <div className="power-choices">{props.choices.map((a,i)=><button key={a.id} className="power-choice" data-revealed={props.revealed[i]} aria-pressed={props.selected?.id===a.id} disabled={!ready} onClick={()=>{props.onSelect(a);playSound('select');}} aria-label={props.revealed[i]?`${a.name}. ${a.description}`:`Mystery anomaly ${i+1}`} style={{animationDelay:`${i*100}ms`}}>
      <div className="power-flipper"><div className="power-back" aria-hidden="true"><span>✦</span><strong>CHAOS</strong><small>A DIFFERENT OPENING</small></div><div className="power-front" aria-hidden={!props.revealed[i]}>
        <div className="anomaly-art" aria-hidden="true"><img src={`/activity/anomalies/${a.id}.webp`} width={640} height={640} alt="" draggable={false}/><span>{a.tarotRoman}</span></div>
        <div className="power-copy"><span className="power-tier">{a.trigger==='once-per-game'?'Once per match':'Match ability'}</span><h3>{a.name}</h3><p>{a.description}</p></div><span className="selection-dot" aria-hidden="true">{props.selected?.id===a.id?'✓':'+'}</span>
      </div></div></button>)}</div>
      <div className="draft-footer"><button className="secondary-action" onClick={props.onSkip}>Play without an anomaly</button><button className="primary-action" disabled={!ready||!props.selected} onClick={()=>{if(props.selected)props.onPick(props.selected);}}>Take this anomaly <span>↗</span></button></div>
    </>}
  </div></div>;
}
