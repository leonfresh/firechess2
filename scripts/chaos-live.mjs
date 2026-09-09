import { WebSocketServer, WebSocket } from 'ws';

// Membership is checked by the same API that commits commands. Never accept a
// room subscription, player identity, or proposed board as authoritative here.
export function attachChaosLive(server, { apiOrigin, events = process }) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 110_000 });
  const notify = roomId => {
    for (const socket of wss.clients) {
      if (socket.roomId === roomId && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'changed' }));
      }
    }
  };
  events.on('chaos:commit', notify);
  server.on('upgrade', (req, socket, head) => {
    if (!['/api/chaos/live', '/.proxy/api/chaos/live'].includes(req.url?.split('?')[0])) return;
    // Browser cookies must not be usable from an unrelated site's WebSocket.
    const origin = req.headers.origin;
    const forwardedHost = req.headers['x-forwarded-host']?.split(',')[0].trim();
    if (origin) {
      let host;
      try { host = new URL(origin).host; } catch { socket.destroy(); return; }
      if (host !== req.headers.host && host !== forwardedHost) { socket.destroy(); return; }
    }
    wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, req));
  });
  wss.on('connection', (socket, req) => {
    let busy = false;
    socket.alive = true;
    const authTimeout = setTimeout(() => socket.close(1008, 'Authenticate first'), 10_000);
    socket.on('pong', () => { socket.alive = true; });
    socket.on('error', () => {});
    socket.on('close', () => clearTimeout(authTimeout));
    socket.on('message', async raw => {
      if (busy) { socket.close(1008, 'One request at a time'); return; }
      busy = true;
      try {
        const message = JSON.parse(raw.toString());
        if (typeof message.id !== 'string' || message.id.length > 80 ||
            typeof message.roomId !== 'string' || message.roomId.length > 80 ||
            !['read', 'command'].includes(message.type) ||
            (socket.roomId && socket.roomId !== message.roomId) ||
            (!socket.roomId && message.type !== 'read')) throw new Error('Invalid request');
        const since = Number.isSafeInteger(message.since) ? message.since : -1;
        const url = new URL('/api/chaos/sync', apiOrigin);
        const headers = { 'Content-Type': 'application/json' };
        if (req.headers.cookie) headers.Cookie = req.headers.cookie;
        if (typeof message.guestId === 'string') headers['X-Guest-Id'] = message.guestId;
        if (message.type === 'read') {
          url.searchParams.set('roomId', message.roomId);
          url.searchParams.set('since', String(since));
        }
        const response = await fetch(url, {
          method: message.type === 'read' ? 'GET' : 'POST', headers,
          body: message.type === 'command' ? JSON.stringify({ ...message.action, roomId: message.roomId, since }) : undefined,
          signal: AbortSignal.timeout(10_000),
        });
        const data = await response.json();
        const firstSubscription = !socket.roomId && response.ok;
        if (response.ok) { socket.roomId = message.roomId; clearTimeout(authTimeout); }
        if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'response', id: message.id, status: response.status, data }));
        // Cover a commit between the initial database read and registration.
        if (firstSubscription && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'changed' }));
        if (response.status === 401 || response.status === 403 || response.status === 404) socket.close(1008, 'Room unavailable');
      } catch {
        socket.close(1011, 'Request failed; reconnect');
      } finally { busy = false; }
    });
  });
  const heartbeat = setInterval(() => {
    for (const socket of wss.clients) {
      if (!socket.alive) { socket.terminate(); continue; }
      socket.alive = false;
      socket.ping();
    }
  }, 15_000);
  heartbeat.unref();
  return () => {
    clearInterval(heartbeat);
    events.off('chaos:commit', notify);
    for (const socket of wss.clients) socket.terminate();
    wss.close();
  };
}
