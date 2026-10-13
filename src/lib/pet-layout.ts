export interface Rectangle{x:number;y:number;width:number;height:number}
export function petWindowSize(scale:number,expanded:boolean){
 return {width:expanded?420:Math.max(260,Math.ceil(210*scale+48)),height:Math.ceil(259*scale)+(expanded?426:134)};
}
export function resizedPetBounds(previous:Rectangle,area:Rectangle,scale:number,expanded:boolean):Rectangle{
 const size=petWindowSize(scale,expanded),width=Math.min(size.width,area.width),height=Math.min(size.height,area.height);
 return {width,height,x:Math.round(Math.max(area.x,Math.min(previous.x+(previous.width-width)/2,area.x+area.width-width))),y:Math.round(Math.max(area.y,Math.min(previous.y+previous.height-height,area.y+area.height-height)))};
}
