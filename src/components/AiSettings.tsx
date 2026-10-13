import {useEffect,useState} from 'react';
import type {State} from '../lib/model';
export function AiSettings({state,busy,execute}:{state:State;busy:boolean;execute:(task:()=>Promise<unknown>,success:string)=>void}){
 const [key,setKey]=useState(''),[hasKey,setHasKey]=useState(false),[provider,setProvider]=useState(state.ai.provider);
 useEffect(()=>{window.judge.hasAiKey().then(setHasKey)},[]);
 return <form className="ai-settings" onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);execute(()=>window.judge.saveSettings({contacts:state.contacts,pet:state.pet,ai:{enabled:data.get('enabled')==='on',provider,model:String(data.get('model')).trim(),baseUrl:String(data.get('baseUrl')).trim()}}),'摘要模式已保存。')}}>
 <h3>消息分析服务</h3><p className="description">默认使用本地规则解析，明确标注「未调用 AI」。启用 Ollama 时发送到本机；启用在线服务时，测试消息会发送到你配置的服务地址。</p>
 <label className="checkbox-label"><input name="enabled" type="checkbox" defaultChecked={state.ai.enabled}/>启用真实 AI（未配置或失败会提示并使用规则解析）</label>
 <label>AI 服务<select value={provider} onChange={e=>setProvider(e.target.value as State['ai']['provider'])}><option value="ollama">本机 Ollama</option><option value="openai-compatible">OpenAI 兼容服务</option></select></label>
 <label>模型名称<input name="model" defaultValue={state.ai.model} required maxLength={100}/><small>Ollama 默认 qwen2.5:3b；在线服务填写供应商提供的模型名称。</small></label>
 <label>在线服务基础地址<input name="baseUrl" defaultValue={state.ai.baseUrl} required maxLength={300}/><small>例如 https://api.openai.com/v1；本机 Ollama 使用固定地址 127.0.0.1:11434。</small></label>
 {provider==='openai-compatible'&&<><label>API Key · {hasKey?'已保存在系统安全存储':'尚未配置'}<input type="password" value={key} autoComplete="off" onChange={e=>setKey(e.target.value)} placeholder="仅在你的 Mac 上输入" maxLength={1000}/></label><div className="editor-actions"><button type="button" disabled={busy||!key.trim()} onClick={()=>execute(async()=>{await window.judge.saveAiKey(key);setKey('');setHasKey(true)},'API Key 已加密保存。')}>保存 API Key</button><button type="button" disabled={busy||!hasKey} onClick={()=>execute(async()=>{await window.judge.saveAiKey('');setHasKey(false)},'API Key 已移除。')}>移除 API Key</button></div><p className="description">密钥经 Electron safeStorage 加密，配置与历史文件不会包含密钥。保存密钥后还需保存摘要模式。</p></>}
 <button className="primary" disabled={busy}>保存摘要模式</button>
 </form>;
}
