import {app,BrowserWindow,ipcMain,Menu,screen,dialog,nativeImage} from 'electron';
import path from 'node:path';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {contactSchema,stateSchema,type State,type Message} from '../src/lib/model';
import {messageEffects} from '../src/lib/effects';
import {MessagePipeline} from './messages';
import {Store} from './store';
import {importFiles,readFrames} from './assets';
import {Credentials} from './credentials';
import {InteractionService} from './interactions';
import {petWindowSize,resizedPetBounds} from '../src/lib/pet-layout';
import {themePet} from '../src/lib/palace';
if(process.env.JUDGE_DATA_DIR)app.setPath('userData',path.resolve(process.env.JUDGE_DATA_DIR));
let pet:BrowserWindow|null=null;
let panel:BrowserWindow|null=null;
let store:Store;
let messages:MessagePipeline;
let credentials:Credentials;
let assetRoot:string;
let interactions:InteractionService;
let petExpanded=false;
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
 panel=new BrowserWindow({width:1020,height:820,minWidth:800,minHeight:640,title:'职场小判官 · 控制台',backgroundColor:'#d3f0fc',webPreferences:options()});
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
app.whenReady().then(async()=>{
 store=new Store(path.join(app.getPath('userData'),'judge-state.json'));await store.load();
 if(process.argv.includes('--theme=palace')&&store.get().pet.theme!=='palace')await store.update(s=>({...s,pet:themePet(s.pet,'palace')}));
 assetRoot=path.join(app.getPath('userData'),'assets');
 credentials=new Credentials(path.join(app.getPath('userData'),'ai-key.enc'));
 messages=new MessagePipeline(store,()=>credentials.get());
 interactions=new InteractionService(store);
 const area=screen.getPrimaryDisplay().workArea;
 const size=petWindowSize(store.get().pet.scale,false);
 pet=new BrowserWindow({...size,x:Math.max(area.x,area.x+area.width-size.width-20),y:Math.max(area.y,area.y+area.height-size.height-20),transparent:true,frame:false,alwaysOnTop:true,resizable:false,hasShadow:false,skipTaskbar:true,webPreferences:options()});
 pet.setAlwaysOnTop(store.get().pet.alwaysOnTop,'floating');pet.setVisibleOnAllWorkspaces(true,{visibleOnFullScreen:true});load(pet,'pet');
 pet.on('closed',()=>{pet=null;app.quit();});
 Menu.setApplicationMenu(Menu.buildFromTemplate([{label:'职场小判官',submenu:[{label:'打开控制台',click:openPanel},{label:'显示桌宠',click:()=>pet?.show()},{label:'隐藏桌宠',click:()=>{openPanel();pet?.hide()}},{label:'退出职场小判官',click:()=>app.quit()}]},{label:'编辑',submenu:[{label:'撤销',role:'undo'},{label:'重做',role:'redo'},{type:'separator'},{label:'剪切',role:'cut'},{label:'复制',role:'copy'},{label:'粘贴',role:'paste'},{label:'全选',role:'selectAll'}]}]));
 ipcMain.handle('state:get',()=>store.get());
 ipcMain.handle('settings:save',async(_,input)=>{
  const settings=z.object({contacts:z.array(contactSchema).max(100),pet:stateSchema.shape.pet,ai:stateSchema.shape.ai.optional()}).parse(input);
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
 ipcMain.handle('effect:preview',(_,input)=>{const message=messages.preview(input);deliver(message);return message;});
 ipcMain.handle('interaction:record',async(_,input)=>{const row=await interactions.record(input);broadcast(store.get());return row;});
 ipcMain.handle('interaction:clear',async()=>{const state=await interactions.clear();broadcast(state);return state;});
 ipcMain.handle('pet:expanded',(event,input)=>{if(event.sender.id!==pet?.webContents.id)throw new Error('仅桌宠窗口可调整显示尺寸');resizePet(z.boolean().parse(input));});
 const clearDisplayed=()=>{resizePet(false);for(const w of BrowserWindow.getAllWindows())w.webContents.send('message:clear');};
 ipcMain.handle('message:clear',clearDisplayed);
 ipcMain.handle('history:clear',async()=>{const state=await messages.clearHistory();broadcast(state);clearDisplayed();return state;});
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
 openPanel();
});
app.on('activate',()=>{if(app.isReady())openPanel();});
app.on('window-all-closed',()=>app.quit());
