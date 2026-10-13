import {it,expect,afterEach} from 'vitest';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {importFiles,readFrames} from '../electron/assets';
const dirs:string[]=[];
async function dir(){const d=await mkdtemp(path.join(tmpdir(),'judge-assets-'));dirs.push(d);return d;}
afterEach(async()=>{await Promise.all(dirs.splice(0).map(d=>rm(d,{recursive:true,force:true})))});
it('复制静态图片到独立本机目录，删除原文件后仍能显示',async()=>{const source=await dir(),root=await dir(),file=path.join(source,'pet.png');await writeFile(file,'png');const asset=await importFiles([file],root,()=>true);await rm(source,{recursive:true});expect(asset.kind).toBe('image');expect(await readFrames(asset,root)).toEqual(['data:image/png;base64,cG5n']);});
it('序列帧使用数字顺序并保留每帧',async()=>{const source=await dir(),root=await dir();const files=await Promise.all(['10','2','1'].map(async n=>{const p=path.join(source,n+'.png');await writeFile(p,n);return p}));const asset=await importFiles(files,root,()=>true);expect(asset.kind).toBe('sequence');expect(asset.files).toHaveLength(3);expect(await readFile(path.join(root,asset.id,'000.png'),'utf8')).toBe('1');expect(await readFile(path.join(root,asset.id,'001.png'),'utf8')).toBe('2');});
it('拒绝混合 GIF、非法图片与过大素材',async()=>{const source=await dir(),root=await dir();const gif=path.join(source,'pet.gif'),png=path.join(source,'pet.png');await writeFile(gif,'gif');await writeFile(png,'png');await expect(importFiles([gif,png],root,()=>true)).rejects.toThrow('GIF');await expect(importFiles([png],root,()=>false)).rejects.toThrow('有效');await writeFile(png,Buffer.alloc(5*1024*1024+1));await expect(importFiles([png],root,()=>true)).rejects.toThrow('5 MB');});
