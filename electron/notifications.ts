import {randomUUID} from 'node:crypto';
import {captureFrameSchema,parseNotifications,notificationKey,type CaptureFrame,type NotificationSettings,type NotificationStatus,type NotificationDraft} from '../src/lib/notifications';
import type {Store} from './store';
import type {MessagePipeline} from './messages';
import type {Message} from '../src/lib/model';

export interface NotificationAdapter{available:boolean;fixture:boolean;capture(settings:NotificationSettings,signal:AbortSignal,delaySeconds?:number,contactHints?:string[]):Promise<CaptureFrame>}
export function canAutoDeliver(draft:NotificationDraft){
 const positioned=draft.extraction==='positioned'&&(draft.context==='system-notification'||draft.context==='feishu-window');
 return !draft.requiresConfirmation&&draft.contactIds.length===1&&(positioned||(draft.sourceMatched&&draft.confidence>=.9));
}
export class NotificationService{
 private status:NotificationStatus;
 private generation=0;private busy=false;private timer:ReturnType<typeof setTimeout>|undefined;private abort:AbortController|undefined;
 private seen=new Map<string,{at:number;baselineOnly:boolean}>();private confirming=new Set<string>();
 constructor(private store:Store,private pipeline:MessagePipeline,private adapter:NotificationAdapter,private changed:(status:NotificationStatus)=>void,private delivered:(message:Message)=>void,private now:()=>number=Date.now){
  this.status={state:'paused',available:adapter.available,fixture:adapter.fixture,error:'',drafts:[],delivered:0,duplicates:0};
 }
 get(){return structuredClone(this.status);}
 private publish(){this.changed(this.get());}
 stop(){this.generation++;clearTimeout(this.timer);this.timer=undefined;this.abort?.abort();this.status.state='paused';this.publish();return this.get();}
 clear(){this.stop();this.status.drafts=[];this.status.error='';delete this.status.lastResult;delete this.status.lastCapture;this.publish();return this.get();}
 dismiss(id:string){this.status.drafts=this.status.drafts.filter(d=>d.id!==id);this.publish();return this.get();}
 async start(includeVisible=true){
  if(this.status.state==='watching')return this.get();
  if(this.busy)throw new Error('正在识别，请等待本轮完成再开始监测。');
  this.requireAvailable();this.generation++;this.status.state='watching';this.status.error='';this.publish();
  const generation=this.generation;
  await this.scan(generation,!includeVisible); // 默认送达当前可见通知，重复指纹避免反复进场。
  this.schedule(generation);return this.get();
 }
 async once(delaySeconds=0,previewOnly=false){
  if(!Number.isInteger(delaySeconds)||delaySeconds<0||delaySeconds>10)throw new Error('单次识别准备时间须为 0–10 秒。');
  if(this.busy||this.status.state==='watching')throw new Error('请先暂停监测，再识别一次。');
  this.requireAvailable();this.generation++;this.status.state='capturing';this.status.error='';delete this.status.lastResult;this.publish();
  await this.scan(this.generation,false,previewOnly,delaySeconds);if(this.status.state==='capturing')this.status.state='paused';this.publish();return this.get();
 }
 private requireAvailable(){if(!this.adapter.available)throw new Error('通知识别需要 macOS 15.2+ 和已构建的原生模块。请在 Mac 执行 npm run build；其他平台仍可使用模拟消息。');}
 private schedule(generation:number){if(generation===this.generation&&this.status.state==='watching')this.timer=setTimeout(()=>void this.scan(generation).then(()=>this.schedule(generation)),this.store.get().notifications.intervalSeconds*1000);}
 private async scan(generation:number,baseline=false,manual=false,delaySeconds=0){
  if(this.busy)return;this.busy=true;this.abort=new AbortController();
  try{
   const snapshot=this.store.get();
   const hints=[...new Set([...snapshot.contacts.map(contact=>contact.name),...snapshot.contacts.flatMap(contact=>contact.notificationNames??[])])].slice(0,128);
   const frame=captureFrameSchema.parse(await this.adapter.capture(snapshot.notifications,this.abort.signal,delaySeconds,hints));
   if(generation!==this.generation)return;
   const result={frame,parsed:0,baseline,duplicates:0,newDrafts:0,delivered:0};this.status.lastResult=result;
   if(!['recognized','no-text'].includes(frame.status))throw new Error(frame.message||'通知识别未获得有效结果。');
   this.status.lastCapture=new Date(this.now()).toISOString();
   if(frame.status==='no-text'){this.status.error='本轮没有识别到文字，请确认通知在所选区域可见。';this.publish();return;}
   this.status.error='';
   for(const [key,seenAt] of this.seen)if(this.now()-seenAt.at>120000)this.seen.delete(key);
   const items=parseNotifications(frame,this.store.get().contacts);
   result.parsed=items.length;
   for(const item of items){
    const key=notificationKey(item),previous=this.seen.get(key),duplicate=Boolean(previous)&&!(manual&&previous?.baselineOnly);
    this.seen.set(key,{at:this.now(),baselineOnly:baseline?(previous?.baselineOnly??true):duplicate?(previous?.baselineOnly??false):false});
    while(this.seen.size>200)this.seen.delete(this.seen.keys().next().value!);
    if(baseline)continue;
    if(duplicate){this.status.duplicates++;result.duplicates++;continue;}
    const draft:NotificationDraft={...item,id:randomUUID(),capturedAt:new Date(this.now()).toISOString(),context:frame.context,fixture:frame.fixture||this.adapter.fixture};
    this.status.drafts=[draft,...this.status.drafts].slice(0,20);
    result.newDrafts++;
    if(!manual&&this.store.get().notifications.autoDeliver&&canAutoDeliver(draft)){
     await this.confirm({draftId:draft.id,contactId:draft.contactIds[0],text:draft.body},false,generation);
     result.delivered++;
    }
    if(generation!==this.generation)return;
   }
   if(!items.length)this.status.error='已识别到区域文字，但未找到姓名和正文组合；请调整选区或检查通知预览。';
   this.publish();
  }catch(error){if(generation!==this.generation)return;this.status.error=String(error instanceof Error?error.message:error);this.status.state='blocked';this.generation++;this.publish();}
  finally{this.busy=false;this.abort=undefined;}
 }
 async confirm(input:{draftId:string;contactId:string;text:string},confirmedByUser=true,generation=this.generation):Promise<Message>{
  const draft=this.status.drafts.find(d=>d.id===input.draftId);if(!draft)throw new Error('识别草稿已不存在，请重新识别。');
  if(this.confirming.has(draft.id))throw new Error('该通知正在送达，请勿重复确认。');
  if(!confirmedByUser&&(!canAutoDeliver(draft)||draft.contactIds[0]!==input.contactId))throw new Error('该通知需要人工确认。');
  this.confirming.add(draft.id);
  try{
   const message=await this.pipeline.receive({source:'notification',senderId:input.contactId,text:input.text,notification:{capturedAt:draft.capturedAt,observedSender:draft.sender,group:draft.group,recognizedText:draft.body,confirmedByUser,context:draft.context,fixture:draft.fixture}},()=>confirmedByUser||generation===this.generation);
   this.status.drafts=this.status.drafts.filter(d=>d.id!==draft.id);this.status.delivered++;
   if(generation===this.generation)this.delivered(message);
   this.publish();return message;
  }finally{this.confirming.delete(draft.id);}
 }
}
