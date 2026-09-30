// Run: node --experimental-strip-types --test app/auth/signin/signin-redirect.test.ts
// Node 22.6+ strips the types from the imported .ts helper, so this exercises
// the real function rather than a copy of it.
import test from "node:test";
import assert from "node:assert/strict";
import { isAllowedCallbackUrl } from "./signin-redirect.ts";

test("accepts a /report/<id> return", () => {
  assert.equal(
    isAllowedCallbackUrl("/report/8c8d499e-1f04-4121-aabc-71a818b98ce6"),
    true,
  );
});

test("keeps the four existing allow-list paths", () => {
  for (const p of [
    "/newdashboard",
    "/newpricing",
    "/newtraining",
    "/api/chaos/website-login",
  ]) {
    assert.equal(isAllowedCallbackUrl(p), true, p);
  }
});

test("rejects open-redirect shapes", () => {
  for (const p of [
    "https://evil.com",
    "//evil.com",
    "/reporting",
    "/report/",
    "\\evil",
    "/report/a b",
    "",
    null,
    undefined,
  ]) {
    assert.equal(isAllowedCallbackUrl(p), false, String(p));
  }
});

console.log("signin redirect regressions passed");
