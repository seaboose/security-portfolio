import {openScreenshot} from './media-viewer.js?v=019b20dc38f2';
import {mountSurgeDemo} from './surge-demo.js?v=019b20dc38f2';
import {mountStudyStepDemo} from './studystep-demo.js?v=019b20dc38f2';
import {createWheelStepGate,wheelPixels} from './scroll-step-gate.js?v=019b20dc38f2';
const $=selector=>document.querySelector(selector);
const tour=$('.project-tour'),pin=$('.tour-pin'),picker=$('#project-picker'),controls=$('.step-controls');
const categoryId=document.body.dataset.category,reduced=matchMedia('(prefers-reduced-motion:reduce)');
const clamp=value=>Math.min(1,Math.max(0,value)),pad=value=>String(value).padStart(2,'0');
let projects=[],project=null,active=-1,progress=0,travel=0,pending=false,manual=false,buttons=[];
let demo=null,motionPaused=false,inView=true,mediaOpen=false;
const wheelGate=createWheelStepGate(),coarsePointer=matchMedia('(pointer:coarse)');
let stepAnimations=[],branchNavigating=false,scrollDestination=null;
const motionButton=$('[data-motion-toggle]'),screenshotButton=$('[data-open-screenshot]');
function pauseDemo(){demo?.pause(motionPaused||reduced.matches||!inView||document.hidden||mediaOpen);}
motionButton.addEventListener('click',()=>{motionPaused=!motionPaused;motionButton.setAttribute('aria-pressed',String(motionPaused));motionButton.textContent=motionPaused?'PLAY MOTION':'PAUSE MOTION';pauseDemo();});
screenshotButton.addEventListener('click',()=>{const visual=project.steps[active].visual;openScreenshot({src:visual.screenshot,alt:visual.screenshotAlt||visual.alt||`${project.name} application screenshot`,caption:`${project.name} ${project.version} · Recorded application screen`},screenshotButton);});
addEventListener('portfolio:media',event=>{mediaOpen=event.detail.open;scrollDestination=null;wheelGate.reset();pauseDemo();});
document.addEventListener('visibilitychange',pauseDemo);
new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;pauseDemo();},{threshold:.05}).observe(pin);

function element(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}
function rememberStep(){try{sessionStorage.setItem(`portfolio:branch:${categoryId}`,JSON.stringify({project:project.id,step:Math.max(0,active)}));}catch{}}
function animateStep(previous,index){
  stepAnimations.forEach(animation=>animation.cancel());stepAnimations=[];
  if(previous<0||reduced.matches||motionPaused)return;
  const offset=index>=previous?9:-9;
  for(const selector of ['#step-title','[data-step-copy]','[data-step-facts]','[data-visual-stage]']){
    const node=$(selector);if(node?.animate)stepAnimations.push(node.animate([{opacity:.25,transform:`translateY(${offset}px)`},{opacity:1,transform:'translateY(0)'}],{duration:300,easing:'cubic-bezier(.22,.7,.25,1)'}));
  }
}
function addBranchSwitch(catalog){
  const other=categoryId==='act'?'learn':'act',entries=catalog.projects.filter(item=>item.category===other);if(!entries.length)return;
  const link=[...document.querySelectorAll('.category-header nav a')].find(item=>new URL(item.href,location.href).pathname.endsWith(`/${other}.html`));if(!link)return;
  link.classList.add('branch-switch');link.replaceChildren(element('span','','ALSO EXPLORE'),element('strong','',other.toUpperCase()),element('i','','↗'));link.setAttribute('aria-label',`Explore ${other.toUpperCase()} projects`);
  function destination(){let saved;try{saved=JSON.parse(sessionStorage.getItem(`portfolio:branch:${other}`)||'null');}catch{}const found=entries.find(item=>item.id===saved?.project);link.href=found?`${other}.html?project=${encodeURIComponent(found.id)}#step-${Math.max(0,Math.min(found.steps.length-1,Math.trunc(Number(saved.step)||0)))+1}`:`${other}.html`;}
  destination();link.addEventListener('pointerenter',destination);link.addEventListener('focus',destination);
  link.addEventListener('click',event=>{if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;destination();rememberStep();if(reduced.matches)return;event.preventDefault();if(branchNavigating)return;branchNavigating=true;document.body.classList.add('branch-leaving');setTimeout(()=>location.assign(link.href),140);});
}
function visualFor(visual){
  if(visual.type==='image'){
    const figure=element('figure'),button=element('button','screenshot-enlarge'),image=element('img');button.type='button';button.dataset.enlarge='';button.setAttribute('aria-label','Enlarge application screenshot');image.src=visual.src;image.alt=visual.alt;image.decoding='async';button.append(image,element('span','enlarge-hint','ENLARGE ↗'));figure.append(button);return figure;
  }
  const root=element('div','flow-visual'),nodes=element('div','flow-nodes');nodes.style.setProperty('--nodes',visual.nodes.length);
  visual.nodes.forEach((name,index)=>{const node=element('div',`flow-node${index===visual.active?' is-active':''}`);node.append(element('b','',pad(index+1)),document.createTextNode(name));nodes.append(node);});
  const artifact=element('div','flow-artifact');artifact.append(element('span','flow-artifact-label',visual.artifact.label),element('h3','',visual.artifact.title),element('p','',visual.artifact.body));
  const state=element('div','flow-state');state.append(element('i'),document.createTextNode(visual.artifact.status));root.append(nodes,artifact,state);return root;
}
function setStep(index,announce=false){
  index=Math.min(project.steps.length-1,Math.max(0,index));
  if(index===active)return;const previous=active;active=index;
  const step=project.steps[index],caption=`${pad(index+1)} / ${pad(project.steps.length)} — ${step.label.toUpperCase()}`;
  $('#step-title').replaceChildren(...step.heading.map(line=>element('span','',line)));
  $('[data-step-copy]').textContent=step.copy;
  $('[data-step-facts]').replaceChildren(...step.facts.map(fact=>element('li','',fact)));
  $('[data-step-number]').textContent=caption;$('[data-progress-caption]').textContent=caption;
  $('[data-visual-caption]').textContent=step.visual.caption;$('[data-visual-cue]').textContent=step.visual.cue;
  demo?.dispose();demo=null;
  const stage=$('[data-visual-stage]');stage.replaceChildren();stage.classList.toggle('has-demo',step.visual.type==='demo');
  if(step.visual.type==='demo')demo=(step.visual.engine==='surge'?mountSurgeDemo:mountStudyStepDemo)(stage,step,{reducedMotion:reduced.matches});else stage.append(visualFor(step.visual));
  motionButton.hidden=!demo;motionButton.disabled=reduced.matches;pauseDemo();
  screenshotButton.hidden=!step.visual.screenshot;
  buttons.forEach((button,i)=>{button.setAttribute('aria-pressed',String(i===index));if(i===index)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
  rememberStep();animateStep(previous,index);
  if(announce)$('[data-tour-announcement]').textContent=`${project.name}, step ${index+1} of ${project.steps.length}: ${step.heading.join(' ')}`;
}
function setProgress(value){
  progress=clamp(value);pin.style.setProperty('--tour-progress',progress);
  const bar=$('.progress-track');bar.setAttribute('aria-valuenow',String(Math.round(progress*100)));bar.setAttribute('aria-valuetext',`${Math.round(progress*100)} percent; step ${active+1} of ${project.steps.length}`);
}
function pinTop(){return parseFloat(getComputedStyle(pin).top)||0;}
function layout(){
  scrollDestination=null;
  manual=reduced.matches||innerHeight<720||(innerWidth<=700&&innerHeight<800);
  document.body.classList.toggle('category-manual',manual);
  $('[data-scroll-hint]').textContent=manual?'CHOOSE A STEP BELOW':coarsePointer.matches?'SCROLL TO EXPLORE ↓':'SCROLL ONE STEP ↓';wheelGate.reset();
  travel=project.steps.length>1?project.steps.length*Math.min(620,Math.max(320,innerHeight*.58)):0;
  tour.style.height=manual?'auto':`${pin.offsetHeight+travel}px`;
}
function paint(){
  pending=false;if(!project||mediaOpen)return;
  if(manual){setProgress(project.steps.length===1?1:Math.max(0,active)/(project.steps.length-1));return;}
  const p=travel?clamp((pinTop()-tour.getBoundingClientRect().top)/travel):1;
  // Keep the chosen panel steady while its scroll anchor glides into place.
  // Otherwise a smooth jump briefly replays each intermediate panel.
  if(scrollDestination){
    if(Math.abs(scrollY-scrollDestination.top)<1||performance.now()>=scrollDestination.until)scrollDestination=null;
    else{setProgress(p);return;}
  }
  setStep(Math.min(project.steps.length-1,Math.floor(p*project.steps.length)));setProgress(p);
}
function schedule(){if(!pending){pending=true;requestAnimationFrame(paint);}}
function updateUrl(index){const url=new URL(location.href);url.searchParams.set('project',project.id);url.hash=`step-${index+1}`;history.replaceState(null,'',url);}
function jump(index,{focus=false,updateHistory=true,viaWheel=false,smooth=true}={}){
  if(!viaWheel)wheelGate.reset();
  index=Math.min(project.steps.length-1,Math.max(0,index));
  setStep(index,true);
  if(manual)setProgress(project.steps.length===1?1:index/(project.steps.length-1));
  else {
    const p=project.steps.length===1?1:(index+.30)/project.steps.length;
    const top=Math.max(0,Math.min(document.documentElement.scrollHeight-innerHeight,scrollY+tour.getBoundingClientRect().top-pinTop()+travel*p));
    const animate=smooth&&!reduced.matches&&Math.abs(scrollY-top)>1;
    scrollDestination=animate?{top,until:performance.now()+1000}:null;
    scrollTo({top,behavior:animate?'smooth':'instant'});if(!animate)setProgress(p);schedule();
  }
  if(updateHistory)updateUrl(index);
  if(focus){buttons[index].focus({preventScroll:true});const button=buttons[index];controls.scrollTo({left:Math.max(0,button.offsetLeft-controls.offsetLeft-(controls.clientWidth-button.offsetWidth)/2),behavior:'instant'});}
}
function selectProject(next,{reset=true}={}){
  project=next;active=-1;progress=0;picker.value=project.id;
  $('[data-project-name]').textContent=project.name;$('[data-project-version]').textContent=project.version;
  $('[data-project-version]').title=`Walkthrough verified ${project.verifiedOn||'with the linked release'}`;
  $('[data-project-version]').textContent=`${project.version} · ${project.verifiedOn?.slice(0,7)||'RELEASE'}`;
  $('[data-latest-release]').href=`${project.source}/releases/latest`;
  $('[data-project-outcome]').textContent=project.outcome;$('[data-info-link]').href=project.info;$('[data-source-link]').href=project.source;
  const context=$('[data-project-context]');if(context)context.textContent=project.context||project.kind||'Software project';
  $('[data-visual-project]').textContent=`${project.name} / SOFTWARE WALKTHROUGH`;tour.setAttribute('aria-label',`${project.name} project walkthrough`);
  buttons=project.steps.map((step,index)=>{
    const button=element('button');button.type='button';button.append(element('b','',pad(index+1)),document.createTextNode(step.label));button.setAttribute('aria-label',`Step ${index+1} of ${project.steps.length}: ${step.label}`);button.setAttribute('aria-controls','step-title');
    button.addEventListener('click',()=>jump(index));
    button.addEventListener('keydown',event=>{let next;if(['ArrowRight','ArrowDown'].includes(event.key))next=Math.min(project.steps.length-1,index+1);else if(['ArrowLeft','ArrowUp'].includes(event.key))next=Math.max(0,index-1);else if(event.key==='Home')next=0;else if(event.key==='End')next=project.steps.length-1;if(next!==undefined){event.preventDefault();jump(next,{focus:true});}});
    return button;
  });
  controls.replaceChildren(...buttons);controls.scrollLeft=0;setStep(0);layout();
  // Prime the locally bundled frames so a scroll crossing can reveal the next one immediately.
  project.steps.forEach(step=>{const src=step.visual.screenshot||(step.visual.type==='image'&&step.visual.src);if(src){const image=new Image();image.src=src;}});
  if(reset){scrollTo({top:0,behavior:'instant'});updateUrl(0);}schedule();
}
function route(){
  const wanted=new URLSearchParams(location.search).get('project');
  const found=projects.find(item=>item.id===wanted)||projects[0];if(project!==found)selectProject(found,{reset:false});
  const match=location.hash.match(/^#step-(\d+)$/);if(match)jump(Number(match[1])-1,{updateHistory:false,smooth:false});
}
function nestedScroll(target,delta){
  for(let node=target instanceof Element?target:null;node&&node!==pin&&node!==document.body;node=node.parentElement){
    if(node.matches('input,textarea,select,[contenteditable=true],dialog'))return true;
    const style=getComputedStyle(node);if(/auto|scroll/.test(style.overflowY)&&node.scrollHeight>node.clientHeight+2&&((delta>0&&node.scrollTop+node.clientHeight<node.scrollHeight-2)||(delta<0&&node.scrollTop>1)))return true;
  }return false;
}
function onWheel(event){
  const delta=wheelPixels(event,innerHeight),rect=tour.getBoundingClientRect(),top=pinTop();
  const canEnter=delta>0&&rect.top>top&&rect.top-top<=Math.min(delta,120);
  const ownsScroll=project&&!manual&&!reduced.matches&&!coarsePointer.matches&&!mediaOpen&&event.cancelable&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&Math.abs(event.deltaX)<=Math.abs(event.deltaY)&&((rect.top<=top+3&&rect.bottom>=top+pin.offsetHeight-3)||canEnter)&&!nestedScroll(event.target,delta);
  if(ownsScroll&&canEnter){event.preventDefault();wheelGate.hold({time:performance.now(),direction:1});jump(Math.max(0,active),{viaWheel:true});return;}
  const decision=wheelGate.consume({delta,time:performance.now(),index:active,count:project?.steps.length||0,enabled:ownsScroll});
  if(!decision.capture){scrollDestination=null;return;}event.preventDefault();pin.style.setProperty('--step-intent',decision.intent);
  if(decision.next!==null)jump(decision.next,{viaWheel:true});
}
try{
  const response=await fetch('./project-catalog.json?v=019b20dc38f2');if(!response.ok)throw Error('Project catalog unavailable');
  const catalog=await response.json();projects=catalog.projects.filter(item=>item.category===categoryId);
  if(!projects.length||projects.some(item=>!Array.isArray(item.steps)||!item.steps.length))throw Error('Category has no project walkthrough');
  $('[data-category-description]').textContent=catalog.categories[categoryId].description;
  $('[data-project-count]').textContent=`${pad(projects.length)} PROJECT${projects.length===1?'':'S'}`;
  picker.replaceChildren(...projects.map(item=>{const option=element('option','',item.name);option.value=item.id;return option;}));
  picker.addEventListener('change',()=>selectProject(projects.find(item=>item.id===picker.value)));
  addBranchSwitch(catalog);route();document.body.classList.add('category-ready');
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('wheel',onWheel,{passive:false});
  const nativeInput=event=>{if(event.defaultPrevented)return;scrollDestination=null;wheelGate.reset();};
  addEventListener('touchstart',nativeInput,{passive:true});addEventListener('pointerdown',nativeInput,{passive:true});addEventListener('keydown',nativeInput);
  addEventListener('resize',()=>{if(mediaOpen)return;const rect=tour.getBoundingClientRect(),wasPinned=project&&!manual&&rect.top<=pinTop()+5&&rect.bottom>=pinTop()+pin.offsetHeight-5,previousProgress=progress;layout();if(wasPinned&&!manual)scrollTo({top:scrollY+tour.getBoundingClientRect().top-pinTop()+travel*previousProgress,behavior:'instant'});schedule();},{passive:true});
  reduced.addEventListener('change',()=>{motionButton.disabled=reduced.matches;if(reduced.matches){stepAnimations.forEach(animation=>animation.cancel());stepAnimations=[];}pauseDemo();layout();schedule();});addEventListener('hashchange',route);addEventListener('popstate',route);addEventListener('pageshow',()=>{branchNavigating=false;document.body.classList.remove('branch-leaving');layout();schedule();});
  document.fonts.ready.then(()=>{layout();schedule();});
}catch(error){
  document.body.classList.add('category-manual');controls.hidden=true;picker.disabled=true;
  const message=$('[data-category-message]');message.hidden=false;message.textContent='Explore the complete workflow in Project info.';
  $('[data-scroll-hint]').textContent='PROJECT INFO ↗';
  console.warn('Project walkthrough could not be initialized:',error.message);
}
