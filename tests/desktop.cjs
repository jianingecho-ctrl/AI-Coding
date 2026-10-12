const {_electron:electron}=require('playwright');
const {expect}=require('@playwright/test');
const {mkdtemp,rm,mkdir}=require('node:fs/promises');
const {tmpdir}=require('node:os');
const path=require('node:path');
(async()=>{
 const data=await mkdtemp(path.join(tmpdir(),'judge-desktop-'));
 let app;
 async function launch(){
  app=await electron.launch({args:['.'],env:{...process.env,JUDGE_DATA_DIR:data},timeout:30000});
  await expect.poll(()=>app.windows().length).toBe(2);
  await expect.poll(()=>app.windows().filter(p=>p.url().includes('view=')).length).toBe(2);
  const pet=app.windows().find(p=>p.url().includes('view=pet'));
  const panel=app.windows().find(p=>p.url().includes('view=panel'));
  await panel.getByRole('heading',{name:'测试面板',exact:true}).waitFor();
  await expect(panel.getByRole('button',{name:'发送并触发动画 ↗'})).toBeEnabled();
  return {pet,panel};
 }
 try{
  let {pet,panel}=await launch();
  const errors=[];
  for(const page of [pet,panel])page.on('pageerror',e=>errors.push(e.message));
  const flags=await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().map(w=>({top:w.isAlwaysOnTop(),transparent:w.getBackgroundColor(),frame:w.getTitle(),preferences:w.webContents.getLastWebPreferences()})));
  if(!flags.some(w=>w.top)||flags.some(w=>!w.preferences.contextIsolation||w.preferences.nodeIntegration))throw Error('桌宠窗口安全或置顶设置无效');
  await expect.poll(()=>pet.evaluate(()=>getComputedStyle(document.documentElement).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
  await panel.getByRole('button',{name:'发送并触发动画 ↗'}).click();
  await expect(pet.locator('.slide-kneel')).toBeVisible();await expect(pet.locator('.character.kneel')).toBeVisible();
  await expect(pet.getByText('明天下午3点前、本周',{exact:true})).toBeVisible();
  await pet.getByRole('button',{name:'查看原消息'}).click();await expect(pet.locator('.original')).toBeVisible();
  await pet.getByRole('button',{name:'继续跪着'}).click();await expect(pet.getByRole('button',{name:'正在跪着…'})).toBeVisible();
  await pet.getByRole('button',{name:'收起原消息'}).click();
  await pet.waitForTimeout(1200);await expect(pet.locator('.character.kneel')).toBeVisible();
  await pet.locator('.message-card').evaluate(element=>{element.scrollTop=0;});
  await mkdir('test-results',{recursive:true});await pet.screenshot({path:'test-results/pet.png',omitBackground:true});await panel.screenshot({path:'test-results/panel.png'});
  await pet.getByRole('button',{name:'关闭',exact:true}).click();await expect(pet.locator('.message-card')).toHaveCount(0);
  await expect(pet.locator('.character.fish')).toBeVisible({timeout:7000});
  await expect(pet.locator('.character.yawn')).toBeVisible({timeout:7000});
  for(const [id,action] of [['boss','salute'],['friend','happy'],['colleague','wave']]){
   await panel.getByLabel('消息来自').selectOption(id);await panel.getByRole('button',{name:'发送并触发动画 ↗'}).click();await expect(pet.locator(`.character.${action}`)).toBeVisible();
  }
  await panel.getByRole('button',{name:'联系人',exact:true}).click();await panel.getByLabel('联系人姓名').fill('测试同事');await panel.getByRole('button',{name:'添加联系人'}).click();await expect(panel.getByText('测试同事',{exact:true})).toBeVisible();
  await panel.getByLabel('测试同事的类别').selectOption('讨厌的人');await expect(panel.getByRole('status')).toHaveText('联系人类别已保存。');
  await panel.getByRole('button',{name:'人物设置',exact:true}).click();await panel.getByLabel('小判官昵称').fill('测试判官');await panel.getByLabel('工服颜色').selectOption('蜜桃粉');await panel.getByRole('button',{name:'保存人物设置'}).click();await expect(pet.locator('.pet-name')).toHaveText('测试判官');
  await panel.getByRole('button',{name:'消息历史',exact:true}).click();await expect(panel.locator('.history-item')).toHaveCount(4);
  if(errors.length)throw Error(errors.join('\n'));
  await app.close();({pet,panel}=await launch());
  await expect(pet.locator('.pet-name')).toHaveText('测试判官');await panel.getByRole('button',{name:'联系人',exact:true}).click();await expect(panel.getByLabel('测试同事的类别')).toHaveValue('讨厌的人');
  await panel.getByRole('button',{name:'消息历史',exact:true}).click();await expect(panel.locator('.history-item')).toHaveCount(4);
  panel.once('dialog',d=>d.accept());await panel.getByRole('button',{name:'清空历史'}).click();await expect(panel.locator('.history-item')).toHaveCount(0);
  await panel.close();await expect(pet.locator('.pet-name')).toBeVisible();
  console.log('桌面验收通过：双窗口、安全选项、四类动画、滑跪举牌、原文、持续跪姿、关闭、联系人、人物设置、历史、重启持久化、清空历史。');
 }finally{if(app)await app.close().catch(()=>{});await rm(data,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
