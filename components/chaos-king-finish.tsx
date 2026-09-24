'use client';
import {useEffect, type CSSProperties, type ReactElement} from 'react';
import {kingFinishPieces,type KingFinish} from '@/lib/chaos-king-finish';
import {playSound} from '@/lib/sounds';
import styles from './chaos-king-finish.module.css';
export function KingFinishLayer({capture,fen,width,flipped,boardId,renderers}:{capture:KingFinish;fen:string;width:number;flipped:boolean;boardId:string;renderers?:Record<string,(p:{squareWidth:number;square?:string})=>ReactElement>}){
 const pieces=kingFinishPieces(fen,capture);
 useEffect(()=>{if(pieces && document.visibilityState==='visible')playSound('chaos-mate');},[fen,capture.from,capture.to]);
 if(!pieces)return null;
 const size=width/8;
 const point=(s:string)=>{const x=s.charCodeAt(0)-97,y=8-Number(s[1]);return {x:(flipped?7-x:x)*size,y:(flipped?7-y:y)*size};};
 const from=point(capture.from),to=point(capture.to);
 const art=(code:string,square:string)=>renderers?.[code]?.({squareWidth:size,square})??<img src={`/activity/pieces/${code}.svg`} alt=""/>;
 return <div className={styles.layer} aria-label={`King captured: ${capture.from} to ${capture.to}`}>
  <style>{`[data-motion-board="${boardId}"] [data-square="${capture.to}"] [data-piece]${!capture.pieceStays?`,[data-motion-board="${boardId}"] [data-square="${capture.from}"] [data-piece]`:''}{visibility:hidden!important}`}</style>
  <svg className={styles.trail} viewBox={`0 0 ${width} ${width}`} aria-hidden="true"><path d={`M${from.x+size/2} ${from.y+size/2} L${to.x+size/2} ${to.y+size/2}`} stroke="#ffe384" strokeWidth={size*.09} strokeLinecap="round" strokeDasharray={capture.pieceStays?'8 7':undefined}/></svg>
  <div className={styles.victim} style={{left:to.x,top:to.y,width:size,height:size}}>{art(pieces.king,capture.to)}</div>
  {!capture.pieceStays && <div className={styles.attacker} style={{left:0,top:0,width:size,height:size,'--fx':`${from.x}px`,'--fy':`${from.y}px`,'--tx':`${to.x}px`,'--ty':`${to.y}px`} as CSSProperties}>{art(pieces.mover,capture.from)}</div>}
  <div className={styles.burst} style={{left:to.x+size/2,top:to.y+size/2}}>{Array.from({length:20},(_,i)=><i key={i} style={{'--dx':`${Math.cos(i*2.4)*(45+i%4*15)}px`,'--dy':`${Math.sin(i*2.4)*(45+i%4*15)}px`} as CSSProperties}/>)}</div>
  <div className={styles.caption}><b>KING CAPTURED</b><span>{capture.from} → {capture.to}{capture.pieceStays?' · ranged capture':''}</span></div>
 </div>;
}
