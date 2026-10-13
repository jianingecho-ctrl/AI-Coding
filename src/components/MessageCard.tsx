import {useEffect,useState,useRef} from 'react';
import {interactionKinds,type Message,type State,type InteractionKind} from '../lib/model';
import {messageEffects} from '../lib/effects';
import {interactionLabels,interactionLine,todayCounts} from '../lib/interactions';
import {playInteractionSound,stopInteractionSound} from '../lib/interaction-audio';
import {useLocalDay} from '../hooks/useLocalDay';
import {InteractionEffect,InteractionIcon} from './InteractionEffect';
export function MessageCard({message,state,onClose,onIgnore,onInteraction}:{message:Message;state:State;onClose?:()=>void;onIgnore?:()=>void;onInteraction?:(kind:InteractionKind)=>void}){
 const [original,setOriginal]=useState(false),[ignored,setIgnored]=useState(false);
 const [reaction,setReaction]=useState<{kind:InteractionKind;key:number}|null>(null),[lastKind,setLastKind]=useState<InteractionKind|null>(null),[interactionError,setInteractionError]=useState(''),[soundError,setSoundError]=useState('');
 const [composing,setComposing]=useState(false),[reply,setReply]=useState(''),[sending,setSending]=useState(false),[error,setError]=useState(''),[replies,setReplies]=useState(message.replies??[]);
 const effect=messageEffects(message);
 const content=useRef<HTMLDivElement>(null),originalContent=useRef<HTMLDivElement>(null);
 const day=useLocalDay(),counts=todayCounts(state.interactions,message.contact.id,day);
 const contactName=state.contacts.find(c=>c.id===message.contact.id)?.name??message.contact.name;
 useEffect(()=>{setReplies(message.replies??[])},[message.replies]);
 useEffect(()=>{if(original&&content.current&&originalContent.current){content.current.scrollTop+=originalContent.current.getBoundingClientRect().top-content.current.getBoundingClientRect().top;}},[original]);
 useEffect(()=>{if(!reaction)return;const timer=setTimeout(()=>setReaction(null),1200);return()=>clearTimeout(timer)},[reaction]);
 useEffect(()=>{if(!state.pet.soundEnabled||!state.pet.soundVolume)stopInteractionSound();},[state.pet.soundEnabled,state.pet.soundVolume]);
 function interact(kind:InteractionKind){
  setReaction(r=>({kind,key:(r?.key??0)+1}));setInteractionError('');setSoundError('');onInteraction?.(kind);
  // 必须直接从用户点击启动音频；跨窗口同步统计不会重复播放声音或计数。
  void playInteractionSound(kind,state.pet.soundEnabled,state.pet.soundVolume).catch(()=>setSoundError('音效暂不可用，请检查系统声音设置。'));
  if(!message.preview){setLastKind(kind);void window.judge.recordInteraction({messageId:message.id,kind}).catch(e=>setInteractionError('计数未保存：'+String(e)));}
 }
 if(ignored)return <article className="ignored-card"><span>已忽略 · {message.contact.name}</span><button onClick={()=>{setIgnored(false);setOriginal(false)}}>重新查看</button></article>;
 return <article className={`message-card card-${effect.cardSkin}`} aria-label="消息摘要">
  <div className="card-content" ref={content}>
  <div className="card-top"><span>{message.preview?'效果预览 · 不记录历史':`来自 ${message.contact.name}`}</span><b>{message.contact.category}</b></div>
  <h3 className="catchphrase">{effect.line}</h3>
  <small>{message.summary.source} · {message.summary.source==='本地规则摘要'?'未调用 AI':'请核对原文'}</small>
  {message.summary.warning&&<p className="summary-warning">{message.summary.warning}</p>}
  <dl><dt>一句话摘要</dt><dd>{message.summary.core}</dd><dt>待办事项</dt><dd>{message.summary.todos.length?<ul>{message.summary.todos.map((todo,i)=><li key={i}>{todo}</li>)}</ul>:'未提取到明确待办'}</dd><dt>截止时间</dt><dd>{message.summary.deadline}</dd><dt>紧急程度</dt><dd>{message.summary.urgency}</dd><dt>是否需要回复</dt><dd>{message.summary.reply}</dd></dl>
  {original&&<div className="original" ref={originalContent}><strong>原消息</strong><p>{message.text}</p></div>}
  {replies.length>0&&<div className="local-replies"><strong>本地模拟回复 · 未发送到飞书</strong>{replies.map(r=><p key={r.id}>{r.text}</p>)}</div>}
  {composing&&<form className="reply-form" onSubmit={async e=>{e.preventDefault();setSending(true);setError('');try{const updated=await window.judge.replyMessage({messageId:message.id,text:reply});setReplies(updated.replies??[]);setReply('');setComposing(false)}catch(e){setError('回复失败：'+String(e))}finally{setSending(false)}}}>
   <label>模拟回复内容<textarea aria-label="模拟回复内容" autoFocus value={reply} onChange={e=>setReply(e.target.value)} maxLength={2000} rows={2} placeholder="例如：收到，明天下午3点前发给你。"/></label><small>仅保存在本机，不发送给真实联系人。</small>{error&&<p role="alert" className="error">{error}</p>}
   <div className="editor-actions"><button type="submit" disabled={sending||!reply.trim()}>{sending?'正在保存…':'发送模拟回复'}</button><button type="button" disabled={sending} onClick={()=>setComposing(false)}>取消</button></div>
  </form>}
  </div>
  {reaction&&<InteractionEffect key={reaction.key} kind={reaction.kind}/>}
  <div className="card-footer">
   <div className="interaction-actions" aria-label="趣味互动">{interactionKinds.map(kind=><button key={kind} onClick={()=>interact(kind)}><InteractionIcon kind={kind}/>{interactionLabels[kind]}</button>)}</div>
   <div className="card-actions"><button onClick={()=>setOriginal(v=>!v)}>{original?'收起原消息':'查看原消息'}</button><button disabled={message.preview} title={message.preview?'请发送测试消息后再回复':'输入并保存本地模拟回复'} onClick={()=>setComposing(v=>!v)}>回复消息</button><button onClick={()=>onIgnore?onIgnore():setIgnored(true)}>忽略</button>{onClose&&<button onClick={onClose}>关闭</button>}</div>
   <div className="daily-interactions" aria-label="今日互动次数">
    <p>{message.preview?'效果预览 · 互动不计入统计':lastKind?interactionLine(lastKind,contactName,counts[lastKind]):`今天与${contactName}的互动`}</p>
    {!message.preview&&<div className="interaction-counts">{interactionKinds.map(kind=><span data-count={kind} key={kind}>{interactionLabels[kind]} {counts[kind]} 次</span>)}</div>}
   </div>
   {interactionError&&<p role="alert" className="interaction-error">{interactionError}</p>}{soundError&&<p role="alert" className="interaction-error">{soundError}</p>}
  </div>
 </article>;
}
