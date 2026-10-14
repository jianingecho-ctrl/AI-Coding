import type {Contact,Message,MessagePriority} from './model';
export function contactPriority(contact:Contact):MessagePriority{return contact.messagePriority??(contact.category==='领导—支配我之人'||contact.category==='领导'?'最高':'普通');}
export function priorityRank(message:Message){return {最高:4,高:3,普通:2,低:1}[contactPriority(message.contact)];}
