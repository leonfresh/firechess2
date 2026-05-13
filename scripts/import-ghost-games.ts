/**
 * scripts/import-ghost-games.ts
 *
 * Parses scripts/data/ghost-games-seed.json, walks each game with chess.js
 * (loadPgn for quality validation), pre-bakes Cook candidates using a local
 * Stockfish engine (depth 16), then upserts all rows into the ghost_game table.
 *
 * Run with:
 *   npx tsx scripts/import-ghost-games.ts
 */

import { readFileSync } from "fs";
import { join } from "path";
import { Chess } from "chess.js";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { config } from "dotenv";

config({ path: ".env.local" });

import { ghostGames } from "../lib/schema.js";
import type { GhostGameMove, GhostCookCandidate } from "../lib/schema.js";

/* ------------------------------------------------------------------ */
/*  Stockfish UCI wrapper                                               */
/* ------------------------------------------------------------------ */

interface StockfishEngine {
  sendCommand: (cmd: string) => void;
  listener?: (line: string) => void;
}

type EngineResult = { cp: number; bestMove: string | null };

async function createEngine(): Promise<{
  evaluate: (fen: string, depth?: number) => Promise<EngineResult>;
  quit: () => void;
}> {
  // lite-single: ~7 MB WASM, single-threaded — works cleanly in Node.js
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const initEngine = require("stockfish") as (
    path?: string,
  ) => Promise<StockfishEngine>;
  const engine = await initEngine("lite-single");

  await new Promise<void>((resolve) => {
    engine.listener = (line: string) => {
      if (line.includes("uciok")) {
        engine.listener = undefined;
        resolve();
      }
    };
    engine.sendCommand("uci");
  });

  await new Promise<void>((resolve) => {
    engine.listener = (line: string) => {
      if (line.includes("readyok")) {
        engine.listener = undefined;
        resolve();
      }
    };
    engine.sendCommand("isready");
  });

  const evaluate = (fen: string, depth = 16): Promise<EngineResult> =>
    new Promise((resolve) => {
      let bestCp = 0;
      let bestMove: string | null = null;

      engine.listener = (line: string) => {
        const scoreMatch = line.match(/score (cp|mate) (-?\d+)/);
        if (scoreMatch) {
          const type = scoreMatch[1];
          const val = parseInt(scoreMatch[2]);
          bestCp = type === "cp" ? val : val > 0 ? 100_000 : -100_000;
        }
        const bestmoveMatch = line.match(/^bestmove (\S+)/);
        if (bestmoveMatch) {
          bestMove = bestmoveMatch[1] === "(none)" ? null : bestmoveMatch[1];
          engine.listener = undefined;
          resolve({ cp: bestCp, bestMove });
        }
      };

      engine.sendCommand("ucinewgame");
      engine.sendCommand(`position fen ${fen}`);
      engine.sendCommand(`go depth ${depth}`);
    });

  const quit = () => engine.sendCommand("quit");

  return { evaluate, quit };
}

/* ------------------------------------------------------------------ */
/*  DB                                                                  */
/* ------------------------------------------------------------------ */

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema: { ghostGames } });

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/* ------------------------------------------------------------------ */
/*  PGN → moves array                                                   */
/* ------------------------------------------------------------------ */

type SeedGame = {
  whiteName: string;
  blackName: string;
  whiteElo: number | null;
  blackElo: number | null;
  tournament: string;
  eventDate: string;
  result: string;
  eco?: string;
  openingName?: string;
  pgnMoves: string;
  playAs: "white" | "black";
  startPly: number;
  endPly: number;
  missionTitle: string;
  missionContext: string;
  missionObjective: string;
  difficulty: "beginner" | "intermediate" | "expert";
  tags: string[];
  featured: boolean;
  sourceUrl?: string;
};

function buildMovesArray(pgnMoves: string): GhostGameMove[] {
  // Primary: chess.js loadPgn — handles annotations, move numbers, comments
  const chess = new Chess();
  try {
    chess.loadPgn(pgnMoves);
    const history = chess.history({ verbose: true });
    if (history.length > 0) {
      return history.map((mv, ply) => ({
        ply,
        san: mv.san,
        uci: `${mv.from}${mv.to}${mv.promotion ?? ""}`,
        fenAfter: mv.after,
      }));
    }
  } catch {
    // fall through to manual tokeniser
  }

  // Fallback: strip comments/variations/NAG, then tokenise
  const chess2 = new Chess();
  const cleaned = pgnMoves
    .replace(/\{[^}]*\}/g, " ") // strip { comments }
    .replace(/\([^)]*\)/g, " ") // strip (variations)
    .replace(/\$\d+/g, " "); // strip $NAG codes

  const tokens = cleaned
    .trim()
    .split(/\s+/)
    .filter(
      (t) =>
        t &&
        !/^\d+\.+$/.test(t) &&
        !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(t),
    );

  const result: GhostGameMove[] = [];

  for (let ply = 0; ply < tokens.length; ply++) {
    const san = tokens[ply].replace(/[!?]+$/, ""); // strip !?
    let mv: ReturnType<Chess["move"]> | null = null;
    try {
      mv = chess2.move(san);
    } catch {
      console.warn(`  ⚠ Invalid move at ply ${ply}: ${san}`);
      break;
    }
    if (!mv) {
      console.warn(`  ⚠ Null move result at ply ${ply}: ${san}`);
      break;
    }
    result.push({
      ply,
      san: mv.san,
      uci: `${mv.from}${mv.to}${mv.promotion ?? ""}`,
      fenAfter: chess2.fen(),
    });
  }

  return result;
}

/* ------------------------------------------------------------------ */
/*  Cook candidate detection (local Stockfish, depth 16)               */
/* ------------------------------------------------------------------ */

async function detectCooks(
  moves: GhostGameMove[],
  startPly: number,
  endPly: number,
  evaluate: (fen: string, depth?: number) => Promise<EngineResult>,
): Promise<GhostCookCandidate[]> {
  const cooks: GhostCookCandidate[] = [];
  const clampedEnd = Math.min(endPly, moves.length - 1);
  const plies = clampedEnd - startPly + 1;

  if (plies <= 0) return cooks;

  console.log(`  Analysing ${plies} plies with Stockfish (depth 16)…`);

  for (let ply = startPly; ply <= clampedEnd; ply++) {
    const masterMove = moves[ply];
    if (!masterMove) continue;

    // FEN before this master move
    const fenBefore =
      ply > 0
        ? moves[ply - 1].fenAfter
        : "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

    // Step 1: Stockfish best from this position (side-to-move perspective)
    const evalBefore = await evaluate(fenBefore, 16);
    const sfBestUci = evalBefore.bestMove;
    const sfBestCp = evalBefore.cp;

    if (!sfBestUci || sfBestUci === masterMove.uci) {
      process.stdout.write(".");
      continue;
    }

    // Step 2: Eval after the master's move (opponent to move → negate)
    const evalAfterMaster = await evaluate(masterMove.fenAfter, 16);
    const masterCp = -evalAfterMaster.cp;

    const cpGain = sfBestCp - masterCp;

    if (cpGain >= 80) {
      process.stdout.write("\n");
      console.log(
        `  🍳 Cook at ply ${ply}: master=${masterMove.uci} sf=${sfBestUci} advantage=+${cpGain}cp`,
      );
      cooks.push({
        ply,
        masterUci: masterMove.uci,
        masterEval: masterCp,
        stockfishBestUci: sfBestUci,
        stockfishEval: sfBestCp,
      });
    } else {
      process.stdout.write(".");
    }
  }
  if (plies > 0) process.stdout.write("\n");

  return cooks;
}

/* ------------------------------------------------------------------ */
/*  Main                                                                */
/* ------------------------------------------------------------------ */

async function main() {
  const seedPath = join(
    process.cwd(),
    "scripts",
    "data",
    "ghost-games-seed.json",
  );
  const seed: SeedGame[] = JSON.parse(readFileSync(seedPath, "utf8"));

  console.log(`\n🔮 Legends importer — ${seed.length} games to process\n`);

  // Initialise one Stockfish instance, reused for all games
  console.log("Starting Stockfish engine (lite-single)…");
  const { evaluate, quit } = await createEngine();
  console.log("Stockfish ready ✓\n");

  let totalCooks = 0;
  let gamesWithIssues = 0;

  for (let i = 0; i < seed.length; i++) {
    const game = seed[i];
    console.log(
      `[${i + 1}/${seed.length}] ${game.whiteName} vs ${game.blackName} (${game.eventDate})`,
    );

    // 1. Build validated moves array (chess.js loadPgn + fallback tokeniser)
    const moves = buildMovesArray(game.pgnMoves);
    console.log(`  Parsed ${moves.length} moves`);

    if (moves.length === 0) {
      console.log("  ⚠ Skipping — no moves parsed");
      gamesWithIssues++;
      continue;
    }

    // 2. Clamp play window to actual game length
    const endPly = Math.min(game.endPly, moves.length - 1);
    const startPly = Math.min(game.startPly, endPly);
    const windowSize = endPly - startPly + 1;

    if (moves.length <= game.endPly) {
      console.warn(
        `  ⚠ PGN truncated at ply ${moves.length - 1} (expected ≥${game.endPly}). Play window clamped to [${startPly}–${endPly}] (${windowSize} plies)`,
      );
      gamesWithIssues++;
    }

    // 3. Pre-bake cook candidates with local Stockfish
    const cookCandidates =
      windowSize >= 2
        ? await detectCooks(moves, startPly, endPly, evaluate)
        : [];
    console.log(`  Found ${cookCandidates.length} cook candidate(s)`);
    totalCooks += cookCandidates.length;

    // 4. Upsert with retry
    let dbDone = false;
    for (let attempt = 0; attempt < 4 && !dbDone; attempt++) {
      if (attempt > 0) {
        console.log(`  ↩ DB retry attempt ${attempt}…`);
        await sleep(2000 * attempt);
      }
      try {
        const existing = await db
          .select({ id: ghostGames.id })
          .from(ghostGames)
          .where(eq(ghostGames.eventDate, game.eventDate));

        if (existing.length > 0) {
          await db
            .update(ghostGames)
            .set({
              moves,
              cookCandidates,
              featured: game.featured,
              tags: game.tags,
            })
            .where(eq(ghostGames.id, existing[0].id));
          console.log(`  ✅ Updated  (id: ${existing[0].id})`);
        } else {
          const [inserted] = await db
            .insert(ghostGames)
            .values({
              whiteName: game.whiteName,
              blackName: game.blackName,
              whiteElo: game.whiteElo,
              blackElo: game.blackElo,
              tournament: game.tournament,
              eventDate: game.eventDate,
              result: game.result,
              eco: game.eco ?? null,
              openingName: game.openingName ?? null,
              pgnMoves: game.pgnMoves,
              moves,
              playAs: game.playAs,
              startPly,
              endPly,
              missionTitle: game.missionTitle,
              missionContext: game.missionContext,
              missionObjective: game.missionObjective,
              difficulty: game.difficulty,
              tags: game.tags,
              featured: game.featured,
              cookCandidates,
              sourceUrl: game.sourceUrl ?? null,
            })
            .returning({ id: ghostGames.id });
          console.log(`  ✅ Inserted (id: ${inserted.id})`);
        }
        dbDone = true;
      } catch (dbErr) {
        console.warn(
          `  ⚠ DB error (attempt ${attempt + 1}):`,
          (dbErr as Error).message?.slice(0, 120),
        );
        if (attempt === 3) {
          console.error(`  ❌ Giving up on game ${i + 1} after 4 DB attempts`);
        }
      }
    }

    console.log();
  }

  quit();

  console.log("─".repeat(50));
  console.log(`✅ Import complete`);
  console.log(`   ${seed.length} games processed`);
  if (gamesWithIssues > 0)
    console.log(`   ⚠ ${gamesWithIssues} game(s) had PGN issues (truncated)`);
  console.log(`   🍳 ${totalCooks} total cook candidate(s) pre-baked\n`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
          console.log(`  ✅ Updated (id: ${existing[0].id})`);
        } else {
          const [inserted] = await db
            .insert(ghostGames)
            .values({
              whiteName: game.whiteName,
              blackName: game.blackName,
              whiteElo: game.whiteElo ?? undefined,
              blackElo: game.blackElo ?? undefined,
              tournament: game.tournament,
              eventDate: game.eventDate,
              result: game.result,
              eco: game.eco ?? null,
              openingName: game.openingName ?? null,
              pgnMoves: game.pgnMoves,
              moves,
              playAs: game.playAs,
              startPly,
              endPly,
              missionTitle: game.missionTitle,
              missionContext: game.missionContext,
              missionObjective: game.missionObjective,
              difficulty: game.difficulty,
              tags: game.tags,
              featured: game.featured,
              cookCandidates,
              sourceUrl: game.sourceUrl ?? null,
            })
            .returning({ id: ghostGames.id });
          console.log(`  ✅ Inserted (id: ${inserted.id})`);
        }
        dbDone = true;
      } catch (dbErr) {
        console.warn(
          `  ⚠ DB error (attempt ${attempt + 1}):`,
          (dbErr as Error).message?.slice(0, 120),
        );
        if (attempt === 3) {
          console.error(`  ❌ Giving up on game ${i + 1} after 4 DB attempts`);
        }
      }
    }

    // Small pause between games
    if (i < seed.length - 1) await sleep(500);
  }

  console.log("\n🎉 Import complete!\n");
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
