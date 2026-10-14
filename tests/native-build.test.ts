import {it,expect,afterEach} from 'vitest';
import {mkdtemp,readFile,writeFile,copyFile,chmod,rm,mkdir,access} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import path from 'node:path';
import {tmpdir} from 'node:os';
const run=promisify(execFile),dirs:string[]=[];
afterEach(async()=>{await Promise.all(dirs.splice(0).map(dir=>rm(dir,{recursive:true,force:true})))});
async function setup(){
 const dir=await mkdtemp(path.join(tmpdir(),'judge native build '));dirs.push(dir);
 await copyFile('native/build.sh',path.join(dir,'build.sh'));
 // 模拟 Apple 工具选取与编译器，执行真实 build.sh 的参数、输出与退出流程。
 await writeFile(path.join(dir,'toolchain.sh'),`judge_probe_select_toolchain() {
 JUDGE_SELECTED_SWIFT="$JUDGE_TEST_COMPILER"
 JUDGE_SELECTED_DEVELOPER="$JUDGE_TEST_DIRECTORY/Developer With Spaces"
 JUDGE_SELECTED_SDK="$JUDGE_TEST_DIRECTORY/SDK With Spaces"
 JUDGE_SELECTED_SDK_VERSION="26.0"
}
`);
 const compiler=path.join(dir,'fake swift compiler');await writeFile(compiler,`#!/bin/bash
set -eu
if [ "\${JUDGE_TEST_FAIL:-0}" = 1 ]; then echo 'fixture compiler failure' >&2; exit 73; fi
output=""; target=""; sdk=""
while [ "$#" -gt 0 ]; do
 case "$1" in
  -o) output="$2"; shift ;;
  -target) target="$2"; shift ;;
  -sdk) sdk="$2"; shift ;;
 esac
 shift
done
printf 'target=%s\\nsdk=%s\\n' "$target" "$sdk" > "$output"
printf '%s\\n' "$target" >> "$JUDGE_TEST_DIRECTORY/compiler-calls"
`);await chmod(compiler,0o755);
 return {dir,env:{...process.env,JUDGE_TEST_COMPILER:compiler,JUDGE_TEST_DIRECTORY:dir}};
}
it('原生构建在含空格路径成功生成 ARM/Intel 两个模块并输出 SDK，不被中文标点吞入变量名',async()=>{
 const {dir,env}=await setup();const result=await run(process.env.JUDGE_TEST_BASH??'/bin/bash',[path.join(dir,'build.sh'),'all'],{env});
 expect(result.stdout).toContain('arm64（SDK 26.0）');expect(result.stdout).toContain('x64（SDK 26.0）');expect(result.stderr).toBe('');
 expect(await readFile(path.join(dir,'bin/NotificationCapture-arm64'),'utf8')).toBe(`target=arm64-apple-macosx15.2\nsdk=${dir}/SDK With Spaces\n`);
 expect(await readFile(path.join(dir,'bin/NotificationCapture-x64'),'utf8')).toContain('target=x86_64-apple-macosx15.2');
 expect((await readFile(path.join(dir,'compiler-calls'),'utf8')).trim().split('\n')).toHaveLength(2);
 await expect(access(path.join(dir,'bin/NotificationCapture-arm64.tmp'))).rejects.toThrow();
});
it('编译失败保留已有可用模块，传播非零退出码，不输出成功提示',async()=>{
 const {dir,env}=await setup();await mkdir(path.join(dir,'bin'));await writeFile(path.join(dir,'bin/NotificationCapture-arm64'),'previous binary fixture');
 const result=await run(process.env.JUDGE_TEST_BASH??'/bin/bash',[path.join(dir,'build.sh'),'arm64'],{env:{...env,JUDGE_TEST_FAIL:'1'}}).then(()=>null,error=>error);
 expect(result?.code).toBe(73);expect(result?.stderr).toContain('fixture compiler failure');expect(result?.stdout).not.toContain('已构建');
 expect(await readFile(path.join(dir,'bin/NotificationCapture-arm64'),'utf8')).toBe('previous binary fixture');
});
