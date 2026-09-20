import {bundle} from '@remotion/bundler';
import {renderMedia,renderStill,selectComposition} from '@remotion/renderer';
import {resolve} from 'node:path';
import {mkdirSync} from 'node:fs';
const serveUrl=await bundle({entryPoint:resolve('src/gameplay-entry.tsx'),publicDir:resolve('public')});
const composition=await selectComposition({serveUrl,id:'gameplay'});
mkdirSync('chaos-output',{recursive:true});
for(const frame of [12,48,120,267,370,560,650]) {
 await renderStill({serveUrl,composition,frame,output:resolve(`chaos-output/gameplay-${frame}.png`)});
 console.log('Still',frame);
}
if(!process.argv.includes('--stills')) {
 let last=-1;
 await renderMedia({serveUrl,composition,codec:'h264',crf:18,pixelFormat:'yuv420p',audioCodec:'aac',audioBitrate:'192k',concurrency:3,outputLocation:resolve('chaos-output/chaos-chess-gameplay.mp4'),onProgress:({progress})=>{const p=Math.floor(progress*10)*10;if(p!==last){console.log(`Render ${p}%`);last=p;}}});
 console.log('Finished: chaos-output/chaos-chess-gameplay.mp4');
}
