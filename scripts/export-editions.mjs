import {cp,mkdir,readFile,writeFile,rm,chmod} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const destination=path.join(root,'.edition-sources','unified');
const files=['electron','src','public','native','build','tests','docs','scripts','edition.json','package.json','package-lock.json','tsconfig.json','tsconfig.electron.json','vite.config.ts','index.html','README.md','.gitignore','启动职场小判官.command','启动双主题版.command'];
await rm(destination,{recursive:true,force:true});await mkdir(destination,{recursive:true});
for(const item of files)await cp(path.join(root,item),path.join(destination,item),{recursive:true,filter:location=>{
 if(item!=='native')return true;const relative=path.relative(path.join(root,'native'),location).split(path.sep).join('/');return relative!=='bin'&&!relative.startsWith('bin/')&&relative!=='.build'&&!relative.startsWith('.build/');
}});
const pkg=JSON.parse(await readFile(path.join(destination,'package.json'),'utf8'));delete pkg.scripts.sources;await writeFile(path.join(destination,'package.json'),JSON.stringify(pkg,null,2)+'\n');
for(const launcher of ['启动职场小判官.command','启动双主题版.command'])await chmod(path.join(destination,launcher),0o755);
console.log('双主题源码目录：'+destination+'（包含两套人物，运行数据不在包中）');
