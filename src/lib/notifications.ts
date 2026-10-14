import {z} from 'zod';
import type {Contact} from './model';

export const notificationSettingsSchema=z.object({
 region:z.object({mode:z.enum(['primary','custom']),x:z.number().int().min(-20000).max(20000),y:z.number().int().min(-20000).max(20000),width:z.number().int().min(50).max(800),height:z.number().int().min(50).max(1000)}).default({mode:'primary',x:0,y:0,width:480,height:360}),
 intervalSeconds:z.number().int().min(2).max(30).default(3),autoDeliver:z.boolean().default(false),
});
export type NotificationSettings=z.infer<typeof notificationSettingsSchema>;
export const defaultNotificationSettings=notificationSettingsSchema.parse({});
export const notificationMetaSchema=z.object({capturedAt:z.string(),observedSender:z.string().max(100),group:z.string().max(100).optional(),recognizedText:z.string().max(5000),confirmedByUser:z.boolean(),context:z.enum(['feishu-window','system-notification','other-window','unknown']),fixture:z.boolean().default(false)});
export type NotificationMeta=z.infer<typeof notificationMetaSchema>;
export const captureFrameSchema=z.object({status:z.enum(['recognized','no-text','permission-required','failed','timeout','unsupported']),message:z.string().max(2000).default(''),lines:z.array(z.object({text:z.string().max(1000),confidence:z.number().min(0).max(1)})).max(100).default([]),context:z.enum(['feishu-window','system-notification','other-window','unknown']).default('unknown'),fixture:z.boolean().default(false)});
export type CaptureFrame=z.infer<typeof captureFrameSchema>;
export interface ParsedNotification{sender:string;body:string;group?:string;contactIds:string[];confidence:number;sourceMatched:boolean;warnings:string[]}
export interface NotificationDraft extends ParsedNotification{id:string;capturedAt:string;context:CaptureFrame['context'];fixture:boolean}
export interface NotificationStatus{state:'paused'|'watching'|'capturing'|'blocked';available:boolean;fixture:boolean;error:string;drafts:NotificationDraft[];lastCapture?:string;delivered:number;duplicates:number}
const application=/^(飞书|Feishu|Lark)$/i;
const chrome=/^(更少内容|更多内容|显示更多|显示更少|大小|展开|收起|清除|清除所有|关闭|通知中心|现在|刚刚|\d+\s*(秒钟?|分钟?|小时|天)前|\d{1,2}:\d{2})$/;
const normalize=(text:string)=>text.normalize('NFKC').replace(/\s+/g,'').trim();
export function matchingContacts(sender:string,contacts:Contact[]){const name=normalize(sender);return contacts.filter(c=>[c.name,...(c.notificationNames??[])].some(alias=>normalize(alias)===name)).map(c=>c.id);}
// 群名/姓名：正文列表按条拆分；只在发送人位置匹配姓名，避免把正文中的同名词当发送者。
export function parseNotifications(frame:CaptureFrame,contacts:Contact[]):ParsedNotification[]{
 const rows=frame.lines.map(l=>({...l,text:l.text.trim()})).filter(l=>l.text&&!chrome.test(l.text));
 const brand=rows.findIndex(l=>application.test(l.text));
 const content=(brand>=0?rows.slice(brand+1):rows).filter(l=>!application.test(l.text));
 const sourceMatched=frame.context==='feishu-window'||(frame.context==='system-notification'&&brand===0&&rows[brand].confidence>=.9);
 const inline: {index:number;sender:string;body:string}[]=[];
 const standaloneKnown=content[0]&&matchingContacts(content[0].text,contacts).length>0&&!/群(?:聊)?$/.test(content[0].text);
 if(!standaloneKnown)content.forEach((row,index)=>{const m=row.text.match(/^([^：:]{1,40})[：:]\s*(.*)$/);if(m&&(matchingContacts(m[1],contacts).length>0||!/(\d|截止|时间|事项|备注|链接|摘要|进度|地址|请|提交|收到|https?)/i.test(m[1])))inline.push({index,sender:m[1].trim(),body:m[2].trim()});});
 const result:ParsedNotification[]=[];
 function add(sender:string,body:string,confidence:number,group?:string){
  if(!sender||!body||body.length>5000)return;
  const contactIds=matchingContacts(sender,contacts),warnings=[];
  if(!sourceMatched)warnings.push('通知来源无法自动确认，请核对是否来自飞书。');
  if(contactIds.length!==1)warnings.push(contactIds.length?'姓名对应多位联系人，请手动选择。':'姓名尚未绑定联系人，请选择联系人或添加通知姓名别名。');
  if(confidence<.9)warnings.push('识别置信度较低，请核对姓名与正文。');
  if(/[.…]{2,}|…/.test(body))warnings.push('可见正文可能被截断，完整内容请到飞书查看。');
  result.push({sender,body,group,contactIds,confidence,sourceMatched,warnings});
 }
 if(inline.length){
  const groups=new Set<string>();
  const predecessors=inline.map(item=>content[item.index-1]?.text).filter((v):v is string=>Boolean(v));
  for(const name of predecessors)if(/群(?:聊)?$/.test(name)||predecessors.filter(v=>v===name).length>1)groups.add(name);
  inline.forEach((item,i)=>{
   const end=inline[i+1]?.index??content.length,following=content.slice(item.index+1,end);
   const body=[item.body,...following.filter(row=>!groups.has(row.text)).map(row=>row.text)].filter(Boolean).join('\n');
   const previous=content[item.index-1]?.text,group=previous&&groups.has(previous)?previous:undefined;
   add(item.sender,body,Math.min(content[item.index].confidence,...following.filter(l=>!groups.has(l.text)).map(l=>l.confidence)),group);
  });
 }else if(content.length>=2){
  const sender=content[0].text;
  if(sender.length<=40)add(sender,content.slice(1).map(l=>l.text).join('\n'),Math.min(...content.map(l=>l.confidence)));
 }
 return result;
}
export function notificationKey(item:Pick<ParsedNotification,'sender'|'body'|'group'>){return [item.group??'',item.sender,item.body].map(normalize).join('\u0000');}
