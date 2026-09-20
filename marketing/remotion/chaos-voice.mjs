import fs from 'node:fs';
const key=process.env.GEMINI_API_KEY||process.env.GOOGLE_API_KEY;
if(!key)throw new Error('Gemini key not available in the local environment.');
export const cues=[
 {id:'hook',at:.15,slot:2.2,text:'We googled en passant.'},
 {id:'hell',at:2.65,slot:2.1,text:'Holy hell.'},
 {id:'draft',at:5.25,slot:3.4,text:'Draft your bad idea.'},
 {id:'knook',at:9.15,slot:3.15,text:'The Knook. Knight jumps. Rook moves.'},
 {id:'pawn',at:12.65,slot:2.55,text:'Two squares. Any rank.'},
 {id:'illegal',at:15.65,slot:1.65,text:"That's not a legal move."},
 {id:'now',at:17.35,slot:1.4,text:'It is now.'},
 {id:'end',at:19.15,slot:4.55,text:'Chaos Chess. Draft powers. Break chess. Play on Discord.'},
];
const dir='public/chaos-promo';
fs.writeFileSync(`${dir}/voice-cues.json`,JSON.stringify(cues,null,2));
function wav(pcm,rate){const h=Buffer.alloc(44);h.write('RIFF');h.writeUInt32LE(36+pcm.length,4);h.write('WAVE',8);h.write('fmt ',12);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);h.writeUInt16LE(1,22);h.writeUInt32LE(rate,24);h.writeUInt32LE(rate*2,28);h.writeUInt16LE(2,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(pcm.length,40);return Buffer.concat([h,pcm]);}
for(const cue of cues){
 const path=`${dir}/leda-${cue.id}-raw.wav`;
 if(fs.existsSync(path)){console.log(`Cached ${cue.id}`);continue;}
 const prompt=`Speak only the following line, as a youthful female game narrator with dry, mischievous humor. Brisk conversational pacing, clear words, no drawn-out pauses, no shouting. Pronounce Knook as nook; en passant with its usual chess pronunciation. Keep the line around ${cue.slot} seconds. Text: ${cue.text}`;
 let res;
 for(let attempt=0;attempt<3;attempt++){
  res=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseModalities:['AUDIO'],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:'Leda'}}}}}),signal:AbortSignal.timeout(120000)});
  if(res.ok||![429,500,503].includes(res.status))break;
  await new Promise(r=>setTimeout(r,2000*(attempt+1)));
 }
 if(!res.ok)throw new Error(`Gemini narration request failed: HTTP ${res.status}. Response body omitted to protect credentials.`);
 const data=await res.json(),part=data.candidates?.[0]?.content?.parts?.find(p=>p.inlineData);
 if(!part)throw new Error(`No audio returned for ${cue.id}`);
 const rate=Number(part.inlineData.mimeType?.match(/rate=(\d+)/)?.[1]||24000),pcm=Buffer.from(part.inlineData.data,'base64');
 fs.writeFileSync(path,wav(pcm,rate));
 console.log(`${cue.id}: ${(pcm.length/2/rate).toFixed(2)}s, Leda`);
}
