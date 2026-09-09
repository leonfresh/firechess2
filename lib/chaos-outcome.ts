import { Chess, type Color, type Square } from 'chess.js';
import type { ChaosState } from './chaos-chess';
import { getChaosMoves, getChaosAttackedSquares, computeChainedSquare } from './chaos-moves';

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

