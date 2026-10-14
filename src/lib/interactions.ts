import type {DailyInteraction,InteractionCounts,InteractionKind} from './model';

export const interactionLabels:Record<InteractionKind,string>={elbow:'肘击',slap:'扇嘴',burn:'烧心',heart:'比心',marry:'嫁给ta',kick:'飞踢ta'};
export const emptyCounts=():InteractionCounts=>({elbow:0,slap:0,burn:0,heart:0,marry:0,kick:0});
// 以 Mac 的本地日历日期计数，不能用 UTC 的 toISOString().slice(0,10)。
export function localDay(date=new Date()):string{
 return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function todayCounts(rows:DailyInteraction[],contactId:string,day:string):InteractionCounts{
 return rows.find(r=>r.contactId===contactId&&r.day===day)?.counts??emptyCounts();
}
export function interactionLine(kind:InteractionKind,name:string,count:number){return kind==='marry'?`今天你已向${name}求婚 ${count} 次`:kind==='kick'?`今天你已飞踢${name} ${count} 次`:`今天你已${interactionLabels[kind]}${name} ${count} 次`;}
