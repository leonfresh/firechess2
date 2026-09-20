/**
 * The gold shop: catalogue, prices, and the rules that keep it honest.
 *
 * Prices are server-side, every base card stays free for everyone, and a shop card only enters a
 * draft pool once it has been bought - in Discord as much as on the website.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const ts = require('typescript');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpile(fs.readFileSync(f, 'utf8'), { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }), f);
const { ALL_MODIFIERS, SHOP_CARD_IDS } = require('../lib/chaos-chess.ts');
const { SHOP_PRICES, shopCatalog, priceOf, isShopCard } = require('../lib/chaos-shop.ts');
const { GUEST_UNLOCKED_IDS } = require('../lib/chaos-collection.ts');

test('every base card is free and only the shop cards are sold', () => {
  const free = ALL_MODIFIERS.filter((m) => !SHOP_CARD_IDS.has(m.id)).map((m) => m.id);
  assert.equal(GUEST_UNLOCKED_IDS.size, free.length, 'the free set must be exactly the base cards');
  for (const id of free) assert.ok(GUEST_UNLOCKED_IDS.has(id), `${id} must be free from the first game`);
  for (const id of SHOP_CARD_IDS) assert.ok(!GUEST_UNLOCKED_IDS.has(id), `${id} is a shop card and must not be free`);
  assert.ok(SHOP_CARD_IDS.size >= 2, 'the shop needs something to sell');
});

test('the catalogue lists every shop card once, priced by tier, cheapest first', () => {
  const cards = shopCatalog();
  assert.deepEqual(cards.map((c) => c.id).sort(), [...SHOP_CARD_IDS].sort(), 'the catalogue must cover the shop set exactly');
  for (const card of cards) {
    assert.equal(card.price, SHOP_PRICES[card.tier], `${card.id} must cost its tier price`);
    assert.ok(card.price > 0 && card.name && card.description, `${card.id} needs a name, a rule and a price`);
  }
  const prices = cards.map((c) => c.price);
  assert.deepEqual(prices, [...prices].sort((a, b) => a - b), 'the shop reads cheapest first');
});

test('priceOf sells shop cards and refuses everything else', () => {
  for (const m of ALL_MODIFIERS) {
    if (SHOP_CARD_IDS.has(m.id)) assert.equal(priceOf(m), SHOP_PRICES[m.tier], `${m.id} must be for sale at its tier price`);
    else assert.equal(priceOf(m), null, `${m.id} is a base card: not for sale`);
  }
  assert.equal(isShopCard('phalanx'), true, 'phalanx is a shop card');
  assert.equal(isShopCard('sniper-bishop'), false, 'sniper-bishop is a base card');
});

test('prices stay within reach of the gold the archive pays out', () => {
  // archive_chaos_match pays 10 a game, +15 a win, +25 for the first win of the day.
  for (const [tier, price] of Object.entries(SHOP_PRICES)) {
    assert.ok(price >= 100 && price <= 1200, `${tier} at ${price} gold is off the pace of the gold rates`);
  }
});

test('the buy route prices server-side and cannot be talked out of the balance guard', () => {
  const src = fs.readFileSync('app/api/chaos/shop/route.ts', 'utf8');
  assert.ok(src.includes('priceOf(mod)'), 'the price must come from the server catalogue');
  assert.ok(!/body\.(price|amount|cost)/.test(src), 'the route must never read a price from the request body');
  assert.ok(/gte\(chaosPlayers\.gold, price\)/.test(src), 'the deduction must be guarded by gold >= price in SQL');
  assert.ok(src.includes('.onConflictDoNothing()'), 'claiming a card must be idempotent');
  assert.ok(/claim\.length === 0/.test(src) && src.includes('409'), 'a replayed purchase must be refused, not charged');
  assert.ok(src.includes('delete(chaosPlayerUnlock)'), 'a failed payment must put the card back on the shelf');
  assert.ok(src.includes('reason: "unlock"'), 'the spend must land in the gold ledger');
});

test('the collection API advertises the shop and counts owned cards as unlocked', () => {
  const src = fs.readFileSync('app/api/chaos/collection/route.ts', 'utf8');
  assert.ok(src.includes('shopCatalog()'), 'the collection response must carry the catalogue');
  assert.ok(/owned: ownedSet\.has\(card\.id\)/.test(src), 'each shop card must report ownership');
  assert.ok(src.includes('ownedShop') && src.includes('unlockedIds'), 'owned shop cards must join the unlocked set');
  assert.ok(!src.includes('getProgressionInfo') && !src.includes('PROGRESSION_UNLOCK_ORDER'), 'the games-played ladder must be gone');
});

test('draft pools keep shop cards out until they are bought, Discord included', () => {
  const page = fs.readFileSync('app/chaos/page.tsx', 'utf8');
  assert.ok(page.includes('SHOP_CARD_IDS.has(m.id) && !shopOwned.has(m.id)'), 'the only locks are unowned shop cards');
  assert.ok(page.includes('draftUnlockedIds'), 'guests and the activity need the shop-aware set too');
  assert.ok(!page.includes('if (presentation.activity) return choices'), 'the activity must not skip the gate');
  assert.ok(!page.includes('getProgressionInfo'), 'no games-played ladder left in the page');
  const lib = fs.readFileSync('lib/chaos-collection.ts', 'utf8');
  assert.ok(!/export (const|function) (PROGRESSION_UNLOCK_ORDER|UNLOCK_AT_GAMES|getProgressionInfo)/.test(lib), 'the ladder tables must be deleted, not just unused');
});

test('the shop migration keys unlocks to a chaos_player, not a website account', () => {
  const sql = fs.readFileSync('migrations/chaos-shop.sql', 'utf8');
  assert.ok(/create table if not exists chaos_player_unlock/i.test(sql), 'the unlock table must exist');
  assert.ok(/player_id text not null/i.test(sql), 'the key must be text: Discord ids are not user FKs');
  assert.ok(/unique index/i.test(sql), 'a player cannot own the same card twice');
});
