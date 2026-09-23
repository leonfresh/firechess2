// Applies migrations/chaos-streak.sql inside a transaction, runs the streak fixtures and the existing
// gold suite against the new trigger, then ROLLS BACK: the database is left exactly as it was.
//   node scripts/chaos-streak-db-test.mjs
import dotenv from 'dotenv';import pg from 'pg';import {readFileSync} from 'node:fs';
dotenv.config({path:'.vercel/playtest-production.env',quiet:true});
const client=new pg.Client({connectionString:process.env.DATABASE_URL});
await client.connect();
try{
 await client.query('BEGIN');
 await client.query(readFileSync('migrations/chaos-streak.sql','utf8'));
 await client.query(readFileSync('scripts/chaos-streak-db-test.sql','utf8'));
 await client.query(readFileSync('scripts/chaos-gold-db-test.sql','utf8'));
 console.log('PASS: streak day 3 pays +20, broken run resets, one bonus per day, +50 cap, guest seats excluded; gold suite unchanged. Rolled back.');
}finally{
 await client.query('ROLLBACK');
 await client.end();
}
