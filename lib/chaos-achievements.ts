export type AchievementTier = 'Normal' | 'Rare' | 'Epic' | 'Legendary';
export const ACHIEVEMENT_TIERS: Record<AchievementTier,{color:string;symbol:string}> = {
 Normal:{color:'#bbc9d8',symbol:'◆'},Rare:{color:'#78cfff',symbol:'◆◆'},
 Epic:{color:'#c49aff',symbol:'✦'},Legendary:{color:'#ffcf70',symbol:'✦✦'},
};
export const ACHIEVEMENTS = [
 {id:'king-taker',tier:'Epic',name:'Crown snatcher',description:'Capture the enemy king in a multiplayer game.',target:1,art:'king'},
 {id:'first-win',tier:'Normal',name:'First blood',description:'Win your first multiplayer game.',target:1,art:'victory'},
 {id:'checkmate',tier:'Rare',name:'No escape',description:'Win a multiplayer game by checkmate.',target:1,art:'victory'},
 {id:'full-stash',tier:'Rare',name:'Fully loaded',description:'Finish a multiplayer game with five powers.',target:1,art:'mastery'},
 {id:'regular',tier:'Rare',name:'Back for more',description:'Finish ten multiplayer games.',target:10,art:'mastery'},
 {id:'ten-wins',tier:'Legendary',name:'Chaos champion',description:'Win ten multiplayer games.',target:10,art:'victory'},
] as const;
export function achievementProgress(id:string,count:number,earnedAt:string|null,match:string|null){
 const definition=ACHIEVEMENTS.find(a=>a.id===id);
 if(!definition)return null;
 const progress=Math.min(definition.target,Math.max(0,Math.floor(count)));
 return {...definition,progress,unlocked:progress>=definition.target,earnedAt:progress>=definition.target?earnedAt:null,match:progress>=definition.target?match:null};
}

/** Share only public replay IDs, never account IDs, tokens or Activity launch URLs. */
export function achievementShare(id:string,match:string){
 const badge=ACHIEVEMENTS.find(a=>a.id===id);
 if(!badge || !match || match.length>150)return null;
 const url=new URL('https://chaos.firechess.com/share');
 url.searchParams.set('match',match);url.searchParams.set('achievement',id);
 url.searchParams.set('utm_source','share');url.searchParams.set('utm_medium','achievement');
 const title=`I earned ${badge.name} (${badge.tier}) in Chaos Chess!`;
 const text=`${title} ${badge.description} Watch the game:`;
 const reddit=new URL('https://www.reddit.com/submit');reddit.searchParams.set('url',url.href);reddit.searchParams.set('title',title);reddit.searchParams.set('type','LINK');
 const x=new URL('https://x.com/intent/tweet');x.searchParams.set('text',text);x.searchParams.set('url',url.href);
 const facebook=new URL('https://www.facebook.com/sharer/sharer.php');facebook.searchParams.set('u',url.href);
 return {url:url.href,title,text,reddit:reddit.href,x:x.href,facebook:facebook.href,image:`/api/chaos/achievements/image?badge=${encodeURIComponent(id)}`};
}
