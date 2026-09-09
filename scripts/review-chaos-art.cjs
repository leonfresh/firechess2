// Local visual audit of the actual PowerArt renderer. Run after prepare:assets.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),vm=require('node:vm'),ts=require('typescript');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpile(fs.readFileSync(f,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}),f);
const {ALL_MODIFIERS}=require('../lib/chaos-chess.ts');
const catalog=require('../discord-activity/app/power-art-catalog.ts');
const source=fs.readFileSync(path.join(__dirname,'../discord-activity/app/game-presentation.tsx'),'utf8');
const ctx={React,...catalog,exports:{}};
vm.runInNewContext(ts.transpile(source.slice(source.indexOf('export function PowerArt'),source.indexOf('export function ActivityLobby')),{jsx:ts.JsxEmit.React,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}),ctx);
const css=['activity.css','arena.css'].map(f=>fs.readFileSync(path.join(__dirname,'../discord-activity/app',f),'utf8')).join('\n');
const cards=ALL_MODIFIERS.map(mod=>`<article data-id="${mod.id}">${renderToStaticMarkup(React.createElement(ctx.exports.PowerArt,{id:mod.id,piece:mod.piece}))}<h2>${mod.name}</h2><small>${mod.tier} · phases ${mod.phases.join(', ')}</small></article>`).join('');
const html=`<!doctype html><html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Chaos Chess artwork audit</title><style>${css}\nbody{margin:0;background:#1b283f;color:#fff0d2;font-family:system-ui;padding:24px}h1{font-size:24px}.review-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:18px}article{min-width:0;overflow:hidden;border-radius:16px;background:#2d4059;border:2px solid #7890a5;padding-bottom:12px}article .power-art{aspect-ratio:1;width:100%;height:auto}article h2{font-size:15px;margin:10px 12px 4px}article small{font-size:11px;margin:0 12px;color:#b5c7da}@media(max-width:650px){.review-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}</style><h1>Chaos Chess · all 30 power illustrations</h1><div class="review-grid">${cards}</div></html>`;
const root=path.resolve(__dirname,'../discord-activity/public');
http.createServer((req,res)=>{
 if(req.url==='/'){res.setHeader('Content-Type','text/html');return res.end(html);}
 const file=path.resolve(root,'.'+decodeURIComponent((req.url||'').split('?')[0]));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.statusCode=404;return res.end();}
 res.setHeader('Content-Type',file.endsWith('.webp')?'image/webp':file.endsWith('.png')?'image/png':'image/svg+xml');fs.createReadStream(file).pipe(res);
}).listen(3015,'127.0.0.1',()=>console.log('Artwork review: http://127.0.0.1:3015'));
