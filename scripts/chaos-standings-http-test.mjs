import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';import dotenv from 'dotenv';import {neon} from '@neondatabase/serverless';
dotenv.config({path:'.vercel/playtest-production.env',quiet:true});
const sql=neon(process.env.DATABASE_URL),base=process.env.CHAOS_TEST_ORIGIN||'http://localhost:3019';
const tag=randomUUID(),host='standings-test-host-'+tag,guest='standings-test-guest-'+tag,ids=[];
try{
 await sql`insert into chaos_player(id,name) values(${host},${'QA standings host '+tag}),(${guest},${'QA standings guest '+tag})`;
 for(const [i,color,winner,moves] of [[0,'black','black',[{color:'w'},{color:'b'}]],[1,'white','draw',[{color:'w'},{color:'b'}]],[2,'white','white',[]],[3,'white','white',[{color:'w'}]]]){
  const id=tag+':'+i;ids.push(id);await sql`insert into chaos_match(id,room_id,game_number,host_id,guest_id,host_color,winner,reason,record) values(${id},${tag},${i},${host},${guest},${color},${winner},'Owned standings test',${JSON.stringify({moves})}::jsonb)`;
 }
 const r=await fetch(base+'/api/chaos/standings?verify='+tag);assert.equal(r.status,200,'Public standings require no auth');const d=await r.json();
 const h=d.community.find(p=>p.name==='QA standings host '+tag),g=d.community.find(p=>p.name==='QA standings guest '+tag);
 assert.deepEqual(h,{name:'QA standings host '+tag,games:2,wins:1,losses:0,draws:1});assert.deepEqual(g,{name:'QA standings guest '+tag,games:2,wins:0,losses:1,draws:1});
 assert.ok(!d.ranked.some(p=>p.name.includes(tag)),'Casual records must not be presented as rated');
 assert.ok(!JSON.stringify(d).includes(host));assert.ok(!JSON.stringify(d).includes(guest));
 console.log('PASS: anonymous standings, color-aware wins/draws/losses, no-move exclusions, private IDs omitted, casual results separate from rated ladder.');
}finally{for(const id of ids)await sql`delete from chaos_match where id=${id}`;await sql`delete from chaos_player where id in (${host},${guest})`;console.log('Owned standings fixtures removed.');}
