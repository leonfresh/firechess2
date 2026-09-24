const fs=require('fs'),vm=require('vm'),ts=require('typescript'),assert=require('node:assert/strict'),pg=require('pg');
require('dotenv').config({path:'.vercel/playtest-production.env',quiet:true});
require.extensions['.ts']=(m,f)=>m._compile(ts.transpile(fs.readFileSync(f,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}),f);
(async()=>{const client=new pg.Client({connectionString:process.env.DATABASE_URL});await client.connect();try{
 const module={exports:{}},dialect=new(require('drizzle-orm/pg-core').PgDialect)();
 vm.runInNewContext(ts.transpile(fs.readFileSync('lib/chaos-week.ts','utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}),{exports:module.exports,module,Date,require(name){if(name==='@/lib/db')return{db:{execute:q=>{const {sql,params}=dialect.sqlToQuery(q);return client.query(sql,params)}}};if(name==='./chaos-score')return require('../lib/chaos-score.ts');return require(name);}});
 const real=await module.exports.getChaosWeek();console.log('Current signed-in candidates:',real.gamesScored,'winner:',real.winner?.id??'none');
 await client.query('BEGIN');await client.query('CREATE TEMP TABLE chaos_match (LIKE public.chaos_match INCLUDING ALL) ON COMMIT DROP');await client.query('CREATE TEMP TABLE chaos_player (id text, name text) ON COMMIT DROP');
 await client.query("INSERT INTO chaos_player VALUES ('a','Alice'),('b','Bob'),('guest_one','Guest'),('guest_two','Guest')");
 const record={moves:Array.from({length:30},()=>({})),frames:['7k/pp6/8/8/8/8/PP6/KQ6 w - - 0 1','7k/pp6/8/8/8/8/PP6/K7 b - - 0 1','7k/8/8/8/8/8/PP6/K7 w - - 0 2'].map(fen=>({fen}))};
 for(const [id,h,g] of [['eligible','a','b'],['guest-host','guest_one','b'],['guest-opponent','a','guest_two'],['both-guests','guest_one','guest_two'],['unknown-account','missing','b'],['self','a','a']])await client.query("INSERT INTO chaos_match(id,room_id,game_number,host_id,guest_id,host_color,winner,reason,record) VALUES($1,$1,0,$2,$3,'white','black','Checkmate',$4)",[id,h,g,record]);
 const week=await module.exports.getChaosWeek();assert.equal(week.gamesScored,1);assert.equal(week.winner.id,'eligible');
 assert.ok(await module.exports.getChaosMatchCard('both-guests'),'guest share/archive still available');
 await client.query("DELETE FROM chaos_match WHERE id='eligible'");assert.equal((await module.exports.getChaosWeek()).winner,null);
 console.log('PASS two accounts eligible; either guest, unknown and self excluded; no guest fallback; guest sharing preserved. Fixtures rolled back.');
}finally{await client.query('ROLLBACK');await client.end();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
