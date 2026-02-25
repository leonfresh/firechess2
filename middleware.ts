/**
 * Next.js middleware — Auth.js session check.
 *
 * Public routes: /, /pricing, /auth/*, /api/auth/*, /api/webhooks/*
 * Everything else requires authentication.
 */

export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static, _next/image, favicon.ico (Next.js internals)
     * - Public assets (images, wasm, stockfish worker files, sounds, robots.txt)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|stockfish-18-lite\\.js|stockfish-18-lite\\.wasm|stockfish\\.wasm|stockfish\\.worker\\.js|robots\\.txt|sounds/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|wasm)$).*)",
  ],
};
