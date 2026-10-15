import {it,expect} from 'vitest';
import {mkdtemp,mkdir,writeFile,readFile,unlink,rmdir,rm} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import {tmpdir} from 'node:os';
const afterPack=createRequire(import.meta.url)('../scripts/windows-after-pack.cjs');
const {createUninstallManifest}=afterPack;
it('Windows 打包钩子把实际卸载清单写入输出目录，并用 UTF-8 BOM 保留中文路径',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'judge-hook-'));
 try{
  const stage=path.join(directory,'win-unpacked');await mkdir(stage);await writeFile(path.join(stage,'职场小判官.exe'),'packaged');
  await afterPack({electronPlatformName:'win32',appOutDir:stage,outDir:directory});const file=await readFile(path.join(directory,'windows-uninstall-files.nsh'));
  expect(file.subarray(0,3)).toEqual(Buffer.from([0xef,0xbb,0xbf]));expect(file.toString('utf8')).toContain('Delete "$INSTDIR\\职场小判官.exe"');
 }finally{await rm(directory,{recursive:true,force:true})}
});
it('卸载清单只删除随安装包交付的文件，保留用户后来放入的文件和非空目录',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'judge-installer-'));
 try{
  await mkdir(path.join(directory,'resources','中文 $目录'),{recursive:true});await writeFile(path.join(directory,'职场小判官.exe'),'packaged');await writeFile(path.join(directory,'resources','中文 $目录','app.asar'),'packaged');
  const manifest=await createUninstallManifest(directory);expect(manifest).toContain('中文 $$目录');expect(manifest).not.toMatch(/RMDir\s+\/r/i);
  const personal=path.join(directory,'resources','中文 $目录','我的文件.txt');await writeFile(personal,'must stay');
  // Apply the generated NSIS file operations with their non-recursive semantics.
  for(const line of manifest.split('\n')){
   const entry=line.match(/^  (Delete|RMDir) "\$INSTDIR\\(.+)"$/);if(!entry)continue;
   const file=path.join(directory,...entry[2].replace(/\$\$/g,'$').split('\\'));
   if(entry[1]==='Delete')await unlink(file);else await rmdir(file).catch((e:NodeJS.ErrnoException)=>{if(e.code!=='ENOTEMPTY')throw e});
  }
  expect(await readFile(personal,'utf8')).toBe('must stay');await expect(readFile(path.join(directory,'职场小判官.exe'))).rejects.toThrow();
 }finally{await rm(directory,{recursive:true,force:true})}
});
