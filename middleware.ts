import createMiddleware from "next-intl/middleware";
import { auth } from "@/lib/auth";
import { routing } from "./i18n/routing";
import type { NextRequest } from "next/server";

const intlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  return intlMiddleware(req);
}

// Auth middleware runs on API routes and protected pages
export { auth as middleware_auth };

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|stockfish-18-lite\\.js|stockfish-18-lite\\.wasm|stockfish\\.wasm|stockfish\\.worker\\.js|sitemap\\.xml|robots\\.txt|manifest\\.webmanifest|sounds/|api/feedback/inbound|.*\\.(?:svg|png|jpg|jpeg|gif|webp|wasm)$).*)",
  ],
};
