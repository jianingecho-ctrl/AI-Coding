import {useEffect,useRef,useState} from 'react';
import lottie from 'lottie-web/build/player/lottie_light';
import {referenceAnimation} from '../lib/reference-art';
import type {CharacterId,CharacterSkin} from '../lib/model';
import {characterLabels} from '../lib/effects';
export function ReferenceCharacter({character,skin,duration,name}:{character:CharacterId;skin:CharacterSkin;duration:number;name:string}){
 const container=useRef<HTMLDivElement>(null),[ready,setReady]=useState(false);
 useEffect(()=>{
  setReady(false);const media=matchMedia('(prefers-reduced-motion: reduce)');
  const anim=lottie.loadAnimation({container:container.current!,renderer:'svg',loop:true,autoplay:!media.matches,animationData:referenceAnimation(character,import.meta.env.BASE_URL),rendererSettings:{preserveAspectRatio:'xMidYMid meet'}});
  anim.setSpeed(2/duration);anim.addEventListener('DOMLoaded',()=>setReady(true));
  const change=()=>media.matches?anim.pause():anim.play();media.addEventListener('change',change);
  const visibility=()=>document.hidden?anim.pause():change();document.addEventListener('visibilitychange',visibility);
  return()=>{media.removeEventListener('change',change);document.removeEventListener('visibilitychange',visibility);anim.destroy()};
 },[character,duration]);
 return <div ref={container} className={'character reference-character frame-skin-'+skin} role="img" aria-label={name+'，'+characterLabels[character]+'，原图姿态'} data-character={character} data-pose="reference" data-ready={ready?'true':'false'}/>;
}
