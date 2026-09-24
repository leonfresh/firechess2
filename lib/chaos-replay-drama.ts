/** Replay entertainment signals, not an engine evaluation of a Chaos position. */
export function replayDrama(record: {moves?: unknown[]; frames?: unknown[]}, winner: string, reason: string) {
  const moves = Array.isArray(record.moves) ? record.moves as {fen?: string}[] : [];
  const frames = Array.isArray(record.frames) ? record.frames as {fen?: string;label?:string}[] : [];
  const snapshots = (frames.length ? frames : moves).flatMap((frame, index) => {
    const ranks = frame.fen?.split(' ')[0].split('/');
    if (!ranks || ranks.length !== 8 || ranks.some(r => !/^[prnbqkPRNBQK1-8]+$/.test(r) || [...r].reduce((n,c)=>n+(/[1-8]/.test(c)?Number(c):1),0)!==8)) return [];
    let balance=0, count=0;
    for(const piece of ranks.join('')) {
      const value=({p:1,n:3,b:3,r:5,q:9,k:0} as Record<string,number>)[piece.toLowerCase()];
      if(value===undefined)continue;
      balance += piece===piece.toUpperCase()?value:-value; count++;
    }
    return [{balance,count,fen:frame.fen!,index}];
  });
  let captures=0, explosions=0, changes=0, leader=0, bestDrop=0;
  let moment: {fen:string;label:string;ply:number}|null=null;
  for(let i=1;i<snapshots.length;i++) {
    const a=snapshots[i-1], b=snapshots[i], drop=a.count-b.count;
    // Added pieces/promotions and repeated draft frames don't count as captures.
    if(drop>0){captures+=drop;if(drop>=2)explosions++;}
    if(drop>bestDrop){bestDrop=drop;moment={fen:b.fen,label:drop>=2?`${drop} pieces removed in one turn`:'Capture',ply:Math.min(moves.length, Math.max(0,(Number(b.fen.split(' ')[5]) - 1) * 2 + (b.fen.split(' ')[1] === 'b' ? 1 : 0)))};}
    const next=b.balance>=3?1:b.balance<=-3?-1:0;
    if(next){if(leader && leader!==next)changes++;leader=next;}
  }
  const sign=winner==='white'?1:winner==='black'?-1:0;
  const deficit=sign?Math.max(0,...snapshots.map(s=>-s.balance*sign)):0;
  const comeback=deficit>=3;
  const decisive=/checkmate|king captured|kamikaze/i.test(reason);
  const reasons:string[]=[];
  if(explosions)reasons.push(`${explosions===1?'Multi-piece destruction':`${explosions} explosive turns`}`);
  if(comeback)reasons.push(`Winner recovered a ${deficit}-point material deficit`);
  if(changes)reasons.push(`${changes} material lead ${changes===1?'change':'changes'}`);
  if(decisive)reasons.push(/checkmate/i.test(reason)?'Checkmate finish':'King falls');
  if(!reasons.length && captures)reasons.push(`${captures} pieces captured`);
  const action=Math.min(16,captures*1.2)+Math.min(18,explosions*9);
  const competition=Math.min(12,changes*4)+Math.min(18,deficit*2);
  const finish=decisive?22:/resign/i.test(reason)?10:/stalemate|repetition/i.test(reason)?8:0;
  const penalty=/abort|disconnect|abandon/i.test(reason)?35:/time|timeout/i.test(reason)?15:0;
  return {score:action+competition+finish-penalty,reasons:reasons.slice(0,3),moment:bestDrop>=2?moment:null,captures,explosions,deficit,changes,hasReplay:snapshots.length>=3};
}
