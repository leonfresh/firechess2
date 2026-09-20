/**
 * Chaos matchmaking pairing test — same account class first, any open room as fallback.
 *
 *   node scripts/chaos-matchmaking-pairing-http-test.mjs
 *
 * Signed-in seekers must be paired with signed-in hosts (that pair is what makes a game rated),
 * guest seekers with guest hosts, and the pool falls back to any open room instead of dead-ending.
 * Runs against CHAOS_TEST_ORIGIN (default: the Discord activity proxy) with real tokens, and
 * removes every fixture it creates.
 */
import assert from 'node:assert/strict';
import {randomUUID, createHmac} from 'node:crypto';
import {readFileSync} from 'node:fs';
import dotenv from 'dotenv';
import {neon} from '@neondatabase/serverless';
dotenv.config({path: '.vercel/playtest-production.env', quiet: true});
const sql = neon(process.env.DATABASE_URL);
process.env.CHAOS_LIVE_SECRET = JSON.parse(readFileSync('.vercel/chaos-live-secrets.json', 'utf8')).CHAOS_LIVE_SECRET;
const base = process.env.CHAOS_TEST_ORIGIN || 'https://1546003954616500245.discordsays.com/.proxy';
const uid = () => 'discord_00000' + String(BigInt('0x' + randomUUID().replaceAll('-', '').slice(0, 10))).padStart(12, '0').slice(-12);
function token(id) {
  const p = Buffer.from(JSON.stringify({aud: 'chaos-dicord-v1'.replace('dicord', 'discord'), sub: id, exp: Date.now() + 600000})).toString('base64url');
  return p + '.' + createHmac('sha256', process.env.CHAOS_LIVE_SECRET).update(p).digest('base64url');
}
const CLOCK = 'base=300&inc=3&draftProtocol=2';
const rooms = [], players = [];
const signed = uid(), signedSeeker = uid(), guests = [randomUUID(), randomUUID(), randomUUID()].map(g => 'guest_' + g);

async function post(path, body, {identity, guest} = {}) {
  const r = await fetch(base + path, {method: 'POST', headers: {'Content-Type': 'application/json', ...(identity ? {'X-Chaos-Identity': token(identity)} : {}), ...(guest ? {'X-Guest-Id': guest} : {})}, body: JSON.stringify(body)});
  const d = await r.json();
  assert.equal(r.status, 200, path + ' -> ' + JSON.stringify(d));
  return d;
}
async function seek({identity, guest}) {
  const r = await fetch(base + `/api/chaos/matchmake?${CLOCK}`, {headers: {...(identity ? {'X-Chaos-Identity': token(identity)} : {}), ...(guest ? {'X-Guest-Id': guest} : {})}});
  const d = await r.json();
  assert.equal(r.status, 200, 'seek -> ' + JSON.stringify(d));
  return d;
}
async function challenge({identity, guest}) {
  const d = await post('/api/chaos/matchmake', {timeControlSeconds: 300, incrementSeconds: 3, draftProtocol: 2}, {identity, guest});
  rooms.push(d.roomId);
  return d;
}

try {
  await sql`insert into chaos_player(id,name) values(${signed},'Pairing test signed'),(${signedSeeker},'Pairing test seeker')`;
  players.push(signed, signedSeeker);

  // Signed seeker must take the signed challenge, not the guest one posted alongside it.
  const signedRoom = await challenge({identity: signed});
  const guestRoom = await challenge({guest: guests[0]});
  const signedTake = await seek({identity: signedSeeker});
  assert.equal(signedTake.roomId, signedRoom.roomId, 'signed seeker must prefer the signed challenge');

  // Guest seeker must take the guest challenge, leaving the signed one alone.
  const guestTake = await seek({guest: guests[1]});
  assert.equal(guestTake.roomId, guestRoom.roomId, 'guest seeker must prefer the guest challenge');

  // Signed seeker with only guest hosts waiting: falls back instead of dead-ending.
  const guestRoom2 = await challenge({guest: guests[2]});
  const fallback = await seek({identity: uid()});
  assert.equal(fallback.roomId, guestRoom2.roomId, 'signed seeker must fall back to an open guest room');

  // "In this call": a challenge posted by someone who launched this activity instance is flagged.
  await sql`insert into chaos_launch (id, player_id, guild_id, channel_id, instance_id)
    values (${randomUUID()}, ${signed}, '1234567890123456789', '1234567890123456789', 'pairing-test-instance')`;
  const inCallRoom = await challenge({identity: signed});
  const scoped = await fetch(`${base}/api/chaos/matchmake?${CLOCK.replace('draftProtocol=2', 'list=1')}&instance=pairing-test-instance`, {headers: {'X-Chaos-Identity': token(signedSeeker)}});
  const scopedBody = await scoped.json();
  assert.equal(scoped.status, 200, JSON.stringify(scopedBody));
  const flagged = scopedBody.rooms.find(r => r.roomCode === inCallRoom.roomCode);
  assert.equal(flagged?.sameInstance, true, 'same-instance challenge must be flagged');
  assert.deepEqual(scopedBody.rooms.filter(r => r.sameInstance).map(r => r.roomCode), [inCallRoom.roomCode],
    'only challenges from this instance may be flagged');
  assert.ok(!JSON.stringify(scopedBody.rooms).includes(signed), 'listing must not leak player ids');

  console.log('PASS: signed-with-signed and guest-with-guest pairing, fallback, and in-this-call flagging.');
} finally {
  for (const id of rooms) await sql`delete from chaos_room where id=${id}`;
  for (const id of players) await sql`delete from chaos_launch where player_id=${id}`;
  for (const id of players) await sql`delete from chaos_player where id=${id}`;
  console.log('Pairing fixtures removed.');
}
