'use strict';
(() => {
  function parseToast(text) {
    const food=/^(?:混入.+?色\s*·\s*體型|Mixed .+?\s*·\s*Size)\s*\+(\d+\.\d)$/i.exec(text);
    if(food)return {kind:'food',displayedGain:Number(food[1])};
    const npc=/^(?:吞下.+?\s*·\s*消化耗損\s*\d+%\s*·\s*體型|Ate .+?\s*·\s*Digestion loss\s*\d+%\s*·\s*Size)\s*\+(\d+\.\d)$/i.exec(text);
    return npc ? {kind:'npc',displayedGain:Number(npc[1])} : null;
  }
  function observe(doc,visible) {
    const win=doc.defaultView, toast=doc.getElementById('toast'), eaten=doc.getElementById('eaten'), clock=doc.getElementById('time');
    const overlay=doc.getElementById('overlay'), ending=doc.getElementById('gameEnding'), pause=doc.getElementById('pauseScreen');
    let active=true, frame=null, lastText='', pending=[], finalHud=null;
    const playing=()=>doc.visibilityState==='visible' && overlay.classList.contains('hidden') &&
      !ending.classList.contains('visible') && !pause.classList.contains('open');
    function hud() {
      if(!playing())return null;
      const digits=visible(eaten) ? eaten.textContent.trim() : '';
      const time=visible(clock) ? /^(\d+):([0-5]\d)$/.exec(clock.textContent.trim()) : null;
      const seconds=time ? 300-Number(time[1])*60-Number(time[2]) : null;
      return {eaten:/^\d+$/.test(digits)?Number(digits):null,gameSecond:seconds!==null&&seconds>=0&&seconds<=300?seconds:null};
    }
    // Read only the final visible DOM for a paint. Several native writes can
    // replace one another before rendering. Identical consecutive notices
    // without a visible intervening change remain one observation.
    function inspect(retry) {
      frame=null;
      if(!active||!playing())return;
      if(!toast.classList.contains('show')){if(!visible(toast))lastText='';return;}
      if(!visible(toast)){
        if(retry)schedule(false); // CSS can still be at zero opacity on entry.
        return;
      }
      const text=toast.textContent.trim();
      if(text===lastText)return;
      lastText=text;
      const parsed=parseToast(text);
      if(parsed)pending.push({...parsed,...hud(),text});
    }
    function schedule(retry=true) {
      if(active&&frame===null)frame=win.requestAnimationFrame(()=>inspect(retry));
    }
    const observer=new win.MutationObserver(()=>schedule());
    observer.observe(toast,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});
    const transition=event=>{if(event.propertyName==='opacity')schedule();};
    toast.addEventListener('transitionend',transition);
    function drain() {
      const observations=pending;
      pending=[];
      return {hud:active?hud():finalHud,observations};
    }
    function stop() {
      if(!active)return;
      finalHud=hud();
      active=false;
      observer.disconnect();
      toast.removeEventListener('transitionend',transition);
      if(frame!==null)win.cancelAnimationFrame(frame);
      win.removeEventListener('pagehide',stop);
    }
    win.addEventListener('pagehide',stop);
    return {drain,stop};
  }
  const api={parseToast,observe};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else window.GrowVisibleIntake=api;
})();
