/**
 * Auth.js session type augmentation — adds plan + subscriptionStatus.
 */

import "next-auth";

declare module "next-auth" {
  interface Session {
    plan: "free" | "pro";
    subscriptionStatus: "active" | "canceled" | "past_due" | "incomplete" | "trialing";
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
