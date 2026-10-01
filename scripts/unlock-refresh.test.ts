// Run: node --experimental-strip-types --test scripts/unlock-refresh.test.ts
// Guards the late-$9-unlock fix: both effects delegate to the shared pollUnlock
// loop and the follow-up callbacks (executed in
// scripts/firechess-auth-unlock.test.ts).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const modern = readFileSync(
  join(ROOT, "components/modern-preview/report.tsx"),
  "utf8",
);
const classic = readFileSync(
  join(ROOT, "components/scan-session-page.tsx"),
  "utf8",
);

test("both unlock effects run the shared pollUnlock loop", () => {
  for (const source of [modern, classic]) {
    assert.match(source, /pollUnlock\(/);
  }
});

test("the modern report uses the server-refresh follow-up", () => {
  assert.match(modern, /refreshReportData\(/);
});

test("the classic page uses the entitled-scan follow-up", () => {
  assert.match(classic, /applyEntitledScan\(/);
});

console.log("late-unlock refresh regressions passed");
