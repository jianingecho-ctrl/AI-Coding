import {it,expect} from 'vitest';
import {defaultState,categories,palaceIds,personalEffectSchema,type Contact} from '../src/lib/model';
import {resolveEffects,messageEffects} from '../src/lib/effects';
import {summarize} from '../src/lib/summary';
import {assertEditionContact,editionDefaults,normalizeEditionState} from '../src/lib/editions';
it('甄嬛传独立版按七类联系人展示七位人物与不同进场',()=>{
 const pet=editionDefaults('palace').pet;
 categories.forEach((category,i)=>expect(resolveEffects({id:'a',name:'甲',category},pet)).toMatchObject({character:palaceIds[i],theme:'palace',cardSkin:'palace',action:'stand',entry:['run','walk','float','roll','jump','slide','fade'][i]}));
});
it('恢复本版人物时保留尺寸、音效和本版个性皮肤',()=>{
 const state=editionDefaults('palace');state.pet={...state.pet,character:'npc',scale:.45,soundVolume:.7,soundEnabled:false,skin:'neon'};
 expect(normalizeEditionState(state,'palace').pet).toMatchObject({character:'palace_zhenhuan',skin:'neon',scale:.45,soundVolume:.7,soundEnabled:false});expect(state.pet.character).toBe('npc');
});
it('宫廷默认不会覆盖联系人的人物、素材、卡片、进场与台词',()=>{
 const contact:Contact={id:'a',name:'甲',category:'领导—支配我之人',effects:personalEffectSchema.parse({character:'palace_huafei',entry:'jump',cardSkin:'chat',line:'先喝茶',assetId:'10b4ff12-880f-4047-bb35-6627e5fc669f'})};
 expect(resolveEffects(contact,editionDefaults('palace').pet)).toMatchObject({character:'palace_huafei',entry:'jump',cardSkin:'chat',line:'先喝茶',assetId:'10b4ff12-880f-4047-bb35-6627e5fc669f'});
});
it('海洋独立版拒绝宫廷人物，宫廷版历史保留收消息时的人物',()=>{
 const contact:Contact={id:'a',name:'甲',category:'NPC同事',effects:personalEffectSchema.parse({character:'palace_meizhuang'})};expect(()=>assertEditionContact(contact,'ocean')).toThrow();
 const snapshot=resolveEffects(contact,editionDefaults('palace').pet);expect(messageEffects({id:'m',contact,text:'模拟',createdAt:'2026-10-13',summary:summarize('模拟'),effect:snapshot})).toEqual(snapshot);
});
