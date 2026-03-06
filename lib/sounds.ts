/**
 * Sound effects for chess moves, interactions, and gameshow-style roast sounds.
 * Uses the Web Audio API with lazy-loaded Audio objects for low-latency playback.
 */

type SoundName =
  | "move"
  | "capture"
  | "check"
  | "select"
  | "correct"
  | "wrong"
  // Gameshow / roast sounds
  | "applause"
  | "applause-short"
  | "buzzer"
  | "bell"
  | "bell-double"
  | "crowd-ooh"
  | "crowd-laugh"
  | "reveal-stinger"
  | "drumroll"
  | "sad-trombone"
  | "honk"
  | "intro-jingle";

const SOUND_PATHS: Record<SoundName, string> = {
  move: "/sounds/Move.mp3",
  capture: "/sounds/Capture.mp3",
  check: "/sounds/Check.mp3",
  select: "/sounds/Select.mp3",
  correct: "/sounds/Correct.mp3",
  wrong: "/sounds/Wrong.mp3",
  // Gameshow / roast sounds (WAV)
  applause: "/sounds/roast/applause.wav",
  "applause-short": "/sounds/roast/applause-short.wav",
  buzzer: "/sounds/roast/buzzer.wav",
  bell: "/sounds/roast/bell.wav",
  "bell-double": "/sounds/roast/bell-double.wav",
  "crowd-ooh": "/sounds/roast/crowd-ooh.wav",
  "crowd-laugh": "/sounds/roast/crowd-laugh.wav",
  "reveal-stinger": "/sounds/roast/reveal-stinger.wav",
  drumroll: "/sounds/roast/drumroll.wav",
  "sad-trombone": "/sounds/roast/sad-trombone.wav",
  honk: "/sounds/roast/honk.wav",
  "intro-jingle": "/sounds/roast/intro-jingle.wav",
};

/** Volume overrides for different sound categories */
const SOUND_VOLUMES: Partial<Record<SoundName, number>> = {
  applause: 0.4,
  "applause-short": 0.4,
  buzzer: 0.5,
  "crowd-ooh": 0.35,
  "crowd-laugh": 0.35,
  drumroll: 0.35,
  "sad-trombone": 0.45,
  honk: 0.5,
  "intro-jingle": 0.4,
  "reveal-stinger": 0.4,
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

/** Play a sound effect. Fails silently if audio is blocked. */
export function playSound(name: SoundName): void {
  try {
    const audio = getAudio(name);
    audio.currentTime = 0;
    audio.volume = SOUND_VOLUMES[name] ?? 0.6;
    audio.play().catch(() => {});
  } catch {
    // Audio not available (SSR, permissions, etc.)
  }
}

/** Preload all sounds so they play instantly on first trigger. */
export function preloadSounds(): void {
  (Object.keys(SOUND_PATHS) as SoundName[]).forEach(getAudio);
}

/** Preload only the roast/gameshow sounds. */
export function preloadRoastSounds(): void {
  const roastSounds: SoundName[] = [
    "applause", "applause-short", "buzzer", "bell", "bell-double",
    "crowd-ooh", "crowd-laugh", "reveal-stinger", "drumroll",
    "sad-trombone", "honk", "intro-jingle",
  ];
  roastSounds.forEach(getAudio);
}
