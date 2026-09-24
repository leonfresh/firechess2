// Chaos Chess metrics in the terminal: the same numbers as /admin/chaos, from lib/chaos-admin-stats.ts.
// Read-only.   node scripts/chaos-report.mjs [days=30] [--json]
import dotenv from 'dotenv';import pg from 'pg';import ts from 'typescript';
import {readFileSync} from 'node:fs';import vm from 'node:vm';
dotenv.config({path:'.env.local',quiet:true});
const mod={exports:{}};
vm.runInNewContext(ts.transpile(readFileSync('lib/chaos-admin-stats.ts','utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}),{module:mod,exports:mod.exports,Date,Number,Math,Map,String,Promise});
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});
const args=process.argv.slice(2),days=args.find(a=>/^\d+$/.test(a))??30;
try{
 const s=await mod.exports.loadChaosAdminStats(async text=>(await pool.query(text)).rows,days);
 if(args.includes('--json')){console.log(JSON.stringify(s,null,1));}
 else{
  const pct=(a,b)=>b?`${Math.round(100*a/b)}%`:'—';
  console.log(`\nChaos Chess — last ${s.days} days (Sydney days), generated ${s.generatedAt}\n`);
  console.table(s.summary);
  console.log('Funnel: rooms created → opponent joined → first move → decided');
  console.table({...s.funnel,joinRate:pct(s.funnel.joined,s.funnel.created),hostsNeverPlayedRate:pct(s.funnel.hostsNeverPlayed,s.funnel.hosts)});
  console.log('Discord launches');console.table({...s.launches,playedRate:pct(s.launches.launchersWhoPlayed,s.launches.players)});
  console.log('Daily');console.table(s.daily);
  console.log('Viral ratio (new players brought in by other players)');console.table({...s.viral,perActive:s.viral.perActive.toFixed(2)});
  console.log('Discord launches by source');console.table(s.sources.launches);
  if(s.sources.inviters.length){console.log('Top inviters (share links)');console.table(s.sources.inviters);}
  if(s.sources.firstTouch.length){console.log('First touch (where identities first arrived from)');console.table(s.sources.firstTouch);}
  console.log('Games per player');console.table(s.retention.buckets);
  console.log('Weekly cohorts (first game week)');console.table(s.retention.cohorts.map(c=>({...c,returnedPct:pct(c.returned,c.players),returned7dPct:pct(c.returned7d,c.players)})));
  console.log('Streaks (live = alive today or yesterday)');console.table(s.streaks);
  console.log('Endings');console.table(s.endings);
  console.log('Gold ledger');console.table(s.economy.ledger);
  if(s.economy.purchases.length){console.log('Shop purchases');console.table(s.economy.purchases);}
  console.log('Powers (score = (wins + draws/2) / games)');console.table(s.balance.powers.slice(0,25).map(p=>({...p,score:p.score.toFixed(2)})));
  console.log('Anomalies');console.table(s.balance.anomalies.map(p=>({...p,score:p.score.toFixed(2)})));
 }
}finally{await pool.end();}
