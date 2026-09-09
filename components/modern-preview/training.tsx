"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Brain, Clock3, Crosshair, Flag, Layers3, Target, Zap } from "lucide-react";
import { PreviewHeader } from "./shared";
import s from "./modern.module.css";

const MODES = [
  {id:"weakness",title:"Train your weak spots",category:"From your games",icon:Target,text:"Work on tactical themes found in your saved reports.",tag:"Tactics report"},
  {id:"blunder",title:"Find the move you missed",category:"From your games",icon:Crosshair,text:"Return to a mistake from your own game and find the better move.",tag:"Saved positions"},
  {id:"opening",title:"Make your openings stick",category:"From your games",icon:BookOpen,text:"Practice recurring opening positions and the lines in your repertoire.",tag:"Report or repertoire"},
  {id:"endgame",title:"Convert the advantage",category:"From your games",icon:Flag,text:"Focus on the endgame types that need your attention.",tag:"Endgame report"},
  {id:"time",title:"Think clearly under pressure",category:"From your games",icon:Clock3,text:"Revisit rushed decisions and practice choosing when to spend time.",tag:"Clock data"},
  {id:"speed",title:"Build faster recognition",category:"Quick practice",icon:Zap,text:"A timed puzzle session to sharpen your pattern recognition.",tag:"3 or 5 minutes"},
  {id:"quiz",title:"Test your chess knowledge",category:"Quick practice",icon:Brain,text:"Challenge your understanding of chess ideas with the daily quiz.",tag:"Daily questions"},
  {id:"memory",title:"See the whole board",category:"Quick practice",icon:Layers3,text:"Study a position, then put your board memory to the test.",tag:"Visual memory"},
];

export function ModernTraining() {
  const [filter,setFilter] = useState("All training");
  return <div className={s.root}><PreviewHeader /><div className={s.dashboardContainer}>
    <header className={s.dashboardHeading}><div><span className={s.eyebrow}>TURN INSIGHT INTO INSTINCT</span><h1>A little practice.<br />A stronger next game.</h1><p>Choose one skill and give it your attention.</p></div><Link className={s.secondaryButton} href="/newdashboard">Your reports <ArrowRight size={16} /></Link></header>
    <section className={s.trainingHero}><div><span className={s.eyebrow}>START WITH YOUR OWN CHESS</span><h2>Your mistakes make<br />the best practice material.</h2><p>Open a report, choose a finding and use Practice to try the move yourself. Your completed positions are remembered on this device.</p><div className={s.arrowLegend}><Link className={s.primaryButton} href="/newdashboard">Resume from a report <ArrowRight size={16} /></Link><Link className={s.textLink} href="/report/8c8d499e-1f04-4121-aabc-71a818b98ce6">Try a sample position →</Link></div></div><div className={s.trainingSteps}>{["Find a recurring idea","Try the move yourself","Replay the engine’s continuation"].map((text,index)=><div key={text}><b>0{index+1}</b><span>{text}</span></div>)}</div></section>
    <div className={s.reportSectionTitle}><div><span className={s.eyebrow}>CHOOSE YOUR FOCUS</span><h2>What would you like to work on?</h2></div></div>
    <div className={s.filterBar} aria-label="Training categories">{["All training","From your games","Quick practice"].map(value=><button key={value} aria-pressed={filter===value} onClick={()=>setFilter(value)}>{value}</button>)}</div>
    <div className={s.trainingGrid}>{MODES.filter(mode=>filter==="All training"||mode.category===filter).map(mode=><article key={mode.id}><div className={s.trainingCardTop}><span className={s.featureIcon}><mode.icon size={24} /></span><span>{mode.tag}</span></div><h3>{mode.title}</h3><p>{mode.text}</p><Link className={s.textLink} href={`/train#training-mode-${mode.id}`}>Open this training mode <ArrowRight size={16} /></Link></article>)}</div>
    <div className={s.accessNote}><BookOpen size={19} /><p>Training from your games needs the relevant saved report or repertoire. The trainer checks what is available before you start.</p><Link href="/#scan">Scan your games →</Link></div>
    <section className={s.faqSection}><div><span className={s.eyebrow}>A ROUTINE YOU CAN REPEAT</span><h2>One idea is enough.</h2><p>Pick a position. Understand the reply. Come back to it later.</p></div><div className={s.faqList}><details><summary>Do I need to scan first?<span>+</span></summary><p>Personalized drills use your saved reports or repertoire. Quick practice offers other ways to train; the trainer shows any access requirements.</p></details><details><summary>Can I explore other moves?<span>+</span></summary><p>Yes. In the report’s Review mode you can move pieces freely through legal continuations. Explain this move adds animated engine lines.</p></details></div></section>
  </div></div>;
}
