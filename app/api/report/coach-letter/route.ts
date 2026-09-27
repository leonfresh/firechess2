/**
 * POST /api/report/coach-letter { scanId } — the coach's note for a report's first focus.
 * Generated once per scan from verified facts (lib/coach-letter.ts) and cached in scan.result.
 * A failed generation is remembered for a day so a broken provider does not cost a call per view.
 */
import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { scanSessions } from "@/lib/schema";
import { isExpiredScanSession } from "@/lib/scan-session";
import { buildCoachBrief, COACH_LETTER_SYSTEM, parseCoachLetter, type CoachLetterState } from "@/lib/coach-letter";
import { chatWithFallback } from "@/lib/llm-chat";

const RETRY_AFTER_FAILURE_MS = 24 * 60 * 60 * 1000;

async function store(id: string, state: CoachLetterState) {
  await db.update(scanSessions)
    .set({ result: sql`jsonb_set(${scanSessions.result}, '{coachLetter}', ${JSON.stringify(state)}::jsonb)` })
    .where(eq(scanSessions.id, id));
}

export async function POST(req: NextRequest) {
  const { scanId } = (await req.json().catch(() => ({}))) as { scanId?: unknown };
  if (typeof scanId !== "string") return NextResponse.json({ error: "scanId required" }, { status: 400 });

  const [scan] = await db.select().from(scanSessions).where(eq(scanSessions.id, scanId)).limit(1);
  if (!scan || scan.status !== "ready" || !scan.result || isExpiredScanSession(scan)) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const cached = scan.result.coachLetter;
  if (cached && "note" in cached) return NextResponse.json({ letter: cached });
  if (cached && Date.now() - Date.parse(cached.failedAt) < RETRY_AFTER_FAILURE_MS) return NextResponse.json({ letter: null });
  if (scan.result.gamesAnalyzed < 5) return NextResponse.json({ letter: null });

  const brief = buildCoachBrief(scan.result, scan.chessUsername);
  if (!brief) return NextResponse.json({ letter: null });

  // A reply that cites anything outside the brief is discarded; one retry on the next provider.
  let letter = null;
  for (const skip of [0, 1]) {
    const raw = await chatWithFallback(COACH_LETTER_SYSTEM, brief.text, { temperature: 0.6, skip });
    letter = raw ? parseCoachLetter(raw, brief) : null;
    if (letter) break;
  }

  try { await store(scan.id, letter ?? { failedAt: new Date().toISOString() }); } catch { /* serve it uncached */ }
  return NextResponse.json({ letter });
}
