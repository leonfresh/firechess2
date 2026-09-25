// Writes the Chaos Chess synthesized cues into the website's public/activity/audio, so the website
// uses the same sounds as the Discord Activity (which regenerates the same files at build time via
// discord-activity/scripts/prepare-assets.mjs). Re-run after changing make-audio.mjs.
//   node scripts/make-chaos-audio.mjs
import { makeAudio } from '../discord-activity/scripts/make-audio.mjs';
await makeAudio(new URL('../public/activity/audio/', import.meta.url));
console.log('Chaos cues written to public/activity/audio/');
