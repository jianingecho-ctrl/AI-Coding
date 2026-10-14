import {useEffect,useState} from 'react';
import type {State} from '../lib/model';
export function PetPreferences({pet,busy,onSave}:{pet:State['pet'];busy:boolean;onSave:(preferences:Pick<State['pet'],'scale'|'soundEnabled'|'soundVolume'>)=>void}){
 const [scale,setScale]=useState(pet.scale),[soundEnabled,setSoundEnabled]=useState(pet.soundEnabled),[soundVolume,setSoundVolume]=useState(pet.soundVolume);
 useEffect(()=>{setScale(pet.scale);setSoundEnabled(pet.soundEnabled);setSoundVolume(pet.soundVolume)},[pet.scale,pet.soundEnabled,pet.soundVolume]);
 return <form aria-label="桌宠尺寸与音效" onSubmit={e=>{e.preventDefault();onSave({scale,soundEnabled,soundVolume})}}>
  <h3>小一点，给桌面留点空位</h3>
  <div className="settings-sliders"><label>桌宠尺寸 · {Math.round(scale*100)}%<input aria-label="桌宠尺寸" type="range" min="45" max="100" step="5" value={Math.round(scale*100)} onChange={e=>setScale(Number(e.target.value)/100)}/><small>默认 60%，待机窗口随人物缩小；收到消息时自动展开卡片。</small></label>
  <label>互动音量 · {Math.round(soundVolume*100)}%<input aria-label="互动音量" type="range" min="0" max="100" step="5" value={Math.round(soundVolume*100)} onChange={e=>setSoundVolume(Number(e.target.value)/100)}/><small>掌嘴是清脆的「啪」，飞踢喊「走你」；婚礼音乐可在上方导入。肘击、烧心、比心各有音效。</small></label></div>
  <label className="checkbox-label"><input type="checkbox" checked={soundEnabled} onChange={e=>setSoundEnabled(e.target.checked)}/>开启互动音效</label>
  <button className="primary" disabled={busy}>保存尺寸与音效</button>
 </form>;
}
