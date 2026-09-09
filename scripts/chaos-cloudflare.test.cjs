const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
const { webcrypto } = require('node:crypto');
const path = require('node:path');
const root = path.join(__dirname, '..');
const secret = 'isolated-test-secret';
const tokenModule = { exports: {} };
vm.runInNewContext(ts.transpile(fs.readFileSync(path.join(root, 'lib/chaos-live-token.ts'), 'utf8'), { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }), {
  module: tokenModule, exports: tokenModule.exports, require, Buffer, process: { env: { CHAOS_LIVE_SECRET: secret } },
});
const { createLiveToken, readLiveToken } = tokenModule.exports;
function gateway(fetch = async () => Response.json({ revision: 1 })) {
  const context = { crypto: webcrypto, TextEncoder, TextDecoder, atob, Uint8Array, URL, Response, AbortSignal, performance, fetch,
    DurableObject: class { constructor(ctx, env) { this.ctx = ctx; this.env = env; } }, exports: {} };
  const source = fs.readFileSync(path.join(root, 'workers/chaos-live/src/index.js'), 'utf8')
    .replace("import { DurableObject } from 'cloudflare:workers';", '')
    .replace('export default {', 'exports.worker = {').replace('export class ChaosRoom', 'class ChaosRoom');
  vm.runInNewContext(source + '\nexports.ChaosRoom = ChaosRoom; exports.identity = identity;', context);
  return context.exports;
}
test('room tickets verify across Node and Workers and reject tampering or another room', async () => {
  const token = createLiveToken('room-a', 'member');
  assert.equal(readLiveToken(token, 'room-a'), 'member');
  assert.equal(readLiveToken(token, 'room-b'), null);
  assert.equal(readLiveToken(token + 'x', 'room-a'), null);
  const { identity } = gateway();
  assert.equal((await identity(token, 'room-a', secret)).userId, 'member');
  assert.equal(await identity(token, 'room-b', secret), null);
  assert.equal(await identity(token, 'room-a', 'wrong'), null);
});
test('public gateway blocks unsigned subscriptions, cross-origin access, and forged notifications', async () => {
  const { worker } = gateway(); let forwards = 0;
  const env = { CHAOS_LIVE_SECRET: secret, ALLOWED_ORIGINS: 'https://game.example', ROOMS: { getByName: () => ({ fetch: () => { forwards++; return new Response('ok'); } }) } };
  const url = 'https://live.example/api/chaos/live?roomId=room-a';
  const headers = { Origin: 'https://game.example', Upgrade: 'websocket' };
  assert.equal((await worker.fetch(new Request(url, { headers }), env)).status, 401);
  headers['Sec-WebSocket-Protocol'] = 'chaos-v1, chaos-token.' + createLiveToken('room-a', 'member');
  assert.equal((await worker.fetch(new Request(url, { headers }), env)).status, 200);
  headers.Origin = 'https://outsider.example';
  assert.equal((await worker.fetch(new Request(url, { headers }), env)).status, 403);
  assert.equal((await worker.fetch(new Request('https://live.example/notify?roomId=room-a', { method: 'POST' }), env)).status, 401);
  assert.equal(forwards, 1);
});
test('hibernated sessions restore credentials and forward the original action ID', async () => {
  const requests = [], messages = [];
  const { ChaosRoom } = gateway(async (url, options) => { requests.push({ url: String(url), ...options }); return Response.json({ revision: 1 }); });
  const attachment = { roomId: 'room-a', token: createLiveToken('room-a', 'member'), initialized: true };
  const ws = { deserializeAttachment: () => attachment, send: raw => messages.push(JSON.parse(raw)), close: code => assert.fail('Unexpected close ' + code) };
  const ctx = { getWebSockets: () => [ws] }, env = { CHAOS_LIVE_SECRET: secret, API_ORIGIN: 'https://api.example' };
  // A fresh object has no in-memory socket registry, just runtime attachments.
  const room = new ChaosRoom(ctx, env);
  await room.webSocketMessage(ws, JSON.stringify({ id: 'request', roomId: 'room-a', type: 'command', action: { id: 'stable-retry', baseRevision: 0 } }));
  assert.equal(JSON.parse(requests[0].body).id, 'stable-retry');
  assert.equal(requests[0].headers['X-Chaos-Live-Token'], attachment.token);
  assert.equal(messages[0].status, 200);
  await room.fetch(new Request('https://live.example/notify?roomId=room-a', { method: 'POST' }));
  assert.equal(messages[1].type, 'changed');
});
test('gateway wakes opponents after a committed command, but not a rejected one', async () => {
  let status=200; const notifications=[];
  const {ChaosRoom}=gateway(async()=>Response.json({revision:1},{status}));
  const member={deserializeAttachment:()=>({roomId:'room-a',token:createLiveToken('room-a','member'),initialized:true}),send(){},close(){assert.fail('Unexpected close');}};
  const opponent={send:raw=>notifications.push(JSON.parse(raw)),close(){}};
  const room=new ChaosRoom({getWebSockets:()=>[member,opponent]},{CHAOS_LIVE_SECRET:secret,API_ORIGIN:'https://api.example'});
  const command=JSON.stringify({id:'request',type:'command',roomId:'room-a',action:{id:'stable'}});
  await room.webSocketMessage(member,command);
  assert.equal(notifications.length,1);assert.equal(notifications[0].type,'changed');
  status=409;await room.webSocketMessage(member,command);assert.equal(notifications.length,1);
  status=200;member.send=()=>{throw new Error('Submitter disconnected');};
  await room.webSocketMessage(member,command);assert.equal(notifications.length,2);
});

test('durable alarm settles a room with zero connected players and schedules its next deadline', async () => {
  const values=new Map(), alarms=[], calls=[];
  const storage={get:async k=>values.get(k),put:async(k,v)=>values.set(k,v),setAlarm:async t=>alarms.push(t),deleteAlarm:async()=>alarms.push(null)};
  const {ChaosRoom}=gateway(async(url,options)=>{calls.push({url:String(url),options});return Response.json({revision:8,snapshot:{nextDeadline:Date.now()+120000}})});
  const env={CHAOS_LIVE_SECRET:secret,API_ORIGIN:'https://api.example'},ctx={storage,getWebSockets:()=>[]};
  let room=new ChaosRoom(ctx,env);await room.schedule('room-a',Date.now()+20000,7);
  room=new ChaosRoom(ctx,env);await room.alarm();
  assert.equal(calls.length,1);assert.equal(calls[0].options.headers['X-Chaos-Alarm'],'1');
  assert.equal(calls[0].options.headers['X-Chaos-Gateway-Secret'],secret);
  assert.equal(values.get('wake').revision,8);assert.equal(alarms.length,2);
  await room.schedule('room-a',Date.now()+999999,6);assert.equal(alarms.length,2,'stale response must not postpone the alarm');
});

test('alarm failure is retriable and finished games cancel their alarm', async () => {
 const values=new Map(),alarms=[];
 const storage={get:async k=>values.get(k),put:async(k,v)=>values.set(k,v),setAlarm:async t=>alarms.push(t),deleteAlarm:async()=>alarms.push(null)};
 let status=503;
 const {ChaosRoom}=gateway(async()=>Response.json({revision:9,snapshot:{nextDeadline:null}},{status}));
 const room=new ChaosRoom({storage,getWebSockets:()=>[]},{CHAOS_LIVE_SECRET:secret,API_ORIGIN:'https://api.example'});
 await room.schedule('room-a',Date.now()+1000,8);await assert.rejects(()=>room.alarm(),/could not be settled/);
 status=200;await room.alarm();assert.equal(alarms.at(-1),null);
});
