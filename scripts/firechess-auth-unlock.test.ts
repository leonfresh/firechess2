// Run: node --experimental-strip-types --test scripts/firechess-auth-unlock.test.ts
//
// Isolated harness for the FireChess auth / entitlement / unlock cards. It loads
// the REAL route and helper modules and replaces only their boundaries (auth,
// admin, db, llm, report-unlock, sample-reports) through a small CommonJS shim,
// so the logic under test is the shipped logic. No network calls, no real DB,
// no credentials, no paid model calls.
//
// Limitations: these are mocks, not live OAuth/Stripe/provider integration.
// React effect behaviour (delayed webhook polling, refetch, false/logout reset)
// is covered only by the static guard in scripts/unlock-refresh.test.ts.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { isAllowedCallbackUrl } from "../app/auth/signin/signin-redirect.ts";
import { pollUnlock } from "../lib/unlock-poll.ts";
import { applyEntitledScan, refreshReportData } from "../lib/unlock-follow-up.ts";

const ROOT = process.cwd();
const nodeRequire = createRequire(import.meta.url);
const ts = nodeRequire("typescript") as typeof import("typescript");

// Fail closed: any accidental external network call throws instead of reaching
// a real provider.
const denyNetwork = (target: unknown): never => {
  throw new Error(`external network denied in tests: ${String(target)}`);
};
(globalThis as any).fetch = denyNetwork;

function compile(file: string, shim: Record<string, unknown>): any {
  const source = readFileSync(join(ROOT, file), "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const moduleObj = { exports: {} as Record<string, unknown> };
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

/* ── POST /api/report/analyze — paid LLM authorization ─────────────── */

function analyzeScan(overrides: Record<string, unknown> = {}) {
  return {
    id: "scan-1",
    userId: "owner-1",
    guestToken: null,
    chessUsername: "player",
    scanMode: "both",
    status: "ready",
    config: {},
    result: {
      gamesAnalyzed: 10,
      leaks: [
        { openingName: "Italian", reachCount: 3, cpLoss: 120 },
        { cpLoss: 40 },
      ],
      oneOffMistakes: [],
      missedTactics: [{ cpLoss: 200 }],
      endgameMistakes: [],
      repeatedPositions: 2,
      timeManagementScore: 50,
      endgameStats: null,
    },
    reportMeta: { estimatedRating: 1200, consistencyScore: 60, topTag: "tactics" },
    ...overrides,
  };
}

function loadAnalyzeRoute(deps: {
  session: { user: { id: string } } | null;
  admin?: boolean;
  scan: Record<string, unknown> | null;
  expired?: boolean;
}) {
  const prompts: string[] = [];
  const json = (body: unknown, init?: { status?: number }) => ({
    status: init?.status ?? 200,
    json: async () => body,
  });
  const exportsObj = compile("app/api/report/analyze/route.ts", {
    "next/server": { NextRequest: class {}, NextResponse: { json } },
    "drizzle-orm": { eq: () => ({}) },
    "@/lib/auth": { auth: async () => deps.session },
    "@/lib/admin": { isAdmin: async () => deps.admin ?? false },
    "@/lib/db": {
      db: {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: async () => (deps.scan ? [deps.scan] : []),
            }),
          }),
        }),
      },
    },
    "@/lib/schema": { scanSessions: {} },
    "@/lib/scan-session": { isExpiredScanSession: () => deps.expired ?? false },
    "@/lib/llm-chat": {
      chatWithFallback: async (_system: string, prompt: string) => {
        prompts.push(prompt);
        return JSON.stringify({
          badges: [], verdict: "ok", strengths: [], weaknesses: [],
          nextSteps: [], coachNote: "ok", sectionNotes: {},
        });
      },
    },
    "@/lib/types": {},
  });
  return {
    POST: exportsObj.POST as (req: unknown) => Promise<any>,
    prompts,
  };
}

function analyzeReq(
  scanId: unknown,
  token?: string,
  extra: Record<string, unknown> = {},
) {
  return {
    json: async () => ({ scanId, ...extra }),
    headers: {
      get: (name: string) =>
        name === "x-scan-owner-token" ? token ?? null : null,
    },
  };
}

test("analyze: missing scanId is rejected", async () => {
  const { POST, prompts } = loadAnalyzeRoute({ session: null, scan: analyzeScan() });
  const res = await POST(analyzeReq(undefined));
  assert.equal(res.status, 400);
  assert.equal(prompts.length, 0);
});

test("analyze: unknown, not-ready and expired scans are 404", async () => {
  const missing = loadAnalyzeRoute({ session: null, scan: null });
  assert.equal((await missing.POST(analyzeReq("missing"))).status, 404);
  const notReady = loadAnalyzeRoute({ session: null, scan: analyzeScan({ status: "processing" }) });
  assert.equal((await notReady.POST(analyzeReq("scan-1"))).status, 404);
  const expired = loadAnalyzeRoute({ session: null, scan: analyzeScan(), expired: true });
  assert.equal((await expired.POST(analyzeReq("scan-1"))).status, 404);
});

test("analyze: a foreign signed-in user is forbidden and no LLM call happens", async () => {
  const { POST, prompts } = loadAnalyzeRoute({
    session: { user: { id: "other-1" } },
    scan: analyzeScan(),
  });
  assert.equal((await POST(analyzeReq("scan-1"))).status, 403);
  assert.equal(prompts.length, 0);
});

test("analyze: owner builds the prompt from the stored scan and ignores client numbers", async () => {
  const { POST, prompts } = loadAnalyzeRoute({
    session: { user: { id: "owner-1" } },
    scan: analyzeScan(),
  });
  const res = await POST(
    analyzeReq("scan-1", undefined, { openingLeaks: 999, missedTactics: 999 }),
  );
  assert.equal(res.status, 200);
  assert.equal(prompts.length, 1);
  assert.match(prompts[0], /OPENING LEAKS: 2/);
  assert.match(prompts[0], /MISSED TACTICS: 1/);
  assert.ok(!prompts[0].includes("999"), "client-supplied counts must be ignored");
});

test("analyze: a matching guest owner token is allowed", async () => {
  const scan = analyzeScan({ userId: null, guestToken: "guest-token-1" });
  const { POST, prompts } = loadAnalyzeRoute({ session: null, scan });
  assert.equal((await POST(analyzeReq("scan-1", "guest-token-1"))).status, 200);
  assert.equal(prompts.length, 1);
});

test("analyze: an admin may generate for a scan they do not own", async () => {
  const { POST, prompts } = loadAnalyzeRoute({
    session: { user: { id: "other-1" } },
    admin: true,
    scan: analyzeScan(),
  });
  assert.equal((await POST(analyzeReq("scan-1"))).status, 200);
  assert.equal(prompts.length, 1);
});

test("analyze: a stored analysis is returned without another paid call", async () => {
  const cached = {
    coachNote: "cached", badges: [], verdict: "v", strengths: [],
    weaknesses: [], nextSteps: [], sectionNotes: {},
  };
  const scan = analyzeScan({
    result: { ...analyzeScan().result, aiAnalysis: cached },
  });
  const { POST, prompts } = loadAnalyzeRoute({
    session: { user: { id: "owner-1" } },
    scan,
  });
  const res = await POST(analyzeReq("scan-1"));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), cached);
  assert.equal(prompts.length, 0);
});

test("analyze: the per-caller limiter rejects the seventh generation", async () => {
  const { POST, prompts } = loadAnalyzeRoute({
    session: { user: { id: "owner-1" } },
    scan: analyzeScan(),
  });
  for (let i = 0; i < 6; i++) {
    assert.equal((await POST(analyzeReq("scan-1"))).status, 200, `request ${i + 1}`);
  }
  assert.equal((await POST(analyzeReq("scan-1"))).status, 429);
  assert.equal(prompts.length, 6);
});

/* ── lib/scan-access — server entitlement + redaction ──────────────── */

function loadScanAccess(
  deps: { plan?: string; unlock?: boolean; admin?: boolean } = {},
) {
  return compile("lib/scan-access.ts", {
    "drizzle-orm": { eq: () => ({}) },
    "./admin": { isAdmin: async () => deps.admin ?? false },
    "./db": {
      db: {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: async () => [{ plan: deps.plan ?? "free" }],
            }),
          }),
        }),
      },
    },
    "./schema": { subscriptions: {} },
    "./report-unlock": { hasReportUnlock: async () => deps.unlock ?? false },
    "./sample-reports": { SAMPLE_REPORTS: [{ reportId: "sample-1" }] },
    "./types": {},
  });
}

test("redaction caps every finding list and keeps aggregates", () => {
  const { redactScanResultForFree } = loadScanAccess();
  const input = {
    gamesAnalyzed: 42,
    repeatedPositions: 9,
    leaks: Array.from({ length: 12 }, (_, i) => ({ i })),
    oneOffMistakes: Array.from({ length: 8 }, (_, i) => ({ i })),
    missedTactics: Array.from({ length: 10 }, (_, i) => ({ i })),
    endgameMistakes: Array.from({ length: 7 }, (_, i) => ({ i })),
    brilliantMoves: Array.from({ length: 5 }, (_, i) => ({ i })),
    positionalFindings: Array.from({ length: 9 }, (_, i) => ({ i })),
    timeManagement: {
      score: 70,
      moments: Array.from({ length: 11 }, (_, i) => ({ i })),
    },
  };
  const free = redactScanResultForFree(input);
  assert.equal(free.gamesAnalyzed, 42);
  assert.equal(free.repeatedPositions, 9);
  assert.equal(free.leaks.length, 6);
  assert.equal(free.oneOffMistakes.length, 6);
  assert.equal(free.missedTactics.length, 6);
  assert.equal(free.endgameMistakes.length, 6);
  assert.equal(free.brilliantMoves.length, 5);
  assert.equal(free.positionalFindings.length, 6);
  assert.equal(free.timeManagement.score, 70);
  assert.equal(free.timeManagement.moments.length, 6);
  assert.equal(input.leaks.length, 12, "the stored result must not be mutated");
  assert.equal(redactScanResultForFree(null), null);
});

test("resolveFullAccess follows the current entitlement policy", async () => {
  const free = loadScanAccess({ plan: "free" });
  assert.equal(
    await free.resolveFullAccess({ scanId: "sample-1", scanUserId: "x", userId: null }),
    true,
    "sample reports stay public",
  );
  assert.equal(
    await free.resolveFullAccess({ scanId: "s1", scanUserId: null, guestToken: "gt", ownerToken: "gt" }),
    true,
    "guest owner token",
  );
  assert.equal(
    await free.resolveFullAccess({ scanId: "s1", scanUserId: "owner-1", userId: "owner-1" }),
    true,
    "scan owner (current code)",
  );
  assert.equal(
    await free.resolveFullAccess({ scanId: "s1", scanUserId: "owner-1", userId: "other-1" }),
    false,
    "foreign free user",
  );

  const unlocked = loadScanAccess({ plan: "free", unlock: true });
  assert.equal(
    await unlocked.resolveFullAccess({ scanId: "s1", scanUserId: "owner-1", userId: "other-1" }),
    true,
    "one-off unlock",
  );
  const pro = loadScanAccess({ plan: "pro" });
  assert.equal(
    await pro.resolveFullAccess({ scanId: "s1", scanUserId: "owner-1", userId: "other-1" }),
    true,
    "pro plan",
  );
  const admin = loadScanAccess({ plan: "free", admin: true });
  assert.equal(
    await admin.resolveFullAccess({ scanId: "s1", scanUserId: "owner-1", userId: "other-1" }),
    true,
    "admin",
  );
});

/* ── app/auth/signin — report callback allow-list ──────────────────── */

test("the /report/<id> sign-in callback is allowed and open redirects are not", () => {
  assert.equal(isAllowedCallbackUrl("/report/8c8d499e-1f04-4121-aabc-71a818b98ce6"), true);
  assert.equal(isAllowedCallbackUrl("/newdashboard"), true);
  assert.equal(isAllowedCallbackUrl("https://evil.com"), false);
  assert.equal(isAllowedCallbackUrl("//evil.com"), false);
  assert.equal(isAllowedCallbackUrl("/reporting"), false);
  assert.equal(isAllowedCallbackUrl(null), false);
});

/* ── lib/unlock-poll — the loop both unlock effects run ───────────── */

test("unlock poll: a delayed webhook unlock refreshes once and mirrors the flag", async () => {
  const flags: boolean[] = [];
  let checks = 0;
  let unlocks = 0;
  await pollUnlock({
    attempts: 8,
    delayMs: 10,
    sleep: async () => {},
    isActive: () => true,
    checkUnlock: async () => {
      checks++;
      return checks >= 3;
    },
    onFlag: (unlocked) => flags.push(unlocked),
    onUnlocked: () => {
      unlocks++;
    },
  });
  assert.deepEqual(flags, [false, false, true]);
  assert.equal(checks, 3);
  assert.equal(unlocks, 1);
});

test("unlock poll: a failed check is not confirmed and can recover", async () => {
  const flags: boolean[] = [];
  let checks = 0;
  let unlocks = 0;
  await pollUnlock({
    attempts: 3,
    delayMs: 10,
    sleep: async () => {},
    isActive: () => true,
    checkUnlock: async () => {
      checks++;
      if (checks === 1) throw new Error("offline");
      return checks === 3;
    },
    onFlag: (unlocked) => flags.push(unlocked),
    onUnlocked: () => {
      unlocks++;
    },
  });
  assert.deepEqual(flags, [false, false, true]);
  assert.equal(checks, 3);
  assert.equal(unlocks, 1);
});

test("unlock poll: gives up after the attempt budget without unlocking", async () => {
  let checks = 0;
  let unlocks = 0;
  await pollUnlock({
    attempts: 4,
    delayMs: 10,
    sleep: async () => {},
    isActive: () => true,
    checkUnlock: async () => {
      checks++;
      return false;
    },
    onFlag: () => {},
    onUnlocked: () => {
      unlocks++;
    },
  });
  assert.equal(checks, 4);
  assert.equal(unlocks, 0);
});

test("unlock poll: a false response clears the flag (no stale access)", async () => {
  const flags: boolean[] = [];
  await pollUnlock({
    attempts: 1,
    delayMs: 0,
    sleep: async () => {},
    isActive: () => true,
    checkUnlock: async () => false,
    onFlag: (unlocked) => flags.push(unlocked),
    onUnlocked: () => {
      throw new Error("must not unlock");
    },
  });
  assert.deepEqual(flags, [false]);
});

test("unlock poll: stops as soon as the effect is cancelled", async () => {
  let active = true;
  let checks = 0;
  let unlocks = 0;
  await pollUnlock({
    attempts: 5,
    delayMs: 0,
    sleep: async () => {
      active = false;
    },
    isActive: () => active,
    checkUnlock: async () => {
      checks++;
      return false;
    },
    onFlag: () => {},
    onUnlocked: () => {
      unlocks++;
    },
  });
  assert.equal(checks, 1);
  assert.equal(unlocks, 0);
});

/* ── harness isolation ─────────────────────────────────────────────── */

test("harness: the loader refuses unmocked imports", () => {
  assert.throws(
    () => compile("app/api/report/analyze/route.ts", {}),
    /refusing unmocked import/,
  );
});

test("harness: external network is denied", async () => {
  await assert.rejects(
    async () => {
      await fetch("https://example.com/denied");
    },
    /external network denied/,
  );
});

/* ── lib/unlock-follow-up — the real onUnlocked callbacks ─────────── */

test("classic follow-up applies the entitled full payload", async () => {
  const applied: any[] = [];
  const ok = await applyEntitledScan("scan-1", {
    fetch: async () => ({
      ok: true,
      json: async () => ({ scan: { id: "scan-1", result: { leaks: [] } } }),
    }),
    apply: (scan: any) => {
      applied.push(scan);
    },
  });
  assert.equal(ok, true);
  assert.deepEqual(applied, [{ id: "scan-1", result: { leaks: [] } }]);
});

test("classic follow-up keeps the Free view on failure and recovers next call", async () => {
  const applied: any[] = [];
  const apply = (scan: any) => {
    applied.push(scan);
  };
  let calls = 0;
  const flaky = async () => {
    calls++;
    if (calls === 1) throw new Error("offline");
    return { ok: true, json: async () => ({ scan: { id: "scan-2" } }) };
  };
  assert.equal(await applyEntitledScan("scan-2", { fetch: flaky, apply }), false);
  assert.deepEqual(applied, []);
  assert.equal(await applyEntitledScan("scan-2", { fetch: flaky, apply }), true);
  assert.deepEqual(applied, [{ id: "scan-2" }]);
});

test("classic follow-up ignores non-ok and empty payloads", async () => {
  const applied: any[] = [];
  const apply = (scan: any) => {
    applied.push(scan);
  };
  assert.equal(
    await applyEntitledScan("s", {
      fetch: async () => ({ ok: false, json: async () => ({}) }),
      apply,
    }),
    false,
  );
  assert.equal(
    await applyEntitledScan("s", {
      fetch: async () => ({ ok: true, json: async () => ({}) }),
      apply,
    }),
    false,
  );
  assert.deepEqual(applied, []);
});

test("classic follow-up does not apply after the effect was cancelled", async () => {
  let applied = 0;
  assert.equal(
    await applyEntitledScan("s", {
      fetch: async () => ({ ok: true, json: async () => ({ scan: { id: "s" } }) }),
      apply: () => {
        applied++;
      },
      isActive: () => false,
    }),
    false,
  );
  assert.equal(applied, 0);
});

test("modern follow-up refreshes the server data once", () => {
  let refreshes = 0;
  refreshReportData({ refresh: () => { refreshes++; } });
  assert.equal(refreshes, 1);
});

test("unlock poll drives the real classic follow-up end to end", async () => {
  const applied: any[] = [];
  let checks = 0;
  await pollUnlock({
    attempts: 3,
    delayMs: 0,
    sleep: async () => {},
    isActive: () => true,
    checkUnlock: async () => {
      checks++;
      return checks === 2;
    },
    onFlag: () => {},
    onUnlocked: async () => {
      await applyEntitledScan("scan-9", {
        fetch: async () => ({ ok: true, json: async () => ({ scan: { id: "scan-9" } }) }),
        apply: (scan: any) => {
          applied.push(scan);
        },
      });
    },
  });
  assert.deepEqual(applied, [{ id: "scan-9" }]);
});

test("unlock poll drives the real modern refresh end to end", async () => {
  let refreshes = 0;
  await pollUnlock({
    attempts: 1,
    delayMs: 0,
    sleep: async () => {},
    isActive: () => true,
    checkUnlock: async () => true,
    onFlag: () => {},
    onUnlocked: () =>
      refreshReportData({ refresh: () => { refreshes++; } }),
  });
  assert.equal(refreshes, 1);
});

console.log("firechess auth/entitlement harness passed");
