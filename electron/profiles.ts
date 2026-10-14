import {promises as fs} from 'node:fs';
import path from 'node:path';
import {z} from 'zod';
import type {Theme} from '../src/lib/model';
import {stateSchema} from '../src/lib/model';
import {editionDefaults,normalizeEditionState} from '../src/lib/editions';
import {editionDataRoot,migrateLegacyOcean} from './editions';
import {Store} from './store';
export const unifiedIdentity={name:'职场小判官',label:'双主题版',appId:'cn.workplace.littlejudge.unified',dataDirectory:'workplace-little-judge-unified'};
export class ProfileRepository{
 private profiles=new Map<Theme,Promise<{store:Store;migrated:boolean}>>();
 constructor(private base:string,readonly root=path.join(base,unifiedIdentity.dataDirectory)){}
 directory(theme:Theme){return path.join(this.root,'profiles',theme);}
 async load(theme:Theme){
  const existing=this.profiles.get(theme);if(existing)return existing;
  const pending=this.loadProfile(theme);this.profiles.set(theme,pending);
  try{return await pending;}catch(e){this.profiles.delete(theme);throw e;}
 }
 private async loadProfile(theme:Theme){
  const directory=this.directory(theme),file=path.join(directory,'judge-state.json');let migrated=false;
  try{await fs.access(file)}catch{
   const legacy=editionDataRoot(this.base,theme);let saved;
   try{const raw=JSON.parse(await fs.readFile(path.join(legacy,'judge-state.json'),'utf8'));if(raw.notifications&&raw.notifications.deliveryModeVersion!==2)raw.notifications={...raw.notifications,autoDeliver:true,deliveryModeVersion:2};saved=stateSchema.parse(raw)}catch{}
   if(saved){
    saved=normalizeEditionState(saved,theme);saved.ai.enabled=false;
    await fs.mkdir(directory,{recursive:true,mode:0o700});
    for(const folder of ['assets','audio'])try{await fs.cp(path.join(legacy,folder),path.join(directory,folder),{recursive:true})}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
    await fs.writeFile(file+'.migration',JSON.stringify(saved,null,2),{mode:0o600});await fs.rename(file+'.migration',file);migrated=true;
   }else if(theme==='ocean')migrated=await migrateLegacyOcean(directory,[path.join(this.base,'workplace-little-judge'),path.join(this.base,'职场小判官')]);
  }
  const store=new Store(file,editionDefaults(theme),state=>normalizeEditionState(state,theme));await store.load();return {store,migrated};
 }
 async remember(theme:Theme){
  z.enum(['ocean','palace']).parse(theme);await fs.mkdir(this.root,{recursive:true,mode:0o700});
  const file=path.join(this.root,'active-profile.json');await fs.writeFile(file+'.tmp',JSON.stringify({theme}),{mode:0o600});await fs.rename(file+'.tmp',file);
 }
}
