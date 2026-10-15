const {execFileSync}=require('node:child_process');
const {createHash}=require('node:crypto');
// Tests and workflow changes can reuse a draft candidate. Every application,
// dependency, asset, compiler and packaging input invalidates that candidate.
const inputs=['electron','src','public','native','build','scripts','package.json','package-lock.json','tsconfig.json','tsconfig.electron.json','vite.config.ts','index.html','edition.json'];
const index=execFileSync('git',['ls-files','--stage','--',...inputs],{encoding:'utf8'});
if(!index.trim())throw new Error('没有找到已跟踪的构建输入，不能复用安装包。');
console.log(createHash('sha256').update(index).digest('hex'));
