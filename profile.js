const tabs=[...document.querySelectorAll('.profile-tabs [role=tab]')];
function selectProfile(index,focus=false){tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;document.getElementById(tab.getAttribute('aria-controls')).hidden=i!==index;});if(focus)tabs[index].focus({preventScroll:true});}
tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>selectProfile(i));tab.addEventListener('keydown',event=>{let next;if(['ArrowRight','ArrowLeft'].includes(event.key))next=1-i;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;if(next!==undefined){event.preventDefault();selectProfile(next,true);}});});
document.querySelector('[data-open-courses]')?.addEventListener('click',event=>{event.preventDefault();selectProfile(1,true);});
if(location.hash==='#course-panel')selectProfile(1);
const list=document.querySelector('[data-course-list]'),nav=document.querySelector('[data-course-nav]');
function el(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}
if(list)fetch('./course-catalog.json').then(r=>{if(!r.ok)throw Error('Course catalog unavailable');return r.json();}).then(data=>{
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
