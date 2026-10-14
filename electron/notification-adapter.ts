import {execFile} from 'node:child_process';
import {access,readFile} from 'node:fs/promises';
import {constants} from 'node:fs';
import {captureFrameSchema,type NotificationSettings} from '../src/lib/notifications';
import type {NotificationAdapter} from './notifications';

export async function createNotificationAdapter(binary:string,fixtureFile?:string):Promise<NotificationAdapter>{
 if(fixtureFile)return {available:true,fixture:true,capture:async()=>{const frame=captureFrameSchema.parse(JSON.parse(await readFile(fixtureFile,'utf8')));return {...frame,fixture:true};}};
 let available=process.platform==='darwin';if(available)try{await access(binary,constants.X_OK)}catch{available=false}
 return {available,fixture:false,capture:async(settings:NotificationSettings,signal:AbortSignal)=>{
  if(!available)throw new Error('本机通知识别模块不可用，请在 Mac 重新构建。');
  const args=['--json','--delay=0'];if(settings.region.mode==='custom')args.push('--rect',...['x','y','width','height'].map(key=>String(settings.region[key as 'x'|'y'|'width'|'height'])));
  else args.push('--size',String(settings.region.width),String(settings.region.height));
  const stdout=await new Promise<string>((resolve,reject)=>execFile(binary,args,{timeout:25000,maxBuffer:256*1024,signal},(error,out,err)=>{
   if(error&&!out.trim())reject(new Error(signal.aborted?'识别已暂停。':'原生识别失败：'+(err.trim()||error.message)));else resolve(out);
  }));
  const frame=captureFrameSchema.parse(JSON.parse(stdout));
  if(frame.status==='permission-required')frame.message='当前小判官进程尚未获得录屏权限。请在系统设置 → 隐私与安全性 → 屏幕与系统音频录制，允许当前应用（源码运行通常为 Electron），按系统提示重新打开。终端授权不能代替另一应用的授权。';
  return frame;
 }};
}
