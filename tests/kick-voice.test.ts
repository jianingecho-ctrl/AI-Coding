import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
it('飞踢包含内置语音WAV，录音有实际信号且足够短，不依赖运行时下载或系统声音',()=>{
 const file=readFileSync('src/assets/sounds/kick-zouni.wav');expect(file.subarray(0,4).toString()).toBe('RIFF');expect(file.subarray(8,12).toString()).toBe('WAVE');expect(file.readUInt16LE(20)).toBe(1);expect(file.readUInt16LE(34)).toBe(16);const rate=file.readUInt32LE(24),duration=file.readUInt32LE(40)/2/rate;expect(duration).toBeGreaterThan(.3);expect(duration).toBeLessThan(1.5);let peak=0;for(let i=44;i<file.length;i+=2)peak=Math.max(peak,Math.abs(file.readInt16LE(i)));expect(peak).toBeGreaterThan(2000);
});
