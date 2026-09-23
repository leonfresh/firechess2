'use client';
import {AchievementShare} from './chaos-achievement-share';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {chaosIdentityHeaders} from '@/lib/chaos-client-identity';
import {useChaosAccount} from '@/lib/use-chaos-account';
import type {achievementProgress} from '@/lib/chaos-achievements';
import styles from './chaos-achievements.module.css';
type Achievement=NonNullable<ReturnType<typeof achievementProgress>>;
export function ChaosAchievements({replayBase='/watch?match='}:{replayBase?:string}){
 const account=useChaosAccount();
 const [expanded,setExpanded]=useState(false);
 const id=account.data?.player?.id;
 const [items,setItems]=useState<Achievement[]>([]),[error,setError]=useState(false),[loading,setLoading]=useState(true),[revision,setRevision]=useState(0);
 useEffect(()=>{
  setItems([]);setError(false);if(!id)return;
  const controller=new AbortController();setLoading(true);
  fetch('/api/chaos/achievements',{headers:chaosIdentityHeaders(),credentials:'include',cache:'no-store',signal:controller.signal}).then(async r=>{if(!r.ok)throw Error();return r.json();}).then(d=>{if(!controller.signal.aborted){setItems(d.achievements);setLoading(false);}}).catch(()=>{if(!controller.signal.aborted){setError(true);setLoading(false);}});
  return()=>controller.abort();
 },[id,revision]);
 if(!id)return null;
 const earned=items.filter(a=>a.unlocked).length;
 return <section className={styles.section} aria-labelledby="chaos-achievements-title">
  <header><div><small>YOUR TROPHY CABINET</small><h2 id="chaos-achievements-title">Achievements</h2></div>{items.length>0&&<span>{earned} / {items.length} earned</span>}</header>
  <p>Little trophies for big trouble. Earned in multiplayer, kept forever.</p>
  {loading?<p role="status">Opening your trophy cabinet…</p>:error?<div role="status">Couldn’t load your achievements. <button onClick={()=>setRevision(n=>n+1)}>Try again</button></div>:<div className={styles.grid}>{(expanded?items:items.slice(0,2)).map(a=><article key={a.id} className={styles.badge} data-earned={a.unlocked} data-tier={a.tier}>
    <img src={`/activity/achievements/${a.art}.webp`} alt="" width={96} height={96} loading="lazy"/>
    <div className={styles.badgeContent}><span className={styles.tier}>{a.tier}</span><small>{a.unlocked?'✓ EARNED':'TO UNLOCK'}</small><h3>{a.name}</h3><p>{a.description}</p>
    {a.unlocked?<><span className={styles.date}>{a.earnedAt?new Date(a.earnedAt).toLocaleDateString():''}</span>{a.match&&<Link href={`${replayBase}${encodeURIComponent(a.match)}`}>Watch the moment ↗</Link>}</>:<><progress value={a.progress} max={a.target} aria-label={`${a.name}: ${a.progress} of ${a.target}`}/><span className={styles.date}>{a.progress} / {a.target}</span></>}
    </div>
    {a.unlocked && a.match && <AchievementShare id={a.id} match={a.match}/>}
  </article>)}</div>}
  {!loading && !error && items.length>2 && <button className={styles.more} aria-expanded={expanded} onClick={()=>setExpanded(v=>!v)}>{expanded?"Show less":"View all achievements"} <span aria-hidden="true">{expanded?"↑":"↓"}</span></button>}
 </section>;
}
