import {useEffect,useState} from 'react';
import type {Message} from '../lib/model';
import {messageEffects} from '../lib/effects';
export function MessageCard({message,onClose,onIgnore,onElbow}:{message:Message;onClose?:()=>void;onIgnore?:()=>void;onElbow?:()=>void}){
 const [original,setOriginal]=useState(false),[ignored,setIgnored]=useState(false),[punch,setPunch]=useState(0),[punching,setPunching]=useState(false);
 const [composing,setComposing]=useState(false),[reply,setReply]=useState(''),[sending,setSending]=useState(false),[error,setError]=useState(''),[replies,setReplies]=useState(message.replies??[]);
 const effect=messageEffects(message);
 useEffect(()=>{setReplies(message.replies??[])},[message.replies]);
 useEffect(()=>{if(!punching)return;const timer=setTimeout(()=>setPunching(false),750);return()=>clearTimeout(timer)},[punch,punching]);
 if(ignored)return <article className="ignored-card"><span>已忽略 · {message.contact.name}</span><button onClick={()=>{setIgnored(false);setOriginal(false)}}>重新查看</button></article>;
 return <article className={`message-card card-${effect.cardSkin}`} aria-label="消息摘要">
  <div className="card-top"><span>{message.preview?'效果预览 · 不记录历史':`来自 ${message.contact.name}`}</span><b>{message.contact.category}</b></div>
  <h3 className="catchphrase">{effect.line}</h3>
  <small>{message.summary.source} · {message.summary.source==='本地规则摘要'?'未调用 AI':'请核对原文'}</small>
  {message.summary.warning&&<p className="summary-warning">{message.summary.warning}</p>}
  <dl><dt>一句话摘要</dt><dd>{message.summary.core}</dd><dt>待办事项</dt><dd>{message.summary.todos.length?<ul>{message.summary.todos.map((todo,i)=><li key={i}>{todo}</li>)}</ul>:'未提取到明确待办'}</dd><dt>截止时间</dt><dd>{message.summary.deadline}</dd><dt>紧急程度</dt><dd>{message.summary.urgency}</dd><dt>是否需要回复</dt><dd>{message.summary.reply}</dd></dl>
  {original&&<div className="original"><strong>原消息</strong><p>{message.text}</p></div>}
  {replies.length>0&&<div className="local-replies"><strong>本地模拟回复 · 未发送到飞书</strong>{replies.map(r=><p key={r.id}>{r.text}</p>)}</div>}
  {composing&&<form className="reply-form" onSubmit={async e=>{e.preventDefault();setSending(true);setError('');try{const updated=await window.judge.replyMessage({messageId:message.id,text:reply});setReplies(updated.replies??[]);setReply('');setComposing(false)}catch(e){setError('回复失败：'+String(e))}finally{setSending(false)}}}>
   <label>模拟回复内容<textarea aria-label="模拟回复内容" autoFocus value={reply} onChange={e=>setReply(e.target.value)} maxLength={2000} rows={2} placeholder="例如：收到，明天下午3点前发给你。"/></label><small>仅保存在本机，不发送给真实联系人。</small>{error&&<p role="alert" className="error">{error}</p>}
   <div className="editor-actions"><button type="submit" disabled={sending||!reply.trim()}>{sending?'正在保存…':'发送模拟回复'}</button><button type="button" disabled={sending} onClick={()=>setComposing(false)}>取消</button></div>
  </form>}
  {punching&&<div key={punch} className="elbow-effect" role="status">🦾 肘击一下，烦恼退散！</div>}
  <div className="card-actions"><button onClick={()=>setOriginal(v=>!v)}>{original?'收起原消息':'查看原消息'}</button><button disabled={message.preview} title={message.preview?'请发送测试消息后再回复':'输入并保存本地模拟回复'} onClick={()=>setComposing(v=>!v)}>回复消息</button><button onClick={()=>{setPunch(v=>v+1);setPunching(true);onElbow?.()}}>肘击</button><button onClick={()=>onIgnore?onIgnore():setIgnored(true)}>忽略</button>{onClose&&<button onClick={onClose}>关闭</button>}</div>
 </article>;
}
