/**
 * Per-server standing endpoint — /api/chaos/server?guild=<id>
 *
 *   node scripts/chaos-server-http-test.mjs
 *
 * Builds a private test guild out of two players, one launch row each and a couple of archived
 * games, then asserts the response a Discord server would see (and that the caller's own row is
 * marked). Removes every fixture it creates.
 */
import assert from 'node:assert/strict';
import {randomUUID, createHmac} from 'node:crypto';
import {readFileSync} from 'node:fs';
import dotenv from 'dotenv';
import {neon} from '@neondatabase/serverless';
dotenv.config({path: '.vercel/playtest-production.env', quiet: true});
const sql = neon(process.env.DATABASE_URL);
process.env.CHAOS_LIVE_SECRET = JSON.parse(readFileSync('.vercel/chaos-live-secrets.json', 'utf8')).CHAOS_LIVE_SECRET;
const base = process.env.CHAOS_TEST_ORIGIN || 'https://chaos.firechess.com';
const uid = () => 'discord_00000' + String(BigInt('0x' + randomUUID().replaceAll('-', '').slice(0, 10))).padStart(12, '0').slice(-12);
function token(id) {
  const payload = Buffer.from(JSON.stringify({aud: 'chaos-discord-v1', sub: id, exp: Date.now() + 600000})).toString('base64url');
  return payload + '.' + createHmac('sha256', process.env.CHAOS_LIVE_SECRET).update(payload).digest('base64url');
}
const guild = '900000000000000001';
const host = uid(), guest = uid(), outsider = uid();
const roomA = 'server-room-' + randomUUID(), roomB = 'server-room-' + randomUUID();

try {
  await sql`insert into chaos_player(id,name,rating,games,wins,losses,draws,peak) values
    (${host},'Server test A',1500,4,3,1,0,1500),(${guest},'Server test B',1100,3,1,2,0,1100)`;
  await sql`insert into chaos_launch(id,player_id,guild_id,channel_id,instance_id) values
    (${randomUUID()},${host},${guild},${guild},'server-test-1'),(${randomUUID()},${guest},${guild},${guild},'server-test-2')`;
  await sql`insert into chaos_match(id,room_id,game_number,host_id,guest_id,host_color,winner,reason,rated,record) values
    (${roomA + ':0'},${roomA},0,${host},${guest},'white','white','Checkmate',true,'{"moves":[{"color":"w"},{"color":"b"}]}'::jsonb),
    (${roomB + ':0'},${roomB},0,${host},${guest},'black','white','Resignation',false,'{"moves":[{"color":"w"},{"color":"b"}]}'::jsonb)`;

  const response = await fetch(`${base}/api/chaos/server?guild=${guild}`, {headers: {'X-Chaos-Identity': token(host)}});
  const data = await response.json();
  assert.equal(response.status, 200, JSON.stringify(data));
  assert.equal(data.guild, guild);
  assert.equal(data.players, 2, 'both launching players count');
  assert.equal(data.games, 2, 'games from members in the window');
  assert.equal(data.rated, 1, 'only the rated game counts as rated');
  assert.equal(data.top[0].name, 'Server test A', 'highest rating first');
  assert.equal(data.top[0].rank, 1);
  assert.ok(data.top.some(row => row.yours === true), "the caller's own row is marked");
  assert.equal(data.top.find(row => row.yours).name, 'Server test A');

  // A caller with no launch in this guild still gets the standing, but no "you" row.
  const anonymous = await (await fetch(`${base}/api/chaos/server?guild=${guild}`, {headers: {'X-Chaos-Identity': token(outsider)}})).json();
  assert.ok(!anonymous.top.some(row => row.yours), 'outsiders must not be marked as yours');

  assert.equal((await fetch(`${base}/api/chaos/server?guild=nonsense`)).status, 400, 'malformed guild ids are rejected');
  console.log('PASS: per-server standing — members, games, rated split, top rank and caller row, plus junk-guild rejection.');
} finally {
  for (const id of [roomA + ':0', roomB + ':0']) await sql`delete from chaos_match where id=${id}`;
  await sql`delete from chaos_launch where guild_id=${guild}`;
  await sql`delete from chaos_player where id in (${host},${guest})`;
  console.log('Server standing fixtures removed.');
}
