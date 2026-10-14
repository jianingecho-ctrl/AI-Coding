import {promises as fs} from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {weddingMusicSchema,type WeddingMusic} from '../src/lib/model';
import type {Store} from './store';
const types={mp3:'audio/mpeg',wav:'audio/wav',m4a:'audio/mp4',ogg:'audio/ogg'};
export class WeddingMusicService{
 constructor(private store:Store,private root:string){}
 private file(music:WeddingMusic){const m=weddingMusicSchema.parse(music);return path.join(this.root,m.id+'.'+m.extension);}
 async import(file:string){
  const extension=path.extname(file).slice(1).toLowerCase();
  const stat=await fs.stat(file);if(!stat.isFile()||!stat.size||stat.size>15*1024*1024)throw new Error('请选择小于 15 MB 的音频文件。');
  const data=await fs.readFile(file);if(!data.length||data.length>15*1024*1024)throw new Error('请选择小于 15 MB 的 MP3、WAV、M4A 或 OGG 音频。');
  const signature=data.subarray(0,12),valid=extension==='mp3'&&(signature.subarray(0,3).toString()==='ID3'||(data[0]===255&&(data[1]&224)===224))||extension==='wav'&&signature.subarray(0,4).toString()==='RIFF'&&signature.subarray(8,12).toString()==='WAVE'||extension==='m4a'&&signature.subarray(4,8).toString()==='ftyp'||extension==='ogg'&&signature.subarray(0,4).toString()==='OggS';
  if(!valid)throw new Error('文件格式与扩展名不符，请使用可播放的音频文件。');
  const music=weddingMusicSchema.parse({id:randomUUID(),name:path.basename(file).slice(0,120),extension});
  await fs.mkdir(this.root,{recursive:true,mode:0o700});await fs.writeFile(this.file(music),data,{mode:0o600});
  const old=this.store.get().weddingMusic;
  try{const state=await this.store.update(s=>({...s,weddingMusic:music}));if(old)await fs.rm(this.file(old),{force:true}).catch(()=>{});return state;}catch(e){await fs.rm(this.file(music),{force:true});throw e;}
 }
 async read(){const music=this.store.get().weddingMusic;if(!music)return null;const data=await fs.readFile(this.file(music));return `data:${types[music.extension]};base64,${data.toString('base64')}`;}
 async clear(){const old=this.store.get().weddingMusic;const state=await this.store.update(s=>({...s,weddingMusic:null}));if(old)await fs.rm(this.file(old),{force:true});return state;}
}
