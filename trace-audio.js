// Short, locally synthesized cues. No files, requests, playback loops, or persisted opt-in.
export function createTraceAudio(button,status){
  let context=null,master=null,enabled=false,last=0,busy=false,enableVersion=0;
  const active=new Set(),played=new Set();
  const cues=[
    {at:.145,notes:[[880,520,.07,0,'triangle']]},
    {at:.35,notes:[[420,720,.13,0,'sine']]},
    {at:.44,notes:[[260,390,.17,0,'sine']]},
    {at:.69,notes:[[740,660,.12,0,'sine'],[740,580,.14,.17,'sine']]},
    {at:.78,notes:[[570,850,.10,0,'sine']]},
    {at:.94,notes:[[520,520,.16,0,'sine'],[780,780,.19,.07,'sine']]}
  ];
  function show(message=''){
    button.setAttribute('aria-pressed',String(enabled));
    button.querySelector('span').textContent=enabled?'SOUND ON':'SOUND OFF';
    if(message)status.textContent=message;
  }
  function stop(){
    for(const oscillator of active){try{oscillator.stop();}catch{}oscillator.disconnect();}
    active.clear();
  }
  function notes(sequence){
    if(!enabled||document.hidden||context?.state!=='running')return;
    for(const [from,to,duration,delay,wave] of sequence){
      const oscillator=context.createOscillator(),gain=context.createGain(),start=context.currentTime+delay;
      oscillator.type=wave;oscillator.frequency.setValueAtTime(from,start);oscillator.frequency.exponentialRampToValueAtTime(to,start+duration);
      gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.15,start+.012);gain.gain.exponentialRampToValueAtTime(.001,start+duration);
      oscillator.connect(gain);gain.connect(master);active.add(oscillator);
      oscillator.onended=()=>{active.delete(oscillator);oscillator.disconnect();gain.disconnect();};
      oscillator.start(start);oscillator.stop(start+duration+.015);
    }
  }
  function disable(message='Sound effects off.'){
    enableVersion++;enabled=false;stop();if(master)master.gain.setValueAtTime(0,context.currentTime);show(message);
    if(context?.state==='running')context.suspend().catch(()=>{});
  }
  button.addEventListener('click',async()=>{
    if(busy)return;
    if(enabled){disable('Sound effects off.');return;}
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio){show('Sound effects are unavailable in this browser.');return;}
    busy=true;button.disabled=true;const requestVersion=++enableVersion;
    try{
      if(!context||context.state==='closed'){context=new Audio();master=context.createGain();master.gain.value=0;master.connect(context.destination);}
      await context.resume();
      if(requestVersion!==enableVersion)return;
      if(document.hidden||context.state!=='running'){show('Sound effects remain off.');return;}
      enabled=true;master.gain.setValueAtTime(.16,context.currentTime);show('Sound effects on.');notes([[660,880,.10,0,'sine']]);
    }catch{enabled=false;stop();show('Sound effects are unavailable in this browser.');}
    finally{busy=false;button.disabled=false;}
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  window.addEventListener('pagehide',()=>disable());
  show();
  return {
    update(progress,{silent=false}={}){
      const previous=last;last=progress;
      if(progress<previous){stop();for(const cue of cues)if(progress<cue.at-.025)played.delete(cue);return;}
      const crossed=cues.filter(cue=>previous<cue.at&&progress>=cue.at&&!played.has(cue));
      crossed.forEach(cue=>played.add(cue));
      // Fast skips produce no burst of queued sounds. Only the latest nearby milestone speaks.
      if(!silent&&progress-previous<.09&&crossed.length)notes(crossed.at(-1).notes);
    },
    reset(){stop();played.clear();last=0;},
    stop
  };
}
