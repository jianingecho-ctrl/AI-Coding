import {personaArt} from './persona-art';
import {leaderOutline} from './leader-outline';
import type {CharacterId} from './model';
export const referenceArt=personaArt;
export function referenceAnimation(character:CharacterId,baseUrl:string){
 if(!(character in referenceArt))throw new Error('人物素材不存在');
 const art=referenceArt[character as keyof typeof referenceArt];
 const [w,h]=art.size,[x,y,bw,bh]=art.bounds;
 const scale=Math.min(276/bw,330/bh),center=[x+bw/2,y+bh/2,0];
 // 六个角色直接播放精细透明 PNG；蟹老板保留原图，用像素级轮廓几何显示。
 const masks=character==='leader'?leaderOutline.map((points,index)=>({inv:false,mode:index===0?'a':'s',pt:{a:0,k:{i:points.map(()=>[0,0]),o:points.map(()=>[0,0]),v:points,c:true}},o:{a:0,k:100},x:{a:0,k:0},nm:'精细轮廓'})):undefined;
 return {v:'5.12.2',fr:30,ip:0,op:60,w:300,h:370,nm:'本地人物待机',ddd:0,assets:[{id:'person',w,h,u:baseUrl+(character==='leader'?'references/':'characters/'),p:art.file,e:0}],layers:[{ddd:0,ind:1,ty:2,nm:'参考人物',refId:'person',sr:1,ks:{o:{a:0,k:100},r:{a:0,k:0},p:{a:1,k:[{t:0,s:[150,181,0],e:[150,184,0],i:{x:[.42],y:[1]},o:{x:[.58],y:[0]}},{t:30,s:[150,184,0],e:[150,181,0],i:{x:[.42],y:[1]},o:{x:[.58],y:[0]}},{t:60,s:[150,181,0]}]},a:{a:0,k:center},s:{a:0,k:[scale*100,scale*100,100]}},ao:0,...(masks?{hasMask:true,masksProperties:masks}:{}),ip:0,op:60,st:0,bm:0}]};
}
