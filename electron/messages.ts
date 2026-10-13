import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {contactSchema,type Message,type Contact} from '../src/lib/model';
import {resolveEffects} from '../src/lib/effects';
import {summarize} from '../src/lib/summary';
import {extractSummary} from './ai';
import type {Store} from './store';

// V1.0 只接受模拟来源。未来获授权的飞书适配器可扩展来源，并将发送人 ID 映射到本地联系人。
export const incomingMessageSchema=z.object({source:z.literal('mock'),senderId:z.string().min(1).max(100),text:z.string().trim().min(1).max(5000)});
export type IncomingMessage=z.infer<typeof incomingMessageSchema>;
// 收消息、解析、保存与窗口/动画解耦；展示层只消费标准 Message。
export class MessagePipeline{
 private revision=0;
 async clearHistory(){this.revision++;return this.store.update(s=>({...s,history:[]}));}
 constructor(private store:Store,private getKey:()=>Promise<string>,private analyze:typeof extractSummary=extractSummary){}
 async receive(input:unknown):Promise<Message>{
  const incoming=incomingMessageSchema.parse(input),snapshot=this.store.get(),revision=this.revision;
  const contact=snapshot.contacts.find(c=>c.id===incoming.senderId);if(!contact)throw new Error('联系人不存在');
  const key=snapshot.ai.enabled&&snapshot.ai.provider==='openai-compatible'?await this.getKey():'';
  const message:Message={id:randomUUID(),contact,text:incoming.text,createdAt:new Date().toISOString(),source:'mock',summary:await this.analyze(incoming.text,snapshot.ai,fetch,key),effect:resolveEffects(contact,snapshot.pet)};
  const ensureCurrent=()=>{if(revision!==this.revision)throw new Error('历史已清空，本条分析已取消。');};
  ensureCurrent();await this.store.update(s=>{ensureCurrent();return {...s,history:[message,...s.history].slice(0,200)}});ensureCurrent();return message;
 }
 preview(input:Contact):Message{
  const contact=contactSchema.parse(input),text=contact.id.startsWith('demo-')?`七类人物演示：${contact.category}。请明天下午3点前完成模拟任务，收到请回复。`:'这是一条桌面效果预览消息，不写入历史。请明天下午3点前提交摸鱼报告，收到请回复。';
  return {id:randomUUID(),contact,text,createdAt:new Date().toISOString(),source:'mock',summary:summarize(text),effect:resolveEffects(contact,this.store.get().pet),preview:true};
 }
}
