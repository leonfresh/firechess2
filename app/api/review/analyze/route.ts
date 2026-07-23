import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY ?? "";
const GROQ_KEY = process.env.GROQ_API_KEY ?? "";
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY ?? "";

type MoveData = { moveNumber: number; san: string; color: "w" | "b"; classification: string; cpLoss: number; evalBefore: number; evalAfter: number; isCritical: boolean };
type RequestBody = { white: string; black: string; result: string; totalMoves: number; keyMoments: MoveData[]; blunderCount: number; brilliantCount: number; accuracy: number };

const SYSTEM_PROMPT = `You are a chess commentator analyzing a single game. Write like a knowledgeable but entertaining coach.

Respond with valid JSON (no markdown, no backticks):

{
  "summary": "2-3 sentence overview of the game — who won, why, the key turning point.",
  "verdict": "One memorable sentence summarizing the game.",
  "moveAdvice": { "opening": "1 sentence", "middlegame": "1 sentence", "endgame": "1 sentence" },
  "commentary": {}
}

For the commentary field, provide 1-2 sentence coach notes for critical moves. Key is the 0-based ply index. Keep it concise.`;

async function callLLM(prompt: string, model: string, key: string, url: string): Promise<string | null> {
  if (!key || key.length < 10) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: prompt }],
        temperature: 0.6,
        max_tokens: 2000,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? null;
  } catch { return null; }
}

function buildPrompt(body: RequestBody): string {
  const lines = [
    `WHITE: ${body.white}`, `BLACK: ${body.black}`, `RESULT: ${body.result}`,
    `TOTAL MOVES: ${body.totalMoves}`, `BLUNDERS: ${body.blunderCount}`,
    `BRILLIANTS: ${body.brilliantCount}`, `PLAYER ACCURACY: ${body.accuracy}%`, "",
    "KEY MOMENTS:",
  ];
  for (const m of body.keyMoments.slice(0, 20)) {
    lines.push(`  ${m.moveNumber}${m.color === "w" ? "." : "..."} ${m.san} — ${m.classification} (cp loss: ${m.cpLoss} eval: ${(m.evalBefore / 100).toFixed(1)} → ${(m.evalAfter / 100).toFixed(1)})`);
  }
  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const prompt = buildPrompt(body);

    let raw = await callLLM(prompt, "openai/gpt-4o-mini", OPENROUTER_KEY, "https://openrouter.ai/api/v1/chat/completions");
    if (!raw) raw = await callLLM(prompt, "deepseek-chat", DEEPSEEK_KEY, "https://api.deepseek.com/v1/chat/completions");
    if (!raw) raw = await callLLM(prompt, "llama-3.3-70b-versatile", GROQ_KEY, "https://api.groq.com/openai/v1/chat/completions");

    if (!raw) {
      return NextResponse.json({
        summary: `${body.white} vs ${body.black} — ${body.result}. ${body.totalMoves} moves, ${body.blunderCount} blunders, ${body.brilliantCount} brilliants.`,
        verdict: "Analysis complete.",
        moveAdvice: {}, commentary: {},
      });
    }

    try { return NextResponse.json(JSON.parse(raw)); }
    catch {
      return NextResponse.json({
        summary: raw.slice(0, 300),
        verdict: "Analysis complete.",
        moveAdvice: {}, commentary: {},
      });
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
