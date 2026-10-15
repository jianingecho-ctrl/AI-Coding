import {execFile} from 'node:child_process';
import {access,readFile} from 'node:fs/promises';
import {constants} from 'node:fs';
import path from 'node:path';
import {captureFrameSchema,type NotificationSettings} from '../src/lib/notifications';
import type {NotificationAdapter} from './notifications';

export async function createNotificationAdapter(binary:string,fixtureFile?:string,windowsScript?:string):Promise<NotificationAdapter>{
 if(fixtureFile)return {available:true,fixture:true,capture:async()=>{const frame=captureFrameSchema.parse(JSON.parse(await readFile(fixtureFile,'utf8')));return {...frame,fixture:true};}};
 if(process.platform==='win32')return createWindowsNotificationAdapter(windowsScript??'');
 let available=process.platform==='darwin';if(available)try{await access(binary,constants.X_OK)}catch{available=false}
 return {available,fixture:false,capture:async(settings:NotificationSettings,signal:AbortSignal,delaySeconds=0,contactHints:string[]=[])=>{
  if(!available)throw new Error('本机通知识别模块不可用，请在 Mac 重新构建。');
  const args=['--json','--delay='+delaySeconds,'--contact-hints'];if(settings.region.mode==='custom')args.push('--rect',...['x','y','width','height'].map(key=>String(settings.region[key as 'x'|'y'|'width'|'height'])));
  else args.push('--size',String(settings.region.width),String(settings.region.height));
  const stdout=await new Promise<string>((resolve,reject)=>{const child=execFile(binary,args,{timeout:25000+delaySeconds*1000,maxBuffer:256*1024,signal},(error,out,err)=>{
   if(error&&!out.trim())reject(new Error(signal.aborted?'识别已暂停。':'原生识别失败：'+(err.trim()||error.message)));else resolve(out);
  });child.stdin?.on('error',()=>{});child.stdin?.end(JSON.stringify(contactHints.slice(0,128)));});
  const frame=captureFrameSchema.parse(JSON.parse(stdout));
  if(frame.status==='permission-required')frame.message='当前小判官进程尚未获得录屏权限。请在系统设置 → 隐私与安全性 → 屏幕与系统音频录制，允许当前应用（源码运行通常为 Electron），按系统提示重新打开。终端授权不能代替另一应用的授权。';
  return frame;
 }};
}

export function windowsCaptureArguments(script:string,delaySeconds:number){
 if(!script||!Number.isInteger(delaySeconds)||delaySeconds<0||delaySeconds>10)throw new Error('Windows 识别脚本或准备时间无效。');
 return ['-NoLogo','-NoProfile','-NonInteractive','-WindowStyle','Hidden','-ExecutionPolicy','RemoteSigned','-File',script,'-DelaySeconds',String(delaySeconds)];
}
export async function createWindowsNotificationAdapter(script:string):Promise<NotificationAdapter>{
 let available=true;try{await access(script,constants.R_OK)}catch{available=false}
 // Use the system executable, not a PATH entry controlled by an arbitrary working directory.
 const powershell=path.win32.join(process.env.SystemRoot||'C:\Windows','System32','WindowsPowerShell','v1.0','powershell.exe');
 return {available,fixture:false,capture:async(settings,signal,delaySeconds=0)=>{
  if(!available)throw new Error('Windows 通知脚本未安装，请重新安装完整安装包。');
  const stdout=await new Promise<string>((resolve,reject)=>{
   const child=execFile(powershell,windowsCaptureArguments(script,delaySeconds),{windowsHide:true,timeout:45000+delaySeconds*1000,maxBuffer:256*1024,signal,encoding:'utf8'},(error,out,err)=>{
    if(error&&!out.trim())reject(new Error(signal.aborted?'识别已暂停。':'Windows 本机识别未能启动：'+(err.trim()||error.message)));else resolve(out);
   });child.stdin?.on('error',()=>{});child.stdin?.end(JSON.stringify({region:settings.region}));
  });return captureFrameSchema.parse(JSON.parse(stdout.replace(/^\uFEFF/,'')));
 }};
}
