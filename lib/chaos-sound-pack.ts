/**
 * One sound identity for Chaos Chess, on the website and in the Discord Activity: short synthesized
 * cartoon cues (discord-activity/scripts/make-audio.mjs, also written to public/activity/audio by
 * scripts/make-chaos-audio.mjs) with reactions rate-limited so a busy turn can't stack a pile of
 * clips. The Activity also turns the meme clips into cartoon cues; the website keeps the real clips
 * behind its meme toggle.
 */

import { configureSoundPack, resetSoundPack } from "@/lib/sounds";

type Pack = Parameters<typeof configureSoundPack>[0];
const cue = (name: string) => `/activity/audio/${name}.wav`;

/** Game and gameshow sounds, the same everywhere Chaos is played. */
export const CHAOS_CORE_SOUNDS: Pack = {
  move: cue("move"), capture: cue("capture"), select: cue("select"), check: cue("check"),
  correct: cue("win"), wrong: cue("bonk"), applause: cue("win"), "applause-short": cue("sparkle"),
  buzzer: cue("bonk"), bell: cue("select"), "bell-double": cue("surprise"), "crowd-ooh": cue("surprise"),
  "crowd-laugh": cue("boing"), "reveal-stinger": cue("draft"), drumroll: cue("deal"),
  "sad-trombone": cue("defeat"), honk: cue("boing"), "intro-jingle": cue("win"),
  "clock-tick": cue("tick"), revive: cue("revive"), whoosh: cue("whoosh"),
};

/** Meme reactions as cartoon cues (the Activity). vine-boom, bruh and oof stay real everywhere. */
export const CHAOS_CARTOON_MEMES: Pack = {
  "mario-death": cue("defeat"), "record-scratch": cue("stumble"), airhorn: cue("win"),
  "emotional-damage": cue("bonk"), "taco-bell-bong": cue("sparkle"), yeet: cue("boing"),
  "he-needs-milk": cue("stumble"), "ohnono-laugh": cue("boing"), "cute-laugh": cue("sparkle"),
  nani: cue("surprise"), baka: cue("bonk"), "bro-serious": cue("stumble"),
};

/** One reaction at a time: at most every 1.8s, cut off after 1.6s. */
export const CHAOS_REACTION_LIMITS = { reactionCooldownMs: 1800, maxReactionMs: 1600 };

let permanent = false;
let users = 0;

/**
 * Install the Chaos sounds. Website pages call this on mount and the returned function on unmount,
 * which puts the site's default sounds back once no Chaos page is left (so the roast, puzzles and
 * analysis keep theirs). The Activity installs them permanently.
 */
export function installChaosSounds(options: { permanent?: boolean; cartoonMemes?: boolean } = {}): () => void {
  // Inside the Activity the permanent pack is already in place: a shared page must not swap it.
  if (permanent && !options.permanent) return () => {};
  configureSoundPack({ ...CHAOS_CORE_SOUNDS, ...(options.cartoonMemes ? CHAOS_CARTOON_MEMES : {}) }, CHAOS_REACTION_LIMITS);
  if (options.permanent) {
    permanent = true;
    return () => {};
  }
  users++;
  return () => {
    users = Math.max(0, users - 1);
    if (users === 0 && !permanent) resetSoundPack();
  };
}
