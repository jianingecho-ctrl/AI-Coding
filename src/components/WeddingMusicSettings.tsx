import {useEffect,useState} from 'react';
import type {State} from '../lib/model';
import {playInteractionSound,stopInteractionSound} from '../lib/interaction-audio';
export function WeddingMusicSettings({state}:{state:State}){
 const [error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>()=>stopInteractionSound(),[]);
 async function run(work:()=>Promise<unknown>){setBusy(true);setError('');try{await work()}catch(e){setError(String(e))}finally{setBusy(false)}}
 return <section className="privacy-note wedding-settings"><h3>嫁给ta · 前奏音乐</h3><p>{state.weddingMusic?'本地音乐：'+state.weddingMusic.name:'当前使用原创婚礼钟声（不是商业歌曲）。'}</p><p>如需《今天你要嫁给我》（陶喆／蔡依林版本），选择你本地已有的可播放音频。只播放开头最多 10 秒；不需要提前剪辑。支持 MP3、WAV、M4A、OGG，最大 15 MB，复制到本版独立目录，不联网。</p><div className="editor-actions"><button disabled={busy} onClick={()=>void run(()=>window.judge.importWeddingMusic())}>导入本地前奏音乐</button><button disabled={busy} onClick={()=>void run(()=>playInteractionSound('marry',state.pet.soundEnabled,state.pet.soundVolume,state.weddingMusic?()=>window.judge.getWeddingAudio():undefined))}>试听前奏</button><button onClick={stopInteractionSound}>停止试听</button><button disabled={busy||!state.weddingMusic} onClick={()=>void run(()=>window.judge.clearWeddingMusic())}>恢复原创音效</button></div>{error&&<p role="alert" className="error">{error}</p>}<small>音量和静音与互动音效设置同步。互动只作用于本机桌宠。</small></section>;
}
