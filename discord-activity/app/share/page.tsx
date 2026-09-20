import type { Metadata } from 'next';
import { ChaosWatch } from '@/components/chaos-watch';
async function load(id?:string) {
  if (!id || id.length > 150) return null;
  const res = await fetch(`${process.env.FIRECHESS_ORIGIN || 'https://www.firechess.com'}/api/chaos/share?match=${encodeURIComponent(id)}`,{cache:'no-store'});
  return res.ok ? res.json() : null;
}
type Props = {searchParams:Promise<{match?:string}>};
export async function generateMetadata({searchParams}:Props):Promise<Metadata> {
  const match = await load((await searchParams).match);
  if (!match) return {title:'Chaos Chess · Game unavailable'};
  const image = `https://chaos.firechess.com/api/chaos/share/image?match=${encodeURIComponent(match.id)}`;
  return {title:match.title,description:'Draft powers. Break chess. Watch this match and challenge a friend.',openGraph:{title:match.title,images:[{url:image,width:1200,height:630}],url:`https://chaos.firechess.com/share?match=${encodeURIComponent(match.id)}`},twitter:{card:'summary_large_image',images:[image]}};
}
export default async function SharePage({searchParams}:Props) {
  const match = await load((await searchParams).match);
  return <main style={{minHeight:'100dvh',background:'#142235',padding:'24px 12px',color:'#fff0c7'}}>
    <header style={{maxWidth:1000,margin:'0 auto 24px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}><h1 style={{fontSize:24,fontWeight:900}}>Chaos Chess · {match?'Replay':'Game unavailable'}</h1><a href="/" style={{background:'#d7fa64',color:'#17283d',padding:'14px 24px',borderRadius:16,fontWeight:800}}>Play Chaos Chess ↗</a></header>
    {match && <ChaosWatch initialMatch={match.id}/>}
  </main>;
}
