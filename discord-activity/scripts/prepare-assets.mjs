import { cp, mkdir, copyFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { makeAudio } from './make-audio.mjs';
import { makePieces } from './make-pieces.mjs';

// Copy assets only, never the main app's code, credentials, or build output.
const publicDir = new URL('../public/', import.meta.url);
await mkdir(publicDir, { recursive: true });
await cp(new URL('../../public/', import.meta.url), publicDir, { recursive: true });
await cp(new URL('../assets/', import.meta.url), new URL('activity/', publicDir), { recursive: true });
// Keep original illustrations in assets; ship compact thumbnails to mobile clients.
for (const name of await readdir(new URL('../assets/', import.meta.url))) {
  if (!name.endsWith('.png')) continue;
  const size = name === 'toy-sheet.png' ? 1280 : 640;
  await sharp(fileURLToPath(new URL(`../assets/${name}`, import.meta.url)))
    .resize(size, size, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(fileURLToPath(new URL(`activity/${name.replace(/\.png$/, '.webp')}`, publicDir)));
}
await makeAudio(new URL('activity/audio/', publicDir));
await makePieces(new URL('activity/pieces/', publicDir));
const engine = new URL('../../node_modules/stockfish/bin/', import.meta.url);
// The shared client requests the old name. Serve the single-thread build under
// both names because Emscripten may derive its WASM name from its script URL.
for (const name of ['stockfish-18-lite', 'stockfish-18-lite-single', 'stockfish']) {
  await copyFile(new URL('stockfish-18-lite-single.js', engine), new URL(`${name}.js`, publicDir));
  await copyFile(new URL('stockfish-18-lite-single.wasm', engine), new URL(`${name}.wasm`, publicDir));
}
await copyFile(new URL('../../node_modules/stockfish/Copying.txt', import.meta.url), new URL('stockfish-license.txt', publicDir));
console.log('Prepared shared assets and single-threaded Stockfish for the Activity.');
