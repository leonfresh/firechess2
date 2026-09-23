import {ImageResponse} from 'next/og';
import {NextRequest} from 'next/server';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {ACHIEVEMENTS,ACHIEVEMENT_TIERS} from '@/lib/chaos-achievements';
export const runtime='nodejs';
export async function GET(req:NextRequest){
 const badge=ACHIEVEMENTS.find(a=>a.id===req.nextUrl.searchParams.get('badge'));
 if(!badge)return new Response('Unknown achievement',{status:404});
 const color=ACHIEVEMENT_TIERS[badge.tier].color;
 const image=await sharp(await readFile(path.join(process.cwd(),'public/activity/achievements',badge.art+'.webp'))).png().toBuffer();
 return new ImageResponse(<div style={{display:'flex',width:'100%',height:'100%',padding:48,background:'linear-gradient(135deg,#24394b,#151a30)',color:'#fff1cf',fontFamily:'sans-serif',border:`12px solid ${color}`,alignItems:'center',gap:40}}>
  <img src={`data:image/png;base64,${image.toString('base64')}`} width={370} height={370}/>
  <div style={{display:'flex',flexDirection:'column',flex:1}}><div style={{display:'flex',fontSize:21,letterSpacing:5,color:'#bbccdf'}}>CHAOS CHESS</div><div style={{display:'flex',marginTop:35,fontSize:23,fontWeight:700,color,letterSpacing:3}}>{badge.tier.toUpperCase()} ACHIEVEMENT</div><div style={{display:'flex',marginTop:14,fontSize:60,fontWeight:900,lineHeight:1.05}}>{badge.name}</div><div style={{display:'flex',marginTop:22,fontSize:26,lineHeight:1.4,color:'#c2cedf'}}>{badge.description}</div><div style={{display:'flex',marginTop:40,fontSize:20,color}}>Small pieces. Big trouble. · chaos.firechess.com</div></div>
 </div>,{width:1200,height:630,headers:{'Cache-Control':'public, max-age=3600','Content-Disposition':`inline; filename="chaos-chess-${badge.id}.png"`}});
}
