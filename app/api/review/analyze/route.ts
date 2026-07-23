import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY ?? "";
const GROQ_KEY = process.env.GROQ_API_KEY ?? "";
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY ?? "";

type MoveEntry = { ply: number; san: string; color: "w" | "b"; classification: string; cpLoss: number; evalBefore: number; evalAfter: number; };
type RequestBody = { white: string; black: string; result: string; totalMoves: number; moves: MoveEntry[]; blunderCount: number; brilliantCount: number; accuracy: number };

const SYSTEM_PROMPT = `You are a chess commentator analyzing a single game between two specific players. Write like a knowledgeable but entertaining coach.

Rules:
- Always refer to players by name (e.g. "LeonFresh's queen sortie" not "White's queen sortie").
- When a move is a blunder/mistake, say whose it was: "LeonFresh blundered with 22...a6" if LeonFresh is Black.
- The key turning point is the move that actually changed the game — usually the BLUNDER, not the move before it. A move like a6 that sets up nothing is not a turning point; the blunder that follows it is.
- A move with cpLoss > 200 is a blunder. A move with cpLoss > 75 is a mistake. Comment on ALL blunders and mistakes.

Respond with valid JSON (no markdown, no backticks):
{
  "summary": "2-3 sentence overview mentioning the players by name and the key blunder/turning point.",
  "verdict": "One memorable sentence.",
  "moveAdvice": { "opening": "1 short sentence", "middlegame": "1 short sentence", "endgame": "1 short sentence" },
  "commentary": {}
}

For the commentary field, provide a 1-2 sentence note for EVERY move that is a blunder, mistake, brilliant, or has cpLoss > 75. Key is the 0-based ply index, value is the note. Start each note with the player's name. Example: {"15": "LeonFresh misses a tactical shot here. Nxe5 wins a pawn."}`;

async function callLLM(prompt: string, model: string, key: string, url: string): Promise<string | null> {
  if (!key || key.length < 10) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 3000,
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
    `BRILLIANTS: ${body.brilliantCount}`, `ACCURACY: ${body.accuracy}%`, "",
    "ALL MOVES (ply | player | move | classification | cpLoss | eval):",
  ];
  for (const m of body.moves) {
    const who = m.color === "w" ? body.white : body.black;
    lines.push(`  ${m.ply} ${who}: ${m.san} [${m.classification}] cpLoss=${m.cpLoss} eval=${(m.evalBefore / 100).toFixed(1)}→${(m.evalAfter / 100).toFixed(1)}`);
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
        summary: `${body.white} vs ${body.black} — ${body.result}. ${body.totalMoves} moves, ${body.blunderCount} blunders.`,
        verdict: "Analysis complete.", moveAdvice: {}, commentary: {},
      });
    }

    try { return NextResponse.json(JSON.parse(raw)); }
    catch {
      return NextResponse.json({
        summary: raw.slice(0, 300), verdict: "Analysis complete.",
        moveAdvice: {}, commentary: {},
      });
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
