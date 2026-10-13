import {categories,personaIds,type Contact,type Message} from './model';
export const demoContacts:Contact[]=categories.map((category,i)=>({id:'demo-'+personaIds[i],name:'演示 · '+category,category}));
export class DemoPlayer{
 private generation=0;
 private timer:ReturnType<typeof setTimeout>|undefined;
 private finishWait:(()=>void)|undefined;
 stop(){this.generation++;if(this.timer!==undefined)clearTimeout(this.timer);this.timer=undefined;this.finishWait?.();this.finishWait=undefined;}
 async play(show:(contact:Contact)=>Promise<Message>,onStep:(index:number,contact:Contact)=>void,hold?:(duration:number)=>Promise<void>):Promise<boolean>{
  this.stop();const generation=this.generation;
  for(let i=0;i<demoContacts.length;i++){
   if(generation!==this.generation)return false;
   onStep(i+1,demoContacts[i]);const message=await show(demoContacts[i]);
   if(generation!==this.generation)return false;
   const duration=(message.effect?.duration??1.2)*1000+1200;
   if(hold)await hold(duration);else await new Promise<void>(resolve=>{this.finishWait=resolve;this.timer=setTimeout(()=>{this.timer=undefined;this.finishWait=undefined;resolve()},duration)});
  }
  return generation===this.generation;
 }
}
