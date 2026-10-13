import {themeNames} from '../lib/palace';
import {themeIds,type Theme} from '../lib/model';
export function ThemeSwitcher({theme,busy,onChange}:{theme:Theme;busy:boolean;onChange:(theme:Theme)=>void}){
 return <section className="theme-switcher" aria-label="界面主题"><div><strong>换个世界上班</strong><p>{theme==='palace'?'朱红宫墙，鎏金小笺，今天的差事交给本宫。':'海风吹过工位，今天也要快乐摸鱼。'}</p></div>
  <div className="theme-buttons" role="group" aria-label="主题选择">{themeIds.map(id=><button key={id} disabled={busy} aria-pressed={theme===id} aria-label={'切换'+themeNames[id]+'主题'} onClick={()=>{if(id!==theme)onChange(id)}}>{id==='palace'?'✦':'≈'} {themeNames[id]}</button>)}</div>
 </section>;
}
