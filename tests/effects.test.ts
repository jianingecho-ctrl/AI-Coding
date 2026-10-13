import {describe,it,expect} from 'vitest';
import {categories,defaultState,personalEffectSchema,resolvedEffectSchema,stateSchema,type Contact} from '../src/lib/model';
import {isKneeling,resolveEffects,messageEffects,hasPersonalEffects} from '../src/lib/effects';
import {summarize} from '../src/lib/summary';
describe('七类人物与个人配置优先级',()=>{
 it.each(categories.map((category,i)=>[category,['leader','honest','bored','laidback','silly','bigSilly','npc'][i],'stand',['run','walk','float','roll','jump','slide','fade'][i]] as const))('%s使用独立人物、动作和进场',(category,character,action,entry)=>{expect(resolveEffects({id:'a',name:'甲',category})).toMatchObject({character,action,entry});});
 it('个人设置覆盖大傻类型的全部默认选项',()=>{
  const contact:Contact={id:'a',name:'甲',category:'大傻之人',effects:personalEffectSchema.parse({character:'honest',action:'smile',entry:'walk',duration:3,characterSkin:'neon',cardSkin:'chat',gag:'none',line:'先坐着说',assetId:'10b4ff12-880f-4047-bb35-6627e5fc669f'})};
  expect(resolveEffects(contact)).toEqual({character:'honest',action:'smile',entry:'walk',duration:3,characterSkin:'neon',cardSkin:'chat',gag:'none',line:'先坐着说',assetId:'10b4ff12-880f-4047-bb35-6627e5fc669f'});
 });
 it('取消下跪后，七类人物保持原图姿态，只用进场方式区分',()=>{for(const category of categories){const e=resolveEffects({id:'a',name:'甲',category});expect(isKneeling(e.action)).toBe(false);expect(e.action).toBe('stand');}expect(resolveEffects({id:'a',name:'甲',category:'大傻之人'}).entry).toBe('slide');});
 it('同类联系人可有不同人物和播放速度，待机配置不会覆盖人物',()=>{const a:Contact={id:'a',name:'甲',category:'NPC同事',effects:personalEffectSchema.parse({character:'silly',duration:4})};const b:Contact={id:'b',name:'乙',category:'NPC同事'};expect(resolveEffects(a,{...defaultState.pet,character:'bored'})).toMatchObject({character:'silly',duration:4});expect(resolveEffects(b).character).toBe('npc');});
 it('个人皮肤优先于全局皮肤，自动选项继承全局皮肤',()=>{const c:Contact={id:'a',name:'甲',category:'老实之人'};expect(resolveEffects(c,{...defaultState.pet,skin:'neon'}).characterSkin).toBe('neon');expect(resolveEffects({...c,effects:personalEffectSchema.parse({characterSkin:'judge'})},{...defaultState.pet,skin:'neon'}).characterSkin).toBe('judge');});
 it('动画时长与素材路径受到输入校验',()=>{for(const value of [{duration:.1},{duration:6},{assetId:'../../secret'},{character:'unknown'},{line:'字'.repeat(61)}])expect(()=>personalEffectSchema.parse(value)).toThrow();});
 it('恢复默认不会被误标为个性设置',()=>{expect(hasPersonalEffects({id:'a',name:'甲',category:'老实之人',effects:personalEffectSchema.parse({})})).toBe(false);expect(hasPersonalEffects({id:'a',name:'甲',category:'老实之人',effects:personalEffectSchema.parse({duration:2})})).toBe(true);});
 it('消息快照不跟随人物或皮肤修改',()=>{const contact:Contact={id:'a',name:'甲',category:'厌世之人'};const effect=resolveEffects(contact,{...defaultState.pet,skin:'neon'});expect(messageEffects({id:'1',contact:{...contact,category:'领导—支配我之人'},text:'你好',createdAt:'2026-10-13',summary:summarize('你好'),effect})).toEqual(effect);});
 it('兼容旧版类别和骆驼消息快照，原数据无需手动迁移',()=>{expect(stateSchema.parse({...defaultState,contacts:[{id:'old',name:'旧同事',category:'讨厌的人'}]}).contacts[0].category).toBe('讨厌的人');expect(resolvedEffectSchema.parse({action:'kneel',entry:'slide',characterSkin:'neon',cardSkin:'note',gag:'paper',line:'旧台词'}).character).toBe('camel');});
});
