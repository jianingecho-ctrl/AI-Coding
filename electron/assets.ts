import {promises as fs} from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {assetSchema,type Asset} from '../src/lib/model';
const types:Record<string,string>={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif'};
export async function importFiles(files:string[],root:string,validImage:(file:string)=>boolean):Promise<Asset>{
 if(!files.length||files.length>60)throw new Error('请选择 1 至 60 张图片；单个 GIF 可直接播放');
 const sorted=[...files].sort((a,b)=>a.localeCompare(b,'zh-CN',{numeric:true}));
 let total=0;
 for(const file of sorted){const ext=path.extname(file).slice(1).toLowerCase();const stat=await fs.stat(file);
  if(!types[ext]||!stat.isFile()||!validImage(file))throw new Error('仅支持有效的 PNG、JPG、WebP、GIF 图片');
  if(ext==='gif'&&sorted.length>1)throw new Error('GIF 请单独上传；序列帧请选择多张静态图片');
  if(stat.size>(ext==='gif'?15:5)*1024*1024)throw new Error('静态图片限 5 MB，GIF 限 15 MB');total+=stat.size;
 }
 if(total>50*1024*1024)throw new Error('一组素材总大小不能超过 50 MB');
 const id=randomUUID(),dir=path.join(root,id);await fs.mkdir(dir,{recursive:true});
 try{
  const names:string[]=[];
  for(let i=0;i<sorted.length;i++){const name=String(i).padStart(3,'0')+path.extname(sorted[i]).toLowerCase();await fs.copyFile(sorted[i],path.join(dir,name));names.push(name);}
  return assetSchema.parse({id,name:path.basename(sorted[0]).slice(0,110)+(sorted.length>1?' · '+sorted.length+' 帧':''),kind:sorted.length>1?'sequence':names[0].endsWith('.gif')?'gif':'image',files:names,createdAt:new Date().toISOString()});
 }catch(e){await fs.rm(dir,{recursive:true,force:true});throw e;}
}
export async function readFrames(asset:Asset,root:string){const safe=assetSchema.parse(asset);return Promise.all(safe.files.map(async file=>'data:'+types[path.extname(file).slice(1)]+';base64,'+(await fs.readFile(path.join(root,safe.id,file))).toString('base64')));}
