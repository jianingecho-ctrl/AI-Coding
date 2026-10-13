import {afterEach,it,expect,vi} from 'vitest';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {Store} from '../electron/store';
import {MessagePipeline} from '../electron/messages';
import {summarize} from '../src/lib/summary';
import {defaultState,type Summary} from '../src/lib/model';
import {extractSummary} from '../electron/ai';
const directories:string[]=[];
async function setup(){const dir=await mkdtemp(path.join(tmpdir(),'judge-message-pipeline-'));directories.push(dir);const store=new Store(path.join(dir,'state.json'));await store.load();return store;}
afterEach(async()=>{await Promise.all(directories.splice(0).map(d=>rm(d,{recursive:true,force:true})))});
it('统一模拟入口按联系人标识匹配，分析并保存接收时的效果',async()=>{const store=await setup();const analyze=vi.fn<typeof extractSummary>(async text=>summarize(text)),key=vi.fn(async()=> 'test-key');const pipeline=new MessagePipeline(store,key,analyze);const m=await pipeline.receive({source:'mock',senderId:'bigSilly',text:'  请明天提交日报  '});expect(m.source).toBe('mock');expect(m.text).toBe('请明天提交日报');expect(m.contact.id).toBe('bigSilly');expect(m.effect?.character).toBe('bigSilly');expect(m.effect?.entry).toBe('slide');expect(store.get().history[0].id).toBe(m.id);expect(key).not.toHaveBeenCalled();});
it('预览与演示始终用规则，不写入历史也不获取密钥',async()=>{const store=await setup();await store.update(s=>({...s,ai:{...s.ai,enabled:true,provider:'openai-compatible'}}));const analyze=vi.fn(),key=vi.fn();const pipeline=new MessagePipeline(store,key,analyze);const m=pipeline.preview({...defaultState.contacts[0],id:'demo-leader'});expect(m.preview).toBe(true);expect(m.summary.source).toBe('本地规则摘要');expect(m.text).toContain('演示');expect(store.get().history).toEqual([]);expect(analyze).not.toHaveBeenCalled();expect(key).not.toHaveBeenCalled();});
it('V1.0 拒绝未接入来源、未知联系人和空消息，不启动 AI',async()=>{const store=await setup();const analyze=vi.fn();const pipeline=new MessagePipeline(store,vi.fn(),analyze);for(const input of [{source:'feishu-bot',senderId:'boss',text:'公司消息'},{source:'mock',senderId:'unknown',text:'你好'},{source:'mock',senderId:'boss',text:' '}])await expect(pipeline.receive(input)).rejects.toThrow();expect(analyze).not.toHaveBeenCalled();expect(store.get().history).toEqual([]);});
it('只有用户启用在线 AI 时读取本机密钥，并只传当前消息正文',async()=>{const store=await setup();await store.update(s=>({...s,ai:{...s.ai,enabled:true,provider:'openai-compatible'}}));const key=vi.fn(async()=> 'test-key'),analyze=vi.fn<typeof extractSummary>(async text=>summarize(text));const pipeline=new MessagePipeline(store,key,analyze);await pipeline.receive({source:'mock',senderId:'boss',text:'模拟测试正文'});expect(key).toHaveBeenCalledOnce();expect(analyze.mock.calls[0][0]).toBe('模拟测试正文');expect(analyze.mock.calls[0][3]).toBe('test-key');});
it('同名联系人按各自标识匹配，避免误用人物配置',async()=>{const store=await setup();await store.update(s=>({...s,contacts:[{id:'one',name:'小王',category:'老实之人'},{id:'two',name:'小王',category:'厌世之人'}]}));const pipeline=new MessagePipeline(store,async()=> '');expect((await pipeline.receive({source:'mock',senderId:'two',text:'请提交周报'})).effect?.character).toBe('bored');});

it('清除历史期间尚未完成的分析不会重新写回或展示旧消息',async()=>{const store=await setup();let finish:(s:Summary)=>void=()=>{};const analyze=vi.fn<typeof extractSummary>(()=>new Promise<Summary>(resolve=>{finish=resolve}));const pipeline=new MessagePipeline(store,async()=>'',analyze);const pending=pipeline.receive({source:'mock',senderId:'boss',text:'正在解析的模拟消息'});await pipeline.clearHistory();finish(summarize('模拟消息'));await expect(pending).rejects.toThrow('历史已清空');expect(store.get().history).toEqual([]);});
