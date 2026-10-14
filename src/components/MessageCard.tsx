import {useEffect,useState,useRef} from 'react';
import {interactionKinds,type Message,type State,type InteractionKind} from '../lib/model';
import {messageEffects} from '../lib/effects';
import {interactionLabels,interactionLine,todayCounts} from '../lib/interactions';
import {playInteractionSound,stopInteractionSound} from '../lib/interaction-audio';
import {useLocalDay} from '../hooks/useLocalDay';
import {InteractionEffect,InteractionIcon} from './InteractionEffect';
import {contactPriority} from '../lib/message-priority';
import {categoryLabel} from '../lib/editions';
export function MessageCard({message,state,onClose,onIgnore,onInteraction,onHold}:{message:Message;state:State;onClose?:()=>void;onIgnore?:()=>void;onInteraction?:(kind:InteractionKind)=>void;onHold?:(hold:boolean)=>void}){
 const [original,setOriginal]=useState(false),[ignored,setIgnored]=useState(false);
 const [reaction,setReaction]=useState<{kind:InteractionKind;key:number}|null>(null),[lastKind,setLastKind]=useState<InteractionKind|null>(null),[interactionError,setInteractionError]=useState(''),[soundError,setSoundError]=useState('');
 const [composing,setComposing]=useState(false),[reply,setReply]=useState(''),[sending,setSending]=useState(false),[error,setError]=useState(''),[replies,setReplies]=useState(message.replies??[]);
 const effect=messageEffects(message);
 const notification=message.source==='notification';
 const [copyNotice,setCopyNotice]=useState('');
 const content=useRef<HTMLDivElement>(null),originalContent=useRef<HTMLDivElement>(null);
 const day=useLocalDay(),counts=todayCounts(state.interactions,message.contact.id,day);
 const contactName=state.contacts.find(c=>c.id===message.contact.id)?.name??message.contact.name;
 useEffect(()=>{setReplies(message.replies??[])},[message.replies]);
 useEffect(()=>{if(original&&content.current&&originalContent.current){content.current.scrollTop+=originalContent.current.getBoundingClientRect().top-content.current.getBoundingClientRect().top;}},[original]);
 useEffect(()=>{if(!reaction)return;const timer=setTimeout(()=>setReaction(null),reaction.kind==='marry'?10500:reaction.kind==='kick'?2500:1200);return()=>clearTimeout(timer)},[reaction]);
 useEffect(()=>{if(!state.pet.soundEnabled||!state.pet.soundVolume)stopInteractionSound();},[state.pet.soundEnabled,state.pet.soundVolume]);
 useEffect(()=>{onHold?.(composing||Boolean(reaction))},[composing,Boolean(reaction)]);
 useEffect(()=>()=>onHold?.(false),[]);
 useEffect(()=>()=>stopInteractionSound(),[]);
 function interact(kind:InteractionKind){
  setReaction(r=>({kind,key:(r?.key??0)+1}));setInteractionError('');setSoundError('');onInteraction?.(kind);
  // 必须直接从用户点击启动音频；跨窗口同步统计不会重复播放声音或计数。
  void playInteractionSound(kind,state.pet.soundEnabled,state.pet.soundVolume,kind==='marry'&&state.weddingMusic?()=>window.judge.getWeddingAudio():undefined).catch(()=>setSoundError(kind==='marry'&&state.weddingMusic?'本地音乐无法播放，请重新导入可播放的 MP3 / WAV 或恢复原创音效。':'音效暂不可用，请检查系统声音设置。'));
  if(!message.preview){setLastKind(kind);void window.judge.recordInteraction({messageId:message.id,kind}).catch(e=>setInteractionError('计数未保存：'+String(e)));}
 }
 if(ignored)return <article className="ignored-card"><span>已忽略 · {message.contact.name}</span><button onClick={()=>{setIgnored(false);setOriginal(false)}}>重新查看</button></article>;
 return <article className={`message-card card-${effect.cardSkin}`} aria-label="消息摘要">
  <div className="card-content" ref={content}>
  <div className="card-top"><span>{message.preview?'效果预览 · 不记录历史':`来自 ${message.contact.name}`}</span><b>{categoryLabel(message.contact.category,state.pet.theme)}</b></div>
  <small className="message-priority" data-priority={contactPriority(message.contact)}>收到消息优先级：{contactPriority(message.contact)}</small>
  <h3 className="catchphrase">{effect.line}</h3>
  {notification&&<small className="notification-source">{message.notification?.fixture?'通知验收夹具 · 未读取屏幕':'屏幕通知识别'} · {message.notification?.confirmedByUser?'人工确认':'自动匹配'}{message.notification?.group?' · 群：'+message.notification.group:''}</small>}
  <small>{message.summary.source} · {message.summary.source==='本地规则摘要'?'未调用 AI':'请核对原文'}</small>
  {message.summary.warning&&<p className="summary-warning">{message.summary.warning}</p>}
  <dl><dt>一句话摘要</dt><dd>{message.summary.core}</dd><dt>待办事项</dt><dd>{message.summary.todos.length?<ul>{message.summary.todos.map((todo,i)=><li key={i}>{todo}</li>)}</ul>:'未提取到明确待办'}</dd><dt>截止时间</dt><dd>{message.summary.deadline}</dd><dt>紧急程度</dt><dd>{message.summary.urgency}</dd><dt>是否需要回复</dt><dd>{message.summary.reply}</dd></dl>
  {original&&<div className="original" ref={originalContent}><strong>{notification?'通知可见内容（请到飞书核对完整原文）':'原消息'}</strong><p>{message.text}</p>{notification&&message.notification?.recognizedText!==message.text&&<><strong>原始识别正文</strong><p>{message.notification?.recognizedText}</p></>}</div>}
  {replies.length>0&&<div className="local-replies"><strong>{notification?'本地回复草稿':'本地模拟回复'} · 未发送到飞书</strong>{replies.map(r=><p key={r.id}>{r.text}{notification&&<button onClick={()=>void window.judge.copyText(r.text).then(()=>setCopyNotice('已复制，请到飞书手动粘贴发送。')).catch(e=>setCopyNotice('复制失败：'+String(e)))}>复制回复</button>}</p>)}{copyNotice&&<small role="status">{copyNotice}</small>}</div>}
  {composing&&<form className="reply-form" onSubmit={async e=>{e.preventDefault();setSending(true);setError('');try{const updated=await window.judge.replyMessage({messageId:message.id,text:reply});setReplies(updated.replies??[]);setReply('');setComposing(false)}catch(e){setError('回复失败：'+String(e))}finally{setSending(false)}}}>
   <label>{notification?'回复草稿内容':'模拟回复内容'}<textarea aria-label={notification?'回复草稿内容':'模拟回复内容'} autoFocus value={reply} onChange={e=>setReply(e.target.value)} maxLength={2000} rows={2} placeholder="例如：收到，明天下午3点前发给你。"/></label><small>仅保存在本机，不发送给真实联系人。{notification?'保存后可复制到飞书。':''}</small>{error&&<p role="alert" className="error">{error}</p>}
   <div className="editor-actions"><button type="submit" disabled={sending||!reply.trim()}>{sending?'正在保存…':notification?'保存回复草稿':'发送模拟回复'}</button><button type="button" disabled={sending} onClick={()=>setComposing(false)}>取消</button></div>
  </form>}
  </div>
  {reaction&&<InteractionEffect key={reaction.key} kind={reaction.kind}/>}
  <div className="card-footer">
   <div className="interaction-actions" aria-label="趣味互动">{interactionKinds.map(kind=><button key={kind} onClick={()=>interact(kind)}><InteractionIcon kind={kind}/>{interactionLabels[kind]}</button>)}</div>
   <div className="card-actions"><button onClick={()=>setOriginal(v=>!v)}>{notification?(original?'收起通知内容':'查看通知内容'):(original?'收起原消息':'查看原消息')}</button><button disabled={message.preview} title={message.preview?'请发送测试消息后再回复':'输入并保存本地回复草稿'} onClick={()=>setComposing(v=>!v)}>回复消息</button><button onClick={()=>onIgnore?onIgnore():setIgnored(true)}>忽略</button>{onClose&&<button onClick={onClose}>关闭</button>}</div>
   <div className="daily-interactions" aria-label="今日互动次数">
    <p>{message.preview?'效果预览 · 互动不计入统计':lastKind?interactionLine(lastKind,contactName,counts[lastKind]):`今天与${contactName}的互动`}</p>
    {!message.preview&&<div className="interaction-counts">{interactionKinds.map(kind=><span data-count={kind} key={kind}>{interactionLabels[kind]} {counts[kind]} 次</span>)}</div>}
   </div>
   {interactionError&&<p role="alert" className="interaction-error">{interactionError}</p>}{soundError&&<p role="alert" className="interaction-error">{soundError}</p>}
  </div>
 </article>;
}
