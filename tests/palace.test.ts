import {it,expect} from 'vitest';
import {defaultState,categories,palaceIds,personalEffectSchema,type Contact} from '../src/lib/model';
import {resolveEffects,messageEffects} from '../src/lib/effects';
import {themePet} from '../src/lib/palace';
import {summarize} from '../src/lib/summary';
it('甄嬛传主题按七类联系人展示七位独立人物与原有进场',()=>{
 const pet=themePet(defaultState.pet,'palace');
 categories.forEach((category,i)=>expect(resolveEffects({id:'a',name:'甲',category},pet)).toMatchObject({character:palaceIds[i],theme:'palace',cardSkin:'palace',action:'stand',entry:['run','walk','float','roll','jump','slide','fade'][i]}));
});
it('切换主题保留尺寸和音效，并切换实际待机形象及原色',()=>{
 const pet={...defaultState.pet,scale:.45,soundVolume:.7,soundEnabled:false,assetId:'10b4ff12-880f-4047-bb35-6627e5fc669f',skin:'neon' as const};
 const palace=themePet(pet,'palace');expect(palace).toMatchObject({character:'palace_zhenhuan',skin:'desert',assetId:null,scale:.45,soundVolume:.7,soundEnabled:false});expect(themePet(palace,'ocean').character).toBe('npc');
});
it('宫廷默认不会覆盖联系人的人物、素材、卡片、进场与台词',()=>{
 const contact:Contact={id:'a',name:'甲',category:'领导—支配我之人',effects:personalEffectSchema.parse({character:'palace_huafei',entry:'jump',cardSkin:'chat',line:'先喝茶',assetId:'10b4ff12-880f-4047-bb35-6627e5fc669f'})};
 expect(resolveEffects(contact,themePet(defaultState.pet,'palace'))).toMatchObject({character:'palace_huafei',entry:'jump',cardSkin:'chat',line:'先喝茶',assetId:'10b4ff12-880f-4047-bb35-6627e5fc669f'});
});
it('海洋主题也能为联系人单独选择宫廷人物，历史保留收消息时的主题',()=>{
 const contact:Contact={id:'a',name:'甲',category:'NPC同事',effects:personalEffectSchema.parse({character:'palace_meizhuang'})};expect(resolveEffects(contact,defaultState.pet).character).toBe('palace_meizhuang');
 const snapshot=resolveEffects(contact,themePet(defaultState.pet,'palace'));expect(messageEffects({id:'m',contact,text:'模拟',createdAt:'2026-10-13',summary:summarize('模拟'),effect:snapshot})).toEqual(snapshot);
});
