/**
 * Sound effects for chess moves and interactions.
 * Uses the Web Audio API with lazy-loaded Audio objects for low-latency playback.
 */

type SoundName = "move" | "capture" | "check" | "select" | "correct" | "wrong";

const SOUND_PATHS: Record<SoundName, string> = {
  move: "/sounds/Move.mp3",
  capture: "/sounds/Capture.mp3",
  check: "/sounds/Check.mp3",
  select: "/sounds/Select.mp3",
  correct: "/sounds/Correct.mp3",
  wrong: "/sounds/Wrong.mp3",
};

const audioCache = new Map<SoundName, HTMLAudioElement>();

function getAudio(name: SoundName): HTMLAudioElement {
  let audio = audioCache.get(name);
  if (!audio) {
    audio = new Audio(SOUND_PATHS[name]);
    audio.preload = "auto";
    audioCache.set(name, audio);
  }
  return audio;
}

/** Play a chess sound effect. Fails silently if audio is blocked. */
export function playSound(name: SoundName): void {
  try {
    const audio = getAudio(name);
    audio.currentTime = 0;
    audio.volume = 0.6;
    audio.play().catch(() => {});
  } catch {
    // Audio not available (SSR, permissions, etc.)
  }
}

/** Preload all sounds so they play instantly on first trigger. */
export function preloadSounds(): void {
  (Object.keys(SOUND_PATHS) as SoundName[]).forEach(getAudio);
}
