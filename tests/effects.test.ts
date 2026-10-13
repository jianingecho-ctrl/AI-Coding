import {describe,it,expect} from 'vitest';
import {contactSchema,defaultState,personalEffectSchema,stateSchema,type Contact} from '../src/lib/model';
import {allowedActions,isKneeling,resolveEffects,messageEffects} from '../src/lib/effects';
import {summarize} from '../src/lib/summary';

describe('联系人桌面剧本',()=>{
 it.each([['领导','salute','paper'],['喜欢的同事','happy','hearts'],['普通同事','wave','fish'],['讨厌的人','kneel','paper'],['特别讨厌的人','panic','overload']] as const)('为%s提供独立默认动作和搞笑特效', (category,action,gag)=>{
  const effect=resolveEffects({id:'1',name:'测试',category});expect(effect.action).toBe(action);expect(effect.gag).toBe(gag);
 });
 it('同类联系人可拥有不同动作、进场、皮肤、台词和特效',()=>{
  const a:Contact={id:'a',name:'甲',category:'普通同事',effects:personalEffectSchema.parse({action:'fish',entry:'spin',characterSkin:'neon',cardSkin:'alarm',gag:'paper',line:'我的摸鱼搭子来了'})};
  const b:Contact={id:'b',name:'乙',category:'普通同事'};
  expect(resolveEffects(a)).toEqual({action:'fish',entry:'spin',characterSkin:'neon',cardSkin:'alarm',gag:'paper',line:'我的摸鱼搭子来了'});
  expect(resolveEffects(b).action).toBe('wave');
 });
 it('未设置专属皮肤时继承全局皮肤，设置后专属皮肤优先',()=>{
  const c:Contact={id:'a',name:'甲',category:'领导'};const pet={...defaultState.pet,skin:'judge' as const};
  expect(resolveEffects(c,pet).characterSkin).toBe('judge');
  expect(resolveEffects({...c,effects:personalEffectSchema.parse({characterSkin:'milktea'})},pet).characterSkin).toBe('milktea');
 });
 it.each(['讨厌的人','特别讨厌的人'] as const)('%s始终滑跪，但可定制跪姿和皮肤',category=>{
  const effect=resolveEffects({id:'1',name:'甲',category,effects:personalEffectSchema.parse({action:'happy',entry:'bounce',characterSkin:'neon'})});
  expect(isKneeling(effect.action)).toBe(true);expect(effect.entry).toBe('slide');expect(effect.characterSkin).toBe('neon');
  expect(allowedActions(category)).toEqual(['kneel','panic']);
 });
 it('其他类别选择跪姿时也从边缘滑入',()=>{
  expect(resolveEffects({id:'a',name:'甲',category:'喜欢的同事',effects:personalEffectSchema.parse({action:'kneel',entry:'spin'})}).entry).toBe('slide');
 });
 it('显式关闭特效不回退到类别特效',()=>{
  expect(resolveEffects({id:'a',name:'甲',category:'领导',effects:personalEffectSchema.parse({gag:'none'})}).gag).toBe('none');
 });
 it('历史使用接收时快照，联系人和全局设置改变后快照保持',()=>{
  const contact:Contact={id:'a',name:'甲',category:'普通同事'};
  const snapshot=resolveEffects(contact,{...defaultState.pet,skin:'neon'});
  const message={id:'1',contact:{...contact,effects:personalEffectSchema.parse({characterSkin:'judge'})},text:'你好',createdAt:'2026-10-13T00:00:00Z',summary:summarize('你好'),effect:snapshot};
  expect(messageEffects(message).characterSkin).toBe('neon');
 });
 it('旧版消息无快照时仍能解析显示',()=>{
  expect(messageEffects({id:'1',contact:{id:'a',name:'甲',category:'讨厌的人'},text:'你好',createdAt:'2026-10-13T00:00:00Z',summary:summarize('你好')}).action).toBe('kneel');
 });
 it('旧版人物配置无需手工迁移',()=>{
  expect(stateSchema.parse({...defaultState,pet:{name:'旧昵称',color:'蜜桃粉'}}).pet.skin).toBe('desert');
 });
 it('拒绝未知皮肤、未知特效和超过60字的台词',()=>{
  const c={id:'a',name:'甲',category:'普通同事'};
  for(const effects of [{characterSkin:'external'},{gag:'arbitrary'},{line:'字'.repeat(61)}])expect(()=>contactSchema.parse({...c,effects})).toThrow();
 });
});
