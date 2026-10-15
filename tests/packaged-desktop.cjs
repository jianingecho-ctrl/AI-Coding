const {_electron}=require('playwright');
const {expect}=require('@playwright/test');
const {mkdtemp,rm}=require('node:fs/promises');
const {tmpdir}=require('node:os');
const path=require('node:path');
(async()=>{
 const data=await mkdtemp(path.join(tmpdir(),'judge-packaged-')),errors=[];
 const asar=path.resolve(process.argv[2]||'release/unified/win-unpacked/resources/app.asar');let app;
 try{
  app=await _electron.launch({args:[...(process.platform==='linux'?['--no-sandbox']:[]),asar],env:{...process.env,ELECTRON_RUN_AS_NODE:'',JUDGE_DATA_DIR:data},timeout:30000});
  await expect.poll(()=>app.windows().filter(page=>page.url().includes('view=')).length).toBe(2);
  const pet=app.windows().find(page=>page.url().includes('view=pet')),panel=app.windows().find(page=>page.url().includes('view=panel'));
  for(const page of [pet,panel])page.on('pageerror',error=>errors.push(error.message));
  expect((await panel.evaluate(()=>window.judge.getAppInfo())).version).toBe(require('../package.json').version);
  await expect(pet.locator('.reference-character[data-ready="true"]').first()).toBeVisible();
  await panel.getByLabel('模拟飞书消息').fill('安装包内容验收：请今天18点前回复');await panel.getByRole('button',{name:'发送测试消息 ↗',exact:true}).click();
  await expect(pet.locator('.message-body')).toContainText('安装包内容验收');
  await panel.getByRole('button',{name:'甄嬛传版 切换到此档案',exact:true}).click();await expect(pet.locator('.pet-stage')).toHaveAttribute('data-theme','palace');await expect(pet.locator('[data-character="palace_zhenhuan"][data-ready="true"]')).toBeVisible();
  expect((await panel.evaluate(()=>window.judge.getState())).history).toEqual([]);await panel.getByLabel('模拟飞书消息').fill('宫廷安装包测试');await panel.getByRole('button',{name:'发送测试消息 ↗',exact:true}).click();await expect(pet.locator('.message-body')).toContainText('宫廷安装包测试');
  expect(errors).toEqual([]);console.log('ASAR 内容通过真实 Electron 验收：两套人物加载、模拟消息及主题隔离。使用当前主机 Electron，未执行 Windows EXE 或安装器。');
 }finally{if(app)await app.close().catch(()=>{});await rm(data,{recursive:true,force:true})}
})().catch(error=>{console.error(error);process.exitCode=1});
