"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Crosshair, Flame, Pause, Play, Sparkles } from "lucide-react";
import { PreviewBoard } from "./shared";
import { HERO_FEN } from "./sample-data";
import s from "./modern.module.css";

const slides = [
  { tab: "Your patterns", label: "OPENING HABIT", title: "A safer king. A better middlegame.", text: "Spot the moments to castle before starting your attack.", link: "Explore the position", href: "/report/8c8d499e-1f04-4121-aabc-71a818b98ce6" },
  { tab: "Your strengths", label: "THE WHOLE PICTURE", title: "Know your strengths. Find your focus.", text: "See how openings, tactics and endgames fit together—and where to spend your next practice session.", link: "Explore a report", href: "/report/8c8d499e-1f04-4121-aabc-71a818b98ce6" },
  { tab: "Your progress", label: "BUILD OVER TIME", title: "Small improvements. A clearer direction.", text: "Follow your progress as you practice. This example rating climb illustrates the journey; results vary.", link: "Explore the dashboard", href: "/newdashboard?demo=1" },
];
const point = (i: number, value: number) => {
  const angle = i * Math.PI * 2 / 5 - Math.PI / 2;
  return `${150 + Math.cos(angle) * 92 * value},${145 + Math.sin(angle) * 92 * value}`;
};

function Radar() {
  return <svg viewBox="0 0 300 300" role="img" aria-label="Illustrative strengths radar: openings 60, tactics 85, endgames 55, clock 70, positional play 75 out of 100">
    {[.25,.5,.75,1].map(v => <polygon key={v} points={Array.from({length:5},(_,i)=>point(i,v)).join(" ")} fill="none" stroke="#354157" />)}
    {[0,1,2,3,4].map(i=><line key={i} x1="150" y1="145" x2={point(i,1).split(',')[0]} y2={point(i,1).split(',')[1]} stroke="#354157" />)}
    <polygon points={[.6,.85,.55,.7,.75].map((v,i)=>point(i,v)).join(" ")} fill="#63d5a22b" stroke="#63d5a2" strokeWidth="3" />
    {[["Openings",150,30],["Tactics",258,119],["Endgames",218,252],["Clock",80,252],["Positional",43,119]].map(([label,x,y])=><text key={label} x={x} y={y} textAnchor="middle" fill="#c5d1e2" fontSize="12">{label}</text>)}
    <text x="150" y="285" textAnchor="middle" fill="#8798b0" fontSize="11">Illustrative profile</text>
  </svg>;
}
function Rating() {
  return <svg viewBox="0 0 300 300" role="img" aria-label="Illustrative rating trend rising from 1200 to 1380 over six months, with fluctuations; not a prediction">
    <text x="24" y="30" fill="#b0bdd0" fontSize="12">EXAMPLE RATING JOURNEY</text><text x="24" y="67" fill="#f8faff" fontSize="30" fontWeight="700">1,380</text><text x="125" y="65" fill="#63d5a2" fontSize="13">+180 over 6 months</text>
    {[110,155,200,245].map(y=><line key={y} x1="24" x2="279" y1={y} y2={y} stroke="#354157" strokeDasharray="4 5"/>)}
    <path d="M24 231 L49 220 L75 226 L100 198 L125 184 L151 191 L177 151 L202 155 L228 122 L254 128 L277 97 L277 245 L24 245Z" fill="#ff793818" />
    <path d="M24 231 L49 220 L75 226 L100 198 L125 184 L151 191 L177 151 L202 155 L228 122 L254 128 L277 97" fill="none" stroke="#ff9b66" strokeWidth="3" strokeLinejoin="round"/><circle cx="277" cy="97" r="5" fill="#63d5a2"/>
    <text x="24" y="266" fill="#8798b0" fontSize="11">Month 1</text><text x="279" y="266" textAnchor="end" fill="#8798b0" fontSize="11">Month 6</text><text x="150" y="288" textAnchor="middle" fill="#8798b0" fontSize="10">Illustration · not a guaranteed result</text>
  </svg>;
}
export function ProductPreview() {
  const [active,setActive] = useState(0);
  const [paused,setPaused] = useState(false);
  const [interacting,setInteracting] = useState(false);
  const [reduced,setReduced] = useState(true);
  useEffect(()=>{const media=window.matchMedia("(prefers-reduced-motion: reduce)");const update=()=>setReduced(media.matches);update();media.addEventListener("change",update);return()=>media.removeEventListener("change",update);},[]);
  useEffect(()=>{if(paused||interacting||reduced)return;const timer=window.setInterval(()=>{if(document.visibilityState==="visible")setActive(v=>(v+1)%slides.length);},6500);return()=>window.clearInterval(timer);},[paused,interacting,reduced,active]);
  const slide=slides[active];
  return <section className={s.productStage} aria-label="Product preview slideshow" aria-roledescription="carousel" onMouseEnter={()=>setInteracting(true)} onMouseLeave={e=>setInteracting(e.currentTarget.contains(document.activeElement))} onFocusCapture={()=>setInteracting(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))setInteracting(false);}}>
    <div className={s.productCard}>
      <div className={s.productTop}><span><Flame size={15}/> YOUR GAME, UNDERSTOOD</span><span className={s.sampleLabel}>Sample insights</span></div>
      <div className={s.productHeading}><div><span className={s.eyebrow}>THE BIGGER PICTURE</span><h2>Small patterns.<br/>Big opportunities.</h2></div><span className={s.roundIcon}><Crosshair size={23}/></span></div>
      <div className={s.productTabs}>{slides.map((item,i)=><button key={item.tab} aria-pressed={active===i} onClick={()=>{setActive(i);setPaused(true);}}>{item.tab}</button>)}</div>
      <div className={`${s.previewBoardRow} ${s.heroSlide}`} key={active} role="group" aria-roledescription="slide" aria-label={`${active+1} of 3: ${slide.tab}`}>
        <div className={s.heroGraphic}>{active===0?<PreviewBoard id="modern-hero" position={HERO_FEN} showBoardNotation={false} customArrows={[["e1","g1","#ff9b6688"]]}/>:active===1?<Radar/>:<Rating/>}</div>
        <div className={s.previewInsight}><span className={s.eyebrow}>{slide.label}</span><h3>{slide.title}</h3><p>{slide.text}</p><Link href={slide.href}>{slide.link} <ArrowUpRight size={15}/></Link></div>
      </div>
      <div className={s.previewCardFooter}><span><span className={s.greenDot}/> {active===0?"Insights from your own games":"Illustrative preview"}</span><div className={s.slideControls}><span>{active+1} / 3</span>{!reduced&&<button aria-label={paused?"Play slideshow":"Pause slideshow"} onClick={()=>setPaused(v=>!v)}>{paused?<Play size={15}/>:<Pause size={15}/>}</button>}<button aria-label="Next preview" onClick={()=>{setActive(v=>(v+1)%slides.length);setPaused(true);}}><ArrowRight size={18}/></button></div></div>
    </div>
    <div className={s.floatingInsight}><span className={s.floatingIcon}><Sparkles size={18}/></span><div><strong>Don’t just find it. Fix it.</strong><span>Every pattern has a next step.</span></div><Check size={18} className={s.green}/></div>
  </section>;
}
