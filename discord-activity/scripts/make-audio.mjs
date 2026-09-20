import { mkdir, writeFile } from 'node:fs/promises';

// Original, short synthesized cues. No samples or third-party recordings.
export async function makeAudio(directory) {
  await mkdir(directory, { recursive: true });
  const cues = {
    move: [0.11, [420, 220]], capture: [0.18, [250, 125]],
    select: [0.1, [660]], check: [0.34, [740, 880]],
    deal: [0.22, [330, 440, 550]], draft: [0.45, [523.25, 659.25, 783.99]],
    win: [0.65, [523.25, 659.25, 783.99, 1046.5]],
    bonk: [0.16, [180, 95]], surprise: [0.3, [440, 698.46]],
    stumble: [0.46, [392, 311.13, 261.63]], sparkle: [0.36, [783.99, 1046.5, 1318.51]],
    boing: [0.3, [220, 440, 330]], defeat: [0.7, [392, 349.23, 293.66, 196]],
  };
  for (const [name, [duration, notes]] of Object.entries(cues)) {
    const rate = 22050, count = Math.floor(rate * duration);
    const file = Buffer.alloc(44 + count * 2);
    file.write('RIFF'); file.writeUInt32LE(file.length - 8, 4); file.write('WAVEfmt ', 8);
    file.writeUInt32LE(16, 16); file.writeUInt16LE(1, 20); file.writeUInt16LE(1, 22);
    file.writeUInt32LE(rate, 24); file.writeUInt32LE(rate * 2, 28);
    file.writeUInt16LE(2, 32); file.writeUInt16LE(16, 34); file.write('data', 36); file.writeUInt32LE(count * 2, 40);
    for (let i = 0; i < count; i++) {
      const t = i / rate;
      let signal = 0;
      notes.forEach((frequency, index) => {
        const age = t - index * duration / (notes.length + 1);
        if (age >= 0) signal += Math.sin(2 * Math.PI * frequency * age) * Math.min(1, age / 0.006) * Math.exp(-age * 20);
      });
      const fade = Math.min(1, (duration - t) / 0.025);
      file.writeInt16LE(Math.round(Math.max(-1, Math.min(1, signal / notes.length * 0.65 * fade)) * 32767), 44 + i * 2);
    }
    await writeFile(new URL(`${name}.wav`, directory), file);
  }
}
