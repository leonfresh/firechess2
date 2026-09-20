import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config({ path: '.vercel/playtest-production.env', quiet: true });
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query('BEGIN');
  // Temporary tables shadow the real tables; no player account is modified.
  for (const name of ['chaos_player', 'chaos_player_unlock', 'chaos_gold_ledger']) {
    await client.query(`CREATE TEMP TABLE ${name} (LIKE public.${name} INCLUDING ALL) ON COMMIT DROP`);
  }
  await client.query("INSERT INTO chaos_player(id,name,gold) VALUES('refund-test','Refund test',25)");
  await client.query(`INSERT INTO chaos_player_unlock(id,player_id,modifier_id,price_paid,source) VALUES
    ('refund-c','refund-test','conscription',150,'shop'),
    ('refund-p','refund-test','phalanx',150,'shop'),
    ('refund-h','refund-test','hostile-takeover',400,'shop'),
    ('refund-v','refund-test','vaulting-knight',150,'shop')`);
  const migration = readFileSync('migrations/chaos-retired-shop-refunds.sql','utf8');
  await client.query(migration);
  assert.equal((await client.query("SELECT gold FROM chaos_player WHERE id='refund-test'")).rows[0].gold,725);
  await client.query(migration);
  assert.equal((await client.query("SELECT gold FROM chaos_player WHERE id='refund-test'")).rows[0].gold,725);
  assert.equal((await client.query('SELECT count(*)::int AS n FROM chaos_gold_ledger')).rows[0].n,3);
  assert.equal((await client.query('SELECT count(*)::int AS n FROM chaos_player_unlock')).rows[0].n,4);
  console.log('PASS: full refunds, no duplicate credits, new cards untouched, historical unlocks retained. Temporary fixtures rolled back.');
} finally {
  await client.query('ROLLBACK');
  await client.end();
}
