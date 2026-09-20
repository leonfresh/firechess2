import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const backend = new URL(process.env.FIRECHESS_ORIGIN || "http://127.0.0.1:3000");
if (!['http:', 'https:'].includes(backend.protocol) || backend.pathname !== '/') {
  throw new Error('FIRECHESS_ORIGIN must be an HTTP(S) origin without a path.');
}
const assets = readdirSync(new URL('../public/', import.meta.url), { withFileTypes: true });

export default {
  // Share the game source, without bringing in the website layout or frame-blocking headers.
  experimental: { externalDir: true },
  outputFileTracingRoot: fileURLToPath(new URL('../', import.meta.url)),
  assetPrefix: '/.proxy',
  async rewrites() {
    return {
      beforeFiles: [{ source: '/.proxy/:path*', destination: '/:path*' }],
      afterFiles: [],
      fallback: [
        { source: '/api/chaos/:path*', destination: `${backend.origin}/api/chaos/:path*` },
        ...assets.map(entry => ({
          source: `/${entry.name}${entry.isDirectory() ? '/:path*' : ''}`,
          destination: `${backend.origin}/${entry.name}${entry.isDirectory() ? '/:path*' : ''}`,
        })),
        { source: '/stockfish.wasm', destination: `${backend.origin}/stockfish-18-lite.wasm` },
      ],
    };
  },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'Content-Security-Policy', value: "frame-ancestors 'self' https://discord.com https://*.discord.com https://*.discordsays.com;" },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    ] }];
  },
};
