import {it,expect,vi,afterEach,beforeEach} from 'vitest';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
const shell=vi.hoisted(()=>({execute:vi.fn(),input:vi.fn()}));
vi.mock('node:child_process',()=>({execFile:shell.execute}));
import {createWindowsNotificationAdapter,windowsCaptureArguments} from '../electron/notification-adapter';
import {captureFrameSchema,parseNotifications,defaultNotificationSettings,type CaptureFrame} from '../src/lib/notifications';
import {canAutoDeliver,NotificationService} from '../electron/notifications';
import {Store} from '../electron/store';
import {MessagePipeline} from '../electron/messages';
const directories:string[]=[],services:NotificationService[]=[];
beforeEach(()=>{shell.execute.mockReset();shell.input.mockReset()});
afterEach(async()=>{services.splice(0).forEach(service=>service.stop());await Promise.all(directories.splice(0).map(dir=>rm(dir,{recursive:true,force:true})))});
async function script(){const directory=await mkdtemp(path.join(tmpdir(),'judge-windows-'));directories.push(directory);const file=path.join(directory,'中文 路径 & $通知.ps1');await writeFile(file,'# test');return file;}
function result(stdout:string,error:Error|null=null,stderr=''){
 shell.execute.mockImplementation((_exe,_args,_options,callback)=>{queueMicrotask(()=>callback(error,stdout,stderr));return {stdin:{on:vi.fn(),end:shell.input}}});
}
it('Windows 脚本路径是独立参数，准备时间有限制，不执行 shell 拼接命令',()=>{
 const name='C:\\Users\\张 三\\下载 & test\\通知.ps1',args=windowsCaptureArguments(name,5);
 expect(args.slice(-4)).toEqual(['-File',name,'-DelaySeconds','5']);expect(args).toContain('RemoteSigned');expect(args).not.toContain('Bypass');
 for(const delay of [-1,11,.5,NaN])expect(()=>windowsCaptureArguments(name,delay)).toThrow();expect(()=>windowsCaptureArguments('',0)).toThrow();
});
it('适配器使用系统 PowerShell、隐藏子窗口、可中止，并只通过 stdin 传选区',async()=>{
 const file=await script();result('\uFEFF'+JSON.stringify({status:'no-text',lines:[]}));const adapter=await createWindowsNotificationAdapter(file),signal=new AbortController().signal;
 expect(adapter.available).toBe(true);expect((await adapter.capture(defaultNotificationSettings,signal,5,['不应传入的联系人'])).status).toBe('no-text');
 const [exe,args,options]=shell.execute.mock.calls[0];expect(exe).toMatch(/\\System32\\WindowsPowerShell\\v1\.0\\powershell\.exe$/);expect(args).toEqual(windowsCaptureArguments(file,5));expect(options).toMatchObject({signal,windowsHide:true,timeout:50000,encoding:'utf8'});expect(options.shell).toBeUndefined();
 expect(JSON.parse(shell.input.mock.calls[0][0])).toEqual({region:defaultNotificationSettings.region});
});
it('脚本缺失、执行被企业策略阻止及损坏输出明确失败，不伪造通知',async()=>{
 const absent=await createWindowsNotificationAdapter('/does-not-exist/NotificationCapture.ps1');expect(absent.available).toBe(false);await expect(absent.capture(defaultNotificationSettings,new AbortController().signal)).rejects.toThrow('未安装');expect(shell.execute).not.toHaveBeenCalled();
 const adapter=await createWindowsNotificationAdapter(await script());result('',new Error('policy'),'脚本被组织策略禁止');await expect(adapter.capture(defaultNotificationSettings,new AbortController().signal)).rejects.toThrow('脚本被组织策略禁止');
 result('not-json');await expect(adapter.capture(defaultNotificationSettings,new AbortController().signal)).rejects.toThrow();
 result(JSON.stringify({status:'unsupported',message:'请安装中文 OCR 组件',lines:[]}));expect(await adapter.capture(defaultNotificationSettings,new AbortController().signal)).toMatchObject({status:'unsupported',message:'请安装中文 OCR 组件'});
});
function windowsFrame(context:CaptureFrame['context']='feishu-window'):CaptureFrame{return captureFrameSchema.parse({status:'recognized',context,captureMode:'notification-window',region:{x:960,y:760,width:480,height:240},lines:[{text:'测试同事',confidence:.5,confidenceKnown:false,box:{x:60,y:42,width:80,height:16}},{text:'请今天17点前核对文件并回复',confidence:.5,confidenceKnown:false,box:{x:60,y:66,width:260,height:16}}]});}
it('Windows 未评分 OCR 明确标记，已定位的精确姓名触发角色，来源不明时仅产生草稿',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'judge-win-delivery-'));directories.push(directory);const store=new Store(path.join(directory,'state.json'));await store.load();await store.update(s=>({...s,contacts:[{id:'win-contact',name:'测试同事',category:'老实之人'}],ai:{...s.ai,enabled:true}}));
 const parsed=parseNotifications(windowsFrame(),store.get().contacts)[0];expect(parsed.confidenceKnown).toBe(false);expect(parsed.warnings.join()).toContain('未提供置信度');expect(parsed.warnings.join()).not.toContain('较低');
 expect(canAutoDeliver({...parsed,id:'draft',capturedAt:new Date().toISOString(),context:'unknown',fixture:false})).toBe(false);
 const delivered=vi.fn(),remoteAI=vi.fn(),service=new NotificationService(store,new MessagePipeline(store,async()=>'',remoteAI),{available:true,fixture:false,capture:async()=>windowsFrame()},()=>{},delivered);services.push(service);
 await service.once();expect(delivered).toHaveBeenCalledOnce();expect(store.get().history[0]).toMatchObject({source:'notification',contact:{id:'win-contact'},effect:{character:'honest'},summary:{source:'本地规则摘要'}});expect(remoteAI).not.toHaveBeenCalled();await service.once();expect(delivered).toHaveBeenCalledOnce();
});
