import { Chess, type Color, type Square } from 'chess.js';
import type { ChaosState } from './chaos-chess';
import { getChaosMoves, getChaosAttackedSquares, computeChainedSquare, type ChaosMove } from './chaos-moves';

/** Validate a terminal capture before chess.js is asked to reload a kingless FEN. */
export function getKingCaptureMove(game: Chess, state: ChaosState, side: Color, from: string, to: string): ChaosMove | null {
  if (!/^[a-h][1-8]$/.test(from) || !/^[a-h][1-8]$/.test(to) || game.turn() !== side) return null;
  const target = game.get(to as Square);
  if (game.get(from as Square)?.color !== side || target?.type !== 'k' || target.color === side || blockedMove(game,state,side,from,to)) return null;
  const owner = side === 'w' ? 'player' : 'ai', enemy = side === 'w' ? 'ai' : 'player';
  const own = state[`${owner}Modifiers`], other = state[`${enemy}Modifiers`];
  const normal = game.moves({verbose:true});
  if (other.some(m => m.id === 'forced-en-passant') && normal.some(m => m.flags.includes('e'))) return null;
  const special = getChaosMoves(game,own,side,state.assignedSquares,other,{
    playerAnomaly:state[`${owner}Anomaly`], moonUnlocked:game.moveNumber() >= 10,
    strengthMode:state[`${owner}Anomaly`] === 'strength' && !state[`${owner}AnomalyUsed`],
  }).find(m => m.from === from && m.to === to && m.type === 'capture');
  if (special) return special;
  const move = normal.find(m => m.from === from && m.to === to && m.captured === 'k');
  if (!move) return null;
  const after = new Chess(game.fen());
  after.move(move);
  const king = after.board().flat().find(p => p?.type === 'k' && p.color === side)?.square;
  if (!king || getChaosAttackedSquares(after,other,side === 'w' ? 'b' : 'w',state.assignedSquares).has(king)) return null;
  return {from:from as Square,to:to as Square,type:'capture',modifierId:'standard',label:'King captured'};
}

export function blockedMove(game: Chess, state: ChaosState, color: Color, from: string, to: string): string | null {
  const own = color === 'w' ? 'player' : 'ai', enemy = color === 'w' ? 'ai' : 'player';
  if (state[`${own}FrozenSquare`] === from && (state[`${own}FrozenTurnsLeft`] ?? 0)>0) return 'This piece is frozen';
  if (state[`${enemy}ImmuneSquare`] === to && (state[`${enemy}ImmuneTurnsLeft`] ?? 0)>0) return 'That piece is protected';
  if (state[`${own}ImmuneSquare`] === from && (state[`${own}ImmuneTurnsLeft`] ?? 0)>0 && game.get(to as Square)) return 'Protected pieces cannot capture';
  const enemyMods=color==='w'?state.aiModifiers:state.playerModifiers;
  if (enemyMods.some(m=>m.id==='kings-chains') && computeChainedSquare(game,color==='w'?'b':'w')===from) return "This piece is held by King's Chains";
  return null;
}
export function chaosOutcome(game: Chess, state: ChaosState): {winner:'white'|'black'|'draw';reason:string}|null {
  const side=game.turn(), enemy:Color=side==='w'?'b':'w';
  const own=side==='w'?state.playerModifiers:state.aiModifiers, other=side==='w'?state.aiModifiers:state.playerModifiers;
  const king=game.board().flat().find(p=>p?.type==='k'&&p.color===side)?.square;
  if(!king)return {winner:enemy==='w'?'white':'black',reason:'King captured'};
  const checked=game.isCheck()||getChaosAttackedSquares(game,other,enemy,state.assignedSquares).has(king);
  const special=getChaosMoves(game,own,side,state.assignedSquares,other,{playerAnomaly:side==='w'?state.playerAnomaly:state.aiAnomaly,moonUnlocked:state.currentPhase>=2});
  const hasSpecial=special.some(m=>!blockedMove(game,state,side,m.from,m.to));
  const hasNormal=game.moves({verbose:true}).some(m=>{
    if(blockedMove(game,state,side,m.from,m.to))return false;
    const next=new Chess(game.fen());next.move(m);
    const k=next.board().flat().find(p=>p?.type==='k'&&p.color===side)?.square;
    return !!k&&!getChaosAttackedSquares(next,other,enemy,state.assignedSquares).has(k);
  });
  if(!hasNormal&&!hasSpecial)return {winner:checked?(enemy==='w'?'white':'black'):'draw',reason:checked?'Checkmate':'Stalemate'};
  if(!own.length&&!other.length&&game.isInsufficientMaterial())return {winner:'draw',reason:'Insufficient material'};
  if(game.isDrawByFiftyMoves())return {winner:'draw',reason:'Fifty-move rule'};
  return null;
}

