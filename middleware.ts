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

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const middleware = auth((request) => {
  // Keep existing game/deep links intact; the clean URL is the public introduction.
  if (request.nextUrl.pathname === "/chaos" && !request.nextUrl.search) {
    // Build the target from the host that was asked, not request.nextUrl: next-auth rewrites that to
    // AUTH_URL (https://firechess.com, no www), which made this "rewrite" a proxy to the apex, whose
    // 308 to www reached visitors. Since 2026-09-10 /chaos answered 308 -> /chaos/about while every
    // page named /chaos canonical: a loop on the one non-brand query that ranks ("chaos chess").
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
    const destination = new URL("/chaos/about", host ? `${proto}://${host}` : request.nextUrl);
    return NextResponse.rewrite(destination);
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|stockfish-18-lite\\.js|stockfish-18-lite\\.wasm|stockfish\\.wasm|stockfish\\.worker\\.js|sitemap\\.xml|robots\\.txt|manifest\\.webmanifest|sounds/|api/feedback/inbound|.*\\.(?:svg|png|jpg|jpeg|gif|webp|wasm)$).*)",
  ],
};
