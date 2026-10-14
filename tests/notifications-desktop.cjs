const {expect}=require('@playwright/test');
const {mkdtemp,writeFile,rm,mkdir,access,readFile}=require('node:fs/promises');
const path=require('node:path'),{tmpdir}=require('node:os');
const {launchEdition}=require('./edition-app.cjs');
function frame(...lines){return {status:'recognized',context:'system-notification',lines:lines.map(text=>({text,confidence:.98}))};}
(async()=>{
 const base=await mkdtemp(path.join(tmpdir(),'judge-live-notifications-')),errors=[],sessions=[];
 const edition=JSON.parse(await readFile('edition.json','utf8')).id;
 const editions=[edition];try{await access('public/characters/'+(edition==='ocean'?'palace_emperor':'npc')+'.png');editions.push(edition==='ocean'?'palace':'ocean')}catch{}
 await mkdir('test-results',{recursive:true});
 try{
  for(const id of editions){
   const fixture=path.join(base,id+'-capture.json');await writeFile(fixture,JSON.stringify(frame('飞书','测试项目群','小林 Lin：请今天16点前交测试稿','测试项目群','小林 Lin：请回复是否收到')));
   let session=await launchEdition(base,id,errors,{JUDGE_NOTIFICATION_FIXTURE:fixture});sessions.push(session);
   let {app,pet,panel}=session;
   // 从实际联系人编辑器保存通知别名，人物仍使用各自版本默认配置。
   const state=await panel.evaluate(()=>window.judge.getState()),name=state.contacts.find(c=>c.id==='honest').name;
   await panel.locator('[data-tab="联系人"]').click();await panel.getByRole('button',{name:'自定义'+name+'的效果',exact:true}).click();
   await panel.getByLabel('通知姓名别名',{exact:true}).fill('小林 Lin\n');await panel.getByRole('button',{name:'保存个性效果',exact:true}).click();
   await expect.poll(()=>panel.evaluate(async()=> (await window.judge.getState()).contacts.find(c=>c.id==='honest').notificationNames)).toEqual(['小林 Lin']);
   // 即使模拟页启用了在线 AI，真实通知仍坚持本机规则解析。
   await panel.evaluate(async()=>{const s=await window.judge.getState();await window.judge.saveSettings({contacts:s.contacts,pet:s.pet,ai:{...s.ai,enabled:true,provider:'openai-compatible',baseUrl:'http://127.0.0.1:1/v1',model:'notification-test'}})});
   await panel.locator('[data-tab="飞书通知"]').click();await expect(panel.getByText('自动验收夹具 · 未读取系统通知',{exact:true})).toBeVisible();
   await expect(panel.locator('[data-notification-state]')).toHaveAttribute('data-notification-state','paused');
   await panel.getByRole('button',{name:'识别一次',exact:true}).click();await expect(panel.locator('.notification-draft')).toHaveCount(2);await expect(panel.getByRole('region',{name:'本轮识别结果'})).toContainText('2 条姓名与正文');await panel.getByText('查看本轮识别的原始文字',{exact:true}).click();await expect(panel.locator('.capture-result ol')).toContainText('小林 Lin：请今天16点前交测试稿');
   expect(await panel.evaluate(async()=> (await window.judge.getState()).history.length)).toBe(0);
   const first=panel.locator('.notification-draft').first();await expect(first).toContainText('测试项目群');await expect(first.getByLabel('对应联系人',{exact:true})).toHaveValue('honest');
   await first.getByRole('button',{name:'确认送达桌宠',exact:true}).click();await expect(pet.locator('.message-card')).toBeVisible();
   await expect(pet.locator('[data-character="'+(id==='ocean'?'honest':'palace_meizhuang')+'"]')).toBeVisible();
   await expect(pet.locator('.notification-source')).toContainText('通知验收夹具 · 未读取屏幕 · 人工确认');await expect(pet.locator('.message-card')).toContainText('真实通知仅在本机规则解析');
   const received=await panel.evaluate(async()=> (await window.judge.getState()).history[0]);expect(received.source).toBe('notification');expect(received.notification).toMatchObject({group:'测试项目群',fixture:true,observedSender:'小林 Lin',confirmedByUser:true});expect(received.summary.source).toBe('本地规则摘要');
   // 来源限制不破坏已有互动、今日计数和本地回复；复制不会发送给飞书。
   for(const [kind,label] of [['elbow','肘击'],['slap','扇嘴'],['burn','烧心'],['heart','比心']]){await pet.getByRole('button',{name:label,exact:true}).click();await expect(pet.locator('[data-interaction="'+kind+'"]')).toBeVisible();await expect(pet.locator('[data-count="'+kind+'"]')).toHaveText(label+' 1 次');}
   await pet.getByRole('button',{name:'查看通知内容',exact:true}).click();await expect(pet.locator('.original')).toContainText(received.text);
   await pet.getByRole('button',{name:'回复消息',exact:true}).click();await pet.getByLabel('回复草稿内容',{exact:true}).fill('收到，测试回复草稿。');await pet.getByRole('button',{name:'保存回复草稿',exact:true}).click();await expect(pet.locator('.local-replies')).toContainText('未发送到飞书');await pet.getByRole('button',{name:'复制回复',exact:true}).click();expect(await app.evaluate(({clipboard})=>clipboard.readText())).toBe('收到，测试回复草稿。');
   await panel.locator('.notification-draft').getByRole('button',{name:'忽略这条',exact:true}).click();await panel.getByRole('button',{name:'识别一次',exact:true}).click();await expect(panel.locator('.notification-draft')).toHaveCount(0);expect(await panel.evaluate(async()=> (await window.judge.getState()).history.length)).toBe(1);
   const settings=panel.getByRole('form',{name:'通知识别设置'});await settings.getByLabel('匹配明确的通知自动送达桌宠',{exact:true}).check();await settings.getByLabel('识别间隔（秒）',{exact:true}).fill('2');await settings.getByRole('button',{name:'保存通知设置',exact:true}).click();await expect(panel.getByText('通知设置已保存，识别保持暂停。',{exact:true})).toBeVisible();
   await panel.getByRole('button',{name:'开始监测',exact:true}).click();await expect(panel.locator('[data-notification-state]')).toHaveAttribute('data-notification-state','watching');expect(await panel.evaluate(async()=> (await window.judge.getState()).history.length)).toBe(1);
   await writeFile(fixture,JSON.stringify(frame('飞书','测试项目群','小林 Lin：新通知，请明天12点前提交测试稿')));
   await expect.poll(()=>panel.evaluate(async()=> (await window.judge.getState()).history.length),{timeout:10000}).toBe(2);await expect(pet.locator('.notification-source')).toContainText('自动匹配');
   await panel.getByRole('button',{name:'暂停识别',exact:true}).click();await expect(panel.locator('[data-notification-state]')).toHaveAttribute('data-notification-state','paused');
   const saved=await panel.evaluate(()=>window.judge.getState());expect(saved.history[0].notification.confirmedByUser).toBe(false);expect(saved.history.find(m=>m.replies?.length).replies[0].text).toBe('收到，测试回复草稿。');expect(saved.interactions[0].counts).toEqual({elbow:1,slap:1,burn:1,heart:1});
   // 无法确认窗口来源的内容，即使自动选项开启也停在草稿。
   await writeFile(fixture,JSON.stringify({...frame('小林 Lin：未知来源需要人工核对'),context:'unknown'}));await panel.getByRole('button',{name:'识别一次',exact:true}).click();await expect(panel.locator('.notification-draft')).toHaveCount(1);await expect(panel.locator('.notification-draft')).toContainText('来源');
   await panel.screenshot({path:'test-results/'+id+'-notification-fixture.png'});await pet.screenshot({path:'test-results/'+id+'-notification-pet-fixture.png',omitBackground:true});
   await panel.getByRole('button',{name:'清空草稿并暂停',exact:true}).click();await expect(panel.locator('.notification-draft')).toHaveCount(0);await expect(panel.locator('.capture-result')).toHaveCount(0);
   await writeFile(fixture,JSON.stringify(frame('飞书','小张 Zhang','卡片甲','小张 Zhang','卡片乙','小张 Zhang','卡片丙','小张 Zhang','卡片丁')));await panel.getByRole('button',{name:'识别一次',exact:true}).click();await expect(panel.locator('.notification-draft')).toHaveCount(4);await expect(panel.getByRole('region',{name:'本轮识别结果'})).toContainText('4 条姓名与正文');await expect(panel.locator('.notification-draft').first().getByLabel('核对通知正文')).toHaveValue('卡片丁');expect(await panel.evaluate(()=>window.judge.getState())).toEqual(saved);await panel.getByRole('button',{name:'清空草稿并暂停',exact:true}).click();
   await writeFile(fixture,JSON.stringify({status:'permission-required',message:'验收夹具：录屏未授权'}));await panel.getByRole('button',{name:'识别一次',exact:true}).click();await expect(panel.locator('[data-notification-state]')).toHaveAttribute('data-notification-state','blocked');await expect(panel.getByRole('alert').first()).toContainText('录屏未授权');expect(await panel.evaluate(()=>window.judge.getState())).toEqual(saved);
   await app.close();session=await launchEdition(base,id,errors,{JUDGE_NOTIFICATION_FIXTURE:fixture});sessions[sessions.length-1]=session;({app,pet,panel}=session);
   expect(await panel.evaluate(()=>window.judge.getState())).toEqual(saved);expect((await panel.evaluate(()=>window.judge.notificationStatus())).state).toBe('paused');expect((await panel.evaluate(()=>window.judge.notificationStatus())).drafts).toEqual([]);
   console.log(id+' 通知桌面验收通过：群消息拆分、别名与人物、人工确认/自动送达/基线/去重/暂停、互动计数、回复复制、权限失败与重启。测试使用 OCR 夹具，未验证真实 Mac 截图。');
  }
  if(sessions.length===2){
   const [a,b]=sessions,bBefore=await b.panel.evaluate(()=>window.judge.getState());
   await a.panel.evaluate(async()=>{await window.judge.saveNotificationSettings({region:{mode:'primary',x:0,y:0,width:320,height:200},intervalSeconds:5,autoDeliver:false});await window.judge.clearHistory()});
   expect(await b.panel.evaluate(()=>window.judge.getState())).toEqual(bBefore);expect((await b.panel.evaluate(()=>window.judge.notificationStatus())).state).toBe('paused');
   console.log('通知设置、运行状态、来源历史和清除操作两版隔离通过。');
  }
  if(errors.length)throw Error(errors.join('\n'));
 }catch(error){for(const s of sessions)for(const page of s.app.windows())await page.screenshot({path:'test-results/notification-failure-'+s.info.edition+'-'+(page.url().includes('pet')?'pet':'panel')+'.png'}).catch(()=>{});throw error}
 finally{for(const s of sessions)await s.app.close().catch(()=>{});await rm(base,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1});
