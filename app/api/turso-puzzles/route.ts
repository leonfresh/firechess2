import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/**
 * GET /api/turso-puzzles?ratingMin=1300&ratingMax=1700&limit=5&themes=fork,pin
 *
 * Returns random Lichess puzzles filtered by rating band and (optionally)
 * themes. Backed by the `lichess_puzzles` table in Neon Postgres (rehosted
 * from Turso Aug 2026 after the Turso DB/credentials were lost).
 *
 * Random rowid sampling strategy:
 * Jump to a random rowid in the table, then scan forward to the first row
 * that satisfies all filters. O(log N + k) per query — far faster than
 * ORDER BY random() on a ~500k row table.
 */

function buildWhere(ratingMin: number, ratingMax: number, themeList: string[]) {
  const conds = [sql`rating BETWEEN ${ratingMin} AND ${ratingMax}`];
  for (const theme of themeList) {
    conds.push(sql`themes LIKE ${`%${theme}%`}`);
  }
  return conds.length > 0 ? sql`AND ${sql.join(conds, sql` AND `)}` : sql``;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const ratingMin = parseInt(searchParams.get("ratingMin") ?? "1500", 10);
  const ratingMax = parseInt(searchParams.get("ratingMax") ?? "2000", 10);
  const themes = searchParams.get("themes");
  const themeList = themes
    ? themes
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "1", 10), 20);

  const where = buildWhere(ratingMin, ratingMax, themeList);

  try {
    // Max rowid from the PK index — O(1), no fragile constant to drift.
    const maxRowResult = await db.execute(
      sql`SELECT max(rowid) AS m FROM lichess_puzzles`,
    );
    const maxRowid = Number(maxRowResult.rows[0]?.m ?? 0);
    if (maxRowid === 0) {
      return NextResponse.json({ puzzles: [], total: 0 });
    }

    // Fire 3× more candidates than needed to compensate for near-end misses
    // and occasional duplicates.
    const candidates = limit * 3;
    const startRowids = Array.from(
      { length: candidates },
      () => Math.floor(Math.random() * maxRowid) + 1,
    );

    const rawResults = await Promise.all(
      startRowids.map((rowid) =>
        db.execute(
          sql`SELECT id, fen, moves, rating, themes, game_url, opening_tags FROM lichess_puzzles WHERE rowid >= ${rowid} ${where} ORDER BY rowid LIMIT 1`,
        ),
      ),
    );

    const seen = new Set<string>();
    const puzzles: Record<string, unknown>[] = [];

    for (const r of rawResults) {
      if (r.rows.length === 0) continue;
      const p = r.rows[0] as Record<string, unknown>;
      const pid = String(p.id);
      if (!seen.has(pid)) {
        seen.add(pid);
        puzzles.push(p);
        if (puzzles.length >= limit) break;
      }
    }

    return NextResponse.json({ puzzles, total: puzzles.length });
  } catch (err) {
    console.error("[turso-puzzles] error", err);
    return NextResponse.json(
      { error: "Failed to fetch puzzles" },
      { status: 500 },
    );
  }
}
