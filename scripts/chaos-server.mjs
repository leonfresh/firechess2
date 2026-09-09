import http from 'node:http';
import https from 'node:https';
import next from 'next';
import nextEnv from '@next/env';
import { attachChaosLive } from './chaos-live.mjs';

const activity = process.argv.includes('--activity');
const dev = process.argv.includes('--dev');
nextEnv.loadEnvConfig(process.cwd(), dev);
const port = Number(process.env.PORT || (activity ? 3001 : 3000));
const isLive = req => ['/api/chaos/live', '/.proxy/api/chaos/live'].includes(req.url?.split('?')[0]);
const server = http.createServer();
// Next installs its own upgrade listener on the supplied HTTP server. Filter
// our endpoint out so its rewrite proxy cannot also write to the same socket.
const nextHttpServer = new Proxy(server, {
  get(target, key) {
    if (key === 'on') return (event, listener) => target.on(event, event === 'upgrade'
      ? (req, socket, head) => { if (!isLive(req)) listener(req, socket, head); }
      : listener);
    return Reflect.get(target, key);
  },
});
const app = next({ dev, dir: process.cwd(), hostname: '0.0.0.0', port, httpServer: nextHttpServer });
await app.prepare();
server.on('request', app.getRequestHandler());
if (activity) {
  const backend = new URL(process.env.FIRECHESS_ORIGIN || 'http://127.0.0.1:3000');
  // Next rewrites handle HTTP; explicitly forward WebSocket upgrades as well.
  server.on('upgrade', (req, socket, head) => {
    if (!isLive(req)) return;
    const upstream = (backend.protocol === 'https:' ? https : http).request(new URL('/api/chaos/live', backend), {
      headers: { ...req.headers, host: backend.host, 'x-forwarded-host': req.headers.host },
    });
    upstream.on('upgrade', (res, peer, upstreamHead) => {
      socket.write(`HTTP/1.1 101 Switching Protocols\r\n${Object.entries(res.headers).map(([k,v]) => `${k}: ${v}`).join('\r\n')}\r\n\r\n`);
      if (upstreamHead.length) socket.write(upstreamHead);
      if (head.length) peer.write(head);
      socket.pipe(peer).pipe(socket);
      peer.on('error', () => socket.destroy());
      socket.on('error', () => peer.destroy());
      socket.on('close', () => peer.destroy());
      peer.on('close', () => socket.destroy());
    });
    upstream.on('response', () => socket.destroy());
    upstream.on('error', () => socket.destroy());
    socket.on('close', () => upstream.destroy());
    upstream.end();
  });
} else {
  attachChaosLive(server, { apiOrigin: `http://127.0.0.1:${port}` });
}
server.listen(port, '0.0.0.0', () => console.log(`Chaos ${activity ? 'Activity' : 'API'} with WebSockets listening on ${port}`));
