import {useId} from 'react';
import type {CharacterSkin} from '../lib/model';
import {actionLabels, isKneeling} from '../lib/effects';

// 原创圆润连帽衫骆驼。渐变、眼睛高光和软轮廓提供立体感；独立跪姿骨架，
// 不是把站姿的脚压扁。四套皮肤和所有动作共用同一套可变形矢量关节。
export function Character({action = 'idle', name = '小判官', color = '薄荷绿', skin = 'desert'}: {
  action?: string; name?: string; color?: string; skin?: CharacterSkin;
}) {
  const id = useId().replace(/:/g, '');
  const paint = (part: string) => 'url(#' + id + '-' + part + ')';
  const kneeling = isKneeling(action);
  const label = actionLabels[action as keyof typeof actionLabels] ?? '元气待机';
  return <div className={'character camel plush ' + action + (action === 'panic' ? ' kneel' : '') + ' skin-' + skin + ' color-' + color}
    role="img" data-pose={kneeling ? 'kneeling' : 'standing'}
    aria-label={name + '，连帽衫骆驼，' + (kneeling ? '双膝跪地、折腿举牌，' : '') + label}>
    <svg viewBox="0 0 300 370" aria-hidden="true" className="camel-art">
      <defs>
        <linearGradient id={id + '-fur'} x1="0" y1="0" x2=".85" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0" stopColor="var(--fur-light)"/><stop offset=".55" stopColor="var(--fur)"/><stop offset="1" stopColor="var(--fur-dark)"/>
        </linearGradient>
        <radialGradient id={id + '-face'} cx=".35" cy=".3" r=".85">
          <stop offset="0" stopColor="var(--fur-light)"/><stop offset=".72" stopColor="var(--fur)"/><stop offset="1" stopColor="var(--fur-dark)"/>
        </radialGradient>
        <linearGradient id={id + '-hoodie'} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--shirt-light)"/><stop offset=".5" stopColor="var(--shirt)"/><stop offset="1" stopColor="var(--shirt-dark)"/>
        </linearGradient>
        <linearGradient id={id + '-gold'} x1="0" y1="0" x2=".3" y2="1">
          <stop offset="0" stopColor="#fff1b8"/><stop offset=".55" stopColor="#edc368"/><stop offset="1" stopColor="#c8953c"/>
        </linearGradient>
        <linearGradient id={id + '-glass'} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c7f4f3"/><stop offset=".5" stopColor="var(--glass)"/><stop offset="1" stopColor="#3c9aa7"/>
        </linearGradient>
        <radialGradient id={id + '-shadow'}><stop offset="0" stopColor="#3a3a32" stopOpacity=".23"/><stop offset="1" stopColor="#3a3a32" stopOpacity="0"/></radialGradient>
      </defs>
      <ellipse className="camel-shadow" cx="150" cy="347" rx="100" ry="13" fill={paint('shadow')}/>
      <g className="camel-landing-dust" fill="#e7d4b2" opacity=".7">
        <ellipse cx="75" cy="338" rx="15" ry="7"/><ellipse cx="226" cy="340" rx="17" ry="8"/><ellipse cx="52" cy="337" rx="9" ry="5"/>
      </g>
      <g className="camel-figure" stroke="var(--ink)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
        <g className="camel-standing-legs">
          <path d="M107 281 l4 44 q16 13 27-1 l4-41 Z" fill={paint('fur')}/>
          <path d="M161 281 l2 43 q16 15 30-2 l-5-42 Z" fill={paint('fur')}/>
          <g className="camel-shoe left"><path d="M107 321 q17-13 35 1 l3 19 q-10 11-45 5 l-7-7 Z" fill={paint('hoodie')}/><path d="M98 335 q22-8 45 1 l2 7 q-26 13-49-1 Z" fill="#faf8ed"/><path d="M112 322 l13 4 m-16 2 14 4" stroke="#fff" strokeWidth="3"/></g>
          <g className="camel-shoe right"><path d="M161 321 q18-13 32 2 l13 16 q-9 13-43 6 l-6-9 Z" fill={paint('hoodie')}/><path d="M159 336 q24-6 43 1 l4 6 q-22 10-45 1 Z" fill="#faf8ed"/><path d="M172 322 l12 4 m-13 2 14 3" stroke="#fff" strokeWidth="3"/></g>
        </g>

        {/* 两条小腿向后/两侧折叠，膝盖压在地面，露出鞋底。独立于站姿。 */}
        <g className="camel-kneeling-legs">
          <g className="camel-folded-calf left">
            <path d="M116 320 Q160 320 207 325 L214 336 Q164 344 113 334 Z" fill={paint('fur')}/>
            <path d="M206 323 Q222 321 233 333 L229 342 Q213 346 201 335 Z" fill={paint('hoodie')}/>
            <path d="M203 335 Q216 343 229 336" fill="none" stroke="#f9f6ea" strokeWidth="6"/>
          </g>
          <g className="camel-folded-calf right">
            <path d="M177 320 Q200 323 227 330 L239 341 Q206 349 172 334 Z" fill={paint('fur')}/>
            <path d="M225 328 Q246 325 257 338 L254 347 Q235 351 221 339 Z" fill={paint('hoodie')}/>
            <path d="M227 341 Q240 349 254 343" fill="none" stroke="#f9f6ea" strokeWidth="6"/>
          </g>
          <g className="camel-knee left">
            <path d="M107 289 Q91 308 96 329 Q101 348 124 341 Q139 334 133 314 L137 290 Z" fill={paint('fur')}/>
            <ellipse cx="114" cy="334" rx="18" ry="10" fill="#eac899" strokeWidth="2"/>
            <path d="M103 328 q11-7 23 0" fill="none" stroke="#b88952"/>
          </g>
          <g className="camel-knee right" transform="translate(-16 0)">
            <path d="M161 289 Q154 310 158 329 Q165 348 187 339 Q203 331 193 309 L190 289 Z" fill={paint('fur')}/>
            <ellipse cx="177" cy="334" rx="18" ry="10" fill="#eac899" strokeWidth="2"/>
            <path d="M166 328 q11-7 22 0" fill="none" stroke="#b88952"/>
          </g>
        </g>

        <g className="camel-torso">
          <path className="camel-tail" d="M219 269 q27-17 27 4 l7-2 q11 12-8 20 l4 6 q-20 6-31-6" fill={paint('fur')}/>
          <g className="camel-humps" fill={paint('hoodie')}><path d="M80 229 Q56 195 72 182 Q86 179 104 210"/><path d="M200 210 Q217 172 235 188 Q248 207 221 233"/></g>
          <path d={kneeling ? 'M103 263 Q146 253 191 265 L195 281 Q178 291 155 282 Q128 291 104 281 Z' : 'M102 263 Q145 250 192 265 L195 294 Q175 309 154 295 Q126 309 104 292 Z'} fill="var(--pants)"/>
          <path d="M92 201 Q146 184 204 204 Q232 226 218 271 Q216 284 199 286 L97 285 Q74 270 80 234 Q81 215 92 201 Z" fill={paint('hoodie')}/>
          <path d="M89 252 Q146 276 217 250 L213 275 Q166 291 95 278 Z" fill="var(--shirt-dark)" opacity=".22" stroke="none"/>
          <path d="M114 251 Q150 246 187 251 L192 271 Q152 286 111 272 Z" fill="var(--shirt)" stroke="var(--shirt-dark)" strokeWidth="2"/>
          <path d="M112 219 q-7 18-1 29 M190 219 q10 14 5 27" fill="none" stroke="#fff" strokeOpacity=".55"/>
          <path className="camel-drawstring" d="M129 203 q-9 15-9 28 M171 202 q11 17 11 29" fill="none" stroke="#fff9ec" strokeWidth="5"/>
          <circle cx="120" cy="233" r="4" fill="#fff9ec"/><circle cx="182" cy="234" r="4" fill="#fff9ec"/>
          <rect x="140" y="218" width="24" height="28" rx="7" fill="#fff8e5" stroke="var(--accent)" strokeWidth="2"/>
          <text x="152" y="237" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--accent)" stroke="none">判</text>
          {skin === 'milktea' && <path d="M106 246 Q151 260 196 247 L201 279 Q150 291 103 277 Z" fill="#ddaa65" stroke="#bb8347"/>}
          {skin === 'judge' && <path d="M96 208 l24 38 14-28 M201 208 l-23 39-13-29" fill="none" stroke="var(--accent)" strokeWidth="5"/>}
        </g>

        <g className="camel-arm left">
          <path d="M88 211 Q64 207 58 227 L58 247 Q76 256 89 242 L102 223 Z" fill={paint('hoodie')}/>
          <path d="M58 240 Q41 238 38 255 Q34 275 52 279 Q65 288 75 273 L80 255" fill={paint('fur')}/>
          <path d="M44 264 q4 4 8 2 m2 6 7-1" fill="none" stroke="#bc8a51" strokeWidth="2"/>
        </g>

        <g className="camel-raised-arms">
          <g className="camel-support-arm left">
            <path d="M95 240 Q70 239 58 223 L52 179 Q67 168 83 183 L97 208" fill={paint('hoodie')}/>
            <path d="M55 186 Q38 142 38 80 L36 25 Q40 12 52 23 L58 77 Q62 118 77 174" fill={paint('fur')}/>
            <path d="M36 31 Q19 19 25 7 Q30-1 38 7 L43 13 Q48-2 57 4 L61 19 Q71 13 76 22 Q77 35 61 40 L48 41 Z" fill={paint('fur')}/>
            <path d="M37 10 l3 12 M54 9 l2 12" fill="none" stroke="#b88952"/>
          </g>
          <g className="camel-support-arm right">
            <path d="M207 240 Q231 239 243 223 L247 179 Q232 168 217 183 L202 208" fill={paint('hoodie')}/>
            <path d="M245 186 Q261 142 261 80 L264 25 Q260 12 248 23 L243 77 Q240 118 222 174" fill={paint('fur')}/>
            <path d="M264 31 Q281 19 275 7 Q270-1 262 7 L257 13 Q252-2 243 4 L239 19 Q229 13 224 22 Q223 35 239 40 L251 41 Z" fill={paint('fur')}/>
            <path d="M263 10 l-3 12 M246 9 l-2 12" fill="none" stroke="#b88952"/>
          </g>
        </g>

        <g className="camel-head">
          <path d="M62 88 Q42 52 67 41 Q88 40 92 69 M209 68 Q218 28 240 42 Q255 53 235 88" fill={paint('hoodie')}/>
          <path d="M66 57 q5-8 13 7 M226 54 q7-6 9 6" fill="none" stroke="var(--shirt-light)" strokeWidth="6"/>
          <ellipse cx="150" cy="124" rx="100" ry="100" fill={paint('hoodie')}/>
          <ellipse cx="150" cy="128" rx="80" ry="81" fill={paint('face')}/>
          <path d="M76 118 Q72 168 106 191 Q137 217 173 201" fill="none" stroke="var(--shirt-dark)" strokeOpacity=".28" strokeWidth="7"/>
          <ellipse cx="107" cy="167" rx="28" ry="22" fill="#e8bd80" stroke="none"/>
          <ellipse cx="195" cy="165" rx="27" ry="22" fill="#e8bd80" stroke="none"/>
          <g className="camel-eyes">
            <ellipse cx="115" cy="114" rx="19" ry="26" fill="#fff9f0" stroke="#9c723f" strokeWidth="2"/>
            <ellipse cx="187" cy="113" rx="19" ry="26" fill="#fff9f0" stroke="#9c723f" strokeWidth="2"/>
            <ellipse className="camel-pupil" cx="119" cy="117" rx="13" ry="21" fill="#513629" stroke="none"/>
            <ellipse className="camel-pupil" cx="183" cy="116" rx="13" ry="21" fill="#513629" stroke="none"/>
            <ellipse cx="113" cy="105" rx="4" ry="6" fill="#fff" stroke="none"/><circle cx="124" cy="129" r="2.5" fill="#fff" stroke="none"/>
            <ellipse cx="177" cy="104" rx="4" ry="6" fill="#fff" stroke="none"/><circle cx="188" cy="128" r="2.5" fill="#fff" stroke="none"/>
            <path className="camel-lids" d="M96 108 h37 M168 107 h37" stroke="var(--fur)" strokeWidth="13"/>
            <path className="camel-closed-eyes" d="M98 117 q17-10 33 0 M170 116 q17-10 33 0" fill="none" stroke="#6b4934" strokeWidth="5"/>
          </g>
          <path className="camel-brow left" d="M98 82 q13-15 27-1" fill="none" stroke="#6b4934" strokeWidth="8"/>
          <path className="camel-brow right" d="M172 81 q15-16 30 0" fill="none" stroke="#6b4934" strokeWidth="8"/>
          <path className="camel-smile" d="M127 155 Q156 180 184 153 Q193 178 164 193 Q136 200 127 174 Z" fill="#864338" stroke="#a46a49"/>
          <path className="camel-tongue" d="M147 187 Q151 173 172 176 Q176 187 160 192 Z" fill="#d98776" stroke="none"/>
          <path className="camel-tooth" d="M131 159 Q158 175 181 157 L178 167 Q154 179 136 168 Z" fill="#fffaf0" stroke="none"/>
          <path className="camel-muzzle" d="M131 131 Q148 111 165 130 Q192 132 184 154 Q176 170 158 162 Q136 173 122 158 Q111 143 131 131 Z" fill="#f8e9ce" stroke="#d5b48a"/>
          <path d="M141 137 Q145 132 151 140 Q158 132 165 137 Q165 145 154 148 Q143 147 141 137 Z" fill="#6b4934" stroke="none"/>
          <path d="M154 146 l-2 10 q-7 8-15 5 M152 156 q8 9 19 3" fill="none" stroke="#6b4934" strokeWidth="3"/>
          <path className="camel-kneel-mouth" d="M139 179 Q155 169 174 180" fill="none" stroke="#754832" strokeWidth="4"/>
          <ellipse className="camel-yawn-mouth" cx="157" cy="174" rx="18" ry="21" fill="#864338" stroke="#a46a49"/>
          <path className="camel-sweat" d="M218 104 q-20 26-2 30 q19-3 2-30" fill="#93e2ef" stroke="#57aabb" strokeWidth="2"/>
          {skin !== 'neon' && skin !== 'judge' && <g className="camel-goggles">
            <path d="M66 80 Q104 9 154 18 Q202 14 239 79" fill="none" stroke="#796153" strokeWidth="8"/>
            <g transform="rotate(-12 112 43)"><ellipse cx="112" cy="43" rx="33" ry="22" fill={paint('gold')} stroke="#c29144"/><ellipse cx="112" cy="42" rx="26" ry="15" fill={paint('glass')} stroke="#fff2c6" strokeWidth="3"/><path d="M104 29 l8 25" stroke="#eafff4" strokeOpacity=".5" strokeWidth="5"/></g>
            <g transform="rotate(12 182 41)"><ellipse cx="182" cy="41" rx="33" ry="22" fill={paint('gold')} stroke="#c29144"/><ellipse cx="182" cy="40" rx="26" ry="15" fill={paint('glass')} stroke="#fff2c6" strokeWidth="3"/><path d="M175 27 l8 25" stroke="#eafff4" strokeOpacity=".5" strokeWidth="5"/></g>
            <path d="M143 39 q6-7 9 0" fill="none" stroke="#d6a650" strokeWidth="5"/>
          </g>}
          {skin === 'neon' && <g className="camel-headphones"><path d="M57 128 Q45 17 148 21 Q251 16 245 126" fill="none" stroke="var(--accent)" strokeWidth="11"/><rect x="48" y="107" width="20" height="44" rx="10" fill="var(--shirt-dark)"/><rect x="232" y="106" width="20" height="44" rx="10" fill="var(--shirt-dark)"/></g>}
          {skin === 'judge' && <g className="camel-glasses" fill="none" stroke="var(--accent)" strokeWidth="4"><circle cx="115" cy="116" r="26"/><circle cx="187" cy="115" r="26"/><path d="M141 114 q10-7 20 0 M89 110 l-17-4 M213 110 l15-6"/></g>}
        </g>

        <g className="camel-arm right">
          <path d="M207 211 Q232 207 240 230 L238 249 Q220 260 208 242 L194 223 Z" fill={paint('hoodie')}/>
          <path d="M237 242 Q255 241 260 260 Q265 277 247 281 Q236 289 226 274 L222 256" fill={paint('fur')}/>
          <path d="M247 266 q-4 4-8 2 m-2 7-7-1" fill="none" stroke="#bc8a51" strokeWidth="2"/>
        </g>
        <g className="camel-phone"><rect x="50" y="260" width="29" height="42" rx="6" fill="#355b56"/><rect x="54" y="265" width="21" height="29" rx="3" fill="#b9edcf" stroke="none"/><text x="65" y="283" fontSize="8" fill="#305443" stroke="none" textAnchor="middle">摸鱼</text></g>
        {skin === 'milktea' && <g className="camel-cup"><path d="M222 266 h26 l-4 34 h-18 Z" fill="#f1d8a8" stroke="#bf9856"/><path d="M235 253 v22" fill="none"/><path d="M222 270 h26"/><circle cx="230" cy="292" r="2" fill="#805c38"/><circle cx="238" cy="289" r="2" fill="#805c38"/></g>}
      </g>
      <g className="camel-mood" fill="var(--accent)">
        <text className="camel-zzz" x="242" y="78" fontSize="18">困…</text><text className="camel-heart" x="257" y="153" fontSize="27">♥</text>
        <text className="camel-panic-label" x="17" y="267" fontSize="16" fontWeight="700">我裂开了</text>
        <text className="camel-kneel-label" x="150" y="365" fontSize="13" textAnchor="middle" fontWeight="600">双膝跪地 · 举牌待命</text>
      </g>
    </svg>
  </div>;
}
