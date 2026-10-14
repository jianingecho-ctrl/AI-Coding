import type {Message,MessageQueueStatus} from '../src/lib/model';
import {contactPriority,priorityRank} from '../src/lib/message-priority';
// 队列不持久化：消息历史已保存。关闭当前卡片后按优先级继续，同级先到先出。
export class MessageDisplayQueue{
 private current:Message|null=null;private pending:Message[]=[];private held=false;
 constructor(private display:(message:Message)=>void,private empty:()=>void,private changed:(status:MessageQueueStatus)=>void){}
 get():MessageQueueStatus{return {activeId:this.current?.id??null,pending:this.pending.map(m=>({id:m.id,name:m.contact.name,priority:contactPriority(m.contact)}))};}
 private publish(){this.changed(this.get());}
 private sort(){this.pending.sort((a,b)=>priorityRank(b)-priorityRank(a));this.pending=this.pending.slice(0,200);}
 private show(message:Message){this.current=message;this.held=false;this.display(message);this.publish();}
 push(message:Message){
  if(this.current?.id===message.id||this.pending.some(m=>m.id===message.id))return;
  if(!this.current){this.show(message);return;}
  this.pending.push(message);this.sort();
  if(!this.held&&priorityRank(this.pending[0])>priorityRank(this.current)){const next=this.pending.shift()!;this.pending.unshift(this.current);this.sort();this.show(next)}else this.publish();
 }
 force(message:Message){this.pending=this.pending.filter(m=>m.id!==message.id);if(this.current&&this.current.source==='notification'&&!this.current.preview&&this.current.id!==message.id){this.pending.push(this.current);this.sort();}this.show(message);}
 hold(id:string,hold:boolean){if(this.current?.id!==id)return;this.held=hold;if(!hold&&this.pending.length&&priorityRank(this.pending[0])>priorityRank(this.current)){const next=this.pending.shift()!;this.pending.unshift(this.current);this.sort();this.show(next);}this.publish();}
 advance(id:string){if(this.current?.id!==id)return;const next=this.pending.shift();if(next)this.show(next);else{this.current=null;this.held=false;this.empty();this.publish();}}
 clear(){this.current=null;this.pending=[];this.held=false;this.empty();this.publish();}
}
