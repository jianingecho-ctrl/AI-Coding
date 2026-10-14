import {z} from 'zod';
import type {Contact} from './model';
import {positionedNotifications} from './notification-layout';

export const notificationSettingsSchema=z.object({
 region:z.object({mode:z.enum(['primary','custom']),x:z.number().int().min(-20000).max(20000),y:z.number().int().min(-20000).max(20000),width:z.number().int().min(50).max(800),height:z.number().int().min(50).max(1000)}).default({mode:'primary',x:0,y:0,width:480,height:360}),
 intervalSeconds:z.number().int().min(2).max(30).default(3),autoDeliver:z.boolean().default(true),deliveryModeVersion:z.literal(2).default(2),
});
export type NotificationSettings=z.infer<typeof notificationSettingsSchema>;
export const defaultNotificationSettings=notificationSettingsSchema.parse({});
export const notificationMetaSchema=z.object({capturedAt:z.string(),observedSender:z.string().max(100),group:z.string().max(100).optional(),recognizedText:z.string().max(5000),confirmedByUser:z.boolean(),context:z.enum(['feishu-window','system-notification','other-window','unknown']),fixture:z.boolean().default(false)});
export type NotificationMeta=z.infer<typeof notificationMetaSchema>;
export const captureFrameSchema=z.object({status:z.enum(['recognized','no-text','permission-required','failed','timeout','unsupported']),message:z.string().max(2000).default(''),lines:z.array(z.object({text:z.string().max(1000),confidence:z.number().min(0).max(1),box:z.object({x:z.number().finite(),y:z.number().finite(),width:z.number().positive(),height:z.number().positive()}).optional()})).max(100).default([]),region:z.object({x:z.number().finite(),y:z.number().finite(),width:z.number().positive(),height:z.number().positive()}).optional(),captureMode:z.enum(['selected-area','notification-window']).default('selected-area'),context:z.enum(['feishu-window','system-notification','other-window','unknown']).default('unknown'),fixture:z.boolean().default(false)});
export type CaptureFrame=z.infer<typeof captureFrameSchema>;
export interface ParsedNotification{sender:string;body:string;group?:string;contactIds:string[];confidence:number;sourceMatched:boolean;requiresConfirmation?:boolean;extraction?:'positioned';warnings:string[]}
export interface NotificationDraft extends ParsedNotification{id:string;capturedAt:string;context:CaptureFrame['context'];fixture:boolean}
export interface NotificationStatus{state:'paused'|'watching'|'capturing'|'blocked';available:boolean;fixture:boolean;error:string;drafts:NotificationDraft[];lastCapture?:string;lastResult?:{frame:CaptureFrame;parsed:number;baseline:boolean;duplicates:number;newDrafts:number;delivered:number};delivered:number;duplicates:number}
const application=/^(飞书|Feishu|Lark)$/i;
const chrome=/^(更少内容|更多内容|显示更多|显示更少|大小|展开|收起|清除|清除所有|关闭|通知中心|现在|刚刚|\d+\s*(秒钟?|分钟?|小时|天)前|\d{1,2}:\d{2})$/;
const normalize=(text:string)=>text.normalize('NFKC').replace(/\s+/g,'').trim();
export function matchingContacts(sender:string,contacts:Contact[]){const name=normalize(sender);return contacts.filter(c=>[c.name,...(c.notificationNames??[])].some(alias=>normalize(alias)===name)).map(c=>c.id);}
export function suggestedContacts(sender:string,contacts:Contact[]){
 const name=normalize(sender),stem=name.replace(/(?<=[\u4e00-\u9fff])[lI1|]$/,'');
 return stem!==name&&/^[\u4e00-\u9fff]{2,}$/.test(stem)?matchingContacts(stem,contacts):[];
}
// 群名/姓名：正文列表按条拆分；只在发送人位置匹配姓名，避免把正文中的同名词当发送者。
export function parseNotifications(frame:CaptureFrame,contacts:Contact[]):ParsedNotification[]{
 const rows=frame.lines.map(l=>({...l,text:l.text.trim()})).filter(l=>l.text&&!chrome.test(l.text));
 const brand=rows.findIndex(l=>application.test(l.text));
 const content=(brand>=0?rows.slice(brand+1):rows).filter(l=>!application.test(l.text));
 const sourceMatched=frame.context==='feishu-window'||(frame.context==='system-notification'&&brand===0&&rows[brand].confidence>=.9);
 const notificationWindow=frame.context==='feishu-window'||frame.context==='system-notification'||(frame.context==='unknown'&&brand===0);
 const containsOwnInterface=rows.some(row=>/小判官|拖动.*判官|打工待命|核对通知正文|本机规则解析|本地规则摘要|对应联系人/.test(row.text));
 const inline: {index:number;sender:string;body:string}[]=[];
 const standaloneKnown=content[0]&&matchingContacts(content[0].text,contacts).length>0&&!/群(?:聊)?$/.test(content[0].text);
 if(!standaloneKnown)content.forEach((row,index)=>{const m=row.text.match(/^([^：:]{1,40})[：:]\s*(.*)$/);if(m&&(matchingContacts(m[1],contacts).length>0||(notificationWindow&&!/(\d|截止|时间|事项|备注|链接|摘要|进度|地址|请|提交|收到|https?)/i.test(m[1]))))inline.push({index,sender:m[1].trim(),body:m[2].trim()});});
 const result:ParsedNotification[]=[];
 function add(sender:string,body:string,confidence:number,group?:string,requiresConfirmation=false,position?:{suggested:boolean;contactIds:string[];ownInterface:boolean;brandMatched:boolean}){
  if(!sender||!body||body.length>5000)return;
  const ownInterface=position?position.ownInterface:containsOwnInterface;
  requiresConfirmation=requiresConfirmation||ownInterface||Boolean(position?.suggested);
  const contactIds=position?.contactIds??matchingContacts(sender,contacts),warnings=[];
  const matchedSource=sourceMatched||Boolean(position?.brandMatched&&frame.context==='system-notification');
  if(!matchedSource)warnings.push(position&&frame.context==='system-notification'?'系统通知窗口已定位，但未识别到飞书标题；请核对来源。':'通知来源无法自动确认，请核对是否来自飞书。');
  if(contactIds.length!==1)warnings.push(contactIds.length?'姓名对应多位联系人，请手动选择。':'姓名尚未绑定联系人，请选择联系人或添加通知姓名别名。');
  if(confidence<.9)warnings.push('识别置信度较低，请核对姓名与正文。');
  if(position?.suggested)warnings.push('末尾 l/I/1 可能是识别误差，联系人仅为相似姓名建议，请人工确认；不会据此自动触发。');
  if(requiresConfirmation&&!position&&!ownInterface)warnings.push('多张通知根据文字分隔，请核对各条姓名与正文后确认。');
  if(ownInterface)warnings.push('识别内容混入小判官界面，选区可能被遮挡。请移开控制台和桌宠后重新识别，不会自动送达。');
  if(position&&requiresConfirmation&&!ownInterface&&!position.suggested)warnings.push('姓名或正文触及截图边界，请核对是否被截断。');
  if(/[.…]{2,}|…/.test(body))warnings.push('可见正文可能被截断，完整内容请到飞书查看。');
  result.push({sender,body,group,contactIds,confidence,sourceMatched:matchedSource,...(requiresConfirmation?{requiresConfirmation:true}:{}),...(position?{extraction:'positioned' as const}:{}),warnings});
 }
 if(frame.lines.some(line=>line.box)){
  const positioned=positionedNotifications(frame,name=>{const exact=matchingContacts(name,contacts);return {contactIds:exact.length?exact:suggestedContacts(name,contacts),suggested:!exact.length};});
  positioned.forEach(item=>add(item.sender,item.body,item.confidence,undefined,item.clipped,{suggested:item.suggested,contactIds:item.contactIds,brandMatched:item.brandMatched,ownInterface:/小判官|拖动.*判官|打工待命|核对通知正文|本机规则解析|本地规则摘要|对应联系人/.test(item.sender+'\n'+item.body)}));
  if(result.length||frame.captureMode!=='notification-window')return result;
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
  // 系统通知展开后是「姓名 / 正文」连续卡片；同一姓名重复或已绑定姓名是后续卡片边界。
  // 从已有首个姓名开始，至少留下一个正文行；正文中的时间、冒号仍保留。
  const sender=content[0].text;
  if(sender.length<=40&&(notificationWindow||matchingContacts(sender,contacts).length>0)){
   const starts=[0];
   for(let i=2;i<content.length-1;i++)if(i-starts[starts.length-1]>=2&&(normalize(content[i].text)===normalize(sender)||matchingContacts(content[i].text,contacts).length>0)&&content[i].text.length<=40)starts.push(i);
   starts.forEach((start,i)=>{const end=starts[i+1]??content.length,block=content.slice(start,end);add(block[0].text,block.slice(1).map(l=>l.text).join('\n'),Math.min(...block.map(l=>l.confidence)),undefined,starts.length>1);});
  }
 }
 return result;
}
export function notificationKey(item:Pick<ParsedNotification,'sender'|'body'|'group'>){return [item.group??'',item.sender,item.body].map(normalize).join('\u0000');}
