import {ACHIEVEMENTS,ACHIEVEMENT_TIERS} from '@/lib/chaos-achievements';
import type { Metadata } from 'next';
import { ChaosWatch } from '@/components/chaos-watch';
async function load(id?:string) {
  if (!id || id.length > 150) return null;
  const res = await fetch(`${process.env.FIRECHESS_ORIGIN || 'https://www.firechess.com'}/api/chaos/share?match=${encodeURIComponent(id)}`,{cache:'no-store'});
  return res.ok ? res.json() : null;
}
type Props = {searchParams:Promise<{match?:string;achievement?:string}>};
export async function generateMetadata({searchParams}:Props):Promise<Metadata> {
  const params=await searchParams;
  const match = await load(params.match);
  const badge=ACHIEVEMENTS.find(a=>a.id===params.achievement);
  if (!match) return {title:'Chaos Chess · Game unavailable'};
  if(badge){
    const title=`${badge.tier} achievement: ${badge.name} · Chaos Chess`;
    const image=`https://chaos.firechess.com/api/chaos/achievements/image?badge=${badge.id}`;
    return {title,description:badge.description,openGraph:{title,description:badge.description,images:[{url:image,width:1200,height:630}],url:`https://chaos.firechess.com/share?match=${encodeURIComponent(match.id)}&achievement=${badge.id}`},twitter:{card:'summary_large_image',title,description:badge.description,images:[image]}};
  }
  const image = `https://chaos.firechess.com/api/chaos/share/image?match=${encodeURIComponent(match.id)}`;
  return {title:match.title,description:'Draft powers. Break chess. Watch this match and challenge a friend.',openGraph:{title:match.title,images:[{url:image,width:1200,height:630}],url:`https://chaos.firechess.com/share?match=${encodeURIComponent(match.id)}`},twitter:{card:'summary_large_image',images:[image]}};
}
export default async function SharePage({searchParams}:Props) {
  const params=await searchParams;
  const match = await load(params.match);
  const badge=ACHIEVEMENTS.find(a=>a.id===params.achievement);
  return <main style={{minHeight:'100dvh',background:'#142235',padding:'24px 12px',color:'#fff0c7'}}>
    <header style={{maxWidth:1000,margin:'0 auto 24px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}><h1 style={{fontSize:24,fontWeight:900}}>Chaos Chess · {match?'Replay':'Game unavailable'}</h1><a href="/" style={{background:'#d7fa64',color:'#17283d',padding:'14px 24px',borderRadius:16,fontWeight:800}}>Play Chaos Chess ↗</a></header>
    {match && badge && <section aria-label="Shared achievement" style={{maxWidth:960,margin:'0 auto 24px',padding:24,border:`1px solid ${ACHIEVEMENT_TIERS[badge.tier].color}`,borderRadius:20,display:'flex',alignItems:'center',gap:24,flexWrap:'wrap',background:'#1e3046'}}>
      <img src={`/activity/achievements/${badge.art}.webp`} alt="" width={120} height={120}/><div><small style={{color:ACHIEVEMENT_TIERS[badge.tier].color,textTransform:'uppercase',letterSpacing:2}}>{badge.tier} achievement</small><h2 style={{fontSize:30,margin:'8px 0'}}>{badge.name}</h2><p>{badge.description}</p><p style={{color:'#adc2d9',fontSize:13,marginTop:10}}>Watch the shared game below.</p></div>
    </section>}
    {match && <ChaosWatch initialMatch={match.id}/>}
  </main>;
}
