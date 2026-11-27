#!/usr/bin/env node
'use strict';
// Pure generated RGBA regression. No screenshots, browser, or game-state data.
// Usage: node experiments/grow15/check-minimap-next.cjs [candidate-page.html]
// Extracts the real detector functions from the supplied page (default: local index.html).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const sourcePath = process.argv[2] ? path.resolve(process.argv[2]) :
  path.resolve(__dirname, 'index.html');
const source = fs.readFileSync(sourcePath, 'utf8');
function extract(name, next) {
  const start = source.indexOf('function ' + name + '(');
  const end = source.indexOf('\nfunction ' + next + '(', start);
  assert(start >= 0 && end > start, 'Cannot locate actual source function ' + name);
  return source.slice(start, end);
}
const context = {};
vm.createContext(context);
vm.runInContext(extract('detectMinimap', 'hasSlimeLabel') + '\n' +
  extract('growMarkers', 'growMapInputs'), context, {filename: sourcePath});

function fixture(pixelRatio, includeGrey) {
  const w = 1200, h = 800;
  const width = Math.min(144 * pixelRatio, w * .26), height = width * 9 / 13;
  const mx = w - width - 15 * pixelRatio, my = 70 * pixelRatio;
  const W = Math.ceil(width), H = Math.ceil(height);
  const data = new Uint8ClampedArray(w * h * 4);
  function put(x, y, rgb) {
    const i = (Math.floor(my + y) * w + Math.floor(mx + x)) * 4;
    data[i] = rgb[0]; data[i + 1] = rgb[1]; data[i + 2] = rgb[2]; data[i + 3] = 255;
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) put(x, y, [32, 50, 56]);
  function disk(cx, cy, radius, rgb) {
    for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y++)
      for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x++)
        if ((x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2) put(x, y, rgb);
  }
  const player = {x: Math.round(W * .35), y: Math.round(H * .52)};
  const white = {x: Math.round(W * .65), y: Math.round(H * .25)};
  const red = {x: Math.round(W * .78), y: Math.round(H * .77)};
  disk(player.x, player.y, 3 * pixelRatio, [163, 243, 209]);
  disk(white.x, white.y, 2.5 * pixelRatio, [211, 238, 225]);
  disk(red.x, red.y, 2.5 * pixelRatio, [255, 138, 126]);
  // An exposed corner fragment of the visible camera rectangle. Its colour
  // is exactly the current renderer's #8ba3aa, not the NPC white #d3eee1.
  const gx = player.x + Math.round(12 * pixelRatio), gy = player.y - Math.round(6 * pixelRatio);
  const side = Math.max(3, Math.round(4 * pixelRatio));
  const stroke = Math.max(1, Math.round(1.5 * pixelRatio));
  const greyPoints = [];
  if (includeGrey) for (let y = 0; y < side; y++) for (let x = 0; x < side; x++) {
    if (x < stroke || y < stroke) { put(gx + x, gy + y, [139, 163, 170]); greyPoints.push([gx + x, gy + y]); }
  }
  const grey = greyPoints.length ? {
    x: greyPoints.reduce((n, p) => n + p[0], 0) / greyPoints.length,
    y: greyPoints.reduce((n, p) => n + p[1], 0) / greyPoints.length
  } : null;
  return {image: {data}, w, h, player, white, red, grey};
}

const results = [];
for (const q of [1, .6]) {
  const control = fixture(q, false), f = fixture(q, true);
  const baseline = context.detectMinimap(control.image, control.w, control.h, q);
  const map = context.detectMinimap(f.image, f.w, f.h, q);
  assert(map?.player && baseline?.player, 'Fixture must establish the visible green player');
  const near = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) <= Math.max(2, q * 2);
  assert(near(map.player, f.player), 'Player position remains correctly identified');
  assert(map.opportunities.some(p => near(p, f.grey)),
    'The broad detector must reproduce acceptance of the grey camera fragment');
  assert.equal(map.opportunities.length, baseline.opportunities.length + 1,
    'Adding one camera fragment creates exactly one spurious broad opportunity');
  const markers = context.growMarkers(f.image, f.w, f.h, map);
  assert(!markers.some(p => near(p, f.grey)), 'Strict markers must reject the grey camera fragment');
  assert(markers.some(p => !p.red && near(p, f.white)), 'Strict markers must preserve a real white NPC dot');
  assert(markers.some(p => p.red && near(p, f.red)), 'Strict markers must preserve a real red NPC dot');
  assert(!markers.some(p => near(p, f.player)), 'The green player must not become a target');
  results.push({pixelRatio: q, broadWhiteOpportunities: map.opportunities.length,
    extraGreyOpportunity: 1, strictWhite: markers.filter(p => !p.red).length,
    strictRed: markers.filter(p => p.red).length, strictGrey: 0});
}
console.log(JSON.stringify({source: path.relative(process.cwd(), sourcePath),
  result: 'PASS', fixtures: results, scope: 'generated RGBA detector regression; not gameplay success'}, null, 2));
