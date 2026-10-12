import { z } from 'zod';
export const categories = ['领导','喜欢的同事','普通同事','讨厌的人'] as const;
export type Category = typeof categories[number];
export const contactSchema = z.object({id:z.string().min(1).max(100),name:z.string().trim().min(1).max(40),category:z.enum(categories)});
export type Contact = z.infer<typeof contactSchema>;
export const summarySchema = z.object({core:z.string().max(500),todos:z.array(z.string().max(500)).max(20),deadline:z.string().max(200),reply:z.string().max(200),source:z.enum(['本地规则摘要','本地 AI 摘要']),warning:z.string().optional()});
export type Summary = z.infer<typeof summarySchema>;
export const messageSchema = z.object({id:z.string(),contact:contactSchema,text:z.string().min(1).max(5000),createdAt:z.string(),summary:summarySchema});
export type Message = z.infer<typeof messageSchema>;
export const aiSchema = z.object({enabled:z.boolean(),model:z.string().trim().min(1).max(80).regex(/^[a-zA-Z0-9_.:/-]+$/)});
export const stateSchema = z.object({contacts:z.array(contactSchema).max(100),history:z.array(messageSchema).max(200),pet:z.object({name:z.string().trim().min(1).max(20),color:z.enum(['薄荷绿','蜜桃粉','奶油黄'])}),ai:aiSchema.default({enabled:false,model:'qwen2.5:3b'})});
export type State = z.infer<typeof stateSchema>;
export const defaultState: State = {contacts:[{id:'boss',name:'王经理',category:'领导'},{id:'friend',name:'小林',category:'喜欢的同事'},{id:'colleague',name:'陈同事',category:'普通同事'},{id:'annoying',name:'甩锅达人',category:'讨厌的人'}],history:[],pet:{name:'小判官',color:'薄荷绿'},ai:{enabled:false,model:'qwen2.5:3b'}};
export interface Bridge {
  getState():Promise<State>;
  saveSettings(settings:Pick<State,'contacts'|'pet'> & {ai?:State['ai']}):Promise<State>;
  sendMessage(input:{contactId:string;text:string}):Promise<Message>;
  clearHistory():Promise<State>;
  openPanel():Promise<void>;
  quit():Promise<void>;
  onState(callback:(state:State)=>void):()=>void;
  onMessage(callback:(message:Message)=>void):()=>void;
}
