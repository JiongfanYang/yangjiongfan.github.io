// Shared behavior for full-prompt and paired-image galleries.
// Both images in a comparison are decoded before an atomic slide update.
export function createCarousel({root,panel,tabs,previous,next,progress,position,prepare,interval=8000}) {
  let index=0,request=0,frame=null,nextIndex=1;
  let running=false,pending=false;
  let remaining=interval,startedAt=0;
  const prepared=new Map();
  function load(target) {
    if(!prepared.has(target)){
      const promise=Promise.resolve().then(()=>prepare(tabs[target],target));
      prepared.set(target,promise);
      promise.catch(()=>{if(prepared.get(target)===promise)prepared.delete(target);});
    }
    return prepared.get(target);
  }
  function paint(left=remaining) {
    progress.style.transform=`scaleX(${Math.min(1,Math.max(0,1-left/interval))})`;
  }
  function tick(now) {
    if(!running)return;
    const left=Math.max(0,remaining-(now-startedAt));
    paint(left);
    if(left===0){
      running=false;frame=null;remaining=0;
      select(nextIndex,true);
    }else frame=requestAnimationFrame(tick);
  }

  function stopClock() {
    if(running)remaining=Math.max(0,remaining-(performance.now()-startedAt));
    running=false;cancelAnimationFrame(frame);frame=null;
  }
  function sync(reset=false) {
    stopClock();
    if(reset)remaining=interval;
    progress.style.transition='none';
    paint();
    if(pending)return;
    running=true;startedAt=performance.now();
    // Prepare the upcoming image(s) during the dwell, not at 100% progress.
    load(nextIndex).catch(()=>{});
    frame=requestAnimationFrame(tick);
  }
  async function select(rawIndex,automatic=false) {
    const requested=++request;
    pending=true;stopClock();
    if(!automatic)sync(true);
    const target=(rawIndex+tabs.length)%tabs.length;
    let commit;
    try {commit=await load(target);}
    catch {
      if(requested===request){
        pending=false;
        // Keep the current matched slide; try a different slide next cycle.
        nextIndex=(target+1)%tabs.length;
        sync(true);
      }
      return;
    }
    if(requested!==request)return;
    pending=false;
    commit();index=target;nextIndex=(index+1)%tabs.length;
    tabs.forEach((tab,i)=>{
      tab.setAttribute('aria-selected',String(i===index));
      tab.tabIndex=i===index?0:-1;
    });
    panel.setAttribute('aria-labelledby',tabs[index].id);
    position.textContent=`${String(index+1).padStart(2,'0')} / ${String(tabs.length).padStart(2,'0')}`;
    sync(true);
  }
  tabs.forEach((tab,i)=>tab.addEventListener('click',()=>select(i)));
  previous.addEventListener('click',()=>select(index-1));
  next.addEventListener('click',()=>select(index+1));
  sync();
  return {sync};
}
