import {cp,mkdir,readFile,writeFile,rm,access,chmod} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'.edition-sources');
const names={ocean:{name:'workplace-little-judge-ocean',productName:'职场小判官·海洋版',appId:'cn.workplace.littlejudge.ocean',launcher:'启动海洋版.command'},palace:{name:'workplace-little-judge-palace',productName:'职场小判官·甄嬛传版',appId:'cn.workplace.littlejudge.palace',launcher:'启动甄嬛传版.command'}};
const files=['electron','src','public','native','tests','docs','scripts','edition.json','package.json','package-lock.json','tsconfig.json','tsconfig.electron.json','vite.config.ts','index.html','README.md','.gitignore','启动职场小判官.command'];
for(const [edition,identity] of Object.entries(names)){
 const destination=path.join(output,edition);await rm(destination,{recursive:true,force:true});await mkdir(destination,{recursive:true});
 for(const item of [...files,identity.launcher]){
  const source=path.join(root,item);try{await access(source);}catch{continue;}
  await cp(source,path.join(destination,item),{recursive:true,filter:location=>{
   const nativeRelative=path.relative(path.join(root,'native'),location).split(path.sep).join('/');
   if(item==='native'&&(nativeRelative==='bin'||nativeRelative.startsWith('bin/')||nativeRelative==='.build'||nativeRelative.startsWith('.build/')))return false;
   const relative=path.relative(path.join(root,'public'),location).split(path.sep).join('/');
   if(item==='public'&&edition==='palace'&&(relative==='references'||relative.startsWith('references/')))return false;
   if(item==='public'&&relative.startsWith('characters/'))return edition==='palace'?path.basename(location).startsWith('palace_'):!path.basename(location).startsWith('palace_');
   return true;
  }});
 }
 const pkg=JSON.parse(await readFile(path.join(destination,'package.json'),'utf8'));
 pkg.name=identity.name;pkg.description=identity.productName+'：独立桌面应用';pkg.build.appId=identity.appId;pkg.build.productName=identity.productName;pkg.build.directories.output='release/'+edition;
 pkg.build.files=pkg.build.files.filter(file=>!file.startsWith('!dist/'));if(edition==='ocean')pkg.build.files.push('!dist/characters/palace_*.png');
 delete pkg.scripts['test:isolation'];
 delete pkg.scripts.sources;if(edition==='palace')pkg.scripts['test:desktop']='npm run build && node tests/palace-desktop.cjs';
 const lock=JSON.parse(await readFile(path.join(destination,'package-lock.json'),'utf8'));lock.name=identity.name;lock.packages[''].name=identity.name;
 await writeFile(path.join(destination,'edition.json'),JSON.stringify({id:edition})+'\n');await writeFile(path.join(destination,'package.json'),JSON.stringify(pkg,null,2)+'\n');await writeFile(path.join(destination,'package-lock.json'),JSON.stringify(lock,null,2)+'\n');
 await writeFile(path.join(destination,'README.md'),`# ${identity.productName} · ${pkg.version}\n\n本文件夹是独立${edition==='palace'?'甄嬛传':'海洋'}版，直接双击「${identity.launcher}」，或依次执行 npm ci、npm run build、npm start。\n\n本版人物、联系人、消息、统计、素材与 AI 密钥使用独立目录；没有主题切换，也不会影响另一版。0.10.0 支持本机识别可见通知并自动进场、联系人优先级队列、嫁给ta和飞踢ta。婚礼音乐可导入本地音频，只播放开头最多10秒。回复可复制后手动发送，真实通知不调用外部 AI。Mac 首次构建需要 Apple 开发工具和 macOS 15.2+ SDK。详细步骤见 [飞书通知使用教程](docs/飞书通知使用教程.md) 和 [独立版使用指南](docs/独立版使用指南.md)。\n\n在 Mac 上运行 npm run pack:mac 会生成本版专用 DMG/ZIP，应用名称与 Bundle ID 独立，可与另一版一起安装。\n`);
 for(const launcher of ['启动职场小判官.command',identity.launcher])await chmod(path.join(destination,launcher),0o755);
 console.log(identity.productName+'源码目录：'+destination);
}
