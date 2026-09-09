import { DurableObject } from 'cloudflare:workers';

async function identity(token, roomId, secret) {
  try {
    if (!secret || typeof token !== 'string' || token.length > 2048) return null;
    const [payload, signature, extra] = token.split('.');
    if (!payload || !signature || extra) return null;
    const decode = value => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!await crypto.subtle.verify('HMAC', key, decode(signature), new TextEncoder().encode(payload))) return null;
    const data = JSON.parse(new TextDecoder().decode(decode(payload)));
    return data.roomId === roomId && typeof data.userId === 'string' && data.exp > Date.now() ? data : null;
  } catch { return null; }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/health') return Response.json({ service: 'chaos-chess-live', ok: true });
    const roomId = url.searchParams.get('roomId');
    if (!roomId || !/^[a-zA-Z0-9_-]{1,80}$/.test(roomId)) return new Response('Invalid room', { status: 400 });
    if (url.pathname === '/notify') {
      if (request.method !== 'POST' || !env.CHAOS_LIVE_SECRET || request.headers.get('Authorization') !== `Bearer ${env.CHAOS_LIVE_SECRET}`) return new Response('Unauthorized', { status: 401 });
    } else if (url.pathname === '/api/chaos/live') {
      const origin = request.headers.get('Origin');
      if (!origin || !env.ALLOWED_ORIGINS.split(',').includes(origin)) return new Response('Forbidden origin', { status: 403 });
      if (request.method !== 'GET' || request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return new Response('WebSocket required', { status: 426 });
      // The token travels in a subprotocol, never in URLs/access logs.
      const protocols = (request.headers.get('Sec-WebSocket-Protocol') || '').split(',').map(v => v.trim());
      const token = protocols.find(p => p.startsWith('chaos-token.'))?.slice(12);
      const member = await identity(token, roomId, env.CHAOS_LIVE_SECRET);
      if (!member) return new Response('Unauthorized', { status: 401 });
    } else return new Response('Not found', { status: 404 });
    return env.ROOMS.getByName(roomId).fetch(request);
  },
};

export class ChaosRoom extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.busy = new Set();
  }
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/notify') {
      const body = await request.json().catch(() => ({}));
      if ('deadline' in body) await this.schedule(url.searchParams.get('roomId'), body.deadline, body.revision ?? 0);
      for (const ws of this.ctx.getWebSockets()) {
        try { ws.send(JSON.stringify({ type: 'changed' })); } catch { ws.close(1011, 'Reconnect'); }
      }
      return new Response(null, { status: 204 });
    }
    if (this.ctx.getWebSockets().length >= 12) return new Response('Room connection limit', { status: 429 });
    const protocols = request.headers.get('Sec-WebSocket-Protocol').split(',').map(v => v.trim());
    const token = protocols.find(p => p.startsWith('chaos-token.')).slice(12);
    const [client, server] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ token, roomId: url.searchParams.get('roomId'), initialized: false });
    return new Response(null, { status: 101, webSocket: client, headers: { 'Sec-WebSocket-Protocol': 'chaos-v1' } });
  }
  async webSocketMessage(ws, raw) {
    if (this.busy.has(ws)) { ws.close(1008, 'One request at a time'); return; }
    this.busy.add(ws);
    try {
      const session = ws.deserializeAttachment();
      if (!await identity(session.token, session.roomId, this.env.CHAOS_LIVE_SECRET)) { ws.close(1008, 'Renew credentials'); return; }
      if (typeof raw !== 'string' || raw.length > 110_000) { ws.close(1009, 'Message too large'); return; }
      const msg = JSON.parse(raw);
      if (typeof msg.id !== 'string' || msg.id.length > 80 || msg.roomId !== session.roomId || !['read', 'command'].includes(msg.type) || !session.initialized && msg.type !== 'read') { ws.close(1008, 'Invalid request'); return; }
      const url = new URL('/api/chaos/sync', this.env.API_ORIGIN);
      const since = Number.isSafeInteger(msg.since) ? msg.since : -1;
      const options = { headers: { 'Content-Type': 'application/json', 'X-Chaos-Live-Token': session.token, 'X-Chaos-Gateway-Secret': this.env.CHAOS_LIVE_SECRET }, signal: AbortSignal.timeout(8000) };
      if (msg.type === 'read') { url.searchParams.set('roomId', session.roomId); url.searchParams.set('since', since); }
      else { options.method = 'POST'; options.body = JSON.stringify({ ...msg.action, roomId: session.roomId, since }); }
      const apiStarted = performance.now();
      const response = await fetch(url, options), data = await response.json();
      if (response.ok && data.snapshot && 'nextDeadline' in data.snapshot) await this.schedule(session.roomId, data.snapshot.nextDeadline, data.revision);
      const timing = { apiMs: Math.round(performance.now() - apiStarted), server: response.headers?.get("server-timing") ?? null };
      // A disconnected submitter must not suppress delivery to their opponent.
      try { ws.send(JSON.stringify({ type: 'response', id: msg.id, status: response.status, data, timing })); } catch { /* receipt remains durable in the API */ }
      if (response.ok && msg.type === 'command') {
        for (const peer of this.ctx.getWebSockets()) {
          if (peer === ws) continue;
          try { peer.send(JSON.stringify({ type: 'changed' })); } catch { peer.close(1011, 'Reconnect'); }
        }
      }
      if (response.ok && !session.initialized) {
        session.initialized = true; ws.serializeAttachment(session);
        ws.send(JSON.stringify({ type: 'changed' }));
      }
      if ([401, 403, 404].includes(response.status)) ws.close(1008, 'Membership required');
    } catch { ws.close(1011, 'Reconnect to recover'); }
    finally { this.busy.delete(ws); }
  }
  webSocketClose(ws, code) { ws.close(code); this.busy.delete(ws); }
  webSocketError(ws) { ws.close(1011, 'Reconnect'); this.busy.delete(ws); }
  schedule(roomId, deadline, revision = 0, force = false) {
    this.scheduling = (this.scheduling ?? Promise.resolve()).catch(() => {}).then(async () => {
      const previous = this.wake ?? await this.ctx.storage.get('wake');
      if (previous && revision < previous.revision) return;
      if (!force && previous?.deadline === deadline) { this.wake = {...previous, revision}; return; }
      const wake = {roomId, deadline, revision};
      await this.ctx.storage.put('wake', wake);
      if (Number.isFinite(deadline)) await this.ctx.storage.setAlarm(Math.max(Date.now() + 100, deadline));
      else await this.ctx.storage.deleteAlarm();
      this.wake = wake;
    });
    return this.scheduling;
  }
  async alarm() {
    const wake = await this.ctx.storage.get('wake');
    if (!wake) return;
    const url = new URL('/api/chaos/sync', this.env.API_ORIGIN);
    url.searchParams.set('roomId', wake.roomId);
    const response = await fetch(url, {headers: {'X-Chaos-Gateway-Secret': this.env.CHAOS_LIVE_SECRET, 'X-Chaos-Alarm': '1'}, signal: AbortSignal.timeout(8000)});
    if (!response.ok) {
      if ([404, 410].includes(response.status)) { await this.schedule(wake.roomId, null, wake.revision, true); return; }
      throw new Error('Room deadline could not be settled'); // Durable Object alarm retries.
    }
    const data = await response.json();
    await this.schedule(wake.roomId, data.snapshot?.nextDeadline ?? null, data.revision, true);
    for (const ws of this.ctx.getWebSockets()) {
      try { ws.send(JSON.stringify({type: 'changed'})); } catch { /* Reconnect reads durable state. */ }
    }
  }
}
