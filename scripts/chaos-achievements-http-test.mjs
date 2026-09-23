import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {readFileSync} from 'node:fs';
const secret=JSON.parse(readFileSync('.vercel/chaos-live-secrets.json','utf8')).CHAOS_LIVE_SECRET;
const p=Buffer.from(JSON.stringify({aud:'chaos-discord-v1',sub:'discord_000000000000987654',exp:Date.now()+600000})).toString('base64url');
const token=p+'.'+createHmac('sha256',secret).update(p).digest('base64url');
for(const base of ['https://www.firechess.com','https://chaos.firechess.com']){
 const guest=await fetch(base+'/api/chaos/achievements');assert.equal(guest.status,401);await guest.arrayBuffer();
 const signed=await fetch(base+'/api/chaos/achievements',{headers:{'X-Chaos-Identity':token}});assert.equal(signed.status,200);const d=await signed.json();assert.equal(d.achievements.length,6);assert.ok(d.achievements.every(a=>!a.unlocked && a.progress===0));
 for(const name of ['king','victory','mastery']){const art=await fetch(base+`/activity/achievements/${name}.webp`);assert.equal(art.status,200);await art.arrayBuffer();}
 console.log('PASS',base,'guest blocked; authenticated six-badge response; generated artwork served');
 assert.deepEqual([...new Set(d.achievements.map(a=>a.tier))].sort(),['Epic','Legendary','Normal','Rare']);
 const card=await fetch(base+'/api/chaos/achievements/image?badge=king-taker');
 assert.equal(card.status,200);assert.match(card.headers.get('content-type'),/image\/png/);
 const bytes=Buffer.from(await card.arrayBuffer());assert.equal(bytes.readUInt32BE(16),1200);assert.equal(bytes.readUInt32BE(20),630);
 console.log('PASS',base,'difficulty tiers and 1200×630 social card');
}
const share=await fetch('https://chaos.firechess.com/share?match=1cabf784-e038-40f2-a46c-ab3302d4273f%3A0&achievement=king-taker');
assert.equal(share.status,200);const html=await share.text();
assert.ok(html.includes('Epic achievement: Crown snatcher'));assert.ok(html.includes('/api/chaos/achievements/image?badge=king-taker'));
console.log('PASS public achievement replay page and social metadata');
