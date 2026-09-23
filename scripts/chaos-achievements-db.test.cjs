const fs=require('fs'),vm=require('vm'),ts=require('typescript'),assert=require('node:assert/strict'),pg=require('pg');
require('dotenv').config({path:'.vercel/playtest-production.env',quiet:true});
require.extensions['.ts']=(m,f)=>m._compile(ts.transpile(fs.readFileSync(f,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}),f);
(async()=>{const client=new pg.Client({connectionString:process.env.DATABASE_URL});await client.connect();try{
 await client.query('BEGIN');await client.query('CREATE TEMP TABLE chaos_match (LIKE public.chaos_match INCLUDING ALL) ON COMMIT DROP');
 for(let i=0;i<10;i++)await client.query(`INSERT INTO chaos_match(id,room_id,game_number,host_id,guest_id,host_color,winner,reason,record) VALUES($1,'test', $2,'black-player','white-player','black','black',$3,$4)`,['ach-'+i,i,i===0?'King captured':'Checkmate',{moves:[{},{}],state:{aiModifiers:Array(5).fill({id:'test'}),playerModifiers:[]}}]);
 await client.query(`INSERT INTO chaos_match(id,room_id,game_number,host_id,guest_id,host_color,winner,reason,record) VALUES('abort','abort',0,'white-player','someone','white','white','Aborted',$1)`,[{moves:[{},{}]}]);
 let identity='black-player',queries=0;const module={exports:{}};const dialect=new(require('drizzle-orm/pg-core').PgDialect)();
 vm.runInNewContext(ts.transpile(fs.readFileSync('app/api/chaos/achievements/route.ts','utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}),{exports:module.exports,module,require(name){if(name==='@/lib/db')return{db:{execute:q=>{queries++;const {sql,params}=dialect.sqlToQuery(q);return client.query(sql,params)}}};if(name==='@/lib/chaos-auth')return{getChaosUserId:async()=>identity,isGuestId:id=>id.startsWith('guest_')};if(name==='@/lib/chaos-achievements')return require('../lib/chaos-achievements.ts');if(name==='next/server')return{NextResponse:{json:(data,options)=>({data,status:options?.status??200})}};return require(name);}});
 const get=async()=> (await module.exports.GET({}));
 let r=await get();assert.equal(r.status,200);assert.equal(r.data.achievements.filter(a=>a.unlocked).length,6);assert.equal(r.data.achievements.find(a=>a.id==='king-taker').match,'ach-0');
 identity='white-player';r=await get();assert.equal(r.data.achievements.filter(a=>a.unlocked).length,1);assert.equal(r.data.achievements.find(a=>a.id==='regular').progress,10);
 const count=queries;identity='guest_123';assert.equal((await get()).status,401);identity=null;assert.equal((await get()).status,401);assert.equal(queries,count);
 console.log('PASS: historical achievements, both colours, personal ownership, aborted exclusion, tenth-win threshold, earned replay and guest authentication. Fixtures rolled back.');
}finally{await client.query('ROLLBACK');await client.end();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
