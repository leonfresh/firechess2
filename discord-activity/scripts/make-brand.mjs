import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

// Raster export of the original vector artwork for Discord's app-icon upload.
const assets = new URL('../assets/', import.meta.url);
const logo = await readFile(new URL('logo.svg', assets), 'utf8');
const inner = logo.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><radialGradient id="bg" cx=".3" cy=".2" r="1"><stop stop-color="#344960"/><stop offset="1" stop-color="#141c31"/></radialGradient></defs><rect width="128" height="128" rx="26" fill="url(#bg)"/><rect x="3" y="3" width="122" height="122" rx="24" fill="none" stroke="#627790" stroke-opacity=".3"/><g transform="translate(12 12) scale(.81)">${inner}</g></svg>`;
await writeFile(new URL('app-icon.svg', assets), icon);
await sharp(Buffer.from(icon)).resize(1024,1024).png().toFile(new URL('app-icon.png', assets).pathname.replace(/^\/([A-Za-z]:)/,'$1'));

const board = Array.from({length:16},(_,i)=>`<rect x="${(i%4)*72}" y="${Math.floor(i/4)*72}" width="72" height="72" fill="${(i+Math.floor(i/4))%2?'#779aa3':'#ede2c8'}"/>`).join('');
const scene = `<defs><radialGradient id="scene"><stop stop-color="#344e68"/><stop offset="1" stop-color="#172238"/></radialGradient></defs><rect width="1024" height="576" fill="url(#scene)"/><g transform="translate(812 310) rotate(18)"><rect x="-12" y="-12" width="312" height="312" rx="16" fill="#b78a54"/>${board}</g><g transform="translate(-150 -170) rotate(-12)">${board}</g><path d="m870 80 8 22 23 8-23 8-8 23-8-23-22-8 22-8Z" fill="#b9acf7"/><circle cx="105" cy="470" r="8" fill="#b9acf7"/><circle cx="950" cy="220" r="5" fill="#d4f77a"/>`;
const background = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="576" viewBox="0 0 1024 576">${scene}</svg>`;
const cover = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="576" viewBox="0 0 1024 576">${scene}<g transform="translate(630 118) scale(2.1)">${inner}</g><g font-family="Arial,sans-serif" font-weight="900"><text x="80" y="242" font-size="110" fill="#111b30">CHAOS</text><text x="80" y="350" font-size="110" fill="#111b30">CHESS</text><text x="80" y="235" font-size="110" fill="#f8f1df">CHAOS</text><text x="80" y="343" font-size="110" fill="#d4f77a">CHESS</text></g><text x="86" y="405" font-family="Arial,sans-serif" font-size="22" font-weight="700" letter-spacing="3" fill="#bcc8de">SMALL PIECES. BIG TROUBLE.</text></svg>`;
for (const [name,svg] of [['activity-cover',cover],['activity-background',background]]) {
  await writeFile(new URL(`${name}.svg`,assets),svg);
  await sharp(Buffer.from(svg)).png().toFile(new URL(`${name}.png`,assets).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
}
