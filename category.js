import {openScreenshot} from './media-viewer.js?v=1de39eabb239';
import {mountSurgeDemo} from './surge-demo.js?v=1de39eabb239';
import {mountStudyStepDemo} from './studystep-demo.js?v=1de39eabb239';
import {createWheelStepGate,wheelPixels} from './scroll-step-gate.js?v=1de39eabb239';
const $=selector=>document.querySelector(selector);
const categoryId=document.body.dataset.category;
const picker=$('#project-picker');
const reduced=matchMedia('(prefers-reduced-motion:reduce)');
const coarsePointer=matchMedia('(pointer:coarse)');
const wheelGate=createWheelStepGate();
const clamp=value=>Math.min(1,Math.max(0,value));
const pad=value=>String(value).padStart(2,'0');
let tours=[],current=null,pending=false,manual=false,mediaOpen=false,branchNavigating=false;
let destination=null;
function element(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}
function addBranchSwitch(catalog){
  const other=categoryId==='act'?'learn':'act',entries=catalog.projects.filter(item=>item.category===other);if(!entries.length)return;
  const link=[...document.querySelectorAll('.category-header nav a')].find(item=>new URL(item.href,location.href).pathname.endsWith(`/${other}.html`));if(!link)return;
  link.classList.add('branch-switch');link.replaceChildren(element('span','','ALSO EXPLORE'),element('strong','',other.toUpperCase()),element('i','','↗'));link.setAttribute('aria-label',`Explore ${other.toUpperCase()} projects`);
  function destination(){let saved;try{saved=JSON.parse(sessionStorage.getItem(`portfolio:branch:${other}`)||'null');}catch{}const found=entries.find(item=>item.id===saved?.project);link.href=found?`${other}.html?project=${encodeURIComponent(found.id)}#step-${Math.max(0,Math.min(found.steps.length-1,Math.trunc(Number(saved.step)||0)))+1}`:`${other}.html`;}
  destination();link.addEventListener('pointerenter',destination);link.addEventListener('focus',destination);
  link.addEventListener('click',event=>{if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;destination();if(reduced.matches)return;event.preventDefault();if(branchNavigating)return;branchNavigating=true;document.body.classList.add('branch-leaving');setTimeout(()=>location.assign(link.href),140);});
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
function stepUrl(tour,index){
  const url=new URL(location.href);
  url.searchParams.set('project',tour.project.id);
  url.hash='step-'+(index+1);
  return url;
}
function remember(tour){
  try{sessionStorage.setItem('portfolio:branch:'+categoryId,JSON.stringify({project:tour.project.id,step:tour.active}));}catch{}
}
function select(tour){
  current=tour;
  picker.value=tour.project.id;
  remember(tour);
}
function mountTour(section,project){
  const find=selector=>section.querySelector(selector);
  const pin=find('.tour-pin'), title=find('.tour-copy h2'), controls=find('.step-controls');
  const stage=find('[data-visual-stage]'), motion=find('[data-motion-toggle]'), screenshot=find('[data-open-screenshot]');
  const hint=find('[data-scroll-hint]'), bar=find('.progress-track'), buttons=[...controls.querySelectorAll('button')];
  const advance=element('a','project-bridge');
  advance.hidden=true;
  hint.after(advance);
  let demo=null, paused=false, inView=false, animations=[];
  const state={project,section,pin,buttons,active:-1,travel:0,progress:0,show,paintProgress,syncPlayback,layout};
  function syncPlayback(){
    motion.disabled=reduced.matches;
    demo?.pause(paused||reduced.matches||!inView||document.hidden||mediaOpen);
    if(reduced.matches||paused){animations.forEach(animation=>animation.cancel());animations=[];}
  }
  function layout(){
    state.travel=manual?0:project.steps.length*Math.min(620,Math.max(320,innerHeight*.58));
    section.style.height=manual?'auto':(pin.offsetHeight+state.travel)+'px';
    hint.textContent=manual?'CHOOSE A STEP BELOW':coarsePointer.matches?'SCROLL TO EXPLORE ↓':'SCROLL ONE STEP ↓';
  }
  function show(index,announce=false){
    if(state.active===index)return;
    const previous=state.active;
    state.active=index;
    const step=project.steps[index], visual=step.visual;
    const caption=pad(index+1)+' / '+pad(project.steps.length)+' — '+step.label.toUpperCase();
    title.replaceChildren(...step.heading.map(line=>element('span','',line)));
    find('[data-step-copy]').textContent=step.copy;
    find('[data-step-facts]').replaceChildren(...step.facts.map(fact=>element('li','',fact)));
    find('[data-step-number]').textContent=caption;
    find('[data-progress-caption]').textContent=caption;
    find('[data-visual-caption]').textContent=visual.caption;
    find('[data-visual-cue]').textContent=visual.cue;
    demo?.dispose();demo=null;
    stage.replaceChildren();
    stage.classList.toggle('has-demo',visual.type==='demo');
    if(visual.type==='demo'){
      const mount=visual.engine==='studystep'?mountStudyStepDemo:mountSurgeDemo;
      demo=mount(stage,step,{reducedMotion:reduced.matches});
    }else{stage.append(visualFor(visual));}
    motion.hidden=!demo;screenshot.hidden=!visual.screenshot;syncPlayback();
    buttons.forEach((button,i)=>{
      button.setAttribute('aria-pressed',String(i===index));
      if(i===index)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');
    });
    const projectIndex=tours.indexOf(state);
    const next=index===project.steps.length-1?tours[projectIndex+1]:null;
    const prior=index===0?tours[projectIndex-1]:null;
    const adjacent=next||prior;
    advance.hidden=!adjacent;
    hint.hidden=!!adjacent;
    if(adjacent){
      const stepIndex=next?0:prior.buttons.length-1;
      advance.href=stepUrl(adjacent,stepIndex);
      advance.textContent=next?'NEXT · '+next.project.name+' ↓':'↑ '+prior.project.name;
    }
    animations.forEach(animation=>animation.cancel());animations=[];
    if(previous>=0&&!reduced.matches&&!paused){
      const offset=index>=previous?9:-9;
      for(const node of [title,find('[data-step-copy]'),find('[data-step-facts]'),stage]){
        animations.push(node.animate([{opacity:.25,transform:'translateY('+offset+'px)'},{opacity:1,transform:'translateY(0)'}],{duration:300,easing:'cubic-bezier(.22,.7,.25,1)'}));
      }
    }
    if(current===state)remember(state);
    if(announce)$('[data-tour-announcement]').textContent=project.name+', step '+(index+1)+' of '+project.steps.length+': '+step.heading.join(' ');
  }
  function paintProgress(value){
    state.progress=clamp(value);
    const percent=Math.round(state.progress*100);
    pin.style.setProperty('--tour-progress',state.progress);
    bar.setAttribute('aria-valuenow',String(percent));
    bar.setAttribute('aria-valuetext',percent+' percent; step '+(state.active+1)+' of '+project.steps.length);
  }
  motion.addEventListener('click',()=>{
    paused=!paused;motion.setAttribute('aria-pressed',String(paused));
    motion.textContent=paused?'PLAY MOTION':'PAUSE MOTION';syncPlayback();
  });
  screenshot.addEventListener('click',()=>{
    const visual=project.steps[state.active].visual;
    openScreenshot({src:visual.screenshot,alt:visual.screenshotAlt||visual.alt||project.name,caption:project.name+' '+(project.previewVersion||project.version)+' · Recorded application screen'},screenshot);
  });
  advance.addEventListener('click',event=>{
    if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    event.preventDefault();
    const url=new URL(advance.href);
    jump(tours.find(item=>item.project.id===url.searchParams.get('project')),Number(url.hash.slice(6))-1,{focus:true});
  });
  buttons.forEach((button,i)=>{
    button.addEventListener('click',()=>jump(state,i));
    button.addEventListener('keydown',event=>{
      const forward=['ArrowRight','ArrowDown'].includes(event.key);
      const backward=['ArrowLeft','ArrowUp'].includes(event.key);
      if(!forward&&!backward&&!['Home','End'].includes(event.key))return;
      event.preventDefault();
      const index=event.key==='Home'?0:event.key==='End'?buttons.length-1:i+(forward?1:-1);
      const target=index>=buttons.length?tours[tours.indexOf(state)+1]:index<0?tours[tours.indexOf(state)-1]:state;
      if(target)jump(target,index<0?target.buttons.length-1:index>=buttons.length?0:index,{focus:true});
    });
  });
  new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;syncPlayback();},{threshold:.05}).observe(pin);
  return state;
}
function pinTop(tour){return parseFloat(getComputedStyle(tour.pin).top)||0;}
function sectionTop(tour){return scrollY+tour.section.getBoundingClientRect().top;}
function layout(){
  manual=reduced.matches||innerHeight<720||(innerWidth<=700&&innerHeight<800);
  document.body.classList.toggle('category-manual',manual);
  tours.forEach(tour=>tour.layout());
}
function paint(){
  pending=false;
  if(!tours.length||mediaOpen)return;
  if(destination){
    if(Math.abs(scrollY-destination.top)>1&&performance.now()<destination.until)return;
    destination=null;
  }
  let visible=tours[0];
  for(const tour of tours){
    const rect=tour.section.getBoundingClientRect();
    const top=pinTop(tour);
    if(rect.top<=Math.max(top,innerHeight*.25))visible=tour;
    if(manual){
      tour.paintProgress(tour.project.steps.length===1?1:tour.active/(tour.project.steps.length-1));
    }else if(rect.bottom>=0&&rect.top<=innerHeight){
      const fraction=clamp((top-rect.top)/tour.travel);
      tour.show(Math.min(tour.buttons.length-1,Math.floor(fraction*tour.buttons.length)));
      tour.paintProgress(fraction);
    }
  }
  if(visible!==current)select(visible);
}
function schedule(){if(!pending){pending=true;requestAnimationFrame(paint);}}
function jump(tour,index,{focus=false,historyUpdate=true,viaWheel=false,smooth=true}={}){
  if(!viaWheel)wheelGate.reset();
  index=Math.min(tour.buttons.length-1,Math.max(0,index));
  const changing=current!==tour;
  select(tour);tour.show(index,true);
  const fraction=(index+.30)/tour.buttons.length;
  const manualTop=document.querySelector('.category-header').getBoundingClientRect().bottom+10;
  if(!manual||changing||tour.pin.getBoundingClientRect().bottom<=manualTop||tour.pin.getBoundingClientRect().top>=innerHeight){
    const target=manual?sectionTop(tour)-manualTop:sectionTop(tour)-pinTop(tour)+tour.travel*fraction;
    const top=Math.max(0,Math.min(document.documentElement.scrollHeight-innerHeight,target));
    const animate=smooth&&!reduced.matches&&Math.abs(scrollY-top)>1;
    destination=animate?{top,until:performance.now()+1200}:null;
    scrollTo({top,behavior:animate?'smooth':'instant'});
  }
  tour.paintProgress(manual?(tour.buttons.length===1?1:index/(tour.buttons.length-1)):fraction);
  if(historyUpdate)history.replaceState(null,'',stepUrl(tour,index));
  if(focus){
    const button=tour.buttons[index], rail=button.parentElement;
    button.focus({preventScroll:true});
    rail.scrollTo({left:Math.max(0,button.offsetLeft-rail.offsetLeft-(rail.clientWidth-button.offsetWidth)/2),behavior:'instant'});
  }
  schedule();
}
function route(){
  const hash=location.hash, match=hash.match(/^#step-(\d+)$/);
  if(hash&&!match){
    const anchor=document.getElementById(hash.slice(1));
    if(anchor){
      if(anchor.matches('details'))anchor.open=true;
      for(let parent=anchor.parentElement?.closest('details');parent;parent=parent.parentElement?.closest('details'))parent.open=true;
      anchor.scrollIntoView({block:'start',behavior:'instant'});
    }
    return;
  }
  const id=new URLSearchParams(location.search).get('project');
  const tour=tours.find(item=>item.project.id===id)||tours[0];
  if(match||tour!==tours[0])jump(tour,match?Number(match[1])-1:0,{historyUpdate:false,smooth:false});
}
function nestedScroll(target,delta,pin){
  for(let node=target instanceof Element?target:null;node&&node!==pin&&node!==document.body;node=node.parentElement){
    if(node.matches('input,textarea,select,[contenteditable=true],dialog'))return true;
    const style=getComputedStyle(node);if(/auto|scroll/.test(style.overflowY)&&node.scrollHeight>node.clientHeight+2&&((delta>0&&node.scrollTop+node.clientHeight<node.scrollHeight-2)||(delta<0&&node.scrollTop>1)))return true;
  }return false;
}
function onWheel(event){
  if(manual||coarsePointer.matches||mediaOpen||!event.cancelable||event.ctrlKey||event.metaKey||event.shiftKey||Math.abs(event.deltaX)>Math.abs(event.deltaY))return;
  const delta=wheelPixels(event,innerHeight);
  const tour=tours.find(item=>{
    const rect=item.section.getBoundingClientRect(), top=pinTop(item);
    return (rect.top<=top+3&&rect.bottom>=top+item.pin.offsetHeight-3)||(delta>0&&rect.top>top&&rect.top-top<=Math.min(delta,120));
  });
  if(!tour||nestedScroll(event.target,delta,tour.pin)){wheelGate.reset();destination=null;return;}
  if(tour.section.getBoundingClientRect().top>pinTop(tour)+3){
    event.preventDefault();wheelGate.hold({time:performance.now(),direction:1});jump(tour,0,{viaWheel:true});return;
  }
  const decision=wheelGate.consume({delta,time:performance.now(),index:tour.active,count:tour.buttons.length,enabled:true});
  if(!decision.capture){destination=null;return;}
  event.preventDefault();tour.pin.style.setProperty('--step-intent',decision.intent);
  if(decision.next!==null)jump(tour,decision.next,{viaWheel:true});
}
try{
  const response=await fetch('./project-catalog.json?v=1de39eabb239');if(!response.ok)throw Error('Project catalog unavailable');
  const catalog=await response.json();
  const projects=catalog.projects.filter(item=>item.category===categoryId);
  tours=projects.map(project=>{
    const section=document.querySelector('[data-tour-project="'+project.id+'"]');
    if(!section||!project.steps.length)throw Error('Missing project walkthrough');
    return mountTour(section,project);
  });
  if(!tours.length)throw Error('No project walkthroughs');
  tours.forEach(tour=>tour.show(0));
  select(tours[0]);layout();route();
  picker.addEventListener('change',()=>{const tour=tours.find(item=>item.project.id===picker.value);jump(tour,0,{focus:true,smooth:false});});
  addBranchSwitch(catalog);document.body.classList.add('category-ready');schedule();
  addEventListener('scroll',schedule,{passive:true});addEventListener('wheel',onWheel,{passive:false});
  const cancel=event=>{if(!event.defaultPrevented){destination=null;wheelGate.reset();}};
  addEventListener('pointerdown',cancel,{passive:true});addEventListener('touchstart',cancel,{passive:true});addEventListener('keydown',cancel);
  addEventListener('portfolio:media',event=>{mediaOpen=event.detail.open;destination=null;wheelGate.reset();tours.forEach(tour=>tour.syncPlayback());schedule();});
  document.addEventListener('visibilitychange',()=>tours.forEach(tour=>tour.syncPlayback()));
  addEventListener('resize',()=>{
    if(mediaOpen)return;
    const rect=current.section.getBoundingClientRect(), previous=current.progress;
    const wasPinned=!manual&&rect.top<=pinTop(current)+4&&rect.bottom>=pinTop(current)+current.pin.offsetHeight-4;
    destination=null;layout();
    if(wasPinned&&!manual)scrollTo({top:sectionTop(current)-pinTop(current)+current.travel*previous,behavior:'instant'});
    schedule();
  },{passive:true});
  reduced.addEventListener('change',()=>{
    const rect=current.pin.getBoundingClientRect();
    const keep=rect.bottom>0&&rect.top<innerHeight;
    destination=null;layout();tours.forEach(tour=>tour.syncPlayback());
    if(keep){if(!manual)jump(current,current.active,{historyUpdate:false,smooth:false});else current.section.scrollIntoView({behavior:'instant'});}
    schedule();
  });
  addEventListener('hashchange',route);addEventListener('popstate',route);
  addEventListener('pageshow',()=>{branchNavigating=false;document.body.classList.remove('branch-leaving');layout();schedule();});
  document.fonts.ready.then(()=>{layout();schedule();});
}catch(error){
  document.body.classList.add('category-manual');picker.disabled=true;
  document.querySelectorAll('.step-controls,[data-motion-toggle],[data-open-screenshot]').forEach(control=>control.hidden=true);
  const message=$('[data-category-message]');message.hidden=false;message.textContent='Explore the workflows in Project info.';
  console.warn('Project walkthrough could not be initialized:',error.message);
}
