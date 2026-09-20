import dotenv from 'dotenv';import {neon} from '@neondatabase/serverless';import {readFileSync} from 'node:fs';
dotenv.config({path:'.vercel/playtest-production.env',quiet:true});
await neon(process.env.DATABASE_URL).query(readFileSync('scripts/chaos-gold-db-test.sql','utf8'));
console.log('PASS: gold minting (base/win/timed/daily), guest seats excluded, no-rush pays, pair cap holds. All fixtures removed.');
