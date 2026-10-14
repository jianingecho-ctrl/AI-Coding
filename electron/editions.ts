import {promises as fs} from 'node:fs';
import path from 'node:path';
import {z} from 'zod';
import {stateSchema,type Theme} from '../src/lib/model';
import {editionDefinitions,normalizeEditionState} from '../src/lib/editions';

export function parseEdition(raw:string):Theme{return z.object({id:z.enum(['ocean','palace'])}).parse(JSON.parse(raw)).id;}
export function editionDataRoot(base:string,edition:Theme){return path.join(base,editionDefinitions[edition].dataDirectory);}
export async function migrateLegacyOcean(destination:string,candidates:string[]):Promise<boolean>{
 const target=path.join(destination,'judge-state.json');
 try{await fs.access(target);return false;}catch{}
 for(const candidate of candidates){
  let parsed;
  try{parsed=stateSchema.parse(JSON.parse(await fs.readFile(path.join(candidate,'judge-state.json'),'utf8')));}catch{continue;}
  // 旧共享版本最后使用宫廷时不自动导入；旧目录保持原样。
  if(parsed.pet.theme!=='ocean')continue;
  const state=normalizeEditionState(parsed,'ocean');state.ai.enabled=false;
  await fs.mkdir(destination,{recursive:true,mode:0o700});
  try{await fs.cp(path.join(candidate,'assets'),path.join(destination,'assets'),{recursive:true});}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
  await fs.writeFile(target+'.migration',JSON.stringify(state,null,2),{mode:0o600});await fs.rename(target+'.migration',target);
  return true;
 }
 return false;
}
