import React from 'react';
import {AbsoluteFill,Audio,Img,interpolate,staticFile,useCurrentFrame} from 'remotion';
import replay from '../public/gameplay/replay.json';

const lime='#dcfa79',ink='#fff3d2',bg='#131c30';
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;
const pos=(s:string)=>[s.charCodeAt(0)-97,8-Number(s[1])];
function board(fen:string){const b:Record<string,string>={};fen.split(' ')[0].split('/').forEach((r,y)=>{let x=0;for(const c of r){if(/\d/.test(c))x+=Number(c);else{b[String.fromCharCode(97+x)+(8-y)]=c;x++;}}});return b;}
// Exact saved positions. No invented moves or fabricated draft choices.
const shots=[{at:0,index:34,move:18},{at:90,index:34,move:-100},{at:180,index:30,move:8},{at:216,index:31,move:8},{at:252,index:32,move:8},{at:288,index:33,move:8},{at:324,index:34,move:15},{at:435,index:44,move:12},{at:480,index:45,move:12},{at:525,index:46,move:12}];
function pieceCode(c:string,mods:string[]){let type=c.toUpperCase();if(type==='P'&&mods.includes('pawn-capture-forward'))type='PB';if(type==='B'&&mods.includes('dragon-bishop'))type='Db';if(type==='R'&&mods.includes('rook-cannon'))type='RC';return (c===c.toUpperCase()?'w':'b')+type;}
export const GameplayPromo=()=>{
 const f=useCurrentFrame(),shot=[...shots].reverse().find(s=>s.at<=f)!,local=f-shot.at;
 const next=replay.frames[shot.index],prev=replay.frames[shot.index-1],before=board(prev.fen),after=board(next.fen);
 const t=interpolate(local,[shot.move,shot.move+12],[0,1],clamp),from=next.from!,to=next.to!,[fx,fy]=pos(from),[tx,ty]=pos(to);
 const promotion=shot.index===34,landed=t===1,mate=f>=552;
 const pieces=landed?after:before;
 const mods=next.state;
 const title=f<90?<>THIS PAWN BECOMES<br/><span style={{color:lime}}>A QUEEN.</span></>:f<180?<>ON THE<br/><span style={{color:lime}}>FIFTH RANK.</span></>:f<324?<>WATCH THE<br/><span style={{color:lime}}>b-PAWN.</span></>:f<435?<>ONE POWER.<br/><span style={{color:lime}}>NEW THREAT.</span></>:<>SAME PAWN.<br/><span style={{color:lime}}>{mate?'CHECKMATE.':'FINAL BLOW.'}</span></>;
 const shake=promotion&&local>shot.move+11&&local<shot.move+23?Math.sin(local*2)*5:0;
 return <AbsoluteFill style={{background:bg,color:ink,fontFamily:'Arial',overflow:'hidden'}}>
  <style>{`@font-face{font-family:Impact;src:url('${staticFile('chaos-promo/impact.ttf')}')}*{box-sizing:border-box}`}</style>
  <Audio src={staticFile('gameplay/narrated-mix.wav')}/>
  <AbsoluteFill style={{background:'radial-gradient(ellipse at 50% 60%,#47616c70,transparent 72%)'}}/>
  <div style={{position:'absolute',top:185,left:70,right:70,display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:22,fontWeight:800,letterSpacing:3}}><span style={{display:'flex',alignItems:'center',gap:14}}><Img src={staticFile('chaos-promo/logo.svg')} style={{width:44,height:44}}/>CHAOS CHESS</span><span style={{color:lime,fontSize:18}}>REAL MATCH REPLAY</span></div>
  <div style={{position:'absolute',left:70,top:275,fontFamily:'Impact',fontSize:f<90?88:102,lineHeight:1.06,letterSpacing:1}}>{title}</div>
  <div style={{position:'absolute',left:74,top:528,right:74,display:'flex',justifyContent:'space-between',fontSize:25,fontWeight:700,color:'#baccd6'}}><span>{f>=435?'LATER IN THE SAME GAME':f>=180&&f<324?'REWIND · THE SETUP':'BATTLEFIELD PROMOTION'}</span><span>{next.from} → {next.to}</span></div>
  <div style={{position:'absolute',left:72+shake,top:580,width:936,height:936,padding:12,borderRadius:24,background:'linear-gradient(135deg,#e8c485,#977341)',boxShadow:'0 15px 0 #705536,0 30px 65px #0007'}}><div style={{position:'relative',width:912,height:912,overflow:'hidden',borderRadius:10}}>
   {Array.from({length:64},(_,i)=>{const x=i%8,y=Math.floor(i/8);return <div key={i} style={{position:'absolute',left:x*114,top:y*114,width:114,height:114,background:(x+y)%2?'#7b9eaa':'#eee3c3'}}/>;})}
   {f<435&&<div style={{position:'absolute',left:0,top:342,width:912,height:114,border:'3px dashed #6d4b9570',background:'#b892ed18'}}/>}
   {[from,to].map((s,i)=>{const [x,y]=pos(s);return <div key={s} style={{position:'absolute',left:x*114,top:y*114,width:114,height:114,background:i?'#dcfa7977':'#ffcf6966',border:i?'4px solid #e7ffac':undefined}}/>;})}
   {Object.entries(pieces).filter(([s])=>landed||s!==from).map(([s,c])=>{const [x,y]=pos(s);return <Img key={s} src={staticFile(`gameplay/pieces/${pieceCode(c,c===c.toUpperCase()?mods.white:mods.black)}.svg`)} style={{position:'absolute',left:x*114,top:y*114,width:114,height:114,opacity:!landed&&s===to?1-t:1,filter:'drop-shadow(0 5px 2px #0004)'}}/>;})}
   {!landed&&<Img src={staticFile(`gameplay/pieces/${pieceCode(before[from],before[from]===before[from].toUpperCase()?mods.white:mods.black)}.svg`)} style={{position:'absolute',left:(fx+(tx-fx)*t)*114,top:(fy+(ty-fy)*t)*114,width:114,height:114,filter:'drop-shadow(0 10px 4px #0005)'}}/>}
   {promotion&&landed&&f<435&&<div style={{position:'absolute',left:tx*114-12,top:ty*114-12,width:138,height:138,borderRadius:30,border:'5px solid #dcfa79',boxShadow:'0 0 45px #dcfa79',opacity:.65+.35*Math.sin(f*.13)}}/>}
   {Array.from({length:8},(_,i)=><React.Fragment key={i}><span style={{position:'absolute',left:7,top:i*114+5,fontSize:19,color:'#384d57'}}>{8-i}</span><span style={{position:'absolute',left:i*114+97,bottom:5,fontSize:19,color:'#384d57'}}>{'abcdefgh'[i]}</span></React.Fragment>)}
   {mate&&<div style={{position:'absolute',left:tx*114,top:ty*114,width:114,height:114,border:'5px solid #ff8767',boxShadow:'0 0 35px #ff8767'}}/>}
  </div></div>
  <div style={{position:'absolute',left:75,right:75,top:1560,display:'flex',gap:22,alignItems:'center',padding:20,border:'2px solid #b892ed88',borderRadius:22,background:'#243048'}}><Img src={staticFile('gameplay/promotion.webp')} style={{width:105,height:105,borderRadius:15}}/><div><div style={{fontSize:19,color:'#c9a6ff',fontWeight:800,letterSpacing:2}}>EPIC · BATTLEFIELD PROMOTION</div><div style={{fontSize:30,fontWeight:800,marginTop:12}}>{mate?'That promoted pawn delivered mate.':'White pawns can promote on rank 5.'}</div></div></div>
  {f>=600&&<AbsoluteFill style={{background:'#0c1425ed',alignItems:'center',justifyContent:'center',opacity:interpolate(f,[600,609],[0,1],clamp)}}><Img src={staticFile('chaos-promo/logo.svg')} style={{width:130,height:130,marginBottom:35}}/><div style={{fontFamily:'Impact',fontSize:138,textAlign:'center',lineHeight:1.04}}>CHESS.<br/><span style={{color:lime}}>WITH POWERUPS.</span></div><div style={{fontSize:35,marginTop:38}}>What would you draft?</div><div style={{marginTop:72,padding:'30px 55px',background:'#5865f2',borderRadius:25,boxShadow:'0 8px 0 #343f9f',fontSize:43,fontWeight:900}}>Play on Discord ↗</div><div style={{marginTop:35,fontSize:35,color:lime}}>chaos.firechess.com</div></AbsoluteFill>}
 </AbsoluteFill>;
};
