import { mkdir, writeFile } from 'node:fs/promises';

// Original, short synthesized cues. No samples or third-party recordings.
// Each cue is [seconds, notes (Hz, played in sequence), options]. Options: `decay` (per second,
// default 20: higher is plucked, lower rings on) and `noise` (a filtered noise sweep instead of
// notes, for the whoosh).
export const CUES = {
  move: [0.11, [420, 220]], capture: [0.18, [250, 125]],
  select: [0.1, [660]], check: [0.34, [740, 880]],
  deal: [0.22, [330, 440, 550]], draft: [0.45, [523.25, 659.25, 783.99]],
  win: [0.65, [523.25, 659.25, 783.99, 1046.5]],
  bonk: [0.16, [180, 95]], surprise: [0.3, [440, 698.46]],
  stumble: [0.46, [392, 311.13, 261.63]], sparkle: [0.36, [783.99, 1046.5, 1318.51]],
  boing: [0.3, [220, 440, 330]], defeat: [0.7, [392, 349.23, 293.66, 196]],
  // Low time: a dry wooden tick-tock, distinct from every other cue.
  tick: [0.2, [1568, 1175], { decay: 60 }],
  // Revive / summon: a slow rising shimmer that rings on.
  revive: [0.8, [392, 523.25, 659.25, 783.99, 1046.5, 1318.51], { decay: 6 }],
  // Back to the live game: an airy sweep.
  whoosh: [0.34, [], { noise: true }],
};

function render(duration, notes, options = {}) {
  const rate = 22050, count = Math.floor(rate * duration);
  const decay = options.decay ?? 20;
  const samples = new Float32Array(count);
  if (options.noise) {
    // Deterministic noise (seeded), through a one-pole low-pass whose cutoff sweeps up then down.
    let seed = 1234567, low = 0;
    for (let i = 0; i < count; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      const white = seed / 0x3fffffff - 1;
      const t = i / count;
      const cutoff = 0.02 + 0.35 * Math.sin(Math.PI * t);
      low += cutoff * (white - low);
      samples[i] = low * Math.sin(Math.PI * t) * 0.5;
    }
  } else {
    for (let i = 0; i < count; i++) {
      const t = i / rate;
      let signal = 0;
      notes.forEach((frequency, index) => {
        const age = t - index * duration / (notes.length + 1);
        if (age >= 0) signal += Math.sin(2 * Math.PI * frequency * age) * Math.min(1, age / 0.006) * Math.exp(-age * decay);
      });
      samples[i] = signal / notes.length;
    }
  }
  const file = Buffer.alloc(44 + count * 2);
  file.write('RIFF'); file.writeUInt32LE(file.length - 8, 4); file.write('WAVEfmt ', 8);
  file.writeUInt32LE(16, 16); file.writeUInt16LE(1, 20); file.writeUInt16LE(1, 22);
  file.writeUInt32LE(rate, 24); file.writeUInt32LE(rate * 2, 28);
  file.writeUInt16LE(2, 32); file.writeUInt16LE(16, 34); file.write('data', 36); file.writeUInt32LE(count * 2, 40);
  for (let i = 0; i < count; i++) {
    const fade = Math.min(1, (duration - i / rate) / 0.025);
    file.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i] * 0.65 * fade)) * 32767), 44 + i * 2);
  }
  return file;
}

export async function makeAudio(directory) {
  await mkdir(directory, { recursive: true });
  for (const [name, [duration, notes, options]] of Object.entries(CUES)) {
    await writeFile(new URL(`${name}.wav`, directory), render(duration, notes, options));
  }
}
