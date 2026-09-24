"use client";
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactElement } from "react";
import { pieceMotion, type PieceMotion } from "@/lib/chaos-piece-motion";
import styles from "./chaos-piece-motion.module.css";
type Renderers = Record<string, (props: {squareWidth: number; square?: string}) => ReactElement>;
type Snapshot = {fen: string; orientation: string; pieces?: Renderers};
export function usePieceMotion(fen: string, orientation: string, enabled: boolean, pieces?: Renderers, dropped?: {from: string; to: string; at: number} | null) {
  const previous = useRef<Snapshot | null>(null);
  const [motion, setMotion] = useState<{plan: PieceMotion; pieces?: Renderers; serial: number} | null>(null);
  const serial = useRef(0);
  useLayoutEffect(() => {
    const old = previous.current;
    previous.current = {fen, orientation, pieces};
    setMotion(null);
    if (!enabled || !old || old.orientation !== orientation || document.visibilityState !== "visible" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const plan = pieceMotion(old.fen, fen);
    if (!plan) return;
    if (dropped && Date.now() - dropped.at < 1000) {
      plan.moves = plan.moves.map(move => move.from === dropped.from && move.to === dropped.to ? {...move, dropped: true, hop: false} : move);
    }
    setMotion({plan, pieces: old.pieces, serial: ++serial.current});
    const timer = setTimeout(() => setMotion(null), 600);
    return () => clearTimeout(timer);
    // Only board transitions trigger or cancel motion, not hover/selection renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, orientation]);
  useLayoutEffect(() => {
    if (previous.current?.fen === fen) previous.current.pieces = pieces;
  }, [fen, pieces]);
  return motion;
}
export function PieceMotionLayer({motion, width, orientation}: {motion: NonNullable<ReturnType<typeof usePieceMotion>>; width: number; orientation: string}) {
  const point = (square: string) => {const x = square.charCodeAt(0)-97, y = 8-Number(square[1]); return orientation === "black" ? [7-x,7-y] : [x,y];};
  const art = (code: string, square: string) => motion.pieces?.[code]?.({squareWidth:width/8,square}) ?? <img src={`/activity/pieces/${code}.svg`} alt=""/>;
  return <div className={styles.layer} aria-hidden="true" data-piece-motion>
    {motion.plan.moves.map(move => {const [x,y]=point(move.to),[sx,sy]=point(move.dropped ? move.to : move.from);return <div key={move.from} className={styles.travel} style={{left:`${x*12.5}%`,top:`${y*12.5}%`,"--dx":`${(sx-x)*100}%`,"--dy":`${(sy-y)*100}%`} as CSSProperties}>
      <div className={styles.shadow}/><div className={move.hop?styles.hop:styles.glide}>{art(move.code,move.from)}</div>
      <div className={styles.landing}/>
    </div>;})}
    {motion.plan.victims.map(victim => {const [x,y]=point(victim.square);return <div key={victim.square} className={styles.victim} style={{left:`${x*12.5}%`,top:`${y*12.5}%`}}>
      <div className={styles.tumble}>{art(victim.code,victim.square)}</div><div className={styles.hit}/>
      {[0,1,2,3,4,5].map(i=><i key={i} className={styles.chip} style={{"--angle":`${i*60}deg`} as CSSProperties}/>)}
    </div>;})}
  </div>;
}
