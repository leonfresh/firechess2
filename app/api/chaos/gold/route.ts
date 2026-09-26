/**
 * GET /api/chaos/gold[?room=<roomId>] — the caller's gold: balance, one card they can afford
 * (lib/chaos-gold-offer.ts) and, with ?room, the ledger lines the game that just ended in that room
 * paid them. `earned: null` means the game has not been archived yet: the result screen retries.
 */
import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { getChaosUserId, isGuestId } from "@/lib/chaos-auth";
import { fullShopCatalog } from "@/lib/chaos-shop";
import { goldOffer } from "@/lib/chaos-gold-offer";

export async function GET(req: NextRequest) {
  const headers = { "Cache-Control": "no-store" };
  const id = await getChaosUserId(req);
  if (!id || isGuestId(id)) return NextResponse.json({ signedIn: false }, { headers });

  const room = req.nextUrl.searchParams.get("room");
  const [player, owned, match] = await Promise.all([
    db.execute(sql`select gold from chaos_player where id = ${id}`),
    db.execute(sql`select modifier_id from chaos_player_unlock where player_id = ${id}`),
    room
      ? db.execute(sql`select id from chaos_match where room_id = ${room} and (host_id = ${id} or guest_id = ${id})
          and ended_at > now() - interval '20 minutes' order by ended_at desc limit 1`)
      : Promise.resolve(null),
  ]);
  if (!player.rows[0]) return NextResponse.json({ signedIn: false }, { headers });
  const balance = Number(player.rows[0].gold) || 0;
  const matchId = (match?.rows[0]?.id as string | undefined) ?? null;
  const earned = matchId
    ? (await db.execute(sql`select reason, amount from chaos_gold_ledger where match_id = ${matchId} and player_id = ${id} and amount > 0
        order by case reason when 'match' then 0 when 'chaos_hour' then 1 when 'daily_win' then 2 else 3 end`))
        .rows.map((r) => ({ reason: String(r.reason), amount: Number(r.amount) }))
    : null;
  const { offer, affordable } = goldOffer(fullShopCatalog(), new Set(owned.rows.map((r) => String(r.modifier_id))), balance, matchId ?? id);
  return NextResponse.json({ signedIn: true, balance, matchId, earned, offer, affordable }, { headers });
}
