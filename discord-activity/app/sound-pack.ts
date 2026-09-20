import {configureSoundPack,getMemeVolume,setMemeVolume,setSoundVolume} from '@/lib/sounds';
/** Short cartoon cues with a handful of classic reactions; no crowd/noise beds. */
export function prepareActivityAudio(){
 const cue=(name:string)=>`/activity/audio/${name}.wav`;
 configureSoundPack({
  move:cue('move'),capture:cue('capture'),select:cue('select'),check:cue('check'),correct:cue('win'),wrong:cue('bonk'),
  applause:cue('win'),'applause-short':cue('sparkle'),buzzer:cue('bonk'),bell:cue('select'),'bell-double':cue('surprise'),
  'crowd-ooh':cue('surprise'),'crowd-laugh':cue('boing'),'reveal-stinger':cue('draft'),drumroll:cue('deal'),
  'sad-trombone':cue('defeat'),honk:cue('boing'),'intro-jingle':cue('win'),
  'vine-boom':'/sounds/viral/vine-boom.mp3',bruh:'/sounds/viral/bruh.mp3','roblox-oof':'/sounds/viral/roblox-oof.mp3',
  'mario-death':cue('defeat'),'record-scratch':cue('stumble'),airhorn:cue('win'),'emotional-damage':cue('bonk'),
  'taco-bell-bong':cue('sparkle'),yeet:cue('boing'),'he-needs-milk':cue('stumble'),'ohnono-laugh':cue('boing'),
  'cute-laugh':cue('sparkle'),nani:cue('surprise'),baka:cue('bonk'),'bro-serious':cue('stumble'),
 },{reactionCooldownMs:1800,maxReactionMs:1600});
 if(!localStorage.getItem('chaos-activity-audio-v1')){setSoundVolume(0.35);localStorage.setItem('chaos-activity-audio-v1','1');}
 if(!localStorage.getItem('chaos-activity-audio-v2')){
  // v1 forced this channel off for everyone; the reworked pack starts gently.
  if(getMemeVolume()===0||getMemeVolume()===1)setMemeVolume(0.55);
  localStorage.setItem('chaos-activity-audio-v2','1');
 }
}
