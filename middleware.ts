/**
 * Next.js middleware — Auth.js session check.
 *
 * Public routes: /, /pricing, /auth/*, /api/auth/*, /api/webhooks/*
 * Everything else requires authentication.
 *
 * next-intl route-based middleware was reverted here: it requires every
 * page to live under app/[locale]/..., which this app was never migrated
 * to, and was 404ing the entire site. Messages/hreflang scaffolding in
 * app/layout.tsx stays in place (it safely defaults to "en") for a future
 * proper [locale] migration.
 */

export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|stockfish-18-lite\\.js|stockfish-18-lite\\.wasm|stockfish\\.wasm|stockfish\\.worker\\.js|sitemap\\.xml|robots\\.txt|manifest\\.webmanifest|sounds/|api/feedback/inbound|.*\\.(?:svg|png|jpg|jpeg|gif|webp|wasm)$).*)",
  ],
};
