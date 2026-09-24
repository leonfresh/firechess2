import assert from 'node:assert/strict';
import {randomUUID,createHmac} from 'node:crypto';
import {readFileSync} from 'node:fs';
import dotenv from 'dotenv';
import {neon} from '@neondatabase/serverless';
dotenv.config({path:'.vercel/playtest-production.env',quiet:true});
const sql=neon(process.env.DATABASE_URL);
const secret=JSON.parse(readFileSync('.vercel/chaos-live-secrets.json','utf8')).CHAOS_LIVE_SECRET;
const base=process.env.CHAOS_TEST_ORIGIN||'https://chaos.firechess.com';
const guest='guest_'+randomUUID(), other='guest_'+randomUUID();
const id='discord_00000'+Date.now();
const payload=Buffer.from(JSON.stringify({aud:'chaos-discord-v1',sub:id,exp:Date.now()+600000})).toString('base64url');
const identity=payload+'.'+createHmac('sha256',secret).update(payload).digest('base64url');
const rooms=[];
async function req(path,method='GET',body,login=false,who=guest){
 const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json','X-Guest-Id':who,...(login?{'X-Chaos-Identity':identity}:{})},...(body?{body:JSON.stringify(body)}:{})});
 return {status:response.status,data:await response.json()};
}
try{
 const made=await req('/api/chaos/matchmake','POST',{draftProtocol:2,timeControlSeconds:300,incrementSeconds:3});
 assert.equal(made.status,200);rooms.push(made.data.roomId);
 const listed=await req('/api/chaos/matchmake?list=1','GET',undefined,true);
 assert.equal(listed.data.rooms.find(r=>r.roomCode===made.data.roomCode)?.yours,true,'Signed-in browser still recognizes guest seek');
 assert.equal((await req('/api/chaos/join','POST',{roomCode:made.data.roomCode},true)).status,400,'Cannot join own guest challenge after login');
 assert.equal((await req('/api/chaos/matchmake','DELETE',undefined,true)).status,200);
 const [cancelled]=await sql`select status from chaos_room where id=${made.data.roomId}`;
 assert.equal(cancelled.status,'cancelled','Login can cancel guest seek');
 assert.notEqual((await req('/api/chaos/join','POST',{roomCode:made.data.roomCode},false,other)).status,200);
 console.log('PASS: guest-to-login ownership, self-join blocked, cancellation across login, cancelled challenge unjoinable');
}finally{
 for(const room of rooms)await sql`delete from chaos_room where id=${room}`;
 await sql`delete from chaos_player where id=${id}`;
}
