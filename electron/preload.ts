import {contextBridge,ipcRenderer} from 'electron';
import type { Bridge,State,Message } from '../src/lib/model';
const bridge:Bridge={
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
