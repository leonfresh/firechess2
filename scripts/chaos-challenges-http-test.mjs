import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import dotenv from 'dotenv';
import {neon} from '@neondatabase/serverless';
dotenv.config({path:'.vercel/playtest-production.env',quiet:true});
const sql=neon(process.env.DATABASE_URL),base=process.env.CHAOS_TEST_ORIGIN||'http://localhost:3019';
const host='guest_'+randomUUID(),a='guest_'+randomUUID(),b='guest_'+randomUUID(),rooms=[];
async function request(path,user,method='GET',body){const r=await fetch(base+path,{method,headers:{'X-Guest-Id':user,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json()};}
try {
 await sql`insert into chaos_player(id,name,rating) values(${host},'Challenge QA',1450)`;
 const made=await request('/api/chaos/matchmake',host,'POST',{draftProtocol:2,timeControlSeconds:300,incrementSeconds:3});assert.equal(made.status,200);rooms.push(made.data.roomId);
 const list=await request('/api/chaos/matchmake?list=1',a);assert.equal(list.status,200);
 const row=list.data.rooms.find(r=>r.roomCode===made.data.roomCode);assert.equal(row.name,'Challenge QA');assert.equal(row.rating,1450);assert.equal(row.ratedEligible,true);assert.equal(row.yours,false);assert.ok(!JSON.stringify(row).includes(host));
 assert.equal((await request('/api/chaos/matchmake?list=1',host)).data.rooms.find(r=>r.roomCode===row.roomCode).yours,true);
 const joined=await Promise.all([a,b].map(u=>request('/api/chaos/join',u,'POST',{roomCode:row.roomCode})));assert.equal(joined.filter(r=>r.status===200).length,1,'Only one seat can be claimed');
 await request('/api/chaos/matchmake',host,'DELETE',{roomId:made.data.roomId});
 const [room]=await sql`select status from chaos_room where id=${made.data.roomId}`;assert.equal(room.status,'playing','Late cancel must not cancel a started match');
 assert.ok(!(await request('/api/chaos/matchmake?list=1',a)).data.rooms.some(r=>r.roomCode===row.roomCode));
 const stale=await request('/api/chaos/matchmake',host,'POST',{draftProtocol:2,timeControlSeconds:-1});rooms.push(stale.data.roomId);
 await sql`update chaos_room set "createdAt"=now()-interval '2 minutes' where id=${stale.data.roomId}`;
 assert.equal((await request('/api/chaos/join',a,'POST',{roomCode:stale.data.roomCode})).status,410);
 assert.ok(!(await request('/api/chaos/matchmake?list=1',a)).data.rooms.some(r=>r.roomCode===stale.data.roomCode));
 console.log('PASS: public names/ratings, own challenge, one winner in concurrent join, late cancellation safe, started/stale challenges excluded, expired join rejected.');
} finally {
 for(const id of rooms){await sql`delete from chaos_match where room_id=${id}`;await sql`delete from chaos_room where id=${id}`;}
 await sql`delete from chaos_player where id=${host}`;
 console.log('Owned challenge fixtures removed.');
}
