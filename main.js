import {createTraceAudio} from './trace-audio.js?v=1de39eabb239';

// One clock drives camera, labels and sound together. Wheel notches ease into
// position without changing native document scrolling or overshooting a scene.
export function smoothTraceProgress(current,target,elapsedMs,{snap=false,responseMs=85}={}){
  target=Math.min(1,Math.max(0,target));
  if(snap||!Number.isFinite(current))return target;
  const next=current+(target-current)*(-Math.expm1(-Math.max(0,elapsedMs)/responseMs));
  return Math.abs(target-next)<.00002?target:next;
}

(() => {
  if(typeof document==='undefined')return;
  const $=s=>document.querySelector(s),story=$('.story'),stage=$('.story-stage');if(!story)return;
  const opening=$('.opening-copy'),mapCopy=$('.trace-copy'),defenseCopy=$('.defense-copy'),defender=$('.defender-scene'),monitor=$('.defender-monitor');
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const staticView=new URLSearchParams(location.search).get('view')==='static';
  if(staticView)document.body.classList.add('static-render');
  const clamp=n=>Math.min(1,Math.max(0,n)),ease=(a,b,p)=>{const q=clamp((p-a)/(b-a));return q*q*(3-2*q);};
  let pending=0,atConsole=false,wantFocus=false,scene=null,lastProgress=0,skipSound=false,loadingScene=false,frameTime=0,snapProgress=true;
  let resumeRequested=performance.getEntriesByType('navigation')[0]?.type==='back_forward'&&history.state?.traceResume?clamp(history.state.traceResume.progress??1):null;
  const sound=createTraceAudio($('#sound-toggle'),$('#sound-status')),replay=$('#replay-trace');
  $('.trace-controls').hidden=false;
  const traceChapters=[
    {until:.18,label:'INTENT',detail:'A PROMPT BECOMES AN ACTION'},
    {until:.43,label:'THE CONNECTION',detail:'WORKSTATION → ROUTER'},
    {until:.69,label:'ACROSS THE NETWORK',detail:'FOLLOW EVENT E01'},
    {until:.93,label:'THE RESPONSE',detail:'ALERT → ANALYST WORKSTATION'},
    {until:Infinity,label:'THE WORK',detail:'ACT / LEARN'}
  ];
  $('#scene-total').textContent=String(traceChapters.length).padStart(2,'0');
  const storyTitle=$('.opening-copy h1');storyTitle.tabIndex=-1;
  const consoleCue=$('.console-arrival');
  // Extra sticky distance makes the project launcher a destination, while keeping native scrolling.
  const consoleHold=()=>Math.min(innerHeight*.8,650);
  const traceTravel=()=>Math.max(1,story.offsetHeight-stage.offsetHeight-consoleHold());
  const visible=(el,opacity,interactive=false)=>{el.style.opacity=opacity;el.inert=opacity<.94;el.style.pointerEvents=interactive&&opacity>.94?'auto':'none';};
  function paint(time=performance.now()){
    if(pending)cancelAnimationFrame(pending);pending=0;
    const staticMode=reduced.matches||document.body.classList.contains('static-render');$('.trace-controls').hidden=staticMode;
    if(staticMode){consoleCue.hidden=true;sound.stop();replay.hidden=true;scene?.pause(true);mapCopy.inert=true;defenseCopy.inert=true;return;}
    scene?.pause(false);
    const r=story.getBoundingClientRect(),target=clamp(-r.top/Math.max(1,traceTravel())),elapsed=frameTime?Math.max(0,Math.min(64,time-frameTime)):16.67;
    const shouldSnap=snapProgress||r.bottom<=0||r.top>innerHeight,p=smoothTraceProgress(lastProgress,target,elapsed,{snap:shouldSnap});snapProgress=false;frameTime=time;lastProgress=p;atConsole=p>.995&&r.bottom>=stage.offsetHeight-40;
    consoleCue.hidden=p<.995;
    sound.update(p,{silent:skipSound});if(p>.995)skipSound=false;replay.hidden=p<.94;
    story.style.setProperty('--p',p);
    visible(opening,1-ease(.065,.14,p),true);
    visible(mapCopy,ease(.43,.47,p)*(1-ease(.55,.59,p)),true);
    visible(defenseCopy,ease(.74,.78,p)*(1-ease(.86,.90,p)));
    const signalReadout=$('.signal-readout'),signalState=p<.35?['REQUEST SENT','Workstation → router']:p<.44?['ROUTED TO THE NETWORK','Gateway → internet']:p<.69?['EVENT IN TRANSIT','Follow the red signal']:p<.75?['SERVER ALERT','Suspicious activity observed']:p<.895?['ANALYST WORKSTATION','Review the alert in context']:['READY TO INVESTIGATE','Choose ACT or LEARN'];
    visible(signalReadout,ease(.17,.205,p)*(1-ease(.91,.94,p)));$('#signal-state').textContent=signalState[0];$('#signal-detail').textContent=signalState[1];signalReadout.dataset.phase=p<.375?'outbound':p<.69?'threat':p<.75?'alert':'telemetry';
    $('.scenario-label').style.opacity=1-ease(.16,.20,p);
    // The physical display is the project launcher. Keep the earlier console for static fallback.
    const fallback=document.body.classList.contains('static-render'),arrival=fallback?ease(.96,.997,p):0;visible(defender,arrival,fallback);
    monitor.style.transform='translate(-50%,-50%)';monitor.style.willChange='auto';monitor.style.setProperty('--arrive',1);
    $('.story-meta').style.opacity=1-ease(.92,.98,p);$('.story-skip').style.opacity=1-ease(.92,.98,p);$('.story-skip').inert=p>.98;
    const chapterIndex=traceChapters.findIndex(chapter=>p<chapter.until),chapter=traceChapters[chapterIndex],chapterNumber=String(chapterIndex+1).padStart(2,'0');
    $('#journey-chapter').textContent=`${chapterNumber} / ${chapter.label}`;$('#journey-detail').textContent=chapter.detail;$('#scene-number').textContent=chapterNumber;
    $('.journey-label').style.opacity=1-ease(.93,.98,p);visible($('.map-caption'),ease(.41,.45,p)*(1-ease(.66,.70,p)));
    if(scene)scene.setProgress(p,{immediate:shouldSnap});
    // The CSS workstation remains available as a low-motion/static fallback.
    if(fallback){$('.workstation').style.opacity=1-ease(.25,.4,p);$('.trace-scene').style.opacity=ease(.4,.48,p)*(1-ease(.66,.74,p));}
    if(wantFocus&&p>.999&&(scene||fallback)){wantFocus=false;(scene?$(location.hash==='#learn'?'#terminal-learn':'#terminal-act'):$(location.hash==='#learn'?'#learn-tab':'#act-tab')).focus({preventScroll:true});}
    if(p!==target&&!document.hidden)schedule();
  }
  function schedule(){if(!pending)pending=requestAnimationFrame(paint);}
  function goConsole(instant=false,focus=false){skipSound=true;sound.stop();if(reduced.matches||document.body.classList.contains('static-render')){$('#static-projects')?.scrollIntoView({behavior:instant||reduced.matches?'instant':'smooth'});return;}if(instant)snapProgress=true;wantFocus=focus;scrollTo({top:scrollY+story.getBoundingClientRect().top+traceTravel()+Math.min(100,consoleHold()*.15),behavior:instant?'instant':'smooth'});schedule();}
  replay.addEventListener('click',()=>{sound.reset();skipSound=false;wantFocus=false;atConsole=false;snapProgress=true;history.replaceState(null,'','#story');scrollTo({top:scrollY+story.getBoundingClientRect().top,behavior:'instant'});paint();storyTitle.focus({preventScroll:true});});
  addEventListener('wheel',()=>{skipSound=false;},{passive:true});addEventListener('touchstart',()=>{skipSound=false;},{passive:true});
  addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key))skipSound=false;});
  function resize(){snapProgress=true;if(atConsole)goConsole(true);scene?.resize();schedule();}
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',resize,{passive:true});reduced.addEventListener('change',()=>{if(reduced.matches){document.documentElement.classList.remove('scene-loading','scene-restoring');$('.scene-resume').style.backgroundImage='';}else if(!scene)loadScene();schedule();});
  document.querySelectorAll('a[href="#console"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();history.pushState(null,'','#console');goConsole(false,true);}));
  function route(){snapProgress=true;if(resumeRequested!==null){const progress=resumeRequested;resumeRequested=null;if(reduced.matches||document.body.classList.contains('static-render'))goConsole(true);else{skipSound=true;scrollTo({top:scrollY+story.getBoundingClientRect().top+traceTravel()*progress,behavior:'instant'});}schedule();return;}if(['#learn','#act','#console'].includes(location.hash))goConsole(true);else if(location.hash==='#story'){wantFocus=false;scrollTo({top:scrollY+story.getBoundingClientRect().top,behavior:'instant'});schedule();}}addEventListener('hashchange',route);
  document.addEventListener('click',e=>{
    const link=e.target.closest('a');if(!link||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||!scene||lastProgress<.87)return;
    const target=new URL(link.href,location.href);if(target.origin!==location.origin||!/(?:act|learn|surge|studystep)\.html$/.test(target.pathname))return;
    history.replaceState({...history.state,traceResume:{progress:lastProgress}},'',location.href);
    try{const image=scene.captureFrame();if(image)sessionStorage.setItem('portfolio:console-frame',JSON.stringify({release:document.querySelector('meta[name="portfolio-release"]')?.content||'dev',image,transform:$('.terminal-launchpad').style.transform,width:stage.clientWidth,height:stage.clientHeight}));}catch{}
  });
  addEventListener('pageshow',e=>{if(e.persisted){snapProgress=true;frameTime=0;scene?.resize();paint();}});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){snapProgress=true;frameTime=0;schedule();}});
  function loadScene(){
    if(staticView||reduced.matches||scene||loadingScene)return;loadingScene=true;document.documentElement.classList.add('scene-loading');document.body.classList.remove('static-render');
    import('./hardware-scene.js?v=1de39eabb239').then(m=>m.createHardwareScene(stage,{initialProgress:lastProgress})).then(s=>{scene=s;snapProgress=true;paint();document.documentElement.classList.remove('scene-loading','scene-restoring');$('.scene-resume').style.backgroundImage='';document.querySelector('.hardware-canvas')?.addEventListener('webglcontextrestored',()=>{scene.resize();paint();});}).catch(error=>{console.warn('Portfolio 3D scene unavailable; using the accessible static view.',error?.message||error);document.querySelector('.hardware-canvas')?.remove();document.querySelector('.physical-enter')?.remove();document.querySelector('.packet-tag')?.remove();document.querySelector('.server-alert')?.remove();$('.terminal-launchpad').style.display='none';$('.terminal-launchpad').inert=true;$('.scene-resume').style.backgroundImage='';document.body.classList.remove('webgl-ready');document.body.classList.add('static-render');document.documentElement.classList.remove('scene-loading','scene-restoring');if(['#learn','#act','#console'].includes(location.hash))goConsole(true);schedule();}).finally(()=>{loadingScene=false;});
  }
  route();paint();document.fonts.ready.then(resize);loadScene();
  fetch('./project-catalog.json?v=1de39eabb239').then(r=>r.ok?r.json():null).then(catalog=>{if(Array.isArray(catalog?.projects))$('[data-project-total]').textContent=String(catalog.projects.filter(p=>['act','learn'].includes(p.category)).length).padStart(2,'0');}).catch(()=>{});
})();
