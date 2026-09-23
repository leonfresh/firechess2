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
  return <div ref={burst} className={styles.burst} data-mate={mate} data-kind={kind} aria-hidden="true">
    <div className={styles.core}/><div className={styles.ring}/><div className={styles.ring}/>
    {pieces.map((piece,i)=><img key={i} className={styles.ghost} src={`/activity/pieces/${piece}.svg`} alt="" style={{"--side":i===0?-1:1} as CSSProperties}/>)}
    {Array.from({length:mate?28:16},(_,i)=>{const angle=i*2.39996; const distance=mate?110+(i%4)*24:55+(i%4)*16;return <i key={i} className={styles.spark} style={{"--x":`${Math.round(Math.cos(angle)*distance)}px`,"--y":`${Math.round(Math.sin(angle)*distance)}px`,"--r":`${i*53}deg`,"--delay":`${(i%4)*30}ms`,"--color":['#fff5cd','#ffd25e','#ff844b','#d9f77d'][i%4]} as CSSProperties}/>;})}
    {showLabel && <span ref={label} className={styles.label}>{mate?'CHECKMATE':kind==='nuclear'?'NUCLEAR!':kind==='sniper'?'PEW!':kind==='promotion'?'PROMOTED!':kind==='power'?'POWER UP!':'BOOM!'}</span>}
  </div>;
}
