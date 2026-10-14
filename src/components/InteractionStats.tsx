import {interactionKinds,type State} from '../lib/model';
import {interactionLabels} from '../lib/interactions';
import {useLocalDay} from '../hooks/useLocalDay';
export function InteractionStats({state,busy,onClear}:{state:State;busy:boolean;onClear:()=>void}){
 const day=useLocalDay(),rows=state.interactions.filter(r=>r.day===day);
 return <section className="daily-stats" aria-label="今日互动统计">
  <div className="history-top"><div><h3>{state.pet.theme==='palace'?'今日宫廷战绩':'今日职场战绩'}</h3><p>{day} · 按 Mac 本地日期统计 · 共 {rows.reduce((sum,r)=>sum+Object.values(r.counts).reduce((a,b)=>a+b,0),0)} 次互动</p></div><button disabled={busy||!state.interactions.length} onClick={onClear}>清空互动统计</button></div>
  {rows.length?<table><thead><tr><th>联系人</th>{interactionKinds.map(kind=><th key={kind}>{interactionLabels[kind]}</th>)}<th>合计</th></tr></thead>
   <tbody>{rows.map(row=><tr key={row.contactId}><td>{state.contacts.find(c=>c.id===row.contactId)?.name??row.contactName}</td>{interactionKinds.map(kind=><td key={kind}>{row.counts[kind]} 次</td>)}<td>{Object.values(row.counts).reduce((a,b)=>a+b,0)} 次</td></tr>)}</tbody></table>:<p className="empty">今天还没互动。收到测试消息后，试试肘击、扇嘴、烧心、比心、嫁给ta或飞踢ta。</p>}
  <p className="description">仅记录本机点击，不给真实联系人发送任何内容。预览不计数；同一联系人不同消息合并统计。重启不归零，每天单独计数，保留最近 90 天。清空消息历史不会清空互动统计。</p>
 </section>;
}
