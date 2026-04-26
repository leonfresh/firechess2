import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/turso";

function buildWhere(
  ratingMin: number,
  ratingMax: number,
  themeList: string[],
): { clause: string; args: (string | number)[] } {
  const args: (string | number)[] = [ratingMin, ratingMax];
  let clause = `AND rating BETWEEN ? AND ?`;
  for (const theme of themeList) {
    clause += ` AND themes LIKE ?`;
    args.push(`%${theme}%`);
  }
  return { clause, args };
}

function rowsToObjects(
  columns: string[],
  rows: ArrayLike<unknown>[],
): Record<string, unknown>[] {
  return rows.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      obj[col] = (row as any)[i];
    });
    return obj;
  });
}

// Approximate total rows in the lichess_puzzles table.
// Used for random rowid sampling — no need to be exact; just needs to cover the full range.
const APPROX_MAX_ROWID = 3_400_000;

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

  const { clause, args } = buildWhere(ratingMin, ratingMax, themeList);

  try {
    // Random rowid sampling strategy:
    // Jump to a random rowid in the table, then scan forward to the first
    // row that satisfies all filters. This is O(log N + k) per query where k
    // is the average gap between matching rows — dramatically faster than
    // COUNT(*) + LIMIT/OFFSET for theme-filtered queries where OFFSET forces
    // a full sequential scan through potentially hundreds of thousands of rows.
    //
    // We fire 3× more candidates than needed to compensate for near-end misses
    // (where rowid >= X returns nothing because X is past the last match)
    // and the occasional duplicate.
    const candidates = limit * 3;
    const startRowids = Array.from(
      { length: candidates },
      () => Math.floor(Math.random() * APPROX_MAX_ROWID) + 1,
    );

    const rawResults = await Promise.all(
      startRowids.map((rowid) =>
        turso.execute({
          sql: `SELECT * FROM lichess_puzzles WHERE rowid >= ? ${clause} LIMIT 1`,
          args: [rowid, ...args],
        }),
      ),
    );

    const seen = new Set<unknown>();
    const puzzles: Record<string, unknown>[] = [];

    for (const r of rawResults) {
      if (r.rows.length === 0) continue;
      const p = rowsToObjects(r.columns, r.rows as any)[0];
      if (!seen.has(p.id)) {
        seen.add(p.id);
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
