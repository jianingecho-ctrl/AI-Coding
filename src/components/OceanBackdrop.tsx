const bubbles=[{left:'9%',top:'21%',size:13},{left:'23%',top:'64%',size:22},{left:'47%',top:'13%',size:9},{left:'65%',top:'52%',size:17},{left:'86%',top:'24%',size:28},{left:'91%',top:'78%',size:12}];
export function OceanBackdrop(){return <div className="ocean-backdrop" aria-hidden="true">
 <div className="ocean-light"/>
 <div className="ocean-bubbles">{bubbles.map((b,i)=><span key={i} style={{left:b.left,top:b.top,width:b.size,height:b.size,animationDelay:-i*2+'s'}}/>)}</div>
 <svg className="ocean-waves" viewBox="0 0 1440 500" preserveAspectRatio="none">
  <path d="M0 155 C180 30 330 245 520 145 S850 70 1050 170 S1320 110 1440 70 V500 H0Z" fill="#68c8ed" opacity=".22"/>
  <path d="M0 240 C210 120 380 320 590 205 S940 195 1130 230 S1300 270 1440 175 V500 H0Z" fill="#339acb" opacity=".18"/>
  <path d="M0 330 C200 275 400 365 600 305 S960 320 1150 300 S1320 345 1440 285 V500 H0Z" fill="#187aae" opacity=".16"/>
 </svg>
 </div>}
