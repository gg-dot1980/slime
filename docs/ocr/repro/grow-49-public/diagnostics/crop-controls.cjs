'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(process.argv[2], 'utf8');
const a = html.indexOf('function clippedCenter49('), b = html.indexOf('function canvasUiMasks(', a);
if (a < 0 || b < 0) throw Error('Missing active component implementation');
const components = vm.runInThisContext(html.slice(a, b) + '\ncomponents');
const subjects = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const rows = [];

function probe(subject, tile, kind, edge, fraction) {
  const size = 1024, width = size, height = size;
  const rgba = Buffer.alloc(size * size * 4, Buffer.from([24, 41, 47, 255]));
  const d = Math.round(subject.r * fraction);
  let cx = size / 2, cy = size / 2;
  if (edge === 'top') cy = d;
  if (edge === 'bottom') cy = size - 1 - d;
  if (edge === 'left') cx = d;
  if (edge === 'right') cx = size - 1 - d;
  if (kind === 'corner') cx = d;
  if (kind === 'whole') cy = size / 2;
  const ox = Math.round(cx - subject.anchor[0]), oy = Math.round(cy - subject.anchor[1]);
  const sx = Math.max(-ox, 0), ex = Math.min(subject.size, size - ox);
  for (let y = Math.max(0, -oy); y < Math.min(subject.size, size - oy); y++) {
    tile.copy(rgba, ((oy + y) * width + ox + sx) * 4,
      (y * subject.size + sx) * 4, (y * subject.size + ex) * 4);
  }
  const x = ox + subject.anchor[0], y = oy + subject.anchor[1];
  const masks = kind === 'mask' ? [{x:x-30,y:0,w:60,h:Math.max(20,y+10)}] : [];
  // Stress the player's exclusion when its HUD radius reaches the component's box.
  const playerRadius = kind === 'player-region' ? Math.hypot(size/2-x,size/2-y) : 25;
  const parts = components({data:rgba},width,height,3,masks,playerRadius);
  const distance = p => Math.hypot(p.x-x,p.y-y);
  const possible = parts.filter(p=>p.r>subject.r*.5 && p.r<subject.r*1.5 && distance(p) < subject.r);
  possible.sort((a,b)=>distance(a)-distance(b));
  const p = possible[0];
  const object = p ? {clipped:p.clipped,applied:!!p.center49,r:p.r,
                      before:distance(p),after:distance(p.center49 || p)} : null;
  rows.push({key:subject.key,kind,edge,fraction,reference:[x,y],object});
}

for (const s of subjects) {
  const tile = fs.readFileSync(s.file);
  if (s.role === 'single') {
    for (const edge of ['top','bottom','left','right'])
      for (const f of [.8,.5,.15]) probe(s,tile,'single',edge,f);
    for (const k of ['corner','whole','mask']) probe(s,tile,k,'top',.3);
  } else if (s.role === 'merged') {
    for (const edge of ['top','bottom','left','right']) probe(s,tile,'merged',edge,.5);
  } else if (s.role === 'player') {
    probe(s,tile,'player-region','top',.45);
  } else if (s.role === 'food') {
    probe(s,tile,'food','top',.4);
  }
}
console.log(JSON.stringify(rows));
