import {bundle} from '@remotion/bundler';
import {renderMedia,renderStill,selectComposition} from '@remotion/renderer';
import {resolve} from 'node:path';
import {mkdirSync} from 'node:fs';
const serveUrl=await bundle({entryPoint:resolve('src/chaos-entry.tsx'),publicDir:resolve('public')});
const composition=await selectComposition({serveUrl,id:'chaos-promo'});
mkdirSync('chaos-output',{recursive:true});
for(const frame of [45,112,220,325,422,522,645]) {
 await renderStill({serveUrl,composition,frame,output:resolve(`chaos-output/frame-${frame}.png`)});
 console.log('Still',frame);
}
if(!process.argv.includes('--stills')) {
 let last=-1;
 await renderMedia({serveUrl,composition,codec:'h264',crf:18,pixelFormat:'yuv420p',audioCodec:'aac',audioBitrate:'192k',concurrency:3,outputLocation:resolve('chaos-output/chaos-chess-anarchy-vertical.mp4'),onProgress:({progress})=>{const p=Math.floor(progress*10)*10;if(p!==last){console.log(`Render ${p}%`);last=p;}}});
 console.log('Finished: chaos-output/chaos-chess-anarchy-vertical.mp4');
}
