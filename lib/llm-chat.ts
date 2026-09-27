/**
 * One chat completion with provider fallback: OpenRouter → Groq → DeepSeek V4 (paid).
 * Returns the raw message text, or null when no provider is configured or all fail.
 */
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY ?? "";
const GROQ_KEY = process.env.GROQ_API_KEY ?? "";
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY ?? "";

type Provider = { url: string; key: string; placeholder: string; model: string };

const PROVIDERS: Provider[] = [
  { url: "https://openrouter.ai/api/v1/chat/completions", key: OPENROUTER_KEY, placeholder: "sk-or-...", model: "openai/gpt-4o-mini" },
  { url: "https://api.groq.com/openai/v1/chat/completions", key: GROQ_KEY, placeholder: "gsk_Wy...", model: "llama-3.3-70b-versatile" },
  { url: "https://api.deepseek.com/v1/chat/completions", key: DEEPSEEK_KEY, placeholder: "sk-f0c...", model: "deepseek-chat" },
];

async function callProvider(p: Provider, system: string, user: string, temperature: number): Promise<string | null> {
  if (!p.key || p.key.startsWith(p.placeholder)) return null;
  try {
    const res = await fetch(p.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${p.key}` },
      body: JSON.stringify({
        model: p.model,
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        temperature,
        max_tokens: 2000,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? null;
  } catch { return null; }
}

export async function chatWithFallback(system: string, user: string, { temperature = 0.7, skip = 0 } = {}): Promise<string | null> {
  for (const provider of PROVIDERS.slice(skip)) {
    const text = await callProvider(provider, system, user, temperature);
    if (text) return text;
  }
  return null;
}
