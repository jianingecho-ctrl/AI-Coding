import {app,BrowserWindow,ipcMain,Menu,screen,dialog,nativeImage,clipboard} from 'electron';
import path from 'node:path';
import {readFileSync,mkdirSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {contactSchema,stateSchema,type State,type Message,type AppInfo} from '../src/lib/model';
import {messageEffects} from '../src/lib/effects';
import {MessagePipeline} from './messages';
import {Store} from './store';
import {importFiles,readFrames} from './assets';
import {Credentials} from './credentials';
import {InteractionService} from './interactions';
import {petWindowSize,resizedPetBounds} from '../src/lib/pet-layout';
import {editionDefinitions,editionDefaults,normalizeEditionState,assertEditionSettings,assertEditionContact} from '../src/lib/editions';
import {parseEdition,editionDataRoot,migrateLegacyOcean} from './editions';
import {NotificationService} from './notifications';
import {createNotificationAdapter} from './notification-adapter';
import {notificationSettingsSchema} from '../src/lib/notifications';
const editionFile=!app.isPackaged&&process.env.JUDGE_EDITION_FILE?process.env.JUDGE_EDITION_FILE:path.join(__dirname,'../../edition.json');
const edition=parseEdition(readFileSync(editionFile,'utf8')),identity=editionDefinitions[edition];
const dataBase=process.env.JUDGE_DATA_DIR?path.resolve(process.env.JUDGE_DATA_DIR):app.getPath('appData');
const dataRoot=editionDataRoot(dataBase,edition);
mkdirSync(path.join(dataRoot,'session'),{recursive:true,mode:0o700});
app.setName(identity.name);app.setPath('userData',dataRoot);app.setPath('sessionData',path.join(dataRoot,'session'));
const appInfo:AppInfo={edition,name:identity.name,label:identity.label,version:app.getVersion(),appId:identity.appId,dataDirectory:dataRoot,migratedLegacy:false};
const expected=process.argv.find(a=>a.startsWith('--expect-edition=')||a.startsWith('--theme='))?.split('=')[1];
const editionMismatch=Boolean(expected&&expected!==edition);
const primary=editionMismatch?false:app.requestSingleInstanceLock({edition});
if(!primary&&!editionMismatch)app.quit();
let pet:BrowserWindow|null=null;
let panel:BrowserWindow|null=null;
let store:Store;
let messages:MessagePipeline;
let credentials:Credentials;
let assetRoot:string;
let interactions:InteractionService;
let notifications:NotificationService;
let petExpanded=false;
let initialized=false;
const devURL=process.env.VITE_DEV_SERVER_URL;
function load(window:BrowserWindow,view:string){
 if(devURL)void window.loadURL(`${devURL}/?view=${view}`);
 else void window.loadFile(path.join(__dirname,'../../dist/index.html'),{query:{view}});
 window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 window.webContents.on('will-navigate',(event,url)=>{if(url!==window.webContents.getURL())event.preventDefault();});
}
function options(){return {preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true};}
function openPanel(){
 if(panel&&!panel.isDestroyed()){panel.show();panel.focus();return;}
 panel=new BrowserWindow({width:1020,height:820,minWidth:800,minHeight:640,title:identity.name+' · 控制台',backgroundColor:edition==='palace'?'#fff6e2':'#d3f0fc',webPreferences:options()});
 load(panel,'panel');panel.on('closed',()=>{panel=null;});
}
function broadcast(state:State){for(const w of BrowserWindow.getAllWindows())w.webContents.send('state:changed',state);}
function resizePet(expanded:boolean){
 petExpanded=expanded;
 if(!pet||pet.isDestroyed())return;
 const previous=pet.getBounds(),area=screen.getDisplayMatching(previous).workArea;
 pet.setBounds(resizedPetBounds(previous,area,store.get().pet.scale,expanded));
}
function deliver(message:Message){
 if(!pet||pet.isDestroyed())return;
 resizePet(true);
 const effect=messageEffects(message);
 if(effect.entry==='slide'){
  const area=screen.getDisplayMatching(pet.getBounds()).workArea;
  const bounds=pet.getBounds();
  pet.setPosition(Math.max(area.x,area.x+area.width-bounds.width),Math.max(area.y,Math.min(bounds.y,area.y+area.height-bounds.height)));
 }
 pet.show();pet.webContents.send('message:new',message);
}
if(editionMismatch)app.whenReady().then(()=>{dialog.showErrorBox('请使用对应的独立版',`当前目录是${identity.name}，请下载并打开另一版的独立文件夹。两版不能切换。`);app.exit(1);});
if(primary)app.whenReady().then(async()=>{
 if(process.platform==='darwin'&&app.dock){app.dock.setBadge(edition==='palace'?'宫':'海');app.dock.setIcon(nativeImage.createFromPath(path.join(__dirname,'../../dist/characters',edition==='palace'?'palace_zhenhuan.png':'npc.png')));}
 if(edition==='ocean')appInfo.migratedLegacy=await migrateLegacyOcean(dataRoot,[path.join(dataBase,'workplace-little-judge'),path.join(dataBase,'职场小判官')]);
 store=new Store(path.join(dataRoot,'judge-state.json'),editionDefaults(edition),s=>normalizeEditionState(s,edition));await store.load();
 assetRoot=path.join(app.getPath('userData'),'assets');
 credentials=new Credentials(path.join(app.getPath('userData'),'ai-key.enc'));
 messages=new MessagePipeline(store,()=>credentials.get());
 interactions=new InteractionService(store);
 const notificationBinary=app.isPackaged?path.join(process.resourcesPath,'notification-tools','NotificationCapture-'+process.arch):path.join(__dirname,'../../native/bin','NotificationCapture-'+process.arch);
 const notificationAdapter=await createNotificationAdapter(notificationBinary,!app.isPackaged?process.env.JUDGE_NOTIFICATION_FIXTURE:undefined);
 notifications=new NotificationService(store,messages,notificationAdapter,status=>{for(const window of BrowserWindow.getAllWindows())window.webContents.send('notifications:changed',status)},message=>{broadcast(store.get());deliver(message)});
 const area=screen.getPrimaryDisplay().workArea;
 const size=petWindowSize(store.get().pet.scale,false);
 pet=new BrowserWindow({...size,x:Math.max(area.x,area.x+area.width-size.width-20),y:Math.max(area.y,area.y+area.height-size.height-20),transparent:true,frame:false,alwaysOnTop:true,resizable:false,hasShadow:false,skipTaskbar:true,webPreferences:options()});
 pet.setAlwaysOnTop(store.get().pet.alwaysOnTop,'floating');pet.setVisibleOnAllWorkspaces(true,{visibleOnFullScreen:true});load(pet,'pet');
 pet.on('closed',()=>{pet=null;app.quit();});
 Menu.setApplicationMenu(Menu.buildFromTemplate([{label:identity.name,submenu:[{label:'打开控制台',click:openPanel},{label:'显示桌宠',click:()=>pet?.show()},{label:'隐藏桌宠',click:()=>{openPanel();pet?.hide()}},{label:'退出'+identity.name,click:()=>app.quit()}]},{label:'编辑',submenu:[{label:'撤销',role:'undo'},{label:'重做',role:'redo'},{type:'separator'},{label:'剪切',role:'cut'},{label:'复制',role:'copy'},{label:'粘贴',role:'paste'},{label:'全选',role:'selectAll'}]}]));
 ipcMain.handle('app:info',()=>appInfo);
 ipcMain.handle('state:get',()=>store.get());
 const requirePanel=(event:Electron.IpcMainInvokeEvent)=>{if(event.sender.id!==panel?.webContents.id)throw new Error('请通过控制台操作通知识别。');};
 ipcMain.handle('notifications:status',()=>notifications.get());
 ipcMain.handle('notifications:save',async(event,input)=>{requirePanel(event);notifications.stop();const settings=notificationSettingsSchema.parse(input);const state=await store.update(s=>({...s,notifications:settings}));broadcast(state);return state;});
 ipcMain.handle('notifications:once',(event,delay)=>{requirePanel(event);return notifications.once(z.number().int().min(0).max(10).default(0).parse(delay));});
 ipcMain.handle('notifications:start',(event)=>{requirePanel(event);return notifications.start();});
 ipcMain.handle('notifications:stop',(event)=>{requirePanel(event);return notifications.stop();});
 ipcMain.handle('notifications:confirm',(event,input)=>{requirePanel(event);return notifications.confirm(z.object({draftId:z.string().uuid(),contactId:z.string().min(1).max(100),text:z.string().trim().min(1).max(5000)}).parse(input));});
 ipcMain.handle('notifications:dismiss',(event,id)=>{requirePanel(event);return notifications.dismiss(z.string().uuid().parse(id));});
 ipcMain.handle('notifications:clear',(event)=>{requirePanel(event);return notifications.clear();});
 ipcMain.handle('clipboard:copy',(_,text)=>{clipboard.writeText(z.string().trim().min(1).max(5000).parse(text));});
 ipcMain.handle('settings:save',async(_,input)=>{
  const settings=z.object({contacts:z.array(contactSchema).max(100),pet:stateSchema.shape.pet,ai:stateSchema.shape.ai.optional()}).parse(input);
  assertEditionSettings(settings,edition);
  if(new Set(settings.contacts.map(c=>c.id)).size!==settings.contacts.length)throw new Error('联系人标识重复');
  const state=await store.update(s=>({...s,contacts:settings.contacts,pet:settings.pet,ai:settings.ai??s.ai}));pet?.setAlwaysOnTop(state.pet.alwaysOnTop,'floating');resizePet(petExpanded);broadcast(state);return state;
 });
 ipcMain.handle('message:send',async(_,input)=>{
  const data=z.object({contactId:z.string(),text:z.string()}).parse(input);
  const message=await messages.receive({source:'mock',senderId:data.contactId,text:data.text});
  broadcast(store.get());deliver(message);return message;
 });
 ipcMain.handle('message:reply',async(_,input)=>{
  const data=z.object({messageId:z.string(),text:z.string().trim().min(1).max(2000)}).parse(input);
  let updated:Message|undefined;
  const state=await store.update(s=>({...s,history:s.history.map(m=>{
   if(m.id!==data.messageId)return m;
   if((m.replies?.length??0)>=50)throw new Error('每条消息最多保存 50 条模拟回复');
   updated={...m,replies:[...(m.replies??[]),{id:randomUUID(),text:data.text,createdAt:new Date().toISOString()}]};return updated;
  })}));
  if(!updated)throw new Error('消息不存在；预览消息不能回复');
  broadcast(state);return updated;
 });
 ipcMain.handle('message:restore',(_,id)=>{const message=store.get().history.find(m=>m.id===id);if(!message)throw new Error('历史消息不存在');deliver(message);return message;});
 ipcMain.handle('effect:preview',(_,input)=>{assertEditionContact(contactSchema.parse(input),edition);const message=messages.preview(input);deliver(message);return message;});
 ipcMain.handle('interaction:record',async(_,input)=>{const row=await interactions.record(input);broadcast(store.get());return row;});
 ipcMain.handle('interaction:clear',async()=>{const state=await interactions.clear();broadcast(state);return state;});
 ipcMain.handle('pet:expanded',(event,input)=>{if(event.sender.id!==pet?.webContents.id)throw new Error('仅桌宠窗口可调整显示尺寸');resizePet(z.boolean().parse(input));});
 const clearDisplayed=()=>{resizePet(false);for(const w of BrowserWindow.getAllWindows())w.webContents.send('message:clear');};
 ipcMain.handle('message:clear',clearDisplayed);
 ipcMain.handle('history:clear',async()=>{notifications.clear();const state=await messages.clearHistory();broadcast(state);clearDisplayed();return state;});
 ipcMain.handle('asset:import',async()=>{
  if(store.get().assets.length>=100)throw new Error('素材库最多保存 100 组素材');
  const result=await dialog.showOpenDialog(panel??pet!,{title:'上传人物图片 / GIF / 序列帧',properties:['openFile','multiSelections'],filters:[{name:'人物素材',extensions:['png','jpg','jpeg','webp','gif']}]});
  if(result.canceled)return null;
  const asset=await importFiles(result.filePaths,assetRoot,file=>path.extname(file).toLowerCase()==='.gif'?/^GIF8[79]a$/.test(readFileSync(file).subarray(0,6).toString('ascii')):!nativeImage.createFromPath(file).isEmpty());
  const state=await store.update(s=>({...s,assets:[...s.assets,asset]}));broadcast(state);return asset;
 });
 ipcMain.handle('asset:frames',(_,id)=>{const asset=store.get().assets.find(a=>a.id===id);if(!asset)throw new Error('素材不存在');return readFrames(asset,assetRoot);});
 ipcMain.handle('ai:key-save',(_,input)=>credentials.save(z.string().trim().max(1000).parse(input)));
 ipcMain.handle('ai:key-status',()=>credentials.has());
 ipcMain.handle('pet:hide',()=>{openPanel();pet?.hide();});ipcMain.handle('pet:show',()=>pet?.show());
 ipcMain.handle('panel:open',openPanel);ipcMain.handle('app:quit',()=>app.quit());
 initialized=true;openPanel();
});
app.on('second-instance',()=>{if(initialized&&app.isReady()){openPanel();pet?.show();}});
app.on('activate',()=>{if(primary&&initialized&&app.isReady())openPanel();});
app.on('window-all-closed',()=>app.quit());
app.on('before-quit',()=>notifications?.stop());
