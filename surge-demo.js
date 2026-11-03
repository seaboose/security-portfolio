// Source-faithful, local workflow demonstrations. See the catalog's evidence refs.
// Values in Review/Explain/Export reproduce Surge's controlled renderer fixture.
const STYLE_ID='surge-workflow-demo-style';
let demoInstance=0;
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=(x,y,value,size=18,fill='#cbd1c3',extra='')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" ${extra}>${escape(value)}</text>`;
const rect=(x,y,w,h,fill='#101412',stroke='#3d4b40',extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${fill}" stroke="${stroke}" ${extra}/>`;
const line=(x1,y1,x2,y2,stroke='#3d4b40',extra='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" ${extra}/>`;
const pill=(x,y,w,label,color='#cbd1c3')=>`${rect(x,y,w,29,color+'12',color+'70')}${text(x+10,y+20,label,12,color)}`;
function style(){if(document.getElementById(STYLE_ID))return;const node=document.createElement('style');node.id=STYLE_ID;node.textContent=`
.surge-demo{height:100%;width:100%;min-height:0;position:relative;display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse at 70% 10%,#26302929,transparent 70%);isolation:isolate}
.surge-demo svg{display:block;width:100%;height:100%;max-height:100%;overflow:visible;font-family:'IBM Plex Mono',monospace}.surge-demo .sd-title{font-family:'Barlow Condensed','Arial Narrow',sans-serif;font-weight:500}.surge-demo .sd-glow{filter:drop-shadow(0 0 3px #a8b4a240)}.surge-demo .sd-dim{opacity:.55}.surge-demo .sd-pointer{filter:drop-shadow(0 3px 2px #0008)}
.surge-demo [data-appear]{opacity:0;transition:opacity .25s ease}.surge-demo [data-appear].is-on{opacity:1}.surge-demo [data-highlight]{transition:stroke .3s,fill .3s}.surge-demo .sd-flowline{stroke-dasharray:5 9}.surge-demo .sd-report-text{font-family:Inter,Arial,sans-serif}
@media(prefers-reduced-motion:reduce){.surge-demo *{transition:none!important}}
`;document.head.append(node);}
function base(content,title,mode){return `<svg viewBox="0 0 800 480" role="img" aria-label="${escape(title)}" preserveAspectRatio="xMidYMid meet"><defs><linearGradient id="sd-panel" x2="1" y2="1"><stop stop-color="#171e1a"/><stop offset="1" stop-color="#101412"/></linearGradient><pattern id="sd-grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" fill="none" stroke="#3d4b40" stroke-opacity=".22"/></pattern><radialGradient id="sd-pawn"><stop stop-color="#e9e8df"/><stop offset=".5" stop-color="#cbd1c3"/><stop offset="1" stop-color="#64725e"/></radialGradient></defs>${rect(1,1,798,478,'url(#sd-panel)','#64725e')}${text(24,32,'SURVIVE SESSIONS',13,'#a8b4a2')}${pill(628,15,148,mode,'#dd956c')}${line(1,57,799,57)}${content}</svg>`;}
function arena(x=25,y=82,w=750,h=305,interactive=false){return `<g transform="translate(${x} ${y})">${rect(0,0,w,h,'#101412','#3d4b40')}${rect(1,1,w-2,h-2,'url(#sd-grid)','none')}${text(15,25,interactive?'CONTROLLED ARENA / PRACTICE':'RECORDED ARENA REPLAY',11,'#84907d')}${rect(w*.3,h*.526923,w*.0923077,h*.138462,'#263029','#84907d')}${rect(w*.615385,h*.315385,w*.107692,h*.0923077,'#263029','#84907d')}<path d="M ${w*.25} ${h*.3} L ${w*.42} ${h*.42} L ${w*.52} ${h*.42} L ${w*.58} ${h*.24}" fill="none" stroke="#cbd1c3" stroke-width="2" opacity=".35"/><g data-ring>${line(w*.7-10,h*.62,w*.7+10,h*.62,'#a8b4a2')}${line(w*.7,h*.62-10,w*.7,h*.62+10,'#a8b4a2')}</g><circle data-warning cx="${w*.74}" cy="${h*.7}" r="${h*.16}" fill="#dc704710" stroke="#dd956c" stroke-dasharray="4 4"/><line data-shot-line x1="${w*.08}" y1="${h*.34}" x2="${w*.91}" y2="${h*.34}" stroke="#dc7047" stroke-dasharray="7 9" opacity=".5"/><circle data-shot r="5" fill="#dd956c" class="sd-glow"/><g data-pawn class="sd-glow"><circle r="13" fill="#a8b4a21d" stroke="#cbd1c3"/><circle r="6" fill="url(#sd-pawn)"/><path d="M-3 -4L3 -4 5 4 -5 4Z" fill="#e9e8df" opacity=".9"/></g></g>`;}
function play(){return base(`${arena(24,79,752,303,true)}${text(26,413,'Human',15,'#e9e8df')}${text(143,413,'Scripted',15,'#a8b4a2')}${text(282,413,'Mixed',15,'#a8b4a2')}${pill(576,397,199,'60-SECOND TRIAL')}${text(26,449,'RIGHT-CLICK  MOVE',12,'#a8b4a2')}${text(264,449,'Q  DASH',12,'#a8b4a2')}${text(424,449,'E  BLINK',12,'#a8b4a2')}${text(576,449,'S  STOP',12,'#a8b4a2')}`,'Survive practice demonstration: move through a top-down arena and dodge skillshots.','PLAY');}
function capture(){return base(`${arena(24,81,325,285)}${text(24,397,'Recording',24,'#e9e8df','class="sd-title"')}${pill(24,417,325,'GAME-ACCEPTED COMMANDS')}${text(375,100,'EVENT RECORDS',13,'#a8b4a2')}${line(375,115,776,115)}${text(389,147,'SEQ',11,'#84907d')}${text(469,147,'EVENT / DETAIL',11,'#84907d')}
${[ ['10','command_grant','move'],['298','sample','walking'],['299','sample','walking'],['300','sample','walking'] ].map((r,i)=>`<g data-row="${i}">${rect(375,162+i*51,401,43,'#171e1a','#3d4b40','data-highlight')}${text(390,189+i*51,r[0],14,'#cbd1c3')}${text(469,184+i*51,r[1],14,'#cbd1c3')}${text(469,201+i*51,r[2],10,'#84907d')}</g>`).join('')}
${text(375,402,'survive-v3',14,'#a8b4a2')}${text(375,432,'seq · elapsed_s · x_cm · y_cm',12,'#a8b4a2')}${text(375,454,'Controlled UI fixture / recorded fields',10,'#84907d')}`,'Surge recording demonstration showing accepted move commands and sampled position records.','RECORD');}
function inspect(){return base(`${text(25,88,'MOVEMENT MEASUREMENTS',12,'#a8b4a2')}${rect(25,105,750,98,'#101412','#3d4b40')}${line(44,166,758,166,'#84907d','stroke-dasharray="3 5"')}${text(641,156,'Allowance',10,'#a8b4a2')}<polyline points="45,177 105,173 165,175 225,171 285,173 345,177 405,173 465,175 525,123 585,175 645,174 705,172 757,174" fill="none" stroke="#a8b4a2" stroke-width="3"/><circle cx="525" cy="123" r="6" fill="#dd956c" stroke="#e7b596"/><circle data-click-ring cx="525" cy="123" r="18" fill="none" stroke="#dd956c"/><path data-pointer class="sd-pointer" d="M0 0L1 25 7 18 14 30 19 27 12 16 22 15Z" fill="#e9e8df" stroke="#101412"/>
<g data-appear="selected">${rect(25,223,750,228,'#171e1a','#64725e')}${text(46,254,'Selected evidence',23,'#e9e8df','class="sd-title"')}${pill(633,234,120,'Review','#dd956c')}${text(46,289,'Rule',12,'#84907d')}${text(220,289,'walking displacement',16,'#cbd1c3')}${text(46,325,'Observed',12,'#84907d')}${text(220,325,'20.00 cm',21,'#dd956c')}${text(430,325,'Allowed',12,'#84907d')}${text(577,325,'16.17 cm',21,'#cbd1c3')}${line(46,341,752,341)}${text(46,369,'Source records',12,'#84907d')}${text(220,369,'299–300',15,'#cbd1c3')}${text(430,369,'Game time',12,'#84907d')}${text(577,369,'10.000 s',15,'#cbd1c3')}${text(46,405,'Raw source record',12,'#a8b4a2')}${text(46,431,'seq: 300   event: sample   movement_mode: walking',12,'#a8b4a2')}</g>`,'A selected movement interval opens its exact record, observed movement and allowed movement. Controlled fixture.','REVIEW');}
function explain(){return base(`${text(25,91,'Explain the evidence',26,'#e9e8df','class="sd-title"')}${rect(24,112,415,314,'#101412','#3d4b40')}${text(43,143,'Observations',16,'#a8b4a2')}${line(42,157,419,157)}${text(43,196,'The selected walking interval',17,'#cbd1c3','class="sd-report-text"')}${text(43,227,'contains 20.00 cm of movement.',17,'#cbd1c3','class="sd-report-text"')}${text(43,258,'The allowed value is 16.17 cm.',17,'#cbd1c3','class="sd-report-text"')}${text(43,289,'Inspect its replay and source [E1].',17,'#cbd1c3','class="sd-report-text"')}<rect data-evidence-highlight x="38" y="208" width="371" height="62" fill="#dd956c13" stroke="#dd956c" stroke-width="1.5"/>${pill(42,362,188,'SAVE REVISION','#a8b4a2')}${text(42,407,'Analyst-authored example',10,'#84907d')}${rect(459,112,317,314,'#171e1a','#64725e')}${text(480,145,'E1 / PINNED EVIDENCE',13,'#cbd1c3')}${text(480,183,'walking displacement',15,'#cbd1c3')}${text(480,215,'Observed / allowed',11,'#a8b4a2')}${text(480,246,'20.00 / 16.17 cm',22,'#dd956c','class="sd-title"')}${line(479,264,756,264)}${text(480,294,'Records 299–300',13,'#a8b4a2')}${text(480,324,'10.000 s',13,'#a8b4a2')}${text(480,355,'Open in replay ↗',13,'#cbd1c3')}<path data-link d="M420 251H458" stroke="#cbd1c3" stroke-width="2" stroke-dasharray="4 5"/>${text(24,455,'Question → Observations → Alternatives → Conclusion → Next steps',12,'#84907d')}`,'Surge explanation demonstration highlights a measured interval and its E1 citation in analyst-authored notes.','EXPLAIN');}
function exportScene(){return base(`${rect(26,81,460,361,'#171e1a','#64725e')}${text(47,116,'Investigation report',28,'#e9e8df','class="sd-title"')}${line(47,132,466,132)}${text(47,163,'Question',12,'#a8b4a2')}${text(47,187,'Which movement needs review?',16,'#cbd1c3','class="sd-report-text"')}${text(47,222,'Observations',12,'#a8b4a2')}<defs><clipPath id="sd-observations-reveal" clipPathUnits="userSpaceOnUse"><rect data-write-reveal x="44" y="229" width="0" height="55"/></clipPath></defs><g clip-path="url(#sd-observations-reveal)">${text(47,248,'20.00 cm observed; 16.17 cm allowed.',15,'#cbd1c3','class="sd-report-text"')}${text(47,271,'Inspect the source interval [E1].',15,'#cbd1c3','class="sd-report-text"')}</g>${text(47,308,'Conclusion',12,'#a8b4a2')}${text(47,334,'This controlled interval requires review.',15,'#cbd1c3','class="sd-report-text"')}${text(47,356,'The report retains its evidence context.',15,'#cbd1c3','class="sd-report-text"')}${pill(47,390,221,'E1 / SOURCE SNAPSHOT','#cbd1c3')}${text(511,102,'Report readiness',23,'#e9e8df','class="sd-title"')}${['Saved text','Evidence sources','Citations'].map((s,i)=>`<g data-check="${i}">${rect(512,123+i*52,263,42,'#171e1a','#3d4b40')}${text(529,150+i*52,'✓',17,'#a8b4a2')}${text(556,149+i*52,s,13,'#cbd1c3')}</g>`).join('')}${pill(512,301,263,'SAVE REVISION','#a8b4a2')}${text(512,355,'Export investigation report',14,'#a8b4a2')}<g data-appear="saved">${rect(512,378,263,64,'#263029','#a8b4a2')}${text(529,404,'investigation.html',14,'#e9e8df')}${text(529,425,'HTML + evidence appendix',10,'#a8b4a2')}</g>`,'Analyst-written report saved as a revision and exported to a self-contained HTML file with evidence. Workflow example.','EXPORT');}
export function mountSurgeDemo(container,step,{reducedMotion=false}={}){
  style();const scene=step?.visual?.scene||step?.scene||'play';
  const root=document.createElement('div');root.className='surge-demo';root.dataset.scene=scene;
  // Give each SVG instance its own paint/clip references, including modal copies.
  const instance=++demoInstance,markup=({play,capture,inspect,explain,export:exportScene}[scene]||play)();
  root.innerHTML=markup.replace(/id="(sd-[^"]+)"/g,(_,id)=>`id="${id}-${instance}"`).replace(/url\(#(sd-[^)]+)\)/g,(_,id)=>`url(#${id}-${instance})`);container.append(root);
  const $=s=>root.querySelector(s),all=s=>[...root.querySelectorAll(s)];
  let disposed=false,manualPause=false,visible=true,raf=0,start=0,elapsed=0,lastPaint=-1;
  const motion=matchMedia('(prefers-reduced-motion:reduce)');
  const isStill=()=>reducedMotion||motion.matches;
  function render(t){
    const q=(t%10)/10,still=isStill();
    if(scene==='play'||scene==='capture'){
      const w=scene==='play'?752:325,h=scene==='play'?303:285;
      const local=still ? .48 : q,p=.24+.38*local;
      const py=.35+.13*Math.sin(local*Math.PI*2.5)-.12*Math.max(0,1-Math.abs(local-.6)*12);
      $('[data-pawn]').setAttribute('transform',`translate(${w*p} ${h*py})`);
      $('[data-shot]').setAttribute('cx',w*(.08+.83*((local*1.8)%1)));$('[data-shot]').setAttribute('cy',h*.34);
      $('[data-warning]').setAttribute('opacity',String(.25+.65*Math.pow(Math.sin(local*Math.PI),2)));
      if(scene==='capture'){
        const selected=still?2:Math.min(3,Math.floor(q*4)),fixtureX=[10,298,299,319][selected];
        $('[data-pawn]').setAttribute('transform',`translate(${w*(.5+fixtureX/2600)} ${h*.5})`);
        $('[data-shot]').setAttribute('opacity','0');$('[data-warning]').setAttribute('opacity','0');$('[data-shot-line]').setAttribute('opacity','0');
        all('[data-row]').forEach((row,i)=>row.querySelector('rect').setAttribute('fill',i===selected?'#3d4b40':'#171e1a'));
      }
    }else if(scene==='inspect'){
      const p=still?1:Math.min(1,q/.34),x=650+(525-650)*p,y=192+(123-192)*p;
      $('[data-pointer]').setAttribute('transform',`translate(${x} ${y})`);
      $('[data-click-ring]').setAttribute('opacity',String(still ? .3 : q>.3&&q<.43?1:0));
      $('[data-appear]').classList.toggle('is-on',still||q>.34);
    }else if(scene==='explain'){
      $('[data-evidence-highlight]').setAttribute('opacity',String(still ? .85 : .28+.65*(.5+.5*Math.sin(t*1.2))));
      $('[data-link]').setAttribute('stroke-dashoffset',String(still?0:-t*8));
    }else{
      // Clip the full glyph box instead of painting over part of each line.
      // Width returns to zero on every loop; reduced motion shows the complete text.
      $('[data-write-reveal]').setAttribute('width',String(still?426:426*Math.min(1,q/.35)));
      all('[data-check]').forEach((el,i)=>el.setAttribute('opacity',still||q>.35+i*.10?'1':'.25'));
      $('[data-appear]').classList.toggle('is-on',still||q>.75);
    }
  }
  function tick(now){raf=0;if(disposed||manualPause||!visible||document.hidden||isStill())return;if(!start)start=now-elapsed*1000;elapsed=(now-start)/1000;if(now-lastPaint>32){render(elapsed);lastPaint=now;}raf=requestAnimationFrame(tick);}
  function sync(){if(raf)cancelAnimationFrame(raf);raf=0;start=0;if(isStill())render(5);else if(!manualPause&&visible&&!document.hidden)raf=requestAnimationFrame(tick);}
  const observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);sync();},{threshold:.1});observer.observe(root);
  const onVisibility=()=>sync();document.addEventListener('visibilitychange',onVisibility);motion.addEventListener('change',sync);
  render(isStill()?5:0);sync();
  return {pause(value=true){manualPause=value;sync();},dispose(){disposed=true;if(raf)cancelAnimationFrame(raf);observer.disconnect();document.removeEventListener('visibilitychange',onVisibility);motion.removeEventListener('change',sync);root.remove();}};
}
