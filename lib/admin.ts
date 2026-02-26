/**
 * Admin utilities — identifies the admin user and provides helpers.
 *
 * Admin = the user whose Lichess account has username "leonfresh".
 */

import { db } from "@/lib/db";
import { accounts } from "@/lib/schema";
import { and, eq } from "drizzle-orm";

/** The Lichess username that has admin privileges. */
export const ADMIN_LICHESS_USERNAME = "leonfresh";

/**
 * Check whether a given userId is the admin.
 * Looks up the accounts table for a Lichess provider row with providerAccountId "leonfresh".
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ providerAccountId: accounts.providerAccountId })
    .from(accounts)
    .where(
      and(
        eq(accounts.userId, userId),
        eq(accounts.provider, "lichess"),
        eq(accounts.providerAccountId, ADMIN_LICHESS_USERNAME),
      ),
    )
    .limit(1);

  return !!row;
}
