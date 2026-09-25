import {getMemeVolume,setMemeVolume,setSoundVolume} from '@/lib/sounds';
import {installChaosSounds} from '@/lib/chaos-sound-pack';
/** Short cartoon cues with a handful of classic reactions; no crowd/noise beds. */
export function prepareActivityAudio(){
 // Shared with the website's Chaos pages (lib/chaos-sound-pack.ts); here the meme clips are cartoon cues too.
 installChaosSounds({permanent:true,cartoonMemes:true});
 if(!localStorage.getItem('chaos-activity-audio-v1')){setSoundVolume(0.35);localStorage.setItem('chaos-activity-audio-v1','1');}
 if(!localStorage.getItem('chaos-activity-audio-v2')){
  // v1 forced this channel off for everyone; the reworked pack starts gently.
  if(getMemeVolume()===0||getMemeVolume()===1)setMemeVolume(0.55);
  localStorage.setItem('chaos-activity-audio-v2','1');
 }
}
