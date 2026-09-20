/**
 * GET  /api/chaos/shop — the catalogue, plus what the caller owns
 * POST /api/chaos/shop — body: { cardId } — buy one card with gold
 *
 * Prices live in lib/chaos-shop.ts and are read server-side, so the client can neither choose a
 * price nor spend gold it does not have: the deduction is guarded by `gold >= price` in SQL.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chaosPlayers, chaosGoldLedger, chaosPlayerUnlock } from "@/lib/schema";
import { and, eq, gte, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { ALL_MODIFIERS } from "@/lib/chaos-chess";
import { isShopCard, priceOf, shopCatalog } from "@/lib/chaos-shop";

/** The chaos_player id behind a request: the activity's identity header, else the website session. */
async function callerId(req: NextRequest): Promise<string | null> {
  const session = await auth();
  return req.headers.get("x-chaos-identity") || session?.user?.id || null;
}

async function ownedIds(playerId: string | null): Promise<string[]> {
  if (!playerId) return [];
  const rows = await db
    .select({ modifierId: chaosPlayerUnlock.modifierId })
    .from(chaosPlayerUnlock)
    .where(eq(chaosPlayerUnlock.playerId, playerId));
  return rows.map((r) => r.modifierId);
}

export async function GET(req: NextRequest) {
  const owned = new Set(await ownedIds(await callerId(req)));
  return NextResponse.json({
    cards: shopCatalog().map((card) => ({ ...card, owned: owned.has(card.id) })),
  });
}

export async function POST(req: NextRequest) {
  const playerId = await callerId(req);
  if (!playerId) {
    return NextResponse.json(
      { error: "Play from Discord or sign in to keep a collection" },
      { status: 401 },
    );
  }

  let body: { cardId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const cardId = body.cardId;
  const mod = cardId ? ALL_MODIFIERS.find((m) => m.id === cardId) : undefined;
  if (!cardId || !mod || !isShopCard(cardId)) {
    return NextResponse.json({ error: "Unknown card" }, { status: 400 });
  }
  const price = priceOf(mod);
  if (price === null) {
    return NextResponse.json({ error: "Not for sale" }, { status: 400 });
  }

  // Claim the card first. The insert is idempotent, so a replayed or double-clicked request gets a
  // 409 and is charged nothing; whoever inserts the row is the request that pays.
  const claim = await db
    .insert(chaosPlayerUnlock)
    .values({
      id: `${playerId}:${cardId}`,
      playerId,
      modifierId: cardId,
      pricePaid: price,
      source: "shop",
    })
    .onConflictDoNothing()
    .returning({ id: chaosPlayerUnlock.id });
  if (claim.length === 0) {
    return NextResponse.json({ error: "Already in your collection" }, { status: 409 });
  }

  // Pay. The guard is in SQL, so two devices cannot both spend the same gold.
  const paid = await db
    .update(chaosPlayers)
    .set({ gold: sql`${chaosPlayers.gold} - ${price}` })
    .where(and(eq(chaosPlayers.id, playerId), gte(chaosPlayers.gold, price)))
    .returning({ gold: chaosPlayers.gold });

  if (paid.length === 0) {
    // Not enough gold: release the claim so the card goes back on the shelf.
    await db.delete(chaosPlayerUnlock).where(eq(chaosPlayerUnlock.id, `${playerId}:${cardId}`));
    return NextResponse.json({ error: "Not enough gold" }, { status: 402 });
  }

  // Record the spend, so "why is my balance this" is always answerable from the ledger.
  await db
    .insert(chaosGoldLedger)
    .values({
      id: `${playerId}:${cardId}:unlock`,
      playerId,
      matchId: null,
      amount: -price,
      reason: "unlock",
    })
    .onConflictDoNothing();

  return NextResponse.json({ ok: true, cardId, price, gold: paid[0].gold });
}
