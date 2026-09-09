import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { getSharedMatch } from '@/lib/chaos-share';
export const runtime = 'nodejs';
export async function GET(req: NextRequest) {
  const match = await getSharedMatch(req.nextUrl.searchParams.get('match') ?? '');
  if (!match) return new Response('Game not found', {status:404});
  return new ImageResponse(<div style={{display:'flex',width:'100%',height:'100%',background:'#17283d',padding:40,color:'#fff0c7',fontFamily:'sans-serif'}}>
    <div style={{display:'flex',flexDirection:'column',width:'100%',border:'3px solid #c69a54',borderRadius:32,padding:42,background:'linear-gradient(120deg,#29445a,#192639)'}}>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:24,fontWeight:700,color:'#d7fa64'}}><span>CHAOS CHESS</span><span>{match.rated?'RATED':'FRIENDLY'} · {match.time}</span></div>
      <div style={{display:'flex',fontSize:64,fontWeight:900,marginTop:38,lineHeight:1.05,maxWidth:950}}>{match.title}</div>
      <div style={{display:'flex',fontSize:27,color:'#b8cedc',marginTop:24}}>{match.white} vs {match.black}</div>
      <div style={{display:'flex',gap:24,marginTop:30,fontSize:23}}><span>{match.moves} moves</span><span>·</span><span>{match.powers} powers drafted</span></div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'auto',fontSize:24}}><span>Draft powers. Break chess.</span><span style={{background:'#d7fa64',color:'#17283d',padding:'16px 26px',borderRadius:16,fontWeight:700}}>Watch the replay →</span></div>
    </div>
  </div>, {width:1200,height:630,headers:{'Cache-Control':'public, max-age=300','Content-Disposition':'inline; filename="chaos-chess-match.png"'}});
}
