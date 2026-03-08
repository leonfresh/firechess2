"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * TTS hook using the Web Speech API (SpeechSynthesis).
 * Prefers natural/neural English voices when available.
 */

/** Strip emojis and markdown-like symbols for cleaner speech output */
function cleanForSpeech(text: string): string {
  return text
    // Remove ALL emoji characters — Extended_Pictographic catches nearly everything,
    // plus regional indicators (flags), skin-tone modifiers, variation selectors,
    // ZWJ (Zero Width Joiner), keycap combining, and tag characters.
    .replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]+/gu, ". ")
    // Remove markdown asterisks
    .replace(/\*/g, "")
    // Chess checkmate — # is the standard notation (e.g. Qxf7#)
    .replace(/#/g, " checkmate")
    // Expand chess notation for TTS readability
    // Castling
    .replace(/\bO-O-O\b/g, "queenside castles")
    .replace(/\bO-O\b/g, "kingside castles")
    // Piece moves: Ngxe5 → Knight g takes e5, R1d3 → Rook 1 d3, Bxe5 → Bishop takes e5, Nf3 → Knight f3
    .replace(/\b([KQRBN])([a-h])?([1-8])?x([a-h][1-8])\b/g, (_m, p, f, r, sq) => {
      const names: Record<string, string> = { K: "King", Q: "Queen", R: "Rook", B: "Bishop", N: "Knight" };
      const disambig = f || r ? `${f || ""}${r || ""} ` : "";
      return `${names[p]} ${disambig}takes ${sq}`;
    })
    .replace(/\b([KQRBN])([a-h]?)([1-8]?)([a-h][1-8])\b/g, (_m, p, f, r, sq) => {
      const names: Record<string, string> = { K: "King", Q: "Queen", R: "Rook", B: "Bishop", N: "Knight" };
      const disambig = f || r ? `${f || ""}${r || ""} ` : "";
      return `${names[p]} ${disambig}${sq}`;
    })
    // Pawn captures: exd5 → e takes d5
    .replace(/\b([a-h])x([a-h][1-8])\b/g, "$1 takes $2")
    // Promotion: e8=Q → e8 promotes to Queen
    .replace(/\b([a-h][18])=([QRBN])\b/g, (_m, sq, p) => {
      const names: Record<string, string> = { Q: "Queen", R: "Rook", B: "Bishop", N: "Knight" };
      return `${sq} promotes to ${names[p]}`;
    })
    // Handle ALT+F4 and similar non-chess plus signs BEFORE chess notation
    .replace(/\bAlt[+-]F4\b/gi, "alt F4")
    .replace(/\bCTRL\+[A-Z]\b/gi, (m) => m.replace("+", " "))
    // Double-check (++) and single check (+) — chess notation
    .replace(/\+\+/g, " double check")
    .replace(/\+/g, " check")
    // ALL CAPS words → titlecase for natural TTS (skip short acronyms ≤3 chars)
    .replace(/\b[A-Z]{4,}\b/g, (word) => word[0] + word.slice(1).toLowerCase())
    // Expand internet slang & abbreviations for natural TTS
    .replace(/\bfr fr\b/gi, "for real for real")
    .replace(/\bfr\b/gi, "for real")
    .replace(/\bngl\b/gi, "not gonna lie")
    .replace(/\btbh\b/gi, "to be honest")
    .replace(/\brn\b/gi, "right now")
    .replace(/\bbtw\b/gi, "by the way")
    .replace(/\bgg\b/gi, "G G")
    .replace(/\bjk\b/gi, "just kidding")
    .replace(/\bRIP\b/g, "R I P")
    .replace(/\bAKA\b/g, "A K A")
    .replace(/\bGM\b/g, "G M")
    .replace(/\btho\b/gi, "though")
    .replace(/\bany%\b/gi, "any percent")
    .replace(/\bIMO\b/g, "in my opinion")
    .replace(/\blol\b/gi, "lol")
    .replace(/\bPIPI\b/g, "pipi")
    .replace(/\bsmh\b/gi, "shaking my head")
    .replace(/\bidk\b/gi, "I don't know")
    .replace(/\bpls\b/gi, "please")
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
  /** Speak the given text immediately (cancels any current speech). Returns a promise that resolves when speech ends. */
  speak: (text: string) => void;
  /** Stop any current speech */
  stop: () => void;
  /** Whether currently speaking */
  speaking: boolean;
  /** The name of the selected voice */
  voiceName: string;
  /** Whether the browser supports TTS */
  supported: boolean;
  /** Register a callback for when the current utterance finishes */
  onDone: React.MutableRefObject<(() => void) | null>;
  /** Available English voices for selection */
  availableVoices: { name: string; lang: string }[];
  /** Set a specific voice by name */
  setVoice: (name: string) => void;
  /** Current rate (0.5-2.0) */
  rate: number;
  /** Set playback rate */
  setRate: (rate: number) => void;
}

export function useTTS(): TTSControls {
  const [enabled, setEnabled] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [voiceName, setVoiceName] = useState("");
  const [supported, setSupported] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<{ name: string; lang: string }[]>([]);
  const [rate, setRateState] = useState(1.05);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const allVoicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const onDone = useRef<(() => void) | null>(null);

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

      // Store all English voices for selection UI
      allVoicesRef.current = scored.map(s => s.voice);
      setAvailableVoices(scored.map(s => ({ name: s.voice.name, lang: s.voice.lang })));

      // Only auto-pick if no voice is selected yet
      if (!voiceRef.current && scored.length > 0) {
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

  const setVoice = useCallback((name: string) => {
    const match = allVoicesRef.current.find(v => v.name === name);
    if (match) {
      voiceRef.current = match;
      setVoiceName(match.name);
    }
  }, []);

  const setRate = useCallback((r: number) => {
    setRateState(Math.max(0.5, Math.min(2.0, r)));
  }, []);

  const speak = useCallback((text: string) => {
    if (!enabled || !supported) return;

    speechSynthesis.cancel();

    const clean = cleanForSpeech(text);
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    if (voiceRef.current) utterance.voice = voiceRef.current;
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Set speaking synchronously so effects checking tts.speaking
    // don't race past before the browser's onstart callback fires.
    setSpeaking(true);
    utterance.onend = () => { setSpeaking(false); onDone.current?.(); };
    utterance.onerror = () => { setSpeaking(false); onDone.current?.(); };

    speechSynthesis.speak(utterance);
  }, [enabled, supported, rate]);

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

  return { enabled, toggle, speak, stop, speaking, voiceName, supported, onDone, availableVoices, setVoice, rate, setRate };
}
