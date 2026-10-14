import type {InteractionKind} from './model';
import kickVoiceUrl from '../assets/sounds/kick-zouni.wav?url';
import {interactionSound} from './sounds';
export const weddingIntroSeconds=10;
let context:AudioContext|undefined,current:AudioBufferSourceNode|undefined,generation=0;
export function stopInteractionSound(){generation++;if(current){current.stop();current=undefined;}}
export async function playInteractionSound(kind:InteractionKind,enabled:boolean,volume:number,loadWeddingAudio?:()=>Promise<string|null>):Promise<void>{
 stopInteractionSound();
 if(!enabled||volume<=0)return;
 const token=generation;
 context??=new AudioContext();
 if(context.state==='suspended')await context.resume();
 if(token!==generation)return;
 if(context.state!=='running')throw new Error('系统音频暂不可用');
 let buffer:AudioBuffer;
 if(kind==='kick'){
  const bytes=await (await fetch(kickVoiceUrl)).arrayBuffer();if(token!==generation)return;buffer=await context.decodeAudioData(bytes);if(token!==generation)return;
 }else if(kind==='marry'&&loadWeddingAudio){
  const url=await loadWeddingAudio();if(token!==generation)return;
  if(!url)throw new Error('本地音乐不存在，请重新导入或恢复原创音效');
  const bytes=await (await fetch(url)).arrayBuffer();buffer=await context.decodeAudioData(bytes);if(token!==generation)return;
 }else{const pcm=interactionSound(kind,context.sampleRate);buffer=context.createBuffer(1,pcm.length,context.sampleRate);buffer.getChannelData(0).set(pcm);}

 const source=context.createBufferSource(),gain=context.createGain();
 source.buffer=buffer;gain.gain.value=Math.max(0,Math.min(1,volume));
 source.connect(gain);gain.connect(context.destination);current=source;
 source.onended=()=>{source.disconnect();gain.disconnect();if(current===source)current=undefined;};
 const duration=kind==='marry'?Math.min(weddingIntroSeconds,buffer.duration):buffer.duration;
 if(kind==='marry'){const level=Math.max(0,Math.min(1,volume));gain.gain.setValueAtTime(level,context.currentTime);gain.gain.setValueAtTime(level,context.currentTime+Math.max(0,duration-.5));gain.gain.linearRampToValueAtTime(0,context.currentTime+duration);}
 source.start(0,0,duration);
}
