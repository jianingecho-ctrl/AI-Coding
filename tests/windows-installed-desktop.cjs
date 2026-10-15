const {_electron}=require('playwright');
const {expect}=require('@playwright/test');
const {mkdir}=require('node:fs/promises');
(async()=>{
 if(process.platform!=='win32'||!process.env.JUDGE_WINDOWS_APP||!process.env.JUDGE_WINDOWS_DATA)throw new Error('请在 Windows 指定已安装的 EXE 和专属临时数据目录。');
 const errors=[],processLog=[];let app;
 const launch=()=>_electron.launch({executablePath:process.env.JUDGE_WINDOWS_APP,args:[],env:{...process.env,ELECTRON_RUN_AS_NODE:'',JUDGE_DATA_DIR:process.env.JUDGE_WINDOWS_DATA},timeout:30000});
 try{
  await mkdir('test-results',{recursive:true});app=await launch();app.process().stderr?.on('data',chunk=>{processLog.push(chunk.toString());if(processLog.length>30)processLog.shift()});
  await expect.poll(()=>app.windows().filter(page=>page.url().includes('view=')).length).toBe(2);
  let pet=app.windows().find(page=>page.url().includes('view=pet')),panel=app.windows().find(page=>page.url().includes('view=panel'));
  for(const page of [pet,panel])page.on('pageerror',error=>errors.push(error.message));
  expect(await panel.evaluate(()=>window.judge.getAppInfo())).toMatchObject({version:require('../package.json').version,platform:'win32',canSwitch:true});
  await expect(pet.locator('.reference-character[data-ready="true"]').first()).toBeVisible();
  await panel.getByLabel('模拟飞书消息').fill('Windows安装验收：今天18点前核对文件');await panel.getByRole('button',{name:'发送测试消息 ↗',exact:true}).click();await expect(pet.locator('.message-body')).toContainText('Windows安装验收');
  await pet.getByRole('button',{name:'飞踢ta',exact:true}).click();await expect(pet.locator('[data-interaction="kick"]')).toContainText('走你');
  await expect.poll(()=>panel.evaluate(async()=> (await window.judge.getState()).interactions.reduce((total,row)=>total+row.counts.kick,0))).toBe(1);
  await panel.getByRole('button',{name:'甄嬛传版 切换到此档案',exact:true}).click();await expect(pet.locator('[data-character="palace_zhenhuan"][data-ready="true"]')).toBeVisible();
  const palace=await panel.evaluate(()=>window.judge.getState());expect(palace.history).toEqual([]);expect(palace.interactions).toEqual([]);
  await panel.locator('[data-tab="飞书通知"]').click();await expect(panel.getByRole('heading',{name:'飞书桌面通知 · 本机识别（Windows 实验版）'})).toBeVisible();await expect(panel.getByLabel('选区位置').locator('option[value="primary"]')).toHaveText('主屏幕右下角');
  await panel.screenshot({path:'test-results/windows-installed-console.png'});
  await app.close();app=await launch();await expect.poll(()=>app.windows().filter(page=>page.url().includes('view=')).length).toBe(2);panel=app.windows().find(page=>page.url().includes('view=panel'));pet=app.windows().find(page=>page.url().includes('view=pet'));
  await expect(pet.locator('.pet-stage')).toHaveAttribute('data-theme','palace');
  await panel.getByRole('button',{name:'比奇堡版 切换到此档案',exact:true}).click();await expect(pet.locator('.pet-stage')).toHaveAttribute('data-theme','ocean');
  const restored=await panel.evaluate(()=>window.judge.getState());expect(restored.history[0].text).toContain('Windows安装验收');expect(restored.interactions.reduce((total,row)=>total+row.counts.kick,0)).toBe(1);expect(errors).toEqual([]);
  console.log('真实 Windows 已安装 EXE 通过：双主题人物、模拟消息、飞踢互动、统计持久化、主题隔离、Windows 通知入口及重启恢复。未读取真实通知或验证扬声器。');
 }catch(error){console.log('::error title=已安装程序诊断::'+String(error.stack||error).concat('\n',processLog.join('')).replace(/%/g,'%25').replace(/\r/g,'%0D').replace(/\n/g,'%0A'));if(app)for(const page of app.windows())await page.screenshot({path:'test-results/windows-installed-failed-'+(page.url().includes('view=pet')?'pet':'panel')+'.png'}).catch(()=>{});throw error}
 finally{if(app)await app.close().catch(()=>{})}
})().catch(error=>{console.error(error);process.exitCode=1});
