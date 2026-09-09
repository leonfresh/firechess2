import dotenv from 'dotenv';import {neon} from '@neondatabase/serverless';import {readFileSync} from 'node:fs';
dotenv.config({path:'.vercel/playtest-production.env',quiet:true});
await neon(process.env.DATABASE_URL).query(readFileSync('scripts/chaos-career-db-test.sql','utf8'));
console.log('PASS: atomic Elo, duplicate result, rematch color swap, casual history and history surviving room removal. All fixtures removed within the transaction.');
