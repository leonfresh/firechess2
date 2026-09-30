// Run: node --experimental-strip-types --test scripts/onboarding-tour-targets.test.ts
// Guards follow-up B2: every OnboardingTour step must point at a data-tour
// attribute that exists in app/ or components/, so steps cannot silently skip.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx|ts)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const tourSource = readFileSync(
  join(ROOT, "components/onboarding-tour.tsx"),
  "utf8",
);
const targets = [
  ...tourSource.matchAll(/target:\s*"\[data-tour='([^']+)'\]"/g),
].map((match) => match[1]);

const present = new Set<string>();
for (const file of [...walk(join(ROOT, "app")), ...walk(join(ROOT, "components"))]) {
  for (const match of readFileSync(file, "utf8").matchAll(/data-tour="([^"]+)"/g)) {
    present.add(match[1]);
  }
}

test("every tour step targets a data-tour attribute that exists", () => {
  assert.ok(targets.length > 0, "no steps parsed from onboarding-tour.tsx");
  for (const target of targets) {
    assert.ok(present.has(target), `no element has data-tour="${target}"`);
  }
});

test("targetless steps were removed", () => {
  assert.ok(!targets.includes("daily-login"), "daily-login step still present");
  assert.ok(!targets.includes("coin-shop"), "coin-shop step still present");
});

console.log(`onboarding tour steps resolve: ${targets.join(", ")}`);
