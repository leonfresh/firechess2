// Run: node --experimental-strip-types --test scripts/onboarding-tour-targets.test.ts
// Guards follow-up B2: the tour mounted on /newdashboard must only point at
// data-tour attributes rendered by the modern dashboard, so no step silently
// skips there (legacy-page hooks do not count).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const tourSource = readFileSync(
  join(ROOT, "components/onboarding-tour.tsx"),
  "utf8",
);
const modernDashboard = readFileSync(
  join(ROOT, "components/modern-preview/dashboard.tsx"),
  "utf8",
);
const legacyDashboard = readFileSync(
  join(ROOT, "app/dashboard/page.tsx"),
  "utf8",
);

const block = tourSource.match(/MODERN_DASHBOARD_TOUR[^=]*=\s*\[([\s\S]*?)\n\];/);
assert.ok(block, "MODERN_DASHBOARD_TOUR not found in onboarding-tour.tsx");
const targets = [
  ...block[1].matchAll(/target:\s*"\[data-tour='([^']+)'\]"/g),
].map((match) => match[1]);

const present = new Set(
  [...modernDashboard.matchAll(/data-tour="([^"]+)"/g)].map((match) => match[1]),
);

const legacyBlock = tourSource.match(/const STEPS: TourStep\[\] = \[([\s\S]*?)\n\];/);
assert.ok(legacyBlock, "STEPS not found in onboarding-tour.tsx");
const legacyTargets = [
  ...legacyBlock[1].matchAll(/target:\s*"\[data-tour='([^']+)'\]"/g),
].map((match) => match[1]);
const legacyPresent = new Set(
  [...legacyDashboard.matchAll(/data-tour="([^"]+)"/g)].map((match) => match[1]),
);
const allTargets = [
  ...tourSource.matchAll(/target:\s*"\[data-tour='([^']+)'\]"/g),
].map((match) => match[1]);

test("every modern-dashboard tour step targets a hook in the modern dashboard", () => {
  assert.ok(targets.length > 0, "no steps parsed from MODERN_DASHBOARD_TOUR");
  for (const target of targets) {
    assert.ok(present.has(target), `modern dashboard has no data-tour="${target}"`);
  }
});

test("every legacy-dashboard tour step targets a hook in the legacy dashboard", () => {
  assert.ok(legacyTargets.length > 0, "no steps parsed from STEPS");
  for (const target of legacyTargets) {
    assert.ok(
      legacyPresent.has(target),
      `legacy dashboard has no data-tour="${target}"`,
    );
  }
});

test("targetless steps were removed from every tour", () => {
  for (const gone of ["daily-login", "coin-shop"]) {
    assert.ok(!allTargets.includes(gone), `${gone} step still present`);
  }
});

test("the modern tour is mounted on the modern dashboard", () => {
  assert.match(modernDashboard, /<OnboardingTour steps=\{MODERN_DASHBOARD_TOUR\}/);
});

console.log(
  `tour steps resolve — modern: ${targets.join(", ")} · legacy: ${legacyTargets.join(", ")}`,
);
