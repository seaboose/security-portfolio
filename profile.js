// Each tab group owns its own panels; adding career sections does not change
// the course-outline index or the keyboard behavior of the nested role lenses.
function createTabs(selector){
  const tabs=[...document.querySelectorAll(`${selector} > [role=tab]`)];
  function select(index,focus=false){
    if(!tabs[index])return;
    tabs.forEach((tab,i)=>{
      tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;
      const panel=document.getElementById(tab.getAttribute('aria-controls'));
      if(panel)panel.hidden=i!==index;
    });
    if(focus)tabs[index].focus({preventScroll:true});
  }
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>select(index));
    tab.addEventListener('keydown',event=>{
      let next;
      if(event.key==='ArrowRight')next=(index+1)%tabs.length;
      else if(event.key==='ArrowLeft')next=(index-1+tabs.length)%tabs.length;
      else if(event.key==='Home')next=0;
      else if(event.key==='End')next=tabs.length-1;
      if(next!==undefined){event.preventDefault();select(next,true);}
    });
  });
  return {open(id,focus=false){select(tabs.findIndex(tab=>tab.getAttribute('aria-controls')===id),focus);}};
}
const profileTabs=createTabs('.profile-tabs');
const careerTabs=createTabs('.career-lenses');
for(const [selector,panel] of [['[data-open-courses]','course-panel'],['[data-open-experience]','experience-panel']]){
  document.querySelectorAll(selector).forEach(link=>link.addEventListener('click',event=>{event.preventDefault();profileTabs.open(panel,true);}));
}
function openProfileHash(){
  const id=location.hash.slice(1);
  if(['profile-panel','experience-panel','course-panel'].includes(id))profileTabs.open(id);
  if(['engineering-evidence','operations-evidence','assurance-evidence'].includes(id)){profileTabs.open('profile-panel');careerTabs.open(id);}
}
openProfileHash();
addEventListener('hashchange',openProfileHash);
const list=document.querySelector('[data-course-list]'),nav=document.querySelector('[data-course-nav]');
function el(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}
if(list)fetch('./course-catalog.json?v=1de39eabb239').then(r=>{if(!r.ok)throw Error('Course catalog unavailable');return r.json();}).then(data=>{
  document.querySelector('.course-standing-date').textContent='STANDING UPDATED / '+new Date(data.updated+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',year:'numeric',timeZone:'UTC'}).toUpperCase();
  const statuses={'in-progress':'In progress',completed:'Completed',planned:'Planned'},courses=data.terms.flatMap(term=>term.courses),counts=Object.keys(statuses).map(key=>[key,courses.filter(c=>c.status===key).length]);
  document.querySelector('[data-course-summary]').textContent=counts.filter(([,n])=>n).map(([key,n])=>`${n} ${statuses[key].toLowerCase()}`).join(' · ');
  const groups=data.terms.map((term,index)=>{
    const group=el('section','course-term'),heading=el('h3','',`${term.year} / ${term.label}`);group.id=`courses-${term.id}`;group.append(heading);
    term.courses.forEach(course=>{const item=el('article','course-card');item.dataset.status=course.status;const top=el('div','course-card-top');top.append(el('span','',course.code),el('span','course-status',statuses[course.status]||course.status));item.append(top,el('h4','',course.title),el('span','course-units',`${course.units} UNITS`));group.append(item);});
    const button=el('button','',term.label);button.type='button';button.setAttribute('aria-controls',group.id);button.setAttribute('aria-pressed',String(index===0));button.addEventListener('click',()=>list.scrollTo({top:group.offsetTop-list.firstElementChild.offsetTop,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'}));nav.append(button);return group;
  });list.replaceChildren(...groups);
  list.addEventListener('scroll',()=>{let active=0;groups.forEach((group,index)=>{if(group.offsetTop-groups[0].offsetTop<=list.scrollTop+80)active=index;});if(list.scrollTop+list.clientHeight>=list.scrollHeight-2)active=groups.length-1;[...nav.children].forEach((button,index)=>button.setAttribute('aria-pressed',String(index===active)));},{passive:true});
}).catch(()=>{list.append(el('p','','Course details are available in the official curriculum.'));});
