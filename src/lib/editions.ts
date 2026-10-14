import {defaultState,personaIds,palaceIds,fishCharacterIds,type State,type Theme,type CharacterId,type Contact} from './model';
import {palaceRoster} from './palace';
import {resolveEffects,cardSkins,characterSkins} from './effects';

export const editionDefinitions={
 ocean:{id:'ocean',name:'职场小判官·海洋版',label:'海洋独立版',packageName:'workplace-little-judge-ocean',appId:'cn.workplace.littlejudge.ocean',dataDirectory:'workplace-little-judge-ocean'},
 palace:{id:'palace',name:'职场小判官·甄嬛传版',label:'甄嬛传独立版',packageName:'workplace-little-judge-palace',appId:'cn.workplace.littlejudge.palace',dataDirectory:'workplace-little-judge-palace'},
} as const;
export function editionCharacters(edition:Theme):readonly CharacterId[]{return edition==='palace'?palaceIds:[...personaIds,...fishCharacterIds,'camel'];}
export function editionCardSkins(edition:Theme){const names:Record<string,string>={note:'素纸便笺',verdict:'御前批阅',chat:'胭脂信笺',alarm:'加急朱批',palace:'鎏金宫廷笺'};return cardSkins.filter(s=>edition==='palace'||s.id!=='palace').map(s=>({...s,name:edition==='palace'?names[s.id]:s.name}));}
export function editionSkins(edition:Theme){const names:Record<string,string>={desert:'原色宫装',milktea:'暖杏宫装',neon:'绛紫宫装',judge:'墨色宫装'};return characterSkins.map(s=>({...s,name:edition==='palace'?names[s.id]:s.name}));}
export function categoryLabel(category:Contact['category'],edition:Theme){if(edition==='ocean')return category;const index:Record<Contact['category'],number>={'领导—支配我之人':0,'老实之人':1,'厌世之人':2,'躺平之人':3,'小傻之人':4,'大傻之人':5,'NPC同事':6,'领导':0,'喜欢的同事':1,'普通同事':6,'讨厌的人':5,'特别讨厌的人':5};return palaceRoster[index[category]].name+'型';}
export function editionDefaults(edition:Theme):State{
 const state=structuredClone(defaultState);state.pet.theme=edition;
 if(edition==='palace'){state.pet.character='palace_zhenhuan';state.contacts=state.contacts.map((c,i)=>({...c,name:palaceRoster[i].name}));}
 return state;
}
export function assertEditionContact(contact:Contact,edition:Theme){
 const character=contact.effects?.character;
 if(character&&character!=='auto'&&!editionCharacters(edition).includes(character))throw new Error('人物不属于当前独立版，请选择本版人物');
 if(edition==='ocean'&&contact.effects?.cardSkin==='palace')throw new Error('宫廷卡片不属于海洋独立版');
}
export function assertEditionSettings(settings:Pick<State,'contacts'|'pet'>,edition:Theme){
 if(settings.pet.theme!==edition)throw new Error('独立版不能切换主题，请打开对应的独立应用');
 if(!editionCharacters(edition).includes(settings.pet.character))throw new Error('待机人物不属于当前独立版');
 for(const contact of settings.contacts)assertEditionContact(contact,edition);
}
// 兼容旧配置：恢复本版默认人物，保留消息正文、回复、名单、统计与素材。
export function normalizeEditionState(input:State,edition:Theme):State{
 const state=structuredClone(input),allowed=editionCharacters(edition);
 const normalizeContact=(c:Contact):Contact=>{
  if(c.effects){if(c.effects.character!=='auto'&&!allowed.includes(c.effects.character))c.effects.character='auto';if(edition==='ocean'&&c.effects.cardSkin==='palace')c.effects.cardSkin='auto';}
  return c;
 };
 state.pet.theme=edition;if(!allowed.includes(state.pet.character))state.pet.character=editionDefaults(edition).pet.character;
 state.contacts=state.contacts.map(normalizeContact);
 for(const message of state.history){
  message.contact=normalizeContact(message.contact);
  if(message.effect){message.effect.theme=edition;if(!allowed.includes(message.effect.character))message.effect.character=resolveEffects(message.contact,state.pet).character;if(edition==='ocean'&&message.effect.cardSkin==='palace')message.effect.cardSkin='note';}
  else if(edition==='palace')message.effect=resolveEffects(message.contact,state.pet);
 }
 return state;
}
