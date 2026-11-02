(function(){
const SD=window.SD={};
const P=(cx,cy,r,deg)=>{const a=(deg-90)*Math.PI/180;return [cx+r*Math.cos(a),cy+r*Math.sin(a)]};
const arc=(cx,cy,r,a0,a1)=>{const [x0,y0]=P(cx,cy,r,a0),[x1,y1]=P(cx,cy,r,a1);return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${(a1-a0)>180?1:0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`};
SD.fast=/[?&]fast/.test(location.search);
SD.fmt=ms=>{ms=Math.max(0,ms);const m=Math.floor(ms/60000),s=Math.floor(ms/1000)%60,x=Math.floor(ms%1000);return m+':'+String(s).padStart(2,'0')+'.'+String(x).padStart(3,'0')};
SD.$=(s,r=document)=>r.querySelector(s);SD.$$=(s,r=document)=>[...r.querySelectorAll(s)];
let uid=0;
/* ---------- icons ---------- */
const IC={
 boost:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
 lap:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/>',
 flag:'<path d="M5 21V4M5 4h13l-2 4 2 4H5"/><path d="M9 4v8M13 4v8" opacity=".5"/>',
 gear:'<circle cx="6" cy="6" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="12" cy="18" r="2"/><path d="M6 8v8M12 8v8M18 8v4H6"/>',
 pit:'<path d="M3 17h18M5 17V9l3-4h8l3 4v8"/><circle cx="8" cy="17" r="2"/><circle cx="16" cy="17" r="2"/><path d="M8 9h8"/>',
 warn:'<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.5"/>',
 damage:'<path d="M7 3h10l2 5v10l-2 3H7l-2-3V8z"/><path d="m10 9 2 3-2 2 3 3" />',
 trophy:'<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8M9 18h6"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
 garage:'<path d="M3 21V9l9-5 9 5v12"/><path d="M7 21v-8h10v8M7 17h10"/>',
 ai:'<path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><rect x="7" y="7" width="10" height="10" rx="2"/><path d="M10 10h4v4h-4z"/>',
 radio:'<path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
 map:'<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
 timer:'<circle cx="12" cy="13" r="8"/><path d="M12 13V8M10 2h4M19 6l1.5-1.5"/>',
 wheel:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/><path d="M12 3v6.5M4.5 16.5l5.4-3M19.5 16.5l-5.4-3"/>',
 play:'<path d="M7 4v16l13-8z"/>',
 lock:'<rect x="5" y="11" width="14" height="10" rx="1"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
 left:'<path d="m15 5-7 7 7 7"/>',right:'<path d="m9 5 7 7-7 7"/>',
 eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
 season:'<path d="M12 2l2.5 6.5L21 9l-5 4.5L17.5 21 12 17l-5.5 4L8 13.5 3 9l6.5-.5z"/>',
 users:'<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-4 3-6 7-6s7 2 7 6"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14c2.5.5 4 2.5 4 6"/>',
 phone:'<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>',
 brake:'<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>',
};
SD.icon=(n,cls='')=>`<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]||''}</svg>`;
SD.iconNames=Object.keys(IC);
SD.logo=(c1='#00f0ff',c2='#ff2e88')=>`<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M3 26 13 6h6L9 26z" fill="${c1}"/><path d="M13 26 23 6h6L19 26z" fill="${c2}"/><path d="M2 16h9" stroke="${c1}" stroke-width="2"/></svg>`;
/* ---------- car silhouettes (side profile) ---------- */
const BODIES=[
 'M8 50 C10 42 22 40 40 38 L70 26 C84 20 112 18 130 22 L170 34 C190 36 206 40 212 46 L214 54 C214 58 210 60 204 60 L16 60 C10 60 7 56 8 50Z',
 'M6 52 C8 44 18 42 34 40 L64 30 C80 24 104 22 124 24 L160 30 C184 32 204 38 212 46 L214 55 C213 59 209 61 203 61 L14 61 C8 61 5 57 6 52Z',
 'M8 48 C14 40 30 38 50 36 L84 22 C98 17 120 17 134 22 L164 36 C188 38 204 42 212 48 L212 56 C212 59 208 61 202 61 L16 61 C10 61 7 55 8 48Z',
 'M6 50 L30 40 L76 24 C92 19 116 19 132 24 L178 38 C196 41 208 44 213 50 L213 57 C213 60 210 61 205 61 L14 61 C8 61 5 56 6 50Z'];
SD.car=(color='#00f0ff',v=0)=>{const id='cg'+(uid++);return `<svg viewBox="0 0 220 76" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".95"/><stop offset=".55" stop-color="${color}" stop-opacity=".45"/><stop offset="1" stop-color="#0b0d14"/></linearGradient></defs>
<ellipse cx="110" cy="66" rx="98" ry="5" fill="${color}" opacity=".25"/>
<path d="${BODIES[v%4]}" fill="url(#${id})" stroke="${color}" stroke-width="1.4"/>
<path d="M74 30 C88 25 112 24 128 27 L150 35 L70 37Z" fill="#05060a" opacity=".85"/>
<path d="M30 46 H190" stroke="#fff" stroke-opacity=".35" stroke-width="1"/>
<path d="M196 44 l14 3" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><path d="M10 47 l10 -1" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
<g fill="#05060a" stroke="${color}" stroke-width="2"><circle cx="54" cy="58" r="11"/><circle cx="168" cy="58" r="11"/></g>
<g fill="${color}"><circle cx="54" cy="58" r="3.5"/><circle cx="168" cy="58" r="3.5"/></g></svg>`};
/* ---------- gauge ---------- */
SD.gauge=(el,o={})=>{const max=o.max||400,A0=-135,A1=135,id='gG'+(uid++);let t='';
 for(let v=0;v<=max;v+=20){const a=A0+(A1-A0)*v/max,maj=v%40===0,[x0,y0]=P(100,100,maj?66:69,a),[x1,y1]=P(100,100,74,a);t+=`<line class="tick ${maj?'maj':''}" x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}"/>`;if(v%80===0){const [lx,ly]=P(100,100,56,a);t+=`<text class="lbl" x="${lx}" y="${ly+3}">${v}</text>`}}
 el.innerHTML=`<svg class="sd-gauge" viewBox="0 0 200 186"><defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="var(--volt)"/><stop offset=".7" stop-color="var(--volt)"/><stop offset="1" stop-color="var(--pulse)"/></linearGradient></defs>
 <path class="trk" d="${arc(100,100,86,A0,A1)}"/><path class="val" stroke="url(#${id})" pathLength="100" stroke-dasharray="0 100" d="${arc(100,100,86,A0,A1)}"/>
 <path class="rtrk" d="${arc(100,100,78,A0,A1)}"/><path class="red" d="${arc(100,100,78,A0+(A1-A0)*.86,A1)}"/><path class="rval" pathLength="100" stroke-dasharray="0 100" d="${arc(100,100,78,A0,A1)}"/>
 ${t}<text class="spd" x="100" y="112">0</text><text class="unit" x="100" y="128">KM/H</text>
 <rect class="gearbox" x="84" y="140" width="32" height="28" rx="2"/><text class="gear" x="100" y="161">N</text>
 <text class="lbl" x="58" y="174">RPM ×1000</text></svg>`;
 const s=el.querySelector('svg'),val=s.querySelector('.val'),rv=s.querySelector('.rval'),sp=s.querySelector('.spd'),g=s.querySelector('.gear');
 const api={set(v,rpm,gear){const p=Math.min(1,v/max);val.setAttribute('stroke-dasharray',`${(p*100).toFixed(2)} 100`);rv.setAttribute('stroke-dasharray',`${(rpm*100).toFixed(2)} 100`);sp.textContent=Math.round(v);g.textContent=gear;s.classList.toggle('redl',rpm>.88)}};
 api.set(o.value||0,o.rpm||0,o.gear||'N');return api};
SD.gearFor=v=>{const gs=[0,60,110,160,210,260,310];let g=1;for(let i=1;i<gs.length;i++)if(v>gs[i])g=i+1;g=Math.min(g,7);const lo=gs[g-1],hi=g<7?gs[g]:400;return {gear:v<3?'N':String(g),rpm:v<3?.12:Math.min(.98,.3+.68*(v-lo)/(hi-lo))}};
/* ---------- boost ---------- */
SD.boost=(el,o={})=>{const n=o.segments||12;el.classList.add('sd-boost');el.innerHTML=`<div class="hd"><span>${SD.icon('boost')} NITRO</span><b>0%</b></div><div class="bar">${'<i class="seg"></i>'.repeat(n)}</div>`;
 el.querySelector('.hd svg').style.cssText='width:1.1em;height:1.1em;vertical-align:-.2em';const segs=[...el.querySelectorAll('.seg')],b=el.querySelector('b');
 const api={set(p,firing){segs.forEach((s,i)=>s.classList.toggle('on',i<Math.round(p*n)));b.textContent=Math.round(p*100)+'%';el.classList.toggle('firing',!!firing);el.classList.toggle('ready',p>=.999&&!firing)}};api.set(o.value||0);return api};
/* ---------- lap timer ---------- */
SD.lapTimer=(el)=>{el.classList.add('sd-lap');el.innerHTML=`<div class="row1">LAP <b class="l">1</b><span class="lt">/ 3</span></div><div class="cur">0:00.000</div><div class="meta"><span>BEST <b class="bs">--:--.---</b></span><span class="d">±0.000</span></div>`;
 const q=s=>el.querySelector(s);return {set(o){if(o.lap!=null)q('.l').textContent=o.lap;if(o.laps)q('.lt').textContent='/ '+o.laps;if(o.ms!=null)q('.cur').textContent=SD.fmt(o.ms);if(o.best!=null)q('.bs').textContent=o.best?SD.fmt(o.best):'--:--.---';if(o.delta!=null){const d=q('.d');d.textContent=(o.delta<0?'−':'+')+(Math.abs(o.delta)/1000).toFixed(3);d.className='d '+(o.delta<0?'neg':'pos')}}}};
/* ---------- position ---------- */
SD.position=(el)=>{el.classList.add('sd-pos');el.innerHTML=`<span class="p">P</span><span class="n">8</span><span class="t">/8</span>`;let last=null,tm;
 return {set(p,t){el.querySelector('.n').textContent=p;if(t)el.querySelector('.t').textContent='/'+t;if(last!=null&&p!==last){el.classList.remove('up','down');void el.offsetWidth;el.classList.add(p<last?'up':'down');clearTimeout(tm);tm=setTimeout(()=>el.classList.remove('up','down'),1400)}last=p}}};
/* ---------- minimap ---------- */
SD.TRACK='M30 112 C28 62 58 30 100 34 C138 38 146 70 172 60 C198 50 210 98 190 126 C170 154 124 140 102 160 C80 180 32 166 30 112Z';
SD.minimap=(el,o={})=>{el.classList.add('sd-map');const n=o.opponents||7;
 el.innerHTML=`<svg viewBox="0 0 220 190"><path class="road" d="${SD.TRACK}"/><path class="edge" d="${SD.TRACK}"/><line class="sf" x1="22" y1="112" x2="38" y2="112"/>${'<circle class="opp" r="3.6"/>'.repeat(n)}<circle class="me" r="5.5"/></svg>`;
 const path=el.querySelector('.edge'),L=path.getTotalLength(),opps=[...el.querySelectorAll('.opp')],me=el.querySelector('.me');
 const at=(c,t)=>{const pt=path.getPointAtLength(((1-(t%1+1)%1))*L);c.setAttribute('cx',pt.x);c.setAttribute('cy',pt.y)};
 const api={set(t,others=[]){at(me,t);opps.forEach((c,i)=>{if(others[i]==null){c.style.display='none'}else{c.style.display='';at(c,others[i])}})}};api.set(o.t||0,o.others||[]);return api};
/* ---------- damage ---------- */
SD.damage=(el)=>{el.classList.add('sd-dmg');const pid='hatch'+(uid++);
 el.innerHTML=`<svg viewBox="0 0 60 110"><defs><pattern id="${pid}a" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="var(--ignite)"/><line x1="0" y1="0" x2="0" y2="5" stroke="#05060a" stroke-width="2"/></pattern><pattern id="${pid}b" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="var(--redline)"/><circle cx="2" cy="2" r="1" fill="#05060a"/></pattern></defs>
 <path class="z front" d="M14 8 Q30 0 46 8 L48 26 H12Z"/><path class="z left" d="M12 28 H22 V82 H12 Q8 55 12 28Z"/><path class="z right" d="M38 28 H48 Q52 55 48 82 H38Z"/><path class="z core" d="M24 28 H36 V82 H24Z" style="fill:rgba(140,160,230,.15)"/><path class="z rear" d="M12 84 H48 L46 102 Q30 108 14 102Z"/>
 <path class="shell" d="M14 8 Q30 0 46 8 L50 30 Q53 55 50 82 L46 102 Q30 108 14 102 L10 82 Q7 55 10 30Z"/></svg>`;
 const z={};['front','left','right','rear'].forEach(k=>z[k]=el.querySelector('.'+k));
 const api={state:{front:0,left:0,right:0,rear:0},set(o){Object.assign(api.state,o);for(const k in z){const v=api.state[k],l=v<.2?0:v<.45?1:v<.75?2:3;z[k].setAttribute('class','z '+k+' lvl'+l);
   z[k].style.fill=(el.closest('.cb')&&l>=2)?`url(#${pid}${l===2?'a':'b'})`:''}}};api.set({});return api};
/* ---------- toast ---------- */
const TI={info:'flag',ok:'trophy',warn:'warn',danger:'damage',boost:'boost',ai:'ai'};
SD.toastHTML=(o)=>`<div class="sd-toast ${o.type||'info'}"><div class="ic">${SD.icon(o.icon||TI[o.type||'info'])}</div><div><b>${o.title}</b><span>${o.msg||''}</span></div></div>`;
SD.toast=(stack,o)=>{const w=document.createElement('div');w.innerHTML=SD.toastHTML(o);const t=w.firstElementChild;stack.prepend(t);while(stack.children.length>(o.max||3))stack.lastElementChild.remove();
 setTimeout(()=>{t.classList.add('out');setTimeout(()=>t.remove(),360)},o.ttl||(SD.fast?1600:3200));return t};
SD.calloutHTML=(o)=>`<div class="sd-callout"><div class="av">${SD.icon('radio')}</div><div><b>${o.title||'AI RACE ENGINEER'}</b><span>${o.msg}</span><div class="wave">${Array.from({length:18},(_,i)=>`<i style="animation-delay:${(i*.07).toFixed(2)}s"></i>`).join('')}</div></div></div>`;
SD.lbRow=(o)=>`<div class="sd-lb ${o.pos<=3?'p'+o.pos:''} ${o.you?'you':''}"><div class="ps">${o.pos}</div><div class="nm"><i style="background:${o.color}"></i>${o.name}</div><div class="car">${o.car||''}</div><div class="tm">${o.time||''}</div></div>`;
/* ---------- full HUD composite ---------- */
SD.hud=(el,o={})=>{
 el.classList.add('hud');if(o.plates)el.classList.add('plates');if(o.season)el.classList.add('has-season');if(o.ai)el.classList.add('has-ai');if(o.mobile)el.classList.add('mobile');if(o.compact)el.classList.add('compact');if(o.scale)el.style.setProperty('--hs',o.scale);
 el.innerHTML=`<div class="slot tl plate"><div class="lapw"></div></div>
 <div class="slot tr plate"><div class="posw"></div><div class="rival">GAP P<span class="rp">7</span> <b class="gap">+0.84</b></div><div class="adapt">◆ ADAPTIVE AI · RIVALS MATCHED</div></div>
 <div class="slot tc season"><div class="evt">SEASON 02 · NEON MONSOON</div><div class="bp"><div class="t"><span>TIER 23</span><span>+120 XP</span></div><div class="bar"><i style="width:62%"></i></div></div><div class="chal">${SD.icon('season').replace('class="ic ','style="width:1.2em;height:1.2em;color:var(--solar)" class="ic ')} DRIFT 500M <b>320/500</b></div></div>
 <div class="slot toast-slot"><div class="sd-toasts"></div></div>
 <div class="slot bl plate"><div class="mapw"></div></div>
 <div class="slot dmg-slot plate"><div class="dmgw"></div></div>
 <div class="slot ai-slot"><div class="aiw"></div></div>
 <div class="slot br plate"><div class="gw"></div><div class="bw" style="margin-top:.2em"></div></div>
 <div class="touch"><div class="pad l">${SD.icon('left')}</div><div class="pad r">${SD.icon('right')}</div><div class="pad brk">${SD.icon('brake')}</div><div class="pad bst">${SD.icon('boost')}</div></div>`;
 const q=s=>el.querySelector(s);
 const h={el,lap:SD.lapTimer(q('.lapw')),pos:SD.position(q('.posw')),map:SD.minimap(q('.mapw')),dmg:SD.damage(q('.dmgw')),gauge:SD.gauge(q('.gw')),boost:SD.boost(q('.bw')),toasts:q('.sd-toasts'),
  gap(p,g){q('.rp').textContent=p;q('.gap').textContent=g},ai(msg){q('.aiw').innerHTML=msg?SD.calloutHTML({msg}):''}};
 if(o.aiMsg)h.ai(o.aiMsg);
 return h};
/* ---------- static scene (SVG) for frames ---------- */
SD.scene=(o={})=>{const id='sc'+(uid++),w=1600,h=900,hz=400;let stripes='',cars='';
 for(let i=0;i<14;i++){const z0=i*.07,z1=z0+.035;const y0=hz+(h-hz)*Math.pow(z0,1.6),y1=hz+(h-hz)*Math.pow(z1,1.6);const p0=(y0-hz)/(h-hz),p1=(y1-hz)/(h-hz);
  const cx0=800+(o.curve||0)*Math.pow(1-p0,2)*260,cx1=800+(o.curve||0)*Math.pow(1-p1,2)*260;
  stripes+=`<path d="M${cx0-3-6*p0} ${y0}L${cx0+3+6*p0} ${y0}L${cx1+3+6*p1} ${y1}L${cx1-3-6*p1} ${y1}Z" fill="#eaf2ff" opacity=".7"/>`}
 let roadL='',roadR='',ln='';for(let i=0;i<=20;i++){const p=i/20,y=hz+(h-hz)*p,cx=800+(o.curve||0)*Math.pow(1-p,2)*260,ww=40+760*p;roadL+=`${cx-ww},${y} `;roadR=`${cx+ww},${y} `+roadR;ln+=`${cx+ww*.15*(o.lineSide||1)-ww*.05},${y} `}
 const opp=(x,y,s,c)=>`<g transform="translate(${x} ${y}) scale(${s})"><rect x="-60" y="-40" width="120" height="36" rx="6" fill="#10131c" stroke="${c}" stroke-width="2"/><rect x="-54" y="-18" width="34" height="7" fill="${c}"/><rect x="20" y="-18" width="34" height="7" fill="${c}"/><rect x="-64" y="-6" width="128" height="10" fill="#05060a"/></g>`;
 cars=opp(860,520,.9,'var(--pulse)')+opp(700,470,.55,'var(--volt)')+opp(830,445,.35,'var(--apex)');
 return `<svg class="scene" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>
 <linearGradient id="${id}s" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#05060a"/><stop offset=".7" stop-color="#2a0f3d"/><stop offset="1" stop-color="#5a1446"/></linearGradient>
 <linearGradient id="${id}u" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffc23d"/><stop offset="1" stop-color="#ff2e88"/></linearGradient>
 <linearGradient id="${id}g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#14081f"/><stop offset="1" stop-color="#05060a"/></linearGradient>
 <clipPath id="${id}c"><rect x="0" y="0" width="${w}" height="${hz}"/></clipPath></defs>
 <rect width="${w}" height="${hz}" fill="url(#${id}s)"/>
 <g clip-path="url(#${id}c)"><circle cx="800" cy="${hz-20}" r="170" fill="url(#${id}u)"/>${[0,1,2,3,4,5].map(i=>`<rect x="600" y="${hz-120+i*22}" width="400" height="${3+i*2}" fill="#2a0f3d"/>`).join('')}</g>
 <path d="M0 ${hz} L120 320 L240 360 L380 270 L520 350 L640 ${hz} M960 ${hz} L1080 330 L1220 260 L1360 340 L1480 300 L1600 ${hz}" fill="#0b0d14" stroke="var(--volt)" stroke-width="2" opacity=".9"/>
 <rect y="${hz}" width="${w}" height="${h-hz}" fill="url(#${id}g)"/>
 ${Array.from({length:9},(_,i)=>{const y=hz+(h-hz)*Math.pow((i+1)/9,1.8);return `<line x1="0" x2="${w}" y1="${y}" y2="${y}" stroke="#ff2e88" stroke-opacity=".25"/>`}).join('')}
 <polygon points="${roadL}${roadR}" fill="#0e1018" stroke="var(--pulse)" stroke-width="5"/>
 ${stripes}
 ${o.line?`<polyline points="${ln}" fill="none" stroke="var(--flux)" stroke-width="10" stroke-opacity=".75" stroke-dasharray="40 26" style="filter:drop-shadow(0 0 8px #8b5cff)"/>`:''}
 ${cars}
 <g transform="translate(800 820)"><rect x="-150" y="-80" width="300" height="80" rx="12" fill="#10131c" stroke="${o.car||'var(--volt)'}" stroke-width="3"/><rect x="-136" y="-50" width="80" height="12" fill="${o.car||'var(--volt)'}"/><rect x="56" y="-50" width="80" height="12" fill="${o.car||'var(--volt)'}"/><rect x="-160" y="-18" width="320" height="22" fill="#05060a"/><path d="M-40 4 h80 l-10 30 h-60z" fill="var(--pulse)" opacity=".7"/></g>
 </svg>`};
/* ---------- canvas road renderer (pseudo-3D) ---------- */
SD.Road=function(canvas){const ctx=canvas.getContext('2d');let W=0,H=0,dpr=1;const stars=Array.from({length:90},(_,i)=>[(Math.sin(i*91.7)*.5+.5),(Math.sin(i*37.3)*.5+.5)*.42,(i%3)+1]);
 const fit=()=>{dpr=Math.min(2,window.devicePixelRatio||1);const r=canvas.getBoundingClientRect();W=Math.max(1,r.width);H=Math.max(1,r.height);canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)};
 fit();new ResizeObserver(fit).observe(canvas);
 this.draw=(s)=>{/* s: {pos(m), speed(kmh), curve(-1..1), bend(accum), cars:[{rel,lane,color}], playerColor, boost, steer} */
  const hz=H*.47,cv=s.curve||0;ctx.clearRect(0,0,W,H);
  let g=ctx.createLinearGradient(0,0,0,hz);g.addColorStop(0,'#05060a');g.addColorStop(.65,'#22093a');g.addColorStop(1,'#5a1446');ctx.fillStyle=g;ctx.fillRect(0,0,W,hz+1);
  for(const st of stars){ctx.fillStyle=`rgba(234,242,255,${.2+.15*st[2]})`;ctx.fillRect(((st[0]*W-(s.bend||0)*40)%W+W)%W,st[1]*H,st[2]*.8,st[2]*.8)}
  const sx=W/2-(s.bend||0)*120%W*0,sr=Math.min(W,H)*.2;ctx.save();ctx.beginPath();ctx.rect(0,0,W,hz);ctx.clip();
  g=ctx.createLinearGradient(0,hz-sr*1.2,0,hz);g.addColorStop(0,'#ffc23d');g.addColorStop(1,'#ff2e88');ctx.fillStyle=g;ctx.shadowColor='#ff2e88';ctx.shadowBlur=60;
  const sunX=W/2-cv*W*.12;ctx.beginPath();ctx.arc(sunX,hz-sr*.15,sr,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#2a0d3d';
  for(let i=0;i<6;i++){ctx.fillRect(sunX-sr,hz-sr*.7+i*sr*.16,sr*2,2+i*1.6)}
  // mountains parallax
  const off=((s.bend||0)*60)%W;ctx.fillStyle='#0b0d14';ctx.strokeStyle='#00f0ff';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-W,hz);
  for(let x=-W;x<=W*2;x+=W/12){const k=Math.round((x+W)/(W/12));const yy=hz-(H*.05+H*.07*Math.abs(Math.sin(k*1.7)+.4*Math.sin(k*3.1)));ctx.lineTo(x-off,yy)}ctx.lineTo(W*2,hz);ctx.closePath();ctx.fill();ctx.globalAlpha=.8;ctx.stroke();ctx.globalAlpha=1;ctx.restore();
  // ground + road scanlines
  const rows=H-hz,step=2,camD=rows*3.2;const pos=s.pos||0;
  const center=p=>W/2+cv*Math.pow(1-p,2)*W*.55-(s.steer||0)*W*.35*p;
  for(let y=hz;y<H;y+=step){const dy=y-hz+1,p=dy/rows,d=camD/dy,ph=((d+pos)%24)<12;const w=W*.04+W*.62*p;const cx=center(p);
   ctx.fillStyle=ph?'#0d0718':'#120a20';ctx.fillRect(0,y,W,step);
   if(((d+pos*1)%48)<1.2*d/20+.6){ctx.fillStyle='rgba(255,46,136,.28)';ctx.fillRect(0,y,W,step)}
   const rw=w*.08;ctx.fillStyle=ph?'#ff2e88':'#eaf2ff';ctx.fillRect(cx-w-rw,y,rw,step);ctx.fillRect(cx+w,y,rw,step);
   ctx.fillStyle=ph?'#0f1119':'#13161f';ctx.fillRect(cx-w,y,w*2,step);
   if(((d+pos)%16)<7){ctx.fillStyle='rgba(234,242,255,.75)';const lw=Math.max(1,w*.018);ctx.fillRect(cx-w/3-lw/2,y,lw,step);ctx.fillRect(cx+w/3-lw/2,y,lw,step)}}
  // vertical grid lines on ground
  ctx.strokeStyle='rgba(255,46,136,.18)';ctx.lineWidth=1;for(let i=-10;i<=10;i++){if(Math.abs(i)<2)continue;ctx.beginPath();ctx.moveTo(center(0)+i*W*.02,hz);ctx.lineTo(center(1)+i*W*.32,H);ctx.stroke()}
  // opponents
  const cars=(s.cars||[]).filter(c=>c.rel>1.5&&c.rel<380).sort((a,b)=>b.rel-a.rel);
  for(const c of cars){const dy=camD/c.rel,y=hz+dy;if(y>H+40)continue;const p=dy/rows,w=W*.04+W*.62*p,x=center(p)+c.lane*w*.62,cw=w*.42,ch=cw*.42;
   ctx.save();ctx.translate(x,y);ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(-cw*.55,-ch*.08,cw*1.1,ch*.16);
   ctx.fillStyle='#10131c';ctx.strokeStyle=c.color;ctx.lineWidth=Math.max(1,cw*.025);ctx.beginPath();ctx.roundRect(-cw/2,-ch,cw,ch*.9,cw*.06);ctx.fill();ctx.stroke();
   ctx.fillStyle='#05060a';ctx.fillRect(-cw*.32,-ch*1.18,cw*.64,ch*.24);
   ctx.shadowColor=c.color;ctx.shadowBlur=cw*.25;ctx.fillStyle=c.color;ctx.fillRect(-cw*.46,-ch*.62,cw*.28,ch*.14);ctx.fillRect(cw*.18,-ch*.62,cw*.28,ch*.14);ctx.restore()}
  // speed lines
  const sp=s.speed||0;if(sp>180){const n=Math.floor((sp-180)/6)+(s.boost?30:0);ctx.strokeStyle=s.boost?'rgba(255,46,136,.5)':'rgba(234,242,255,.22)';ctx.lineWidth=1.2;
   for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,r0=Math.min(W,H)*(.25+Math.random()*.25),r1=r0+Math.min(W,H)*(.12+Math.random()*.25);const cx=W/2,cy=hz+rows*.15;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*r0*1.6,cy+Math.sin(a)*r0);ctx.lineTo(cx+Math.cos(a)*r1*1.6,cy+Math.sin(a)*r1);ctx.stroke()}}
  // player car
  if(s.player!==false){const pc=s.playerColor||'#00f0ff',cw=Math.min(W*.26,H*.5),ch=cw*.36,x=W/2+(s.lean||0)*W*.02,y=H-H*.035;ctx.save();ctx.translate(x,y);ctx.rotate((s.lean||0)*.03);
   if(s.boost){const fg=ctx.createRadialGradient(0,0,0,0,0,cw*.3);fg.addColorStop(0,'rgba(255,255,255,.9)');fg.addColorStop(.3,'rgba(255,46,136,.8)');fg.addColorStop(1,'rgba(255,46,136,0)');ctx.fillStyle=fg;ctx.beginPath();ctx.ellipse(-cw*.18,-ch*.15,cw*.12,ch*.5+Math.random()*ch*.3,0,0,Math.PI*2);ctx.ellipse(cw*.18,-ch*.15,cw*.12,ch*.5+Math.random()*ch*.3,0,0,Math.PI*2);ctx.fill()}
   ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(-cw*.56,-ch*.1,cw*1.12,ch*.18);
   ctx.fillStyle='#10131c';ctx.strokeStyle=pc;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-cw*.5,-ch*.15);ctx.lineTo(-cw*.46,-ch*.8);ctx.lineTo(-cw*.26,-ch);ctx.lineTo(cw*.26,-ch);ctx.lineTo(cw*.46,-ch*.8);ctx.lineTo(cw*.5,-ch*.15);ctx.closePath();ctx.fill();ctx.stroke();
   ctx.fillStyle='#05060a';ctx.fillRect(-cw*.52,-ch*.3,cw*1.04,ch*.2);ctx.fillRect(-cw*.24,-ch*1.18,cw*.48,ch*.2);
   ctx.shadowColor=pc;ctx.shadowBlur=18;ctx.fillStyle=pc;ctx.fillRect(-cw*.44,-ch*.66,cw*.3,ch*.12);ctx.fillRect(cw*.14,-ch*.66,cw*.3,ch*.12);ctx.fillRect(-cw*.06,-ch*.66,cw*.12,ch*.12);
   ctx.shadowBlur=0;ctx.fillStyle='#eaf2ff';ctx.font=`700 ${Math.round(ch*.13)}px Orbitron, sans-serif`;ctx.textAlign='center';ctx.fillText('NULLDRIVE',0,-ch*.4);ctx.restore()}
 };
};
})();
