import type {CaptureFrame} from './notifications';
type Line=CaptureFrame['lines'][number];
type PositionedLine=Line&{box:NonNullable<Line['box']>};
interface Match{contactIds:string[];suggested:boolean}
interface PositionedNotification extends Match{sender:string;body:string;confidence:number;clipped:boolean;brandMatched:boolean}
const chrome=/^(飞书|Feishu|Lark|更多内容|更少内容|现在|刚刚|\d+\s*(分钟?|秒钟?|小时)前|\d{1,2}:\d{2})$/i;
// 只以名单中姓名或明确标记的相似姓名为锚点，不把整个截屏的首行当成发送人。
export function positionedNotifications(frame:CaptureFrame,match:(name:string)=>Match):PositionedNotification[]{
 const boxed=frame.lines.filter((line):line is PositionedLine=>Boolean(line.box)&&Boolean(line.text.trim())).map(line=>({...line,text:line.text.trim()}));
 const lines=boxed.filter(line=>!chrome.test(line.text)).sort((a,b)=>a.box.y-b.box.y||a.box.x-b.box.x);
 const anchors=lines.flatMap((line,index)=>{
  const inline=line.text.match(/^([^：:]{1,40})[：:]\s*(.*)$/),sender=inline?inline[1].trim():line.text;
  if(sender.length>40)return [];
  const identity=match(sender);return identity.contactIds.length?[{index,line,sender,inlineBody:inline?.[2].trim()??'',...identity}]:[];
 });
 return anchors.flatMap(anchor=>{
  const body:string[]=anchor.inlineBody?[anchor.inlineBody]:[],used:PositionedLine[]=[anchor.line];
  let bottom=anchor.line.box.y+anchor.line.box.height;
  const next=anchors.find(other=>other.index>anchor.index&&Math.abs(other.line.box.x-anchor.line.box.x)<=Math.max(20,anchor.line.box.height*1.5));
  for(const line of lines.slice(anchor.index+1)){
   if(next&&line.box.y>=next.line.box.y-1)break;
   // 左侧图标、另一列的桌面文件名和远处工具栏不能拼到正文里。
   if(Math.abs(line.box.x-anchor.line.box.x)>Math.max(16,anchor.line.box.height))continue;
   if(line.box.y<bottom-2)continue;
   if(line.box.y-bottom>Math.max(14,anchor.line.box.height*1.5))break;
   body.push(line.text);used.push(line);bottom=line.box.y+line.box.height;
  }
  if(!body.length)return [];
  const last=used[used.length-1];
  const clipped=anchor.line.box.y<2||anchor.line.box.x<2||Boolean(frame.region&&(last.box.y+last.box.height>=frame.region.height-2||used.some(line=>line.box.x+line.box.width>=frame.region!.width-2)));
  const brandMatched=frame.captureMode==='notification-window'&&boxed.some(line=>/^(飞书|Feishu|Lark)$/i.test(line.text)&&line.confidence>=.9&&line.box.y<anchor.line.box.y&&anchor.line.box.y-line.box.y<=120&&Math.abs(line.box.x-anchor.line.box.x)<=100);
  return [{sender:anchor.sender,body:body.join('\n'),confidence:Math.min(...used.map(line=>line.confidence)),contactIds:anchor.contactIds,suggested:anchor.suggested,clipped,brandMatched}];
 });
}
