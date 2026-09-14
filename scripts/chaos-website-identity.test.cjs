const ts = require('typescript'), fs = require('fs');
require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpile(fs.readFileSync(file, 'utf8'), { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }), file);
const { test } = require('node:test'), assert = require('node:assert/strict');
const { signWebsiteIdentity, readWebsiteIdentity, websiteIdentityLifetime } = require('../lib/chaos-website-identity.ts');
const { signDiscordIdentity, readDiscordIdentity } = require('../lib/chaos-discord-identity.ts');
process.env.CHAOS_LIVE_SECRET = 'test-only-secret';
test('website identity preserves the FireChess account ID and expires', () => {
  const token = signWebsiteIdentity('firechess-account-id', 1000);
  assert.equal(readWebsiteIdentity(token, 1001), 'firechess-account-id');
  assert.equal(readWebsiteIdentity(token, 1000 + websiteIdentityLifetime * 1000), null);
});
test('guest and Discord identities cannot be issued as website accounts', () => {
  for (const id of ['', 'guest_123', 'discord_123456789012345678']) assert.throws(() => signWebsiteIdentity(id));
  assert.equal(readWebsiteIdentity(signDiscordIdentity('discord_123456789012345678')), null);
  assert.equal(readDiscordIdentity(signWebsiteIdentity('account')), null);
});
test('modified and malformed cookies cannot authenticate', () => {
  const token = signWebsiteIdentity('account');
  const [payload, signature] = token.split('.');
  const data = JSON.parse(Buffer.from(payload, 'base64url'));
  data.sub = 'another-account';
  for (const bad of ['', 'x'.repeat(3000), token + '.extra', payload + '.bad', Buffer.from(JSON.stringify(data)).toString('base64url') + '.' + signature]) assert.equal(readWebsiteIdentity(bad), null);
});
