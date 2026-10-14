import {contextBridge,ipcRenderer} from 'electron';
import type { Bridge,State,Message } from '../src/lib/model';
import type {NotificationStatus} from '../src/lib/notifications';
const bridge:Bridge={
 notificationStatus:()=>ipcRenderer.invoke('notifications:status'),saveNotificationSettings:settings=>ipcRenderer.invoke('notifications:save',settings),
 captureNotification:delay=>ipcRenderer.invoke('notifications:once',delay),startNotifications:()=>ipcRenderer.invoke('notifications:start'),stopNotifications:()=>ipcRenderer.invoke('notifications:stop'),
 confirmNotification:input=>ipcRenderer.invoke('notifications:confirm',input),dismissNotification:id=>ipcRenderer.invoke('notifications:dismiss',id),clearNotificationDrafts:()=>ipcRenderer.invoke('notifications:clear'),copyText:text=>ipcRenderer.invoke('clipboard:copy',text),
 onNotifications:callback=>{const listener=(_:unknown,status:NotificationStatus)=>callback(status);ipcRenderer.on('notifications:changed',listener);return()=>ipcRenderer.removeListener('notifications:changed',listener);},
 getAppInfo:()=>ipcRenderer.invoke('app:info'),
 getState:()=>ipcRenderer.invoke('state:get'),saveSettings:settings=>ipcRenderer.invoke('settings:save',settings),
 sendMessage:input=>ipcRenderer.invoke('message:send',input),clearHistory:()=>ipcRenderer.invoke('history:clear'),
 previewContact:contact=>ipcRenderer.invoke('effect:preview',contact),
 clearDisplayedMessage:()=>ipcRenderer.invoke('message:clear'),importAsset:()=>ipcRenderer.invoke('asset:import'),getAssetFrames:id=>ipcRenderer.invoke('asset:frames',id),
 saveAiKey:key=>ipcRenderer.invoke('ai:key-save',key),hasAiKey:()=>ipcRenderer.invoke('ai:key-status'),
 recordInteraction:input=>ipcRenderer.invoke('interaction:record',input),clearInteractions:()=>ipcRenderer.invoke('interaction:clear'),setPetExpanded:expanded=>ipcRenderer.invoke('pet:expanded',expanded),
 replyMessage:input=>ipcRenderer.invoke('message:reply',input),restoreMessage:id=>ipcRenderer.invoke('message:restore',id),hidePet:()=>ipcRenderer.invoke('pet:hide'),showPet:()=>ipcRenderer.invoke('pet:show'),
 openPanel:()=>ipcRenderer.invoke('panel:open'),quit:()=>ipcRenderer.invoke('app:quit'),
 onMessageCleared:callback=>{const listener=()=>callback();ipcRenderer.on('message:clear',listener);return()=>ipcRenderer.removeListener('message:clear',listener);},
 onState:callback=>{const listener=(_:unknown,state:State)=>callback(state);ipcRenderer.on('state:changed',listener);return()=>ipcRenderer.removeListener('state:changed',listener);},
 onMessage:callback=>{const listener=(_:unknown,message:Message)=>callback(message);ipcRenderer.on('message:new',listener);return()=>ipcRenderer.removeListener('message:new',listener);}
};
contextBridge.exposeInMainWorld('judge',bridge);
