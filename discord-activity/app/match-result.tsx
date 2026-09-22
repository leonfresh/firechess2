'use client';
import { ChaosShareButton } from '@/components/chaos-share-button';
import { useEffect, useRef, useState } from 'react';
import { chaosIdentityHeaders } from '@/lib/chaos-client-identity';
import { getGuestId } from '@/lib/guest-id';
import type { ChaosResultProps } from '@/components/chaos-presentation';

export function ActivityResult(props: ChaosResultProps) {
  const [shareId,setShareId]=useState<string|null>(null);
  useEffect(()=>{
    const room=sessionStorage.getItem('chaos-active-room');
    if(props.practice||props.outcome==='aborted'||!room)return;
    let active=true;
    fetch(`/api/chaos/share?match=${encodeURIComponent(room)}`,{cache:'no-store'}).then(r=>r.ok?r.json():null).then(m=>{if(active&&m)setShareId(m.id);}).catch(()=>{});
    return()=>{active=false;};
  },[props.practice,props.outcome]);
  const aborted = props.outcome === 'aborted';
  const [revealed,setRevealed]=useState(false);
  useEffect(()=>{
    const timer=setTimeout(()=>setRevealed(true),2500);
    return()=>clearTimeout(timer);
  },[]);
  const [rating,setRating]=useState<{rated:boolean;before:number;delta:number}|null>(null);
  useEffect(()=>{
    const room=sessionStorage.getItem('chaos-active-room');
    if(props.practice||aborted||!room)return;
    const controller=new AbortController();
    fetch(`/api/chaos/career?room=${encodeURIComponent(room)}`,{headers:{'X-Guest-Id':getGuestId(),...chaosIdentityHeaders()},signal:controller.signal,cache:'no-store'})
      .then(async r=>r.ok?r.json():null).then(d=>{if(d)setRating(d.result);}).catch(()=>{});
    return()=>controller.abort();
  },[props.practice,aborted]);
  const dialog = useRef<HTMLDivElement>(null);
  const waiting = !props.practice && props.rematchRequested && !props.rematchReceived;
  /** Chain matches: ask for the next game automatically, with a few seconds to opt out. */
  const onRematchRef = useRef(props.onRematch);
  onRematchRef.current = props.onRematch;
  const [autoIn, setAutoIn] = useState<number | null>(null);
  const autoAsked = useRef(false);
  useEffect(() => {
    if (!revealed || props.practice || aborted || props.rematchRequested || autoAsked.current) return;
    autoAsked.current = true;
    setAutoIn(props.rematchReceived ? 3 : 6);
  }, [revealed, props.practice, aborted, props.rematchRequested, props.rematchReceived]);
  useEffect(() => {
    if (autoIn === null) return;
    if (autoIn <= 0) { onRematchRef.current(); setAutoIn(null); return; }
    const timer = setTimeout(() => setAutoIn(value => (value === null ? null : value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [autoIn]);
  const leave = () => { props.onCancelRematch?.(); props.onLobby(); };
  useEffect(() => {
    if(!revealed)return;
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.focus();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, [revealed]);
  const title = aborted ? 'Match aborted.' : props.outcome === 'win' ? 'Crowned in chaos!' : props.outcome === 'draw' ? 'Evenly matched.' : 'A royal upset.';
  if(!revealed)return <div className="match-finish-notice" role="status">{props.reason || 'Match finished'} · {aborted?'No rating change':props.outcome==='win'?'You win':props.outcome==='loss'?'Opponent wins':'Draw'}</div>;
  return <div className="draft-backdrop result-backdrop">
    <div className="activity-result" data-outcome={props.outcome} role="dialog" aria-modal="true" aria-labelledby="result-title" aria-describedby="result-reason" ref={dialog} tabIndex={-1}
      onKeyDown={event => {
        if (event.key !== 'Tab') return;
        const buttons = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, a[href]') ?? []);
        const first = buttons[0], last = buttons.at(-1);
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}>
      <span className="eyebrow">{aborted ? 'MATCH ABORTED' : 'MATCH COMPLETE'} · {props.practice ? 'PRACTICE' : rating?.rated ? 'RATED' : 'MULTIPLAYER'}</span>
      <div className="result-medallion" aria-hidden="true"><span>✦</span><img src={`/activity/pieces/${props.outcome === 'loss' ? 'b' : 'w'}K.svg`} alt="" /><span>✦</span></div>
      <span className="result-ribbon">{aborted ? 'NO CONTEST' : props.outcome === 'win' ? 'VICTORY' : props.outcome === 'draw' ? 'DRAW' : 'DEFEAT'}</span>
      <h2 id="result-title">{title}</h2>
      <p id="result-reason">{props.reason || 'Match finished'}</p>
      {rating?.rated && <p role="status">{rating.before} → <strong>{rating.before+rating.delta}</strong> ({rating.delta>=0?'+':''}{rating.delta})</p>}
      <p className="result-encouragement">{aborted ? 'No winner. No rating change. Find a new opponent.' : props.outcome === 'win' ? 'Keep the crown. Run it back.' : props.outcome === 'draw' ? 'One board. Two worthy rivals.' : 'New powers. A fresh chance at the crown.'}</p>
      <div className="result-stats"><div><strong>{props.turns}</strong><span>Moves played</span></div><div><strong>{props.powers.length}</strong><span>Powers drafted</span></div></div>
      {props.powers.length > 0 && <div className="result-loadout" aria-label="Your drafted powers">{props.powers.map(power => <span key={power.id} data-tier={power.tier}>{power.name}</span>)}</div>}
      <div className="result-actions"><p role="status">{autoIn !== null ? <>Next game starts in {autoIn}s · <button type="button" className="link-action" onClick={() => setAutoIn(null)}>not now</button></> : waiting ? 'Rematch requested. Waiting for your opponent…' : props.rematchReceived ? 'Your opponent wants another round!' : 'Ready for another round?'}</p>
        <button type="button" className="primary-action" disabled={waiting} onClick={props.onRematch}>{waiting ? 'Waiting for opponent…' : props.practice ? 'Play again' : props.rematchReceived ? 'Accept rematch' : autoIn !== null ? `Play again (${autoIn})` : 'Rematch'}<span aria-hidden="true">↗</span></button>
        {shareId && <ChaosShareButton
          matchId={shareId}
          baseUrl={typeof window === 'undefined' ? undefined : `${window.location.origin}/share?match=${encodeURIComponent(shareId)}`}
        />}
        {waiting && props.onCancelRematch && <button type="button" className="secondary-action" onClick={props.onCancelRematch}>Cancel request</button>}
        <button type="button" className="secondary-action" onClick={leave}>Back to lobby</button>
      </div>
    </div>
  </div>;
}
