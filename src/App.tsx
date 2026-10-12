import {useEffect,useState} from 'react';
import {categories,defaultState,type State,type Message,type Contact,type Category} from './lib/model';
import {Character} from './components/Character';
import {MessageCard} from './components/MessageCard';

export function App(){
 const [state,setState]=useState<State>(structuredClone(defaultState));
 const [error,setError]=useState('');
 const [ready,setReady]=useState(false);
 useEffect(()=>{
  if(!window.judge){setError('请通过 Electron 启动应用：npm run dev。浏览器页面无法访问桌面功能。');return;}
  let active=true;
  const off=window.judge.onState(s=>{if(active)setState(s);});
  window.judge.getState().then(s=>{if(active){setState(s);setReady(true);}}).catch(e=>setError(String(e)));
  return()=>{active=false;off();};
 },[]);
 const petView=new URLSearchParams(location.search).get('view')==='pet';
 useEffect(()=>{document.body.classList.toggle('pet-window',petView);document.documentElement.classList.toggle('pet-window',petView);},[petView]);
 if(petView)return <Pet state={state} error={error}/>;
 return <Panel state={state} ready={ready} error={error} setError={setError}/>;
}
function Pet({state,error}:{state:State;error:string}){
 const [message,setMessage]=useState<Message|null>(null);
 const [action,setAction]=useState('idle');
 const [entry,setEntry]=useState(0);
 useEffect(()=>window.judge?.onMessage(m=>{setMessage(m);setEntry(v=>v+1);setAction(m.contact.category==='讨厌的人'?'kneel':m.contact.category==='领导'?'salute':m.contact.category==='喜欢的同事'?'happy':'wave');}),[]);
 useEffect(()=>{
  if(message)return;
  const actions=['idle','fish','yawn'];let index=0;
  const timer=setInterval(()=>{index=(index+1)%actions.length;setAction(actions[index]);},5000);
  return()=>clearInterval(timer);
 },[message]);
 return <main className="pet-stage">
  <div className="pet-toolbar"><span className="drag-handle" title="按住拖动窗口">⠿ 拖动小判官</span><button onClick={()=>window.judge.openPanel()}>控制台</button><button title="退出应用" onClick={()=>window.judge.quit()}>退出</button></div>
  {error&&<p className="error">{error}</p>}
  <div key={entry} className={`pet-scene ${message?.contact.category==='讨厌的人'?'slide-kneel':''}`}>
   {message&&<MessageCard key={message.id} message={message} onClose={()=>{setMessage(null);setAction('idle');}} onStay={()=>setAction('kneel')}/>}
   {!message&&<div className="idle-bubble">{action==='fish'?'工作先放放，鱼先摸摸。':action==='yawn'?'困意是工伤吗？':'随时待命，选择性精神。'}</div>}
   <div className="pet-drag" title="按住人物拖动窗口"><Character action={action} name={state.pet.name} color={state.pet.color}/><span className="pet-name">{state.pet.name}</span></div>
  </div>
 </main>;
}
function Panel({state,ready,error,setError}:{state:State;ready:boolean;error:string;setError:(s:string)=>void}){
 const [tab,setTab]=useState('测试面板');
 const [selected,setSelected]=useState('annoying');
 const [text,setText]=useState('麻烦明天下午3点前整理本周项目进度，发给我确认。收到请回复，谢谢。');
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState('');
 const [last,setLast]=useState<Message|null>(null);
 const [newName,setNewName]=useState('');
 const [newCategory,setNewCategory]=useState<Category>('普通同事');
 useEffect(()=>{if(!state.contacts.some(c=>c.id===selected))setSelected(state.contacts[0]?.id||'');},[state.contacts,selected]);
 async function execute(task:()=>Promise<unknown>,success:string){setBusy(true);setError('');setNotice('');try{await task();setNotice(success);}catch(e){setError(`操作失败：${String(e)}`);}finally{setBusy(false);}}
 function save(contacts:Contact[],pet=state.pet){return window.judge.saveSettings({contacts,pet});}
 const chosen=state.contacts.find(c=>c.id===selected);
 return <main className="dashboard">
  <aside><div className="brand-icon">判</div><h1>职场小判官<span>你的桌面摸鱼搭子</span></h1><nav>{['测试面板','联系人','消息历史','人物设置'].map(t=><button key={t} className={tab===t?'active':''} onClick={()=>{setTab(t);setNotice('');}}>{t}</button>)}</nav><div className="aside-bottom"><span className="status-dot"/> 模拟飞书 · 本地运行<p>第一阶段 MVP / 0.1.0</p></div></aside>
  <section className="workspace"><header><div><span className="eyebrow">上班有态度，摸鱼有章法</span><h2>{tab}</h2></div><span className="pill">{state.ai.enabled?'本地 AI 模式':'离线规则模式'}</span></header>
  {error&&<p role="alert" className="error">{error}</p>}{notice&&<p role="status" className="notice">{notice}</p>}
  {tab==='测试面板'&&<><div className="intro"><div><h3>谁的消息，谁的待遇。</h3><p>模拟一条飞书消息，看看小判官如何接招。</p><span>领导 → 立正 · 喜欢的同事 → 开心<br/>普通同事 → 招手 · 讨厌的人 → 滑跪举牌</span></div><Character action={chosen?.category==='讨厌的人'?'kneel':'happy'} color={state.pet.color}/></div><form onSubmit={e=>{e.preventDefault();void execute(async()=>setLast(await window.judge.sendMessage({contactId:selected,text})), '消息已送达桌宠，打开桌宠窗口查看动画。');}}>
   <label>消息来自<select value={selected} onChange={e=>setSelected(e.target.value)} disabled={busy}>{state.contacts.map(c=><option key={c.id} value={c.id}>{c.name} · {c.category}</option>)}</select></label>
   <label>模拟飞书消息<textarea value={text} onChange={e=>setText(e.target.value)} maxLength={5000} rows={5} placeholder="输入消息内容，如：请明天18点前提交周报，收到请回复。"/></label><div className="form-footer"><small>{text.length} / 5000 · 不会发送给真实联系人</small><button className="primary" disabled={!ready||busy||!text.trim()||!selected}>{busy?'正在送达…':'发送并触发动画 ↗'}</button></div>
  </form>{last&&<div className="preview"><h3>最近一次判读</h3><MessageCard key={last.id} message={last}/></div>}<p className="footnote">可在人物设置中启用本机 Ollama AI。默认使用离线规则；AI 不可用时明确提示降级。相对日期按原文保留，请核对原消息。</p></>}
  {tab==='联系人'&&<><p className="description">给每位同事安排一个角色。修改后立即保存，历史消息保留发送时的角色。</p><div className="contacts">{state.contacts.map(c=><div className="contact-row" key={c.id}><div className="avatar">{c.name.slice(0,1)}</div><strong>{c.name}</strong><select aria-label={`${c.name}的类别`} value={c.category} disabled={busy} onChange={e=>void execute(()=>save(state.contacts.map(v=>v.id===c.id?{...v,category:e.target.value as Category}:v)),'联系人类别已保存。')}>{categories.map(t=><option key={t}>{t}</option>)}</select><button disabled={busy} onClick={()=>{if(confirm(`删除联系人「${c.name}」？已有消息历史会保留。`))void execute(()=>save(state.contacts.filter(v=>v.id!==c.id)),'联系人已删除。');}}>删除</button></div>)}</div><form className="add-contact" onSubmit={e=>{e.preventDefault();void execute(async()=>{await save([...state.contacts,{id:crypto.randomUUID(),name:newName.trim(),category:newCategory}]);setNewName('');},'联系人已添加。');}}><label>联系人姓名<input value={newName} onChange={e=>setNewName(e.target.value)} maxLength={40} placeholder="输入同事姓名"/></label><label>类别<select value={newCategory} onChange={e=>setNewCategory(e.target.value as Category)}>{categories.map(c=><option key={c}>{c}</option>)}</select></label><button className="primary" disabled={busy||!ready||!newName.trim()||state.contacts.length>=100}>添加联系人</button></form></>}
  {tab==='消息历史'&&<><div className="history-top"><p>仅保存在本机 · 最近 200 条 · 共 {state.history.length} 条</p><button disabled={busy||!state.history.length} onClick={()=>{if(confirm('确定清空所有本地消息历史？此操作无法撤销。'))void execute(()=>window.judge.clearHistory(),'历史已清空。');}}>清空历史</button></div>{state.history.length?state.history.map(m=><div className="history-item" key={m.id}><time>{new Date(m.createdAt).toLocaleString('zh-CN')}</time><MessageCard message={m}/></div>):<div className="empty">还没有消息。去测试面板让小判官接个活吧。</div>}</>}
  {tab==='人物设置'&&<><div className="settings-preview"><Character name={state.pet.name} color={state.pet.color}/><h3>{state.pet.name}</h3></div><form key={`${state.pet.name}-${state.pet.color}`} onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);void execute(()=>save(state.contacts,{name:String(data.get('name')).trim(),color:String(data.get('color')) as State['pet']['color']}),'人物设置已保存。');}}><label>小判官昵称<input name="name" defaultValue={state.pet.name} required maxLength={20}/></label><label>工服颜色<select name="color" defaultValue={state.pet.color}>{['薄荷绿','蜜桃粉','奶油黄'].map(c=><option key={c}>{c}</option>)}</select></label><button className="primary" disabled={!ready||busy}>保存人物设置</button></form><p className="description">拖动桌宠人物或顶部拖动区移动窗口。消息卡片会持续显示，直到关闭或下一条消息到来。关闭控制台不会退出桌宠。</p><button onClick={()=>window.judge.quit()}>退出职场小判官</button></>}
  {tab==='人物设置'&&<form className="ai-settings" key={`${state.ai.enabled}-${state.ai.model}`} onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);void execute(()=>window.judge.saveSettings({contacts:state.contacts,pet:state.pet,ai:{enabled:data.get('enabled')==='on',model:String(data.get('model')).trim()}}),'摘要模式已保存。');}}><h3>本地 AI 摘要</h3><p className="description">使用本机 Ollama（127.0.0.1:11434），消息仅发送到本机。先运行 ollama pull qwen2.5:3b；服务和模型安装方式见说明文档。</p><label className="checkbox-label"><input type="checkbox" name="enabled" defaultChecked={state.ai.enabled}/>启用本地 AI（失败时降级并提示）</label><label>Ollama 模型名称<input name="model" defaultValue={state.ai.model} required maxLength={80}/></label><button className="primary" disabled={!ready||busy}>保存摘要模式</button></form>}
  </section>
 </main>;
}
