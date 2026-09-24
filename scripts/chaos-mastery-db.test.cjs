const fs=require('fs'),vm=require('vm'),ts=require('typescript'),assert=require('node:assert/strict'),pg=require('pg');
require('dotenv').config({path:'.vercel/playtest-production.env',quiet:true});
require.extensions['.ts']=(m,f)=>m._compile(ts.transpile(fs.readFileSync(f,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}),f);
(async()=>{const client=new pg.Client({connectionString:process.env.DATABASE_URL});await client.connect();try{
 await client.query('BEGIN');for(const name of ['chaos_match','chaos_gold_ledger'])await client.query(`CREATE TEMP TABLE ${name} (LIKE public.${name} INCLUDING ALL) ON COMMIT DROP`);
 const record={state:{playerModifiers:[{id:'dragon-bishop'}],aiModifiers:[{id:'phantom-rook'}],playerAnomaly:'sun',aiAnomaly:'moon'}};
 await client.query(`INSERT INTO chaos_match(id,room_id,game_number,host_id,guest_id,host_color,winner,reason,record) VALUES('mastery-test','test',0,'black-player','white-player','black','black','Checkmate',$1)`,[record]);
 await client.query(`INSERT INTO chaos_gold_ledger(id,player_id,match_id,amount,reason) VALUES('black-credit','black-player','mastery-test',25,'match'),('black-daily','black-player','mastery-test',25,'daily_win'),('white-credit','white-player','mastery-test',10,'match')`);
 const module={exports:{}};const dialect=new (require('drizzle-orm/pg-core').PgDialect)();
 vm.runInNewContext(ts.transpile(fs.readFileSync('lib/chaos-mastery.ts','utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}),{exports:module.exports,module,require(name){if(name==='./db')return{db:{execute:q=>{const {sql,params}=dialect.sqlToQuery(q);return client.query(sql,params)}}};if(name==='./chaos-anomaly-unlocks')return require('../lib/chaos-anomaly-unlocks.ts');return require(name);}});
 const black=await module.exports.readChaosMastery('black-player'),white=await module.exports.readChaosMastery('white-player');
 assert.equal(black['phantom-rook'].games,1);assert.equal(black['anomaly:moon'].games,1);assert.equal(black['dragon-bishop'],undefined);assert.equal(white['dragon-bishop'].games,1);assert.equal(white['anomaly:sun'].games,1);
 assert.equal(Object.keys(await module.exports.readChaosMastery(null)).length,0);
 console.log('PASS: mastery uses personal archived powers, both colours, excludes daily bonus double-counting; all fixtures rolled back.');
}finally{await client.query('ROLLBACK');await client.end();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
