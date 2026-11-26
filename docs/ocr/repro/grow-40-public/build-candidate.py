from pathlib import Path
from hashlib import sha256
import sys
directory = Path(__file__).resolve().parent
s=(directory.parent / 'grow-34-public' / 'ocr-grow34.html').read_text()
assert sha256(s.encode()).hexdigest() == 'bd81bb39284b62762acce3d9c84562139dd44d71e16187134c95d2f43e14ef56'
s=s.replace('function growMapInputs(',(directory / 'fresh.js').read_text()+'\nfunction growMapInputs(')
s=s.replace("map.growMarkers.push(...scoutDots29(image,w,map));",'''{map.growMarkers.push(...scoutDots29(image,w,map));
    if(runGameVersion==='v2.22'){
      const all=trackFreshDots40(map,prior?.dotTracks,radius,now);
      map.freshDots=all.filter(m=>m.last===now&&m.fresh&&m.seen>=3&&now-m.first<15500&&m.spawnR>=43&&m.spawnR<178)
        .map(m=>({x:m.x,y:m.y,r:m.spawnR,age:now-m.first}));
      map.tracking40=all;
    }
  }''')
s=s.replace('const analysis={objects,map,velocity};imageState={radius,width:w,height:h,pixels,timestamp:now,objects,analysis};', '''const dotTracks=map?.tracking40||[];if(map)delete map.tracking40;
 const analysis={objects,map,velocity};imageState={radius,width:w,height:h,pixels,timestamp:now,objects,analysis,dotTracks};''')
s=s.replace('const estimate = dot.area<7 ?', 'let estimate = dot.area<7 ?')
s=s.replace('const eta=dist/speed, value=gainFor(estimate);', '''const spawn=(map.freshDots||[]).find(m=>hypot(m.x-dot.x,m.y-dot.y)<2.05);
      if(spawn) estimate=Math.max(estimate,Math.min(r*.86,spawn.r*.72));
      const eta=dist/speed, value=gainFor(estimate);''')
s=s.replace('(value+.45)*1.9*(1+Math.min(3,cluster)*.17)', '(value+.45)*1.9*(spawn?2.1:1)*(1+Math.min(3,cluster)*.17)')
s=s.replace('Grow34','Grow40')
digest = sha256(s.encode()).hexdigest()
assert digest == '27893e0d44a4b9d0aea54f73c38be16048bed47c78abe387d5845f09d22e179f'
output = directory / 'ocr-grow40.html'
if '--write' in sys.argv:
    output.write_text(s)
else:
    assert output.read_text() == s
print(digest)
