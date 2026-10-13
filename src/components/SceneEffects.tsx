import type {CSSProperties} from 'react';
import type {ResolvedEffect,Theme} from '../lib/model';

const paperLabels=['加班','周报','急急急','再改一版','收到请回','需求+1','开个短会','最后一版'];
export function SceneEffects({gag,theme='ocean'}:{gag:ResolvedEffect['gag'];theme?:Theme}) {
 if(gag==='none')return null;
 return <div className={`scene-effects gag-${gag}`} aria-hidden="true" data-gag={gag}>
  {Array.from({length:8},(_,index)=><span key={index} className="gag-particle" style={{'--i':index,'--turn':`${index%2?18:-16}deg`} as CSSProperties}>
   {gag==='paper'?(theme==='palace'?['请安','批阅','传召','加急','差事+1','回禀','再议','速回'][index]:paperLabels[index]):gag==='hearts'?'♥':gag==='overload'?(theme==='palace'?['本宫头疼','差事太多','稍安勿躁','摸鱼告急'][index%4]:['救命','CPU 100%','已读，裂开','摸鱼告急'][index%4]):<svg viewBox="0 0 40 24"><path d="M29 12 L39 3 V21 Z M2 12 Q15-4 31 12 Q15 28 2 12" fill="currentColor"/><circle cx="11" cy="10" r="2" fill="#fff"/></svg>}
  </span>)}
  {gag==='overload'&&<div className="overload-stamp">{theme==='palace'?'差事太多 · 本宫头疼':'工伤预警 · 工位过载'}</div>}
 </div>;
}
