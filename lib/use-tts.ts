"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * TTS hook using the Web Speech API (SpeechSynthesis).
 * Prefers natural/neural English voices when available.
 */

/** Strip emojis and markdown-like symbols for cleaner speech output */
function cleanForSpeech(text: string): string {
  return text
    // Remove emojis (unicode ranges for emoticons, symbols, etc.)
    .replace(/[\u{1F300}-\u{1FAD6}\u{1FAE0}-\u{1FAF8}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, "")
    // Remove classification icons at the start
    .replace(/^[✨✅👍📖⚠️❌💀🫠🤯🧠⚡🌟🔥👑💪🫡🤦☠️😭🗿😱🚨🫠😤🛋️💀🚧🤮😬🤡😐🤷😑🫤🚶💎🎪🆓☢️🍴📌🔒🏰]/u, "")
    // Remove markdown asterisks
    .replace(/\*/g, "")
    // Remove hashtags/chess notation clutter
    .replace(/#/g, "")
    // Collapse multiple spaces
    .replace(/\s+/g, " ")
    .trim();
}

/** Score a voice — prefer natural/neural English voices */
function scoreVoice(v: SpeechSynthesisVoice): number {
  let s = 0;
  const name = v.name.toLowerCase();
  const lang = v.lang.toLowerCase();

  // Must be English
  if (!lang.startsWith("en")) return -1000;

  // Prefer natural / neural / premium voices
  if (name.includes("natural") || name.includes("neural")) s += 100;
  if (name.includes("premium") || name.includes("enhanced")) s += 50;
  if (name.includes("online")) s += 30; // Edge online voices are high quality

  // Prefer "en-US" slightly over others
  if (lang === "en-us") s += 10;
  if (lang === "en-gb") s += 5;

  // De-preference novelty voices
  if (name.includes("zarvox") || name.includes("trinoids") || name.includes("whisper") || name.includes("bells")) s -= 200;

  // Slight preference for non-default (often defaults are older)
  if (!v.default) s += 1;

  return s;
}

export interface TTSControls {
  /** Whether TTS is enabled */
  enabled: boolean;
  /** Toggle TTS on/off */
  toggle: () => void;
  /** Speak the given text immediately (cancels any current speech) */
  speak: (text: string) => void;
  /** Stop any current speech */
  stop: () => void;
  /** Whether currently speaking */
  speaking: boolean;
  /** The name of the selected voice */
  voiceName: string;
  /** Whether the browser supports TTS */
  supported: boolean;
}

export function useTTS(): TTSControls {
  const [enabled, setEnabled] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceName, setVoiceName] = useState("");
  const [supported, setSupported] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // Detect support and pick best voice
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    setSupported(true);

    function pickVoice() {
      const voices = speechSynthesis.getVoices();
      if (voices.length === 0) return;

      const scored = voices
        .map(v => ({ voice: v, score: scoreVoice(v) }))
        .filter(v => v.score > -1000)
        .sort((a, b) => b.score - a.score);

      if (scored.length > 0) {
        voiceRef.current = scored[0].voice;
        setVoiceName(scored[0].voice.name);
      }
    }

    pickVoice();
    // Voices may load asynchronously (Chrome)
    speechSynthesis.onvoiceschanged = pickVoice;

    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!enabled || !supported) return;

    speechSynthesis.cancel();

    const clean = cleanForSpeech(text);
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    if (voiceRef.current) utterance.voice = voiceRef.current;
    utterance.rate = 1.05; // slightly faster for commentary feel
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    speechSynthesis.speak(utterance);
  }, [enabled, supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const toggle = useCallback(() => {
    setEnabled(prev => {
      if (prev) {
        // Turning off — stop any current speech
        speechSynthesis.cancel();
        setSpeaking(false);
      }
      return !prev;
    });
  }, []);

  return { enabled, toggle, speak, stop, speaking, voiceName, supported };
}
