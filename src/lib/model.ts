import {z} from 'zod';
import {notificationSettingsSchema,defaultNotificationSettings,notificationMetaSchema,type NotificationSettings,type NotificationStatus} from './notifications';
export const categories=['领导—支配我之人','老实之人','厌世之人','躺平之人','小傻之人','大傻之人','NPC同事'] as const;
export const legacyCategories=['领导','喜欢的同事','普通同事','讨厌的人','特别讨厌的人'] as const;
export type Category=typeof categories[number]|typeof legacyCategories[number];
export const personaIds=['leader','honest','bored','laidback','silly','bigSilly','npc'] as const;
export const palaceIds=['palace_emperor','palace_meizhuang','palace_huafei','palace_jingfei','palace_anlingrong','palace_empress','palace_zhenhuan'] as const;
export const themeIds=['ocean','palace'] as const;
export type Theme=typeof themeIds[number];
export const fishCharacterIds=['balloon','tongue','anxious','cool','lying','office'] as const;
export const characterIds=[...personaIds,...palaceIds,...fishCharacterIds,'camel'] as const;
export type CharacterId=typeof characterIds[number];
export type FishCharacterId=typeof fishCharacterIds[number];
export const actionIds=['salute','smile','sigh','lie','scratch','kneel','stand','happy','wave','fish','yawn','panic'] as const;
export const entryIds=['run','walk','float','roll','jump','slide','fade','bounce','spin'] as const;
export const characterSkinIds=['desert','milktea','neon','judge'] as const;
export const cardSkinIds=['note','verdict','chat','alarm','palace'] as const;
export const gagIds=['none','paper','fish','hearts','overload'] as const;
export type Action=typeof actionIds[number];
export type CharacterSkin=typeof characterSkinIds[number];
export const personalEffectSchema=z.object({
 character:z.enum(['auto',...characterIds]).default('auto'),action:z.enum(['auto',...actionIds]).default('auto'),
 entry:z.enum(['auto',...entryIds]).default('auto'),characterSkin:z.enum(['auto',...characterSkinIds]).default('auto'),
 cardSkin:z.enum(['auto',...cardSkinIds]).default('auto'),gag:z.enum(['auto',...gagIds]).default('auto'),
 duration:z.number().min(.3).max(5).nullable().default(null),assetId:z.string().uuid().nullable().default(null),
 line:z.string().trim().max(60).default(''),
});
export type PersonalEffect=z.infer<typeof personalEffectSchema>;
export const resolvedEffectSchema=z.object({
 character:z.enum(characterIds).default('camel'),action:z.enum(actionIds),entry:z.enum(entryIds),
 characterSkin:z.enum(characterSkinIds),cardSkin:z.enum(cardSkinIds),gag:z.enum(gagIds),line:z.string().max(60),
 duration:z.number().min(.3).max(5).default(1.2),assetId:z.string().uuid().nullable().default(null),
 theme:z.enum(themeIds).default('ocean'),
});
export type ResolvedEffect=z.infer<typeof resolvedEffectSchema>;
export const contactSchema=z.object({id:z.string().min(1).max(100),name:z.string().trim().min(1).max(40),category:z.enum([...categories,...legacyCategories]),effects:personalEffectSchema.optional(),notificationNames:z.array(z.string().trim().min(1).max(40)).max(10).optional()});
export type Contact=z.infer<typeof contactSchema>;
export const summarySchema=z.object({core:z.string().max(500),todos:z.array(z.string().max(500)).max(20),deadline:z.string().max(200),reply:z.string().max(200),urgency:z.enum(['低','中','高','未明确']).default('未明确'),source:z.enum(['本地规则摘要','本地 AI 摘要','在线 AI 摘要']),warning:z.string().optional()});
export type Summary=z.infer<typeof summarySchema>;
export const messageSchema=z.object({id:z.string(),contact:contactSchema,text:z.string().min(1).max(5000),createdAt:z.string(),summary:summarySchema,source:z.enum(['mock','notification']).optional(),notification:notificationMetaSchema.optional(),effect:resolvedEffectSchema.optional(),preview:z.boolean().optional(),replies:z.array(z.object({id:z.string(),text:z.string().trim().min(1).max(2000),createdAt:z.string()})).max(50).optional()});
export type Message=z.infer<typeof messageSchema>;
export const aiSchema=z.object({enabled:z.boolean(),provider:z.enum(['ollama','openai-compatible']).default('ollama'),model:z.string().trim().min(1).max(100).regex(/^[a-zA-Z0-9_.:/-]+$/),baseUrl:z.string().max(300).default('https://api.openai.com/v1')});
export const assetSchema=z.object({id:z.string().uuid(),name:z.string().max(120),kind:z.enum(['image','gif','sequence']),files:z.array(z.string().regex(/^\d{3}\.(png|jpg|jpeg|webp|gif)$/)).min(1).max(60),createdAt:z.string()});
export type Asset=z.infer<typeof assetSchema>;
export const interactionKinds=['elbow','slap','burn','heart'] as const;
export type InteractionKind=typeof interactionKinds[number];
export const interactionCountsSchema=z.object({elbow:z.number().int().min(0).max(1000000),slap:z.number().int().min(0).max(1000000),burn:z.number().int().min(0).max(1000000),heart:z.number().int().min(0).max(1000000)});
export type InteractionCounts=z.infer<typeof interactionCountsSchema>;
export const dailyInteractionSchema=z.object({day:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),contactId:z.string().min(1).max(100),contactName:z.string().min(1).max(40),counts:interactionCountsSchema});
export type DailyInteraction=z.infer<typeof dailyInteractionSchema>;
export const stateSchema=z.object({
 contacts:z.array(contactSchema).max(100),history:z.array(messageSchema).max(200),
 pet:z.object({name:z.string().trim().min(1).max(20),color:z.enum(['薄荷绿','蜜桃粉','奶油黄']),skin:z.enum(characterSkinIds).default('desert'),character:z.enum(characterIds).default('npc'),assetId:z.string().uuid().nullable().default(null),alwaysOnTop:z.boolean().default(true),scale:z.number().min(.45).max(1).default(.6),soundEnabled:z.boolean().default(true),soundVolume:z.number().min(0).max(1).default(.45),theme:z.enum(themeIds).default('ocean')}),
 ai:aiSchema.default({enabled:false,provider:'ollama',model:'qwen2.5:3b',baseUrl:'https://api.openai.com/v1'}),assets:z.array(assetSchema).max(100).default([]),
 interactions:z.array(dailyInteractionSchema).max(9000).default([]),
 notifications:notificationSettingsSchema.default(defaultNotificationSettings),
});
export type State=z.infer<typeof stateSchema>;
export interface AppInfo{edition:Theme;name:string;label:string;version:string;appId:string;dataDirectory:string;migratedLegacy:boolean}
export const defaultState:State={contacts:categories.map((category,i)=>({id:['boss','honest','bored','laidback','silly','bigSilly','npc'][i],name:['王经理','老实小陈','厌世小周','躺平搭子','小迷糊','甩锅达人','路过同事'][i],category})),history:[],pet:{name:'小判官',color:'薄荷绿',skin:'desert',character:'npc',assetId:null,alwaysOnTop:true,scale:.6,soundEnabled:true,soundVolume:.45,theme:'ocean'},ai:{enabled:false,provider:'ollama',model:'qwen2.5:3b',baseUrl:'https://api.openai.com/v1'},assets:[],interactions:[],notifications:structuredClone(defaultNotificationSettings)};
export interface Bridge{
 notificationStatus():Promise<NotificationStatus>;saveNotificationSettings(settings:NotificationSettings):Promise<State>;
 captureNotification(delaySeconds?:number):Promise<NotificationStatus>;startNotifications():Promise<NotificationStatus>;stopNotifications():Promise<NotificationStatus>;
 confirmNotification(input:{draftId:string;contactId:string;text:string}):Promise<Message>;dismissNotification(id:string):Promise<NotificationStatus>;clearNotificationDrafts():Promise<NotificationStatus>;
 onNotifications(callback:(status:NotificationStatus)=>void):()=>void;copyText(text:string):Promise<void>;
 getAppInfo():Promise<AppInfo>;
 getState():Promise<State>;saveSettings(settings:Pick<State,'contacts'|'pet'>&{ai?:State['ai']}):Promise<State>;
 sendMessage(input:{contactId:string;text:string}):Promise<Message>;previewContact(contact:Contact):Promise<Message>;
 clearDisplayedMessage():Promise<void>;importAsset():Promise<Asset|null>;getAssetFrames(id:string):Promise<string[]>;
 saveAiKey(key:string):Promise<void>;hasAiKey():Promise<boolean>;
 recordInteraction(input:{messageId:string;kind:InteractionKind}):Promise<DailyInteraction>;clearInteractions():Promise<State>;setPetExpanded(expanded:boolean):Promise<void>;
 replyMessage(input:{messageId:string;text:string}):Promise<Message>;restoreMessage(id:string):Promise<Message>;hidePet():Promise<void>;showPet():Promise<void>;clearHistory():Promise<State>;openPanel():Promise<void>;quit():Promise<void>;
 onMessageCleared(callback:()=>void):()=>void;onState(callback:(state:State)=>void):()=>void;onMessage(callback:(message:Message)=>void):()=>void;
}
