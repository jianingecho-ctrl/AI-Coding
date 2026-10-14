import type {InteractionKind} from './model';

// 原创合成音效，离线运行，不下载素材、不访问麦克风。
export function interactionSound(kind:InteractionKind,sampleRate=44100):Float32Array{
 if(!Number.isFinite(sampleRate)||sampleRate<8000||sampleRate>192000)throw new Error('不支持的音频采样率');
 const duration={elbow:.32,slap:.26,burn:.9,heart:.78,marry:6.4,kick:.52}[kind];
 const samples=new Float32Array(Math.ceil(duration*sampleRate));
 let seed=1837,lowNoise=0;
 for(let i=0;i<samples.length;i++){
  const t=i/sampleRate;
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const noise=seed/2147483648-1;
  lowNoise=.88*lowNoise+.12*noise;
  const fade=Math.min(1,t/.004,(duration-t)/.035);
  let value=0;
  if(kind==='elbow')value=.62*Math.sin(2*Math.PI*(115*t-75*t*t))*Math.exp(-t*19)+noise*.33*Math.exp(-t*65);
  if(kind==='slap'){
   const second=Math.max(0,t-.045);
   value=noise*.66*Math.exp(-t*65)+noise*.29*(t>.045?Math.exp(-second*85):0)+.19*Math.sin(2*Math.PI*230*t)*Math.exp(-t*35);
  }
  if(kind==='burn'){
   const envelope=Math.sin(Math.PI*t/duration);
   const crackle=Math.max(0,Math.abs(noise)-.82)*Math.sin(2*Math.PI*1300*t);
   value=(lowNoise*1.4+noise*.13+crackle*.7)*envelope;
  }
  if(kind==='kick'){value=(noise*.28*Math.sin(Math.PI*t/duration)+.5*Math.sin(2*Math.PI*(95*t+140*t*t))*Math.exp(-Math.abs(t-.15)*20));}
  if(kind==='marry'){
   // 原创婚礼钟声，不模仿指定歌曲旋律。
   const notes=[523.25,783.99,659.25,1046.5,880,659.25,783.99,523.25];
   const step=Math.floor(t/.65),elapsed=t-step*.65,freq=notes[step%notes.length];
   value=(Math.sin(2*Math.PI*freq*elapsed)+.25*Math.sin(2*Math.PI*freq*2*elapsed))*.35*Math.min(1,elapsed/.012)*Math.exp(-elapsed*5);
  }
  if(kind==='heart'){
   for(const [start,freq] of [[0,523.25],[.12,659.25],[.24,783.99]]){
    const elapsed=t-start;if(elapsed<0)continue;
    const envelope=Math.min(1,elapsed/.01)*Math.exp(-elapsed*7);
    value+=(Math.sin(2*Math.PI*freq*elapsed)+.22*Math.sin(2*Math.PI*freq*2*elapsed))*.2*envelope;
   }
  }
  samples[i]=Math.max(-.85,Math.min(.85,value*fade));
 }
 return samples;
}
