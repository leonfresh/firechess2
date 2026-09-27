/**
 * POST /api/report/analyze — uses LLM to analyze scan results and generate
 * a structured coach note with badges, key insights, and per-section notes.
 *
 * Falls back: OpenRouter → Groq → DeepSeek V4 (paid).
 */
import { NextRequest, NextResponse } from "next/server";
import { chatWithFallback } from "@/lib/llm-chat";


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

export async function POST(req: NextRequest) {
  try {
    const summary: ScanSummary = await req.json();
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
