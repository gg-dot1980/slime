(function(root){function create(observer){let state=null,last=null;const reset=()=>{state=null;last=null;observer.reset()};function step(p,base,choices,now,cameraOk){
const tag=(d,mode,reason,o)=>({...d,orbit:{mode,reason,changed:d.name!==base.name,target:o?{x:o.x,y:o.y,r:o.r}:null,behavior:'unknown'}});
const safe=choices.filter(d=>d.clearance>3&&d.clearance>=Math.min(base.clearance,30)&&d.minWall>=30);
const stop=reason=>tag(base,'fallback-avoidance',reason,null);
const exit=(o,reason)=>{last=null;state={phase:'exit',o:{...o},until:now+600,last:now};return retreat(reason)};
function retreat(reason){if(!cameraOk)return stop('exit-camera-unknown');const o=state.o;const options=safe.filter(d=>d.x*o.x+d.y*o.y<=0).sort((a,b)=>(a.x*o.x+a.y*o.y)-(b.x*o.x+b.y*o.y));return options.length?tag({...options[0],target:null},'retreat',reason,o):stop('no-safe-exit');}
if(state?.phase==='yield'){if(now>=state.until){state=null;last=null;observer.reset()}return tag(base,'baseline','chase-budget-yield',null)}
if(state?.phase==='exit'){if(now>=state.until){state=null;last=null;observer.reset();return tag(base,'baseline','exit-budget-complete',null)}return retreat('exit-cooldown')}
if(state?.phase==='chase'){
 const prev=state.o,dt=(now-state.last)/1000;
 if(!cameraOk)return exit(prev,'camera-unknown');
 if(dt<=0||dt>.4)return exit(prev,'stale-identity');
 const candidates=p.objects.filter(o=>o.npc&&!o.clipped&&Math.abs(o.r-prev.r)<=Math.max(6,prev.r*.15)&&Math.hypot(o.x-prev.x-(prev.vx-p.velocity.x)*dt,o.y-prev.y-(prev.vy-p.velocity.y)*dt)<45);
 if(candidates.length!==1)return exit(prev,'identity-lost-or-ambiguous');
 const o=candidates[0],dist=Math.hypot(o.x,o.y),err=Math.max(6,o.r*.12);
 if(o.isRed||o.r+err>=p.hud/1.08)return exit(o,'size-no-longer-confirmed');
 if(now-state.start>=1200){last=null;state={phase:'yield',until:now+600};observer.reset();return tag(base,'baseline','chase-budget-yield',null)}
 if(now-state.start>=600&&dist>state.startDist-15)return exit(o,'no-progress');
 const progress=d=>{let x=0,y=0,vx=p.velocity.x,vy=p.velocity.y;for(let k=0;k<2;k++){vx+=(d.x*p.speed-vx)*.35;vy+=(d.y*p.speed-vy)*.35;x+=vx*.1;y+=vy*.1}return dist-Math.hypot(o.x+o.vx*.2-x,o.y+o.vy*.2-y)};const toward=safe.map(d=>({...d,approachProgress:progress(d)})).filter(d=>d.approachProgress>0).sort((a,b)=>b.approachProgress-a.approachProgress);
 if(!toward.length)return exit(o,'wall-or-other-threat');
 state.o={...o};state.last=now;return tag({...toward[0],target:o},'chase','same-visual-track',o);
}
const q=observer.step(p,base,choices,now,cameraOk),note=q.orbit;
if(note.target)last=note.target;
if(note.mode==='confirmed-small'){
 const matches=p.objects.filter(o=>o.npc&&o.x===note.target.x&&o.y===note.target.y&&o.r===note.target.r);
 if(matches.length!==1)return exit(last,'ambiguous-confirmation');
 const o=matches[0];state={phase:'chase',o:{...o},last:now-1,start:now,startDist:Math.hypot(o.x,o.y)};return step(p,base,choices,now,cameraOk);
}
if(note.mode==='exit'&&last)return exit(last,note.reason);
return q;
}return{reset,step}}if(typeof module!=='undefined')module.exports={create};else root.OCRHandoff={create}})(typeof window!=='undefined'?window:this);
