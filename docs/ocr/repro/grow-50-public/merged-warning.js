// Recover one visible predator only when its body has merged into the player
// component.  This reads rendered name/warning pixels; it does not inspect game
// objects.  The v2.22 renderer places the name at the NPC centre and the
// warning one radius plus 12 pixels above it (glyph-centre to glyph-centre).
function mergedWarningActors50(image, w, h, ratio, playerRadius, rawParts, retainedParts) {
  if (!image?.data || !Number.isFinite(playerRadius) || playerRadius <= 0 ||
      !Array.isArray(rawParts) || !Array.isArray(retainedParts)) return [];
  const data = image.data, scale = Math.max(.5, Number.isFinite(ratio) ? ratio : 1);
  // The translucent warning is composited over the NPC body before the
  // controller's QHD readback is downscaled.  Use its channel deltas so the
  // glyph remains visible on tan/grey bodies, then require the name pairing.
  const dangerPixel = i => data[i] > 150 && data[i + 1] > 105 && data[i + 2] > 95 &&
    data[i] - data[i + 1] > 25 && data[i + 1] - data[i + 2] >= 0 &&
    data[i + 1] - data[i + 2] < 30;
  const namePixel = i => Math.min(data[i], data[i + 1], data[i + 2]) > 200 &&
    Math.max(data[i], data[i + 1], data[i + 2]) -
      Math.min(data[i], data[i + 1], data[i + 2]) < 40;
  const playerParts = rawParts.filter(p => isPlayerComponent(p, playerRadius, w / 2, h / 2));
  if (!playerParts.length) return [];
  const pad = 18 * scale;
  const left = Math.max(0, Math.floor(Math.min(...playerParts.map(p => p.x - p.r * 1.08)) - pad));
  const right = Math.min(w, Math.ceil(Math.max(...playerParts.map(p => p.x + p.r * 1.08)) + pad));
  const top = Math.max(0, Math.floor(Math.min(...playerParts.map(p => p.y - p.r * 1.18)) - pad));
  const bottom = Math.min(h, Math.ceil(Math.max(...playerParts.map(p => p.y + p.r * 1.08)) + pad));
  const roiWidth = right - left, roiHeight = bottom - top;
  if (roiWidth < 1 || roiHeight < 1 || roiWidth * roiHeight > 1200000) return [];

  function glyphs(predicate) {
    const n = roiWidth * roiHeight, mask = new Uint8Array(n), seen = new Uint8Array(n), queue = new Int32Array(n);
    for (let y = 0; y < roiHeight; y++) for (let x = 0; x < roiWidth; x++) {
      const p = y * roiWidth + x, i = ((top + y) * w + left + x) * 4;
      if (predicate(i)) mask[p] = 1;
    }
    const out = [];
    for (let seed = 0; seed < n; seed++) {
      if (!mask[seed] || seen[seed]) continue;
      let head = 0, tail = 0, area = 0, sx = 0, sy = 0;
      let minX = w, minY = h, maxX = 0, maxY = 0;
      queue[tail++] = seed; seen[seed] = 1;
      while (head < tail) {
        const q = queue[head++], rx = q % roiWidth, ry = (q / roiWidth) | 0;
        const x = left + rx, y = top + ry;
        area++; sx += x + .5; sy += y + .5;
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = rx + dx, ny = ry + dy;
          if (nx < 0 || nx >= roiWidth || ny < 0 || ny >= roiHeight) continue;
          const k = ny * roiWidth + nx;
          if (mask[k] && !seen[k]) { seen[k] = 1; queue[tail++] = k; }
        }
      }
      const bw = maxX - minX + 1, bh = maxY - minY + 1;
      if (area <= 120 * scale * scale && bw <= 18 * scale && bh <= 18 * scale)
        out.push({x: sx / area, y: sy / area, area, minX, maxX, minY, maxY});
    }
    return out;
  }

  function runs(predicate, minArea) {
    const pieces = glyphs(predicate).sort((a, b) => a.minX - b.minX || a.minY - b.minY);
    const runs = [];
    for (const piece of pieces) {
      let best = null, bestGap = Infinity;
      for (const run of runs) {
        const overlap = Math.min(run.maxY, piece.maxY) - Math.max(run.minY, piece.minY) + 1;
        const gap = piece.minX > run.maxX ? piece.minX - run.maxX - 1 :
          run.minX > piece.maxX ? run.minX - piece.maxX - 1 : 0;
        if (overlap >= -2 * scale && gap <= 5 * scale && gap < bestGap) { best = run; bestGap = gap; }
      }
      if (!best) {
        runs.push({...piece, pieces: 1, sx: piece.x * piece.area, sy: piece.y * piece.area});
      } else {
        best.area += piece.area; best.sx += piece.x * piece.area; best.sy += piece.y * piece.area;
        best.minX = Math.min(best.minX, piece.minX); best.maxX = Math.max(best.maxX, piece.maxX);
        best.minY = Math.min(best.minY, piece.minY); best.maxY = Math.max(best.maxY, piece.maxY);
        best.pieces++;
      }
    }
    return runs.map(r => ({...r, x: r.sx / r.area, y: r.sy / r.area,
      width: r.maxX - r.minX + 1, height: r.maxY - r.minY + 1}))
      .filter(r => r.area >= minArea * scale * scale && r.width >= 5 * scale &&
        r.width <= 42 * scale && r.height >= 3 * scale && r.height <= 16 * scale);
  }

  const warnings = runs(dangerPixel, 3), names = runs(namePixel, 5);
  const recovered = [];
  for (const warning of warnings) {
    let match = null, score = Infinity;
    for (const name of names) {
      const dy = name.y - warning.y, radius = dy - 12 * scale;
      if (Math.abs(name.x - warning.x) > 18 * scale || radius < playerRadius * 1.075 ||
          radius > 205 * scale) continue;
      const value = Math.abs(name.x - warning.x) + Math.abs(radius - Math.min(200 * scale, radius)) * .02;
      if (value < score) { score = value; match = {name, radius}; }
    }
    if (!match) continue;
    const x = match.name.x, y = match.name.y, radius = match.radius;
    const merged = playerParts.some(p => Math.hypot(x - p.x, y - p.y) <= p.r * 1.04);
    if (!merged) continue;
    if (retainedParts.some(p => p.r >= Math.max(20 * scale, playerRadius * .25) &&
        Math.hypot(x - p.x, y - p.y) <= Math.max(28 * scale, radius * .42))) continue;
    if (recovered.some(p => Math.hypot(x - p.x, y - p.y) <= Math.max(16 * scale, radius * .25))) continue;
    recovered.push({x, y, r: radius, visualR: radius, originalRadius: radius,
      npc: true, labelSeen: true, localReliable: false, stalled: 0, blocked: false,
      isRed: true, clipped: false, dangerRadius: radius, vx: 0, vy: 0,
      geometryAccepted: 0, confidence: null, mergedWarning50: true});
  }
  return recovered;
}

if (typeof module !== 'undefined' && module.exports) module.exports = {mergedWarningActors50};
