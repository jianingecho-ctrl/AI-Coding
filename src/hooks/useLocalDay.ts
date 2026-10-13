import {useEffect,useState} from 'react';
import {localDay} from '../lib/interactions';
export function useLocalDay(){
 const [day,setDay]=useState(localDay);
 useEffect(()=>{
  const refresh=()=>setDay(localDay());
  // 覆盖跨午夜、休眠唤醒及使用期间改变时区。
  const timer=setInterval(refresh,10000);
  window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);
  return()=>{clearInterval(timer);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh)};
 },[]);
 return day;
}
