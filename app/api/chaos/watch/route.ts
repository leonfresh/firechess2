import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { projectClock } from "@/lib/chaos-clock";
import { visualState, archiveFrames } from "@/lib/chaos-watch";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const headers = { "Cache-Control": "no-store" };
  try {
    const roomId = req.nextUrl.searchParams.get("room"),
      matchId = req.nextUrl.searchParams.get("match");
    if ((roomId?.length ?? 0) > 150 || (matchId?.length ?? 0) > 150)
      return NextResponse.json(
        { error: "Invalid game" },
        { status: 400, headers },
      );
    if (roomId) {
      const rows =
        await db.execute(sql`select r.id,r.fen,r.status,r."hostColor",r."lastMoveFrom",r."lastMoveTo",r."timeControlSeconds",r."incrementSeconds",
    r."chaosState"-'_sync' as "chaosState",
    jsonb_build_object('clock',r."chaosState"->'_sync'->'clock','result',r."chaosState"->'_sync'->'result',
     'gameNumber',r."chaosState"->'_sync'->'gameNumber',
     'draft',jsonb_build_object('color',r."chaosState"->'_sync'->'draft'->'color','deadline',r."chaosState"->'_sync'->'draft'->'deadline'),
     'opening',r."chaosState"->'_sync'->'opening'->'deadline',
     'picks',r."chaosState"->'_sync'->'picks') as meta,
    coalesce(h.name,'Guest player') as host,coalesce(g.name,'Guest player') as guest
    from chaos_room r left join chaos_player h on h.id=r."hostId" left join chaos_player g on g.id=r."guestId"
    where r.id=${roomId} and r."guestId" is not null and r.status<>'waiting'`);
      const room = rows.rows[0];
      if (!room)
        return NextResponse.json(
          { error: "Game not available" },
          { status: 404, headers },
        );
      const meta = room.meta as any,
        now = Date.now(),
        host = room.host,
        guest = room.guest;
      const opening =
        meta.opening &&
        (!("host" in (meta.picks ?? {})) || !("guest" in (meta.picks ?? {})));
      if (!meta.draft?.color) meta.draft = null;
      return NextResponse.json(
        {
          id: room.id,
          gameNumber: meta.gameNumber ?? 0,
          status: room.status,
          white: room.hostColor === "white" ? host : guest,
          black: room.hostColor === "black" ? host : guest,
          frame: {
            fen: room.fen,
            state: visualState(room.chaosState),
            label: "Live position",
            from: room.lastMoveFrom,
            to: room.lastMoveTo,
          },
          clock: meta.clock ? projectClock(meta.clock, now) : null,
          serverNow: now,
          phase: opening
            ? "Choosing anomalies"
            : meta.draft
              ? `${meta.draft.color} is choosing a power`
              : room.status === "playing"
                ? `${String(room.fen).split(" ")[1] === "w" ? "White" : "Black"} to move`
                : "Game ended",
          pickDeadline: opening ? meta.opening : (meta.draft?.deadline ?? null),
          result: meta.result
            ? { winner: meta.result.winner, reason: meta.result.reason }
            : null,
          base: room.timeControlSeconds,
          increment: room.incrementSeconds,
        },
        { headers },
      );
    }
    if (matchId) {
      const data = await db.execute(
        sql`select m.record,m.winner,m.reason,m.host_color,m.ended_at,m.rated,coalesce(h.name,'Guest player') as host,coalesce(g.name,'Guest player') as guest from chaos_match m left join chaos_player h on h.id=m.host_id left join chaos_player g on g.id=m.guest_id where m.id=${matchId} or m.room_id=${matchId} order by m.game_number desc limit 1`,
      );
      const m = data.rows[0];
      if (!m)
        return NextResponse.json(
          { error: "Game not found" },
          { status: 404, headers },
        );
      const record = m.record as any;
      return NextResponse.json(
        {
          id: matchId,
          white: m.host_color === "white" ? m.host : m.guest,
          black: m.host_color === "black" ? m.host : m.guest,
          result: { winner: m.winner, reason: m.reason },
          rated: m.rated,
          endedAt: m.ended_at,
          frames: archiveFrames(record),
          legacy: !record.frames?.length,
          base: record.timeControlSeconds,
          increment: record.incrementSeconds,
        },
        { headers },
      );
    }
    const live = req.nextUrl.searchParams.get("tab") === "live";
    const page = Math.max(
      0,
      Math.min(
        10000,
        Math.floor(Number(req.nextUrl.searchParams.get("page")) || 0),
      ),
    );
    const data = live
      ? await db.execute(sql`select r.id,r."hostColor" as host_color,r."timeControlSeconds" as base,r."incrementSeconds" as increment,
   coalesce(h.name,'Guest player') as host,coalesce(g.name,'Guest player') as guest,r."updatedAt" as date
   from chaos_room r left join chaos_player h on h.id=r."hostId" left join chaos_player g on g.id=r."guestId"
   where r.status='playing' and r."guestId" is not null and r."updatedAt">now()-interval '2 hours'
   order by r."updatedAt" desc,r.id desc limit 21 offset ${page * 20}`)
      : await db.execute(sql`select m.id,m.host_color,m.winner,m.reason,m.rated,m.ended_at as date,
   m.record->'timeControlSeconds' as base,m.record->'incrementSeconds' as increment,
   coalesce(h.name,'Guest player') as host,coalesce(g.name,'Guest player') as guest
   from chaos_match m left join chaos_player h on h.id=m.host_id left join chaos_player g on g.id=m.guest_id
   order by m.ended_at desc,m.id desc limit 21 offset ${page * 20}`);
    return NextResponse.json(
      {
        games: data.rows
          .slice(0, 20)
          .map((m) => ({
            id: m.id,
            white: m.host_color === "white" ? m.host : m.guest,
            black: m.host_color === "black" ? m.host : m.guest,
            date: m.date,
            base: m.base,
            increment: m.increment,
            winner: m.winner,
            reason: m.reason,
            rated: m.rated,
          })),
        hasMore: data.rows.length > 20,
      },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { error: "Games are temporarily unavailable. Please try again." },
      { status: 503, headers },
    );
  }
}
