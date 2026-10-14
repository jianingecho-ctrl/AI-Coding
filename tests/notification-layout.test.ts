import {it,expect,vi,afterEach} from 'vitest';
import {mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {captureFrameSchema,parseNotifications,suggestedContacts,type CaptureFrame} from '../src/lib/notifications';
import {type Contact} from '../src/lib/model';
import {Store} from '../electron/store';
import {MessagePipeline} from '../electron/messages';
import {NotificationService,type NotificationAdapter} from '../electron/notifications';
const contacts:Contact[]=[{id:'lin',name:'张琳',category:'老实之人',notificationNames:['张琳l']},{id:'boss',name:'王经理',category:'领导—支配我之人'}];
const line=(text:string,x:number,y:number,confidence=1)=>({text,confidence,box:{x,y,width:Math.max(35,text.length*8),height:14}});
function captured(...lines:ReturnType<typeof line>[]):CaptureFrame{return captureFrameSchema.parse({status:'recognized',context:'system-notification',captureMode:'notification-window',region:{x:990,y:40,width:480,height:240},lines});}
it('姓名不在首行时按位置提取正文，排除另一列文件和远处自身界面',()=>{
 const input=captured(line('飞书',12,8),line('桌面测试.sql',250,28),line('张琳l',66,42,.3),line('请今天交测试稿',66,62),line('另一个文件.olm',200,100),line('拖动小判官',65,170));const result=parseNotifications(input,contacts);
 expect(result).toHaveLength(1);expect(result[0]).toMatchObject({sender:'张琳l',body:'请今天交测试稿',contactIds:['lin'],confidence:.3,extraction:'positioned'});expect(result[0].warnings.join()).toContain('置信度');expect(result[0].warnings.join()).not.toContain('遮挡');
});
it('分行卡片用真实位置分隔，各条保留自己的置信度并可获得自动资格',()=>{
 const input=captured(line('飞书',12,8),line('张琳l',66,42),line('测试内容甲',66,62),line('王经理',66,140),line('测试内容乙',66,160));const result=parseNotifications(input,contacts);expect(result.map(item=>item.body)).toEqual(['测试内容甲','测试内容乙']);expect(result.every(item=>!item.requiresConfirmation&&item.sourceMatched&&item.confidence===1)).toBe(true);
});
it('姓名之后没有邻近同列正文时不拼接远处文件名',()=>{const result=parseNotifications({...captured(line('张琳l',66,42),line('桌面文件.sql',66,200)),captureMode:'selected-area'},contacts);expect(result).toEqual([]);});
it('姓名和正文触及选区边界，保留预览但禁止自动送达',()=>{const result=parseNotifications(captured(line('飞书',12,8),line('张琳l',1,42),line('测试正文',1,62)),contacts);expect(result[0].requiresConfirmation).toBe(true);expect(result[0].warnings.join()).toContain('截图边界');});
it('l/I/1 仅提供相似姓名建议，不合并不同联系人的身份',()=>{
 const withoutAlias:Contact[]=[{...contacts[0],notificationNames:[]}];expect(suggestedContacts('张琳l',withoutAlias)).toEqual(['lin']);expect(suggestedContacts('张琳1',withoutAlias)).toEqual(['lin']);expect(suggestedContacts('张琳A',withoutAlias)).toEqual([]);
 const result=parseNotifications(captured(line('飞书',12,8),line('张琳l',66,42),line('测试正文',66,62)),withoutAlias);expect(result[0]).toMatchObject({contactIds:['lin'],requiresConfirmation:true});expect(result[0].warnings.join()).toContain('相似姓名建议');
 expect(suggestedContacts('张琳I',[...withoutAlias,{...withoutAlias[0],id:'other'}])).toEqual(['lin','other']);
});
it('真正混入正文的自身界面文字仍阻止自动送达',()=>{const result=parseNotifications(captured(line('飞书',12,8),line('张琳l',66,42),line('测试正文',66,62),line('拖动小判官',66,82)),contacts);expect(result[0].requiresConfirmation).toBe(true);expect(result[0].warnings.join()).toContain('遮挡');});
const directories:string[]=[],services:NotificationService[]=[];
afterEach(async()=>{services.splice(0).forEach(service=>service.stop());vi.useRealTimers();await Promise.all(directories.splice(0).map(dir=>rm(dir,{recursive:true,force:true})))});
it('名单姓名提示送入本机适配器，匹配精确的定位消息自动进场但未外发给 AI',async()=>{
 vi.useFakeTimers();const directory=await mkdtemp(path.join(tmpdir(),'judge-positioned-'));directories.push(directory);const store=new Store(path.join(directory,'state.json'));await store.load();await store.update(s=>({...s,contacts,notifications:{...s.notifications,intervalSeconds:2,autoDeliver:true},ai:{...s.ai,enabled:true}}));
 let current=captured(line('飞书',12,8),line('张琳l',66,42),line('已显示的内容',66,62));const capture=vi.fn<NotificationAdapter['capture']>(async()=>current),delivered=vi.fn(),ai=vi.fn(),key=vi.fn();const service=new NotificationService(store,new MessagePipeline(store,key,ai),{available:true,fixture:false,capture},()=>{},delivered);services.push(service);
 await service.start(false);expect(capture.mock.calls[0]?.[3]).toEqual(['张琳','王经理','张琳l']);
 current=captured(line('飞书',12,8),line('桌面测试.sql',250,28),line('张琳l',66,42),line('新测试通知，请回复',66,62),line('拖动小判官',65,170));await vi.advanceTimersByTimeAsync(2000);await vi.waitFor(()=>expect(delivered).toHaveBeenCalledOnce());expect(store.get().history[0]).toMatchObject({text:'新测试通知，请回复',effect:{character:'honest'}});expect(ai).not.toHaveBeenCalled();expect(key).not.toHaveBeenCalled();service.stop();
});
it('收窄窗口内姓名上方的飞书标题可辅助来源确认，前面的时钟不污染身份',()=>{const frame=captured(line('17:20',120,2),line('飞书',12,20),line('张琳l',66,60),line('测试正文',66,80));expect(parseNotifications(frame,contacts)[0].sourceMatched).toBe(true);expect(parseNotifications({...frame,context:'other-window'},contacts)[0].sourceMatched).toBe(false);});
it('其他列、远处或低置信度的飞书字样不能赋予来源资格',()=>{for(const brand of [line('飞书',250,20),line('飞书',12,20,.3)]){const frame=captured(line('时钟',120,2),brand,line('张琳l',66,60),line('测试正文',66,80));expect(parseNotifications(frame,contacts)[0].sourceMatched).toBe(false);}});
it('默认开始即可将当前可见且精确匹配的定位通知送达，包括低置信度姓名；重复不会再次进场',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'judge-visible-'));directories.push(directory);const store=new Store(path.join(directory,'state.json'));await store.update(s=>({...s,contacts}));
 const current=captured(line('张琳l',66,42,.3),line('测试新消息',66,62,.8));const delivered=vi.fn(),service=new NotificationService(store,new MessagePipeline(store,async()=>''),{available:true,fixture:false,capture:async()=>current},()=>{},delivered);services.push(service);
 await service.start();expect(delivered).toHaveBeenCalledOnce();expect(store.get().history[0].contact.id).toBe('lin');expect(service.get().lastResult).toMatchObject({baseline:false,delivered:1});service.stop();await service.once();expect(delivered).toHaveBeenCalledOnce();expect(service.get().duplicates).toBe(1);
});
it('识别一次自动送达，明确选择仅预览仍保留草稿且不触发人物',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'judge-once-'));directories.push(directory);const store=new Store(path.join(directory,'state.json'));await store.update(s=>({...s,contacts}));let body='预览';const delivered=vi.fn(),service=new NotificationService(store,new MessagePipeline(store,async()=>''),{available:true,fixture:false,capture:async()=>captured(line('张琳l',66,42),line(body,66,62))},()=>{},delivered);services.push(service);
 await service.once(0,true);expect(delivered).not.toHaveBeenCalled();expect(service.get().drafts).toHaveLength(1);body='自动送达';await service.once();expect(delivered).toHaveBeenCalledOnce();expect(store.get().history[0].text).toBe(body);
});
