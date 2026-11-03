let viewer, returnFocus, savedY=0, previousOverflow='';
function ensureViewer(){
  if(viewer)return viewer;
  viewer=document.createElement('dialog');viewer.className='media-viewer';viewer.setAttribute('aria-label','Enlarged project screenshot');
  viewer.innerHTML='<div class="media-toolbar"><span>APPLICATION SCREENSHOT</span><button type="button" autofocus aria-label="Close enlarged screenshot">CLOSE <b aria-hidden="true">×</b></button></div><figure><img alt=""><figcaption></figcaption></figure><p class="media-help">ESC TO CLOSE · RETURN TO YOUR PLACE</p>';
  document.body.append(viewer);
  viewer.querySelector('button').addEventListener('click',()=>viewer.close());
  viewer.addEventListener('click',event=>{if(event.target===viewer)viewer.close();});
  viewer.addEventListener('close',()=>{
    document.documentElement.style.overflow=previousOverflow;document.documentElement.classList.remove('media-open');
    scrollTo({top:savedY,behavior:'instant'});returnFocus?.focus({preventScroll:true});
    dispatchEvent(new CustomEvent('portfolio:media',{detail:{open:false}}));
  });
  return viewer;
}
export function openScreenshot({src,alt='',caption=''},trigger=document.activeElement){
  const dialog=ensureViewer();if(dialog.open)return;
  savedY=scrollY;returnFocus=trigger;previousOverflow=document.documentElement.style.overflow;
  dialog.querySelector('img').src=src;dialog.querySelector('img').alt=alt;dialog.querySelector('figcaption').textContent=caption||alt;
  document.documentElement.classList.add('media-open');document.documentElement.style.overflow='hidden';
  dispatchEvent(new CustomEvent('portfolio:media',{detail:{open:true}}));dialog.showModal();
}
document.addEventListener('click',event=>{
  const trigger=event.target.closest('[data-enlarge]');if(!trigger)return;
  const image=trigger.querySelector('img');const src=trigger.dataset.enlarge||image?.currentSrc;if(!src)return;
  event.preventDefault();openScreenshot({src,alt:trigger.dataset.alt||image?.alt,caption:trigger.dataset.caption},trigger);
});
// Case-study frames keep their own step controller; enlargement uses the current image.
document.querySelectorAll('img[data-step-image],.study-app-shot img').forEach(image=>{
  if(image.closest('[data-enlarge]'))return;
  const button=document.createElement('button');button.type='button';button.className='screenshot-enlarge';button.dataset.enlarge='';button.setAttribute('aria-label','Enlarge application screenshot');
  image.replaceWith(button);button.append(image);const cue=document.createElement('span');cue.className='enlarge-hint';cue.textContent='ENLARGE ↗';button.append(cue);
});
