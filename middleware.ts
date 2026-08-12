import createMiddleware from "next-intl/middleware";
import { auth as authMiddleware } from "@/lib/auth";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  // Pass through next-intl first (handles locale routing)
  const intlResponse = intlMiddleware(req);
  if (intlResponse) return intlResponse;

  // Then pass through auth
  return authMiddleware(req, {} as any) as any;
}

export const config = {
  matcher: [
    // Match all paths except static/internal — same as original auth matcher + locale prefix
    "/((?!_next/static|_next/image|favicon\\.ico|stockfish-18-lite\\.js|stockfish-18-lite\\.wasm|stockfish\\.wasm|stockfish\\.worker\\.js|sitemap\\.xml|robots\\.txt|manifest\\.webmanifest|sounds/|api/feedback/inbound|.*\\.(?:svg|png|jpg|jpeg|gif|webp|wasm)$).*)",
  ],
};
