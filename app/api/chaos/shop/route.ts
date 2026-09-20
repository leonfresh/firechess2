/**
 * GET  /api/chaos/shop — the catalogue, plus what the caller owns
 * POST /api/chaos/shop — body: { cardId } — buy one card with gold
 *
 * Prices live in lib/chaos-shop.ts and are read server-side, so the client can neither choose a
 * price nor spend gold it does not have. The database locks the balance and commits the purchase atomically.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chaosPlayerUnlock } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { getChaosUserId, isGuestId } from "@/lib/chaos-auth";
import { ALL_MODIFIERS } from "@/lib/chaos-chess";
import { isShopCard, priceOf, shopCatalog } from "@/lib/chaos-shop";

/** The chaos_player id behind a request: the activity's identity header, else the website session. */
async function callerId(req: NextRequest): Promise<string | null> {
  const id = await getChaosUserId(req);
  return id && !isGuestId(id) ? id : null;
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

  const result = await db.execute(sql`select * from buy_chaos_power(${playerId}, ${cardId}, ${price})`);
  const purchase = result.rows[0] as { outcome: string; balance: number } | undefined;
  if (purchase?.outcome === "owned") {
    return NextResponse.json({ error: "Already in your collection" }, { status: 409 });
  }
  if (purchase?.outcome === "insufficient") {
    return NextResponse.json({ error: "Not enough gold" }, { status: 402 });
  }
  if (purchase?.outcome !== "purchased") {
    return NextResponse.json({ error: "Purchase could not be completed" }, { status: 503 });
  }
  return NextResponse.json({ ok: true, cardId, price, gold: purchase.balance });
}
