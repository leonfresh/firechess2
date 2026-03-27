/**
 * Auth.js session type augmentation — adds plan + subscriptionStatus.
 */

import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    plan: "free" | "pro" | "lifetime";
    subscriptionStatus:
      | "active"
      | "canceled"
      | "past_due"
      | "incomplete"
      | "trialing";
    isAdmin: boolean;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    plan?: "free" | "pro" | "lifetime";
    subscriptionStatus?:
      | "active"
      | "canceled"
      | "past_due"
      | "incomplete"
      | "trialing";
    isAdmin?: boolean;
  }
}
