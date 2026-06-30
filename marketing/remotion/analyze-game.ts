/**
 * Analyze the roast game with the bundled Stockfish: real eval per position,
 * real per-move classification (via the app's classifyMoveQuality), and the
 * real single-game accuracy / blunder count for White. Writes src/game-analysis.json.
 *
 * Run from repo root:  npx tsx marketing/remotion/analyze-game.ts
 */
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { Chess } from "chess.js";
import { classifyMoveQuality } from "../../lib/move-quality";

const require = createRequire(import.meta.url);
const initEngine = require("stockfish");

const SANS = ["e4","e5","Bc4","Nc6","Qh5","g6","Qf3","Nf6","d3","Bg7","Nh3","O-O","O-O","d6","Qg3","Nd4","c3","Ne2+","Kh1","Nxg3"];
const DEPTH = 15;
const MATE_CP = 2000;

// ── engine plumbing: Emscripten prints via console.log ──
let handler: ((line: string) => void) | null = null;
const realLog = console.log.bind(console);
const log = (...a: unknown[]) => process.stderr.write(a.join(" ") + "\n");

async function main() {
  const engine: any = await initEngine("lite-single");
  console.log = (line: unknown) => { if (handler) handler(String(line)); };

  function evalFen(fen: string): Promise<{ cp: number; best: string }> {
    return new Promise((resolve) => {
      let lastCp: number | null = null;
      handler = (line) => {
        const m = line.match(/score (cp|mate) (-?\d+)/);
        if (m) lastCp = m[1] === "cp" ? parseInt(m[2], 10) : (parseInt(m[2], 10) >= 0 ? MATE_CP : -MATE_CP);
        const b = line.match(/^bestmove (\S+)/);
        if (b) resolve({ cp: lastCp ?? 0, best: b[1] });
      };
      engine.sendCommand("position fen " + fen);
      engine.sendCommand("go depth " + DEPTH);
    });
  }

  // build positions + played UCIs
  const c = new Chess();
  const fens = [c.fen()];
  const uci: string[] = [];
  for (const san of SANS) { const mv = c.move(san); uci.push(mv.from + mv.to + (mv.promotion ?? "")); fens.push(c.fen()); }

  // eval every position (side-to-move perspective)
  const cps: number[] = [];
  for (let i = 0; i < fens.length; i++) {
    const { cp, best } = await evalFen(fens[i]);
    cps.push(cp);
    (evalFen as any)._best = best;
    fenBest[i] = best;
    log(`pos ${i}: cp(stm)=${cp} best=${best}`);
  }

  // eval from White's perspective for the bar
  const evalWhite = fens.map((f, i) => (f.split(" ")[1] === "w" ? cps[i] : -cps[i]))
    .map((v) => Math.max(-1500, Math.min(1500, v)));

  // classify each move
  const moves = SANS.map((san, k) => {
    const moverIsWhite = k % 2 === 0;
    // cps[i] is from the side-to-move's perspective. The mover IS the stm at fens[k],
    // and the opponent is the stm at fens[k+1], so flip the sign for "after".
    const evalBeforeMover = cps[k];
    const evalAfterMover = -cps[k + 1];
    const cpLoss = Math.max(0, evalBeforeMover - evalAfterMover);
    const isBestMove = uci[k] === fenBest[k] || cpLoss <= 4;
    const classification = classifyMoveQuality({
      cpLoss, isBestMove, evalBeforeMover, evalAfterMover,
      fenBefore: fens[k], moveUci: uci[k], moveIndex: k,
    });
    return { ply: k + 1, san, white: moverIsWhite, cpLoss: Math.round(cpLoss), classification };
  });

  // White single-game accuracy + counts (app formula)
  const whiteMoves = moves.filter((m) => m.white);
  const avgCp = whiteMoves.reduce((s, m) => s + m.cpLoss, 0) / Math.max(1, whiteMoves.length);
  const whiteAccuracy = Math.min(99.5, Math.max(25, 100 * Math.exp(-avgCp / 180)));
  const count = (c: string) => whiteMoves.filter((m) => m.classification === c).length;

  const out = {
    evalWhite,
    moves,
    whiteAccuracy: Math.round(whiteAccuracy * 10) / 10,
    whiteAvgCpLoss: Math.round(avgCp),
    whiteBlunders: count("blunder"),
    whiteMistakes: count("mistake"),
    whiteInaccuracies: count("inaccuracy"),
  };
  console.log = realLog;
  writeFileSync(new URL("./src/game-analysis.json", import.meta.url), JSON.stringify(out, null, 2));
  log(`\n✓ wrote game-analysis.json | acc ${out.whiteAccuracy}% | blunders ${out.whiteBlunders} | mistakes ${out.whiteMistakes}`);
  log(moves.map((m) => `${m.ply}.${m.san}[${m.classification} ${m.cpLoss}]`).join(" "));
  process.exit(0);
}

const fenBest: string[] = [];
main();
