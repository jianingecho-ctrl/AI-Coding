const {_electron:electron}=require('playwright');
const {expect}=require('@playwright/test');
const {mkdtemp,rm,mkdir,readFile,writeFile,copyFile}=require('node:fs/promises');
const {tmpdir}=require('node:os');
const path=require('node:path');
(async()=>{
 const data=await mkdtemp(path.join(tmpdir(),'judge-mvp-')),source=await mkdtemp(path.join(tmpdir(),'judge-source-'));
 let app;const errors=[];
 async function launch(){
  app=await electron.launch({args:[...(process.platform==='linux'?['--no-sandbox']:[]),'.'],env:{...process.env,JUDGE_DATA_DIR:data,ELECTRON_RUN_AS_NODE:''},timeout:30000});
  await expect.poll(()=>app.windows().filter(p=>p.url().includes('view=')).length).toBe(2);
  const pet=app.windows().find(p=>p.url().includes('view=pet')),panel=app.windows().find(p=>p.url().includes('view=panel'));
  for(const page of [pet,panel])page.on('pageerror',e=>errors.push(e.message));
  await expect(panel.getByRole('button',{name:'发送并触发动画 ↗'})).toBeEnabled();return {pet,panel};
 }
 async function readyImage(page,selector='.character'){if(selector.includes('asset-item')){await expect.poll(()=>page.locator(selector).first().evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);return;}await expect(page.locator('.reference-character[data-ready="true"],.frame-character img').first()).toBeVisible();}
 async function send(panel,id){await panel.getByLabel('消息来自').selectOption(id);await panel.getByRole('button',{name:'发送并触发动画 ↗'}).click();await expect(panel.getByRole('status')).toHaveText('消息已送达桌宠，打开桌宠窗口查看动画。');}
 async function pick(files){await app.evaluate(({dialog},paths)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:paths});},files);}
 try{
  await mkdir('test-results',{recursive:true});let {pet,panel}=await launch();await readyImage(pet);
  await expect(pet.locator('[data-character="npc"]')).toBeVisible();
  const flags=await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().map(w=>({top:w.isAlwaysOnTop(),prefs:w.webContents.getLastWebPreferences()})));
  expect(flags.some(w=>w.top)).toBe(true);expect(flags.every(w=>w.prefs.contextIsolation&&!w.prefs.nodeIntegration)).toBe(true);
  expect(await pet.evaluate(()=>getComputedStyle(document.documentElement).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
  expect(await pet.locator('.pet-drag').evaluate(e=>getComputedStyle(e).webkitAppRegion)).toBe('drag');
  const roles=['leader','honest','bored','laidback','silly','bigSilly','npc'],ids=['boss','honest','bored','laidback','silly','bigSilly','npc'],actions=Array(7).fill('stand'),entries=['run','walk','float','roll','jump','slide','fade'];
  const frames=new Set();
  for(let i=0;i<roles.length;i++){
   await send(panel,ids[i]);await expect(pet.locator('[data-character="'+roles[i]+'"]')).toBeVisible();await readyImage(pet);
   expect(await pet.locator('.pet-scene').getAttribute('class')).toContain('entry-'+entries[i]);
   expect(await pet.locator('.reference-character image').first().getAttribute('href')).toContain('/references/'+roles[i]);
   const initial=await pet.locator('.reference-character').evaluate(e=>Array.from(e.querySelectorAll('g[transform]')).map(g=>g.getAttribute('transform')).join('|'));await expect.poll(()=>pet.locator('.reference-character').evaluate(e=>Array.from(e.querySelectorAll('g[transform]')).map(g=>g.getAttribute('transform')).join('|'))).not.toBe(initial);frames.add(roles[i]);
  }
  expect(frames.size).toBe(7);
  await send(panel,'bigSilly');await expect(pet.locator('[data-pose="reference"]')).toBeVisible();
  await pet.locator('.pet-scene').evaluate(async e=>{await Promise.all(e.getAnimations().map(a=>a.finished.catch(()=>{})))});
  await pet.screenshot({path:'test-results/mvp-message.png',omitBackground:true});
  await expect(pet.getByText('未调用 AI',{exact:false})).toBeVisible();await expect(pet.getByText('明天下午3点前、本周',{exact:true})).toBeVisible();
  await expect(pet.locator('dt').filter({hasText:'紧急程度'})).toBeVisible();
  await pet.getByRole('button',{name:'查看原消息'}).click();await expect(pet.locator('.original')).toBeVisible();
  await pet.getByRole('button',{name:'肘击',exact:true}).click();await expect(pet.locator('.elbow-effect')).toBeVisible();
  await pet.getByRole('button',{name:'忽略',exact:true}).click();await expect(pet.getByRole('button',{name:'重新查看 · 甩锅达人'})).toBeVisible();await expect(pet.locator('.message-card')).toHaveCount(0);
  const ignoredCount=await panel.evaluate(async()=> (await window.judge.getState()).history.length);
  await pet.getByRole('button',{name:'重新查看 · 甩锅达人'}).click();await expect(pet.locator('.message-card')).toBeVisible();expect(await panel.evaluate(async()=> (await window.judge.getState()).history.length)).toBe(ignoredCount);
  await pet.getByRole('button',{name:'回复消息',exact:true}).click();await pet.getByLabel('模拟回复内容',{exact:true}).fill('收到，明天下午3点前提交。');await pet.getByRole('button',{name:'发送模拟回复',exact:true}).click();await expect(pet.locator('.local-replies')).toContainText('收到，明天下午3点前提交。');
  await pet.getByRole('button',{name:'忽略',exact:true}).click();await pet.getByRole('button',{name:'重新查看 · 甩锅达人'}).click();await expect(pet.locator('.local-replies')).toContainText('收到，明天下午3点前提交。');
  const replied=await panel.evaluate(async()=> (await window.judge.getState()).history[0]);expect(replied.replies[0].text).toBe('收到，明天下午3点前提交。');
  await pet.getByRole('button',{name:'关闭',exact:true}).click();await expect(pet.locator('[data-character="npc"]')).toBeVisible();
  await panel.getByRole('button',{name:'人物设置',exact:true}).click();await panel.getByRole('group',{name:'七类原创人物'}).screenshot({path:'test-results/mvp-roles.png'});
  // UI 实际修改人物、时长、皮肤，桌面预览不增加历史。
  await panel.getByRole('button',{name:'联系人',exact:true}).click();await panel.getByRole('button',{name:'自定义甩锅达人的效果'}).click();
  const editor=panel.getByRole('region',{name:'个性效果编辑器'});
  await editor.getByLabel('消息人物',{exact:true}).selectOption('honest');await editor.getByLabel('进场方式',{exact:true}).selectOption('walk');await editor.getByLabel('动画时长（秒）',{exact:true}).fill('3');await editor.getByLabel('人物皮肤',{exact:true}).selectOption('neon');await editor.getByLabel('消息卡片皮肤',{exact:true}).selectOption('chat');
  await editor.getByRole('button',{name:'保存个性效果'}).click();await expect(panel.getByRole('status')).toHaveText('个性效果已保存。');
  const count=await panel.evaluate(async()=> (await window.judge.getState()).history.length);
  await panel.getByRole('region',{name:'个性效果编辑器'}).getByRole('button',{name:'播放桌面预览'}).click();
  await expect(pet.locator('[data-character="honest"]')).toBeVisible();expect(await pet.locator('.pet-scene').evaluate(e=>getComputedStyle(e).animationDuration)).toBe('3s');
  expect(await panel.evaluate(async()=> (await window.judge.getState()).history.length)).toBe(count);await expect(pet.locator('.card-chat')).toBeVisible();
  // 窗口隐藏、恢复、置顶切换与消息自动显示。
  await pet.getByRole('button',{name:'隐藏',exact:true}).click();
  await expect.poll(()=>app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('view=pet')).isVisible())).toBe(false);
  await panel.getByRole('button',{name:'显示桌宠',exact:true}).first().click();await expect.poll(()=>app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('view=pet')).isVisible())).toBe(true);
  await panel.evaluate(async()=>{const s=await window.judge.getState();await window.judge.saveSettings({contacts:s.contacts,pet:{...s.pet,alwaysOnTop:false}})});
  expect(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('view=pet')).isAlwaysOnTop())).toBe(false);
  // 原生文件选择入口导入图片、GIF、序列帧，三类素材必须实际显示。
  await panel.getByRole('button',{name:'人物设置',exact:true}).click();
  const png=path.join(source,'pet.png');await copyFile('public/references/npc.png',png);await pick([png]);
  await panel.getByRole('button',{name:'上传图片 / GIF / 序列帧'}).click();await expect(panel.locator('.asset-item')).toHaveCount(1);await readyImage(panel,'.asset-item img');
  const gif=path.join(source,'pet.gif');await writeFile(gif,Buffer.from('R0lGODlhAgACAIEAAP8AAP///wAAAAAAACH5BAAKAAAAIf8LTkVUU0NBUEUyLjADAQAAACwAAAAAAgACAAAIBgABCAQQEAAh+QQACgAAACwAAAAAAgACAIEA/wD///8AAAAAAAAIBgABCAQQEAA7','base64'));await pick([gif]);
  await panel.getByRole('button',{name:'上传图片 / GIF / 序列帧'}).click();await expect(panel.locator('.asset-item')).toHaveCount(2);await readyImage(panel,'.asset-item:nth-child(2) img');
  const png2=path.join(source,'pet2.png');await copyFile('public/references/bored.png',png2);await pick([png2,png]);await panel.getByRole('button',{name:'上传图片 / GIF / 序列帧'}).click();await expect(panel.locator('.asset-item')).toHaveCount(3);
  const assets=await panel.evaluate(async()=> (await window.judge.getState()).assets);expect(assets.map(a=>a.kind)).toEqual(['image','gif','sequence']);
  for(const asset of assets){await panel.evaluate(async id=>{const s=await window.judge.getState();await window.judge.previewContact({...s.contacts[0],effects:{character:'leader',action:'salute',assetId:id,duration:.4}})},asset.id);await expect(pet.locator('[data-asset="'+asset.id+'"]')).toBeVisible();await readyImage(pet);if(asset.kind==='sequence'){const first=await pet.locator('.character').getAttribute('data-frame');await expect.poll(()=>pet.locator('.character').getAttribute('data-frame')).not.toBe(first);}}
  await panel.evaluate(async id=>{const s=await window.judge.getState();await window.judge.saveSettings({contacts:s.contacts,pet:{...s.pet,assetId:id}})},assets[2].id);
  await pet.getByRole('button',{name:'关闭',exact:true}).click();await expect(pet.locator('[data-asset="'+assets[2].id+'"]')).toBeVisible();
  // 启用在线 AI 但没有 Key：不假装调用，实际弹窗明确规则降级。
  await panel.evaluate(async()=>{const s=await window.judge.getState();await window.judge.saveSettings({contacts:s.contacts,pet:s.pet,ai:{enabled:true,provider:'openai-compatible',model:'test'}})});
  await panel.getByRole('button',{name:'测试面板',exact:true}).click();await send(panel,'boss');await expect(pet.getByText('未配置 API Key，未调用真实 AI，当前使用本地规则解析。')).toBeVisible();
  await rm(source,{recursive:true,force:true});await app.close();({pet,panel}=await launch());await expect(pet.locator('[data-asset="'+assets[2].id+'"]')).toBeVisible();await readyImage(pet);
  const restored=await panel.evaluate(()=>window.judge.getState());expect(restored.history.length).toBe(count+1);expect(restored.contacts.find(c=>c.id==='bigSilly').effects.duration).toBe(3);expect(restored.assets.length).toBe(3);expect(restored.history.find(m=>m.replies?.length).replies[0].text).toBe('收到，明天下午3点前提交。');
  await panel.evaluate(async()=>{for(const input of [{messageId:'missing',text:'测试'},{messageId:'boss',text:' '}]){let rejected=false;try{await window.judge.replyMessage(input)}catch{rejected=true}if(!rejected)throw Error('非法回复未被拒绝')}});
  const disk=JSON.parse(await readFile(path.join(data,'judge-state.json'),'utf8'));expect(JSON.stringify(disk)).not.toContain('apiKey');
  await panel.evaluate(async()=>{try{await window.judge.getAssetFrames('../../private');throw Error('未拒绝')}catch(e){if(String(e).includes('未拒绝'))throw e}});
  await pet.emulateMedia({reducedMotion:'reduce'});await panel.evaluate(async()=>{const s=await window.judge.getState();await window.judge.previewContact(s.contacts[1])});await expect(pet.locator('[data-character="honest"]')).toBeVisible();expect(await pet.locator('.pet-scene').evaluate(e=>getComputedStyle(e).animationName)).toBe('none');
  await panel.screenshot({path:'test-results/mvp-panel.png'});await panel.getByRole('button',{name:'消息历史',exact:true}).click();await panel.getByRole('button',{name:'恢复到桌面',exact:true}).first().click();await expect(pet.locator('.message-card')).toBeVisible();if(errors.length)throw Error(errors.join('\n'));
  console.log('Electron 桌面验收通过：七张 Word 原图/Lottie 动画、七种进场、回复消息/肘击/忽略、个人优先级/时长/皮肤、真实文件导入与显示（图片/GIF/序列帧）、隐藏恢复/置顶、无密钥规则降级、重启持久化与减少动态效果。');
 }catch(e){if(app)for(const page of app.windows())await page.screenshot({path:'test-results/failure-'+(page.url().includes('pet')?'pet':'panel')+'.png'}).catch(()=>{});throw e;}
 finally{if(app)await app.close().catch(()=>{});await rm(data,{recursive:true,force:true});await rm(source,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1});
