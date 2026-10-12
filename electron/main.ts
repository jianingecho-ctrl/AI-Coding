import {app,BrowserWindow,ipcMain,Menu,screen} from 'electron';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {contactSchema,stateSchema,type State} from '../src/lib/model';
import {extractSummary} from './ai';
import {Store} from './store';
if(process.env.JUDGE_DATA_DIR)app.setPath('userData',path.resolve(process.env.JUDGE_DATA_DIR));
let pet:BrowserWindow|null=null;
let panel:BrowserWindow|null=null;
let store:Store;
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
 panel=new BrowserWindow({width:1020,height:820,minWidth:800,minHeight:640,title:'职场小判官 · 控制台',backgroundColor:'#f4f7f4',webPreferences:options()});
 load(panel,'panel');panel.on('closed',()=>{panel=null;});
}
function broadcast(state:State){for(const w of BrowserWindow.getAllWindows())w.webContents.send('state:changed',state);}
app.whenReady().then(async()=>{
 store=new Store(path.join(app.getPath('userData'),'judge-state.json'));await store.load();
 const area=screen.getPrimaryDisplay().workArea;
 pet=new BrowserWindow({width:460,height:660,x:Math.max(area.x,area.x+area.width-480),y:Math.max(area.y,area.y+area.height-680),transparent:true,frame:false,alwaysOnTop:true,resizable:false,hasShadow:false,skipTaskbar:true,webPreferences:options()});
 pet.setAlwaysOnTop(true,'floating');pet.setVisibleOnAllWorkspaces(true,{visibleOnFullScreen:true});load(pet,'pet');
 pet.on('closed',()=>{pet=null;app.quit();});
 Menu.setApplicationMenu(Menu.buildFromTemplate([{label:'职场小判官',submenu:[{label:'打开控制台',click:openPanel},{label:'退出职场小判官',click:()=>app.quit()}]},{label:'编辑',submenu:[{label:'撤销',role:'undo'},{label:'重做',role:'redo'},{type:'separator'},{label:'剪切',role:'cut'},{label:'复制',role:'copy'},{label:'粘贴',role:'paste'},{label:'全选',role:'selectAll'}]}]));
 ipcMain.handle('state:get',()=>store.get());
 ipcMain.handle('settings:save',async(_,input)=>{
  const settings=z.object({contacts:z.array(contactSchema).max(100),pet:stateSchema.shape.pet,ai:stateSchema.shape.ai.optional()}).parse(input);
  if(new Set(settings.contacts.map(c=>c.id)).size!==settings.contacts.length)throw new Error('联系人标识重复');
  const state=await store.update(s=>({...s,contacts:settings.contacts,pet:settings.pet,ai:settings.ai??s.ai}));broadcast(state);return state;
 });
 ipcMain.handle('message:send',async(_,input)=>{
  const data=z.object({contactId:z.string(),text:z.string().trim().min(1).max(5000)}).parse(input);
  const contact=store.get().contacts.find(c=>c.id===data.contactId);if(!contact)throw new Error('联系人不存在');
  const message={id:randomUUID(),contact,text:data.text,createdAt:new Date().toISOString(),summary:await extractSummary(data.text,store.get().ai)};
  const state=await store.update(s=>({...s,history:[message,...s.history].slice(0,200)}));broadcast(state);
  if(pet&&!pet.isDestroyed()){
   if(contact.category==='讨厌的人'){
    const area=screen.getDisplayMatching(pet.getBounds()).workArea;
    pet.setPosition(Math.max(area.x,area.x+area.width-460),Math.max(area.y,Math.min(pet.getBounds().y,area.y+area.height-660)));
   }
   pet.show();pet.webContents.send('message:new',message);
  }return message;
 });
 ipcMain.handle('history:clear',async()=>{const state=await store.update(s=>({...s,history:[]}));broadcast(state);return state;});
 ipcMain.handle('panel:open',openPanel);ipcMain.handle('app:quit',()=>app.quit());
 openPanel();
});
app.on('activate',()=>{if(app.isReady())openPanel();});
app.on('window-all-closed',()=>app.quit());
