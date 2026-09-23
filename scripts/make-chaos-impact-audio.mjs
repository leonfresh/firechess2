import {writeFile} from 'node:fs/promises';
// Short, tonal cartoon cues. Soft attacks, bounded amplitude, no noise/hiss layer.
for (const name of ['blast','mate','pew']) {
 const rate=22050,duration=name==='blast'?.65:name==='pew'?.3:1.45,count=Math.floor(rate*duration),file=Buffer.alloc(44+count*2);
 file.write('RIFF');file.writeUInt32LE(file.length-8,4);file.write('WAVEfmt ',8);file.writeUInt32LE(16,16);file.writeUInt16LE(1,20);file.writeUInt16LE(1,22);file.writeUInt32LE(rate,24);file.writeUInt32LE(rate*2,28);file.writeUInt16LE(2,32);file.writeUInt16LE(16,34);file.write('data',36);file.writeUInt32LE(count*2,40);
 for(let i=0;i<count;i++) {
  const t=i/rate;let signal=0;
  if(name==='blast') {
   const phase=2*Math.PI*(65*t+150*.07*(1-Math.exp(-t/.07)));
   signal=(Math.sin(phase)+.24*Math.sin(phase*2.02))*Math.exp(-t*9)*Math.min(1,t/.008)*.6;
   const a=t-.09;if(a>0)signal+=Math.sin(2*Math.PI*(360*a-120*a*a))*Math.exp(-a*15)*.18*Math.min(1,a/.008);
  } else if(name==='pew') {
   // Laser shot: a fast downward sweep (1600Hz -> 420Hz) with a short bright tail.
   const f0=1600,f1=420,drop=.22;
   const phase=2*Math.PI*(f0*t+(f1-f0)*t*t/(2*drop));
   signal=(Math.sin(phase)+.22*Math.sin(2*phase))*Math.exp(-t/(drop*.42))*Math.min(1,t/.004)*.55;
  } else [261.63,329.63,392,523.25,783.99].forEach((f,j)=>{const a=t-j*.105;if(a>=0)signal+=(Math.sin(2*Math.PI*f*a)+.15*Math.sin(4*Math.PI*f*a))*Math.exp(-a*5)*Math.min(1,a/.012)*.19;});
  signal*=Math.min(1,(duration-t)/.04);
  file.writeInt16LE(Math.round(Math.tanh(signal)*.72*32767),44+i*2);
 }
 await writeFile(new URL(`../public/sounds/chaos-${name}.wav`,import.meta.url),file);
}
