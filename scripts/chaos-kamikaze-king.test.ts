// Run: node --experimental-strip-types --test scripts/chaos-kamikaze-king.test.ts
// Real-logic checks for the king-captures-Kamikaze feedback: the shared FEN impact
// detector and the replay transition must both surface a king Kamikaze effect, while
// ordinary Kamikaze mutual kills and plain captures are unchanged.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import type { WatchImpact } from "../lib/chaos-impact.ts";
import type { WatchFrame } from "../lib/chaos-watch.ts";

const nodeRequire = createRequire(import.meta.url);
const ts = nodeRequire("typescript") as typeof import("typescript");

// Node's type-stripping runner cannot resolve the extensionless `./chaos-chess`
// import inside lib/chaos-impact.ts. Compile the real module here with a
// fail-closed shim: the paths under test never read ALL_MODIFIERS (it only seeds
// cosmetic power-sparkle squares), so it is stubbed rather than pulling the whole
// modifier catalogue through a chain Node cannot resolve. Everything else is the
// shipped code. This mirrors the repo's existing transpile-based tests.
function loadChaosImpact(): any {
  const source = readFileSync(join(process.cwd(), "lib/chaos-impact.ts"), "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const moduleObj = { exports: {} as Record<string, unknown> };
  const shim: Record<string, unknown> = {
    "chess.js": nodeRequire("chess.js"),
    "./chaos-chess": { ALL_MODIFIERS: [] },
  };
  const requireShim = (id: string): unknown => {
    if (id in shim) return shim[id];
    throw new Error(`refusing unmocked import "${id}" (fail closed)`);
  };
  new Function("require", "module", "exports", js)(
    requireShim,
    moduleObj,
    moduleObj.exports,
  );
  return moduleObj.exports;
}

const { kamikazeImpact, watchTransition, shouldEmitWatchEffects } =
  loadChaosImpact();
const { archiveFrames, visualState } = loadChaosWatch();
const emptyWatchState = visualState(null);

// The replay seam: lib/chaos-watch.ts also imports the extensionless modifier/anomaly
// catalogues, which are stubbed here because archiveFrames never reads them.
function loadChaosWatch(): any {
  const source = readFileSync(join(process.cwd(), "lib/chaos-watch.ts"), "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const moduleObj = { exports: {} as Record<string, unknown> };
  const shim: Record<string, unknown> = {
    "chess.js": nodeRequire("chess.js"),
    "./chaos-chess": { ALL_MODIFIERS: [] },
    "./chaos-anomalies": { ALL_ANOMALIES: [] },
  };
  const requireShim = (id: string): unknown => {
    if (id in shim) return shim[id];
    throw new Error(`refusing unmocked import "${id}" (fail closed)`);
  };
  new Function("require", "module", "exports", js)(
    requireShim,
    moduleObj,
    moduleObj.exports,
  );
  return moduleObj.exports;
}

const KING_TAKES_KAMIKAZE = {
  before: "4k3/8/8/8/8/8/3b4/4K3 w - - 0 1",
  after: "4k3/8/8/8/8/8/3K4/8 b - - 1 1",
};
const ROOK_TAKES_KAMIKAZE = {
  before: "4k3/8/8/8/8/8/3b4/3RK3 w - - 0 1",
  after: "4k3/8/8/8/8/8/8/4K3 b - - 1 1",
};

test("kamikazeImpact: king capturing the bishop is detected as a king blast", () => {
  const impact = kamikazeImpact(
    KING_TAKES_KAMIKAZE.before,
    KING_TAKES_KAMIKAZE.after,
    { w: false, b: true },
  );
  assert.ok(impact, "expected a king kamikaze impact");
  assert.equal(impact.king, true);
  assert.equal(impact.square, "d2");
  assert.deepEqual(impact.pieces, ["bB", "wK"]);
});

test("kamikazeImpact: a king capturing a non-armed bishop is not a kamikaze", () => {
  assert.equal(
    kamikazeImpact(KING_TAKES_KAMIKAZE.before, KING_TAKES_KAMIKAZE.after, {
      w: false,
      b: false,
    }),
    null,
  );
  assert.equal(
    kamikazeImpact(KING_TAKES_KAMIKAZE.before, KING_TAKES_KAMIKAZE.after, {
      w: true,
      b: false,
    }),
    null,
  );
});

test("kamikazeImpact: the ordinary mutual kill still works and is not marked king", () => {
  const impact = kamikazeImpact(
    ROOK_TAKES_KAMIKAZE.before,
    ROOK_TAKES_KAMIKAZE.after,
    { w: false, b: true },
  );
  assert.ok(impact);
  assert.equal(impact.king, undefined);
  assert.equal(impact.square, "d2");
  assert.deepEqual(impact.pieces, ["bB", "wR"]);
});

test("watchTransition: the replay surfaces a king Kamikaze effect with chaos-blast", () => {
  const before = {
    fen: KING_TAKES_KAMIKAZE.before,
    from: undefined,
    to: undefined,
    state: { white: [], black: ["kamikaze-bishop"] },
  };
  const after = {
    fen: KING_TAKES_KAMIKAZE.after,
    from: "e1",
    to: "d2",
    state: { white: [], black: ["kamikaze-bishop"] },
  };
  const transition = watchTransition(before, after, {
    winner: "white",
    reason: "Kamikaze King",
  });
  const kamikaze = transition.effects.find((e: WatchImpact) => e.kind === "kamikaze");
  assert.ok(kamikaze, "expected a kamikaze effect in the replay");
  assert.equal(kamikaze.kingKamikaze, true);
  assert.equal(kamikaze.square, "d2");
  assert.deepEqual(kamikaze.pieces, ["bB", "wK"]);
  assert.equal(transition.sound, "chaos-blast");
});

test("watchTransition: a plain capture of a bishop is not a kamikaze", () => {
  const before = {
    fen: KING_TAKES_KAMIKAZE.before,
    from: undefined,
    to: undefined,
    state: { white: [], black: [] },
  };
  const after = {
    fen: KING_TAKES_KAMIKAZE.after,
    from: "e1",
    to: "d2",
    state: { white: [], black: [] },
  };
  const transition = watchTransition(before, after, {
    winner: "white",
    reason: "King captured",
  });
  assert.equal(
    transition.effects.some((e: WatchImpact) => e.kind === "kamikaze"),
    false,
    "a plain capture must not become a kamikaze blast",
  );
});

test("watchEffects: a terminal king-Kamikaze step still plays the effect", () => {
  const before = {
    fen: KING_TAKES_KAMIKAZE.before,
    from: undefined,
    to: undefined,
    state: { white: [], black: ["kamikaze-bishop"] },
  };
  const after = {
    fen: KING_TAKES_KAMIKAZE.after,
    from: "e1",
    to: "d2",
    state: { white: [], black: ["kamikaze-bishop"] },
  };
  // Arriving at the terminal frame must not swallow the burst.
  assert.equal(
    shouldEmitWatchEffects({
      hasPrevious: true,
      sameScene: true,
      visible: true,
      live: false,
      following: false,
      stepForward: true,
      previousIndex: 41,
      index: 42,
      changed: true,
    }),
    true,
  );
  const transition = watchTransition(before, after, {
    winner: "white",
    reason: "Kamikaze King",
  });
  assert.ok(transition.effects.some((e: WatchImpact) => e.kind === "kamikaze" && e.kingKamikaze));
  assert.equal(transition.sound, "chaos-blast");
});

test("watchEffects: seek/reset/unchanged/hidden transitions emit nothing", () => {
  const base = {
    hasPrevious: true,
    sameScene: true,
    visible: true,
    live: false,
    following: false,
    stepForward: true,
    previousIndex: 2,
    index: 3,
    changed: true,
  };
  assert.equal(shouldEmitWatchEffects(base), true, "one forward step");
  assert.equal(shouldEmitWatchEffects({ ...base, previousIndex: 5, index: 0 }), false, "reset/seek to the start");
  assert.equal(shouldEmitWatchEffects({ ...base, index: 6 }), false, "seek jump");
  assert.equal(shouldEmitWatchEffects({ ...base, changed: false }), false, "same frame is not replayed");
  assert.equal(shouldEmitWatchEffects({ ...base, visible: false }), false, "hidden tab");
  assert.equal(shouldEmitWatchEffects({ ...base, sameScene: false }), false, "scene/room change");
  assert.equal(shouldEmitWatchEffects({ ...base, stepForward: false }), false, "backward step");
  assert.equal(
    shouldEmitWatchEffects({ ...base, live: true, following: true, stepForward: false }),
    true,
    "live following",
  );
});

test("watchTransition: a persisted kamikazeKing frame drives the king blast without powers", () => {
  // Legacy/older archives carry the marker but no modifier ids on the frames: the FEN diff
  // alone finds no armed bishop, so the effect must come from the persisted metadata.
  const before = {
    fen: KING_TAKES_KAMIKAZE.before,
    from: undefined,
    to: undefined,
    state: { white: [], black: [] },
  };
  const after = {
    fen: KING_TAKES_KAMIKAZE.after,
    from: "e1",
    to: "d2",
    state: { white: [], black: [] },
    kamikazeKing: true,
  };
  const transition = watchTransition(before, after, {
    winner: "white",
    reason: "Kamikaze King",
  });
  const kamikaze = transition.effects.find((e: WatchImpact) => e.kind === "kamikaze");
  assert.ok(kamikaze, "the persisted marker must produce the king blast");
  assert.equal(kamikaze.kingKamikaze, true);
  assert.deepEqual(kamikaze.pieces, ["bB", "wK"]);
  assert.equal(transition.sound, "chaos-blast");
});

test("archiveFrames: a kamikaze-king move keeps its marker for the rebuilt replay", () => {
  const record = {
    moves: [
      {
        fen: KING_TAKES_KAMIKAZE.after,
        from: "e1",
        to: "d2",
        kamikazeKing: true,
        powers: { white: [], black: ["kamikaze-bishop"] },
      },
    ],
  };
  const frames = archiveFrames(record);
  assert.equal(frames.at(-1)?.kamikazeKing, true);
});

test("archiveFrames: old saved frames pick up the move-history marker on the right frame only", () => {
  const earlier: WatchFrame = {
    fen: KING_TAKES_KAMIKAZE.before,
    label: "black: c3 → d2",
    from: "c3",
    to: "d2",
    state: emptyWatchState,
  };
  const finalFrame: WatchFrame = {
    fen: KING_TAKES_KAMIKAZE.after,
    label: "white: e1 → d2",
    from: "e1",
    to: "d2",
    state: emptyWatchState,
  };
  const saved = [earlier, finalFrame];
  const record = {
    frames: saved,
    moves: [{ fen: KING_TAKES_KAMIKAZE.after, from: "e1", to: "d2", kamikazeKing: true }],
  };
  const frames = archiveFrames(record);
  assert.equal(frames.at(-1)?.kamikazeKing, true, "the final frame gets the marker");
  assert.equal(frames.at(0)?.kamikazeKing, undefined, "no adjacent frame is mislabelled");
  assert.equal(saved.at(-1)?.kamikazeKing, undefined, "the stored record must not be mutated");
  // And the marked frames drive the real replay transition.
  const transition = watchTransition(frames.at(-2), frames.at(-1), {
    winner: "white",
    reason: "Kamikaze King",
  });
  assert.ok(
    transition.effects.some((e: WatchImpact) => e.kind === "kamikaze" && e.kingKamikaze),
    "old saved frames must produce the king blast after alignment",
  );
  assert.equal(transition.sound, "chaos-blast");
});

console.log("chaos kamikaze-king regressions passed");
