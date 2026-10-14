const {_electron}=require('playwright');
const {expect}=require('@playwright/test');
const {writeFile,readFile}=require('node:fs/promises');
const path=require('node:path');
async function launchEdition(base,edition,errors=[],extraEnv={}){
 const config=path.join(base,'fixture-'+edition+'.json');await writeFile(config,JSON.stringify({id:edition}));
 const fixed=JSON.parse(await readFile('edition.json','utf8')).id;
 const env={...process.env,...extraEnv,JUDGE_DATA_DIR:base,ELECTRON_RUN_AS_NODE:''};
 delete env.JUDGE_EDITION_FILE;
 if(fixed!==edition)env.JUDGE_EDITION_FILE=config;
 const app=await _electron.launch({args:[...(process.platform==='linux'?['--no-sandbox']:[]),'.'],env,timeout:30000});
 await expect.poll(()=>app.windows().filter(p=>p.url().includes('view=')).length).toBe(2);
 const pet=app.windows().find(p=>p.url().includes('view=pet')),panel=app.windows().find(p=>p.url().includes('view=panel'));
 for(const page of [pet,panel])page.on('pageerror',e=>errors.push(e.message));
 await expect(panel.getByRole('button',{name:'发送测试消息 ↗'})).toBeEnabled();await expect(pet.locator('.reference-character[data-ready="true"]').first()).toBeVisible();
 const info=await panel.evaluate(()=>window.judge.getAppInfo());expect(info.edition).toBe(edition);
 return {app,pet,panel,info,env};
}
module.exports={launchEdition};
