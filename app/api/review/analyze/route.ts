import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY ?? "";
const GROQ_KEY = process.env.GROQ_API_KEY ?? "";
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY ?? "";

type MoveData = {
  moveNumber: number;
  san: string;
  color: "w" | "b";
  classification: string;
  cpLoss: number;
  evalBefore: number;
  evalAfter: number;
  isCritical: boolean;
};

type RequestBody = {
  white: string;
  black: string;
  result: string;
  totalMoves: number;
  keyMoments: MoveData[];
  blunderCount: number;
  brilliantCount: number;
  accuracy: number;
};

const SYSTEM_PROMPT = `You are a chess commentator analyzing a single game. Write like a knowledgeable but entertaining coach.

Respond with valid JSON (no markdown, no backticks):

{
  "summary": "2-3 sentence overview of the game — who won, why, the key turning point.",
  "playerRating": "One-line assessment of the player's performance in this specific game.",
  "keyMoment": "The single most critical moment in the game.",
  "verdict": "One memorable sentence summarizing the game (e.g. 'A tactical slugfest where White's rook endgame technique made the difference.').",
  "moveAdvice": {
    "opening": "1 sentence about the opening phase.",
    "middlegame": "1 sentence about the middlegame.",
    "endgame": "1 sentence about the endgame."
  },
  "commentary": {}
}

For the commentary field, provide commentary for critical moves (blunders, brilliancies, biggest eval swings). Key is the ply index (0-based), value is a 1-2 sentence coach note about that specific move. Only include moves that truly need commentary — mistakes, brilliancies, or turning points. Keep it concise and specific to the actual position.`;

async function callLLM(prompt: string, model: string, key: string, url: string): Promise<string | null> {
  if (!key || key.startsWith("sk-...") || key.startsWith("gsk_...")) return null;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: prompt }],
        temperature: 0.6,
        max_tokens: 2000,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? null;
  } catch { return null; }
}

function buildPrompt(body: RequestBody): string {
  const lines = [
    `WHITE: ${body.white}`,
    `BLACK: ${body.black}`,
    `RESULT: ${body.result}`,
    `TOTAL MOVES: ${body.totalMoves}`,
    `BLUNDERS: ${body.blunderCount}`,
    `BRILLIANTS: ${body.brilliantCount}`,
    `PLAYER ACCURACY: ${body.accuracy}%`,
    "",
    "KEY MOMENTS (in order):",
  ];
  for (const m of body.keyMoments) {
    lines.push(`  ${m.moveNumber}${m.color === "w" ? "." : "..."} ${m.san} — ${m.classification} (cp loss: ${m.cpLoss}, eval: ${(m.evalBefore / 100).toFixed(1)} → ${(m.evalAfter / 100).toFixed(1)})`);
  }
  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const prompt = buildPrompt(body);

    let raw = await callLLM(prompt, "openai/gpt-4o-mini", OPENROUTER_KEY, "https://openrouter.ai/api/v1/chat/completions");
    if (!raw) raw = await callLLM(prompt, "llama-3.3-70b-versatile", GROQ_KEY, "https://api.groq.com/openai/v1/chat/completions");
    if (!raw) raw = await callLLM(prompt, "deepseek-chat", DEEPSEEK_KEY, "https://api.deepseek.com/v1/chat/completions");

    if (!raw) return NextResponse.json({ error: "No LLM available" }, { status: 503 });

    try { return NextResponse.json(JSON.parse(raw)); }
    catch { return NextResponse.json({ summary: raw, verdict: "Analysis complete", keyMoment: "", playerRating: "", moveAdvice: {}, commentary: {} }); }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
