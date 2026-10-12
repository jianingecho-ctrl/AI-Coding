import {contextBridge,ipcRenderer} from 'electron';
import type { Bridge,State,Message } from '../src/lib/model';
const bridge:Bridge={
 getState:()=>ipcRenderer.invoke('state:get'),saveSettings:settings=>ipcRenderer.invoke('settings:save',settings),
 sendMessage:input=>ipcRenderer.invoke('message:send',input),clearHistory:()=>ipcRenderer.invoke('history:clear'),
 openPanel:()=>ipcRenderer.invoke('panel:open'),quit:()=>ipcRenderer.invoke('app:quit'),
 onState:callback=>{const listener=(_:unknown,state:State)=>callback(state);ipcRenderer.on('state:changed',listener);return()=>ipcRenderer.removeListener('state:changed',listener);},
 onMessage:callback=>{const listener=(_:unknown,message:Message)=>callback(message);ipcRenderer.on('message:new',listener);return()=>ipcRenderer.removeListener('message:new',listener);}
};
contextBridge.exposeInMainWorld('judge',bridge);
