import {readFileSync} from 'node:fs';
import {neon} from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({path:'.vercel/playtest-production.env',quiet:true});
const sql=neon(process.env.DATABASE_URL);
const source=readFileSync('migrations/chaos-career.sql','utf8');
let inside=false,statement='';const statements=[];
for(let i=0;i<source.length;i++){
 if(source.slice(i,i+2)==='$$'){inside=!inside;statement+='$$';i++;continue;}
 if(source[i]===';'&&!inside){if(statement.trim())statements.push(statement);statement='';}else statement+=source[i];
}
if(statement.trim())statements.push(statement);
await sql.transaction(statements.map(s=>sql.query(s)));
console.log('Chaos career tables and atomic result trigger installed.');
