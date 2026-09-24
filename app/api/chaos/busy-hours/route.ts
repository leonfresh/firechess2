/**
 * GET /api/chaos/busy-hours — finished Chaos games per UTC hour over the last 14 days, so the lobby
 * can say "usually busiest around 8pm your time" (see lib/chaos-busy-hours.ts). Public aggregate,
 * cached at the edge.
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export const revalidate = 900;

export async function GET() {
  const hoursUtc = Array<number>(24).fill(0);
  try {
    const rows = await db.execute(sql`select extract(hour from ended_at at time zone 'UTC')::int as h, count(*)::int as n
      from chaos_match where ended_at > now() - interval '14 days' group by 1`);
    for (const row of rows.rows as { h: number; n: number }[]) hoursUtc[row.h] = row.n;
  } catch {
    // An empty histogram just hides the hint.
  }
  return NextResponse.json(
    { hoursUtc, games: hoursUtc.reduce((a, n) => a + n, 0) },
    { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" } },
  );
}
