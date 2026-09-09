import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { EventEmitter, once } from 'node:events';
import { WebSocket } from 'ws';
import { attachChaosLive } from './chaos-live.mjs';

test('authenticated sockets receive committed updates; outsiders and cross-origin browsers cannot subscribe', async () => {
  const events = new EventEmitter();
  let revision = 0;
  const server = http.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (req.headers['x-guest-id'] !== 'member') { res.writeHead(403); res.end('{"error":"Not in room"}'); return; }
    if (req.method === 'POST') {
      for await (const chunk of req) { /* drain command */ }
      revision++;
      events.emit('chaos:commit', 'room');
    }
    res.end(JSON.stringify({ revision }));
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  const dispose = attachChaosLive(server, { apiOrigin: origin, events });
  const sockets = [];
  async function client(guestId) {
    const socket = new WebSocket(origin.replace('http:', 'ws:') + '/api/chaos/live', { origin });
    sockets.push(socket); await once(socket, 'open');
    const messages = [];
    socket.on('message', raw => messages.push(JSON.parse(raw)));
    const response = once(socket, 'message');
    socket.send(JSON.stringify({ id: 'auth', type: 'read', guestId, roomId: 'room', since: -1 }));
    const [raw] = await response;
    return { socket, messages, auth: JSON.parse(raw) };
  }
  try {
    const a = await client('member'), b = await client('member'), outsider = await client('outsider');
    assert.equal(a.auth.status, 200); assert.equal(outsider.auth.status, 403);
    const received = once(b.socket, 'message');
    a.socket.send(JSON.stringify({ id: 'move', type: 'command', guestId: 'member', roomId: 'room', action: { id: 'stable-action' } }));
    assert.equal(JSON.parse((await received)[0]).type, 'changed');
    assert.equal(revision, 1);
    assert.equal(outsider.messages.some(m => m.type === 'changed'), false);
    const blocked = new WebSocket(origin.replace('http:', 'ws:') + '/api/chaos/live', { origin: 'https://unrelated.example' });
    sockets.push(blocked);
    await new Promise(resolve => blocked.once('error', resolve));
    assert.notEqual(blocked.readyState, WebSocket.OPEN);
  } finally {
    sockets.forEach(s => s.terminate()); dispose(); server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
