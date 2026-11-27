function resolveOverlap41(objects, radius, map, speed, velocity, old, now) {
 const prior=old?.contact41;
 const distance=Math.hypot;
 const uncertain=body=>body.clipped||body.isRed||body.r*1.06>radius;
 const finiteBody=body=>body&&body.npc&&Number.isFinite(body.x)&&Number.isFinite(body.y)&&Number.isFinite(body.r);
 const bodies=objects.filter(finiteBody);
 const fit=body=>!body.clipped&&!body.blocked&&!body.isRed&&body.labelSeen===true&&body.geometryAccepted===1&&
   body.localReliable===true&&body.r>=20&&body.r*1.24<radius-.5&&distance(body.x,body.y)<radius+body.r+speed*.42+28;
 const empty={objects,contact:null,reason:'no-confirmed-contact',coasting:false};
 if(!map?.player||!(map.width>0)||!(map.height>0)||!Number.isFinite(radius)||!Number.isFinite(speed))return empty;
 // A missing/red-shifted map or another local threat invalidates the near-contact history.
 const reds=[...(map.threats||[]),...(map.growMarkers||[]).filter(m=>m.red===true)];
 const sx=10400/map.width,sy=7200/map.height;
 const redNearby=(x,y)=>reds.some(m=>{
   const rx=(m.x-map.player.x)*sx,ry=(m.y-map.player.y)*sy;
   return distance(rx,ry)<radius+210||distance(rx-x,ry-y)<radius+165;
 });
 const dt=prior?(now-prior.updatedAt)/1000:0;
 const valid=prior&&dt>=0&&dt<=.26&&now-prior.seenAt<=900&&Math.abs(radius-prior.hud)<=2;
 const px=valid?prior.x+(prior.vx-(velocity.x||0))*dt:0;
 const py=valid?prior.y+(prior.vy-(velocity.y||0))*dt:0;
 const fits=bodies.filter(fit).sort((a,b)=>valid?
   distance(a.x-px,a.y-py)-distance(b.x-px,b.y-py):distance(a.x,a.y)-distance(b.x,b.y));
 const allowedOther=(body,x,y)=>!(uncertain(body)&&
   (distance(body.x,body.y)<.72*(radius+body.r)+speed*.45+50||
    distance(body.x-x,body.y-y)<.72*(radius+body.r)+85));
 if(fits.length){
   const item=fits[0],same=valid&&distance(item.x-px,item.y-py)<Math.max(35,prior.r*.35)&&Math.abs(item.r-prior.r)<Math.max(3,prior.r*.12);
   if(!redNearby(item.x,item.y)&&bodies.every(o=>o===item||allowedOther(o,item.x,item.y))){
      const contact={x:item.x,y:item.y,r:item.r,vx:Math.max(-135,Math.min(135,item.vx||0)),vy:Math.max(-135,Math.min(135,item.vy||0)),
        seenAt:now,updatedAt:now,hud:radius,count:same?Math.min(20,prior.count+1):1};
      return {objects,contact,reason:same?'reobserved-verified-prey':'first-verified-prey',coasting:false};
   }
   return {...empty,reason:'nearby-hazard'};
 }
 if(!valid||prior.count<3||redNearby(px,py))return empty;
 const d=distance(px,py);
 if(d>.99*(radius+prior.r)+42||d<.72*(radius+prior.r)-44)return {...empty,reason:'outside-merge-window'};
 // An unresolved union is allowed only at the expected centroid of player and
 // prey. Its major axis must span both circles; an independent body, label or
 // a newly clipped edge preserves the original avoidance action.
 const fraction=prior.r*prior.r/(radius*radius+prior.r*prior.r);
 const cx=px*fraction,cy=py*fraction;
 const extent=.5*(d+radius+prior.r);
 const merges=bodies.filter(o=>!o.clipped&&!o.isRed&&!o.labelSeen&&!o.localReliable&&o.geometryAccepted===0&&
   distance(o.x-cx,o.y-cy)<Math.max(37,radius*.38)&&distance(o.x,o.y)<radius*.91&&
   o.r>radius*1.12&&o.r>extent*.78&&o.r<extent*1.22);
 if(merges.length!==1||bodies.some(o=>o!==merges[0]&&!allowedOther(o,px,py)))return {...empty,reason:'unknown-or-additional-body'};
 const substitute={x:px,y:py,r:prior.r,visualR:prior.r,npc:true,geometryAccepted:0,labelSeen:false,localReliable:false,
   clipped:false,isRed:false,blocked:false,vx:prior.vx,vy:prior.vy,trackedBeforeOverlap:true};
 const contact={...prior,x:px,y:py,updatedAt:now};
 return {objects:[...objects.filter(o=>o!==merges[0]),substitute],contact,reason:'bounded-player-prey-overlap',coasting:true};
}
function planGrow23(objects,radius,map,speed,velocity,old,version){
 const now=performance.now();
 const projection=version==='v2.13'?resolveOverlap41(objects,radius,map,speed,velocity||{x:0,y:0},old,now):
   {objects,contact:null,reason:'parent-for-other-versions',coasting:false};
 const plan=planParent32(projection.objects,radius,map,speed,velocity,old,version);
 let contact=projection.contact;
 // A first observation is stored only when the baseline actually steers toward
 // this identified prey. Coasting never authorises steering through an escape.
 if(contact){
   const norm=Math.hypot(contact.x,contact.y)||1;
   if(plan.escaping||((plan.x*contact.x+plan.y*contact.y)/norm<.40))contact=null;
 }
 return {...plan,contact41:contact,overlap41:projection.reason,overlapApplied41:projection.coasting};
}
