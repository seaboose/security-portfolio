// Wheel-only intent gate. Callers decide whether their pinned scene owns a wheel.
// Touch, keys, nested scrolling and document boundaries remain native.
export function createWheelStepGate({threshold=90,quietMs=170,dwellMs=480,maxGestureMs=1100}={}){
  let last=-Infinity,start=0,direction=0,amount=0,advanced=false,holdUntil=0;
  const free={capture:false,next:null,intent:0};
  function reset(){last=-Infinity;start=0;direction=0;amount=0;advanced=false;holdUntil=0;}
  function hold({time,direction:nextDirection=1}){last=time;start=time;direction=Math.sign(nextDirection)||1;amount=threshold;advanced=true;holdUntil=time+dwellMs;}
  function consume({delta,time,index,count,enabled=true}){
    if(!enabled||!Number.isFinite(delta)||!delta||count<2){reset();return free;}
    const dir=Math.sign(delta),quiet=time-last>quietMs,newGesture=quiet||dir!==direction||time-start>=maxGestureMs;
    if(advanced&&time<holdUntil&&dir===direction){last=time;return{capture:true,next:null,intent:1};}
    if(newGesture){start=time;amount=0;advanced=false;direction=dir;}
    last=time;
    const boundary=(dir<0&&index<=0)||(dir>0&&index>=count-1);
    if(boundary&&(!advanced||time>=holdUntil)){reset();return free;}
    if(advanced)return{capture:true,next:null,intent:1};
    amount+=Math.abs(delta);
    if(amount<threshold)return{capture:true,next:null,intent:Math.min(1,amount/threshold)};
    advanced=true;holdUntil=time+dwellMs;
    return{capture:true,next:Math.max(0,Math.min(count-1,index+dir)),intent:1};
  }
  return{consume,reset,hold};
}

export function wheelPixels(event,viewportHeight){
  return event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?viewportHeight:1);
}
