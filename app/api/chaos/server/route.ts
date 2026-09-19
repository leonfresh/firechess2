/**
 * GET /api/chaos/server?guild=<id>[&days=7|30] — community standing for one Discord server.
 *
 * Members are players who launched the Activity from that guild inside the window, so a server can
 * see itself ("your server played N games, top player X") without anyone connecting accounts. The
 * caller's own row is included when they can be identified, so the card can say "you're #3 here".
 *
 * Read-only. Player names/ratings here match what the public standings and the in-game lobby already
 * show; server ids are only returned to the caller who asked for that id.
 */

import {NextRequest, NextResponse} from "next/server";
import {db} from "@/lib/db";
import {sql} from "drizzle-orm";
import {getChaosUserId} from "@/lib/chaos-auth";

const GUILD = /^\d{17,20}$/;

export async function GET(req: NextRequest) {
  const guild = req.nextUrl.searchParams.get("guild") ?? "";
  if (!GUILD.test(guild)) return NextResponse.json({error: "Unknown server"}, {status: 400});
  const days = req.nextUrl.searchParams.get("days") === "30" ? 30 : 7;
  const viewer = await getChaosUserId(req).catch(() => null);

  try {
    const [totals, standings] = await Promise.all([
      db.execute(sql`
        with members as (
          select distinct player_id from chaos_launch
          where guild_id=${guild} and created_at > now() - make_interval(days => ${days})),
        server_games as (
          select m.id, m.rated, m.host_id, m.guest_id from chaos_match m
          where m.ended_at > now() - make_interval(days => ${days})
            and exists (select 1 from members where members.player_id in (m.host_id, m.guest_id))),
        server_players as (
          select p.id, p.games from chaos_player p
          where p.id in (select host_id from server_games union select guest_id from server_games))
        select (select count(*) from members)::integer as players,
               (select count(*) from server_games)::integer as games,
               (select count(*) from server_games where rated)::integer as rated,
               (select count(*) from server_players where games > 0)::integer as ranked`),
      db.execute(sql`
        with members as (
          select distinct player_id from chaos_launch
          where guild_id=${guild} and created_at > now() - make_interval(days => ${days})),
        ranked as (
          select p.id, p.name, p.rating, p.games, p.wins, p.losses, p.draws,
                 row_number() over (order by p.rating desc, p.games desc, p.id)::integer as rank
          from chaos_player p join members on members.player_id = p.id
          where p.games > 0)
        select name, rating, games, wins, losses, draws, rank, (id = ${viewer}) as yours
        from ranked where rank <= 5 or id = ${viewer}
        order by rank`),
    ]);

    const row = (totals.rows[0] ?? {}) as Record<string, number>;
    return NextResponse.json(
      {guild, days, players: row.players ?? 0, games: row.games ?? 0, rated: row.rated ?? 0, ranked: row.ranked ?? 0, top: standings.rows},
      {headers: {"Cache-Control": "public, max-age=0, s-maxage=30"}},
    );
  } catch {
    return NextResponse.json({error: "Server standing is temporarily unavailable. Please retry."}, {status: 503});
  }
}
