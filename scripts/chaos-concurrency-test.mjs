// Small production smoke test: four isolated rooms, eight players. Not capacity certification.
import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
const results=await Promise.all(Array.from({length:4},(_,index)=>new Promise(resolve=>{
 const started=Date.now();
 const child=spawn(process.execPath,['scripts/chaos-sync-http-test.mjs','--live'],{env:process.env,stdio:['ignore','pipe','pipe']});
 let output='';child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);
 const timeout=setTimeout(()=>child.kill(),120000);
 child.on('exit',code=>{clearTimeout(timeout);resolve({room:index+1,code,elapsedMs:Date.now()-started,output});});
})));
await writeFile('.vercel/chaos-concurrency-results.json',JSON.stringify(results,null,2));
for(const result of results)console.log(JSON.stringify(result));
if(results.some(r=>r.code!==0))process.exitCode=1;
