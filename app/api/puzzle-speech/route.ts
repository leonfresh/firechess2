import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Node 22 + native ws addons can misbehave in local/dev installs.
// Force ws to use its JS fallbacks before msedge-tts loads it.
process.env.WS_NO_BUFFER_UTIL = "1";
process.env.WS_NO_UTF_8_VALIDATE = "1";

export interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
}

interface SpeechResponse {
  audioBase64: string;
  wordTimings: WordTiming[];
  durationSeconds: number;
}

function estimateWordTimings(
  text: string,
  durationSeconds: number,
): WordTiming[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [];

  const offsets: number[] = [];
  let cursor = 0;
  for (const word of words) {
    const idx = text.indexOf(word, cursor);
    offsets.push(idx);
    cursor = idx + word.length;
  }
  const totalChars = text.length;

  const timings: WordTiming[] = [];
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const charStart = offsets[i];
    const charEnd = charStart + word.length;
    const nextCharStart = i + 1 < words.length ? offsets[i + 1] : totalChars;

    let startTime = (charStart / totalChars) * durationSeconds;
    let endTime = (charEnd / totalChars) * durationSeconds;
    const pauseEnd = (nextCharStart / totalChars) * durationSeconds;

    if (/[.!?]$/.test(word)) {
      endTime = Math.min(endTime + 0.28, pauseEnd);
    } else if (/[,;:]$/.test(word)) {
      endTime = Math.min(endTime + 0.1, pauseEnd);
    }

    timings.push({
      word: word.replace(/[^a-zA-Z0-9']/g, ""),
      startTime,
      endTime,
    });
  }
  return timings;
}

async function runEdgeTTS(voice: string, text: string): Promise<Buffer> {
  const { MsEdgeTTS, OUTPUT_FORMAT } = await import("msedge-tts");
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  const { audioStream } = tts.toStream(text);
  const chunks: Buffer[] = [];

  await new Promise<void>((resolve, reject) => {
    // Timeout: if no data arrives within 8s, abort
    const timeout = setTimeout(() => reject(new Error("TTS timeout")), 8000);
    audioStream.on("data", (chunk: unknown) => {
      chunks.push(Buffer.from(chunk as ArrayBuffer));
    });
    audioStream.on("end", () => {
      clearTimeout(timeout);
      resolve();
    });
    audioStream.on("error", (err: unknown) => {
      clearTimeout(timeout);
      reject(err);
    });
  });

  const buf = Buffer.concat(chunks);
  if (buf.length === 0) throw new Error("Empty audio from Edge TTS");
  return buf;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { text?: string; voice?: string };
  const text = (body.text ?? "").trim();
  if (!text)
    return NextResponse.json({ error: "text required" }, { status: 400 });

  const voice = body.voice ?? "en-US-AvaNeural";

  // Retry once on failure — Edge TTS WebSocket can have transient hiccups
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const audioBuffer = await runEdgeTTS(voice, text);
      // MP3 at 48kbit/s mono: duration = bytes * 8 / 48000
      const durationSeconds = (audioBuffer.length * 8) / 48000;
      const wordTimings = estimateWordTimings(text, durationSeconds);

      const response: SpeechResponse = {
        audioBase64: audioBuffer.toString("base64"),
        wordTimings,
        durationSeconds,
      };
      return NextResponse.json(response);
    } catch (err) {
      lastError = err;
      if (attempt === 0) {
        // Brief pause before retry
        await new Promise((r) => setTimeout(r, 600));
      }
    }
  }

  console.error("[puzzle-speech] failed after 2 attempts:", lastError);
  return NextResponse.json({ error: String(lastError) }, { status: 500 });
}
