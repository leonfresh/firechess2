import fs from 'node:fs';
const key=process.env.GEMINI_API_KEY||process.env.GOOGLE_API_KEY;
if(!key)throw new Error('Gemini key not available in the local environment.');
export const cues=[{"id": "hook", "at": 0.1, "slot": 2.8, "text": "This pawn becomes a queen."}, {"id": "rank", "at": 3.2, "slot": 2.5, "text": "On the fifth rank."}, {"id": "setup", "at": 6.2, "slot": 3.6, "text": "Watch the b-pawn. Two moves."}, {"id": "power", "at": 11.4, "slot": 3.0, "text": "One power. A whole new threat."}, {"id": "mate", "at": 15.0, "slot": 4.3, "text": "Later, that same pawn delivers checkmate."}, {"id": "cta", "at": 20.1, "slot": 3.7, "text": "Chess with powerups. Play on Discord."}];
const dir='public/gameplay';
fs.writeFileSync(`${dir}/voice-cues.json`,JSON.stringify(cues,null,2));
function wav(pcm,rate){const h=Buffer.alloc(44);h.write('RIFF');h.writeUInt32LE(36+pcm.length,4);h.write('WAVE',8);h.write('fmt ',12);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);h.writeUInt16LE(1,22);h.writeUInt32LE(rate,24);h.writeUInt32LE(rate*2,28);h.writeUInt16LE(2,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(pcm.length,40);return Buffer.concat([h,pcm]);}
for(const cue of cues){
 const path=`${dir}/leda-${cue.id}-raw.wav`;
 if(fs.existsSync(path)){console.log(`Cached ${cue.id}`);continue;}
 const prompt=`Speak only the following line, as a youthful female game narrator with confident, intrigued energy. Brisk conversational pacing, clear words, no drawn-out pauses, no shouting. Pronounce b-pawn as bee pawn. Keep the line around ${cue.slot} seconds. Text: ${cue.text}`;
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
