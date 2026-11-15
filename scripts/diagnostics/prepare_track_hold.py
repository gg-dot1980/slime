from pathlib import Path
p=Path('/home/gg/projects/ocr3');base=(p/'source/controller-foodwall.js').read_text();key='const analysis={objects,map,velocity};'
patch='''// Pixel-derived hazard tracks survive brief detector gaps, at most0.6s; no game state inputs.
 for(const q of previous){if(!q.npc||used.has(q)||(!q.isRed&&q.r<radius*.98))continue;const age=(q.ghostAge||0)+dt;if(age>.60001)continue;const x=q.x+(q.vx-camera.x)*dt,y=q.y+(q.vy-camera.y)*dt;if(Math.hypot(x,y)-.75*(radius+q.dangerRadius)>400)continue;if(objects.some(o=>o.npc&&Math.hypot(o.x-x,o.y-y)<Math.max(100,.35*(o.r+q.r))))continue;objects.push({...q,x,y,ghostAge:age});}
 '''
assert base.count(key)==1;(p/'source/controller-trackhold.js').write_text(base.replace(key,patch+key))
s=(p/'deterministic_timer_corrected.py').read_text().replace('[517,911]','[2467,3049]')
s=s.replace("controller.replace('*.91','*.94')",'controller.replace('+repr(key)+','+repr(patch+key)+')')
s=s.replace('deterministic-timer-corrected-unseen.json','deterministic-trackhold-unseen.json').replace('timer-unseen-','trackhold-unseen-')
s=s.replace(s.splitlines()[0], '# Diagnostic only: unmatched near-danger pixeltrack retention0.6sec, baseline200ms091 unchanged. New2467/3049 seeds, phase0/100, fourversions32runs. No formal acceptance.')
(p/'deterministic_trackhold.py').write_text(s);compile(s,'runner','exec')
