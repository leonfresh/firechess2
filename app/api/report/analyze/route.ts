/**
 * POST /api/report/analyze — uses LLM to analyze scan results and generate
 * a structured coach note with badges, key insights, and per-section notes.
 *
 * Falls back: OpenRouter → Groq → DeepSeek V4 (paid).
 */
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { scanSessions } from "@/lib/schema";
import { isExpiredScanSession, type ComputedScanReport } from "@/lib/scan-session";
import { chatWithFallback } from "@/lib/llm-chat";
import type { AnalyzeResponse } from "@/lib/types";


type ScanSummary = {
  gamesAnalyzed: number;
  openingLeaks: number;
  missedTactics: number;
  endgameMistakes: number;
  repeatedPositions: number;
  timeManagementScore: number | null;
  estimatedRating: number | null;
  consistencyScore: number | null;
  topMotif: string;
  topLeakOpenings: string[];
  playerUsername: string;
  scanMode: string;
  endgameConversionRate: number | null;
  endgameAvgCpLoss: number | null;
  endgameWeakestType: string | null;
};

const SYSTEM_PROMPT = `You are a chess coach AI analyzing a player's scan results. Write with the tone of a friendly but direct coach — honest, encouraging, and specific.

CRITICAL: Use the EXACT numbers from the data below. Do NOT round down, do NOT say "zero" or "none" unless the value is literally 0. If the data says 91 missed tactics, say "91" not "zero".

Respond with valid JSON (no markdown, no backticks):

{
  "badges": [
    { "label": "short badge text (max 20 chars)", "tier": "positive|neutral|negative", "explanation": "one-line why" }
  ],
  "verdict": "One sentence summary of the player's overall profile (e.g. 'Solid positional player who needs sharper tactics')",
  "strengths": ["Point 1", "Point 2", "Point 3"],
  "weaknesses": ["Point 1", "Point 2", "Point 3"],
  "nextSteps": ["Actionable advice 1", "Actionable advice 2", "Actionable advice 3"],
  "coachNote": "A paragraph (3-5 sentences) with detailed analysis. Reference the actual numbers from the data.",
  "sectionNotes": {
    "openings": "1-2 sentence coach note about the player's opening performance and recurring leaks. Be specific.",
    "tactics": "1-2 sentence coach note about the player's tactical patterns — what they miss, what they find.",
    "endgames": "1-2 sentence coach note about the player's endgame strengths and weaknesses.",
    "positional": "1-2 sentence coach note about positional play, motifs, and structural patterns (if relevant)."
  }
}`;

type SectionKey = "openings" | "tactics" | "endgames" | "positional";

/* Per-caller guard on paid LLM calls. In-memory and cold-start ephemeral, like
 * the feedback route's limiter — enough to stop a script from burning credits
 * while a report is generated. A durable limiter is a follow-up. */
const LIMIT_WINDOW_MS = 10 * 60 * 1000;
const LIMIT_MAX = 6;
const genRate = new Map<string, { count: number; resetAt: number }>();

function allowGeneration(key: string): boolean {
  const now = Date.now();
  const entry = genRate.get(key);
  if (!entry || now > entry.resetAt) {
    genRate.set(key, { count: 1, resetAt: now + LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= LIMIT_MAX) return false;
  entry.count++;
  return true;
}

function buildSummary(
  result: AnalyzeResponse,
  reportMeta: ComputedScanReport | null,
  username: string,
  scanMode: string,
): ScanSummary {
  const leaks = result.leaks ?? [];
  const byReach = [...leaks].sort(
    (a, b) => (b.reachCount || 0) - (a.reachCount || 0),
  );
  return {
    gamesAnalyzed: result.gamesAnalyzed || 0,
    openingLeaks: leaks.length,
    missedTactics: (result.missedTactics || []).length,
    endgameMistakes: (result.endgameMistakes || []).length,
    repeatedPositions: result.repeatedPositions || 0,
    timeManagementScore: result.timeManagementScore ?? null,
    estimatedRating: reportMeta?.estimatedRating ?? null,
    consistencyScore: reportMeta?.consistencyScore ?? null,
    topMotif: reportMeta?.topTag || "General",
    topLeakOpenings: byReach
      .slice(0, 5)
      .map((leak) => leak.openingName)
      .filter((name): name is string => Boolean(name)),
    playerUsername: username || "Player",
    scanMode: scanMode || "both",
    endgameConversionRate: result.endgameStats?.conversionRate ?? null,
    endgameAvgCpLoss: result.endgameStats?.avgCpLoss ?? null,
    endgameWeakestType: result.endgameStats?.weakestType ?? null,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { scanId } = (await req.json().catch(() => ({}))) as {
      scanId?: unknown;
    };
    if (typeof scanId !== "string" || !scanId) {
      return NextResponse.json({ error: "scanId required" }, { status: 400 });
    }

    const [scan] = await db
      .select()
      .from(scanSessions)
      .where(eq(scanSessions.id, scanId))
      .limit(1);
    if (
      !scan ||
      scan.status !== "ready" ||
      !scan.result ||
      isExpiredScanSession(scan)
    ) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Only the scan's owner (signed in or guest owner token) or an admin may
    // spend a paid LLM call here. This route used to be an open LLM proxy that
    // trusted a client-built summary in the request body.
    const session = await auth();
    const ownerToken = req.headers.get("x-scan-owner-token");
    const ownsScan =
      (session?.user?.id && scan.userId === session.user.id) ||
      (ownerToken && scan.guestToken && ownerToken === scan.guestToken);
    const admin = session?.user?.id ? await isAdmin(session.user.id) : false;
    if (!ownsScan && !admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // A stored analysis is free to serve; never pay for a second one.
    if (scan.result.aiAnalysis) {
      return NextResponse.json(scan.result.aiAnalysis);
    }

    const summary = buildSummary(
      scan.result,
      scan.reportMeta,
      scan.chessUsername,
      scan.scanMode,
    );
    if (summary.gamesAnalyzed < 5) {
      return NextResponse.json(
        { error: "Not enough games for a coach analysis" },
        { status: 422 },
      );
    }

    const callerKey =
      session?.user?.id ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";
    if (!allowGeneration(callerKey)) {
      return NextResponse.json(
        { error: "Too many analyses. Please try again later." },
        { status: 429 },
      );
    }

    const userPrompt = [
      `PLAYER: ${summary.playerUsername}`,
      `GAMES ANALYZED: ${summary.gamesAnalyzed}`,
      `SCAN MODE: ${summary.scanMode}`,
      `OPENING LEAKS: ${summary.openingLeaks}`,
      `MISSED TACTICS: ${summary.missedTactics}`,
      `ENDGAME MISTAKES: ${summary.endgameMistakes}`,
      `REPEATED POSITIONS: ${summary.repeatedPositions}`,
      `TIME MANAGEMENT: ${summary.timeManagementScore ?? "N/A"}/100`,
      `CONSISTENCY: ${summary.consistencyScore ?? "N/A"}/100`,
      `RATING: ${summary.estimatedRating ?? "N/A"}`,
      `TOP MOTIF: ${summary.topMotif}`,
      `TOP OPENINGS WITH LEAKS: ${summary.topLeakOpenings.join(", ")}`,
      `ENDGAME CONVERSION RATE: ${summary.endgameConversionRate ?? "N/A"} (this is a percentage 0-100, e.g. 77 means 77%)`,
      `ENDGAME AVG CP LOSS: ${summary.endgameAvgCpLoss ?? "N/A"} (centipawns, divide by 100 to get pawns, e.g. 60 = 0.6 pawns)`,
      `ENDGAME WEAKEST TYPE: ${summary.endgameWeakestType ?? "N/A"}`,
    ].join("\n");

    const raw = await chatWithFallback(SYSTEM_PROMPT, userPrompt);

    if (!raw) {
      return NextResponse.json({ error: "No LLM provider available" }, { status: 503 });
    }

    const fallback = {
      badges: [],
      verdict: "Analysis complete",
      strengths: [], weaknesses: [], nextSteps: [],
      coachNote: raw,
      sectionNotes: {} as Record<SectionKey, string>,
    };

    try {
      const parsed = JSON.parse(raw);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json(fallback);
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
