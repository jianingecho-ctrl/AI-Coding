import {useEffect,useState} from 'react';
import {personaIds,type CharacterId,type CharacterSkin} from '../lib/model';
import {CamelCharacter} from './CamelCharacter';
import {FishCharacter} from './FishCharacter';
import {ReferenceCharacter} from './ReferenceCharacter';
const cache=new Map<string,Promise<string[]>>();
export function Character({character='npc',action='idle',name='小判官',color,skin='desert',duration=1.2,assetId=null}:{character?:CharacterId;action?:string;name?:string;color?:string;skin?:CharacterSkin;duration?:number;assetId?:string|null}){
 const [custom,setCustom]=useState<string[]>([]),[failure,setFailure]=useState('');
 useEffect(()=>{let active=true;setCustom([]);setFailure('');if(assetId){let request=cache.get(assetId);if(!request){request=window.judge.getAssetFrames(assetId);cache.set(assetId,request);}request.then(frames=>{if(active)setCustom(frames)}).catch(()=>{cache.delete(assetId);if(active)setFailure('素材无法读取，使用内置人物');});}return()=>{active=false}},[assetId]);
 const builtin=personaIds.includes(character as typeof personaIds[number]);
 const frames=custom;
 const framesKey=custom.length?assetId:`${character}/${action}`;
 const [index,setIndex]=useState(0);
 useEffect(()=>{setIndex(0);if(frames.length<=1||matchMedia('(prefers-reduced-motion: reduce)').matches)return;const timer=setInterval(()=>setIndex(i=>(i+1)%frames.length),duration*1000/frames.length);return()=>clearInterval(timer)},[framesKey,frames.length,duration]);
 useEffect(()=>{for(const url of frames){const img=new Image();img.src=url;}},[framesKey,frames.length]);
 if(builtin&&!custom.length)return <ReferenceCharacter character={character} skin={skin} duration={duration} name={name}/>;
 if(custom.length)return <div className={`character frame-character ${custom.length?'custom-art':'frame-skin-'+skin} ${action}`} data-character={character} data-pose={action==='kneel'||action==='panic'?'kneeling':action==='lie'?'lying':'standing'} data-frame={index} data-asset={custom.length?assetId:undefined} aria-label={`${name} · ${action}`}>
  <img src={frames[index%frames.length]} alt={custom.length?'自定义人物素材':'原创卡通人物序列帧'} draggable={false}/>{failure&&<small>{failure}</small>}
 </div>;
 if(character==='camel')return <CamelCharacter action={action} name={name} color={color} skin={skin}/>;
 return <FishCharacter character={character as import('../lib/model').FishCharacterId} action={action} name={name} color={color} skin={skin}/>;
}
