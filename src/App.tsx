import {useEffect, useState, useRef, type CSSProperties} from 'react';
import {
  categories, defaultState, type State, type Message, type Contact, type Category, type CharacterSkin, type CharacterId,type InteractionKind,type AppInfo,type MessageQueueStatus,
} from './lib/model';
import {
  entryLabels, cardSkins, characterSkins, characterRoster, characterLabels, hasPersonalEffects, isKneeling, messageEffects, resolveEffects,
} from './lib/effects';
import {Character} from './components/Character';
import {MessageCard} from './components/MessageCard';
import {ContactEditor} from './components/ContactEditor';
import {EffectPreview} from './components/EffectPreview';
import {SceneEffects} from './components/SceneEffects';
import {AiSettings} from './components/AiSettings';
import {OceanBackdrop} from './components/OceanBackdrop';
import './ocean.css';
import {DemoPlayer,demoContacts} from './lib/demo';
import {PetPreferences} from './components/PetPreferences';
import {InteractionStats} from './components/InteractionStats';
import {PalaceBackdrop} from './components/PalaceBackdrop';
import {palaceRoster} from './lib/palace';
import {categoryLabel,editionCardSkins,editionSkins} from './lib/editions';
import {NotificationPanel} from './components/NotificationPanel';
import './notifications.css';
import {ProfileContext} from './lib/profile-context';
import {WeddingMusicSettings} from './components/WeddingMusicSettings';

export function App() {
  const [state, setState] = useState<State>(structuredClone(defaultState));
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [appInfo,setAppInfo]=useState<AppInfo|null>(null);
  useEffect(() => {
    if (!window.judge) {
      setError('请通过 Electron 启动应用：npm run dev。浏览器页面无法访问桌面功能。');
      return;
    }
    let active = true;
    const off = window.judge.onState(s => { if (active) setState(s); });
    const offProfile=window.judge.onProfile(value=>{if(active){setState(value.state);setAppInfo(value.info);setError('');}});
    Promise.all([window.judge.getAppInfo(),window.judge.getState()]).then(([info,s]) => {
      if (active) { setState(s);setAppInfo(info);setReady(true); }
    }).catch(e => setError(String(e)));
    return () => { active = false; off();offProfile(); };
  }, []);
  const petView = new URLSearchParams(location.search).get('view') === 'pet';
  useEffect(() => {
    document.body.classList.toggle('pet-window', petView);
    document.documentElement.classList.toggle('pet-window', petView);
  }, [petView]);
  if(!appInfo)return <p className="bootstrap-status">{error||'正在打开独立版小判官…'}</p>;
  if (petView) return <ProfileContext.Provider value={state.pet.theme}><Pet key={state.pet.theme} state={state} error={error}/></ProfileContext.Provider>;
  return <ProfileContext.Provider value={state.pet.theme}><Panel key={state.pet.theme} appInfo={appInfo} state={state} ready={ready} error={error} setError={setError}/></ProfileContext.Provider>;
}

function Pet({state, error}: {state: State; error: string}) {
  const [message, setMessage] = useState<Message | null>(null);
  const [action, setAction] = useState('idle');
  const [dismissed,setDismissed]=useState<Message|null>(null);
  const [reaction,setReaction]=useState<{kind:InteractionKind;key:number}|null>(null);
  const [entry, setEntry] = useState(0);
  const [queue,setQueue]=useState<MessageQueueStatus>({activeId:null,pending:[]});
  useEffect(()=>{let active=true;const off=window.judge.onMessageQueue(q=>{if(active)setQueue(q)});void window.judge.getMessageQueue().then(q=>{if(active)setQueue(q)});return()=>{active=false;off()}},[]);
  useEffect(() => window.judge?.onMessage(m => {
    setMessage(m);setDismissed(null);setReaction(null);
    setEntry(v => v + 1);
    setAction(messageEffects(m).action);
  }), []);
  useEffect(()=>window.judge?.onMessageCleared(()=>{setMessage(null);setAction('idle');setReaction(null);setEntry(v=>v+1)}),[]);
  useEffect(()=>{if(!window.judge)return;void window.judge.setPetExpanded(Boolean(message)).catch(console.error)},[Boolean(message)]);
  useEffect(()=>{if(!reaction)return;const timer=setTimeout(()=>setReaction(null),reaction.kind==='marry'?10500:reaction.kind==='kick'?2500:1200);return()=>clearTimeout(timer)},[reaction]);
  const effect = message ? messageEffects(message) : null;
  const character = effect?.character ?? state.pet.character;
  const canRestore=Boolean(dismissed&&!dismissed.preview&&state.history.some(m=>m.id===dismissed.id));
  return <main className="pet-stage" data-theme={state.pet.theme} style={{'--pet-scale':state.pet.scale} as CSSProperties}>
    <div className="pet-toolbar">
      <span className="drag-handle" title="按住拖动窗口">⠿ 拖动小判官</span>
      <button onClick={() => window.judge.openPanel()}>控制台</button>
      <button onClick={() => window.judge.hidePet()}>隐藏</button>
      <button title="退出应用" onClick={() => window.judge.quit()}>退出</button>
    </div>
    {error && <p className="error">{error}</p>}
    {queue.pending.length>0&&<div className="queue-chip" role="status">待展示 {queue.pending.length} 条 · 下一位：{queue.pending[0].name}（{queue.pending[0].priority}）</div>}
    <div key={entry} style={{'--entry-duration':(effect?.duration??1.2)+'s'} as CSSProperties} className={'pet-scene ' + (effect ? 'entry-' + effect.entry : '') + (effect?.entry==='slide' && isKneeling(effect.action) ? ' slide-kneel' : '')}>
      {effect && <SceneEffects gag={effect.gag} theme={effect.theme}/>}
      {message && <MessageCard key={message.id} state={state} message={state.history.find(m=>m.id===message.id)??message}
        onClose={() => {setDismissed(message);void window.judge.advanceMessage(message.id)}}
        onIgnore={() => {setDismissed(message);void window.judge.advanceMessage(message.id)}}
        onHold={hold=>{void window.judge.holdMessage(message.id,hold).catch(()=>{})}}
        onInteraction={kind=>setReaction(r=>({kind,key:(r?.key??0)+1}))}/>}
      {!message&&!canRestore && <div className="idle-bubble">
        {state.pet.theme==='palace'?'本宫待命，摸鱼随缘。':action === 'fish' ? '带薪摸鱼，也是努力。' : action === 'yawn' ? '不是我困，是班太长。' : '打工待命，摸鱼在线。'}
      </div>}
      {dismissed&&!message&&canRestore&&<button className="restore-chip" onClick={()=>{void window.judge.restoreMessage(dismissed.id)}}>重新查看 · {dismissed.contact.name}</button>}
      <div key={reaction?.key??0} className={"pet-drag "+(reaction?'reaction-'+reaction.kind:'')} title="按住人物拖动窗口">
        <Character character={character} action={action} name={state.pet.name} color={state.pet.color} skin={effect?.characterSkin ?? state.pet.skin} duration={effect?.duration} assetId={effect?.assetId ?? (!message?state.pet.assetId:null)}/>
        <span className="pet-name">{state.pet.name} · {characterLabels[character]}</span>
      </div>
    </div>
  </main>;
}

function Panel({appInfo,state, ready, error, setError}: {
  appInfo:AppInfo;state: State; ready: boolean; error: string; setError: (s: string) => void;
}) {
  const [tab, setTab] = useState('测试面板');
  const [selected, setSelected] = useState('bigSilly');
  const [editingId, setEditingId] = useState(state.contacts[0]?.id ?? '');
  const [text, setText] = useState('麻烦明天下午3点前整理本周项目进度，发给我确认。收到请回复，谢谢。');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [last, setLast] = useState<Message | null>(null);
  const demoPlayer=useRef(new DemoPlayer());
  const [demoRunning,setDemoRunning]=useState(false);
  const [demoStep,setDemoStep]=useState(0);
  useEffect(()=>{const player=demoPlayer.current;const off=window.judge?.onMessageCleared(()=>setLast(null));return()=>{player.stop();off?.()}},[]);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<Category>('NPC同事');
  const [skinDraft, setSkinDraft] = useState<CharacterSkin>(state.pet.skin);
  const [characterDraft, setCharacterDraft] = useState<CharacterId>(state.pet.character);
  useEffect(() => {
    if (!state.contacts.some(c => c.id === selected)) setSelected(state.contacts[0]?.id ?? '');
    if (!state.contacts.some(c => c.id === editingId)) setEditingId(state.contacts[0]?.id ?? '');
  }, [state.contacts, selected, editingId]);
  useEffect(() => { setSkinDraft(state.pet.skin); }, [state.pet.skin]);
  useEffect(() => { setCharacterDraft(state.pet.character); }, [state.pet.character]);

  async function execute(task: () => Promise<unknown>, success: string) {
    setBusy(true); setError(''); setNotice('');
    try { await task(); setNotice(success); }
    catch (e) { setError('操作失败：' + String(e)); }
    finally { setBusy(false); }
  }
  function save(contacts: Contact[], pet = state.pet) { return window.judge.saveSettings({contacts, pet}); }
  const chosen = state.contacts.find(c => c.id === selected);
  const editing = state.contacts.find(c => c.id === editingId);
  const palace=state.pet.theme==='palace',roster=palace?palaceRoster:characterRoster;
  const skins=editionSkins(appInfo.edition),cards=editionCardSkins(appInfo.edition);
  const tabNames:Record<string,string>=palace?{'测试面板':'传话演示','飞书通知':'飞鸽传书','联系人':'宫中名册','消息历史':'往来书信','互动统计':'互动战绩','人物设置':'宫廷人物'}:{};
  function preview(contact: Contact) {
    void execute(() => window.judge.previewContact(contact), '桌面预览已播放，未写入消息历史。');
  }

  async function playDemo(){
    setBusy(true);setDemoRunning(true);setNotice('');setError('');
    try{const finished=await demoPlayer.current.play(c=>window.judge.previewContact(c),index=>setDemoStep(index));setNotice(finished?'七类人物演示完成，未写入历史，未调用 AI。':'演示已停止。');}
    catch(e){setError('演示失败：'+String(e));}
    finally{setBusy(false);setDemoRunning(false);setDemoStep(0);}
  }
  function stopDemo(){demoPlayer.current.stop();void window.judge.clearDisplayedMessage().catch(e=>setError(String(e)));}

  return <main className={'dashboard theme-'+state.pet.theme}>
    {palace?<PalaceBackdrop/>:<OceanBackdrop/>}
    <aside>
      <div className="brand-icon">{palace?'宫':'海'}</div>
      <h1>职场小判官<span>{palace?'甄嬛传档案 · 本宫替你判':'比奇堡档案 · 每人各有戏'}</span></h1>
      <nav>{['测试面板','飞书通知', '联系人', '消息历史','互动统计', '人物设置'].map(t =>
        <button key={t} data-tab={t} className={tab === t ? 'active' : ''} onClick={() => {if(demoRunning)stopDemo();setTab(t);setNotice('');}}>{tabNames[t]??t}</button>
      )}</nav>
      <div className="aside-bottom"><span className="status-dot"/>消息助手 · 本地运行<p>{appInfo.label} / {appInfo.version}</p></div>
    </aside>

    <section className="workspace">
      <header><div><span className="eyebrow">{palace?'今日入宫上班，差事也要有排面':'职场有点苦，角色有点逗'}</span><h2>{tabNames[tab]??tab}</h2></div>
        <button onClick={()=>window.judge.showPet()}>显示桌宠</button><span className="pill">{tab==='飞书通知'?'通知：本机规则解析':state.ai.enabled ? (state.ai.provider==='ollama'?'本地 AI 模式':'在线 AI 模式') : '离线规则模式'}</span></header>
      {error && <p role="alert" className="error">{error}</p>}
      {notice && <p role="status" className="notice">{notice}</p>}
      <div className="edition-banner"><strong>{appInfo.name} · {palace?'甄嬛传':'比奇堡'}</strong><span>人物、联系人、消息、互动和音乐仅保存在当前档案</span></div>
      {appInfo.migratedLegacy&&<p className="notice">旧版配置与记录已复制到当前档案，原目录保留。AI 当前关闭，请在当前档案重新设置密钥。</p>}

      {tab === '测试面板' && <>
        {appInfo.canSwitch&&<section className="theme-switcher" aria-label="主题档案切换"><div><h3>选择桌宠世界</h3><p>切换整套控制台和桌宠。两套联系人、历史、互动、人物素材和音乐分别保存；切换会暂停通知监测。</p></div><div className="theme-choices">{(['ocean','palace'] as const).map(theme=><button key={theme} disabled={busy||theme===state.pet.theme} aria-pressed={theme===state.pet.theme} onClick={()=>void execute(()=>window.judge.switchProfile(theme),'')}><strong>{theme==='ocean'?'比奇堡版':'甄嬛传版'}</strong><small>{theme===state.pet.theme?'正在使用':'切换到此档案'}</small></button>)}</div></section>}
        <div className="intro">
          <div><span className="eyebrow">{palace?'甄嬛传 · 七位原创 Q 版宫廷人物':'七类人物，各有进场剧本'}</span><h3>{palace?'宫里来消息，本宫替你捋明白。':'谁来消息，谁的专属角色出场。'}</h3>
            <p>{palace?'皇上、甄嬛、华妃等七位人物，带着各自的台词和进场亮相。':'同一条消息，换个人发，就是另一出戏。'}</p>
            <div className="category-pills">{categories.map(c =>
              <span key={c}>{categoryLabel(c,appInfo.edition)} · {entryLabels[resolveEffects({id: 'sample', name: c, category: c}).entry]}</span>
            )}</div>
          </div>
          <Character character={chosen ? resolveEffects(chosen, state.pet).character : state.pet.character} action={chosen ? resolveEffects(chosen, state.pet).action : 'idle'} skin={chosen ? resolveEffects(chosen, state.pet).characterSkin : state.pet.skin} color={state.pet.color} assetId={chosen?resolveEffects(chosen,state.pet).assetId:null}/>
        </div>
        <section className="demo-controls"><div><h3>{palace?'一键演示七位宫廷人物':'一键演示七类人物'}</h3><p>按默认进场依次播放，不修改联系人，不记录历史，不调用 AI。</p>
          {demoRunning&&<p role="status">正在演示 {demoStep} / 7 · {palace?palaceRoster[Math.max(0,demoStep-1)].name:demoContacts[Math.max(0,demoStep-1)].category}</p>}</div>
          <div><button disabled={!ready||busy} onClick={()=>void playDemo()}>一键播放七类人物</button>{demoRunning&&<button onClick={stopDemo}>停止演示</button>}</div></section>
        <div className="privacy-note"><strong>模拟消息测试</strong><p>此页只处理手动输入的模拟数据。识别桌面可见通知请进入「{palace?'飞鸽传书':'飞书通知'}」，该功能仅在主动开始后读取选区。</p>
          <p>{!state.ai.enabled?'AI 分析已关闭：仅本地规则解析，消息不外发。':state.ai.provider==='ollama'?'启用本机 Ollama：仅发送当前消息正文到本机 127.0.0.1:11434。':'启用在线 AI：发送当前模拟消息正文、模型参数和摘要提示到配置的服务；不上传联系人名单、消息历史、回复记录或人物素材。正文中写入的个人信息也会随正文发送。'}</p>
          {state.ai.enabled&&<button disabled={busy} onClick={()=>void execute(()=>window.judge.saveSettings({contacts:state.contacts,pet:state.pet,ai:{...state.ai,enabled:false}}),'AI 分析已关闭，后续消息仅使用本地规则。')}>关闭 AI 分析</button>}</div>
        <form onSubmit={e => {
          e.preventDefault();
          void execute(async () => setLast(await window.judge.sendMessage({contactId: selected, text})), '消息已送达桌宠，打开桌宠窗口查看动画。');
        }}>
          <label>消息来自<select value={selected} onChange={e => setSelected(e.target.value)} disabled={busy}>
            {state.contacts.map(c => <option key={c.id} value={c.id}>{c.name} · {categoryLabel(c.category,appInfo.edition)}</option>)}
          </select></label>
          <label>模拟飞书消息<textarea value={text} onChange={e => setText(e.target.value)} maxLength={5000} rows={4}
            placeholder="输入消息内容，如：请明天18点前提交周报，收到请回复。"/></label>
          <div className="form-footer"><small>{text.length} / 5000 · 不会发送给真实联系人</small>
            <button className="primary" disabled={!ready || busy || !text.trim() || !selected}>{busy ? '正在送达…' : '发送测试消息 ↗'}</button></div>
        </form>
        {chosen && <div className="selected-effect">
          <div><h3>{chosen.name}的出场剧本</h3><p className="description">人物、进场、素材、时长和皮肤都可以单独设置。</p>
            <button disabled={!ready || busy} onClick={() => preview(chosen)}>播放桌面预览</button>
            <button onClick={() => { setEditingId(chosen.id); setTab('联系人'); }}>设置这个人的效果</button></div>
          <EffectPreview contact={chosen} pet={state.pet}/>
        </div>}
        {last && <div className="preview"><h3>最近一次判读</h3><MessageCard key={last.id} state={state} message={state.history.find(m=>m.id===last.id)??last}/></div>}
        <p className="footnote">默认规则解析，未调用 AI。可选本机 Ollama 或在线 AI；未配置密钥或服务不可用时明确提示降级。相对日期保留原文，请核对消息。</p>
      </>}

      {tab==='飞书通知'&&<NotificationPanel state={state}/>}

      {tab === '联系人' && <>
        <p className="description">先选择发消息的人，再指定专属角色、进场方式、卡片皮肤、搞笑特效和台词，人物动作统一保持轻微晃动。历史保留收到消息时的效果。</p>
        <div className="contacts">{state.contacts.map(c => {
          const effect = resolveEffects(c, state.pet);
          return <div className={'contact-row ' + (editingId === c.id ? 'selected' : '')} key={c.id}>
            <div className="avatar">{c.name.slice(0, 1)}</div>
            <button className="contact-name" aria-label={'自定义' + c.name + '的效果'} onClick={() => setEditingId(c.id)}>
              <strong>{c.name}</strong><small>{characterLabels[effect.character]} · {hasPersonalEffects(c) ? '个性剧本' : '类别默认'}</small>
            </button>
            <select aria-label={c.name + '的类别'} value={c.category} disabled={!ready || busy} onChange={e =>
              void execute(() => save(state.contacts.map(v => v.id === c.id ? {...v, category: e.target.value as Category} : v)), '联系人类别已保存。')
            }>{!categories.includes(c.category as typeof categories[number])&&<option value={c.category}>{categoryLabel(c.category,appInfo.edition)}</option>}{categories.map(t => <option key={t} value={t}>{categoryLabel(t,appInfo.edition)}</option>)}</select>
            <button disabled={!ready || busy} onClick={() => {
              if (confirm('删除联系人「' + c.name + '」？已有消息历史会保留。'))
                void execute(() => save(state.contacts.filter(v => v.id !== c.id)), '联系人已删除。');
            }}>删除</button>
          </div>;
        })}</div>
        {editing && <ContactEditor key={JSON.stringify(editing)} contact={editing} pet={state.pet} assets={state.assets} busy={!ready || busy}
          onSave={draft => void execute(() => save(state.contacts.map(c => c.id === draft.id ? draft : c)), '个性效果已保存。')}
          onPreview={preview}/>}
        <form className="add-contact" onSubmit={e => {
          e.preventDefault();
          void execute(async () => {
            const id = crypto.randomUUID();
            await save([...state.contacts, {id, name: newName.trim(), category: newCategory}]);
            setNewName(''); setEditingId(id);
          }, '联系人已添加，可以继续设置专属效果。');
        }}>
          <label>联系人姓名<input value={newName} onChange={e => setNewName(e.target.value)} maxLength={40} placeholder="输入同事姓名"/></label>
          <label>类别<select aria-label="类别" value={newCategory} onChange={e => setNewCategory(e.target.value as Category)}>{categories.map(c => <option key={c} value={c}>{categoryLabel(c,appInfo.edition)}</option>)}</select></label>
          <button className="primary" disabled={busy || !ready || !newName.trim() || state.contacts.length >= 100}>添加联系人</button>
        </form>
      </>}

      {tab === '消息历史' && <>
        <div className="history-top"><p>仅保存在本机 · 最近 200 条 · 共 {state.history.length} 条</p>
          <button disabled={busy || !state.history.length} onClick={() => {
            if (confirm('确定清空所有本地消息历史？此操作无法撤销。'))
              void execute(() => window.judge.clearHistory(), '历史已清空。');
          }}>清空历史</button></div>
        {state.history.length ? state.history.map(m => <div className="history-item" key={m.id}>
          <time>{new Date(m.createdAt).toLocaleString('zh-CN')}</time><button onClick={()=>void execute(()=>window.judge.restoreMessage(m.id),'历史消息已恢复到桌面。')}>恢复到桌面</button><MessageCard state={state} message={m}/>
        </div>) : <div className="empty">还没有消息。去{palace?'传话演示':'测试面板'}让桌宠接个活吧。</div>}
      </>}

      {tab==='互动统计'&&<InteractionStats state={state} busy={busy} onClear={()=>{if(confirm('确定清空全部本地互动统计（包含之前日期）？消息历史会保留。'))void execute(()=>window.judge.clearInteractions(),'互动统计已清空。')}}/>}

      {tab === '人物设置' && <>
        <WeddingMusicSettings state={state}/>
        <PetPreferences pet={state.pet} busy={!ready||busy} onSave={preferences=>void execute(()=>save(state.contacts,{...state.pet,...preferences}),'尺寸与音效已保存。')}/>
        <div className="settings-title"><div><h3>{palace?'请一位宫廷人物，陪你批阅差事。':'选个待机角色，给每个人安排一张脸。'}</h3><p className="description">{palace?'甄嬛传档案只提供七位原创 Q 版宫廷人物。':'比奇堡档案提供海洋人物与旧版骆驼。'}这里选择没有消息时的默认角色；来消息时使用联系人的角色，关闭卡片后恢复待机角色。联系人个人设置优先。</p></div></div>
        <div className="character-gallery" role="group" aria-label="七类消息人物">{roster.map(c =>
          <button type="button" className={'character-choice '+(characterDraft===c.id?'selected':'')} key={c.id}
            aria-label={c.name} aria-pressed={characterDraft===c.id} onClick={()=>setCharacterDraft(c.id)}>
            <Character character={c.id}/><strong>{c.name}</strong><small>{c.description}</small>
          </button>
        )}</div>
        {!palace&&<details className="legacy-character"><summary>保留旧版骆驼</summary>
          <button type="button" aria-pressed={characterDraft==='camel'} onClick={()=>setCharacterDraft('camel')}>选择连帽衫骆驼</button>
        <div className="skin-gallery" role="group" aria-label="默认人物皮肤">{characterSkins.map(s =>
          <button key={s.id} type="button" className={'skin-choice ' + (skinDraft === s.id ? 'selected' : '')} aria-pressed={skinDraft === s.id} aria-label={s.name} onClick={() => {setSkinDraft(s.id);setCharacterDraft('camel');}}>
            <Character character="camel" skin={s.id} color={state.pet.color}/><strong>{s.name}</strong><small>{s.description}</small>
          </button>
        )}</div>
        </details>}
        <form key={state.pet.name + '-' + state.pet.color} onSubmit={e => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          void execute(() => save(state.contacts, {...state.pet,name: String(data.get('name')).trim(), color: String(data.get('color')) as State['pet']['color'], skin: skinDraft, character:characterDraft,assetId:String(data.get('assetId'))||null,alwaysOnTop:data.get('alwaysOnTop')==='on'}), '人物设置已保存。');
        }}>
          <label>小判官昵称<input name="name" defaultValue={state.pet.name} required maxLength={20}/></label>
          {!palace?<label>工服颜色<select name="color" defaultValue={state.pet.color}>{['薄荷绿', '蜜桃粉', '奶油黄'].map(c => <option key={c}>{c}</option>)}</select>
            <small>工服颜色用于旧版骆驼；原创人物使用下面的皮肤配色。</small></label>:<input type="hidden" name="color" value={state.pet.color}/>}
          <label>默认人物皮肤<select value={skinDraft} onChange={e=>setSkinDraft(e.target.value as CharacterSkin)}>{skins.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
          <label>待机自定义素材<select name="assetId" defaultValue={state.pet.assetId??''}><option value="">使用内置人物</option>{state.assets.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
          <label className="checkbox-label"><input name="alwaysOnTop" type="checkbox" defaultChecked={state.pet.alwaysOnTop}/>桌面窗口置顶</label>
          <button className="primary" disabled={!ready || busy}>保存人物设置</button>
        </form>
        <div className="card-skin-samples">{cards.map(s => <div key={s.id} className={'preview-card card-' + s.id}><small>消息卡片皮肤</small><p>{s.name}</p></div>)}</div>
        <p className="description">拖动人物或顶部拖动区移动窗口。通知按联系人优先级展示，关闭卡片后继续显示下一条；回复或互动期间暂停插队。关闭控制台不会退出桌宠。</p>
        <section className="asset-library"><h3>自定义人物素材</h3><p className="description">上传 PNG / JPG / WebP 静态图，GIF 动画，或一次选择多张图片作为序列帧（按文件名数字排序）。素材复制到本版，可在每个联系人或待机设置中选择。静态图片不会自动生成动作。</p>
        <button disabled={!ready||busy} onClick={()=>void execute(()=>window.judge.importAsset(),'素材选择已完成，上传成功的素材显示在下方。')}>上传图片 / GIF / 序列帧</button>
        <div className="asset-grid">{state.assets.map(a=><div className="asset-item" key={a.id}><Character character={palace?'palace_zhenhuan':'npc'} assetId={a.id}/><strong>{a.name}</strong><small>{a.kind==='sequence'?'序列帧 · '+a.files.length+' 帧':a.kind==='gif'?'GIF 动画':'静态图片'}</small></div>)}</div></section>
        <AiSettings key={JSON.stringify(state.ai)} state={state} busy={!ready||busy} execute={(task,success)=>void execute(task,success)}/>
        <div className="editor-actions"><button onClick={()=>window.judge.showPet()}>显示桌宠</button><button onClick={()=>window.judge.hidePet()}>隐藏桌宠</button></div>
        <button className="quit-button" onClick={() => window.judge.quit()}>退出{appInfo.name}</button>
      </>}
    </section>
  </main>;
}
