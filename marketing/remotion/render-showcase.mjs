import {bundle} from '@remotion/bundler';
import {renderMedia,renderStill,selectComposition} from '@remotion/renderer';
import {resolve} from 'node:path';
const id=process.argv[2];
if(!['camel-short','showcase'].includes(id))throw new Error('Choose camel-short or showcase');
const serveUrl=await bundle({entryPoint:resolve('src/showcase-entry.tsx'),publicDir:resolve('public')});
const composition=await selectComposition({serveUrl,id});
for(const frame of id==='showcase'?[65,240,425,640,815,960,1235,1390,1580,1730]:[60,190,335,480]){
 await renderStill({serveUrl,composition,frame,output:resolve(`chaos-output/${id}-${frame}.png`)});
 console.log('Still',frame);
}
if(!process.argv.includes('--stills')){
 let last=-1;
 await renderMedia({serveUrl,composition,codec:'h264',crf:18,pixelFormat:'yuv420p',audioCodec:'aac',audioBitrate:'192k',concurrency:3,outputLocation:resolve(`chaos-output/chaos-chess-${id}.mp4`),onProgress:({progress})=>{const p=Math.floor(progress*10)*10;if(p!==last){console.log(`Render ${p}%`);last=p;}}});
 console.log(`Finished chaos-chess-${id}.mp4`);
}
