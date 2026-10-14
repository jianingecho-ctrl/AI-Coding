import {afterEach,it,expect} from 'vitest';
import {mkdtemp,writeFile,readFile,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {defaultState,personalEffectSchema,type Contact} from '../src/lib/model';
import {editionDefaults,editionCharacters,editionDefinitions,assertEditionSettings,assertEditionContact,normalizeEditionState} from '../src/lib/editions';
import {editionDataRoot,parseEdition,migrateLegacyOcean} from '../electron/editions';
import {Store} from '../electron/store';
import {MessagePipeline} from '../electron/messages';
import {InteractionService} from '../electron/interactions';
import {resolveEffects} from '../src/lib/effects';
import {summarize} from '../src/lib/summary';
const directories:string[]=[];
async function directory(){const p=await mkdtemp(path.join(tmpdir(),'judge-edition-'));directories.push(p);return p;}
afterEach(async()=>{await Promise.all(directories.splice(0).map(p=>rm(p,{recursive:true,force:true})));});
it('两版拥有不同应用 ID、名称、包名、数据目录与初始人物',()=>{
 const a=editionDefinitions.ocean,b=editionDefinitions.palace;for(const key of ['name','appId','packageName','dataDirectory'] as const)expect(a[key]).not.toBe(b[key]);expect(editionDefaults('palace').pet.character).toBe('palace_zhenhuan');expect(editionDefaults('palace').contacts[0].name).toBe('皇上');expect(editionDefaults('ocean')).toEqual(defaultState);expect(editionCharacters('ocean').some(id=>id.startsWith('palace_'))).toBe(false);expect(editionCharacters('palace').every(id=>id.startsWith('palace_'))).toBe(true);
});
it('人物、预览、待机及主题不能跨独立版配置',()=>{
 const contact:Contact={id:'a',name:'甲',category:'NPC同事',effects:personalEffectSchema.parse({character:'palace_huafei'})};expect(()=>assertEditionContact(contact,'ocean')).toThrow();expect(()=>assertEditionContact({...contact,effects:personalEffectSchema.parse({character:'npc'})},'palace')).toThrow();expect(()=>assertEditionSettings({...defaultState,pet:{...defaultState.pet,theme:'palace'}},'ocean')).toThrow();expect(()=>assertEditionSettings({...editionDefaults('palace'),pet:{...editionDefaults('palace').pet,character:'camel'}},'palace')).toThrow();
});
it('同一数据根下发送、计数和清除消息只影响本版，重启各自恢复',async()=>{
 const base=await directory(),oceanFile=path.join(editionDataRoot(base,'ocean'),'judge-state.json'),palaceFile=path.join(editionDataRoot(base,'palace'),'judge-state.json');const ocean=new Store(oceanFile,editionDefaults('ocean')),palace=new Store(palaceFile,editionDefaults('palace'));await ocean.load();await palace.load();
 const a=new MessagePipeline(ocean,async()=>''),b=new MessagePipeline(palace,async()=>''),message=await a.receive({source:'mock',senderId:'boss',text:'海洋测试'});await new InteractionService(ocean).record({messageId:message.id,kind:'slap'});await b.receive({source:'mock',senderId:'boss',text:'宫廷测试'});await a.clearHistory();expect(ocean.get().history).toEqual([]);expect(palace.get().history[0].text).toBe('宫廷测试');expect(palace.get().interactions).toEqual([]);expect((await new Store(oceanFile).load()).interactions[0].counts.slap).toBe(1);expect((await new Store(palaceFile).load()).history[0].effect?.character).toBe('palace_emperor');
});
it('旧外版人物恢复为本版默认，原始正文、回复和统计不丢失',()=>{
 const state=editionDefaults('ocean');state.pet.theme='palace';state.pet.character='palace_zhenhuan';state.contacts[0].effects=personalEffectSchema.parse({character:'palace_huafei',cardSkin:'palace'});
 state.history=[{id:'old-message',contact:structuredClone(state.contacts[0]),text:'保留这条旧消息',createdAt:'2026-10-14T01:00:00Z',summary:summarize('保留这条旧消息'),effect:resolveEffects(state.contacts[0],state.pet),replies:[{id:'r',text:'旧模拟回复',createdAt:'2026-10-14T01:01:00Z'}]}];
 state.interactions=[{day:'2026-10-14',contactId:'boss',contactName:'王经理',counts:{elbow:3,slap:2,burn:1,heart:0,marry:0,kick:0}}];
 const normalized=normalizeEditionState(state,'ocean');expect(normalized.pet.theme).toBe('ocean');expect(normalized.pet.character).toBe('npc');expect(normalized.contacts[0].effects?.character).toBe('auto');expect(normalized.history[0].effect).toMatchObject({character:'leader',cardSkin:'note',theme:'ocean'});expect(normalized.history[0].text).toBe(state.history[0].text);expect(normalized.history[0].replies).toEqual(state.history[0].replies);expect(normalized.interactions).toEqual(state.interactions);expect(state.pet.theme).toBe('palace');expect(state.history[0].effect?.character).toBe('palace_huafei');
});
it('旧海洋配置及素材只复制一次，不改原文件，也不复制密钥或启用外部 AI',async()=>{
 const base=await directory(),legacy=path.join(base,'workplace-little-judge'),destination=editionDataRoot(base,'ocean');await mkdir(path.join(legacy,'assets','example'),{recursive:true});const state=editionDefaults('ocean');state.pet.name='旧海洋判官';state.ai.enabled=true;const raw=JSON.stringify(state);await writeFile(path.join(legacy,'judge-state.json'),raw);await writeFile(path.join(legacy,'assets','example','000.png'),'local-fixture');await writeFile(path.join(legacy,'ai-key.enc'),'test-fixture-not-a-key');expect(await migrateLegacyOcean(destination,[legacy])).toBe(true);expect(JSON.parse(await readFile(path.join(destination,'judge-state.json'),'utf8')).ai.enabled).toBe(false);expect(await readFile(path.join(destination,'assets','example','000.png'),'utf8')).toBe('local-fixture');await expect(readFile(path.join(destination,'ai-key.enc'))).rejects.toThrow();expect(await readFile(path.join(legacy,'judge-state.json'),'utf8')).toBe(raw);expect(await migrateLegacyOcean(destination,[legacy])).toBe(false);
});
it('旧共享宫廷配置和损坏 JSON 不会被自动导入海洋版',async()=>{const base=await directory(),legacy=path.join(base,'old');await mkdir(legacy);await writeFile(path.join(legacy,'judge-state.json'),JSON.stringify(editionDefaults('palace')));expect(await migrateLegacyOcean(editionDataRoot(base,'ocean'),[legacy])).toBe(false);await writeFile(path.join(legacy,'judge-state.json'),'bad');expect(await migrateLegacyOcean(editionDataRoot(base,'ocean'),[legacy])).toBe(false);expect(parseEdition('{"id":"palace"}')).toBe('palace');expect(()=>parseEdition('{"id":"other"}')).toThrow();});
