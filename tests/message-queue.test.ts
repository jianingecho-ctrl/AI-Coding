import {it,expect,vi} from 'vitest';
import {MessageDisplayQueue} from '../electron/message-queue';
import {defaultState,type Message,type MessagePriority} from '../src/lib/model';
import {summarize} from '../src/lib/summary';
function message(id:string,priority:MessagePriority='普通'):Message{return {id,contact:{...defaultState.contacts[1],messagePriority:priority},source:'notification',createdAt:new Date().toISOString(),text:'测试消息',summary:summarize('测试消息')};}
it('高优先级插队、保留被打断消息，同级先到先出，关闭依次展示且不重放重复通知',()=>{
 const display=vi.fn(),empty=vi.fn(),q=new MessageDisplayQueue(display,empty,()=>{});
 q.push(message('first'));q.push(message('second'));q.push(message('boss','最高'));q.push(message('boss','最高'));
 expect(q.get()).toMatchObject({activeId:'boss',pending:[{id:'first'},{id:'second'}]});q.advance('stale');expect(q.get().activeId).toBe('boss');q.advance('boss');expect(q.get().activeId).toBe('first');q.advance('first');expect(q.get().activeId).toBe('second');q.advance('second');expect(q.get()).toEqual({activeId:null,pending:[]});expect(empty).toHaveBeenCalledOnce();expect(display.mock.calls.map(c=>c[0].id)).toEqual(['first','boss','first','second']);
});
it('回复或互动期间保留当前人物，结束后最高优先级先出场；清空不残留队列',()=>{
 const q=new MessageDisplayQueue(()=>{},()=>{},()=>{});q.push(message('current','低'));q.hold('current',true);q.push(message('normal'));q.push(message('high','高'));q.push(message('boss','最高'));expect(q.get().activeId).toBe('current');q.hold('old',false);expect(q.get().activeId).toBe('current');q.hold('current',false);expect(q.get().activeId).toBe('boss');expect(q.get().pending.map(p=>p.id)).toEqual(['high','normal','current']);q.clear();expect(q.get()).toEqual({activeId:null,pending:[]});
});
