const tabs=[...document.querySelectorAll('.step-tabs [role="tab"]')];
function select(index,focus=false){tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;document.getElementById(tab.getAttribute('aria-controls')).hidden=i!==index;});if(focus)tabs[index].focus();}
tabs.forEach((tab,index)=>{tab.addEventListener('click',()=>select(index));tab.addEventListener('keydown',e=>{let n;if(e.key==='ArrowRight')n=(index+1)%tabs.length;else if(e.key==='ArrowLeft')n=(index+tabs.length-1)%tabs.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=tabs.length-1;else return;e.preventDefault();select(n,true);});});
const video=document.getElementById('surge-video'),nav=document.getElementById('video-chapters'),pending=document.getElementById('video-pending');
const play=document.getElementById('play-toggle'),expand=document.getElementById('expand-video'),prev=document.getElementById('previous-step'),next=document.getElementById('next-step');
const progress=document.getElementById('step-progress');
let chapters=[],buttons=[],active=-1,pendingSeek=null;
const time=n=>`${Math.floor((n||0)/60)}:${String(Math.floor((n||0)%60)).padStart(2,'0')}`;
const local=s=>typeof s==='string'&&!/^(?:[a-z]+:|\/|\\)/i.test(s)&&!s.split(/[\\/]/).includes('..');
function mediaUrl(path) {
 const url = new URL(path, document.baseURI);
 const release = document.querySelector('meta[name="portfolio-release"]')?.content;
 if (release) url.searchParams.set('v', release);
 return url.href;
}
function update(){
 document.getElementById('video-clock').textContent=`${time(video.currentTime)} / ${time(video.duration)}`;
 progress.max=Number.isFinite(video.duration)?video.duration:112;progress.value=video.currentTime;
 if(!chapters.length)return;
 let index=0;chapters.forEach((c,i)=>{if(video.currentTime>=c.start)index=i;});
 if(active===index)return;active=index;const c=chapters[index];
 buttons.forEach((b,i)=>b.setAttribute('aria-current',i===index?'step':'false'));
 document.getElementById('step-count').textContent=`${String(index+1).padStart(2,'0')} / ${String(chapters.length).padStart(2,'0')}`;
 document.getElementById('chapter-title').textContent=c.title;
 document.getElementById('chapter-copy').textContent=c.copy;
 document.getElementById('chapter-facts').replaceChildren(...(c.facts||[]).map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
 prev.disabled=index===0;next.disabled=index===chapters.length-1;
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.getElementById('chapter-content').animate([{opacity:.35,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:180,easing:'ease-out'});
}
function seek(index){if(!chapters[index])return;if(video.readyState<1){pendingSeek=index;return;}video.currentTime=chapters[index].start;update();}
prev.addEventListener('click',()=>seek(active-1));next.addEventListener('click',()=>seek(active+1));
play.addEventListener('click',async()=>{try{if(video.paused){if(video.ended)video.currentTime=0;await video.play();}else video.pause();}catch{pending.hidden=false;pending.textContent='Use the video controls to start playback.';}});
const viewer=document.querySelector('.video-column');
const close=document.createElement('button');close.type='button';close.className='close-viewer';close.textContent='Close ×';close.hidden=true;viewer.prepend(close);
const background=[document.querySelector('header'),nav,document.querySelector('.chapter-panel'),...document.querySelectorAll('.takeaway,.sources,.historical,footer')];
let viewerOpen=false,oldOverflow='',viewerScroll={top:0,left:0};
function closeViewer(){if(!viewerOpen)return;viewerOpen=false;viewer.classList.remove('is-enlarged');viewer.removeAttribute('role');viewer.removeAttribute('aria-modal');close.hidden=true;document.body.style.overflow=oldOverflow;background.forEach(el=>el.inert=false);expand.focus({preventScroll:true});scrollTo({...viewerScroll,behavior:'instant'});}
expand.addEventListener('click',()=>{viewerOpen=true;viewerScroll={top:scrollY,left:scrollX};oldOverflow=document.body.style.overflow;viewer.classList.add('is-enlarged');viewer.setAttribute('role','dialog');viewer.setAttribute('aria-modal','true');viewer.setAttribute('aria-label','Enlarged walkthrough');close.hidden=false;document.body.style.overflow='hidden';background.forEach(el=>el.inert=true);close.focus({preventScroll:true});});
close.addEventListener('click',closeViewer);
addEventListener('keydown',e=>{if(!viewerOpen)return;if(e.key==='Escape'){e.preventDefault();closeViewer();}else if(e.key==='Tab'){const focusable=[...viewer.querySelectorAll('button:not([disabled]),video')].filter(el=>!el.hidden&&getComputedStyle(el).display!=='none');const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
function playback(){play.textContent=video.ended?'Replay walkthrough':video.paused?'Play walkthrough':'Pause';}
['play','pause','ended'].forEach(e=>video.addEventListener(e,playback));
['timeupdate','seeked','durationchange'].forEach(e=>video.addEventListener(e,update));
video.addEventListener('loadedmetadata',()=>{pending.hidden=true;play.disabled=false;expand.disabled=false;if(pendingSeek!==null){seek(pendingSeek);pendingSeek=null;}update();});
video.addEventListener('error',()=>{pending.hidden=false;pending.textContent='Video unavailable. You can still read the report below.';play.disabled=true;expand.disabled=true;});
fetch('./chapters.json?v=5f3716b4ad2c',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(config=>{
 if(!local(config.video)||!Array.isArray(config.chapters)||!config.chapters.length)throw Error();
 let last=-1;config.chapters.forEach(c=>{if(!Number.isFinite(c.start)||c.start<=last||typeof c.title!=='string'||typeof c.copy!=='string')throw Error();last=c.start;});
 if(config.chapters[0].start!==0)throw Error();chapters=config.chapters;
 buttons=chapters.map((c,i)=>{const b=document.createElement('button');b.type='button';const num=document.createElement('span');num.textContent=String(i+1).padStart(2,'0');b.append(num,document.createTextNode(c.label||c.title));b.setAttribute('aria-label',`${c.label||c.title}, ${time(c.start)}`);b.addEventListener('click',()=>seek(i));b.addEventListener('keydown',e=>{const n=e.key==='ArrowRight'?(i+1)%buttons.length:e.key==='ArrowLeft'?(i+buttons.length-1)%buttons.length:null;if(n!==null){e.preventDefault();buttons[n].focus();seek(n);}});return b;});nav.replaceChildren(...buttons);
 if(local(config.poster))video.poster=mediaUrl(config.poster);
 // Descriptions are optional; the default view explains the footage alongside it.
 if(local(config.captions)){const track=document.createElement('track');track.kind='captions';track.label='Descriptions';track.srclang='en';track.src=mediaUrl(config.captions);video.append(track);}
 video.src=mediaUrl(config.video);video.load();update();
}).catch(()=>{pending.hidden=false;pending.textContent='Walkthrough unavailable. Read the investigation report below.';});
