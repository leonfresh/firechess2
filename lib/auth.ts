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
import Resend from "next-auth/providers/resend";
import type { OAuthConfig } from "next-auth/providers";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { isAdmin as checkIsAdmin } from "@/lib/admin";

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
  providers: [
    Google,
    Lichess,
    Resend({
      from: process.env.AUTH_RESEND_FROM ?? "FireChess <noreply@firechess.com>",
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user;
      const path = nextUrl.pathname;

      // Only a small set of routes are truly private (require login).
      // Everything else is public so Googlebot can crawl all landing pages
      // and new routes are public by default without needing to be listed here.
      const privatePaths = [
        "/account", // personal settings / billing
        "/admin", // admin panel
      ];

      const isPrivate = privatePaths.some(
        (p) => path === p || path.startsWith(p + "/"),
      );

      if (!isPrivate) return true;

      // Private routes require login
      return isLoggedIn;
    },
    async jwt({ token, user, trigger }) {
      // On sign-in (user is populated) or explicit refresh, load plan + admin from DB
      if (user?.id || trigger === "update") {
        const userId = (user?.id ?? token.sub) as string;

        const [sub] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.userId, userId))
          .limit(1);

        const admin = await checkIsAdmin(userId);

        token.sub = userId;
        token.plan = admin ? "lifetime" : (sub?.plan ?? "free");
        token.subscriptionStatus = sub?.status ?? "active";
        token.isAdmin = admin;
      }
      return token;
    },
    async session({ session, token }) {
      // Read everything from the JWT cookie — zero DB queries
      session.user.id = token.sub as string;
      (session as any).plan = token.plan;
      (session as any).subscriptionStatus = token.subscriptionStatus;
      (session as any).isAdmin = token.isAdmin;
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Seed a free subscription row for every new user
      if (user.id) {
        await db
          .insert(subscriptions)
          .values({
            userId: user.id,
            plan: "free",
            status: "active",
          })
          .onConflictDoNothing();
      }
    },
  },
});
