import {useEffect, useState} from 'react';
import {
  categories, defaultState, type State, type Message, type Contact, type Category, type CharacterSkin,
} from './lib/model';
import {
  actionLabels, cardSkins, characterSkins, hasPersonalEffects, isKneeling, messageEffects, resolveEffects,
} from './lib/effects';
import {Character} from './components/Character';
import {MessageCard} from './components/MessageCard';
import {ContactEditor} from './components/ContactEditor';
import {EffectPreview} from './components/EffectPreview';
import {SceneEffects} from './components/SceneEffects';

export function App() {
  const [state, setState] = useState<State>(structuredClone(defaultState));
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!window.judge) {
      setError('请通过 Electron 启动应用：npm run dev。浏览器页面无法访问桌面功能。');
      return;
    }
    let active = true;
    const off = window.judge.onState(s => { if (active) setState(s); });
    window.judge.getState().then(s => {
      if (active) { setState(s); setReady(true); }
    }).catch(e => setError(String(e)));
    return () => { active = false; off(); };
  }, []);
  const petView = new URLSearchParams(location.search).get('view') === 'pet';
  useEffect(() => {
    document.body.classList.toggle('pet-window', petView);
    document.documentElement.classList.toggle('pet-window', petView);
  }, [petView]);
  if (petView) return <Pet state={state} error={error}/>;
  return <Panel state={state} ready={ready} error={error} setError={setError}/>;
}

function Pet({state, error}: {state: State; error: string}) {
  const [message, setMessage] = useState<Message | null>(null);
  const [action, setAction] = useState('idle');
  const [entry, setEntry] = useState(0);
  useEffect(() => window.judge?.onMessage(m => {
    setMessage(m);
    setEntry(v => v + 1);
    setAction(messageEffects(m).action);
  }), []);
  useEffect(() => {
    if (message) return;
    const actions = ['idle', 'fish', 'yawn'];
    let index = 0;
    const timer = setInterval(() => {
      index = (index + 1) % actions.length;
      setAction(actions[index]);
    }, 5000);
    return () => clearInterval(timer);
  }, [message]);
  const effect = message ? messageEffects(message) : null;
  return <main className="pet-stage">
    <div className="pet-toolbar">
      <span className="drag-handle" title="按住拖动窗口">⠿ 拖动小判官</span>
      <button onClick={() => window.judge.openPanel()}>控制台</button>
      <button title="退出应用" onClick={() => window.judge.quit()}>退出</button>
    </div>
    {error && <p className="error">{error}</p>}
    <div key={entry} className={'pet-scene ' + (effect ? 'entry-' + effect.entry : '') + (effect && isKneeling(effect.action) ? ' slide-kneel' : '')}>
      {effect && <SceneEffects gag={effect.gag}/>}
      {message && <MessageCard key={message.id} message={message}
        onClose={() => { setMessage(null); setAction('idle'); }}
        onStay={() => setAction(effect!.action)}/>}
      {!message && <div className="idle-bubble">
        {action === 'fish' ? '驼峰装工作，脑子装摸鱼。' : action === 'yawn' ? '不是驼困了，是班太长了。' : '工资到位，驼峰归位。'}
      </div>}
      <div className="pet-drag" title="按住骆驼拖动窗口">
        <Character action={action} name={state.pet.name} color={state.pet.color} skin={effect?.characterSkin ?? state.pet.skin}/>
        <span className="pet-name">{state.pet.name} · 工位驼</span>
      </div>
    </div>
  </main>;
}

function Panel({state, ready, error, setError}: {
  state: State; ready: boolean; error: string; setError: (s: string) => void;
}) {
  const [tab, setTab] = useState('测试面板');
  const [selected, setSelected] = useState('annoying');
  const [editingId, setEditingId] = useState(state.contacts[0]?.id ?? '');
  const [text, setText] = useState('麻烦明天下午3点前整理本周项目进度，发给我确认。收到请回复，谢谢。');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [last, setLast] = useState<Message | null>(null);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<Category>('普通同事');
  const [skinDraft, setSkinDraft] = useState<CharacterSkin>(state.pet.skin);
  useEffect(() => {
    if (!state.contacts.some(c => c.id === selected)) setSelected(state.contacts[0]?.id ?? '');
    if (!state.contacts.some(c => c.id === editingId)) setEditingId(state.contacts[0]?.id ?? '');
  }, [state.contacts, selected, editingId]);
  useEffect(() => { setSkinDraft(state.pet.skin); }, [state.pet.skin]);

  async function execute(task: () => Promise<unknown>, success: string) {
    setBusy(true); setError(''); setNotice('');
    try { await task(); setNotice(success); }
    catch (e) { setError('操作失败：' + String(e)); }
    finally { setBusy(false); }
  }
  function save(contacts: Contact[], pet = state.pet) { return window.judge.saveSettings({contacts, pet}); }
  const chosen = state.contacts.find(c => c.id === selected);
  const editing = state.contacts.find(c => c.id === editingId);
  function preview(contact: Contact) {
    void execute(() => window.judge.previewContact(contact), '桌面预览已播放，未写入消息历史。');
  }

  return <main className="dashboard">
    <aside>
      <div className="brand-icon">判</div>
      <h1>职场小判官<span>驼得起工作，放得下包袱</span></h1>
      <nav>{['测试面板', '联系人', '消息历史', '人物设置'].map(t =>
        <button key={t} className={tab === t ? 'active' : ''} onClick={() => { setTab(t); setNotice(''); }}>{t}</button>
      )}</nav>
      <div className="aside-bottom"><span className="status-dot"/>模拟飞书 · 本地运行<p>圆润连帽驼 / 0.3.0</p></div>
    </aside>

    <section className="workspace">
      <header><div><span className="eyebrow">职场有点苦，驼驼有点逗</span><h2>{tab}</h2></div>
        <span className="pill">{state.ai.enabled ? '本地 AI 模式' : '离线规则模式'}</span></header>
      {error && <p role="alert" className="error">{error}</p>}
      {notice && <p role="status" className="notice">{notice}</p>}

      {tab === '测试面板' && <>
        <div className="intro">
          <div><span className="eyebrow">一只很会看人下菜的工位驼</span><h3>驼峰不大，职场戏挺多。</h3>
            <p>同一条消息，换个人发，就是另一出戏。</p>
            <div className="category-pills">{categories.map(c =>
              <span key={c}>{c} · {actionLabels[resolveEffects({id: 'sample', name: c, category: c}).action]}</span>
            )}</div>
          </div>
          <Character action={chosen ? resolveEffects(chosen, state.pet).action : 'idle'} skin={chosen ? resolveEffects(chosen, state.pet).characterSkin : state.pet.skin} color={state.pet.color}/>
        </div>
        <form onSubmit={e => {
          e.preventDefault();
          void execute(async () => setLast(await window.judge.sendMessage({contactId: selected, text})), '消息已送达桌宠，打开桌宠窗口查看动画。');
        }}>
          <label>消息来自<select value={selected} onChange={e => setSelected(e.target.value)} disabled={busy}>
            {state.contacts.map(c => <option key={c.id} value={c.id}>{c.name} · {c.category}</option>)}
          </select></label>
          <label>模拟飞书消息<textarea value={text} onChange={e => setText(e.target.value)} maxLength={5000} rows={4}
            placeholder="输入消息内容，如：请明天18点前提交周报，收到请回复。"/></label>
          <div className="form-footer"><small>{text.length} / 5000 · 不会发送给真实联系人</small>
            <button className="primary" disabled={!ready || busy || !text.trim() || !selected}>{busy ? '正在送达…' : '发送并触发动画 ↗'}</button></div>
        </form>
        {chosen && <div className="selected-effect">
          <div><h3>{chosen.name}的出场剧本</h3><p className="description">人物、台词、卡片与特效都可以在联系人中单独设置。</p>
            <button disabled={!ready || busy} onClick={() => preview(chosen)}>播放桌面预览</button>
            <button onClick={() => { setEditingId(chosen.id); setTab('联系人'); }}>设置这个人的效果</button></div>
          <EffectPreview contact={chosen} pet={state.pet}/>
        </div>}
        {last && <div className="preview"><h3>最近一次判读</h3><MessageCard key={last.id} message={last}/></div>}
        <p className="footnote">默认离线规则摘要，可启用本机 Ollama AI；AI 不可用时明确提示降级。相对日期保留原文，请核对消息。</p>
      </>}

      {tab === '联系人' && <>
        <p className="description">先选择类别，再给每个人定制动作、进场方式、双层皮肤、搞笑特效和吐槽台词。历史保留收到消息时的效果。</p>
        <div className="contacts">{state.contacts.map(c => {
          const effect = resolveEffects(c, state.pet);
          return <div className={'contact-row ' + (editingId === c.id ? 'selected' : '')} key={c.id}>
            <div className="avatar">{c.name.slice(0, 1)}</div>
            <button className="contact-name" aria-label={'自定义' + c.name + '的效果'} onClick={() => setEditingId(c.id)}>
              <strong>{c.name}</strong><small>{hasPersonalEffects(c) ? '个性剧本' : '类别默认'} · {actionLabels[effect.action]}</small>
            </button>
            <select aria-label={c.name + '的类别'} value={c.category} disabled={!ready || busy} onChange={e =>
              void execute(() => save(state.contacts.map(v => v.id === c.id ? {...v, category: e.target.value as Category} : v)), '联系人类别已保存。')
            }>{categories.map(t => <option key={t}>{t}</option>)}</select>
            <button disabled={!ready || busy} onClick={() => {
              if (confirm('删除联系人「' + c.name + '」？已有消息历史会保留。'))
                void execute(() => save(state.contacts.filter(v => v.id !== c.id)), '联系人已删除。');
            }}>删除</button>
          </div>;
        })}</div>
        {editing && <ContactEditor key={JSON.stringify(editing)} contact={editing} pet={state.pet} busy={!ready || busy}
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
          <label>类别<select aria-label="类别" value={newCategory} onChange={e => setNewCategory(e.target.value as Category)}>{categories.map(c => <option key={c}>{c}</option>)}</select></label>
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
          <time>{new Date(m.createdAt).toLocaleString('zh-CN')}</time><MessageCard message={m}/>
        </div>) : <div className="empty">还没有消息。去测试面板让工位驼接个活吧。</div>}
      </>}

      {tab === '人物设置' && <>
        <div className="settings-title"><div><h3>换套皮肤，换个上班心情。</h3><p className="description">这是待机和默认人物皮肤。联系人的专属皮肤优先，关闭消息后恢复这里的设置。</p></div></div>
        <div className="skin-gallery" role="group" aria-label="默认人物皮肤">{characterSkins.map(s =>
          <button key={s.id} type="button" className={'skin-choice ' + (skinDraft === s.id ? 'selected' : '')} aria-pressed={skinDraft === s.id} aria-label={s.name} onClick={() => setSkinDraft(s.id)}>
            <Character skin={s.id} color={state.pet.color}/><strong>{s.name}</strong><small>{s.description}</small>
          </button>
        )}</div>
        <div className="pose-gallery" role="group" aria-label="站姿与跪姿对比">
          {(['idle', 'kneel', 'panic'] as const).map((pose, index) => <div className="pose-sample" key={pose}>
            <Character action={pose} skin={skinDraft} color={state.pet.color}/>
            <strong>{['元气站姿', '双膝跪地举牌', '崩溃跪地举牌'][index]}</strong>
            <small>{['大圆眼、护目镜、连帽衫', '折腿、双膝落地、身体下沉', '保留跪姿，再加发抖和汗滴'][index]}</small>
          </div>)}
        </div>
        <form key={state.pet.name + '-' + state.pet.color} onSubmit={e => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          void execute(() => save(state.contacts, {name: String(data.get('name')).trim(), color: String(data.get('color')) as State['pet']['color'], skin: skinDraft}), '人物设置已保存。');
        }}>
          <label>小判官昵称<input name="name" defaultValue={state.pet.name} required maxLength={20}/></label>
          <label>工服颜色<select name="color" defaultValue={state.pet.color}>{['薄荷绿', '蜜桃粉', '奶油黄'].map(c => <option key={c}>{c}</option>)}</select>
            <small>沙漠社畜使用此工服颜色；其他皮肤使用各自的服饰配色。</small></label>
          <button className="primary" disabled={!ready || busy}>保存人物设置</button>
        </form>
        <div className="card-skin-samples">{cardSkins.map(s => <div key={s.id} className={'preview-card card-' + s.id}><small>消息卡片皮肤</small><p>{s.name}</p></div>)}</div>
        <p className="description">拖动骆驼或顶部拖动区移动窗口。消息持续显示，直到关闭或下一条消息到来。关闭控制台不会退出桌宠。</p>
        <form className="ai-settings" key={state.ai.enabled + '-' + state.ai.model} onSubmit={e => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          void execute(() => window.judge.saveSettings({contacts: state.contacts, pet: state.pet, ai: {
            enabled: data.get('enabled') === 'on', model: String(data.get('model')).trim(),
          }}), '摘要模式已保存。');
        }}><h3>本地 AI 摘要</h3><p className="description">使用本机 Ollama（127.0.0.1:11434），消息仅发送到本机。先运行 ollama pull qwen2.5:3b；安装方式见说明文档。</p>
          <label className="checkbox-label"><input type="checkbox" name="enabled" defaultChecked={state.ai.enabled}/>启用本地 AI（失败时降级并提示）</label>
          <label>Ollama 模型名称<input name="model" defaultValue={state.ai.model} required maxLength={80}/></label>
          <button className="primary" disabled={!ready || busy}>保存摘要模式</button>
        </form>
        <button className="quit-button" onClick={() => window.judge.quit()}>退出职场小判官</button>
      </>}
    </section>
  </main>;
}
