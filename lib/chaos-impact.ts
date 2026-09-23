import { Chess } from "chess.js";
import { ALL_MODIFIERS } from "./chaos-chess";
/** A mutual kill removes exactly the victim and attacker, and adds no piece. */
export function kamikazeImpact(before: string, after: string, armed: {w:boolean;b:boolean}) {
  if (before === after || (!armed.w && !armed.b)) return null;
  let old: Chess, next: Chess;
  try { old = new Chess(before); next = new Chess(after); } catch { return null; }
  const removed = old.board().flat().filter(p => p && (!next.get(p.square) || next.get(p.square)?.type !== p.type || next.get(p.square)?.color !== p.color));
  const added = next.board().flat().some(p => p && (!old.get(p.square) || old.get(p.square)?.type !== p.type || old.get(p.square)?.color !== p.color));
  if (added || removed.length !== 2) return null;
  const victim = removed.find(p => p?.type === "b" && armed[p.color]);
  const attacker = removed.find(p => p && p.color !== victim?.color);
  if (!victim || !attacker) return null;
  // Both bishops can be armed: the side whose turn just ended is the attacker.
  const target = removed.find(p => p?.type === "b" && armed[p.color] && p.color !== old.turn());
  const mover = removed.find(p => p?.color === old.turn());
  if (!target || !mover) return null;
  return {square:target.square, pieces:[`${target.color}B`, `${mover.color}${mover.type.toUpperCase()}`]};
}

/** A sniper shot leaves the shooter where it stood and removes exactly one enemy piece,
 *  adding nothing anywhere else. That signature separates it from a normal capture (which
 *  also relocates the attacker) and from the mutual kamikaze kill (two pieces removed). */
export function sniperImpact(before: string, after: string, armed: {w:boolean;b:boolean}) {
  if (before === after || (!armed.w && !armed.b)) return null;
  let old: Chess, next: Chess;
  try { old = new Chess(before); next = new Chess(after); } catch { return null; }
  const removed = old.board().flat().filter(p => p && (!next.get(p.square) || next.get(p.square)?.type !== p.type || next.get(p.square)?.color !== p.color));
  const added = next.board().flat().some(p => p && (!old.get(p.square) || old.get(p.square)?.type !== p.type || old.get(p.square)?.color !== p.color));
  if (added || removed.length !== 1) return null;
  const victim = removed[0];
  if (!victim) return null;
  // The shooter just moved, so the armed bishop belongs to the victim's opponent.
  const shooter = victim.color === "w" ? "b" : "w";
  if (!armed[shooter]) return null;
  return {square:victim.square, pieces:[`${victim.color}${victim.type.toUpperCase()}`]};
}

export type WatchImpact = {kind:"kamikaze"|"sniper"|"checkmate"|"nuclear"|"promotion"|"castle"|"capture"|"check"|"power";square:string;pieces?:string[]};
type Frame = {fen:string;from?:string;to?:string;state:{white:string[];black:string[];assignedSquares?:Record<string,string|null>;playerNuclearCooldownUntil?:number;aiNuclearCooldownUntil?:number}};
export function watchTransition(before:Frame, after:Frame, result?:{winner:string;reason:string}|null): {effects:WatchImpact[];sound:"chaos-mate"|"chaos-blast"|"chaos-pew"|"capture"|"check"|"move"|"correct"|"select"|null} {
 const effects:WatchImpact[]=[];
 let old:Chess,next:Chess;
 try {old=new Chess(before.fen);next=new Chess(after.fen);} catch{return {effects,sound:null};}
 const mate=result && /checkmate/i.test(result.reason) && ['white','black'].includes(result.winner);
 if(mate){const king=next.board().flat().find(p=>p?.type==='k'&&p.color===(result.winner==='white'?'b':'w'));if(king)effects.push({kind:'checkmate',square:king.square});}
 const ply=(g:Chess)=>(g.moveNumber()-1)*2+(g.turn()==='b'?1:0);
 // Polls can skip moves. Never invent an explosion from an arbitrary board jump.
 const oneMove=ply(next)-ply(old)===1;
 if(!oneMove && mate)return {effects,sound:'chaos-mate'};
  const unlocked=['white','black'].some(c=>after.state[c as 'white'|'black'].some(id=>!before.state[c as 'white'|'black'].includes(id)));
  if((ply(next)===ply(old) || oneMove) && unlocked){
   const squares=new Set<string>();
   for(const side of ['white','black'] as const){
    const color=side==='white'?'w':'b';
    for(const id of after.state[side].filter(id=>!before.state[side].includes(id))){
     const modifier=ALL_MODIFIERS.find(m=>m.id===id);
     if(!modifier)continue;
     if(['archbishop','knook','camel','night-rider'].includes(id)){
      // Assignments are recorded in modern replays. Never guess in legacy data.
      const square=after.state.assignedSquares?.[`${color}_${id}`];
      const piece=square && /^[a-h][1-8]$/.test(square)?next.get(square as Parameters<Chess['get']>[0]):null;
      if(piece && piece.color===color && piece.type===modifier.piece)squares.add(square!);
     }else{
      for(const piece of next.board().flat())if(piece?.color===color && piece.type===modifier.piece)squares.add(piece.square);
     }
    }
   }
   effects.push(...[...squares].map(square=>({kind:'power' as const,square})));
   if(!oneMove)return {effects,sound:'select'};
  }
 if(!oneMove)return {effects,sound:null};
 const impact=kamikazeImpact(before.fen,after.fen,{w:before.state.white.includes('kamikaze-bishop'),b:before.state.black.includes('kamikaze-bishop')});
 const shot=sniperImpact(before.fen,after.fen,{w:before.state.white.includes('sniper-bishop'),b:before.state.black.includes('sniper-bishop')});
 let sound:ReturnType<typeof watchTransition>['sound']=effects.some(e=>e.kind==='power')?'select':'move';
 if(impact){effects.push({kind:'kamikaze',square:impact.square,pieces:impact.pieces});sound='chaos-blast';}
 else if(shot){effects.push({kind:'sniper',square:shot.square,pieces:shot.pieces});sound='chaos-pew';}
 else if(after.from && after.to){
  const from=after.from as Parameters<Chess['get']>[0],to=after.to as Parameters<Chess['get']>[0];
  const mover=old.get(from),landed=next.get(to),victim=old.get(to);
  if(mover){
   const mods=mover.color==='w'?before.state.white:before.state.black;
   const cooldown=mover.color==='w'?'playerNuclearCooldownUntil':'aiNuclearCooldownUntil';
   if(mover.type==='q' && victim && mods.includes('nuclear-queen') && (after.state[cooldown]??0)>(before.state[cooldown]??0)) {effects.push({kind:'nuclear',square:to});sound='chaos-blast';}
   else if(mover.type==='p' && landed?.color===mover.color && landed.type!=='p'){effects.push({kind:'promotion',square:to});sound='correct';}
   else if(mover.type==='k' && Math.abs(from.charCodeAt(0)-to.charCodeAt(0))===2 && landed?.type==='k'){
    const rank=from[1],rookFrom=(to[0]==='g'?'h':'a')+rank,rookTo=(to[0]==='g'?'f':'d')+rank;
    if(old.get(rookFrom as typeof from)?.type==='r' && !next.get(rookFrom as typeof from) && next.get(rookTo as typeof from)?.type==='r'){effects.push({kind:'castle',square:to},{kind:'castle',square:rookTo});sound='select';}
   }
   if(!effects.some(e=>e.kind!=='power') && (victim || next.board().flat().filter(Boolean).length<old.board().flat().filter(Boolean).length)){effects.push({kind:'capture',square:to});sound='capture';}
  }
 }
 if(!mate && next.isCheck()){const king=next.board().flat().find(p=>p?.type==='k'&&p.color===next.turn());if(king)effects.push({kind:'check',square:king.square});if(sound==='move')sound='check';}
 return {effects,sound:mate?'chaos-mate':sound};
}
