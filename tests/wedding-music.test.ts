import {it,expect,afterEach} from 'vitest';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {Store} from '../electron/store';
import {WeddingMusicService} from '../electron/music';
import {defaultState} from '../src/lib/model';
const dirs:string[]=[];
afterEach(async()=>{await Promise.all(dirs.splice(0).map(dir=>rm(dir,{recursive:true,force:true})))});
it('音乐复制、播放读取、替换和清除只作用于本版，保留原文件及另一版音乐',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'judge-music-'));dirs.push(root);
 const bytes=Buffer.alloc(100);bytes.write('RIFF');bytes.write('WAVE',8);const file=path.join(root,'原创.wav');await writeFile(file,bytes);
 const ocean=new Store(path.join(root,'ocean','state.json')),palace=new Store(path.join(root,'palace','state.json'));
 const a=new WeddingMusicService(ocean,path.join(root,'ocean','audio')),b=new WeddingMusicService(palace,path.join(root,'palace','audio'));
 await a.import(file);await b.import(file);expect(ocean.get().weddingMusic?.id).not.toBe(palace.get().weddingMusic?.id);expect(await a.read()).toBe('data:audio/wav;base64,'+bytes.toString('base64'));const old=ocean.get().weddingMusic!;
 await a.import(file);await expect(readFile(path.join(root,'ocean','audio',old.id+'.wav'))).rejects.toThrow();await a.clear();expect(await a.read()).toBeNull();expect(await b.read()).not.toBeNull();expect(await readFile(file)).toEqual(bytes);
 await writeFile(file,'not audio');await expect(a.import(file)).rejects.toThrow('格式');expect(ocean.get().weddingMusic).toBeNull();
});
it('旧统计自动补充新互动，升级启用自动进场一次，随后尊重人工模式',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'judge-upgrade-'));dirs.push(root);const file=path.join(root,'state.json');
 const old={...structuredClone(defaultState),notifications:{autoDeliver:false},interactions:[{day:'2026-10-14',contactId:'boss',contactName:'王经理',counts:{elbow:5,slap:2,burn:1,heart:3}}]};await writeFile(file,JSON.stringify(old));const a=new Store(file);await a.load();expect(a.get().interactions[0].counts).toEqual({elbow:5,slap:2,burn:1,heart:3,marry:0,kick:0});expect(a.get().notifications.autoDeliver).toBe(true);
 await a.update(s=>({...s,notifications:{...s.notifications,autoDeliver:false}}));const b=new Store(file);await b.load();expect(b.get().notifications.autoDeliver).toBe(false);
});
