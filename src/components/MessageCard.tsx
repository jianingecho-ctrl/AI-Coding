import {useState} from 'react';
import type {Message} from '../lib/model';
import {isKneeling,messageEffects} from '../lib/effects';
export function MessageCard({message,onClose,onStay}:{message:Message;onClose?:()=>void;onStay?:()=>void}){
 const [original,setOriginal]=useState(false);
 const [staying,setStaying]=useState(false);
 const effect=messageEffects(message);
 return <article className={`message-card card-${effect.cardSkin}`} aria-label="消息摘要">
  <div className="card-top"><span>{message.preview?'效果预览 · 不记录历史':`来自 ${message.contact.name}`}</span><b>{message.contact.category}</b></div>
  <h3 className="catchphrase">{effect.line}</h3>
  <small>{message.summary.source} · 请核对原文</small>
  {message.summary.warning&&<p className="summary-warning">{message.summary.warning}</p>}
  <dl><dt>核心内容</dt><dd>{message.summary.core}</dd><dt>待办事项</dt><dd>{message.summary.todos.length?<ul>{message.summary.todos.map((todo,i)=><li key={i}>{todo}</li>)}</ul>:'未提取到明确待办'}</dd><dt>截止时间</dt><dd>{message.summary.deadline}</dd><dt>是否需要回复</dt><dd>{message.summary.reply}</dd></dl>
  {original&&<div className="original"><strong>原消息</strong><p>{message.text}</p></div>}
  <div className="card-actions"><button onClick={()=>setOriginal(v=>!v)}>{original?'收起原消息':'查看原消息'}</button>{onStay&&isKneeling(effect.action)&&<button onClick={()=>{setStaying(true);onStay();}}>{staying?'正在跪着…':'继续跪着'}</button>}{onClose&&<button onClick={onClose}>关闭</button>}</div>
 </article>;
}
