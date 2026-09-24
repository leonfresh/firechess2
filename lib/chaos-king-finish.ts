import {Chess, type Square} from 'chess.js';
export type KingFinish = {from:string;to:string;pieceStays?:boolean};
/** Validate a presentation-only terminal capture; never change the saved engine board. */
export function kingFinishPieces(fen:string, capture:KingFinish) {
 if(!/^[a-h][1-8]$/.test(capture.from)||!/^[a-h][1-8]$/.test(capture.to))return null;
 try{const board=new Chess(fen),mover=board.get(capture.from as Square),king=board.get(capture.to as Square);
 if(!mover||king?.type!=='k'||king.color===mover.color)return null;
 return {mover:`${mover.color}${mover.type.toUpperCase()}`,king:`${king.color}K`};
 }catch{return null;}
}
