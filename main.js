import {createTraceAudio} from './trace-audio.js';

(() => {
  const $=s=>document.querySelector(s),story=$('.story'),stage=$('.story-stage');if(!story)return;
  const opening=$('.opening-copy'),mapCopy=$('.trace-copy'),defenseCopy=$('.defense-copy'),defender=$('.defender-scene'),monitor=$('.defender-monitor');
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const clamp=n=>Math.min(1,Math.max(0,n)),ease=(a,b,p)=>{const q=clamp((p-a)/(b-a));return q*q*(3-2*q);};
  let pending=false,atConsole=false,wantFocus=false,scene=null,lastProgress=0,skipSound=false,loadingScene=false;
  let resumeRequested=performance.getEntriesByType('navigation')[0]?.type==='back_forward'&&history.state?.traceResume?clamp(history.state.traceResume.progress??1):null;
  const sound=createTraceAudio($('#sound-toggle'),$('#sound-status')),replay=$('#replay-trace');
  $('.trace-controls').hidden=false;
  const storyTitle=$('.opening-copy h1');storyTitle.tabIndex=-1;
  const consoleCue=$('.console-arrival');
  // Extra sticky distance makes the project launcher a destination, while keeping native scrolling.
  const consoleHold=()=>Math.min(innerHeight*.8,650);
  const traceTravel=()=>Math.max(1,story.offsetHeight-stage.offsetHeight-consoleHold());
  const visible=(el,opacity,interactive=false)=>{el.style.opacity=opacity;el.inert=opacity<.94;el.style.pointerEvents=interactive&&opacity>.94?'auto':'none';};
  function paint(){
    pending=false;
    if(reduced.matches){consoleCue.hidden=true;sound.stop();replay.hidden=false;scene?.pause(true);opening.inert=false;defender.inert=false;defender.style.pointerEvents='auto';mapCopy.inert=true;defenseCopy.inert=true;return;}
    scene?.pause(false);
    const r=story.getBoundingClientRect(),p=clamp(-r.top/Math.max(1,traceTravel()));lastProgress=p;atConsole=p>.995&&r.bottom>=stage.offsetHeight-40;
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
    const chapters=p<.18?['01 / INTENT','A PROMPT BECOMES AN ACTION']:p<.43?['02 / THE CONNECTION','WORKSTATION → ROUTER']:p<.69?['03 / ACROSS THE NETWORK','FOLLOW EVENT E01']:p<.93?['04 / THE RESPONSE','ALERT → ANALYST WORKSTATION']:['05 / THE WORK','ACT / LEARN'];
    $('#journey-chapter').textContent=chapters[0];$('#journey-detail').textContent=chapters[1];$('#scene-number').textContent=chapters[0].slice(0,2);
    $('.journey-label').style.opacity=1-ease(.93,.98,p);visible($('.map-caption'),ease(.41,.45,p)*(1-ease(.66,.70,p)));
    if(scene)scene.setProgress(p);
    // The CSS workstation remains available as a low-motion/static fallback.
    if(fallback){$('.workstation').style.opacity=1-ease(.25,.4,p);$('.trace-scene').style.opacity=ease(.4,.48,p)*(1-ease(.66,.74,p));}
    if(wantFocus&&p>.999&&(scene||fallback)){wantFocus=false;(scene?$(location.hash==='#learn'?'#terminal-learn':'#terminal-act'):$(location.hash==='#learn'?'#learn-tab':'#act-tab')).focus({preventScroll:true});}
  }
  function schedule(){if(!pending){pending=true;requestAnimationFrame(paint);}}
  function goConsole(instant=false,focus=false){skipSound=true;sound.stop();if(reduced.matches){$('#console').scrollIntoView({behavior:instant?'instant':'smooth'});return;}wantFocus=focus;scrollTo({top:scrollY+story.getBoundingClientRect().top+traceTravel()+Math.min(100,consoleHold()*.15),behavior:instant?'instant':'smooth'});schedule();}
  replay.addEventListener('click',()=>{sound.reset();skipSound=false;wantFocus=false;atConsole=false;history.replaceState(null,'','#story');scrollTo({top:scrollY+story.getBoundingClientRect().top,behavior:'instant'});paint();storyTitle.focus({preventScroll:true});});
  addEventListener('wheel',()=>{skipSound=false;},{passive:true});addEventListener('touchstart',()=>{skipSound=false;},{passive:true});
  addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key))skipSound=false;});
  function resize(){if(atConsole)goConsole(true);scene?.resize();schedule();}
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',resize,{passive:true});reduced.addEventListener('change',()=>{if(reduced.matches){document.documentElement.classList.remove('scene-loading','scene-restoring');$('.scene-resume').style.backgroundImage='';}else if(!scene)loadScene();schedule();});
  document.querySelectorAll('a[href="#console"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();history.pushState(null,'','#console');goConsole(false,true);}));
  function route(){if(resumeRequested!==null){const progress=resumeRequested;resumeRequested=null;if(reduced.matches)goConsole(true);else{skipSound=true;scrollTo({top:scrollY+story.getBoundingClientRect().top+traceTravel()*progress,behavior:'instant'});}return;}if(['#learn','#act','#console'].includes(location.hash))goConsole(true);}addEventListener('hashchange',route);
  document.addEventListener('click',e=>{
    const link=e.target.closest('a');if(!link||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||!scene||lastProgress<.87)return;
    const target=new URL(link.href,location.href);if(target.origin!==location.origin||!/(?:act|learn|surge|studystep)\.html$/.test(target.pathname))return;
    history.replaceState({...history.state,traceResume:{progress:lastProgress}},'',location.href);
    try{const image=scene.captureFrame();if(image)sessionStorage.setItem('portfolio:console-frame',JSON.stringify({image,transform:$('.terminal-launchpad').style.transform,width:stage.clientWidth,height:stage.clientHeight}));}catch{}
  });
  addEventListener('pageshow',e=>{if(e.persisted){scene?.resize();paint();}});
  const boundaries=[['SOURCE CHECK','Compare the draft with its source.'],['ONE REVISION','Use one revision to refine the draft.'],['HUMAN APPROVAL','Review the draft. Decide what to save.']],buttons=[...document.querySelectorAll('[data-learn-stage]')];
  buttons.forEach((b,i)=>b.addEventListener('click',()=>{buttons.forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('#learn-state').textContent=boundaries[i][0];$('#learn-result').textContent=boundaries[i][1];}));
  function loadScene(){
    if(reduced.matches||scene||loadingScene)return;loadingScene=true;document.documentElement.classList.add('scene-loading');document.body.classList.remove('static-render');
    import('./hardware-scene.js').then(m=>m.createHardwareScene(stage,{initialProgress:lastProgress})).then(s=>{scene=s;paint();document.documentElement.classList.remove('scene-loading','scene-restoring');$('.scene-resume').style.backgroundImage='';document.querySelector('.hardware-canvas')?.addEventListener('webglcontextrestored',()=>{scene.resize();paint();});}).catch(()=>{document.querySelector('.hardware-canvas')?.remove();document.querySelector('.physical-enter')?.remove();document.querySelector('.packet-tag')?.remove();document.querySelector('.server-alert')?.remove();$('.terminal-launchpad').style.display='none';$('.terminal-launchpad').inert=true;$('.scene-resume').style.backgroundImage='';document.body.classList.remove('webgl-ready');document.body.classList.add('static-render');document.documentElement.classList.remove('scene-loading','scene-restoring');schedule();}).finally(()=>{loadingScene=false;});
  }
  route();paint();document.fonts.ready.then(resize);loadScene();
  fetch('./project-catalog.json').then(r=>r.ok?r.json():null).then(catalog=>{if(Array.isArray(catalog?.projects))$('[data-project-total]').textContent=String(catalog.projects.filter(p=>['act','learn'].includes(p.category)).length).padStart(2,'0');}).catch(()=>{});
})();
