// Fix double-encoded UTF-8 in app/puzzles/page.tsx
// The file's UTF-8 bytes were interpreted as Windows-1252 and re-saved as UTF-8,
// causing garbled characters. This script reverses that process.
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "app", "puzzles", "page.tsx");

// Windows-1252 specific mappings for 0x80-0x9F range
const win1252Extra = {
  0x80: 0x20ac,
  0x82: 0x201a,
  0x83: 0x0192,
  0x84: 0x201e,
  0x85: 0x2026,
  0x86: 0x2020,
  0x87: 0x2021,
  0x88: 0x02c6,
  0x89: 0x2030,
  0x8a: 0x0160,
  0x8b: 0x2039,
  0x8c: 0x0152,
  0x8e: 0x017d,
  0x91: 0x2018,
  0x92: 0x2019,
  0x93: 0x201c,
  0x94: 0x201d,
  0x95: 0x2022,
  0x96: 0x2013,
  0x97: 0x2014,
  0x98: 0x02dc,
  0x99: 0x2122,
  0x9a: 0x0161,
  0x9b: 0x203a,
  0x9c: 0x0153,
  0x9e: 0x017e,
  0x9f: 0x0178,
};

// Build reverse map: Unicode codepoint → Windows-1252 byte
const revMap = new Map();
// Standard Latin-1 range (0x00-0xFF minus Windows-1252 overrides)
for (let i = 0; i <= 0xff; i++) {
  revMap.set(i, i); // default: byte == codepoint for Latin-1
}
// Override with Windows-1252 specific mappings
for (const [byteVal, uniCP] of Object.entries(win1252Extra)) {
  revMap.set(uniCP, parseInt(byteVal));
}

const content = fs.readFileSync(filePath, "utf8");
const bytes = [];

for (const ch of content) {
  const cp = ch.codePointAt(0);
  if (cp !== undefined && revMap.has(cp)) {
    bytes.push(revMap.get(cp));
  } else if (cp !== undefined && cp <= 0xffff) {
    // Character outside Windows-1252 — write as UTF-8 bytes
    const buf = Buffer.from(ch, "utf8");
    for (const b of buf) bytes.push(b);
  } else if (cp !== undefined) {
    // Supplementary plane character (already correct, keep as UTF-8)
    const buf = Buffer.from(ch, "utf8");
    for (const b of buf) bytes.push(b);
  }
}

const fixed = Buffer.from(bytes).toString("utf8");
fs.writeFileSync(filePath, fixed, "utf8");
console.log("Encoding fixed. File written with correct UTF-8.");
