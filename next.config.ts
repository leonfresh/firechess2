import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Stockfish JS hardcodes "stockfish.wasm" — redirect to our actual file
      { source: "/stockfish.wasm", destination: "/stockfish-18-lite.wasm" },
      { source: "/stockfish.worker.js", destination: "/stockfish-18-lite.js" },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // "credentialless" enables SharedArrayBuffer (needed for Stockfish
          // WASM threads) while still allowing cross-origin fetch() to APIs
          // like explorer.lichess.ovh and api.chess.com that don't send CORP.
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" }
        ]
      },
      {
        source: "/stockfish-18-lite.wasm",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
          { key: "Content-Type", value: "application/wasm" }
        ]
      },
      {
        source: "/stockfish-18-lite.js",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" }
        ]
      },
      {
        source: "/stockfish.wasm",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
          { key: "Content-Type", value: "application/wasm" }
        ]
      },
      {
        source: "/stockfish.worker.js",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" }
        ]
      }
    ];
  }
};

export default nextConfig;
