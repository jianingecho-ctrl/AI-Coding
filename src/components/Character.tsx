import type {CharacterSkin} from '../lib/model';
import {actionLabels, isKneeling} from '../lib/effects';

// 原创 SVG 骆驼：双驼峰、半睁眼、突出的大嘴。矢量分组作为动画关节。
export function Character({action = 'idle', name = '小判官', color = '薄荷绿', skin = 'desert'}: {
  action?: string; name?: string; color?: string; skin?: CharacterSkin;
}) {
  const label = actionLabels[action as keyof typeof actionLabels] ?? '带薪发呆';
  return <div className={`character camel ${action} ${isKneeling(action) ? 'kneel' : ''} skin-${skin} color-${color}`} role="img" aria-label={`${name}，骆驼打工人，${label}`}>
    <svg viewBox="0 0 260 290" aria-hidden="true" className="camel-art">
      <ellipse className="camel-shadow" cx="132" cy="277" rx="77" ry="8"/>
      <g className="camel-figure" stroke="var(--ink)" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round">
        <path className="camel-tail" d="M187 227 Q226 201 225 234" fill="none"/><path className="camel-tail-tip" d="M225 225 l-7 12 14-1 Z" fill="var(--fur-dark)"/>
        <g className="camel-humps" fill="var(--fur-dark)"><path d="M66 205 Q45 146 75 141 Q91 140 99 182"/><path d="M167 182 Q180 121 202 147 Q215 160 202 215"/></g>
        <g className="camel-knees" fill="var(--pants)"><path d="M115 248 Q85 241 77 264 Q58 268 66 280 Q87 287 123 273 L127 252 Z"/><path d="M143 248 Q174 240 183 261 Q202 264 196 277 Q174 285 140 273 L136 252 Z"/><path d="M69 277 Q89 280 113 272 M149 271 Q175 280 193 274" fill="none" strokeWidth="2"/></g>
        <g className="camel-leg left"><path d="M97 238 L94 267 Q70 270 77 279 L117 278 L119 238" fill="var(--pants)"/><path d="M77 275 H116"/></g>
        <g className="camel-leg right"><path d="M140 237 L143 274 L184 279 Q191 267 166 267 L164 237" fill="var(--pants)"/><path d="M145 275 H182"/></g>
        <g className="camel-arm left" fill="var(--fur)"><path d="M90 188 Q68 180 66 210 L62 233 Q66 247 79 237 L96 210"/><path d="M65 232 l9 2"/></g>
        <g className="camel-raised-arms" fill="var(--fur)"><path d="M94 192 Q47 170 54 134 L48 38 Q54 24 66 36 L76 130 Q78 143 100 153 Z"/><path d="M164 193 Q212 180 210 139 L212 40 Q208 24 196 38 L188 133 Q184 148 166 157 Z"/><path d="M53 34 l3 10 M204 32 l-3 11" strokeWidth="2"/></g>
        <g className="camel-torso">
          <path d="M98 176 Q129 166 162 179 Q183 192 178 237 Q152 256 90 239 Q80 193 98 176 Z" fill="var(--shirt)"/>
          <path d="M113 170 L123 204 L133 191 L143 203 L153 173" fill="var(--collar)"/>
          <path className="camel-tie" d="M129 194 l10 2-3 11 7 20-12 10-8-13 7-18 Z" fill="var(--accent)"/>
          <rect x="151" y="206" width="21" height="26" rx="3" fill="var(--collar)" strokeWidth="2"/>
          <path d="M161 201 v8"/><text x="162" y="223" textAnchor="middle" fontSize="12" fill="var(--ink)" stroke="none">判</text>
          {skin === 'milktea' && <path d="M98 215 Q122 233 145 218 L146 243 L99 239 Z" fill="var(--accent)" strokeWidth="2"/>}
          {skin === 'judge' && <path d="M100 181 l13 46 11-20 M164 181 l-11 46-11-20" fill="none" stroke="var(--accent)"/>}
        </g>
        <g className="camel-neck"><path d="M115 112 Q100 140 115 180 Q131 193 146 181 L148 114" fill="var(--fur)"/><path d="M119 145 Q116 163 128 173" fill="none" stroke="var(--fur-dark)" strokeWidth="4"/></g>
        <g className="camel-head">
          <path d="M93 61 Q52 16 56 52 Q58 73 89 81" fill="var(--fur)"/><path d="M89 64 L68 49" stroke="var(--fur-dark)" strokeWidth="6"/>
          <path d="M161 62 Q201 11 201 48 Q200 72 167 80" fill="var(--fur)"/><path d="M167 64 L189 45" stroke="var(--fur-dark)" strokeWidth="6"/>
          <path d="M84 69 Q85 36 128 40 Q174 38 179 79 L170 124 Q144 148 101 131 Q79 117 84 69 Z" fill="var(--fur)"/>
          <path d="M111 43 q-3-20 8-16 l6 13 q5-28 13-19 l-1 22 14-10-5 18" fill="var(--fur-dark)"/>
          <g className="camel-eyes"><ellipse cx="107" cy="80" rx="12" ry="16" fill="#fffaf1"/><ellipse cx="151" cy="78" rx="12" ry="16" fill="#fffaf1"/><ellipse className="camel-pupil" cx="111" cy="85" rx="4" ry="6" fill="var(--ink)" stroke="none"/><ellipse className="camel-pupil" cx="149" cy="83" rx="4" ry="6" fill="var(--ink)" stroke="none"/><path className="camel-lids" d="M95 77 l23-1 M139 74 l24 1" fill="none" strokeWidth="5"/></g>
          <path className="camel-brows" d="M94 57 l23 5 M138 58 l25-9" fill="none"/>
          <ellipse cx="91" cy="105" rx="11" ry="6" fill="var(--blush)" stroke="none"/>
          <path d="M108 98 Q124 89 150 96 Q180 86 187 108 Q195 136 167 141 L111 140 Q83 138 89 116 Q90 104 108 98 Z" fill="var(--snout)"/>
          <path d="M148 108 q3-4 6-1 M170 109 q3-4 6-1" fill="none" strokeWidth="3"/>
          <path className="camel-mouth" d="M112 121 Q134 137 160 124" fill="none"/>
          <path className="camel-tooth" d="M133 129 v8 l11-1 v-7" fill="#fffaf1" strokeWidth="2"/>
          <path className="camel-yawn-mouth" d="M124 116 Q152 107 156 127 Q152 145 130 137 Q119 132 124 116" fill="#8e4d44"/>
          <path d="M106 140 l7 8 7-4 7 5 7-5" fill="var(--fur-dark)" strokeWidth="2"/>
          <path className="camel-sweat" d="M181 61 q-18 24-2 26 q16-2 2-26" fill="#92d7e4" strokeWidth="2"/>
          {skin === 'neon' && <g className="camel-headphones"><path d="M83 85 Q72 30 127 33 Q184 29 179 89" fill="none" stroke="var(--accent)" strokeWidth="8"/><rect x="77" y="76" width="12" height="25" rx="5" fill="var(--shirt)"/><rect x="173" y="74" width="12" height="25" rx="5" fill="var(--shirt)"/></g>}
          {skin === 'judge' && <g className="camel-glasses" fill="none" stroke="var(--accent)"><rect x="91" y="66" width="32" height="29" rx="8"/><rect x="135" y="64" width="32" height="29" rx="8"/><path d="M123 78 h12 M167 75 l10-4"/></g>}
        </g>
        <g className="camel-arm right" fill="var(--fur)"><path d="M171 187 Q191 182 196 207 L204 233 Q199 248 186 239 L167 208"/><path d="M192 233 l9-1"/></g>
        <g className="camel-phone"><rect x="69" y="211" width="29" height="41" rx="5" fill="var(--pants)"/><rect x="73" y="216" width="21" height="27" rx="2" fill="#b6e0c3" strokeWidth="1"/><text x="84" y="232" fontSize="8" fill="#305443" stroke="none" textAnchor="middle">摸鱼</text></g>
        {skin === 'milktea' && <g className="camel-cup"><path d="M175 222 h27 l-5 30 h-17 Z" fill="#f6d9aa"/><path d="M190 211 v18" fill="none"/><path d="M175 224 h27"/><circle cx="186" cy="245" r="2" fill="var(--ink)"/><circle cx="193" cy="242" r="2" fill="var(--ink)"/></g>}
      </g>
      <g className="camel-mood" fill="var(--accent)"><text className="camel-zzz" x="196" y="37" fontSize="18">困…</text><text className="camel-heart" x="205" y="75" fontSize="26">♥</text><text className="camel-panic-label" x="25" y="130" fontSize="16" fontWeight="700">我裂开了</text></g>
    </svg>
  </div>;
}
