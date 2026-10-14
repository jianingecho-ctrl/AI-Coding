import {useEffect,useState} from 'react';
import type {State,Message} from '../lib/model';
import {type NotificationStatus,type NotificationDraft,type NotificationSettings} from '../lib/notifications';
import {categoryLabel} from '../lib/editions';
import {MessageCard} from './MessageCard';

export function NotificationPanel({state}:{state:State}){
 const [status,setStatus]=useState<NotificationStatus|null>(null),[settings,setSettings]=useState<NotificationSettings>(structuredClone(state.notifications));
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[last,setLast]=useState<Message|null>(null),[delay,setDelay]=useState(5);
 useEffect(()=>{let active=true;const off=window.judge.onNotifications(value=>{if(active)setStatus(value)});void window.judge.notificationStatus().then(value=>{if(active)setStatus(value)}).catch(e=>setError(String(e)));return()=>{active=false;off()}},[]);
 useEffect(()=>setSettings(structuredClone(state.notifications)),[JSON.stringify(state.notifications)]);
 async function run(work:()=>Promise<unknown>,success=''){setBusy(true);setError('');setNotice('');try{const result=await work();if(result&&typeof result==='object'&&'state' in result&&result.state==='blocked')throw new Error((result as NotificationStatus).error);setNotice(success)}catch(e){setError(String(e instanceof Error?e.message:e))}finally{setBusy(false)}}
 const active=status?.state==='watching'||status?.state==='capturing';
 return <div className="notification-panel">
  <section className="privacy-note"><h3>飞书桌面通知 · 本机识别</h3><p>读取选区内可见通知，中文识别和摘要在本机完成，不联网、不保存截图。只保存确认送达的消息。通知被隐藏、截断或未展示时，无法补全原文。</p><p>识别一次和开始监测都会送达符合条件的当前通知；重复内容不会反复触发。重启后保持暂停。回复仅在本机保存，可复制到飞书手动发送。</p></section>
  {status?.fixture&&<p className="notice">自动验收夹具 · 未读取系统通知</p>}
  {error&&<p role="alert" className="error">{error}</p>}{notice&&<p role="status" className="notice">{notice}</p>}
  <section className="notification-controls">
   <div className="notification-status" role="status" data-notification-state={status?.state}><strong>{!status?'正在检查识别模块…':status.state==='watching'?'正在监测通知':status.state==='capturing'?'正在识别一次':status.state==='blocked'?'识别已停止，请查看原因':'通知识别已暂停'}</strong><span>本次已送达 {status?.delivered??0} 条 · 已过滤重复 {status?.duplicates??0} 次</span></div>
   {!status?.available&&status&&<p>通知截图需要 macOS 15.2+ 和原生识别模块。请在 Mac 新版目录执行 npm run build；模拟消息仍可使用。</p>}
   {status?.error&&<p role="alert" className="summary-warning">{status.error}</p>}
   <p className="delivery-mode">当前送达模式：{state.notifications.autoDeliver?'自动送达已开启；姓名、来源或分隔不明确时仍需确认':'人工确认；检测到文字后不会直接弹出桌宠'}</p>
   <button disabled={busy} onClick={()=>void run(()=>window.judge.saveNotificationSettings({...state.notifications,region:{mode:'primary',x:0,y:0,width:480,height:240}}),'已恢复右上角 480×240 点紧凑选区，识别已暂停。请将控制台和桌宠移出选区，再识别一次。')}>恢复紧凑通知选区</button>
   <label>单次识别准备时间<select aria-label="单次识别准备时间" disabled={busy||active} value={delay} onChange={e=>setDelay(Number(e.target.value))}><option value={0}>立即识别</option><option value={5}>5 秒后识别</option><option value={10}>10 秒后识别</option></select></label>
   <div className="editor-actions"><button className="primary" disabled={!status?.available||busy||active} onClick={()=>void run(()=>window.judge.captureNotification(delay))}>识别一次</button><button disabled={!status?.available||busy||active} onClick={()=>void run(()=>window.judge.startNotifications(),'已开始监测，匹配明确的联系人消息会触发人物。')}>开始监测</button><button disabled={!status?.available||busy||active} onClick={()=>void run(()=>window.judge.captureNotification(delay,true))}>仅预览，不触发</button><button disabled={!active} onClick={()=>void window.judge.stopNotifications().then(()=>setNotice('识别已暂停。')).catch(e=>setError(String(e)))}>暂停识别</button><button disabled={busy||(!status?.drafts.length&&!status?.lastResult)} onClick={()=>void run(()=>window.judge.clearNotificationDrafts(),'已清空草稿和识别预览并暂停。')}>清空草稿并暂停</button></div>
   {status?.state==='capturing'&&<p role="status">本次准备时间 {delay} 秒，请展开飞书通知，并把控制台移出右上角选区。正在等待识别结果…</p>}
   {status?.lastResult&&<CaptureResult status={status}/>}
   <p className="description">开始后可最小化控制台，让通知保持在选区内。关闭控制台窗口不会停止后台识别；请点「暂停识别」停止。</p>
  </section>
  <section className="notification-drafts"><h3>待确认通知 · {status?.drafts.length??0} 条</h3><p className="description">有待确认通知表示已识别到内容；未满足自动送达条件；点「确认送达桌宠」可触发人物。通知姓名别名可在联系人编辑中填写；草稿只保存在内存中。</p>
   {!status?.drafts.length&&<div className="empty">尚无待确认通知。让通知显示在选区内，再点「识别一次」。</div>}
   {status?.drafts.map(draft=><DraftCard key={draft.id} draft={draft} state={state} busy={busy} onConfirm={(contactId,text)=>void run(async()=>{const message=await window.judge.confirmNotification({draftId:draft.id,contactId,text});setLast(message)},'通知已送达桌宠并保存到本版历史。')} onDismiss={()=>void run(()=>window.judge.dismissNotification(draft.id),'已忽略这条通知。')}/>)}
  </section>
  <form aria-label="通知识别设置" onSubmit={event=>{event.preventDefault();void run(()=>window.judge.saveNotificationSettings(settings),'通知设置已保存，识别保持暂停。')}}>
   <h3>识别区域与自动送达</h3>
   <label>选区位置<select aria-label="选区位置" value={settings.region.mode} onChange={e=>setSettings(v=>({...v,region:{...v.region,mode:e.target.value as 'primary'|'custom'}}))}><option value="primary">主屏幕右上角</option><option value="custom">自定义屏幕坐标</option></select></label>
   <div className="field-grid">{(['x','y','width','height'] as const).map((key,i)=><label key={key}>{['横坐标 X（点）','纵坐标 Y（点）','选区宽度（点）','选区高度（点）'][i]}<input aria-label={['横坐标 X','纵坐标 Y','选区宽度','选区高度'][i]} type="number" required min={i<2?-20000:50} max={i<2?20000:key==='width'?800:1000} disabled={i<2&&settings.region.mode==='primary'} value={settings.region[key]} onChange={e=>setSettings(v=>({...v,region:{...v.region,[key]:Number(e.target.value)}}))}/></label>)}</div>
   <label>识别间隔（秒）<input aria-label="识别间隔（秒）" type="number" min={2} max={30} required value={settings.intervalSeconds} onChange={e=>setSettings(v=>({...v,intervalSeconds:Number(e.target.value)}))}/></label>
   <label className="checkbox-label"><input type="checkbox" checked={settings.autoDeliver} onChange={e=>setSettings(v=>({...v,autoDeliver:e.target.checked}))}/>匹配明确的通知自动送达桌宠</label>
   <p className="description">默认开启自动进场。系统通知或飞书弹窗中按文字位置提取、姓名唯一精确匹配且正文未混入小判官界面的消息直接触发；低置信度内容请在卡片中核对。无文字位置时仍需来源明确且置信度至少 90%。来源不明、相似姓名、同名或截断边界进入待确认草稿。系统通知窗口只能确认来自通知中心，请核对是否为飞书。群通知按「姓名：正文」逐条拆分，群名不作为发送人。没有飞书消息 ID，相同姓名和正文在短时间内可能被合并。</p>
   <button className="primary" disabled={busy}>保存通知设置</button>
  </form>
  {last&&state.history.some(m=>m.id===last.id)&&<section className="preview"><h3>最近确认的通知</h3><MessageCard state={state} message={state.history.find(m=>m.id===last.id)!}/></section>}
 </div>;
}
function CaptureResult({status}:{status:NotificationStatus}){
 const result=status.lastResult!,frame=result.frame;
 const sources={'system-notification':'系统通知窗口','feishu-window':'飞书小弹窗','other-window':'其他窗口（可能选区被遮挡）',unknown:'窗口来源未确认'};
 return <section className="capture-result" aria-label="本轮识别结果">
  <strong>本轮结果：{frame.lines.length} 行文字 · {result.parsed} 条姓名与正文 · {result.duplicates} 条重复 · {result.delivered} 条自动送达</strong>
  <p>{sources[frame.context]}{frame.region&&` · 选区 X=${frame.region.x}，Y=${frame.region.y}，${frame.region.width}×${frame.region.height} 点`}</p>
  <p>{frame.captureMode==='notification-window'?'已收窄到选区内可见的通知窗口':'仍在识别整个选区；请使用紧凑选区，避免桌面和小判官进入截图'}</p>
  {result.baseline&&<p>这是开始监测的首轮，{result.parsed} 条内容作为已有通知基线。要核对当前通知，请暂停后点「识别一次」。</p>}
  {!result.baseline&&result.newDrafts>result.delivered&&<p>新增待确认 {result.newDrafts-result.delivered} 条，请在下方确认后送达桌宠。</p>}
  {result.duplicates>0&&<p>重复内容没有再次触发；测试时换一条正文。已忽略或送达的通知短时间内不会重新出现。</p>}
  <details><summary>查看本轮识别的原始文字</summary><p>仅在本版内存中显示，不保存截图，不外发。若看到控制台或其他应用文字，请移开遮挡窗口或调整选区。</p>{frame.lines.length?<ol>{frame.lines.map((line,i)=><li key={i}><span>{line.text}</span><small> {Math.round(line.confidence*100)}%</small></li>)}</ol>:<p>本轮没有文字。请检查选区、通知预览、遮挡和当前应用录屏权限。</p>}</details>
 </section>;
}
function DraftCard({draft,state,busy,onConfirm,onDismiss}:{draft:NotificationDraft;state:State;busy:boolean;onConfirm:(id:string,text:string)=>void;onDismiss:()=>void}){
 const [contactId,setContactId]=useState(draft.contactIds.length===1?draft.contactIds[0]:''),[text,setText]=useState(draft.body);
 return <article className="notification-draft" data-draft-id={draft.id} aria-label={'待确认通知 '+draft.sender}>
  <div className="editor-heading"><h4>{draft.sender}{draft.group&&<small> · 群：{draft.group}</small>}</h4><span>{Math.round(draft.confidence*100)}% · {new Date(draft.capturedAt).toLocaleTimeString('zh-CN')}</span></div>
  <p className="notification-match">姓名匹配：{draft.warnings.some(warning=>warning.includes('相似姓名建议'))?'相似姓名建议（需人工确认），对应 '+(state.contacts.find(contact=>contact.id===draft.contactIds[0])?.name??'未匹配'):draft.contactIds.length===1?'对应 '+(state.contacts.find(contact=>contact.id===draft.contactIds[0])?.name??'已删除联系人'):draft.contactIds.length?'多位同名联系人，需选择':'未找到精确匹配'}{draft.extraction==='positioned'?' · 已按姓名位置提取正文':''}</p>
  {draft.warnings.map(warning=><p className="summary-warning" key={warning}>{warning}</p>)}
  <label>对应联系人<select aria-label="对应联系人" value={contactId} onChange={e=>setContactId(e.target.value)}><option value="">请选择联系人</option>{state.contacts.map(c=><option value={c.id} key={c.id}>{c.name} · {categoryLabel(c.category,state.pet.theme)}</option>)}</select></label>
  <label>核对通知正文<textarea aria-label="核对通知正文" value={text} rows={3} maxLength={5000} onChange={e=>setText(e.target.value)}/></label>
  <details><summary>查看原始识别正文</summary><p className="notification-raw">{draft.body}</p></details>
  <div className="editor-actions"><button className="primary" disabled={busy||!contactId||!text.trim()} onClick={()=>onConfirm(contactId,text)}>确认送达桌宠</button><button disabled={busy} onClick={onDismiss}>忽略这条</button></div>
 </article>;
}
