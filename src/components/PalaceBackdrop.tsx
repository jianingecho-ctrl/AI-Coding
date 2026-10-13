export function PalaceBackdrop(){
 return <div className="palace-backdrop" aria-hidden="true">
  <svg className="palace-lattice" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice">
   <defs><pattern id="court-lattice" width="120" height="120" patternUnits="userSpaceOnUse"><path d="M0 60H30V30H60V0M60 120V90H90V60H120M30 90H90V30H30Z" fill="none" stroke="#bda274" strokeWidth="1"/></pattern></defs>
   <rect width="1200" height="900" fill="url(#court-lattice)" opacity=".11"/>
   <g fill="none" stroke="#b99855" strokeWidth="2" opacity=".2"><path d="M20 55H200M55 20V200M20 80H120V20M40 115H85V160H40Z"/><path d="M1180 845H1000M1145 880V700M1180 820H1080V880M1160 785H1115V740H1160Z"/></g>
   <g fill="none" stroke="#d1aa66" strokeWidth="4" opacity=".2"><path d="M850 95Q820 80 832 62Q845 44 862 60Q855 25 887 25Q920 25 918 58Q940 38 956 59Q970 81 946 94Z"/><path d="M245 785Q210 771 224 748Q241 724 262 747Q252 705 291 705Q330 705 327 744Q353 719 372 745Q387 771 358 785Z"/></g>
  </svg>
  <div className="palace-seal">宫</div>
 </div>;
}
