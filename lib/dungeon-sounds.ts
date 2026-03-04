/**
 * Dungeon Tactics game sound effects.
 * Generated via Python synthesis (scripts/generate-dungeon-sounds.py).
 */

type DungeonSoundName =
  | "battleStart"
  | "bossIntro"
  | "perkPickup"
  | "damage"
  | "heal"
  | "shopBuy"
  | "victory"
  | "death"
  | "footstep"
  | "event"
  | "coin"
  | "levelUp";

const DUNGEON_SOUND_PATHS: Record<DungeonSoundName, string> = {
  battleStart: "/sounds/dungeon/BattleStart.wav",
  bossIntro: "/sounds/dungeon/BossIntro.wav",
  perkPickup: "/sounds/dungeon/PerkPickup.wav",
  damage: "/sounds/dungeon/Damage.wav",
  heal: "/sounds/dungeon/Heal.wav",
  shopBuy: "/sounds/dungeon/ShopBuy.wav",
  victory: "/sounds/dungeon/Victory.wav",
  death: "/sounds/dungeon/Death.wav",
  footstep: "/sounds/dungeon/Footstep.wav",
  event: "/sounds/dungeon/Event.wav",
  coin: "/sounds/dungeon/Coin.wav",
  levelUp: "/sounds/dungeon/LevelUp.wav",
};

const audioCache = new Map<DungeonSoundName, HTMLAudioElement>();

function getAudio(name: DungeonSoundName): HTMLAudioElement {
  let audio = audioCache.get(name);
  if (!audio) {
    audio = new Audio(DUNGEON_SOUND_PATHS[name]);
    audio.preload = "auto";
    audioCache.set(name, audio);
  }
  return audio;
}

/** Play a dungeon sound effect. Fails silently if audio is blocked. */
export function playDungeonSound(name: DungeonSoundName): void {
  try {
    const audio = getAudio(name);
    audio.currentTime = 0;
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch {
    // Audio not available
  }
}

/** Preload all dungeon sounds so they play instantly. */
export function preloadDungeonSounds(): void {
  (Object.keys(DUNGEON_SOUND_PATHS) as DungeonSoundName[]).forEach(getAudio);
}
