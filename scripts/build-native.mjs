import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
if(process.platform!=='darwin'){console.log('当前为非 macOS：跳过原生通知模块编译；通知截图需在 Mac 验收。');process.exit(0);}
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const result=spawnSync('/bin/bash',[path.join(root,'native/build.sh'),process.argv.includes('--all-arch')?'all':process.arch],{cwd:root,stdio:'inherit'});
if(result.error){console.error('原生模块构建失败：'+result.error.message);process.exit(1);}
process.exit(result.status??1);
