import {z} from 'zod';
import {interactionKinds,type DailyInteraction} from '../src/lib/model';
import {emptyCounts,localDay} from '../src/lib/interactions';
import type {Store} from './store';

const inputSchema=z.object({messageId:z.string().min(1),kind:z.enum(interactionKinds)});
export class InteractionService{
 constructor(private store:Store,private now:()=>Date=()=>new Date()){}
 async record(input:unknown):Promise<DailyInteraction>{
  const {messageId,kind}=inputSchema.parse(input),now=this.now(),day=localDay(now);
  const cutoff=localDay(new Date(now.getFullYear(),now.getMonth(),now.getDate()-89));
  let result:DailyInteraction|undefined;
  await this.store.update(s=>{
   const message=s.history.find(m=>m.id===messageId);
   if(!message||message.preview)throw new Error('消息不存在；演示互动不计入统计');
   const rows=s.interactions.filter(r=>r.day>=cutoff);
   const index=rows.findIndex(r=>r.day===day&&r.contactId===message.contact.id);
   const row=index<0?{day,contactId:message.contact.id,contactName:message.contact.name,counts:emptyCounts()}:rows[index];
   result={...row,contactName:s.contacts.find(c=>c.id===row.contactId)?.name??message.contact.name,counts:{...row.counts,[kind]:row.counts[kind]+1}};
   if(index<0)rows.push(result);else rows[index]=result;
   // 有限本地存储；删除联系人后仍按消息中的稳定 ID 统计。
   return {...s,interactions:rows.sort((a,b)=>b.day.localeCompare(a.day)).slice(0,9000)};
  });
  return result!;
 }
 clear(){return this.store.update(s=>({...s,interactions:[]}));}
}
