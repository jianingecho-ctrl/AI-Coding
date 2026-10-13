import type {CSSProperties} from 'react';
import type {FishCharacterId,CharacterSkin} from '../lib/model';
import {actionLabels,characterLabels,isKneeling} from '../lib/effects';

const palettes:Record<FishCharacterId,{body:string;fin:string;shirt:string;shorts:string;leg:string;mouth:string}>={
 balloon:{body:'#cfe486',fin:'#44ad65',shirt:'#fffef0',shorts:'#fffef0',leg:'#ed5743',mouth:'#8fae4f'},
 tongue:{body:'#9bd5e9',fin:'#2d86b1',shirt:'#9bd5e9',shorts:'#d5df59',leg:'#2d86b1',mouth:'#df83a4'},
 anxious:{body:'#d9d344',fin:'#e6cf48',shirt:'#a8a4d4',shorts:'#39a4b5',leg:'#e6cf48',mouth:'#798d54'},
 cool:{body:'#55c4d3',fin:'#3a98cb',shirt:'#ffffff',shorts:'#fc574d',leg:'#55c4d3',mouth:'#eea0b2'},
 lying:{body:'#fa7044',fin:'#f4d78b',shirt:'#a4e7f5',shorts:'#fa7044',leg:'#f4d78b',mouth:'#eac069'},
 office:{body:'#f5ad51',fin:'#f5ad51',shirt:'#ad70a0',shorts:'#454074',leg:'#f5ad51',mouth:'#f3d075'},
};

function EyePair({kind}:{kind:FishCharacterId}){
 if(kind==='balloon')return <g className="fish-eyes"><ellipse cx="134" cy="132" rx="19" ry="17" fill="#fff"/><ellipse cx="169" cy="132" rx="19" ry="17" fill="#fff"/><circle className="fish-pupil" cx="131" cy="137" r="7" fill="#101010"/><circle className="fish-pupil" cx="165" cy="137" r="7" fill="#101010"/><path d="M115 130 q19-29 38 0 M151 130 q18-29 38 0" fill="#cfe486"/><path d="M114 134 h77 M120 155 q13 7 27 0 M155 155 q14 7 28 0" fill="none" strokeWidth="3"/></g>;
 if(kind==='tongue')return <g className="fish-eyes"><circle cx="118" cy="88" r="30" fill="var(--fish-fin)"/><circle cx="177" cy="94" r="30" fill="var(--fish-fin)"/><path d="M90 88 l55 6 M150 94 l54 10 M102 102 l31 4 M161 111 l30 4" fill="none" strokeWidth="3"/></g>;
 if(kind==='anxious')return <g className="fish-eyes"><ellipse cx="113" cy="93" rx="28" ry="34" fill="#fff"/><ellipse cx="173" cy="79" rx="28" ry="35" fill="#fff"/><circle className="fish-pupil" cx="109" cy="103" r="10" fill="#111"/><circle className="fish-pupil" cx="178" cy="73" r="10" fill="#111"/></g>;
 if(kind==='cool')return <g className="fish-eyes"><ellipse cx="119" cy="99" rx="29" ry="28" fill="#fff"/><ellipse cx="175" cy="98" rx="29" ry="29" fill="#fff"/><circle className="fish-pupil" cx="113" cy="94" r="9" fill="#111"/><circle className="fish-pupil" cx="170" cy="91" r="9" fill="#111"/><path d="M91 94 Q96 71 123 71 Q143 71 148 94 Z M146 93 Q150 69 176 69 Q199 69 204 93 Z" fill="var(--fish-body)"/><path d="M91 95 l111-2" fill="none"/></g>;
 if(kind==='lying')return <g className="fish-eyes"><ellipse cx="120" cy="94" rx="22" ry="28" fill="#fff"/><ellipse cx="163" cy="97" rx="22" ry="28" fill="#fff"/><circle className="fish-pupil" cx="117" cy="95" r="8" fill="#111"/><circle className="fish-pupil" cx="159" cy="99" r="8" fill="#111"/><path d="M98 82 q22-22 43 3 M142 86 q21-21 43 4" fill="var(--fish-body)"/></g>;
 return <g className="fish-eyes"><circle cx="119" cy="80" r="29" fill="#fac561"/><circle cx="175" cy="81" r="29" fill="#fac561"/><ellipse className="fish-pupil" cx="120" cy="78" rx="10" ry="13" fill="#111"/><ellipse className="fish-pupil" cx="174" cy="78" rx="10" ry="13" fill="#111"/></g>;
}

function FishHead({kind}:{kind:FishCharacterId}){
 if(kind==='balloon')return <g className="fish-head balloon-head"><path d="M91 91 Q42 58 60 34 Q88 10 113 69 M136 77 Q112 17 144 10 Q190 1 174 76 M189 94 Q208 29 238 48 Q276 78 224 122" fill="var(--fish-shirt)"/><path d="M238 216 Q288 201 282 237 Q284 265 241 259" fill="var(--fish-shirt)"/><path d="M101 75 Q41 91 37 168 Q33 263 143 268 Q252 270 258 183 Q262 94 188 80" fill="var(--fish-shirt)"/><ellipse cx="151" cy="163" rx="42" ry="64" fill="var(--fish-body)"/><EyePair kind={kind}/><g className="fish-mouth"><path d="M116 189 Q145 166 177 190 Q197 214 174 218 Q153 194 127 206 Q110 215 116 189" fill="var(--fish-mouth)"/></g><path d="M131 88 q18-13 37 0" fill="none" strokeWidth="3"/><g className="fish-yawn-face"><path d="M121 137 q14-8 26 0 M157 137 q14-8 26 0" fill="none"/><ellipse cx="150" cy="190" rx="17" ry="22" fill="#795d51"/></g><path className="fish-sweat" d="M204 126 q-17 25-3 27 q18-2 3-27" fill="#8ed9f0" strokeWidth="2"/></g>;
 return <g className="fish-head">
  {kind==='anxious'&&<g><path d="M105 61 Q23 89 44 190 Q56 232 97 233" fill="#f5ae3e"/><path d="M64 82 l28 15 M48 112 l29 14 M41 146 l27 10 M47 182 l22 4 M64 212 l24-1" stroke="#fbd36e" strokeWidth="4"/></g>}
  {kind==='cool'&&<path d="M193 122 Q240 164 250 232 Q219 210 202 199" fill="var(--fish-fin)"/>}
  {kind==='tongue'?<path d="M102 72 Q132 42 172 59 Q209 81 202 126 L189 228 L91 225 Z" fill="var(--fish-body)"/>:
   kind==='anxious'?<path d="M79 154 Q59 104 99 62 Q128 43 157 57 Q185 40 212 75 L228 147 Q218 184 166 202 Q108 191 79 154 Z" fill="var(--fish-body)"/>:
   kind==='cool'?<path d="M85 112 Q80 63 133 56 Q171 49 190 83 L218 205 Q160 228 96 203 Z" fill="var(--fish-body)"/>:
   kind==='lying'?<path d="M89 86 Q108 43 161 54 Q200 65 205 109 L196 202 Q144 217 93 193 Z" fill="var(--fish-body)"/>:
   <path d="M89 106 Q96 63 143 59 Q193 61 202 106 L218 154 Q213 186 153 210 Q97 194 80 161 Z" fill="var(--fish-body)"/>}
  <EyePair kind={kind}/>
  {kind==='tongue'?<g className="fish-mouth"><path d="M101 132 Q142 112 200 145 Q195 162 173 156 L105 153 Q86 147 101 132" fill="var(--fish-fin)"/><path d="M163 143 Q220 138 230 174 Q205 194 175 163" fill="var(--fish-mouth)"/><path d="M185 152 l32 17" fill="none" strokeWidth="3"/></g>:
   kind==='anxious'?<g className="fish-mouth"><path d="M119 146 Q163 128 202 147 Q174 139 179 162" fill="#fbf4bc"/><path d="M151 155 Q170 140 191 159 Q187 179 171 170" fill="var(--fish-mouth)"/><path d="M155 118 l1 1 m16-5 1 1" strokeWidth="5"/></g>:
   kind==='cool'?<g className="fish-mouth"><path d="M106 147 Q150 119 190 152 Q159 176 113 167 Q102 163 106 147 Z" fill="var(--fish-mouth)"/><path d="M109 154 q39-4 69 1" fill="none" stroke="#ae586b" strokeWidth="3"/><circle cx="194" cy="112" r="3"/><circle cx="198" cy="130" r="4"/><ellipse cx="205" cy="151" rx="4" ry="6"/></g>:
   kind==='lying'?<g className="fish-mouth"><path d="M119 147 Q145 135 176 149 Q147 164 119 158 Z" fill="var(--fish-mouth)"/><path d="M124 151 h46"/></g>:
   <g className="fish-mouth"><path d="M104 155 Q151 122 191 158 Q145 174 105 164 Z" fill="var(--fish-mouth)"/><path d="M109 158 Q152 139 187 159 M129 195 q23 9 40 0" fill="none" strokeWidth="3"/><path d="M142 119 l-1 3 m14-2 1 3" strokeWidth="3"/></g>}
  <g className="fish-yawn-face"><ellipse cx="152" cy="153" rx="20" ry="24" fill="#795d51"/><path d="M100 113 q18-13 36 0 M163 113 q18-13 36 0" fill="none"/></g>
  <path className="fish-sweat" d="M219 112 q-19 28-3 31 q21-1 3-31" fill="#8ed9f0" strokeWidth="2"/>
 </g>;
}

export function FishCharacter({character,action='idle',name='小判官',skin='desert'}:{
 character:FishCharacterId;action?:string;name?:string;color?:string;skin?:CharacterSkin;
}){
 const p=palettes[character];const kneeling=isKneeling(action);
 const label=actionLabels[action as keyof typeof actionLabels]??'待机';
 const variables={'--fish-body':p.body,'--fish-fin':p.fin,'--fish-shirt':p.shirt,'--fish-shorts':p.shorts,'--fish-leg':p.leg,'--fish-mouth':p.mouth} as CSSProperties;
 return <div className={'character fish-character fish-type-'+character+' '+action+(action==='panic'?' kneel':'')+' skin-'+skin}
  role="img" data-character={character} data-pose={kneeling?'kneeling':character==='lying'||(character==='anxious'&&['idle','fish','yawn'].includes(action))?'resting':'standing'} style={variables}
  aria-label={name+'，'+characterLabels[character]+'，'+(kneeling?'双膝跪地举牌，':'')+label}>
  <svg viewBox="0 0 300 370" aria-hidden="true" className="fish-art">
   <ellipse className="fish-shadow" cx="150" cy="347" rx="100" ry="9" fill="#10101018"/>
   <g className="fish-dust" fill="#dccfaa" opacity=".6"><ellipse cx="87" cy="339" rx="16" ry="8"/><ellipse cx="234" cy="340" rx="19" ry="8"/></g>
   <g className="fish-figure" stroke="#111" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" fill="var(--fish-body)">
    <g className="fish-standing-legs"><path d="M111 278 L110 324 Q91 321 86 334 Q101 347 138 338 L139 277 Z" fill="var(--fish-leg)"/><path d="M164 277 L165 323 Q188 321 198 336 Q174 351 150 336 L146 278 Z" fill="var(--fish-leg)"/>{character==='balloon'&&<g fill="#494846"><path d="M110 326 Q89 321 85 337 Q101 345 136 339 L138 329 Z"/><path d="M152 329 Q170 320 197 331 L199 338 Q177 348 151 339 Z"/></g>}</g>
    <g className="fish-kneeling-legs">
     <g className="fish-folded-calf left"><path d="M116 320 Q171 320 207 328 L220 339 Q164 347 112 334 Z" fill="var(--fish-leg)"/></g>
     <g className="fish-folded-calf right"><path d="M164 321 Q209 327 251 334 L260 345 Q212 352 161 334 Z" fill="var(--fish-leg)"/></g>
     <g className="fish-knee left"><path d="M108 284 Q90 312 97 335 Q106 350 126 340 Q137 329 132 309 L137 284 Z" fill="var(--fish-leg)"/><ellipse cx="114" cy="336" rx="16" ry="9" fill="var(--fish-body)"/></g>
     <g className="fish-knee right"><path d="M153 284 Q144 311 149 331 Q156 350 177 339 Q188 327 178 307 L178 284 Z" fill="var(--fish-leg)"/><ellipse cx="163" cy="336" rx="16" ry="9" fill="var(--fish-body)"/></g>
    </g>
    <g className="fish-torso"><path d="M96 201 Q148 192 203 204 L204 265 Q148 281 94 265 Z" fill="var(--fish-shirt)"/>
     {character==='office'&&<path d="M99 204 l30 26 21-27 27 26 25-24" fill="none"/>}
     <path d={kneeling?'M96 258 Q145 266 202 258 L200 284 Q169 298 151 284 Q125 297 99 284 Z':'M95 257 Q147 270 203 257 L199 292 Q171 303 152 289 Q125 303 100 290 Z'} fill="var(--fish-shorts)"/>
     {character==='tongue'&&<g fill="#7b8c39"><path d="M106 263 q40-9 26 21 l-23 5 Z"/><path d="M163 270 q30-17 29 14 l-18 2 Z"/></g>}
    </g>
    <FishHead kind={character}/>
    <g className="fish-rest-legs"><path d="M143 245 Q164 234 178 250 L174 297 Q197 290 215 303 L216 315 Q177 329 149 310 Z" fill="var(--fish-leg)"/><path d="M111 246 Q131 231 145 252 L142 318 Q165 314 190 326 L184 339 Q141 344 116 329 Z" fill="var(--fish-leg)"/><path d="M124 263 v54 M160 264 v30" fill="none" stroke="#bcad37" strokeWidth="3"/></g>
    <g className="fish-arm left"><path d="M100 217 Q79 204 62 225 Q46 247 64 260 L101 245 Z" fill="var(--fish-fin)"/><path d="M64 235 l22 3 M62 246 l22 4" stroke="#1113" strokeWidth="2"/></g>
    <g className="fish-arm right">{character==='office'?<g><path d="M201 213 L220 217 Q228 250 230 284 L232 315 Q218 322 205 313 Z" fill="var(--fish-fin)"/><path d="M215 230 l4 70" stroke="#d58d40" strokeWidth="2"/></g>:<g><path d="M196 218 Q222 205 240 228 Q252 249 235 260 L197 246 Z" fill="var(--fish-fin)"/><path d="M218 235 l18 3 M218 246 l18 3" stroke="#1113" strokeWidth="2"/></g>}</g>
    <g className="fish-balloon-fins" fill="var(--fish-fin)"><path d="M100 226 Q80 265 89 302 Q101 332 117 302 L116 240 Z"/><path d="M200 226 Q216 266 208 305 Q195 330 179 302 L181 242 Z"/><path d="M104 244 l-3 57 M193 244 l2 55" fill="none"/></g>
    <g className="fish-hug-arms"><path d="M101 222 Q53 216 72 260 Q124 292 194 268 L206 251 Q149 264 109 246 Z" fill="var(--fish-fin)"/><path d="M186 209 Q215 216 219 252 Q207 279 181 268 L179 239" fill="var(--fish-fin)"/></g>
    {character==='office'&&<g className="fish-office-prop"><rect x="139" y="240" width="39" height="52" rx="6" fill="#fff"/><path d="M94 242 Q122 235 147 252 L147 274 Q119 287 90 270 Z" fill="var(--fish-fin)"/><path d="M98 253 l40 2 M100 263 l35 2" stroke="#d58d40" strokeWidth="3"/></g>}
    <g className="fish-raised-arms" fill="var(--fish-fin)"><path d="M95 239 Q62 230 55 190 L38 33 Q37 13 50 27 L73 177 Q80 199 108 209 Z"/><path d="M202 239 Q234 230 242 190 L260 33 Q261 13 247 27 L224 177 Q216 199 189 209 Z"/><path d="M40 35 Q17 21 24 7 Q30 0 38 10 L43 15 Q48 0 57 8 L60 23 Q72 17 76 27 Q72 41 53 43 Z"/><path d="M258 35 Q282 21 275 7 Q268 0 260 10 L255 15 Q250 0 241 8 L238 23 Q226 17 222 27 Q227 41 246 43 Z"/></g>
    <g className="fish-phone"><rect x="72" y="252" width="27" height="40" rx="5" fill="#343d40"/><rect x="76" y="258" width="19" height="26" rx="2" fill="#bde7ca"/><text x="85" y="274" textAnchor="middle" fill="#305442" stroke="none" fontSize="8">摸鱼</text></g>
   </g>
   <g fill="#8d7451" className="fish-mood"><text className="fish-zzz" x="222" y="70" fontSize="18">困…</text><text className="fish-heart" x="257" y="143" fontSize="26" fill="#dd819e">♥</text><text className="fish-panic-label" x="12" y="269" fontSize="14">我裂开了</text><text className="fish-kneel-label" x="150" y="365" textAnchor="middle" fontSize="13">双膝跪地 · 举牌待命</text></g>
  </svg>
 </div>;
}
