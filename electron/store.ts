import { promises as fs } from 'node:fs';
import path from 'node:path';
import { defaultState,stateSchema,type State } from '../src/lib/model';
export class Store {
  private state:State;
  private queue:Promise<unknown>=Promise.resolve();
  constructor(private file:string,initialState:State=defaultState,private normalize:(state:State)=>State=s=>s){this.state=structuredClone(initialState);}
  async load(){
    try{const saved=JSON.parse(await fs.readFile(this.file,'utf8'));
      // 旧版默认人工确认；本次升级按用户要求启用自动进场一次，之后尊重用户开关。
      if(saved.notifications&&saved.notifications.deliveryModeVersion!==2)saved.notifications={...saved.notifications,autoDeliver:true,deliveryModeVersion:2};
      this.state=this.normalize(stateSchema.parse(saved));}
    catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT'){
      // 损坏文件保留供用户恢复，绝不静默覆盖。
      await fs.rename(this.file,`${this.file}.invalid-${Date.now()}`);
      console.warn('本地配置无法读取，已保留备份并恢复默认设置。');
    }}
    return this.get();
  }
  get(){return structuredClone(this.state);}
  update(mutator:(state:State)=>State):Promise<State>{
    const operation=this.queue.then(async()=>{
      const next=stateSchema.parse(this.normalize(mutator(this.get())));
      await fs.mkdir(path.dirname(this.file),{recursive:true});
      const temporary=this.file+'.tmp';
      await fs.writeFile(temporary,JSON.stringify(next,null,2),{mode:0o600});
      await fs.rename(temporary,this.file);
      this.state=next;
      return this.get();
    });
    this.queue=operation.catch(()=>{});
    return operation;
  }
}
