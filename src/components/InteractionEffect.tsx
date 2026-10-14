import type {InteractionKind} from '../lib/model';
const captions={elbow:'肘击一下，烦恼退散！',slap:'啪！给烦恼一巴掌',burn:'烧心一下，火气散散',heart:'给你一颗小心心',marry:'今日宜心动，嫁给ta！',kick:'走你！踢出去，马上回来'};
export function InteractionIcon({kind}:{kind:InteractionKind}){
 return <svg viewBox="0 0 100 100" aria-hidden="true" fill="none" strokeLinecap="round" strokeLinejoin="round">
  {kind==='slap'&&<g stroke="#bd724e" strokeWidth="3"><path fill="#ffce9b" d="M31 91V70L16 50Q11 42 18 38Q23 36 29 44L35 51V22Q35 13 41 13Q47 13 47 22V43V13Q47 5 53 5Q60 5 60 14V43V18Q60 10 66 10Q73 10 73 19V46V29Q73 21 79 21Q86 21 86 30V62Q86 73 75 84V91Z"/><path d="M47 59Q59 54 72 59M44 73Q57 66 72 72"/><path stroke="#fff1b5" strokeWidth="5" d="M13 18 6 10M20 8 20 2M5 31 1 30"/></g>}
  {kind==='elbow'&&<g stroke="#ab7654" strokeWidth="3"><path fill="#ffc996" d="M12 71 44 45 33 27Q30 21 35 18L46 12Q52 9 56 15L84 57Q90 67 79 74L32 94Z"/><path fill="#52afd1" d="M12 71 30 57 50 81 32 94Z"/><path d="m42 21 11 18M50 16 12 8"/><path stroke="#ffb949" strokeWidth="5" d="M82 29 94 22M86 39 98 39"/></g>}
  {kind==='burn'&&<g stroke="#df6b34" strokeWidth="2.5"><path fill="#ff7842" d="M51 5C73 32 55 34 76 22C99 53 90 89 54 95C10 92 6 58 31 34C28 50 37 51 43 39C49 28 41 21 51 5Z"/><path fill="#ffdb65" stroke="#f8ab36" d="M53 39C64 57 58 65 71 58C82 74 72 91 54 92C34 91 26 77 41 62C40 75 53 60 53 39Z"/></g>}
  {kind==='marry'&&<g stroke="#b87931" strokeWidth="4"><circle cx="35" cy="61" r="24" fill="#ffe69a"/><circle cx="65" cy="61" r="24" fill="#ffcf73"/><path d="m30 16 20-12 20 12-20 19Z" fill="#ff8fbb"/><path d="M8 18 8 30M2 24 14 24M87 17 87 29M81 23 93 23" stroke="#e9699c"/></g>}
  {kind==='kick'&&<g stroke="#255679" strokeWidth="4"><path fill="#51b4db" d="m12 18 30 3 3 30 40 8 7 16-8 10-56-9-9-24Z"/><path d="m48 57 7-8m7 12 7-8M14 90 91 90M4 47 14 47M2 62 12 62"/><path fill="#ffcf52" stroke="#ec973a" d="m85 15 2 12 11-1-8 9 8 9-13-2-5 13-3-13-12 1 9-9-6-9 12 1Z"/></g>}
  {kind==='heart'&&<g stroke="#ce547d" strokeWidth="2.5"><path fill="#ff83ae" d="M50 88 15 55C-9 31 20 3 43 22L50 29 57 22C80 3 109 31 85 55Z"/><path stroke="#ffe8f1" strokeWidth="6" d="M23 31Q17 37 22 44"/><path stroke="#ffc863" strokeWidth="4" d="M7 6 7 18M1 12 13 12M92 78 92 90M86 84 98 84"/></g>}
 </svg>;
}
export function InteractionEffect({kind}:{kind:InteractionKind}){
 return <div className={`interaction-effect interaction-${kind}${kind==='elbow'?' elbow-effect':''}`} data-interaction={kind} role="status">
  <div className="interaction-symbol"><InteractionIcon kind={kind}/>{kind==='heart'&&<><span className="mini-heart">♥</span><span className="mini-heart">♥</span></>}</div>
  <span>{captions[kind]}</span>
 </div>;
}
