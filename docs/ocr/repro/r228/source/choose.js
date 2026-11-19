// Isolated final-action filter. No target identity or size override.
window.choose186=function(p,actual,choices,metrics,eligible){
 if(!eligible)return {action:actual,status:'inactive',checks:[]};
 const ref=[0,.1,.2].map(t=>metrics(p,actual,t));let accepted=[];
 for(const d of choices){if(d.name===actual.name)continue;const checks=[0,.1,.2].map((t,i)=>({delay:t,...metrics(p,d,t),reference:ref[i]}));
 if(!checks.every(z=>[z.free.gap,z.free.wall,z.wall.gap,z.wall.wall].every(Number.isFinite)&&z.free.gap>3&&z.wall.gap>3&&z.free.wall>=0&&z.wall.wall>=0&&z.free.gap>=z.reference.free.gap-1e-8&&z.wall.gap>=z.reference.wall.gap-1e-8&&z.wall.wall>=z.reference.wall.wall-1e-8))continue;
 if(!Number.isFinite(d.gain)||d.gain<actual.gain)continue;
 accepted.push({action:d,checks});}
 accepted.sort((a,b)=>b.action.gain-a.action.gain||Math.min(...b.checks.map(z=>z.wall.gap))-Math.min(...a.checks.map(z=>z.wall.gap)));
 return accepted.length?{...accepted[0],status:'alternative',accepted:accepted.length}:{action:actual,status:'original-policy-fallback',checks:[],accepted:0};
};
