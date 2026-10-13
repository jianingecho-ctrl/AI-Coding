import {safeStorage} from 'electron';
import {promises as fs} from 'node:fs';
import path from 'node:path';
export class Credentials{
 constructor(private file:string){}
 async has(){try{await fs.access(this.file);return true}catch{return false}}
 async get(){try{if(!safeStorage.isEncryptionAvailable())return '';return safeStorage.decryptString(await fs.readFile(this.file));}catch{return '';}}
 async save(key:string){
  if(!key){await fs.rm(this.file,{force:true});return;}
  if(!safeStorage.isEncryptionAvailable()||(process.platform==='linux'&&safeStorage.getSelectedStorageBackend()==='basic_text'))throw new Error('系统安全存储不可用，无法保存 API Key。请在 Mac 上使用。');
  await fs.mkdir(path.dirname(this.file),{recursive:true});await fs.writeFile(this.file,safeStorage.encryptString(key),{mode:0o600});
 }
}
