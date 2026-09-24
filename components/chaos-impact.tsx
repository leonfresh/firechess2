"use client";
import { useLayoutEffect, useRef, type CSSProperties } from "react";
import styles from "./chaos-impact.module.css";
export function ChaosImpact({mate=false,pieces=[],kind, column=3, row=3, showLabel=true}:{mate?:boolean;pieces?:string[];kind?:string;column?:number;row?:number;showLabel?:boolean}) {
  const burst = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const square = burst.current, text = label.current;
    if (!square || !text) return;
    const fit = () => {
      const size = square.getBoundingClientRect().width;
      if (!size) return;
      text.style.maxWidth = `${size * 8 - 16}px`;
      const width = text.offsetWidth;
      const minimum = 8 - column * size;
      const maximum = (8 - column) * size - width - 8;
      text.style.left = `${Math.max(minimum, Math.min((size - width) / 2, maximum))}px`;
      text.style.setProperty("--label-y", row < 2 ? "28px" : "-28px");
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(square);
    observer.observe(text);
    return () => observer.disconnect();
  }, [column, row, mate, kind]);
  // Revivals and summons rise instead of exploding: the piece fades up into place and motes drift upward.
  const rising = kind === 'revive' || kind === 'summon';
  const palette = kind === 'revive' ? ['#e9fff4','#8ff5c4','#46d6a6','#c9f9a7'] : kind === 'summon' ? ['#fff6d6','#f5d06a','#c6a0ff','#9d7bf2'] : ['#fff5cd','#ffd25e','#ff844b','#d9f77d'];
  return <div ref={burst} className={styles.burst} data-mate={mate} data-kind={kind} aria-hidden="true">
    <div className={styles.core}/><div className={styles.ring}/><div className={styles.ring}/>
    {rising && <div className={styles.pillar}/>}
    {pieces.map((piece,i)=><img key={i} className={rising ? styles.riser : styles.ghost} src={`/activity/pieces/${piece}.svg`} alt="" style={{"--side":i===0?-1:1} as CSSProperties}/>)}
    {Array.from({length:mate?28:16},(_,i)=>{
      const angle = rising ? -Math.PI/2 + ((i%8)-3.5)*0.22 : i*2.39996;
      const distance = mate ? 110+(i%4)*24 : rising ? 38+(i%5)*13 : 55+(i%4)*16;
      return <i key={i} className={styles.spark} style={{"--x":`${Math.round(Math.cos(angle)*distance)}px`,"--y":`${Math.round(Math.sin(angle)*distance)}px`,"--r":`${i*53}deg`,"--delay":`${rising?(i%6)*70:(i%4)*30}ms`,"--color":palette[i%4]} as CSSProperties}/>;})}
    {showLabel && <span ref={label} className={styles.label}>{mate?'CHECKMATE':kind==='nuclear'?'NUCLEAR!':kind==='sniper'?'PEW!':kind==='promotion'?'PROMOTED!':kind==='power'?'POWER UP!':kind==='revive'?'REVIVED!':kind==='summon'?'SUMMONED!':'BOOM!'}</span>}
  </div>;
}
