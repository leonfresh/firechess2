// Isolated UI comparison. Mocks session/fixture responses only inside a fresh browser.
// Never enables authentication bypasses in the app. All non-GET requests are blocked.
const path = require('path');
const fs = require('fs');
const { chromium } = require(process.env.QA_PLAYWRIGHT_PATH || 'playwright');
const base = 'http://localhost:3000';
const scanId = '834657ca-0093-4529-afaa-bfb256b35f42';
const out = path.join(process.env.TEMP, 'firechess-ui-qa', 'results');
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const response = await fetch(`${base}/api/scans/${scanId}`);
 if(!response.ok) throw new Error('QA scan unavailable: create a new guest scan and update scanId.');
 const {scan} = await response.json(); const r=scan.result; const meta=scan.reportMeta || {};
 const fixture={...r,...meta,id:'qa-report',scanSessionId:scanId,chessUsername:scan.chessUsername,source:scan.source,scanMode:scan.scanMode,createdAt:scan.createdAt,reportMeta:scan.reportMeta,leakCount:r.leaks.length,tacticsCount:r.missedTactics.length,...scan.config};
 const browser = await chromium.launch({channel:'chrome',headless:true});
 const results=[];
 try { for(const plan of ['free','pro']) {
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  await context.route('**/*',async route=>{
   const req=route.request();const url=new URL(req.url());
   if(!['GET','HEAD','OPTIONS'].includes(req.method())) return route.fulfill({status:403,contentType:'application/json',body:JSON.stringify({error:'Mutation blocked by isolated QA harness'})});
   if(url.origin===base && url.pathname==='/api/me') return route.fulfill({json:{authenticated:true,plan,subscriptionStatus:'active',isAdmin:false,user:{id:'qa-synthetic-user',name:'QA Preview',email:'qa@example.invalid',image:null}}});
   if(url.origin===base && url.pathname==='/api/reports') return route.fulfill({json:{reports:[fixture]}});
   return route.continue();
  });
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const [name,url] of [['old-dashboard','/dashboard'],['new-dashboard','/newdashboard'],['old-report',`/report/${scanId}`],['new-report',`/newreportpage?id=${scanId}`],['trainer','/train']]) {
   const startErrors=errors.length;
   await page.goto(base+url,{waitUntil:'domcontentloaded',timeout:120000});
   await page.locator('button[aria-controls="nav-account"]').waitFor({timeout:30000});
   if(name.includes('dashboard')) await page.getByText('gothamchess',{exact:false}).first().waitFor({timeout:30000}).catch(()=>{});
   if(name==='trainer') await page.locator('[id="training-mode-speed"]').waitFor({timeout:30000});
   if(name==='new-report') await page.getByRole('region',{name:'Position review',exact:true}).waitFor({timeout:30000});
   const text=await page.locator('#main-content').innerText();
   fs.writeFileSync(path.join(out,`${plan}-${name}.txt`),text);
   await page.screenshot({path:path.join(out,`${plan}-${name}.png`),fullPage:false});
   const summary={plan,name,title:await page.title(),headings:await page.locator('main h1,main h2,main h3').allTextContents(),errors:errors.slice(startErrors),trainingModes:await page.locator('[id^="training-mode-"]').count()};
   if(name==='new-report') summary.positions=await page.locator('[aria-label="Select a position"] button').count();
   if(name==='new-report') {await page.getByRole('button',{name:'Open report workspace',exact:true}).click();await page.getByRole('heading',{name:'Report for gothamchess',exact:true}).waitFor({timeout:60000});summary.workspaceLoaded=true;}
   results.push(summary);console.log(JSON.stringify({plan,name,errors:summary.errors,positions:summary.positions,trainingModes:summary.trainingModes}));
  }
  await context.close();
 }} finally {await browser.close();fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify(results,null,2));}
 console.log('Artifacts: '+out);
})().catch(e=>{console.error(e.message);process.exitCode=1;});
