import {useState,type CSSProperties} from 'react';
import {type Contact,type State} from '../lib/model';
import {resolveEffects,isKneeling,actionLabels,entryLabels,gagLabels} from '../lib/effects';
import {Character} from './Character';
import {SceneEffects} from './SceneEffects';
export function EffectPreview({contact,pet}:{contact:Contact;pet:State['pet']}){
 const effect=resolveEffects(contact,pet);
 const [replay,setReplay]=useState(0);
 return <div className="effect-preview">
  <div className="effect-preview-stage" key={`${JSON.stringify(effect)}-${replay}`}>
   <SceneEffects gag={effect.gag}/>
   <div style={{'--entry-duration':effect.duration+'s'} as CSSProperties} className={`preview-scene entry-${effect.entry} ${effect.entry==='slide'&&isKneeling(effect.action)?'slide-kneel':''}`}>
    <div className={`preview-card card-${effect.cardSkin}`}><small>{contact.name} · {contact.category}</small><p>{effect.line}</p></div>
    <Character character={effect.character} action={effect.action} color={pet.color} skin={effect.characterSkin} name={pet.name} duration={effect.duration} assetId={effect.assetId}/>
   </div>
  </div>
  <p className="effect-caption">{actionLabels[effect.action]} · {entryLabels[effect.entry]} · {gagLabels[effect.gag]} · {effect.duration} 秒</p>
  <button type="button" onClick={()=>setReplay(v=>v+1)}>重播预览</button>
 </div>;
}
