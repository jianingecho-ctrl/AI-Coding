import {afterEach,describe,it,expect} from 'vitest';
import {mkdtemp,readFile,writeFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {Store} from '../electron/store';
import {defaultState} from '../src/lib/model';
const directories:string[]=[];
async function directory(){const p=await mkdtemp(path.join(tmpdir(),'judge-test-'));directories.push(p);return p;}
afterEach(async()=>{await Promise.all(directories.splice(0).map(p=>rm(p,{recursive:true,force:true})));});
describe('本地持久化',()=>{
 it('首次启动读取默认配置，修改后重新启动可恢复',async()=>{const file=path.join(await directory(),'state.json');const s=new Store(file);expect(await s.load()).toEqual(defaultState);await s.update(v=>({...v,pet:{...v.pet,name:'摸鱼法官'}}));const next=new Store(file);expect((await next.load()).pet.name).toBe('摸鱼法官');expect(JSON.parse(await readFile(file,'utf8')).pet.name).toBe('摸鱼法官');});
 it('串行写入避免同时更新丢失',async()=>{const s=new Store(path.join(await directory(),'state.json'));await s.load();await Promise.all([s.update(v=>({...v,contacts:[...v.contacts,{id:'1',name:'甲',category:'领导'}]})),s.update(v=>({...v,contacts:[...v.contacts,{id:'2',name:'乙',category:'普通同事'}]}))]);expect(s.get().contacts).toHaveLength(6);});
 it('损坏配置备份，默认配置仍可使用',async()=>{const p=await directory();await writeFile(path.join(p,'state.json'),'损坏内容');const s=new Store(path.join(p,'state.json'));expect(await s.load()).toEqual(defaultState);expect((await readdir(p)).some(n=>n.includes('.invalid-'))).toBe(true);});
 it('非法更新不会破坏已有状态',async()=>{const s=new Store(path.join(await directory(),'state.json'));await s.load();await expect(s.update(v=>({...v,pet:{...v.pet,name:''}}))).rejects.toThrow();expect(s.get().pet.name).toBe('小判官');await s.update(v=>({...v,pet:{...v.pet,name:'恢复'}}));expect(s.get().pet.name).toBe('恢复');});
});
