'use client';
import {useEffect, useRef, useState} from 'react';
import {ChaosNavLink} from '@/components/chaos-nav-link';
import {useChaosAccount} from '@/lib/use-chaos-account';
import {ActivityCareer} from './career';
import {ActivityCollection} from './collection';
import {ChaosAchievements} from '@/components/chaos-achievements';
import {useActivityDialog} from './use-activity-dialog';

export function ExploreNav(){
  const [open,setOpen]=useState(false);
  const [trophies,setTrophies]=useState(false);
  const trophyDialog=useActivityDialog(trophies,()=>setTrophies(false));
  const root=useRef<HTMLDivElement>(null), trigger=useRef<HTMLButtonElement>(null);
  const career=useRef<HTMLButtonElement>(null),collection=useRef<HTMLButtonElement>(null);
  const account=useChaosAccount();
  useEffect(()=>{
    if(!open)return;
    function outside(e:PointerEvent){if(!root.current?.contains(e.target as Node))setOpen(false);}
    function escape(e:KeyboardEvent){if(e.key==='Escape'){setOpen(false);trigger.current?.focus();}}
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
    return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
  },[open]);
  return <>
    <div className="explore-nav" ref={root} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setOpen(false);}}>
      <button ref={trigger} className="sound-button explore-trigger" aria-expanded={open} aria-controls="explore-links" onClick={()=>setOpen(v=>!v)}>Explore <span aria-hidden="true">{open?'▴':'▾'}</span></button>
      {open && <nav id="explore-links" className="explore-menu" aria-label="Explore Chaos Chess">
        <span className="eyebrow">AROUND THE ARENA</span>
        <ChaosNavLink href="/shop" onClick={()=>setOpen(false)}>Power shop <small>Find your next trick</small></ChaosNavLink>
        <button onClick={()=>{setOpen(false);trigger.current?.focus();collection.current?.click();}}>Collection <small>Every power and piece</small></button>
        <button onClick={()=>{setOpen(false);trigger.current?.focus();career.current?.click();}}>Leaderboard <small>See who’s on top</small></button>
        <ChaosNavLink href="/watch" onClick={()=>setOpen(false)}>Watch live <small>Drop into a match</small></ChaosNavLink>
        <ChaosNavLink href="/watch?tab=archive" onClick={()=>setOpen(false)}>Replays <small>Relive the chaos</small></ChaosNavLink>
        {account.data?.player && <button onClick={()=>{setOpen(false);const section=document.getElementById('achievements');if(section){section.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});section.focus({preventScroll:true});}else{trigger.current?.focus();setTrophies(true);}}}>Achievements <small>Your trophy cabinet</small></button>}
        <a href="https://discord.gg/YS8fc4FtEk" target="_blank" rel="noopener noreferrer" onClick={()=>setOpen(false)}>Discord community ↗</a>
      </nav>}
    </div>
    <dialog ref={trophyDialog.ref} className="career-dialog" aria-label="Achievements" onClick={trophyDialog.onBackdropClick}><button className="sound-button" onClick={()=>setTrophies(false)}>Close achievements ×</button>{trophies && <ChaosAchievements/>}</dialog>
    <ActivityCareer triggerRef={career}/><ActivityCollection triggerRef={collection}/>
  </>;
}
