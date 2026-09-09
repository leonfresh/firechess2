'use client';
import { useState } from 'react';
export function ChaosShareButton({matchId}:{matchId:string}) {
  const [open,setOpen]=useState(false), [status,setStatus]=useState('');
  const url=`https://chaos.firechess.com/share?match=${encodeURIComponent(matchId)}`;
  const image=`/api/chaos/share/image?match=${encodeURIComponent(matchId)}`;
  async function share() {
    try { if(navigator.share) await navigator.share({title:'Chaos Chess · Watch our match',url});
      else {await navigator.clipboard.writeText(url);setStatus('Replay link copied!');}
    } catch(e) {if(!(e instanceof DOMException && e.name==='AbortError'))setStatus('Sharing unavailable. Copy the link below.');}
  }
  async function download() {
    try {const r=await fetch(image);if(!r.ok)throw new Error();const blob=await r.blob();const href=URL.createObjectURL(blob);const a=document.createElement('a');a.href=href;a.download='chaos-chess-match.png';a.click();setTimeout(()=>URL.revokeObjectURL(href),10000);setStatus('Card downloaded.');}catch{setStatus('Could not download the card. Please try again.');}
  }
  return <div style={{width:'100%'}}><button className="secondary-action" onClick={()=>setOpen(!open)} aria-expanded={open}>Share this match ↗</button>{open&&<div style={{marginTop:12,display:'grid',gap:10}}><img src={image} alt="Your Chaos Chess match sharing card" style={{width:'100%',borderRadius:16}}/><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button className="secondary-action" onClick={share}>Share replay</button><button className="secondary-action" onClick={download}>Download card</button></div><input aria-label="Replay link" readOnly value={url} onFocus={e=>e.target.select()} style={{width:'100%',color:'#fff0c7',background:'#17283d',padding:10,borderRadius:8}}/><p role="status">{status}</p></div>}</div>;
}
