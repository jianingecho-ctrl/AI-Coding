import {useState} from 'react';
import {categories,entryIds,gagIds,personalEffectSchema,type Contact,type PersonalEffect,type State} from '../lib/model';
import {actionLabels,allowedActions,cardSkins,characterSkins,entryLabels,gagLabels,isKneeling,resolveEffects} from '../lib/effects';
import {EffectPreview} from './EffectPreview';

export function ContactEditor({contact,pet,busy,onSave,onPreview}:{
 contact:Contact;pet:State['pet'];busy:boolean;
 onSave:(contact:Contact)=>void;onPreview:(contact:Contact)=>void;
}){
 const [draft,setDraft]=useState<Contact>(()=>{
  const effects=personalEffectSchema.parse(contact.effects??{});
  if(effects.action!=='auto'&&!allowedActions(contact.category).includes(effects.action))effects.action='auto';
  return {...contact,effects};
 });
 const effects=draft.effects!;
 const resolved=resolveEffects(draft,pet);
 function update<K extends keyof PersonalEffect>(key:K,value:PersonalEffect[K]){setDraft(v=>({...v,effects:{...v.effects!,[key]:value}}));}
 return <section className="contact-editor" aria-label="个性效果编辑器">
  <div className="editor-heading"><div><span className="eyebrow">同一类别，也能有不同待遇</span><h3>{contact.name}的专属桌面效果</h3></div><span className="pill">实时预览</span></div>
  <div className="editor-layout"><form onSubmit={e=>{e.preventDefault();onSave(draft);}}>
   <label>显示姓名<input aria-label="显示姓名" value={draft.name} onChange={e=>setDraft(v=>({...v,name:e.target.value}))} required maxLength={40}/></label>
   <label>联系人类别<select aria-label="联系人类别" value={draft.category} onChange={e=>{const category=e.target.value as Contact['category'];setDraft(v=>({...v,category,effects:{...v.effects!,action:v.effects!.action!=='auto'&&!allowedActions(category).includes(v.effects!.action)?'auto':v.effects!.action}}));}}>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
   <div className="field-grid"><label>人物动作<select aria-label="人物动作" value={effects.action} onChange={e=>update('action',e.target.value as PersonalEffect['action'])}><option value="auto">跟随类别默认</option>{allowedActions(draft.category).map(a=><option key={a} value={a}>{actionLabels[a]}</option>)}</select></label>
   <label>进场方式<select aria-label="进场方式" value={isKneeling(resolved.action)?'slide':effects.entry} disabled={isKneeling(resolved.action)} onChange={e=>update('entry',e.target.value as PersonalEffect['entry'])}><option value="auto">跟随类别默认</option>{entryIds.map(a=><option key={a} value={a}>{entryLabels[a]}</option>)}</select></label>
   <label>人物皮肤<select aria-label="人物皮肤" value={effects.characterSkin} onChange={e=>update('characterSkin',e.target.value as PersonalEffect['characterSkin'])}><option value="auto">跟随人物设置</option>{characterSkins.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
   <label>消息卡片皮肤<select aria-label="消息卡片皮肤" value={effects.cardSkin} onChange={e=>update('cardSkin',e.target.value as PersonalEffect['cardSkin'])}><option value="auto">跟随类别默认</option>{cardSkins.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label></div>
   <label>搞笑特效<select aria-label="搞笑特效" value={effects.gag} onChange={e=>update('gag',e.target.value as PersonalEffect['gag'])}><option value="auto">跟随类别默认</option>{gagIds.map(g=><option key={g} value={g}>{gagLabels[g]}</option>)}</select></label>
   <label>专属吐槽台词<input aria-label="专属吐槽台词" value={effects.line} onChange={e=>update('line',e.target.value)} maxLength={60} placeholder={resolveEffects({...draft,effects:undefined},pet).line}/><small>留空使用默认台词 · 最多 60 字</small></label>
   {isKneeling(resolved.action)&&<p className="description">跪姿从桌面边缘滑入并举牌；两类“讨厌”的联系人保留滑跪，可选普通或崩溃跪姿。</p>}
   <div className="editor-actions"><button className="primary" disabled={busy||!draft.name.trim()}>保存个性效果</button><button type="button" disabled={busy||!draft.name.trim()} onClick={()=>onPreview(draft)}>播放桌面预览</button><button type="button" disabled={busy} onClick={()=>setDraft(v=>({...v,effects:personalEffectSchema.parse({})}))}>恢复类别默认</button></div>
  </form><EffectPreview contact={draft} pet={pet}/></div>
 </section>;
}
