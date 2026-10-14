import {it,expect} from 'vitest';
import {interactionKinds} from '../src/lib/model';
import {interactionSound} from '../src/lib/sounds';
it('六种音效实际包含音频信号、没有非有限数值或过量振幅，结尾淡出',()=>{
 const durations=new Set<number>();
 for(const kind of interactionKinds){const pcm=interactionSound(kind,48000);durations.add(pcm.length);expect(pcm.length/48000).toBeGreaterThan(.2);expect(pcm.length/48000).toBeLessThan(7);expect(pcm.every(v=>Number.isFinite(v)&&Math.abs(v)<=.851)).toBe(true);expect(pcm.some(v=>Math.abs(v)>.08)).toBe(true);expect(Math.abs(pcm.at(-1)!)).toBeLessThan(.001);}
 expect(durations.size).toBe(6);
});
it('支持设备采样率变化，输出时长保持一致',()=>{for(const kind of interactionKinds)expect(interactionSound(kind,48000).length/48000).toBeCloseTo(interactionSound(kind,44100).length/44100,4);expect(()=>interactionSound('elbow',0)).toThrow();});
