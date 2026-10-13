import type {InteractionKind} from './model';
import {interactionSound} from './sounds';
let context:AudioContext|undefined,current:AudioBufferSourceNode|undefined,generation=0;
export function stopInteractionSound(){generation++;if(current){current.stop();current=undefined;}}
export async function playInteractionSound(kind:InteractionKind,enabled:boolean,volume:number):Promise<void>{
 stopInteractionSound();
 if(!enabled||volume<=0)return;
 const token=generation;
 context??=new AudioContext();
 if(context.state==='suspended')await context.resume();
 if(token!==generation)return;
 if(context.state!=='running')throw new Error('系统音频暂不可用');
 const pcm=interactionSound(kind,context.sampleRate),buffer=context.createBuffer(1,pcm.length,context.sampleRate);
 buffer.getChannelData(0).set(pcm);
 const source=context.createBufferSource(),gain=context.createGain();
 source.buffer=buffer;gain.gain.value=Math.max(0,Math.min(1,volume));
 source.connect(gain);gain.connect(context.destination);current=source;
 source.onended=()=>{source.disconnect();gain.disconnect();if(current===source)current=undefined;};
 source.start();
}
