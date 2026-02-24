/**
 * Auth.js v5 (NextAuth) configuration.
 *
 * Providers: Google + Lichess.  Add OAuth credentials in .env.local:
 *   AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET
 *   AUTH_LICHESS_ID (no secret needed — Lichess uses PKCE)
 *   AUTH_SECRET  (random 32-char string — run `npx auth secret`)
 */

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { OAuthConfig } from "next-auth/providers";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/schema";
import { eq } from "drizzle-orm";

/** Custom Lichess OAuth2 provider — PKCE, no client secret. */
function Lichess(): OAuthConfig<any> {
  return {
    id: "lichess",
    name: "Lichess",
    type: "oauth",
    clientId: process.env.AUTH_LICHESS_ID,
    // Lichess uses PKCE — no client secret. Must be explicitly undefined
    // so Auth.js sends client_id in the body instead of via Basic auth.
    clientSecret: undefined as unknown as string,
    authorization: {
      url: "https://lichess.org/oauth",
      params: { scope: "" },
    },
    checks: ["pkce", "state"],
    token: {
      url: "https://lichess.org/api/token",
      conform: async (response: Response) => {
        // Lichess returns correct JSON, but ensure content-type is set
        if (response.ok) return response;
        return response;
      },
    },
    userinfo: "https://lichess.org/api/account",
    profile(profile) {
      return {
        id: profile.id,
        name: profile.username,
        email: profile.email ?? null, // Lichess doesn't expose email
        image: null,
      };
    },
    client: {
      token_endpoint_auth_method: "none",
    },
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [Google, Lichess],
  pages: {
    signIn: "/auth/signin",
  },
  session: { strategy: "database" },
  callbacks: {
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user;
      const path = nextUrl.pathname;

      // Public routes — always allowed
      const publicPaths = ["/", "/pricing", "/auth", "/dashboard", "/account", "/blog"];
      const isPublic =
        publicPaths.some((p) => path === p || path.startsWith(p + "/")) ||
        path.startsWith("/api/auth") ||
        path.startsWith("/api/webhooks") ||
        path.startsWith("/api/me") ||
        path.startsWith("/api/reports");

      if (isPublic) return true;

      // Protected routes require login
      return isLoggedIn;
    },
    async session({ session, user }) {
      // Attach userId + plan to the client session
      session.user.id = user.id;

      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, user.id))
        .limit(1);

      (session as any).plan = sub?.plan ?? "free";
      (session as any).subscriptionStatus = sub?.status ?? "active";

      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Seed a free subscription row for every new user
      if (user.id) {
        await db.insert(subscriptions).values({
          userId: user.id,
          plan: "free",
          status: "active",
        }).onConflictDoNothing();
      }
    },
  },
});
