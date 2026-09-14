const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpile(fs.readFileSync(f, 'utf8'), {module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}), f);
const watch = require('../lib/chaos-watch.ts');
const discord = 'discord_123456789012345678';

test('archive platforms distinguish Discord, browser guests, accounts and cross-platform games', () => {
  assert.equal(watch.archivePlatform(discord, 'discord_987654321098765432'), 'Discord');
  assert.equal(watch.archivePlatform('guest_browser', 'website-account'), 'Website');
  assert.equal(watch.archivePlatform(discord, 'website-account'), 'Discord + Website');
  assert.equal(watch.archivePlatform('guest_browser', discord), 'Discord + Website');
  assert.equal(watch.archivePlatform(undefined, discord), 'Platform unavailable');
});

function route(rows) {
  const module = {exports:{}};
  vm.runInNewContext(ts.transpile(fs.readFileSync('app/api/chaos/watch/route.ts','utf8'), {module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}), {
    module, exports:module.exports, Date,
    require: name => name === 'next/server' ? {NextResponse:{json:body=>body}}
      : name === '@/lib/db' ? {db:{execute:async()=>({rows})}}
      : name === 'drizzle-orm' ? {sql:()=>({})}
      : name === '@/lib/chaos-watch' ? watch : {},
  });
  return module.exports.GET;
}

test('archive list exposes move counts and platform without leaking account IDs', async () => {
  const data = await route([{id:'match',host:'Alice',guest:'Bob',host_color:'black',host_id:discord,guest_id:'private-web-id',move_count:23}])({nextUrl:new URL('https://example.test/api/chaos/watch?tab=archive')});
  assert.equal(data.games[0].moveCount,23);
  assert.equal(data.games[0].platform,'Discord + Website');
  assert.equal(data.games[0].white,'Bob');
  assert.ok(!JSON.stringify(data).includes(discord));
  assert.ok(!JSON.stringify(data).includes('private-web-id'));
});

test('replay totals round unfinished move pairs and exclude anomaly frames', async () => {
  for (const [plies, expected] of [[0,0],[1,1],[2,1],[3,2],[46,23]]) {
    const data = await route([{host_id:discord,guest_id:discord,host_color:'white',record:{moves:Array(plies).fill({from:'e2',to:'e4'}),frames:Array(12).fill({label:'white chose an anomaly'})}}])({nextUrl:new URL('https://example.test/api/chaos/watch?match=test')});
    assert.equal(data.moveCount,expected);
    assert.equal(data.platform,'Discord');
    assert.ok(!JSON.stringify(data).includes(discord));
  }
  const legacy = await route([{record:{}}])({nextUrl:new URL('https://example.test/api/chaos/watch?match=test')});
  assert.equal(legacy.moveCount,null);
});
