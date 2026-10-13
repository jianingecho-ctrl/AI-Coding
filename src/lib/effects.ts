import {actionIds,palaceIds,personalEffectSchema,type Action,type Category,type Contact,type Message,type ResolvedEffect,type State,type CharacterId} from './model';
import {palaceRoster,palaceLines} from './palace';
export const actionLabels={salute:'敬礼',smile:'微笑',sigh:'叹气',lie:'躺平',scratch:'挠头',kneel:'双膝跪地举牌',stand:'原图姿态',happy:'开心蹦跶',wave:'招手',fish:'摸鱼',yawn:'打哈欠',panic:'崩溃跪地'} as const;
export const entryLabels={run:'跑步进场',walk:'正常走入',float:'缓慢飘入',roll:'翻滚进场',jump:'蹦跳进场',slide:'从右侧滑入',fade:'淡入',bounce:'弹跳进场',spin:'转圈进场'} as const;
export const gagLabels={none:'不加特效',paper:'工单暴雨',fish:'摸鱼小鱼',hearts:'开心撒花',overload:'工位过载'} as const;
export const characterSkins=[{id:'desert',name:'元气工服',description:'今天也要上班。'},{id:'milktea',name:'奶茶续命',description:'暖色奶茶配色。'},{id:'neon',name:'霓虹加班',description:'紫色工位之光。'},{id:'judge',name:'判官制服',description:'冷静判读消息。'}] as const;
export const characterRoster=[
 {id:'leader',name:'领导—支配我之人',description:'红色蟹老板，钞票在手，跑步进场。'},
 {id:'honest',name:'老实之人',description:'紫衣纸杯鱼，正常走入。'},
 {id:'bored',name:'厌世之人',description:'白色鼓鼓外套、绿色垮脸，缓慢飘入。'},
 {id:'laidback',name:'躺平之人',description:'橙色横躺鱼，保持原姿势翻滚进场。'},
 {id:'silly',name:'小傻之人',description:'吐舌蓝鱼、迷彩短裤，蹦跳进场。'},
 {id:'bigSilly',name:'大傻之人',description:'黄色抱膝鱼，保持抱膝姿态滑入。'},
 {id:'npc',name:'NPC同事',description:'白衣红裤蓝鱼，安静淡入，工位常驻。'},
] as const;
export const legacyRoster=[{id:'balloon',name:'气鼓鼓小绿'},{id:'tongue',name:'吐舌摸鱼鱼'},{id:'anxious',name:'抱膝焦虑鱼'},{id:'cool',name:'佛系蓝鱼'},{id:'lying',name:'横躺摆烂鱼'},{id:'office',name:'纸杯打工鱼'},{id:'camel',name:'连帽衫骆驼'}] as const;
export const characterLabels=Object.fromEntries([...characterRoster,...palaceRoster,...legacyRoster].map(c=>[c.id,c.name])) as Record<CharacterId,string>;
export const cardSkins=[{id:'note',name:'摸鱼便签'},{id:'verdict',name:'职场判决书'},{id:'chat',name:'开心气泡'},{id:'alarm',name:'工位过载警报'},{id:'palace',name:'鎏金宫廷笺'}] as const;
const personas=[
 {character:'leader',action:'stand',entry:'run',cardSkin:'verdict',gag:'paper',line:'收到！腿比脑子先到。',duration:.9},
 {character:'honest',action:'stand',entry:'walk',cardSkin:'note',gag:'none',line:'好的，我来处理。',duration:1.4},
 {character:'bored',action:'stand',entry:'float',cardSkin:'note',gag:'fish',line:'又来活了，灵魂正在加载。',duration:2.4},
 {character:'laidback',action:'stand',entry:'roll',cardSkin:'chat',gag:'fish',line:'换个姿势，继续营业。',duration:1.3},
 {character:'silly',action:'stand',entry:'jump',cardSkin:'chat',gag:'hearts',line:'啊？我先想一下。',duration:1},
 {character:'bigSilly',action:'stand',entry:'slide',cardSkin:'alarm',gag:'overload',line:'抱紧我自己，消息请过目。',duration:1.1},
 {character:'npc',action:'stand',entry:'fade',cardSkin:'note',gag:'none',line:'收到一条工位消息。',duration:.8},
] as const;
const index:Record<Category,number>={'领导—支配我之人':0,'老实之人':1,'厌世之人':2,'躺平之人':3,'小傻之人':4,'大傻之人':5,'NPC同事':6,'领导':0,'喜欢的同事':1,'普通同事':6,'讨厌的人':5,'特别讨厌的人':5};
export function isKneeling(action:string){return action==='kneel'||action==='panic';}
export function isDisliked(category:Category){return category==='讨厌的人'||category==='特别讨厌的人'||category==='大傻之人';}
export function allowedActions(_category:Category):Action[]{return [...actionIds];}
export function hasPersonalEffects(contact:Contact){return Boolean(contact.effects&&Object.entries(contact.effects).some(([key,v])=>key==='line'?Boolean(v):v!==null&&v!=='auto'));}
export function resolveEffects(contact:Contact,pet?:State['pet']):ResolvedEffect{
 const i=index[contact.category],original=personas[i],theme=pet?.theme??'ocean';
 const base=theme==='palace'?{...original,character:palaceIds[i],cardSkin:'palace' as const,line:palaceLines[i]}:original,c=personalEffectSchema.parse(contact.effects??{});
 return {character:c.character==='auto'?base.character:c.character,action:c.action==='auto'?base.action:c.action,
 entry:c.entry==='auto'?base.entry:c.entry,characterSkin:c.characterSkin==='auto'?pet?.skin??'desert':c.characterSkin,
 cardSkin:c.cardSkin==='auto'?base.cardSkin:c.cardSkin,gag:c.gag==='auto'?base.gag:c.gag,line:c.line||base.line,
 duration:c.duration??base.duration,assetId:c.assetId,theme};
}
export function messageEffects(message:Message){return message.effect??{...resolveEffects(message.contact),character:'camel' as const};}
