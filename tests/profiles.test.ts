import {it,expect,afterEach} from 'vitest';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {ProfileRepository} from '../electron/profiles';
import {editionDefaults} from '../src/lib/editions';
import {editionDataRoot} from '../electron/editions';
import {MessagePipeline} from '../electron/messages';
const dirs:string[]=[];
afterEach(async()=>{await Promise.all(dirs.splice(0).map(dir=>rm(dir,{recursive:true,force:true})))});
it('首次分别复制独立版档案、人物素材和音乐，原目录保持不变，之后不重复覆盖',async()=>{
 const base=await mkdtemp(path.join(tmpdir(),'judge-profiles-'));dirs.push(base);
 for(const theme of ['ocean','palace'] as const){const legacy=editionDataRoot(base,theme);await mkdir(path.join(legacy,'assets'),{recursive:true});await mkdir(path.join(legacy,'audio'));
  const state=editionDefaults(theme);state.contacts[0].name=theme+'专属';state.ai.enabled=true;if(theme==='ocean'){state.notifications.autoDeliver=false;(state.notifications as unknown as Record<string,unknown>).deliveryModeVersion=undefined;}await writeFile(path.join(legacy,'judge-state.json'),JSON.stringify(state));await writeFile(path.join(legacy,'assets','asset.txt'),theme);await writeFile(path.join(legacy,'audio','music.txt'),theme);await writeFile(path.join(legacy,'ai-key.enc'),'not copied');
 }
 const repository=new ProfileRepository(base),ocean=await repository.load('ocean'),palace=await repository.load('palace');expect(ocean.migrated).toBe(true);expect(palace.migrated).toBe(true);expect(ocean.store.get().contacts[0].name).toBe('ocean专属');expect(palace.store.get().contacts[0].name).toBe('palace专属');expect(ocean.store.get().ai.enabled).toBe(false);expect(ocean.store.get().notifications.autoDeliver).toBe(true);expect(JSON.parse(await readFile(path.join(editionDataRoot(base,'ocean'),'judge-state.json'),'utf8')).ai.enabled).toBe(true);
 for(const theme of ['ocean','palace'] as const){expect(await readFile(path.join(repository.directory(theme),'assets','asset.txt'),'utf8')).toBe(theme);expect(await readFile(path.join(repository.directory(theme),'audio','music.txt'),'utf8')).toBe(theme);await expect(readFile(path.join(repository.directory(theme),'ai-key.enc'))).rejects.toThrow();}
 await ocean.store.update(s=>({...s,pet:{...s.pet,name:'保存后的名字'}}));await new MessagePipeline(palace.store,async()=>'').receive({source:'mock',senderId:'boss',text:'只属于甄嬛传的消息'});expect(ocean.store.get().history).toEqual([]);
 const after=new ProfileRepository(base);expect((await after.load('ocean')).store.get().pet.name).toBe('保存后的名字');expect((await after.load('palace')).store.get().history[0].text).toBe('只属于甄嬛传的消息');expect((await after.load('ocean')).migrated).toBe(false);await repository.remember('palace');expect(JSON.parse(await readFile(path.join(repository.root,'active-profile.json'),'utf8')).theme).toBe('palace');
});
it('反复取回同一档案时复用同一存储，让异步操作保留在原档案，不改变另一套人物',async()=>{
 const base=await mkdtemp(path.join(tmpdir(),'judge-profile-cache-'));dirs.push(base);const repository=new ProfileRepository(base),a=await repository.load('ocean'),b=await repository.load('palace');expect((await repository.load('ocean')).store).toBe(a.store);
 await a.store.update(s=>({...s,contacts:[...s.contacts,{id:'a-only',name:'只在比奇堡',category:'NPC同事'}]}));expect(b.store.get().contacts.some(c=>c.id==='a-only')).toBe(false);expect(a.store.get().pet.character).toBe('npc');expect(b.store.get().pet.character).toBe('palace_zhenhuan');
});
