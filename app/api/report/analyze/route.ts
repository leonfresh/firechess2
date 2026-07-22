/**
 * POST /api/report/analyze — uses LLM to analyze scan results and generate
 * a structured coach note with badges, key insights, and per-section notes.
 *
 * Falls back: OpenRouter → Groq → DeepSeek V4 (paid).
 */
import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY ?? "";
const GROQ_KEY = process.env.GROQ_API_KEY ?? "";
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY ?? "";

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
};

const SYSTEM_PROMPT = `You are a chess coach AI analyzing a player's scan results. Write with the tone of a friendly but direct coach — honest, encouraging, and specific.

Respond with valid JSON (no markdown, no backticks):

{
  "badges": [
    { "label": "short badge text (max 20 chars)", "tier": "positive|neutral|negative", "explanation": "one-line why" }
  ],
  "verdict": "One sentence summary of the player's overall profile (e.g. 'Solid positional player who needs sharper tactics')",
  "strengths": ["Point 1", "Point 2", "Point 3"],
  "weaknesses": ["Point 1", "Point 2", "Point 3"],
  "nextSteps": ["Actionable advice 1", "Actionable advice 2", "Actionable advice 3"],
  "coachNote": "A paragraph (3-5 sentences) with detailed analysis.",
  "sectionNotes": {
    "openings": "1-2 sentence coach note about the player's opening performance and recurring leaks. Be specific.",
    "tactics": "1-2 sentence coach note about the player's tactical patterns — what they miss, what they find.",
    "endgames": "1-2 sentence coach note about the player's endgame strengths and weaknesses.",
    "positional": "1-2 sentence coach note about positional play, motifs, and structural patterns (if relevant)."
  }
}`;

type SectionKey = "openings" | "tactics" | "endgames" | "positional";

async function callOpenRouter(prompt: string): Promise<string | null> {
  if (!OPENROUTER_KEY || OPENROUTER_KEY.startsWith("sk-or-...")) return null;
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENROUTER_KEY}` },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? null;
  } catch { return null; }
}

async function callGroq(prompt: string): Promise<string | null> {
  if (!GROQ_KEY || GROQ_KEY.startsWith("gsk_Wy...")) return null;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? null;
  } catch { return null; }
}

async function callDeepSeek(prompt: string): Promise<string | null> {
  if (!DEEPSEEK_KEY || DEEPSEEK_KEY.startsWith("sk-f0c...")) return null;
  try {
    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEEPSEEK_KEY}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? null;
  } catch { return null; }
}

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
    ].join("\n");

    let raw = await callOpenRouter(userPrompt);
    if (!raw) raw = await callGroq(userPrompt);
    if (!raw) raw = await callDeepSeek(userPrompt);

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
