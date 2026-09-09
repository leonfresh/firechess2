import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const [ranked, community] = await Promise.all([
      db.execute(
        sql`select name,rating,games,wins,losses,draws from chaos_player where games>0 order by rating desc,games desc,id limit 50`,
      ),
      db.execute(sql`select p.name,count(*)::integer as games,
    count(*) filter(where m.winner=seat.color)::integer as wins,
    count(*) filter(where m.winner not in (seat.color,'draw'))::integer as losses,
    count(*) filter(where m.winner='draw')::integer as draws
    from chaos_match m cross join lateral (values(m.host_id,m.host_color),(m.guest_id,case when m.host_color='white' then 'black' else 'white' end)) seat(id,color)
    join chaos_player p on p.id=seat.id
    where exists(select 1 from jsonb_array_elements(coalesce(m.record->'moves','[]'::jsonb)) mv where mv->>'color'='w')
      and exists(select 1 from jsonb_array_elements(coalesce(m.record->'moves','[]'::jsonb)) mv where mv->>'color'='b')
    group by p.id,p.name order by wins desc,draws desc,games desc,p.id limit 50`),
    ]);
    return NextResponse.json(
      { ranked: ranked.rows, community: community.rows },
      { headers: { "Cache-Control": "public, max-age=0, s-maxage=10" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Standings are temporarily unavailable. Please retry." },
      { status: 503 },
    );
  }
}
