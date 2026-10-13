import {describe,it,expect} from 'vitest';
import {summarize} from '../src/lib/summary';
import {stateSchema,defaultState} from '../src/lib/model';
describe('本地消息摘要',()=>{
 it('提取工作内容、待办、时间与回复要求',()=>{
  const s=summarize('麻烦明天下午3点前整理本周项目进度，发给我确认。收到请回复，谢谢。');
  expect(s.core).toContain('项目进度');expect(s.todos[0]).toContain('整理');expect(s.deadline).toContain('明天下午3点前');expect(s.reply).toBe('需要回复或确认');
 });
 it('识别明确无需回复，优先于确认关键字',()=>{expect(summarize('请确认日报已提交，无需回复。').reply).toBe('无需回复（原文明确）');});
 it('不编造未出现的待办和截止时间',()=>{const s=summarize('今天心情不错。');expect(s.todos).toEqual([]);expect(summarize('你好呀').deadline).toContain('未明确');});
 it('保留多行待办与绝对日期',()=>{const s=summarize('请整理周报\n请2026年10月15日18:00前提交\n可以吗？');expect(s.todos).toHaveLength(2);expect(s.deadline).toContain('2026年10月15日18:00前');expect(s.reply).toContain('需要回复');});
 it('限制摘要长度，并将不明确的回复标为待核对',()=>{const s=summarize('哦'.repeat(500));expect(s.core.length).toBeLessThanOrEqual(180);expect(s.reply).toContain('未明确');});
});
describe('配置输入校验',()=>{
 it('默认配置有效',()=>expect(stateSchema.parse(defaultState).contacts).toHaveLength(7));
 it('拒绝空姓名与未知分类',()=>{expect(()=>stateSchema.parse({...defaultState,contacts:[{id:'a',name:' ',category:'领导'}]})).toThrow();expect(()=>stateSchema.parse({...defaultState,contacts:[{id:'a',name:'小王',category:'陌生人'}]})).toThrow();});
});

it('规则明确识别紧急程度，并标记未调用 AI',()=>{expect(summarize('紧急！请立即提交周报。').urgency).toBe('高');expect(summarize('请提交周报。').urgency).toBe('中');expect(summarize('你好').source).toBe('本地规则摘要');});
