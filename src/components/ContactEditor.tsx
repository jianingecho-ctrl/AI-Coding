import {useState} from 'react';
import {messagePriorities,categories,entryIds,gagIds,personalEffectSchema,type Contact,type PersonalEffect,type State,type Asset} from '../lib/model';
import {editionCharacters,editionSkins,editionCardSkins,categoryLabel} from '../lib/editions';
import {characterLabels,entryLabels,gagLabels} from '../lib/effects';
import {EffectPreview} from './EffectPreview';
export function ContactEditor({contact,pet,assets,busy,onSave,onPreview}:{contact:Contact;pet:State['pet'];assets:Asset[];busy:boolean;onSave:(c:Contact)=>void;onPreview:(c:Contact)=>void}){
 const [draft,setDraft]=useState<Contact>(()=>({...contact,effects:personalEffectSchema.parse(contact.effects??{})}));
 const effects=draft.effects!;
 function update<K extends keyof PersonalEffect>(key:K,value:PersonalEffect[K]){setDraft(d=>({...d,effects:{...d.effects!,[key]:value}}));}
 return <section className="contact-editor" aria-label="个性效果编辑器"><div className="editor-heading"><div><span className="eyebrow">个人配置优先于类型默认</span><h3>{contact.name}的专属桌面效果</h3></div><span className="pill">实时预览</span></div>
 <div className="editor-layout"><form onSubmit={e=>{e.preventDefault();onSave({...draft,notificationNames:[...new Set((draft.notificationNames??[]).map(name=>name.trim()).filter(Boolean))]})}}>
 <label>收到消息的优先级<select aria-label="消息优先级" value={draft.messagePriority??'auto'} onChange={e=>setDraft(d=>({...d,messagePriority:e.target.value==='auto'?undefined:e.target.value as Contact['messagePriority']}))}><option value="auto">类别默认（领导最高，其他普通）</option>{messagePriorities.map(p=><option key={p}>{p}</option>)}</select><small>优先级更高的消息先出场；其他消息排队，关闭卡片后继续展示。回复或互动期间暂停插队。</small></label>
 <label>显示姓名<input aria-label="显示姓名" value={draft.name} onChange={e=>setDraft(d=>({...d,name:e.target.value}))} maxLength={40} required/></label>
 <label>通知姓名别名（每行一个）<textarea aria-label="通知姓名别名" rows={2} value={(draft.notificationNames??[]).join('\n')} onChange={e=>setDraft(d=>({...d,notificationNames:e.target.value.split('\n')}))} placeholder="例如：小陈 Chen"/><small>保存时按行去空白。匹配通知中的发送人，不匹配群名；同名需人工确认，最多 10 个别名。</small></label>
 <label>人物类型<select aria-label="人物类型" value={draft.category} onChange={e=>setDraft(d=>({...d,category:e.target.value as Contact['category']}))}>{!categories.includes(draft.category as typeof categories[number])&&<option value={draft.category}>{categoryLabel(draft.category,pet.theme)}</option>}{categories.map(c=><option key={c} value={c}>{categoryLabel(c,pet.theme)}</option>)}</select></label>
 <div className="field-grid">
 <label>消息人物<select aria-label="消息人物" value={effects.character} onChange={e=>update('character',e.target.value as PersonalEffect['character'])}><option value="auto">使用类型默认</option>{editionCharacters(pet.theme).map(id=><option key={id} value={id}>{characterLabels[id]}</option>)}</select></label>

 <label>进场方式<select aria-label="进场方式" value={effects.entry} onChange={e=>update('entry',e.target.value as PersonalEffect['entry'])}><option value="auto">使用类型默认</option>{entryIds.map(id=><option key={id} value={id}>{entryLabels[id]}</option>)}</select></label>
 <label>动画时长（秒）<input aria-label="动画时长（秒）" type="number" min="0.3" max="5" step="0.1" value={effects.duration??''} placeholder="留空使用默认" onChange={e=>update('duration',e.target.value?Number(e.target.value):null)}/><small>控制进场时长和待机/序列帧播放周期；GIF 使用素材本身速度。</small></label>
 <label>人物皮肤<select aria-label="人物皮肤" value={effects.characterSkin} onChange={e=>update('characterSkin',e.target.value as PersonalEffect['characterSkin'])}><option value="auto">跟随全局皮肤</option>{editionSkins(pet.theme).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
 <label>消息卡片皮肤<select aria-label="消息卡片皮肤" value={effects.cardSkin} onChange={e=>update('cardSkin',e.target.value as PersonalEffect['cardSkin'])}><option value="auto">使用类型默认</option>{editionCardSkins(pet.theme).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
 <label>搞笑特效<select aria-label="搞笑特效" value={effects.gag} onChange={e=>update('gag',e.target.value as PersonalEffect['gag'])}><option value="auto">使用类型默认</option>{gagIds.map(id=><option key={id} value={id}>{gagLabels[id]}</option>)}</select></label>
 </div>
 <label>自定义人物素材<select aria-label="自定义人物素材" value={effects.assetId??''} onChange={e=>update('assetId',e.target.value||null)}><option value="">使用内置人物</option>{assets.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select><small>在{pet.theme==='palace'?'宫廷人物':'人物设置'}中上传。静态图片只播放进场，GIF 和序列帧保留素材自带动作。</small></label>
 <label>出场台词<input aria-label="出场台词" value={effects.line} onChange={e=>update('line',e.target.value)} maxLength={60} placeholder="留空使用默认台词"/></label>
 <div className="editor-actions"><button className="primary" disabled={busy||!draft.name.trim()}>保存个性效果</button><button type="button" disabled={busy} onClick={()=>onPreview({...draft,notificationNames:draft.notificationNames?.map(name=>name.trim()).filter(Boolean)})}>播放桌面预览</button><button type="button" onClick={()=>setDraft(d=>({...d,effects:personalEffectSchema.parse({})}))}>恢复默认</button></div>
 </form><EffectPreview contact={draft} pet={pet}/></div></section>;
}
