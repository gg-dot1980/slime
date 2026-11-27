'use strict';
// Offline synthetic raster check. This does not start a browser or game.
// Run from any directory: node perception-check.cjs
// Optional first capture: node perception-check.cjs --write
// Uses @napi-rs/canvas 0.1.100 via normal Node/NODE_PATH resolution, or
// CODEX_PRIMARY_RUNTIME_NODE_MODULES. No image or pixel data is written.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '../../../..');
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const sourceManifest = [
  ['src/game-v2.13.html', '94944ef137412e93817754791c64cf7803a94f25222a8922fe8aa6936ea46d97'],
  ['src/game.html', 'd0349b70c0be4666142f0ed880adb1b1636bcd6d7bf32a13d0d90246899c6d14'],
  ['docs/ocr/repro/grow-24-public/ocr-grow24.html', 'f276dd1b6dd340c142f00027adf2ddeefc394c74db772edf814cd6f9445f6347'],
  ['docs/ocr/repro/grow-25-public/ocr-grow25.html', '2abdc689ee0e94bfc6e25170c3568dad90d0151e5e1499a7fe0b702584f348d2']
];

function loadRenderer() {
  let entry;
  try { entry = require.resolve('@napi-rs/canvas'); }
  catch (original) {
    const modules = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
    if (!modules) throw Error('@napi-rs/canvas 0.1.100 is required; use NODE_PATH or CODEX_PRIMARY_RUNTIME_NODE_MODULES.');
    entry = require.resolve(path.join(modules, '@napi-rs/canvas'));
  }
  const version = JSON.parse(fs.readFileSync(path.join(path.dirname(entry), 'package.json'), 'utf8')).version;
  assert.equal(version, '0.1.100', 'Different rasterizer version: retain a separate observation instead of comparing as identical.');
  return {createCanvas: require(entry).createCanvas, version};
}

function extract(text, name, endMarker) {
  const start = text.indexOf('function ' + name + '(');
  const end = text.indexOf(endMarker, start);
  assert(start >= 0 && end > start, 'Function extraction failed: ' + name);
  const code = text.slice(start, end);
  return {fn: new Function(code + '\nreturn ' + name + ';')(), sha256: sha256(code)};
}

function minimap(text) {
  const marker = '// minimap\n';
  const start = text.indexOf(marker);
  const end = text.indexOf('\n}\nfunction loop', start);
  assert(start >= 0 && end > start, 'Original minimap extraction failed');
  return text.slice(start + marker.length, end);
}

function main() {
  assert(process.argv.slice(2).every(arg => arg === '--write'), 'Only --write is supported');
  const source = {};
  const sources = sourceManifest.map(([name, expected]) => {
    const bytes = fs.readFileSync(path.join(root, name));
    assert.equal(sha256(bytes), expected, 'Frozen source mismatch: ' + name);
    source[name] = bytes.toString('utf8');
    return {path: name, bytes: bytes.length, sha256: expected};
  });
  const {createCanvas, version} = loadRenderer();
  const candidate = source[sourceManifest[3][0]], parent = source[sourceManifest[2][0]];
  const detector = extract(candidate, 'detectMinimap', 'function hasSlimeLabel(');
  const markerReader = extract(candidate, 'growMarkers', 'function growMapInputs(');
  const after = extract(candidate, 'planGrow25', '\nif (typeof module');
  const before = extract(parent, 'planGrow23', '\nif (typeof module');
  const drawSource = minimap(source['src/game.html']);
  assert.equal(drawSource, minimap(source['src/game-v2.13.html']), 'Original minimap drawing differs by game version');
  const draw = new Function('ctx', 'vw', 'vh', 'W', 'H', 'slimes', 'cam', 'player', 'isTraditional', drawSource);
  const sizes = [[660, 384], [710, 413], [634, 734], [973, 566], [1050, 610]];
  const phases = [0, .25, .5, .75];
  const distances = [150, 200, 250, 275, 299, 500];
  const count = () => ({scenes: 0, mapLost: 0, nearScenes: 0, nearWithWhiteMarker: 0,
    farScenes: 0, farWithWhiteMarker: 0, nearScoutSelected: 0, plannerChanged: 0});
  const total = count(), perViewport = [], examples = [], normalized = value => JSON.stringify({...value, strategy: 'same'});
  for (const [width, height] of sizes) {
    const stats = count(), canvas = createCanvas(width, height), ctx = canvas.getContext('2d');
    for (const phase of phases) for (const distance of distances) for (let angle = 0; angle < 16; angle++) {
      const theta = angle * Math.PI / 8;
      const player = {x: 5200 + phase / 144 * 10400, y: 3600 + phase / (144 * 9 / 13) * 7200, r: 95};
      const slimes = [{x: player.x + Math.cos(theta) * distance, y: player.y + Math.sin(theta) * distance, r: 25}];
      ctx.fillStyle = '#101820'; ctx.fillRect(0, 0, width, height);
      draw(ctx, width, height, 10400, 7200, slimes, {x: player.x - width / 2, y: player.y - height / 2}, player, true);
      // Pixel buffers remain in memory only and are never serialized or saved.
      const image = ctx.getImageData(0, 0, width, height);
      const map = detector.fn(image, width, height, 1);
      stats.scenes++;
      if (!map) { stats.mapLost++; continue; }
      map.growMarkers = markerReader.fn(image, width, height, map);
      map.viewWidth = width; map.viewHeight = height;
      const whites = map.growMarkers.filter(marker => marker.red === false);
      if (distance < 300) { stats.nearScenes++; if (whites.length) stats.nearWithWhiteMarker++; }
      else { stats.farScenes++; if (whites.length) stats.farWithWhiteMarker++; }
      let selectedNear = false, changed = false;
      if (whites.length) {
        const args = [[], 95, map, 250, {x: 0, y: 0}, {x: 1, y: 0}, 'v2.22'];
        const oldDecision = before.fn(...args), newDecision = after.fn(...args);
        selectedNear = !!newDecision.target?.nearScout;
        changed = normalized(oldDecision) !== normalized(newDecision);
        if (selectedNear) stats.nearScoutSelected++;
        if (changed) stats.plannerChanged++;
      }
      if (phase === 0 && angle === 12 && [275, 500].includes(distance)) {
        examples.push({canvas: [width, height],phase, angleIndex: angle, direction: 'north',
          distance, playerMap: map.player, whiteMarkers: whites.map(({x, y, area}) => ({x, y, area})),
          nearScoutSelected: selectedNear, plannerChanged: changed});
      }
    }
    perViewport.push({canvas: [width, height], ...stats});
    for (const key of Object.keys(total)) total[key] += stats[key];
  }
  assert.equal(total.scenes, 1920);
  assert.equal(total.mapLost, 0);
  assert.equal(total.nearScenes, 1600);
  assert.equal(total.nearWithWhiteMarker, 0, 'Near-dot perception counterexample no longer reproduces');
  assert.equal(total.farScenes, 320);
  assert.equal(total.farWithWhiteMarker, 4, 'Far control differs from the recorded independent rasterizer observation');
  assert.equal(total.nearScoutSelected, 0);
  assert.equal(total.plannerChanged, 0);
  const report = {
    schemaVersion: 1,
    kind: 'offline-synthetic-raster',
    status: 'reproduced-perception-counterexample',
    naturalStarts: 0,
    runtime: {node: process.version, renderer: '@napi-rs/canvas', rendererVersion: version},
    sourceCommit: '518833396d155a1f388d11c11f5d977739e76b5d',
    sources,
    extractedHashes: {minimap: sha256(drawSource), detector: detector.sha256, markerReader: markerReader.sha256,
      parentPlanner: before.sha256, candidatePlanner: after.sha256},
    settings: {canvasSizes: sizes, pixelRatio: 1, mapPixelPhases: phases, angles: 16,
      angleRule: 'angleIndex * PI / 8; screen y increases downward', distances,
      world: [10400, 7200], playerRadius: 95, npcRadius: 25, npcCount: 1,
      mapGeometry: 'Original game minimap fragment; v2.13 and v2.22 fragments identical',
      plannerGameVersion: 'v2.22', plannerObjects: [], plannerSpeed: 250, initialHeading: [1, 0],
      sceneMeaning: 'Only the original minimap is rasterized; known synthetic values are fixture inputs, not live game state.'},
    totals: total,
    perViewport,
    northExamples: examples,
    interpretation: 'In these fixed scenes, no 150–299-world-unit white dot survives growMarkers; the new nearScout planner branch has no reachable input. Existing hand-authored-map planner checks do not test this perception boundary.',
    limitations: [
      'Independent native rasterizer, not a Chrome screenshot or browser integration test.',
      'Synthetic Canvas sizes are fixture dimensions, not proof that a given external viewport produces them under the original responsive CSS.',
      'Finite positions, pixel phases, one NPC size, and one player size; this is not a proof for all rendered scenes or a measured natural-game detection rate.',
      'Far controls are reported in full: four accepted markers out of 320 fixtures. No accuracy or recall claim follows without broader labeled real frames.',
      'Planner comparisons run only when the actual raster detector returns a white marker; their equality is conditional and does not establish complete strategy equivalence.',
      'No browser, natural game, leaderboard, hidden live state, or network request is used; no pixels or image assets are saved.'
    ]
  };
  const serialized = JSON.stringify(report, null, 2) + '\n';
  if (process.argv.includes('--write')) {
    const destination = path.join(__dirname, 'perception-check.json');
    if (fs.existsSync(destination)) assert.equal(fs.readFileSync(destination, 'utf8'), serialized, 'Existing observation differs; do not overwrite it.');
    else fs.writeFileSync(destination, serialized, {flag: 'wx'});
  }
  process.stdout.write(serialized);
}

try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
