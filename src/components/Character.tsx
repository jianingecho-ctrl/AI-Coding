export function Character({action='idle',name='小判官',color='薄荷绿'}:{action?:string;name?:string;color?:string}){
 return <div className={`character ${action} color-${color}`} role="img" aria-label={`${name}，${action==='kneel'?'跪地举牌':action==='yawn'?'打哈欠':action==='fish'?'摸鱼':'待机'}`}>
  <div className="hair"/><div className="head"><i className="brow left"/><i className="brow right"/><i className="eye left"/><i className="eye right"/><i className="blush left"/><i className="blush right"/><div className="mouth"/><div className="sweat"/></div>
  <div className="arm left"/><div className="arm right"/><div className="body"><span className="tie"/><span className="badge">判</span></div><div className="leg left"/><div className="leg right"/>
  <div className="phone">摸鱼</div><div className="zzz">困…</div><div className="ground"/>
 </div>;
}
