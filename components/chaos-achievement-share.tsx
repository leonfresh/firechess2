'use client';
import {useState} from 'react';
import {achievementShare} from '@/lib/chaos-achievements';
import styles from './chaos-achievements.module.css';
export function AchievementShare({id,match}:{id:string;match:string}){
 const [status,setStatus]=useState(''),[busy,setBusy]=useState(false);
 const share=achievementShare(id,match);if(!share)return null;
 async function copy(){try{await navigator.clipboard.writeText(`${share!.text}\n${share!.url}`);setStatus('Post text and replay link copied.');}catch{setStatus('Select and copy the link below.');}}
 async function nativeShare(){try{if(navigator.share)await navigator.share({title:share!.title,text:share!.text,url:share!.url});else await copy();}catch(e){if(!(e instanceof DOMException && e.name==='AbortError'))setStatus('Use Copy post or one of the buttons below.');}}
 async function download(){setBusy(true);try{const r=await fetch(share!.image);if(!r.ok)throw Error();const blob=await r.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`chaos-chess-${id}.png`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);setStatus('Trophy card downloaded. Attach it to your post.');}catch{setStatus('Could not download the card. Try again.');}finally{setBusy(false);}}
 return <details className={styles.share}><summary>Share achievement ↗</summary>
  <img className={styles.sharePreview} src={share.image} alt="Achievement share card" width={1200} height={630} loading="lazy"/>
  <div className={styles.shareButtons}>{[['Reddit',share.reddit],['X / Twitter',share.x],['Facebook',share.facebook]].map(([label,url])=><a key={label} href={url} target="_blank" rel="noopener noreferrer" aria-label={`Share achievement on ${label} (opens a new tab)`}>{label}</a>)}
  <button type="button" onClick={nativeShare}>More apps</button><button type="button" onClick={copy}>Copy post</button><button type="button" disabled={busy} onClick={download}>{busy?'Preparing…':'Download card'}</button></div>
  <input aria-label="Public achievement replay link" value={share.url} readOnly onFocus={e=>e.currentTarget.select()}/>
  <p role="status">{status || 'Choose where to share, then review your post.'}</p>
 </details>;
}
