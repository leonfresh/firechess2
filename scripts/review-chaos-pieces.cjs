// Visual QA of the actual piece renderer at desktop and mobile square sizes.
const fs=require('fs'),path=require('path'),http=require('http'),vm=require('vm'),ts=require('typescript');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),{Chess}=require('chess.js');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpile(fs.readFileSync(f,'utf8'),{module:ts.ModuleKind.CommonJS}),f);
const {ALL_MODIFIERS}=require('../lib/chaos-chess.ts');
const source=fs.readFileSync(path.join(__dirname,'../components/chaos-pieces.tsx'),'utf8');
const ctx={React,Emoji:({emoji})=>React.createElement('span',{},emoji),getPieceImageUrl:()=>'',exports:{}};
vm.runInNewContext(ts.transpile(source.slice(source.indexOf('type Corner ='),source.length).replace(/export /g,'')+'\nexports.build=buildChaosCustomPieces;',{jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2022}),ctx);
const rows=[['Fools King','k',[],'fools-king'],['Inversion','p',[],'hanged-man'],['Nocturnal Hunt','q',[],'moon'],['Camel','n',['camel']],['Railgun','r',['railgun']],['Rook Cannon','r',['rook-cannon']],['Usurper','k',['usurper']],['Emperor','k',[],'emperor'],['Kamikaze','b',['kamikaze-bishop']],['Sniper','b',['sniper-bishop']],['Bishop Cannon','b',['bishop-cannon']],['Ricochet','b',['bishop-bounce']],['Archbishop + Sniper','b',['archbishop','sniper-bishop']],['Knook + Camel','n',['knook','camel']]];
const cards=rows.map(([name,type,ids,anomaly])=>{
 const mods=ids.map(id=>ALL_MODIFIERS.find(m=>m.id===id)),g=new Chess();
 const build=ctx.exports.build('chaos-toy',mods,mods,'white',g,undefined,undefined,undefined,undefined,undefined,anomaly,anomaly,true,true);
 const pieces=[72,40].flatMap(size=>['w','b'].map(color=>{
   const square=({n:'b',b:'c',r:'a',k:'e',q:'d',p:'a'})[type]+(type==='p'?(color==='w'?'2':'7'):(color==='w'?'1':'8'));
   return `<div class="square" style="width:${size}px;height:${size}px;background:${color==='w'?'#7a9ca6':'#efe1b9'}">${renderToStaticMarkup(build[color+type.toUpperCase()]({squareWidth:size,square}))}</div>`;
 })).join('');return `<article><h2>${name}</h2><div class="samples">${pieces}</div></article>`;
}).join('');
const html=`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Piece identity review</title><style>body{background:#1c2c43;color:#fff0cd;font-family:system-ui;margin:20px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px}article{padding:14px;background:#30445b;border-radius:16px}h1{font-size:24px}h2{font-size:15px;margin:0 0 12px}.samples{display:flex;align-items:center;gap:10px}.square{position:relative;flex-shrink:0;border-radius:5px}</style><h1>New identities · 72px / 40px</h1><main>${cards}</main>`;
const root=path.resolve(__dirname,'../discord-activity/public');
http.createServer((req,res)=>{if(req.url==='/'){res.setHeader('Content-Type','text/html');return res.end(html);}const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.statusCode=404;return res.end();}res.setHeader('Content-Type','image/svg+xml');fs.createReadStream(file).pipe(res);}).listen(3016,'127.0.0.1',()=>console.log('Piece review http://127.0.0.1:3016'));
