// Generate Leda-voice VO clips with Gemini TTS (gemini-3.1-flash-tts-preview).
// Writes 24kHz mono WAVs into public/. Reads GEMINI_API_KEY from env.
import fs from "node:fs";

const KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3.1-flash-tts-preview";
const VOICE = "Leda";
const STYLE = ""; // natural delivery — let punctuation pace it, no try-hard directive

const LINES = {
  hook: "I asked an A.I. to roast a 700's chess game. It did not hold back.",
  game: "Queen out early for the cheap mate. It fails. So it just... wanders. h5, f3, g3.",
  blunder: "Then a knight hits d4. He tries to kick it with c3. The knight goes to e2 — check. Forking king and queen. The queen's gone.",
  roast: "Cause of death: a knight fork. He brought the queen out on move three, and developed nothing else.",
  stats: "Final accuracy? Sixty-four percent. One blunder, three mistakes, and a dead queen.",
  hook2: "And the worst part — it was avoidable the whole time.",
  you: "FireChess finds the leaks in your games.",
  end: "It's free. Just search FireChess.",
};

const only = process.argv[2]; // optional: generate just one line id (smoke test)

function wavFromPcm(pcmBuf, rate) {
  const numCh = 1, bps = 16;
  const byteRate = (rate * numCh * bps) / 8;
  const blockAlign = (numCh * bps) / 8;
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + pcmBuf.length, 4); h.write("WAVE", 8);
  h.write("fmt ", 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(numCh, 22);
  h.writeUInt32LE(rate, 24); h.writeUInt32LE(byteRate, 28); h.writeUInt16LE(blockAlign, 32); h.writeUInt16LE(bps, 34);
  h.write("data", 36); h.writeUInt32LE(pcmBuf.length, 40);
  return Buffer.concat([h, pcmBuf]);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function synth(id, text) {
  const out = `public/vo-${id}.wav`;
  if (fs.existsSync(out) && process.argv[3] !== "--force") { console.log(`· ${out} exists, skip`); return; }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`;
  const body = {
    contents: [{ parts: [{ text: STYLE + text }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } },
    },
  };
  let res;
  for (let attempt = 1; attempt <= 6; attempt++) {
    res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) break;
    if ((res.status === 503 || res.status === 429 || res.status >= 500) && attempt < 6) {
      const wait = 2000 * attempt;
      console.log(`  ${id} HTTP ${res.status} — retry ${attempt}/5 in ${wait}ms`);
      await sleep(wait);
      continue;
    }
    console.error(id, "HTTP", res.status, (await res.text()).slice(0, 300)); process.exit(1);
  }
  const json = await res.json();
  const part = json?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!part) { console.error(id, "no audio in response:", JSON.stringify(json).slice(0, 400)); process.exit(1); }
  const mime = part.inlineData.mimeType || "";
  const rate = parseInt((mime.match(/rate=(\d+)/) || [])[1] || "24000", 10);
  const pcm = Buffer.from(part.inlineData.data, "base64");
  const wav = wavFromPcm(pcm, rate);
  fs.mkdirSync("public", { recursive: true });
  fs.writeFileSync(out, wav);
  const secs = (pcm.length / 2 / rate).toFixed(2);
  console.log(`✓ ${out}  ${secs}s  (${rate}Hz, ${(wav.length/1024).toFixed(0)}KB)`);
}

const entries = only ? [[only, LINES[only]]] : Object.entries(LINES);
for (const [id, text] of entries) { await synth(id, text); }
console.log("done");
