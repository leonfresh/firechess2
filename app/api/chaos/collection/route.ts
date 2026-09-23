import { readChaosMastery } from "@/lib/chaos-mastery";
import { ALL_ANOMALIES } from "@/lib/chaos-anomalies";
import { ownsAnomaly } from "@/lib/chaos-anomaly-unlocks";
/**
 * GET  /api/chaos/collection           — returns the caller's unlocked modifier IDs
 * GET  /api/chaos/collection?user=name — public: returns a user's unlocked IDs by display name
 * POST /api/chaos/collection           — body: { modifierId } — adds an unlock for the caller
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  chaosUnlocks,
  users,
  chaosRatings,
  chaosPlayers,
  chaosGoldLedger,
  chaosPlayerUnlock,
} from "@/lib/schema";
import { and, eq, gt, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getChaosUserId, isGuestId } from "@/lib/chaos-auth";
import { GUEST_UNLOCKED_IDS } from "@/lib/chaos-collection";
import { ACTIVE_MODIFIERS, SHOP_CARD_IDS } from "@/lib/chaos-chess";
import { fullShopCatalog, ownedShopIds } from "@/lib/chaos-shop";

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
      total: ACTIVE_MODIFIERS.length,
    });
  }

  // Authenticated user's own collection
  const session = await auth();

  // Gold and shop unlocks are keyed by chaos_player id. Inside Discord the activity sends
  // X-Chaos-Identity (a discord_<snowflake>); a website session uses the user id, which is a
  // chaos_player id too.
  const resolvedId = await getChaosUserId(req);
  const playerId = resolvedId && !isGuestId(resolvedId) ? resolvedId : null;
  const { gold, goldWeek } = await readGold(playerId);
  const ownedShop = playerId ? await readShopUnlocks(playerId) : [];
  const ownedSet = new Set(ownedShop);
  const anomalyUnlockedIds = ALL_ANOMALIES.filter(a=>ownsAnomaly(a.id,ownedShop)).map(a=>a.id);
  const mastery = await readChaosMastery(playerId);
  const shop = fullShopCatalog().map((card) => ({ ...card, owned: ownedSet.has(card.id) }));

  if (!session?.user?.id) {
    // Guest: every base card is free, plus anything their identity has bought, plus their gold
    return NextResponse.json({
      unlockedIds: [...GUEST_UNLOCKED_IDS, ...ownedShopIds(ownedShop)],
      total: ACTIVE_MODIFIERS.length,
      shop, anomalyUnlockedIds, mastery,
      gold,
      goldWeek,
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

  // Base set plus website unlocks plus bought cards. There is no games-played ladder any more:
  // every base card is free, and the shop is the only gate left.
  const unlocked = new Set([
    ...GUEST_UNLOCKED_IDS,
    ...rows.map((r) => r.modifierId),
    ...ownedShopIds(ownedShop),
  ]);

  return NextResponse.json({
    unlockedIds: [...unlocked],
    total: ACTIVE_MODIFIERS.length,
    gamesPlayed,
    shop, anomalyUnlockedIds, mastery,
    gold,
    goldWeek,
  });
}

/** Shop cards this player has bought. Empty for a signed-out visitor with no Discord identity. */
async function readShopUnlocks(playerId: string): Promise<string[]> {
  const rows = await db
    .select({ modifierId: chaosPlayerUnlock.modifierId })
    .from(chaosPlayerUnlock)
    .where(eq(chaosPlayerUnlock.playerId, playerId));
  return rows.map(r=>r.modifierId);
}

/**
 * Gold balance for a chaos_player id: total plus the last 7 days, both null when the id is unknown
 * (a signed-out player, or someone who has never finished a game). Read-only.
 */
async function readGold(
  playerId: string | null,
): Promise<{ gold: number | null; goldWeek: number | null }> {
  if (!playerId) return { gold: null, goldWeek: null };
  const rows = await db
    .select({ gold: chaosPlayers.gold })
    .from(chaosPlayers)
    .where(eq(chaosPlayers.id, playerId))
    .limit(1);
  if (rows.length === 0) return { gold: null, goldWeek: null };
  const week = await db
    .select({ total: sql<number>`coalesce(sum(${chaosGoldLedger.amount}), 0)::int` })
    .from(chaosGoldLedger)
    .where(
      and(
        eq(chaosGoldLedger.playerId, playerId),
        gt(chaosGoldLedger.createdAt, sql`now() - interval '7 days'`),
      ),
    );
  return { gold: rows[0].gold, goldWeek: week[0]?.total ?? 0 };
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
  if (!ACTIVE_MODIFIERS.some((m) => m.id === modifierId)) {
    return NextResponse.json({ error: "Unknown modifier" }, { status: 400 });
  }

  if (SHOP_CARD_IDS.has(modifierId)) {
    return NextResponse.json({ error: "Unlock this power through the gold shop" }, { status: 403 });
  }

  // Insert or ignore (unique constraint prevents duplicates)
  await db
    .insert(chaosUnlocks)
    .values({ userId: session.user.id, modifierId })
    .onConflictDoNothing();

  return NextResponse.json({ ok: true, modifierId });
}
