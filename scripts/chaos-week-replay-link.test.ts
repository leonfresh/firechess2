// Run: node --experimental-strip-types --test scripts/chaos-week-replay-link.test.ts
// Exercises the real Game of the Week replay link builder used by the landing
// strip (components/chaos-week-strip.tsx).
import test from "node:test";
import assert from "node:assert/strict";
import { chaosReplayHref, chaosWeekHref } from "../lib/chaos-replay-link.ts";

const ROOM = "1cabf784-e038-40f2-a46c-ab3302d4273f";

test("website Game of the Week uses the room id on /chaos/replay", () => {
  assert.equal(
    chaosReplayHref(ROOM, { activityHost: false }),
    `/chaos/replay/${ROOM}`,
  );
});

test("activity Game of the Week uses /watch?match with the room id", () => {
  assert.equal(
    chaosReplayHref(ROOM, { activityHost: true }),
    `/watch?match=${ROOM}`,
  );
});

test("an explicit replayBase still wins", () => {
  assert.equal(
    chaosReplayHref("abc", { activityHost: true, replayBase: "/x/" }),
    "/x/abc",
  );
});

test("replay ids are URL-encoded", () => {
  assert.equal(
    chaosReplayHref("a b/c?d", { activityHost: false }),
    "/chaos/replay/a%20b%2Fc%3Fd",
  );
  assert.equal(
    chaosReplayHref("room:0", { activityHost: true }),
    "/watch?match=room%3A0",
  );
});

test("the full-week link follows the host", () => {
  assert.equal(chaosWeekHref({ activityHost: false }), "/chaos/week");
  assert.equal(chaosWeekHref({ activityHost: true }), "/watch?tab=archive");
  assert.equal(chaosWeekHref({ activityHost: false, weekHref: "/x" }), "/x");
});

console.log("chaos replay link regressions passed");
