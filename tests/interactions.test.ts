import {afterEach,it,expect,vi} from 'vitest';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {Store} from '../electron/store';
import {InteractionService} from '../electron/interactions';
import {MessagePipeline} from '../electron/messages';
import {emptyCounts,localDay,todayCounts} from '../src/lib/interactions';
const directories:string[]=[];
async function setup(){const dir=await mkdtemp(path.join(tmpdir(),'judge-interactions-'));directories.push(dir);const file=path.join(dir,'state.json'),store=new Store(file);await store.load();const pipeline=new MessagePipeline(store,async()=> '');return {store,pipeline,file};}
afterEach(async()=>{vi.unstubAllEnvs();await Promise.all(directories.splice(0).map(d=>rm(d,{recursive:true,force:true})));});
it('根据本地时区确定今天，上海跨午夜不会沿用 UTC 日期',()=>{vi.stubEnv('TZ','Asia/Shanghai');expect(localDay(new Date('2026-10-13T16:30:00Z'))).toBe('2026-10-14');vi.stubEnv('TZ','America/Los_Angeles');expect(localDay(new Date('2026-10-13T04:30:00Z'))).toBe('2026-10-12');});
it('同一联系人不同消息和连续点击累加，其他联系人与互动类型独立',async()=>{
 const {store,pipeline}=await setup(),a=await pipeline.receive({source:'mock',senderId:'bigSilly',text:'第一条'}),b=await pipeline.receive({source:'mock',senderId:'bigSilly',text:'第二条'}),c=await pipeline.receive({source:'mock',senderId:'boss',text:'第三条'});
 const service=new InteractionService(store,()=>new Date(2026,9,13,12));
 await Promise.all(Array.from({length:12},(_,i)=>service.record({messageId:i%2?a.id:b.id,kind:'elbow'})));
 await service.record({messageId:a.id,kind:'slap'});await service.record({messageId:c.id,kind:'heart'});
 expect(todayCounts(store.get().interactions,'bigSilly','2026-10-13')).toEqual({elbow:12,slap:1,burn:0,heart:0});expect(todayCounts(store.get().interactions,'boss','2026-10-13').heart).toBe(1);
});
it('跨本地午夜开始新一天，重启保留前一日数据',async()=>{
 const {store,pipeline,file}=await setup(),m=await pipeline.receive({source:'mock',senderId:'bigSilly',text:'测试'});let now=new Date(2026,9,13,23,59,59);
 const service=new InteractionService(store,()=>now);await service.record({messageId:m.id,kind:'burn'});now=new Date(2026,9,14,0,0,1);expect(todayCounts(store.get().interactions,m.contact.id,localDay(now))).toEqual(emptyCounts());await service.record({messageId:m.id,kind:'heart'});
 const restored=await new Store(file).load();expect(restored.interactions).toHaveLength(2);expect(todayCounts(restored.interactions,m.contact.id,'2026-10-13').burn).toBe(1);expect(todayCounts(restored.interactions,m.contact.id,'2026-10-14').heart).toBe(1);
});
it('同名联系人按 ID 分开，改名后仍累加，删除联系人后历史消息仍可互动',async()=>{
 const {store,pipeline}=await setup();await store.update(s=>({...s,contacts:[{id:'one',name:'小王',category:'老实之人'},{id:'two',name:'小王',category:'厌世之人'}]}));const a=await pipeline.receive({source:'mock',senderId:'one',text:'甲'}),b=await pipeline.receive({source:'mock',senderId:'two',text:'乙'}),service=new InteractionService(store);
 await service.record({messageId:a.id,kind:'slap'});await service.record({messageId:b.id,kind:'slap'});await store.update(s=>({...s,contacts:s.contacts.filter(c=>c.id==='one').map(c=>({...c,name:'王同学'}))}));await service.record({messageId:a.id,kind:'slap'});await service.record({messageId:b.id,kind:'heart'});
 expect(store.get().interactions.find(r=>r.contactId==='one')).toMatchObject({contactName:'王同学',counts:{slap:2}});expect(store.get().interactions.find(r=>r.contactId==='two')).toMatchObject({counts:{slap:1,heart:1}});
});
it('预览、已清除消息和非法互动不能产生计数',async()=>{
 const {store,pipeline}=await setup(),service=new InteractionService(store),preview=pipeline.preview(store.get().contacts[0]);
 for(const input of [{messageId:preview.id,kind:'elbow'},{messageId:'missing',kind:'heart'},{messageId:'missing',kind:'invalid'}])await expect(service.record(input)).rejects.toThrow();
 const m=await pipeline.receive({source:'mock',senderId:'boss',text:'测试'});await pipeline.clearHistory();await expect(service.record({messageId:m.id,kind:'elbow'})).rejects.toThrow();expect(store.get().interactions).toEqual([]);
});
it('清空消息历史与清空互动统计独立',async()=>{
 const {store,pipeline}=await setup(),m=await pipeline.receive({source:'mock',senderId:'boss',text:'测试'}),service=new InteractionService(store);
 await service.record({messageId:m.id,kind:'heart'});await pipeline.clearHistory();expect(store.get().interactions).toHaveLength(1);await pipeline.receive({source:'mock',senderId:'boss',text:'新消息'});await service.clear();expect(store.get().interactions).toEqual([]);expect(store.get().history).toHaveLength(1);
});
it('计数时清理超过 90 天的统计，保留范围内各日记录',async()=>{
 const {store,pipeline}=await setup(),m=await pipeline.receive({source:'mock',senderId:'boss',text:'测试'});
 await store.update(s=>({...s,interactions:['2026-07-15','2026-07-16','2026-10-12'].map(day=>({day,contactId:'boss',contactName:'王经理',counts:{...emptyCounts(),heart:2}}))}));
 await new InteractionService(store,()=>new Date(2026,9,13,12)).record({messageId:m.id,kind:'heart'});expect(store.get().interactions.map(r=>r.day)).toEqual(['2026-10-13','2026-10-12','2026-07-16']);
});
