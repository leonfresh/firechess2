/**
 * GET  /api/account/chaos-username — return the current user's chaos username
 * PATCH /api/account/chaos-username — set/update it
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq, and, ne } from "drizzle-orm";

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,20}$/;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [row] = await db
    .select({ chaosUsername: users.chaosUsername })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  return NextResponse.json({ chaosUsername: row?.chaosUsername ?? null });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const username =
    typeof (body as { username?: unknown }).username === "string"
      ? (body as { username: string }).username.trim()
      : null;

  if (!username) {
    return NextResponse.json(
      { error: "username is required" },
      { status: 400 },
    );
  }

  if (!USERNAME_RE.test(username)) {
    return NextResponse.json(
      {
        error:
          "Username must be 3–20 characters and contain only letters, numbers, hyphens, or underscores.",
      },
      { status: 400 },
    );
  }

  // Check uniqueness (excluding current user)
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(eq(users.chaosUsername, username), ne(users.id, session.user.id)),
    )
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "That username is already taken." },
      { status: 409 },
    );
  }

  await db
    .update(users)
    .set({ chaosUsername: username })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ chaosUsername: username });
}
