import type {CSSProperties} from 'react';
import {ChaosImpact} from './chaos-impact';
import type {WatchImpact} from '@/lib/chaos-impact';
import styles from './chaos-watch-effects.module.css';
export function WatchEffects({effects,flipped}:{effects:WatchImpact[];flipped:boolean}) {
 return <div className={styles.stage} aria-hidden="true">{effects.map((effect,i)=>{
 const file=effect.square.charCodeAt(0)-97,rank=Number(effect.square[1])-1;
 const big=['kamikaze','checkmate','nuclear','promotion','power'].includes(effect.kind);
 return <div key={i} className={styles.anchor} data-kind={effect.kind} style={{left:`${(flipped?7-file:file)*12.5}%`,top:`${(flipped?rank:7-rank)*12.5}%`, '--label-y':(flipped?rank:7-rank)===0?'28px':'-28px'} as CSSProperties}>
 {big?<ChaosImpact mate={effect.kind==='checkmate'} kind={effect.kind} pieces={effect.pieces}/>:<div className={styles.pulse}>{effect.kind==='check'?'!':effect.kind==='castle'?'♜':''}</div>}
 </div>;
 })}</div>;
}
