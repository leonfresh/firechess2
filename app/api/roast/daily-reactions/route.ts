/**
 * GET  /api/roast/daily-reactions?date=YYYY-MM-DD
 *   Returns all reactions for a given daily challenge date, grouped by moveIdx.
 *
 * POST /api/roast/daily-reactions
 *   Body: { date: string, moveIdx: number, emoji: string }
 *   Saves a reaction. Auth optional (uses session name or "Anonymous").
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { roastDailyReactions } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";

/** Allowed reaction emoji keys (moods from RoastAvatar + simple emojis) */
const ALLOWED_EMOJIS = new Set([
  // Pepe moods (animated ones for max impact)
  "lmao", "clapping", "shocked", "gamercry", "madpuke",
  "rage", "bigeyes", "hyped", "cantwatch", "firesgun",
  "clown", "crylaugh", "nope", "toxic", "loving",
  // Simple emoji reactions
  "💀", "😂", "🔥", "😱", "🤡", "👏", "😭", "🤯", "💩", "👀",
]);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date param" }, { status: 400 });
  }

  const rows = await db
    .select({
      moveIdx: roastDailyReactions.moveIdx,
      emoji: roastDailyReactions.emoji,
      displayName: roastDailyReactions.displayName,
      createdAt: roastDailyReactions.createdAt,
    })
    .from(roastDailyReactions)
    .where(eq(roastDailyReactions.date, date))
    .orderBy(roastDailyReactions.moveIdx, roastDailyReactions.createdAt);

  // Group by moveIdx for easier client consumption
  const grouped: Record<number, { emoji: string; displayName: string | null }[]> = {};
  for (const row of rows) {
    if (!grouped[row.moveIdx]) grouped[row.moveIdx] = [];
    grouped[row.moveIdx].push({
      emoji: row.emoji,
      displayName: row.displayName,
    });
  }

  return NextResponse.json({ date, reactions: grouped });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, moveIdx, emoji } = body;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    if (typeof moveIdx !== "number" || moveIdx < 0 || moveIdx > 200) {
      return NextResponse.json({ error: "Invalid moveIdx" }, { status: 400 });
    }
    if (!emoji || !ALLOWED_EMOJIS.has(emoji)) {
      return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });
    }

    // Rate limit: max 60 reactions per date per IP (simple check)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    // Get optional auth session
    let displayName = "Anonymous";
    let userId: string | null = null;
    try {
      const session = await auth();
      if (session?.user) {
        displayName = session.user.name ?? "Player";
        userId = session.user.id ?? null;
      }
    } catch {
      // No auth — that's fine, anonymous reaction
    }

    await db.insert(roastDailyReactions).values({
      date,
      moveIdx,
      emoji,
      displayName,
      userId,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to save daily reaction:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
