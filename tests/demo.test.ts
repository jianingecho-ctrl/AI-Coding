import {it,expect,vi} from 'vitest';
import {DemoPlayer,demoContacts} from '../src/lib/demo';
import {resolveEffects} from '../src/lib/effects';
import {summarize} from '../src/lib/summary';
import type {Contact,Message} from '../src/lib/model';
function preview(contact:Contact):Message{return {id:contact.id,contact,text:'演示消息',createdAt:'2026-10-13',summary:summarize('演示消息'),effect:resolveEffects(contact),preview:true};}
it('一键演示依次播放七类默认人物，消息全部为预览',async()=>{const contacts:Contact[]=[];const steps:number[]=[];const show=vi.fn(async c=>{contacts.push(c);return preview(c)}),hold=vi.fn(async()=>{});expect(await new DemoPlayer().play(show,index=>steps.push(index),hold)).toBe(true);expect(steps).toEqual([1,2,3,4,5,6,7]);expect(contacts.map(c=>resolveEffects(c).character)).toEqual(['leader','honest','bored','laidback','silly','bigSilly','npc']);expect(contacts.every(c=>c.id.startsWith('demo-'))).toBe(true);expect(hold).toHaveBeenCalledTimes(7);});
it('停止演示会取消等待并阻止后续角色出场',async()=>{vi.useFakeTimers();try{const player=new DemoPlayer(),show=vi.fn(async c=>preview(c));const task=player.play(show,()=>{});await Promise.resolve();player.stop();expect(await task).toBe(false);expect(show).toHaveBeenCalledTimes(1);expect(vi.getTimerCount()).toBe(0);}finally{vi.useRealTimers()}});
it('联系人名单为空时仍可以演示全部内置角色',async()=>{const show=vi.fn(async c=>preview(c));await new DemoPlayer().play(show,()=>{},async()=>{});expect(show).toHaveBeenCalledTimes(7);expect(demoContacts).toHaveLength(7);});
