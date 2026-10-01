import { Chess } from "chess.js";
import { ALL_MODIFIERS } from "./chaos-chess";
/** A mutual kill removes exactly the victim and attacker, and adds no piece. */
export type KamikazeImpact = { square: string; pieces: string[]; king?: boolean };
/** A mutual kill removes exactly the victim and attacker, and adds no piece. A king that
 *  captures a Kamikaze Bishop is destroyed by the rules, but chess.js cannot hold a kingless
 *  board: the king stays on the bishop's square and the caller ends the game. That transition
 *  reads as one relocation (the king) plus one vanishing bishop, which the old two-removals / no-addition
 *  signature missed — so it fell through to a plain capture and showed no Kamikaze feedback. */
export function kamikazeImpact(
  before: string,
  after: string,
  armed: { w: boolean; b: boolean },
): KamikazeImpact | null {
  if (before === after || (!armed.w && !armed.b)) return null;
  let old: Chess, next: Chess;
  try { old = new Chess(before); next = new Chess(after); } catch { return null; }
  const removed = old.board().flat().filter((p) => p && (!next.get(p.square) || next.get(p.square)?.type !== p.type || next.get(p.square)?.color !== p.color));
  const added = next.board().flat().filter((p) => p && (!old.get(p.square) || old.get(p.square)?.type !== p.type || old.get(p.square)?.color !== p.color));
  // Mutual kill: exactly the armed bishop and its attacker vanish, nothing is added.
  if (added.length === 0) {
    if (removed.length !== 2) return null;
    // Both bishops can be armed: the side whose turn just ended is the attacker.
    const victim = removed.find((p) => p?.type === "b" && armed[p.color] && p.color !== old.turn());
    const mover = removed.find((p) => p?.color === old.turn());
    if (!victim || !mover) return null;
    return { square: victim.square, pieces: [`${victim.color}B`, `${mover.color}${mover.type.toUpperCase()}`] };
  }
  // King captures the bishop: the king relocates onto the bishop's square (the only addition),
  // the armed bishop vanishes, and nothing else changes.
  if (added.length === 1 && removed.length === 2) {
    const king = added[0];
    const victim = removed.find((p) => p?.type === "b" && armed[p.color]);
    const gone = removed.find((p) => p !== victim);
    if (!king || king.type !== "k" || !victim || !gone) return null;
    if (gone.type !== "k" || gone.color !== king.color) return null;
    if (king.square !== victim.square || victim.color === king.color) return null;
    return { square: victim.square, pieces: [`${victim.color}B`, `${king.color}K`], king: true };
  }
  return null;
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

export type WatchImpact = {kind:"kamikaze"|"sniper"|"checkmate"|"nuclear"|"promotion"|"castle"|"capture"|"check"|"power"|"revive"|"summon";square:string;pieces?:string[];kingKamikaze?:boolean};

/**
 * Whether a replay/live transition should play its effects. A seek (the index jumps),
 * a reset or scene change, a hidden tab, a backward step, or an unchanged frame emits
 * nothing — so a king-Kamikaze burst can never come back stale or double on seek/reset.
 */
export function shouldEmitWatchEffects(a: {
  hasPrevious: boolean;
  sameScene: boolean;
  visible: boolean;
  live: boolean;
  following: boolean;
  stepForward: boolean;
  previousIndex: number;
  index: number;
  changed: boolean;
}): boolean {
  if (!a.hasPrevious || !a.sameScene || !a.visible || !a.changed) return false;
  return (
    (a.live && a.following) ||
    (a.stepForward && a.index === a.previousIndex + 1)
  );
}
type Frame = {fen:string;from?:string;to?:string;state:{white:string[];black:string[];assignedSquares?:Record<string,string|null>;playerNuclearCooldownUntil?:number;aiNuclearCooldownUntil?:number};kamikazeKing?:boolean};
export function watchTransition(before:Frame, after:Frame, result?:{winner:string;reason:string}|null): {effects:WatchImpact[];sound:"chaos-mate"|"chaos-blast"|"chaos-pew"|"capture"|"check"|"move"|"correct"|"select"|"revive"|null} {
 const effects:WatchImpact[]=[];
 let old:Chess,next:Chess;
 try {old=new Chess(before.fen);next=new Chess(after.fen);} catch{return {effects,sound:null};}
 const mate=result && /checkmate/i.test(result.reason) && ['white','black'].includes(result.winner);
 if(mate){const king=next.board().flat().find(p=>p?.type==='k'&&p.color===(result.winner==='white'?'b':'w'));if(king)effects.push({kind:'checkmate',square:king.square});}
 const ply=(g:Chess)=>(g.moveNumber()-1)*2+(g.turn()==='b'?1:0);
 // Polls can skip moves. Never invent an explosion from an arbitrary board jump.
 const oneMove=ply(next)-ply(old)===1;
 if(!oneMove && mate)return {effects,sound:'chaos-mate'};
 // Revived and summoned pieces, from a move or a draft pick (same ply). Declared up front so the
 // pick branch below can include them before it returns.
 const spawns=(oneMove||ply(next)===ply(old))?spawnImpacts(before.fen,after.fen,oneMove&&after.from&&after.to?{from:after.from,to:after.to}:null,
  {w:after.state.white,b:after.state.black},
  {w:after.state.white.filter(id=>!before.state.white.includes(id)),b:after.state.black.filter(id=>!before.state.black.includes(id))}):[];
 const spawnEffects=spawns.map(s=>({kind:s.kind,square:s.square,pieces:[s.piece]}) as WatchImpact);
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
   // A spawned piece shows its revive/summon burst instead of a second power sparkle.
   effects.push(...[...squares].filter(square=>!spawns.some(s=>s.square===square)).map(square=>({kind:'power' as const,square})));
   if(!oneMove)return {effects:[...effects,...spawnEffects],sound:spawnEffects.length?'revive':'select'};
  }
 if(!oneMove)return spawnEffects.length?{effects:[...effects,...spawnEffects],sound:'revive'}:{effects,sound:null};
 const impact=kamikazeImpact(before.fen,after.fen,{w:before.state.white.includes('kamikaze-bishop'),b:before.state.black.includes('kamikaze-bishop')});
 const shot=sniperImpact(before.fen,after.fen,{w:before.state.white.includes('sniper-bishop'),b:before.state.black.includes('sniper-bishop')});
 let sound:ReturnType<typeof watchTransition>['sound']=effects.some(e=>e.kind==='power')?'select':'move';
 // The archived frame carries the authoritative king-Kamikaze marker. Prefer it: the FEN diff
 // alone can miss the transition (or lack powers in older frames). Keep the detector as fallback.
 const kingSquare = after.kamikazeKing && after.to ? after.to : null;
 const kingPiece = kingSquare ? next.get(kingSquare as Parameters<Chess['get']>[0]) : null;
 if(kingSquare && kingPiece?.type==='k'){
  effects.push({kind:'kamikaze',square:kingSquare,pieces:[`${kingPiece.color==='w'?'b':'w'}B`,`${kingPiece.color}K`],kingKamikaze:true});sound='chaos-blast';
 }
 else if(impact){effects.push({kind:'kamikaze',square:impact.square,pieces:impact.pieces,kingKamikaze:impact.king===true});sound='chaos-blast';}
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
 if(spawnEffects.length){effects.push(...spawnEffects);if(sound==='move'||sound==='select'||sound==='capture')sound='revive';}
 if(!mate && next.isCheck()){const king=next.board().flat().find(p=>p?.type==='k'&&p.color===next.turn());if(king)effects.push({kind:'check',square:king.square});if(sound==='move')sound='check';}
 return {effects,sound:mate?'chaos-mate':sound};
}

/* ── Revivals and summons ─────────────────────────────────────────────────────────────────────
 * Pieces that appear outside the move itself: a Pawn Fortress pawn back on its start square, a
 * Regicide revival on the back rank, Undead Army pawns (revived); Knight Horde knights, Phalanx
 * pawns, The Wake's pawn on the square the capturer left (summoned). The mover landing on `to`
 * (including promotion and Hostile Takeover), castling's rook, a Usurper swap and a shooter that
 * stays put are not spawns. Callers must only compare boards one ply apart, or a draft pick. */
export type SpawnImpact = {square: string; piece: string; kind: "revive" | "summon"};
type Cell = {type: string; color: "w" | "b"};

function cells(fen: string): Map<string, Cell> | null {
  const rows = fen.split(" ")[0]?.split("/");
  if (!rows || rows.length !== 8) return null;
  const board = new Map<string, Cell>();
  for (let r = 0; r < 8; r++) {
    let f = 0;
    for (const ch of rows[r]) {
      if (/[1-8]/.test(ch)) { f += Number(ch); continue; }
      if (!/[prnbqk]/i.test(ch) || f > 7) return null;
      board.set(`${"abcdefgh"[f]}${8 - r}`, {type: ch.toLowerCase(), color: ch === ch.toUpperCase() ? "w" : "b"});
      f++;
    }
    if (f !== 8) return null;
  }
  return board;
}

export function spawnImpacts(
  before: string, after: string, move: {from?: string; to?: string} | null,
  powers: {w: string[]; b: string[]}, added: {w: string[]; b: string[]} = {w: [], b: []},
): SpawnImpact[] {
  const old = cells(before), next = cells(after);
  if (!old || !next || before === after) return [];
  const mover = move?.from ? old.get(move.from) : undefined;
  const from = move?.from, to = move?.to;
  // A move that doesn't match the boards (stale, or skipped by a poll) could turn its real landing
  // square into a false spawn: say nothing. Moves whose mover vanishes (kamikaze, a sniper shot)
  // or changes sides (Hostile Takeover) never spawn anything either.
  if (move && (!mover || !to || next.get(to)?.color !== mover.color)) return [];
  const castle = !!mover && mover.type === "k" && !!from && !!to && from[1] === to[1] && Math.abs(from.charCodeAt(0) - to.charCodeAt(0)) === 2;
  const swap = !!mover && !!to && old.get(to)?.color === mover.color;
  const kingCaptured = !!mover && mover.type === "k" && !!to && !!old.get(to) && old.get(to)!.color !== mover.color;
  const out: SpawnImpact[] = [];
  for (const [square, piece] of next) {
    if (square === to) continue;
    const was = old.get(square);
    if (was && was.color === piece.color && was.type === piece.type) continue;
    if (square === from && swap) continue;
    if (castle && piece.type === "r" && piece.color === mover!.color) continue;
    const startRank = piece.color === "w" ? "2" : "7";
    const revive =
      (piece.type === "p" && square[1] === startRank && powers[piece.color].includes("pawn-fortress")) ||
      (kingCaptured && piece.color === mover!.color && powers[piece.color].includes("king-wrath")) ||
      (piece.type === "p" && added[piece.color].includes("undead-army"));
    out.push({square, piece: `${piece.color}${piece.type.toUpperCase()}`, kind: revive ? "revive" : "summon"});
  }
  return out.slice(0, 8);
}
