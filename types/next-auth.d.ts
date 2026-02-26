/**
 * Auth.js session type augmentation — adds plan + subscriptionStatus.
 */

import "next-auth";

declare module "next-auth" {
  interface Session {
    plan: "free" | "pro" | "lifetime";
    subscriptionStatus: "active" | "canceled" | "past_due" | "incomplete" | "trialing";
    isAdmin: boolean;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
