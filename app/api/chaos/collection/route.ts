/**
 * GET  /api/chaos/collection           — returns the caller's unlocked modifier IDs
 * GET  /api/chaos/collection?user=name — public: returns a user's unlocked IDs by display name
 * POST /api/chaos/collection           — body: { modifierId } — adds an unlock for the caller
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chaosUnlocks, users, chaosRatings } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { GUEST_UNLOCKED_IDS } from "@/lib/chaos-collection";
import { ALL_MODIFIERS } from "@/lib/chaos-chess";

/* ── GET ─────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("user");

  // Public shareable profile lookup
  if (username) {
    const userRows = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.name, username))
      .limit(1);
    if (userRows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const uid = userRows[0].id;
    const rows = await db
      .select({ modifierId: chaosUnlocks.modifierId })
      .from(chaosUnlocks)
      .where(eq(chaosUnlocks.userId, uid));
    const unlocked = new Set([
      ...GUEST_UNLOCKED_IDS,
      ...rows.map((r) => r.modifierId),
    ]);
    return NextResponse.json({
      username,
      unlockedIds: [...unlocked],
      total: ALL_MODIFIERS.length,
    });
  }

  // Authenticated user's own collection
  const session = await auth();
  if (!session?.user?.id) {
    // Guest: return the default guest set
    return NextResponse.json({
      unlockedIds: [...GUEST_UNLOCKED_IDS],
      total: ALL_MODIFIERS.length,
    });
  }

  const rows = await db
    .select({ modifierId: chaosUnlocks.modifierId })
    .from(chaosUnlocks)
    .where(eq(chaosUnlocks.userId, session.user.id));

  const ratingRows = await db
    .select({ gamesPlayed: chaosRatings.gamesPlayed })
    .from(chaosRatings)
    .where(eq(chaosRatings.userId, session.user.id))
    .limit(1);
  const gamesPlayed = ratingRows[0]?.gamesPlayed ?? 0;

  const unlocked = new Set([
    ...GUEST_UNLOCKED_IDS,
    ...rows.map((r) => r.modifierId),
  ]);

  return NextResponse.json({
    unlockedIds: [...unlocked],
    total: ALL_MODIFIERS.length,
    gamesPlayed,
  });
}

/* ── POST ────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { modifierId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { modifierId } = body;
  if (!modifierId || typeof modifierId !== "string") {
    return NextResponse.json({ error: "modifierId required" }, { status: 400 });
  }

  // Validate that the modifier exists
  if (!ALL_MODIFIERS.some((m) => m.id === modifierId)) {
    return NextResponse.json({ error: "Unknown modifier" }, { status: 400 });
  }

  // Insert or ignore (unique constraint prevents duplicates)
  await db
    .insert(chaosUnlocks)
    .values({ userId: session.user.id, modifierId })
    .onConflictDoNothing();

  return NextResponse.json({ ok: true, modifierId });
}
