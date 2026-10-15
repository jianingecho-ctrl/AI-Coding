const {readdir,writeFile}=require('node:fs/promises');
const path=require('node:path');

// NSIS deletes the files we shipped, then removes directories only if empty.
// This preserves unrelated files even if the user selected an existing folder.
async function createUninstallManifest(appOutDir){
 const files=[],directories=[];
 async function walk(relative=''){
  for(const entry of await readdir(path.join(appOutDir,relative),{withFileTypes:true})){
   const name=path.join(relative,entry.name);
   if(entry.isDirectory()){await walk(name);directories.push(name)}
   else if(entry.isFile())files.push(name);
   else throw new Error('Windows 安装目录中包含不支持的文件类型：'+name);
  }
 }
 await walk();
 const escape=name=>{if(/[\r\n"*?]/.test(name))throw new Error('无法安全生成卸载清单：'+name);return name.split(path.sep).join('\\').replace(/\$/g,'$$$$')};
 return ['; Generated from the packaged file list. Do not edit.','!macro JudgeRemoveInstalledFiles',...files.sort().map(name=>'  Delete "$INSTDIR\\'+escape(name)+'"'),...directories.sort((a,b)=>b.split(path.sep).length-a.split(path.sep).length||a.localeCompare(b)).map(name=>'  RMDir "$INSTDIR\\'+escape(name)+'"'),'!macroend',''].join('\n');
}
module.exports=async context=>{
 if(context.electronPlatformName!=='win32')return;
 const manifest=path.join(context.outDir,'windows-uninstall-files.nsh');
 await writeFile(manifest,'\uFEFF'+await createUninstallManifest(context.appOutDir));
 console.log('Windows 卸载清单已生成：'+manifest);
};
module.exports.createUninstallManifest=createUninstallManifest;
