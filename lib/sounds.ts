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
  | "intro-jingle"
  // Viral meme sounds
  | "vine-boom"
  | "bruh"
  | "mario-death"
  | "record-scratch"
  | "roblox-oof"
  | "airhorn"
  | "emotional-damage"
  | "taco-bell-bong"
  | "yeet"
  | "he-needs-milk"
  | "ohnono-laugh"
  | "cute-laugh"
  | "nani"
  | "baka"
  | "bro-serious";

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
  // Viral meme sounds
  "vine-boom": "/sounds/viral/vine-boom.mp3",
  "bruh": "/sounds/viral/bruh.mp3",
  "mario-death": "/sounds/viral/super-mario-death-sound-sound-effect.mp3",
  "record-scratch": "/sounds/viral/record-scratch.mp3",
  "roblox-oof": "/sounds/viral/roblox-oof.mp3",
  "airhorn": "/sounds/viral/airhorn.mp3",
  "emotional-damage": "/sounds/viral/emotional-damage-meme.mp3",
  "taco-bell-bong": "/sounds/viral/taco-bell-bong-sfx.mp3",
  "yeet": "/sounds/viral/yeet.mp3",
  "he-needs-milk": "/sounds/viral/he-needs-some-milk.mp3",
  "ohnono-laugh": "/sounds/viral/ohnono-laugh.mp3",
  "cute-laugh": "/sounds/viral/cute-girl-laughing-sound-effect.mp3",
  "nani": "/sounds/viral/alert-sound-then-nani.mp3",
  "baka": "/sounds/viral/anta-baka.mp3",
  "bro-serious": "/sounds/viral/bro-are-you-serious-right-now-bro.mp3",
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
  // Viral meme sounds — generally lower volume
  "vine-boom": 0.5,
  "bruh": 0.5,
  "mario-death": 0.4,
  "record-scratch": 0.45,
  "roblox-oof": 0.45,
  "airhorn": 0.35,
  "emotional-damage": 0.5,
  "taco-bell-bong": 0.4,
  "yeet": 0.5,
  "he-needs-milk": 0.45,
  "ohnono-laugh": 0.45,
  "cute-laugh": 0.45,
  "nani": 0.45,
  "baka": 0.45,
  "bro-serious": 0.45,
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
    // Viral memes
    "vine-boom", "bruh", "mario-death", "record-scratch",
    "roblox-oof", "airhorn", "emotional-damage", "taco-bell-bong",
    "yeet", "he-needs-milk", "ohnono-laugh", "cute-laugh", "nani", "baka", "bro-serious",
  ];
  roastSounds.forEach(getAudio);
}
