/* grow-13: visible-evidence interception and short-horizon growth planning.
 * Inputs are the existing screenshot/HUD analysis; no game-state access.
 * The returned direction is always an actual keyboard octant (or a stop).
 * Integrator: on mapStatus === 'lost', release keys instead of calling move().
 * visualR is optional: retain the already-computed outer silhouette radius
 * in readImage to help reject an implausibly small highlight-radius estimate.
 */
function planGrow13(objects, r, map, speed, v, old, gameVersion) {
  const finite = Number.isFinite;
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const hypot = Math.hypot;
  const dirs = [
    {x: 1, y: 0, name: '東'}, {x: Math.SQRT1_2, y: Math.SQRT1_2, name: '東南'},
    {x: 0, y: 1, name: '南'}, {x: -Math.SQRT1_2, y: Math.SQRT1_2, name: '西南'},
    {x: -1, y: 0, name: '西'}, {x: -Math.SQRT1_2, y: -Math.SQRT1_2, name: '西北'},
    {x: 0, y: -1, name: '北'}, {x: Math.SQRT1_2, y: -Math.SQRT1_2, name: '東北'}
  ];
  const stop = reason => ({x: 0, y: 0, name: '等待可靠畫面', strategy: 'grow-13',
    mapStatus: 'lost', reason, gain: 0, clearance: 0, threats: 0, escaping: false,
    recovering: false, target: null});
  if (!Array.isArray(objects) || !finite(r) || r < 1 || !finite(speed) || speed <= 0)
    return stop('invalid-visible-input');
  if (map?.stale || finite(map?.observedAt) && typeof performance !== 'undefined' &&
      performance.now() - map.observedAt > 600) return stop('stale-visible-frame');
  v = {x: finite(v?.x) ? clamp(v.x, -600, 600) : 0,
    y: finite(v?.y) ? clamp(v.y, -600, 600) : 0};
  old = old || {x: 1, y: 0};
  const ox = finite(old.x) ? old.x : 1, oy = finite(old.y) ? old.y : 0;
  const cappedGame = /(?:^|\/)v2\.22(?:$|[/?#])/.test(String(gameVersion || ''));
  // HUD rounds radius. At displayed 186 the lower bound 185.5 exceeds 200/1.08.
  const immune = cappedGame && r >= 186;
  const playerLow = Math.max(1, r - .5), playerHigh = r + .5;
  const mapOK = finite(map?.player?.x) && finite(map?.player?.y) && map.width > 0 && map.height > 0;
  const pixelWorld = mapOK ? Math.max(10400 / map.width, 7200 / map.height) * (map.pixelRatio || 1) : 0;
  const mapPoint = m => ({x: (m.x - map.player.x) / map.width * 10400,
    y: (m.y - map.player.y) / map.height * 7200});
  const walls = [0, 1, 2, 3].map(i => {
    if (finite(map?.visibleWalls?.[i])) return Math.max(0, map.visibleWalls[i]);
    if (!mapOK) return Infinity;
    const p = map.player;
    return [p.x / map.width * 10400, (1 - p.x / map.width) * 10400,
      p.y / map.height * 7200, (1 - p.y / map.height) * 7200][i];
  });
  const wallReserve = r + Math.max(28, speed * .17);
  const recovering = walls.some(w => w < wallReserve);
  const source = objects.filter(o => o && finite(o.x) && finite(o.y) && finite(o.r) && o.r > 0);
  const foods = source.filter(o => !o.npc && !o.clipped && !o.blocked && o.r <= 22)
    .sort((a, b) => hypot(a.x, a.y) - hypot(b.x, b.y)).slice(0, 100);
  const bodies = [];
  // Keep a single larger description for coincident aliases, not duplicate meals.
  for (const o of source.filter(o => o.npc).sort((a, b) => b.r - a.r)) {
    if (bodies.some(q => hypot(q.x - o.x, q.y - o.y) < Math.max(12, Math.min(q.r, o.r) * .32))) continue;
    const reliable = o.localReliable === true;
    const error = Math.max(reliable ? 1.4 : 2.5, o.r * (reliable ? .07 : o.labelSeen ? .10 : .15));
    let lower = Math.max(1, o.r - error), upper = o.r + error;
    if (finite(o.rUpper)) upper = Math.max(upper, o.rUpper);
    if (finite(o.rLower)) lower = Math.min(lower, Math.max(1, o.rLower));
    if (finite(o.visualR) && o.visualR > 0) {
      upper = Math.max(upper, o.visualR * .88);
      lower = Math.max(lower, o.visualR * .72);
    }
    if (o.clipped) upper = Math.max(upper, o.dangerRadius || 0, o.r + 45);
    if (cappedGame) { lower = Math.min(200, lower); upper = Math.min(200, upper); }
    bodies.push({...o, lower, upper, vx: finite(o.vx) ? clamp(o.vx, -200, 200) : 0,
      vy: finite(o.vy) ? clamp(o.vy, -200, 200) : 0, mapRed: false});
  }
  const reds = [];
  if (mapOK && !immune) {
    const markers = [...(map.growMarkers || []).filter(m => m.red === true), ...(map.threats || [])];
    for (const m of markers) {
      if (!finite(m.x) || !finite(m.y)) continue;
      const p = mapPoint(m);
      if (reds.some(q => hypot(q.x - p.x, q.y - p.y) < Math.max(55, pixelWorld * 1.6))) continue;
      const match = bodies.map(o => ({o, d: hypot(o.x - p.x, o.y - p.y)}))
        .sort((a, b) => a.d - b.d)[0];
      if (match && match.d < Math.max(95, pixelWorld * 1.5, match.o.upper * .7)) {
        match.o.mapRed = true;
        // A clipped fragment's centroid need not be the NPC centre.
        if (match.o.clipped) { match.o.x = p.x; match.o.y = p.y; }
        reds.push({...p, matched: true});
      } else {
        const areaRadius = Math.sqrt(Math.max(1, m.area || 4) / Math.PI) /
          (map.pixelRatio || 1) * 38;
        const body = cappedGame ? 200 : Math.max(114, r * 1.12, areaRadius) + 25;
        reds.push({...p, matched: false, upper: body,
          uncertainty: Math.max(20, pixelWorld * .65)});
      }
    }
  }
  const hazards = [], meals = [];
  let neutralCount = 0, uncertainCount = 0;
  const gainFor = body => Math.min(Math.max(0, 200 - r),
    .75 * (Math.sqrt(r * r + .55 * body * body) - r));
  for (const o of bodies) {
    const red = o.isRed || o.mapRed;
    if (red && !immune) o.upper = Math.max(o.upper, Math.min(cappedGame ? 200 : Infinity, playerHigh * 1.12));
    o.edible = !o.clipped && !o.blocked && !red && o.upper * 1.08 <= playerLow;
    if (o.edible) meals.push({...o, growth: gainFor(Math.min(o.r, o.upper)), food: false});
    if (immune || o.upper < playerLow * 1.08) { if (!o.edible) neutralCount++; continue; }
    const chance = red || o.clipped ? 1 : clamp((o.upper - playerLow * 1.08) /
      Math.max(2, o.upper - o.lower), .12, 1);
    const hard = red || o.clipped || chance >= .45;
    if (!hard) uncertainCount++;
    hazards.push({...o, hard, weight: hard ? 1 : chance * .8,
      buffer: o.clipped ? 22 : 10, mapOnly: false});
  }
  for (const o of reds) if (!o.matched) hazards.push({...o, hard: true,
    weight: .65, buffer: o.uncertainty, mapOnly: true, vx: 0, vy: 0});
  // Unseen distant red dots cannot veto every local direction.
  const localHazards = hazards.filter(o => hypot(o.x, o.y) <
    .72 * (r + o.upper) + speed * 2.5 + 240)
    .sort((a, b) => (hypot(a.x, a.y) - .72 * (r + a.upper)) -
      (hypot(b.x, b.y) - .72 * (r + b.upper))).slice(0, 36);
  for (const o of foods) meals.push({...o, vx: 0, vy: 0,
    growth: Math.min(200 - r, Math.max(.38, Math.min(13, o.r) * .035)), food: true});
  const oldTarget = old.target;
  function intercept(o, maxTime = 6) {
    const contact = o.npc ? .68 * (r + Math.min(o.r, o.upper || o.r)) : r + .45 * o.r;
    for (let t = .1; t <= maxTime; t += .1) {
      if (hypot(o.x + (o.vx || 0) * t, o.y + (o.vy || 0) * t) <=
          contact + speed * Math.max(0, t - .12)) return t;
    }
    return Infinity;
  }
  function corridorPressure(o, eta) {
    const tx = o.x + (o.vx || 0) * Math.min(eta, 1.5), ty = o.y + (o.vy || 0) * Math.min(eta, 1.5);
    const len2 = tx * tx + ty * ty;
    let p = 0;
    for (const h of localHazards) {
      const u = clamp((h.x * tx + h.y * ty) / Math.max(1, len2), 0, 1);
      const gap = hypot(h.x - tx * u, h.y - ty * u) - .72 * (r + h.upper) - h.buffer;
      if (gap < 80) p += h.weight * (gap < 0 ? 1.8 : (80 - gap) / 100);
    }
    return p;
  }
  const goals = [];
  for (const o of meals) {
    if (o.food) continue;
    const eta = intercept(o);
    if (!finite(eta) || eta > 3 && o.growth < 1.1) continue;
    const continuity = oldTarget?.npc && !oldTarget.mapOnly &&
      hypot(oldTarget.x - o.x, oldTarget.y - o.y) < Math.max(80, r) ? 1.13 : 1;
    const pressure = corridorPressure(o, eta);
    goals.push({...o, eta, utility: o.growth / (eta + .55) * continuity / (1 + pressure), mapOnly: false});
  }
  goals.sort((a, b) => b.utility - a.utility);
  goals.splice(5);
  // White dots are scouting destinations only. A body must be observed and
  // classified before it can contribute a predicted swallow/growth reward.
  if (mapOK) {
    const dots = Array.isArray(map.growMarkers) ? map.growMarkers.filter(m => m.red === false) : map.opportunities || [];
    const hw = (map.viewWidth || 1200) * .5, hh = (map.viewHeight || 700) * .5;
    const scouts = [];
    for (const m of dots) {
      if (!finite(m.x) || !finite(m.y)) continue;
      const p = mapPoint(m), distance = hypot(p.x, p.y);
      if (distance < 300 || distance > speed * 8 + r ||
          Math.abs(p.x) < hw * .85 && Math.abs(p.y) < hh * .85 ||
          bodies.some(o => hypot(o.x - p.x, o.y - p.y) < Math.max(100, o.upper * .65))) continue;
      const estimate = Math.min(r * .8, Math.sqrt(Math.max(2, m.area || 4) / Math.PI) /
        (map.pixelRatio || 1) * 38);
      const eta = distance / speed, pressure = corridorPressure(p, eta);
      const utility = clamp(gainFor(estimate) * .42 / (eta + .8), .10, 1.45) / (1 + pressure);
      scouts.push({...p, r: estimate, npc: true, mapOnly: true, vx: 0, vy: 0,
        growth: 0, eta, utility, pursuitOnly: true});
    }
    scouts.sort((a, b) => b.utility - a.utility);
    goals.push(...scouts.slice(0, 3));
  }
  // Include a few real food targets so an empty NPC view does not mean drifting.
  for (const o of foods.slice(0, 12)) {
    const eta = intercept(o, 3);
    if (finite(eta)) goals.push({...o, npc: false, mapOnly: false, eta,
      utility: Math.max(.38, Math.min(13, o.r) * .035) / (eta + .65)});
  }
  goals.sort((a, b) => b.utility - a.utility);
  const targets = goals.slice(0, 7);
  const reachableMeals = meals.filter(o => hypot(o.x, o.y) < speed * 2.5 + r + o.r).slice(0, 100);
  const oldModeEscape = old.escaping === true;
  const startHazardGap = localHazards.filter(o => o.hard).reduce((g, o) =>
    Math.min(g, hypot(o.x, o.y) - .72 * (r + o.upper) - o.buffer), 1e6);
  const paths = [];
  const dt = .1, follow = 1 - Math.exp(-4.2 * dt), steps = 22, turnAt = 6;
  for (let first = 0; first < 8; first++) for (let second = 0; second < 8; second++) {
    let x = 0, y = 0, vx = v.x, vy = v.y, gain = 0, growth = 0, risk = 0;
    let clearance = 1e6, immediateGap = 1e6, endGap = 1e6, wallOK = true, wallCost = 0;
    const picked = new Set();
    for (let k = 1; k <= steps; k++) {
      const t = k * dt, d = dirs[k <= turnAt ? first : second];
      vx += (d.x * speed - vx) * follow; vy += (d.y * speed - vy) * follow;
      x += vx * dt; y += vy * dt;
      const change = [x, -x, y, -y];
      for (let i = 0; i < 4; i++) if (finite(walls[i])) {
        const distance = walls[i] + change[i];
        const hardFloor = Math.min(walls[i], r + 14);
        if (distance < hardFloor - 2) wallOK = false;
        wallCost += Math.max(0, (wallReserve - distance) / Math.max(40, wallReserve)) ** 2 / steps;
      }
      endGap = 1e6;
      for (const h of localHazards) {
        const hx = h.x + (h.vx || 0) * t, hy = h.y + (h.vy || 0) * t;
        const gap = hypot(hx - x, hy - y) - .72 * (playerHigh + h.upper) - h.buffer;
        if (h.hard) {
          if (t <= 1.6) clearance = Math.min(clearance, gap);
          if (t <= .6) immediateGap = Math.min(immediateGap, gap);
          endGap = Math.min(endGap, gap);
        }
        risk += h.weight * Math.max(0, 1 - gap / 85) ** 2 / steps;
      }
      for (let i = 0; i < reachableMeals.length; i++) {
        if (picked.has(i)) continue;
        const o = reachableMeals[i], contact = o.food ? r + .45 * o.r : .68 * (r + o.r);
        if (hypot(o.x + (o.vx || 0) * t - x, o.y + (o.vy || 0) * t - y) < contact) {
          picked.add(i); const g = Math.min(Math.max(0, 200 - r - growth), o.growth);
          growth += g; gain += g / (t + .65);
        }
      }
    }
    let approach = 0, target = null;
    for (const o of targets) {
      const before = hypot(o.x, o.y), after = hypot(o.x + (o.vx || 0) * 1.4 - x, o.y + (o.vy || 0) * 1.4 - y);
      const captured = !o.mapOnly && [...picked].some(i => {
        const meal = reachableMeals[i];
        return !!meal.npc === !!o.npc && Math.abs(meal.x - o.x) < 1e-6 && Math.abs(meal.y - o.y) < 1e-6;
      });
      // Reaching a target is full progress. Scoring only the endpoint would
      // perversely reward waiting/turning away instead of taking an early meal.
      const progress = captured ? 1 : clamp((before - after) / Math.max(speed * .8, before), -.6, 1);
      const value = o.utility * progress;
      if (value > approach) { approach = value; target = o; }
    }
    const d = dirs[first], maintain = d.x * ox + d.y * oy;
    const momentum = speed ? (d.x * v.x + d.y * v.y) / speed : 0;
    // With no useful target, keep moving to reveal new food/NPCs. Do not
    // accumulate an arbitrary search-direction preference when targets exist.
    const explore = targets.length ? 0 : .35 * maintain + .15 * momentum;
    const score = gain * 2 + approach * 4.2 - risk * 12 - wallCost * 7 +
      maintain * .13 + (first === second ? .04 : 0) + explore;
    paths.push({...d, first, second, score, gain: growth, discountedGain: gain,
      approach, target, clearance, immediateGap, endGap, wallOK, wallCost, risk,
      endX: x, endY: y});
  }
  const bounded = paths.filter(p => p.wallOK);
  const safe = bounded.filter(p => p.clearance > (oldModeEscape ? 14 : 4));
  let chosen, escaping = false;
  if (safe.length) {
    safe.sort((a, b) => b.score - a.score || b.clearance - a.clearance);
    chosen = safe[0];
  } else {
    escaping = true;
    // A shared initial overlap must not make all paths tie and flip randomly.
    // Favour a viable immediate trajectory, then opening distance at its end.
    const pool = bounded.length ? bounded : paths;
    let fx = 0, fy = 0;
    for (const h of localHazards.filter(o => o.hard)) {
      const distance = hypot(h.x, h.y) || 1;
      const weight = 1 / Math.max(60, distance - .72 * (r + h.upper));
      fx -= h.x / distance * weight; fy -= h.y / distance * weight;
    }
    const fl = hypot(fx, fy) || 1;
    const escapeScore = p => clamp(p.immediateGap, -160, 120) * .7 +
      clamp(p.endGap - startHazardGap, -500, 500) * .8 - p.wallCost * 40 +
      (p.x * fx + p.y * fy) / fl * 22 + (p.x * ox + p.y * oy) * 6;
    pool.sort((a, b) => escapeScore(b) - escapeScore(a) || b.score - a.score);
    chosen = pool[0];
  }
  const target = chosen.target && {...chosen.target};
  return {...chosen, target, strategy: 'grow-13', mapStatus: mapOK ? 'visible' : 'main-view',
    reason: escaping ? 'escape' : immune ? 'cap200-finish' : target?.mapOnly ? 'scout-visible-dot' :
      target?.npc ? 'intercept-growth' : 'food-and-exploration',
    threats: localHazards.length, escaping, recovering, immune,
    eligibleNpc: meals.filter(o => !o.food).length, neutralNpc: neutralCount,
    uncertainNpc: uncertainCount, scoutTargets: targets.filter(o => o.mapOnly).length,
    wallKnown: walls.filter(finite).length, projectedR: r + chosen.gain};
}

if (typeof module !== 'undefined' && module.exports) module.exports = {planGrow13};
