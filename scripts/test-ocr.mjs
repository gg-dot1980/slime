import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../src/ocr1.html', import.meta.url), 'utf8');
function controller() {
  const context = vm.createContext({ Math, Uint8Array, Uint16Array, Int32Array, targetTrackId: null });
  vm.runInContext(
    html.slice(html.indexOf('function isPlayerComponent'), html.indexOf('function playerEdge')) +
    html.slice(html.indexOf('function decide(parts'), html.indexOf('function analyze(')), context);
  return context;
}
function image(w = 320, h = 240) {
  const data = new Uint8Array(w * h * 4);
  for (let i = 0; i < data.length; i += 4) data.set([25, 42, 49, 255], i);
  return {
    w, h, data,
    circle(cx, cy, r, color) {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (Math.hypot(x - cx, y - cy) <= r) data.set([...color, 255], (y * w + x) * 4);
      }
    },
    rect(x, y, width, height, color) {
      for (let yy = y; yy < y + height; yy++) for (let xx = x; xx < x + width; xx++) {
        if (xx >= 0 && xx < w && yy >= 0 && yy < h) data.set([...color, 255], (yy * w + xx) * 4);
      }
    },
  };
}
let passed = 0;
function test(name, run) { run(); passed++; console.log(`PASS ${name}`); }
const detect = (c, pixels, uiMasks = []) => c.components({ data: pixels.data }, pixels.w, pixels.h, 2, uiMasks);

test('touching red and yellow food remain two small targets', () => {
  const c = controller(), pixels = image();
  pixels.circle(170, 170, 13, [242, 84, 91]);
  pixels.circle(194, 170, 13, [255, 209, 102]);
  const parts = detect(c, pixels), decision = c.decide(parts, 24, 160, 120, null);
  assert.equal(parts.length, 2);
  assert(parts.every(p => p.r <= 14));
  assert.equal(decision.threats.length, 0);
  assert.equal(decision.prey.length, 2);
});
for (const [name, color] of [['QQ', [156, 145, 139]], ['Berry', [137, 122, 125]], ['neutral', [155, 155, 155]]]) {
  test(`${name} gray body remains a large threat`, () => {
    const c = controller(), pixels = image(400, 320);
    pixels.circle(200, 215, 55, color);
    const parts = detect(c, pixels), decision = c.decide(parts, 24, 200, 160, null);
    assert(parts.some(p => p.r >= 54));
    assert(decision.threats.some(p => p.r >= 54));
    assert.equal(decision.title, '避開靠近的大型史萊姆');
  });
}
test('dark arena floor is not foreground', () => {
  assert.equal(detect(controller(), image()).length, 0);
});
test('canvas minimap is masked while upper-left and footer arena targets remain visible', () => {
  const c = controller(), pixels = image(400, 320);
  pixels.rect(330, 80, 30, 10, [240, 240, 240]);
  for (const [x, y] of [[45, 60], [50, 304], [370, 300]]) pixels.circle(x, y, 14, [156, 145, 139]);
  const parts = detect(c, pixels, c.canvasUiMasks(pixels.w, pixels.h));
  assert.equal(parts.length, 3);
  assert(parts.some(p => p.x < 100 && p.y < 100));
  assert.equal(parts.filter(p => p.y > 280).length, 2);
});
test('connected sparse name text is not mistaken for a large slime', () => {
  const c = controller(), pixels = image(400, 320);
  pixels.rect(200, 200, 60, 2, [240, 240, 240]);
  for (let x = 200; x < 260; x += 6) pixels.rect(x, 200, 2, 10, [240, 240, 240]);
  assert.equal(detect(c, pixels).length, 0);
});
test('long thin boundary fragment is not a slime', () => {
  const pixels = image(400, 320);
  pixels.rect(100, 230, 180, 8, [68, 117, 104]);
  assert.equal(detect(controller(), pixels).length, 0);
});
test('a partially clipped predator is retained', () => {
  const pixels = image(400, 320);
  pixels.circle(40, 285, 65, [137, 122, 125]);
  assert(detect(controller(), pixels).some(p => p.r >= 50));
});
test('player body is excluded while overlapping larger bodies remain threats', () => {
  const c = controller();
  assert.equal(c.decide([{x:160,y:120,r:29}], 24, 160, 120, null).threats.length, 0);
  assert.equal(c.decide([{x:160,y:120,r:70}], 24, 160, 120, null).threats.length, 1);
});

// Visible OCR coordinates recorded at 04:30 remaining in the v2.13 test round.
const replay = [
  {id:1,x:347.53294673361086,y:378.95443699024605,r:14},
  {id:2,x:346.59231713378904,y:205.3779040158487,r:12.000016788382268},
  {id:3,x:292.8928841290865,y:328.7057986251083,r:14.00000000000035},
  {id:4,x:112.13303170508348,y:344.31814373690213,r:15.999999999999998},
  {id:5,x:5.568618479112574,y:446.0207871715769,r:13.183226566399998},
  {id:6,x:597.2619519510133,y:74.3782951191331,r:12},
  {id:7,x:109.70983126157508,y:527.0180831236987,r:109.54976364301947,isThreat:true},
];
test('recorded southwest food is pursued when its route has sufficient predator clearance', () => {
  const c = controller(); c.targetTrackId = 1;
  const decision = c.decide(replay, 33, 479, 278.5, null);
  assert.equal(decision.title, '前往食物或小史萊姆');
  assert.equal(c.targetTrackId, 1);
  assert.equal(decision.dir.name, '↙ 西南');
});
test('all food routes blocked by a predator trigger avoidance', () => {
  const c = controller(); c.targetTrackId = 1;
  const decision = c.decide([{id:1,x:220,y:530,r:14}, replay[6]], 33, 479, 278.5, {name:'↙ 西南'});
  assert.equal(decision.title, '避開靠近的大型史萊姆');
  assert(decision.dir.x > 0 && decision.dir.y < 0);
});
test('without predators the nearest small target is pursued', () => {
  const decision = controller().decide([{x:160,y:170,r:10},{x:240,y:120,r:10}], 24, 160, 120, null);
  assert.equal(decision.dir.name, '↓ 南');
});
test('boundary avoidance still turns inward', () => {
  const decision = controller().decide([{x:180,y:120,r:10}], 24, 160, 120, null, {left:true});
  assert.equal(decision.title, '避開場地邊界');
  assert(decision.dir.x > 0);
});
test('without a target no new direction is issued', () => {
  assert.equal(controller().decide([], 24, 160, 120, {name:'↑ 北'}).dir, null);
});

function runtime(pixels = image(400, 320)) {
  const clock = {now:1000,captureMs:30}, nodes = new Map();
  const element = id => {
    if (!nodes.has(id)) nodes.set(id, {textContent:'',hidden:false});
    return nodes.get(id);
  };
  const context = vm.createContext({
    Math, Uint8Array, Uint16Array, Uint32Array, Int32Array,
    performance:{now:()=>clock.now}, $:element, status:element('status'),
    say:text=>{element('status').textContent=text},
    game:{hidden:false,contentDocument:{querySelector:()=>({width:pixels.w,height:pixels.h})}},
    out:{width:0,height:0},
    ctx:{drawImage:()=>{clock.now+=clock.captureMs},getImageData:()=>({data:pixels.data})},
    // Automatic recognition should never create the hidden SVG annotation.
    document:{createElementNS:()=>{throw new Error('hidden overlay was rebuilt')}},
  });
  vm.runInContext(html.slice(html.indexOf('function isPlayerComponent'), html.indexOf('const directionOptions=')), context);
  context.queueLength = () => vm.runInContext('frameQueue.length', context);
  return {context,clock,nodes,pixels};
}
test('identical pixels are skipped and a one-pixel change remains a new frame', () => {
  const {context:c,pixels} = runtime();
  assert.equal(c.isFreshFrame({data:pixels.data}, pixels.w, pixels.h), true);
  assert.equal(c.isFreshFrame({data:pixels.data.slice()}, pixels.w, pixels.h), false);
  pixels.data[pixels.data.length - 2]++;
  assert.equal(c.isFreshFrame({data:pixels.data}, pixels.w, pixels.h), true);
  assert.equal(c.isFreshFrame({data:pixels.data}, pixels.h, pixels.w), true);
});
test('duplicate captures do not grow the queue or inflate recognition FPS', () => {
  const {context:c,clock,nodes,pixels} = runtime();
  pixels.circle(200, 160, 24, [80, 190, 190]);
  c.resetVision();
  assert.equal(c.analyze(true).fresh, true);
  for (let i = 0; i < 10; i++) { clock.now += 100; assert.equal(c.analyze(true).fresh, false); }
  assert.equal(c.queueLength(), 1);
  assert.equal(nodes.get('frameStats').textContent, '辨識 1 張 · 跳過重複 10 張');
  assert(parseFloat(nodes.get('recognitionFps').textContent) < 1);
  assert.equal(nodes.get('recognitionTime').textContent, '30.0 ms');
  pixels.data[pixels.data.length - 2]++;
  assert.equal(c.analyze(true).fresh, true);
  assert.equal(c.queueLength(), 2);
  c.resetVision();
  assert.equal(c.queueLength(), 0);
  assert.equal(c.analyze(true).fresh, true);
});
test('a new borderline predator bypasses a full food-only history', () => {
  const {context:c} = runtime();
  for (let i = 0; i < 20; i++) c.decideFromQueue([{id:1,x:160,y:200,r:10,ratio:.36}], 32, 160, 120, null, {});
  const decision = c.decideFromQueue([{id:2,x:220,y:120,r:30.5,ratio:.953125,isThreat:false}], 32, 160, 120, {name:'→ 東'}, {});
  assert.equal(c.queueLength(), 20);
  assert.equal(decision.urgent, true);
  assert.equal(decision.threats.length, 1);
  assert(decision.dir.x < 0);
});
test('escape uses the observed predator position instead of its delayed smoothed position', () => {
  const {context:c} = runtime();
  const decision = c.decideFromQueue([{
    id:2,seen:true,x:100,y:120,r:15,ratio:.54,
    observedX:230,observedY:120,observedR:50,observedRatio:1.8,
  }], 32, 160, 120, {name:'→ 東'}, {});
  assert.equal(decision.urgent, true);
  assert.equal(decision.threats[0].x, 230);
  assert.equal(decision.threats[0].r, 50);
  assert(decision.dir.x < 0);
});
test('far food requires two fresh frames while duplicate captures preserve the pending count', () => {
  const {context:c} = runtime(), current = {name:'↑ 北'}, food = {fresh:true,dir:{name:'→ 東'}};
  let result = c.directionConfirmation(food, current);
  assert.equal(result.dir, null);
  for (let i = 0; i < 20; i++) result = c.directionConfirmation({...food,fresh:false}, current, result.pendingName, result.pendingFrames);
  assert.equal(result.pendingFrames, 1);
  result = c.directionConfirmation(food, current, result.pendingName, result.pendingFrames);
  assert.equal(result.dir.name, '→ 東');
  assert.equal(result.required, 2);
});
test('near food turns on its first fresh frame without waiting for history', () => {
  const {context:c} = runtime(), current = {name:'↑ 北',x:0,y:-1};
  const decision = c.decide([{id:1,x:160,y:185,r:10}], 32, 160, 120, current);
  const result = c.directionConfirmation({...decision,fresh:true}, current);
  assert.equal(result.dir.name, '↓ 南');
  assert.equal(result.required, 1);
  assert.equal(decision.urgent, undefined);
});
test('distant visible predators no longer cancel a safe nearby meal', () => {
  const c = controller(), decision = c.decide([
    {id:1,x:160,y:185,r:10}, {id:2,x:425,y:120,r:48,isThreat:true},
  ], 32, 160, 120, {name:'↑ 北',x:0,y:-1});
  assert.equal(decision.title, '前往食物或小史萊姆');
  assert.equal(decision.dir.name, '↓ 南');
  assert.equal(c.targetTrackId, 1);
});
test('a clearly smaller slime near the former size cutoff is now pursued and tracked as edible', () => {
  const {context:c} = runtime();
  const first = c.trackDetections([{x:260,y:120,r:24,hasLabel:true}], 32, 160, 120);
  const second = c.trackDetections([{x:260,y:120,r:24,hasLabel:true}], 32, 160, 120);
  assert.equal(first[0].isThreat, false);
  assert.equal(second[0].isThreat, false);
  const decision = c.decideFromQueue(second, 32, 160, 120, null, {});
  assert.equal(decision.title, '優先吞食較小史萊姆');
  assert.equal(decision.dir.name, '→ 東');
  assert.equal(decision.threats.length, 0);
});
test('a slime exactly five percent smaller is edible without size inflation', () => {
  const decision = controller().decide([{id:1,x:260,y:120,r:30.4,hasLabel:true}], 32, 160, 120, null);
  assert.equal(decision.prey.length, 1);
  assert.equal(decision.prey[0].ratio, .95);
  assert.equal(decision.threats.length, 0);
  assert.equal(decision.title, '優先吞食較小史萊姆');
  assert.equal(decision.dir.name, '→ 東');
});
test('slimes above ninety-five percent remain avoidance candidates', () => {
  for (const r of [30.40032,32,36]) {
    const decision = controller().decide([{x:260,y:120,r}], 32, 160, 120, null);
    assert.equal(decision.prey.length, 0);
    assert.equal(decision.threats.length, 1);
    assert.equal(decision.urgent, true);
  }
});
test('a formerly threatening slime becomes edible on the first smaller observation', () => {
  const {context:c} = runtime();
  const prior = c.trackDetections([{x:260,y:120,r:36,hasLabel:true}], 32, 160, 120);
  const current = c.trackDetections([{x:260,y:120,r:30.4,hasLabel:true}], 32, 160, 120);
  assert.equal(prior[0].isThreat, true);
  assert.equal(current[0].id, prior[0].id);
  assert.equal(current[0].isThreat, false);
  const decision = c.decideFromQueue(current, 32, 160, 120, null, {});
  assert.equal(decision.prey[0].ratio, .95);
  assert.equal(decision.threats.length, 0);
  assert.equal(decision.title, '優先吞食較小史萊姆');
});
test('player growth immediately makes the same ninety-five-percent slime edible', () => {
  const {context:c} = runtime();
  c.trackDetections([{x:260,y:120,r:38,hasLabel:true}], 32, 160, 120);
  const current = c.trackDetections([{x:260,y:120,r:38,hasLabel:true}], 40, 160, 120);
  const decision = c.decideFromQueue(current, 40, 160, 120, null, {});
  assert.equal(decision.threats.length, 0);
  assert.equal(decision.prey[0].ratio, .95);
  assert.equal(decision.title, '優先吞食較小史萊姆');
});
test('latest edible size overrides stale threat flags and twenty historical frames', () => {
  const {context:c} = runtime();
  for(let i=0;i<20;i++) c.decideFromQueue([{id:1,x:260,y:120,r:36,ratio:1.125,isThreat:true}],32,160,120,null,{});
  const decision = c.decideFromQueue([{id:1,seen:true,x:260,y:120,r:36,ratio:1.125,isThreat:true,observedR:30.4,observedRatio:.95,hasLabel:true}],32,160,120,null,{});
  assert.equal(c.queueLength(),20);
  assert.equal(decision.threats.length,0);
  assert.equal(decision.prey[0].isThreat,false);
  assert.equal(decision.title,'優先吞食較小史萊姆');
});
test('pixel recognition labels and pursues a slime near the new edible cutoff', () => {
  const {context:c,pixels} = runtime();
  pixels.circle(200,160,32,[80,190,190]);
  pixels.circle(310,245,30,[242,84,91]);
  pixels.rect(306,243,8,4,[243,250,245]);
  const decision=c.analyze(true);
  assert.equal(decision.title,'優先吞食較小史萊姆');
  assert.equal(decision.threats.length,0);
  assert.equal(decision.prey[0].hasLabel,true);
  assert(decision.prey[0].ratio>.9 && decision.prey[0].ratio<=.95);
});
test('safe escape directions favor food while retaining predator clearance', () => {
  const decision = controller().decide([
    {id:1,x:210,y:170,r:8}, {id:2,x:40,y:120,r:36,isThreat:true},
  ], 24, 160, 120, null);
  assert.equal(decision.title, '避敵並順路追食');
  assert.equal(decision.urgent, true);
  assert.equal(decision.dir.name, '↘ 東南');
  assert(decision.dir.clearance >= 24);
});
for (const hasLabel of [false, true]) test(`increased ${hasLabel?'small slime':'food'} pursuit weight changes a safe escape toward the meal`, () => {
  const decision = controller().decide([
    {id:1,x:211,y:152,r:hasLabel?12:8,hasLabel},
    {id:2,x:40,y:120,r:36,isThreat:true},
  ], 24, 160, 120, null);
  assert.equal(decision.title, '避敵並順路追食');
  assert.equal(decision.dir.name, '↘ 東南');
  assert(decision.dir.clearance >= 24);
});
test('a closing predator still interrupts food outside the immediate avoidance range', () => {
  const decision = controller().decide([
    {id:1,x:160,y:185,r:10},
    {id:2,x:425,y:120,r:48,isThreat:true,hits:3,vx:-20,vy:0},
  ], 32, 160, 120, {name:'→ 東',x:1,y:0});
  assert.equal(decision.urgent, true);
  assert.equal(decision.reason, 'threat');
  assert(decision.dir.x < 0);
});
test('danger immediately interrupts a pending food turn', () => {
  const {context:c} = runtime();
  const result = c.directionConfirmation({fresh:true,urgent:true,dir:{name:'← 西'}}, {name:'→ 東'}, '↗ 東北', 2);
  assert.equal(result.dir.name, '← 西');
  assert.equal(result.pendingFrames, 0);
  assert.equal(result.required, 1);
});
test('capture interval includes processing time and yields immediately when over budget', () => {
  const {context:c} = runtime();
  assert.equal(c.captureDelay(1000, 1040), 60);
  assert.equal(c.captureDelay(1000, 1140), 0);
});
test('a central light name label distinguishes a small slime from colored food', () => {
  const c = controller(), pixels = image(400, 320), p = {x:200,y:210,r:18};
  pixels.circle(p.x, p.y, p.r, [242, 84, 91]);
  assert.equal(c.hasSlimeLabel({data:pixels.data}, pixels.w, pixels.h, p), false);
  pixels.rect(196, 208, 8, 4, [243, 250, 245]);
  assert.equal(c.hasSlimeLabel({data:pixels.data}, pixels.w, pixels.h, p), true);
});
test('bright yellow food is not mistaken for a name label', () => {
  const c = controller(), pixels = image(400, 320), p = {x:200,y:210,r:15};
  pixels.circle(p.x, p.y, p.r, [255, 209, 102]);
  assert.equal(c.hasSlimeLabel({data:pixels.data}, pixels.w, pixels.h, p), false);
});
test('recognition carries a small slime name label into the growth decision', () => {
  const {context:c,pixels} = runtime();
  pixels.circle(200, 160, 32, [80, 190, 190]);
  pixels.circle(265, 160, 10, [255, 209, 102]);
  pixels.circle(275, 245, 18, [242, 84, 91]);
  pixels.rect(271, 243, 8, 4, [243, 250, 245]);
  const decision = c.analyze(true);
  assert.equal(decision.title, '優先吞食較小史萊姆');
  assert.equal(decision.prey[0].hasLabel, true);
  assert.equal(decision.dir.name, '↘ 東南');
});
test('a safe small slime with higher growth value replaces a locked nearby food target', () => {
  const c = controller(); c.targetTrackId = 1;
  const decision = c.decide([
    {id:1,x:210,y:120,r:10}, {id:2,x:160,y:270,r:20,hasLabel:true},
  ], 32, 160, 120, {name:'→ 東'});
  assert.equal(c.targetTrackId, 2);
  assert.equal(decision.title, '優先吞食較小史萊姆');
  assert.equal(decision.dir.name, '↓ 南');
});
test('small slime pursuit can pass a predator with one extra player radius of clearance', () => {
  const c=controller(),prey={id:1,x:440,y:120,r:24,hasLabel:true},predator={id:2,x:380,y:240,r:48};
  const decision=c.decide([prey,predator],32,160,120,null);
  assert.equal(decision.title,'優先吞食較小史萊姆');assert.equal(c.targetTrackId,1);
  assert.equal(decision.dir.name,'→ 東');
  assert(predator.y-120-32-predator.r>32);
});
test('food retains its wider route margin beside the same predator', () => {
  const c=controller();
  const decision=c.decide([{id:1,x:440,y:120,r:24},{id:2,x:380,y:240,r:48}],32,160,120,null);
  assert.equal(c.targetTrackId,null);assert.equal(decision.reason,'threat');
});
test('small slime pursuit still rejects a route inside the reduced clearance', () => {
  const c=controller();
  const decision=c.decide([{id:1,x:440,y:120,r:24,hasLabel:true},{id:2,x:380,y:220,r:48}],32,160,120,null);
  assert.equal(c.targetTrackId,null);assert.equal(decision.reason,'threat');
});
test('a nearby predator still takes priority despite the smaller slime pursuit margin', () => {
  const c=controller();
  const decision=c.decide([{id:1,x:160,y:240,r:24,hasLabel:true},{id:2,x:215,y:120,r:48}],32,160,120,null);
  assert.equal(decision.reason,'threat');assert.equal(decision.urgent,true);assert(decision.dir.x<0);
});
test('higher growth weight never selects a slime behind a predator', () => {
  const c = controller();
  const decision = c.decide([
    {id:1,x:479,y:338.5,r:9},
    {id:2,x:1009,y:278.5,r:16,hasLabel:true},
    {id:3,x:949,y:278.5,r:40,isThreat:true},
  ], 24, 479, 278.5, null);
  assert.equal(c.targetTrackId, 1);
  assert.equal(decision.dir.name, '↓ 南');
});
test('increased slime weight replaces nearby food with a farther safe slime', () => {
  const c = controller(); c.targetTrackId = 1;
  const decision = c.decide([
    {id:1,x:479,y:338.5,r:11},
    {id:2,x:929,y:278.5,r:14,hasLabel:true},
  ], 32, 479, 278.5, {name:'↓ 南',x:0,y:1});
  assert.equal(c.targetTrackId, 2);
  assert.equal(decision.title, '優先吞食較小史萊姆');
  assert.equal(decision.dir.name, '→ 東');
});
test('small score improvements preserve the target instead of causing repeated switches', () => {
  const c = controller(); c.targetTrackId = 1;
  c.decide([{id:1,x:260,y:120,r:10},{id:2,x:160,y:210,r:10}], 32, 160, 120, null);
  assert.equal(c.targetTrackId, 1);
});
test('tracking survives the observed two-second gap between fresh game frames', () => {
  const {context:c,clock} = runtime();
  const first = c.trackDetections([{x:240,y:210,r:18,hasLabel:true}], 32, 200, 160);
  clock.now += 2000;
  const next = c.trackDetections([{x:244,y:210,r:18,hasLabel:true}], 32, 200, 160);
  assert.equal(next[0].id, first[0].id);
  assert.equal(next[0].hits, 2);
  assert.equal(next[0].seen, true);
  assert.equal(next[0].hasLabel, true);
});
test('missing predators expire after fresh frames rather than remaining as permanent ghosts', () => {
  const {context:c,clock} = runtime();
  c.trackDetections([{x:260,y:160,r:50}], 32, 200, 160);
  for (let frame = 1; frame <= 3; frame++) {
    clock.now += 2000;
    const tracks = c.trackDetections([], 32, 200, 160);
    assert.equal(tracks.length, frame <= 2 ? 1 : 0);
    if (tracks.length) assert.equal(tracks[0].seen, false);
  }
});
test('a very large partially visible predator is never discarded for exceeding canvas height', () => {
  const c = controller(), pixels = image(958, 557);
  pixels.circle(150, 370, 500, [137, 122, 125]);
  const parts = detect(c, pixels);
  assert(parts.some(p => p.r >= 300));
  const decision = c.decide(parts, 47, 479, 278.5, null);
  assert.equal(decision.urgent, true);
  assert(decision.dir.x > 0);
});
test('connected arena corner lines do not become giant slime candidates', () => {
  const c = controller(), pixels = image(400, 320);
  pixels.rect(8, 8, 8, 300, [68, 117, 104]);
  pixels.rect(8, 300, 382, 8, [68, 117, 104]);
  assert.equal(detect(c, pixels).length, 0);
});
test('player contour remains measurable after growing beyond the former radius search limit', () => {
  const pixels = image(500, 500), {context:c} = runtime(pixels);
  pixels.circle(250, 250, 180, [80, 190, 190]);
  const radius = c.playerEdge({data:pixels.data}, pixels.w, pixels.h);
  assert(radius >= 178 && radius <= 183);
});
function minimapImage(pixelRatio = 1, player = {x:72,y:50}) {
  const pixels = image(900 * pixelRatio, 600 * pixelRatio);
  const x = pixels.w - 159 * pixelRatio, y = 70 * pixelRatio;
  pixels.rect(x, y, 144 * pixelRatio, 100 * pixelRatio, [32,50,56]);
  const dot = (xx, yy, r, color) => pixels.circle(x + xx * pixelRatio, y + yy * pixelRatio, r * pixelRatio, color);
  // The camera rectangle uses the same mint as the player marker.
  pixels.rect(x + 64 * pixelRatio, y + 44 * pixelRatio, 16 * pixelRatio, 2 * pixelRatio, [163,243,209]);
  pixels.rect(x + 64 * pixelRatio, y + 56 * pixelRatio, 16 * pixelRatio, 2 * pixelRatio, [163,243,209]);
  pixels.rect(x + 64 * pixelRatio, y + 44 * pixelRatio, 2 * pixelRatio, 14 * pixelRatio, [163,243,209]);
  pixels.rect(x + 78 * pixelRatio, y + 44 * pixelRatio, 2 * pixelRatio, 14 * pixelRatio, [163,243,209]);
  if (player) dot(player.x, player.y, 3, [163,243,209]);
  return {pixels,dot};
}
for (const pixelRatio of [1, 2]) test(`minimap identifies player and red groups at pixel ratio ${pixelRatio}`, () => {
  const c = controller(), {pixels,dot} = minimapImage(pixelRatio);
  dot(96, 50, 2, [255,138,126]); dot(97, 51, 2, [255,138,126]);
  dot(115, 70, 1.2, [255,138,126]); dot(40, 35, 2, [211,238,225]);
  pixels.circle(200, 300, 35, [255,138,126]); // Red food outside the map cannot affect it.
  const map = c.detectMinimap({data:pixels.data}, pixels.w, pixels.h, pixelRatio);
  assert(map);
  assert(Math.abs(map.player.x / pixelRatio - 72) <= 2);
  assert(Math.abs(map.player.y / pixelRatio - 50) <= 2);
  assert.equal(map.threats.length, 2);
  assert(map.threats.every(t => t.x / pixelRatio > 90));
});
test('camera outline alone cannot masquerade as the player minimap marker', () => {
  const c = controller(), {pixels} = minimapImage(1, null);
  assert.equal(c.detectMinimap({data:pixels.data}, pixels.w, pixels.h), null);
});
test('a partially clipped player marker at the minimap wall can still be located', () => {
  const c = controller(), {pixels} = minimapImage(1, {x:.5,y:30});
  const map = c.detectMinimap({data:pixels.data}, pixels.w, pixels.h);
  assert(map && map.player.x < 3 && Math.abs(map.player.y - 30) <= 2);
});
const denseEast = {
  width:144,height:100,player:{x:72,y:50},
  threats:[{x:77,y:46},{x:79,y:50},{x:77,y:54},{x:82,y:49}],
};
test('minimap density steers away from offscreen large slime clusters immediately', () => {
  const c = controller();
  assert(c.minimapDirectionRisk(denseEast, {x:1,y:0}) > c.minimapDirectionRisk(denseEast, {x:-1,y:0}));
  const decision = c.decide([], 32, 200, 160, {name:'→ 東',x:1,y:0}, {}, denseEast);
  assert.equal(decision.reason, 'surrounding');
  assert.equal(decision.urgent, true);
  assert(decision.dir.x < 0);
});
test('a dangerous minimap region cannot win solely through small slime growth weight', () => {
  const c = controller();
  const decision = c.decide([
    {id:1,x:300,y:160,r:20,hasLabel:true}, {id:2,x:100,y:160,r:10},
  ], 32, 200, 160, {name:'← 西',x:-1,y:0}, {}, denseEast);
  assert.equal(c.targetTrackId, null);
  assert.equal(decision.title, '持續撤離大型史萊姆聚集區');
  assert(decision.dir.x < 0);
});
test('nearby visible predators take precedence over conflicting minimap regions', () => {
  const c = controller(), denseWest = {...denseEast,threats:denseEast.threats.map(t=>({...t,x:144-t.x}))};
  const decision = c.decide([{id:1,x:260,y:160,r:55,isThreat:true}], 32, 200, 160, null, {}, denseWest);
  assert.equal(decision.reason, 'threat');
  assert(decision.dir.x < 0);
});
test('red groups beyond the reduced eight-percent range allow a safe small slime pursuit', () => {
  const c=controller(),map={width:144,height:100,player:{x:72,y:50},threats:[{x:84,y:44},{x:84,y:56}]};
  assert.equal(c.minimapClusterState(map).nearby,0);
  const decision=c.decide([{id:1,x:100,y:160,r:20,hasLabel:true}],32,200,160,null,{},map);
  assert.equal(decision.title,'優先吞食較小史萊姆');
  assert.equal(decision.evacuation,undefined);
});
test('evacuation releases at ten-percent separation and resumes small slime pursuit', () => {
  const c=controller();c.decide([],32,200,160,null,{},denseEast);
  const map={...denseEast,player:{x:62,y:50}},prey=[{id:1,x:100,y:160,r:20,hasLabel:true}];
  const area=c.minimapClusterState(map);assert(area.clear);assert(area.nearest/map.width<.12);
  assert(c.decide(prey,32,200,160,null,{},map).evacuation);
  assert(c.decide(prey,32,200,160,null,{},map).evacuation);
  const decision=c.decide(prey,32,200,160,null,{},map);
  assert.equal(decision.title,'優先吞食較小史萊姆');assert.equal(decision.evacuation,undefined);
});
test('increased small slime weight selects a farther safe growth target over nearby food', () => {
  const c=controller();c.targetTrackId=1;
  const decision=c.decide([{id:1,x:232,y:120,r:12},{id:2,x:160,y:740,r:10,hasLabel:true}],32,160,120,null);
  assert.equal(decision.title,'優先吞食較小史萊姆');assert.equal(c.targetTrackId,2);
});
test('distant red dots preserve growth targeting instead of causing unnecessary evasions', () => {
  const c = controller(), distant = {...denseEast,threats:[{x:130,y:90}]};
  const decision = c.decide([{id:1,x:300,y:160,r:20,hasLabel:true}], 32, 200, 160, null, {}, distant);
  assert.equal(decision.title, '優先吞食較小史萊姆');
  assert.equal(decision.dir.name, '→ 東');
});
test('unsupported or missing minimaps fall back to main canvas targeting', () => {
  const c = controller(), pixels = image(400, 320);
  assert.equal(c.detectMinimap({data:pixels.data}, pixels.w, pixels.h), null);
  assert.equal(c.decide([{x:200,y:250,r:10}], 32, 200, 160, null, {}, null).dir.name, '↓ 南');
});
test('green arena objects in the expected map position cannot create a false minimap', () => {
  const c = controller(), pixels = image(900, 600);
  pixels.circle(813, 120, 3, [163,243,209]);
  pixels.circle(820, 120, 2, [255,138,126]);
  assert.equal(c.detectMinimap({data:pixels.data}, pixels.w, pixels.h), null);
});
test('equal danger around all eight directions still triggers escape instead of waiting for a score spread', () => {
  const c = controller(), map = {width:144,height:100,player:{x:72,y:50},threats:[]};
  for (let i = 0; i < 8; i++) map.threats.push({x:72+Math.cos(i*Math.PI/4)*10,y:50+Math.sin(i*Math.PI/4)*10});
  const situation = c.minimapSurrounding(map);
  assert.equal(situation.enclosed, true);
  assert.equal(situation.sectors, 8);
  const risks = Array.from({length:8}, (_,i)=>c.minimapDirectionRisk(map,{x:Math.cos(i*Math.PI/4),y:Math.sin(i*Math.PI/4)}));
  assert(Math.max(...risks)-Math.min(...risks) < .22);
  const decision = c.decide([], 32, 479, 278.5, null, {}, map);
  assert.equal(decision.reason, 'surrounding');
  assert.equal(decision.urgent, true);
  assert(decision.dir);
});
test('one-sided red dot density is distinguished from a current full surround', () => {
  assert.equal(controller().minimapSurrounding(denseEast).enclosed, false);
});
const eastTrap = {width:144,height:100,player:{x:72,y:50},threats:[{x:77,y:40},{x:88,y:50},{x:77,y:60}]};
test('a route is rejected before the player enters a surrounding formation', () => {
  const c = controller();
  assert.equal(c.minimapSurrounding(eastTrap).enclosed, false);
  assert.equal(c.minimapRouteAssessment(eastTrap,{x:1,y:0}).entersEnclosure, true);
  assert.equal(c.minimapRouteAssessment(eastTrap,{x:-1,y:0}).entersEnclosure, false);
  const decision = c.decide([
    {id:1,x:929,y:278.5,r:14,hasLabel:true}, {id:2,x:379,y:278.5,r:10},
  ], 32, 479, 278.5, {name:'→ 東',x:1,y:0}, {}, eastTrap);
  assert.notEqual(c.targetTrackId, 1);
  assert.equal(decision.reason, 'surrounding');
  assert.equal(decision.urgent, true);
  assert(decision.dir.x < 0);
});
test('map walls participate in a pinch and the escape does not run through the wall', () => {
  const c = controller(), map = {width:144,height:100,player:{x:2,y:50},threats:[{x:9,y:44},{x:9,y:56}]};
  assert.equal(c.minimapSurrounding(map).enclosed, true);
  const decision = c.decide([], 32, 479, 278.5, null, {}, map);
  assert.equal(decision.reason, 'surrounding');
  assert(decision.dir.x >= 0);
  assert(map.player.x+decision.dir.x*map.width*.06 >= 0);
});
test('an immediate visible predator still wins over a map escape corridor', () => {
  const c = controller(), map = {width:144,height:100,player:{x:72,y:50},threats:[{x:64,y:44},{x:80,y:44},{x:72,y:60}]};
  assert.equal(c.minimapSurrounding(map).enclosed, true);
  const decision = c.decide([{id:1,x:530,y:278.5,r:55,isThreat:true}], 32, 479, 278.5, null, {}, map);
  assert.equal(decision.reason, 'threat');
  assert(decision.dir.x < 0);
});
test('nearby food cannot interrupt minimap evacuation', () => {
  const c = controller(), decision = c.decide([{id:1,x:530,y:278.5,r:14}], 32, 479, 278.5, null, {}, denseEast);
  assert.equal(decision.title, '持續撤離大型史萊姆聚集區');
  assert.equal(c.targetTrackId, null);
  assert.equal(decision.urgent, true);
  assert(decision.dir.x < 0);
  const goal = {x:decision.evacuation.goal.x*denseEast.width,y:decision.evacuation.goal.y*denseEast.height};
  assert(c.minimapClusterState(denseEast, goal).clear);
  assert(Math.hypot(goal.x-denseEast.player.x,goal.y-denseEast.player.y) > denseEast.width*.06);
});
test('an open nearby turn does not release evacuation before reaching clear space', () => {
  const c = controller();
  const initial = c.decide([], 32, 479, 278.5, null, {}, denseEast);
  const moved = {...denseEast,player:{x:65,y:50}}, food = [{id:1,x:530,y:278.5,r:14}];
  assert.equal(c.minimapSurrounding(moved).enclosed, false);
  assert.equal(c.minimapClusterState(moved).nearby, 0);
  assert.equal(c.minimapClusterState(moved).clear, false);
  const decision = c.decide(food, 32, 479, 278.5, initial.dir, {}, moved);
  assert(decision.evacuation);
  assert(decision.dir.x < 0);
  assert.equal(JSON.stringify(decision.evacuation.goal), JSON.stringify(initial.evacuation.goal));
  assert.equal(c.targetTrackId, null);
});
test('three consecutive clear minimap frames release evacuation and resume nearby food', () => {
  const c = controller();c.decide([], 32, 479, 278.5, null, {}, denseEast);
  const clear = {...denseEast,player:{x:40,y:50}}, food = [{id:1,x:530,y:278.5,r:14}];
  assert(c.minimapClusterState(clear).clear);
  assert.equal(c.decide(food, 32, 479, 278.5, null, {}, clear).evacuation.clearFrames, 1);
  assert.equal(c.decide(food, 32, 479, 278.5, null, {}, clear).evacuation.clearFrames, 2);
  const released = c.decide(food, 32, 479, 278.5, null, {}, clear);
  assert.equal(released.title, '前往食物或小史萊姆');
  assert.equal(released.dir.name, '→ 東');
  assert.equal(released.confirmationFrames, 1);
});
test('one clear frame and a missing minimap cannot count as a completed evacuation', () => {
  const c = controller();c.decide([], 32, 479, 278.5, null, {}, denseEast);
  const clear = {...denseEast,player:{x:40,y:50}};
  assert.equal(c.decide([], 32, 479, 278.5, null, {}, clear).evacuation.clearFrames, 1);
  c.decide([], 32, 479, 278.5, null, {}, null);
  assert.equal(c.decide([], 32, 479, 278.5, null, {}, clear).evacuation.clearFrames, 1);
  assert.equal(c.decide([], 32, 479, 278.5, null, {}, denseEast).evacuation.clearFrames, 0);
});
test('moving threats invalidate an unsafe exit and produce a different clear destination', () => {
  const c = controller(), initial = c.decide([], 32, 479, 278.5, null, {}, denseEast);
  const invaded = {...denseEast,threats:[...denseEast.threats,{x:initial.evacuation.goal.x*144,y:initial.evacuation.goal.y*100}]};
  const changed = c.decide([], 32, 479, 278.5, initial.dir, {}, invaded);
  assert.notEqual(JSON.stringify(changed.evacuation.goal), JSON.stringify(initial.evacuation.goal));
  assert(c.minimapClusterState(invaded,{x:changed.evacuation.goal.x*144,y:changed.evacuation.goal.y*100}).clear);
});
test('near predators change the safe route without cancelling the minimap evacuation', () => {
  const c = controller();c.decide([], 32, 479, 278.5, null, {}, denseEast);
  const avoided = c.decide([{id:1,x:420,y:278.5,r:55,isThreat:true}], 32, 479, 278.5, null, {}, denseEast);
  assert.equal(avoided.reason, 'threat');
  assert.equal(avoided.title, '避敵並持續撤離聚集區');
  assert(avoided.dir.x > 0);
  assert(avoided.evacuation);
  const resumed = c.decide([], 32, 479, 278.5, avoided.dir, {}, denseEast);
  assert.equal(resumed.title, '持續撤離大型史萊姆聚集區');
  assert(resumed.dir.x < 0);
});
test('following the controller on a static crowded minimap reaches clear space before food resumes', () => {
  const c = controller(), map = {...denseEast,player:{...denseEast.player}}, food = [{id:1,x:530,y:278.5,r:14}];
  let previous = null, completed = false;
  for (let frame = 0; frame < 100; frame++) {
    const decision = c.decide(food, 32, 479, 278.5, previous, {}, map);
    if (!decision.evacuation) {assert(c.minimapClusterState(map).clear);assert(frame > 3);completed = true;break;}
    assert.equal(c.targetTrackId, null);
    map.player.x += decision.dir.x*1.5;map.player.y += decision.dir.y*1.5;
    assert(map.player.x >= 0 && map.player.x <= map.width && map.player.y >= 0 && map.player.y <= map.height);
    previous = decision.dir;
  }
  assert(completed, 'controller failed to leave the cluster');
});
test('starting a new game clears the previous minimap evacuation', () => {
  const {context:c} = runtime();c.decide([], 32, 479, 278.5, null, {}, denseEast);c.resetVision();
  const safe = {...denseEast,player:{x:40,y:50}};
  assert.equal(c.decide([{id:1,x:530,y:278.5,r:14}], 32, 479, 278.5, null, {}, safe).title, '前往食物或小史萊姆');
});
console.log(`${passed} OCR regression checks passed.`);
