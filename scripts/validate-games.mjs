import { readFileSync } from "fs";
import { Chess } from "chess.js";

const src = readFileSync("./lib/famous-games.ts", "utf8");

// Extract id, fen, moves in order by finding each game object
// Use a simple approach: find all id/fen/moves occurrences in order
const entries = [];
// Match game objects by finding id: then fen: then moves: in sequence
const gameRe =
  /id:\s*"([\w-]+)"[\s\S]*?fen:\s*"([^"]+)"[\s\S]*?moves:\s*"([^"]+)"/g;
let m;
while ((m = gameRe.exec(src)) !== null) {
  entries.push({ id: m[1], fen: m[2], moves: m[3] });
}

console.log(`Found ${entries.length} games\n`);

for (const { id, fen, moves } of entries) {
  const chess = new Chess(fen);
  const mv = moves
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  let failIdx = -1;
  const valid = [];
  for (let j = 0; j < mv.length; j++) {
    try {
      const r = chess.move(mv[j]);
      if (!r) {
        failIdx = j;
        break;
      }
      valid.push(mv[j]);
    } catch {
      failIdx = j;
      break;
    }
  }
  if (failIdx === -1) {
    console.log(`✓ ${id} (${mv.length} moves)`);
  } else {
    console.log(
      `✗ ${id} — fails at [${failIdx}]/${mv.length}: "${mv[failIdx]}"`,
    );
    console.log(`  valid prefix (${valid.length} moves): ${valid.join(",")}`);
    console.log("");
  }
}
