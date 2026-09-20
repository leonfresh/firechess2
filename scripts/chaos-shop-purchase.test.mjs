import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config({path:'.vercel/playtest-production.env',quiet:true});
const client=new pg.Client({connectionString:process.env.DATABASE_URL});
await client.connect();
try {
 await client.query('BEGIN');
 for(const name of ['chaos_player','chaos_player_unlock','chaos_gold_ledger','chaos_unlock'])
  await client.query(`CREATE TEMP TABLE ${name} (LIKE public.${name} INCLUDING ALL) ON COMMIT DROP`);
 await client.query("INSERT INTO chaos_player(id,name,gold) VALUES('shop-test','Shop test',500)");
 await client.query(`INSERT INTO chaos_unlock(id,"userId","modifierId") VALUES('earned-test','shop-test','night-rider')`);
 const migration=readFileSync('migrations/chaos-shop-expansion.sql','utf8').replace('FUNCTION buy_chaos_power','FUNCTION pg_temp.buy_chaos_power');
 await client.query(migration);await client.query(migration);
 assert.equal((await client.query("SELECT count(*)::int AS n FROM chaos_player_unlock")).rows[0].n,1);
 const buy=async(card,price)=>(await client.query('SELECT * FROM pg_temp.buy_chaos_power($1,$2,$3)',['shop-test',card,price])).rows[0];
 assert.deepEqual(await buy('night-rider',150),{outcome:'owned',balance:500});
 assert.deepEqual(await buy('phantom-rook',150),{outcome:'purchased',balance:350});
 assert.deepEqual(await buy('phantom-rook',150),{outcome:'owned',balance:350});
 assert.deepEqual(await buy('bishop-bounce',400),{outcome:'insufficient',balance:350});
 assert.equal((await client.query('SELECT count(*)::int AS n FROM chaos_gold_ledger')).rows[0].n,1);
 // An unexpected ledger failure must roll back both the deduction and ownership.
 await client.query("INSERT INTO chaos_gold_ledger(id,player_id,amount,reason) VALUES('shop-test:vaulting-knight:unlock','shop-test',0,'test-collision')");
 await client.query('SAVEPOINT before_failure');
 await assert.rejects(()=>buy('vaulting-knight',150));
 await client.query('ROLLBACK TO SAVEPOINT before_failure');
 assert.equal((await client.query("SELECT gold FROM chaos_player WHERE id='shop-test'")).rows[0].gold,350);
 assert.equal((await client.query("SELECT count(*)::int AS n FROM chaos_player_unlock WHERE modifier_id='vaulting-knight'")).rows[0].n,0);
 console.log('PASS: earned unlock preservation, full purchase, duplicate prevention, balance guard, rollback on ledger failure. All temporary fixtures rolled back.');
} finally {await client.query('ROLLBACK');await client.end();}
