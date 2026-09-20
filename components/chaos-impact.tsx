import type { CSSProperties } from "react";
import styles from "./chaos-impact.module.css";
export function ChaosImpact({mate=false,pieces=[]}:{mate?:boolean;pieces?:string[]}) {
  return <div className={styles.burst} data-mate={mate} aria-hidden="true">
    <div className={styles.core}/><div className={styles.ring}/><div className={styles.ring}/>
    {pieces.map((piece,i)=><img key={i} className={styles.ghost} src={`/activity/pieces/${piece}.svg`} alt="" style={{"--side":i===0?-1:1} as CSSProperties}/>)}
    {Array.from({length:mate?28:16},(_,i)=>{const angle=i*2.39996; const distance=mate?110+(i%4)*24:55+(i%4)*16;return <i key={i} className={styles.spark} style={{"--x":`${Math.round(Math.cos(angle)*distance)}px`,"--y":`${Math.round(Math.sin(angle)*distance)}px`,"--r":`${i*53}deg`,"--delay":`${(i%4)*30}ms`,"--color":['#fff5cd','#ffd25e','#ff844b','#d9f77d'][i%4]} as CSSProperties}/>;})}
    <span className={styles.label}>{mate?'CHECKMATE':'BOOM!'}</span>
  </div>;
}
