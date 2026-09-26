/**
 * Gold you can see and spend: the offer picker behind the result screen, lobby notice and shop dot.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const ts = require('typescript');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpile(fs.readFileSync(f, 'utf8'), { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }), f);
const { goldOffer, GOLD_REASON_LABELS } = require('../lib/chaos-gold-offer.ts');
const { fullShopCatalog } = require('../lib/chaos-shop.ts');

const catalogue = fullShopCatalog();
const cheapest = Math.min(...catalogue.map((c) => c.price));

test('nothing is offered below the cheapest price', () => {
  assert.deepEqual(goldOffer(catalogue, new Set(), cheapest - 1), { offer: null, affordable: 0 });
});

test('only unowned cards the balance covers are offered', () => {
  const owned = new Set(catalogue.filter((c) => c.price === cheapest).slice(0, 1).map((c) => c.id));
  for (const seed of ['a', 'b', 'room:0', 'room:1', 'discord_1']) {
    const { offer, affordable } = goldOffer(catalogue, owned, 100, seed);
    assert.ok(offer && offer.price <= 100 && !owned.has(offer.id), `seed ${seed} offered ${offer?.id}`);
    assert.equal(affordable, catalogue.filter((c) => c.price <= 100 && !owned.has(c.id)).length);
  }
});

test('the offer varies by match but is stable for the same one', () => {
  const picks = new Set(Array.from({ length: 30 }, (_, i) => goldOffer(catalogue, new Set(), 1000, `room-${i}:0`).offer.id));
  assert.ok(picks.size > 3, 'different games should surface different cards');
  assert.equal(goldOffer(catalogue, new Set(), 1000, 'x').offer.id, goldOffer(catalogue, new Set(), 1000, 'x').offer.id);
});

test('every reason the gold trigger pays has a label', () => {
  const sql = fs.readFileSync('migrations/chaos-hour.sql', 'utf8');
  const reasons = new Set([...sql.matchAll(/amount,reason\) VALUES\([^)]*,'([a-z_]+)'\)/g)].map((m) => m[1]));
  assert.ok(reasons.size >= 4);
  for (const reason of reasons) assert.ok(GOLD_REASON_LABELS[reason], `${reason} needs a label`);
});

test('the event route allows every event the client sends', () => {
  const client = fs.readFileSync('lib/chaos-events.ts', 'utf8');
  const route = fs.readFileSync('app/api/chaos/event/route.ts', 'utf8');
  const list = client.slice(client.indexOf('CHAOS_EVENTS = ['), client.indexOf('] as const'));
  for (const [, name] of list.matchAll(/"([a-z_]+)"/g)) assert.ok(route.includes(`"${name}"`), `${name} is dropped by the route`);
});
