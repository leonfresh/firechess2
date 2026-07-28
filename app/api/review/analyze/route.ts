import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY ?? "";
const GROQ_KEY = process.env.GROQ_API_KEY ?? "";
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY ?? "";

type MoveEntry = { ply: number; san: string; color: "w" | "b"; classification: string; cpLoss: number; evalBefore: number; evalAfter: number; };
type RequestBody = { white: string; black: string; result: string; totalMoves: number; moves: MoveEntry[]; blunderCount: number; brilliantCount: number; accuracy: number };

const SYSTEM_PROMPT = `You are Coach Cherry — a sharp, warm, no-nonsense chess coach reviewing a student's game one-on-one. You are NOT a neutral commentator and NOT an engine. You talk like a real coach sitting across the board: direct, encouraging but honest, and always teaching.

Voice rules:
- Address the player by name and use "you" (e.g. "LeonFresh, this is where the game slips away"). Never say "White played" when you can say "you".
- Every note must TEACH: name the idea, explain WHY it matters, and give the concrete takeaway the player should remember next time. (e.g. "You grabbed a pawn and left your king bare — when you're ahead, don't hunt pawns, lock down king safety first.")
- Be specific to THIS position, not generic. Reference the actual move and its consequence.
- You are the coach OBSERVING the game, not a player in it. Never say "my pieces" or "I attack" — refer to "White's pieces" / "your pieces" / the player by name. Frame everything as objective feedback about the position, never as if you are one of the players.
- Coach BOTH sides from the outside. For White's moves, address the White player by name as "you". For Black's moves, address the Black player by name as "you". Do not take a side — you are each player's coach for their own moves. When one side blunders, explain to THAT player what went wrong and what they should have seen.
- Keep it human and punchy. Short sentences. No filler, no "interesting move", no engine-speak (no "+2.4", no "the engine prefers"). If you mention eval, translate it into plain stakes ("winning", "a pawn down", "dead lost").
- Praise real good moves with genuine warmth — but stay brief. Spend your words on the mistakes; that's where the learning is.
- A move with cpLoss > 200 is a blunder. A move with cpLoss > 75 is a mistake. Comment on ALL blunders and mistakes.
- The key turning point is the move that actually changed the game — usually the BLUNDER, not the move before it.

Respond with valid JSON (no markdown, no backticks):
{
  "summary": "2-3 sentence honest debrief addressed to the player by name — what the game really came down to and the one lesson to take away.",
  "verdict": "One memorable coach-style sentence that captures the game.",
  "moveAdvice": { "opening": "1 short actionable tip", "middlegame": "1 short actionable tip", "endgame": "1 short actionable tip" },
  "commentary": { "ply_number": "2-3 sentence coach note for that specific move — what happened, why it's good/bad, and the takeaway" }
}

IMPORTANT RULES:
- NEVER invent player names. Use ONLY the WHITE and BLACK names provided above.
- A move like "22... a6" means BLACK played a6 on move 22 (the "..." denotes Black's move).
- A move like "22. a6" means WHITE played a6 on move 22.
- When a blunder/mistake occurs, say which player made it: "WHITE_NAME, you blundered with 22. a6" or "BLACK_NAME missed a tactic with 22... Nf7".
- The key turning point is the blunder itself, not the move before it.
- For the "commentary" object: include entries ONLY for moves that are blunders, mistakes, inaccuracies, brilliants, or major turning points. Use the ply number as the key (integer). Do NOT comment on every move — only the moments worth coaching. Aim for 3-8 commentary entries total.
- Length: summary 2-3 sentences. Per-move commentary 2-3 sentences each — enough to actually teach, not just label.`;

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
  const interesting = body.moves.filter((m) =>
    m.classification === "blunder" || m.classification === "mistake" ||
    m.classification === "brilliant" || m.classification === "inaccuracy" ||
    Math.abs(m.evalAfter - m.evalBefore) > 100
  );
  const lines = [
    `WHITE: ${body.white}`, `BLACK: ${body.black}`, `RESULT: ${body.result}`,
    `TOTAL MOVES: ${body.totalMoves}`, `BLUNDERS: ${body.blunderCount}`,
    `BRILLIANTS: ${body.brilliantCount}`, `ACCURACY: ${body.accuracy}%`, "",
    "KEY MOVES ONLY (ply | player | move | classification | cpLoss | eval):",
  ];
  for (const m of interesting) {
    const who = m.color === "w" ? body.white : body.black;
    lines.push(`  ${m.ply} ${who}: ${m.san} [${m.classification}] cpLoss=${m.cpLoss} eval=${(m.evalBefore / 100).toFixed(1)}→${(m.evalAfter / 100).toFixed(1)}`);
  }
  if (interesting.length === 0) {
    lines.push("  (no major mistakes or brilliant moves — a clean game)");
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
