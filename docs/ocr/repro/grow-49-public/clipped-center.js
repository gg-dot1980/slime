// Estimate only the coordinate normal to one cropped edge. The original
// radius, tangential coordinate and clipped hazard classification remain in use.
function clippedCenter49(rgb, w, h, step, queue, count, cols, bounds, masks, part, playerRadius) {
  const {left, right, top, bottom} = bounds;
  const touches = [left === 0, right === cols - 1, top === 0, bottom === Math.ceil(h / step) - 1];
  if (touches.filter(Boolean).length !== 1 || part.r < 16 * step) return null;
  const x0 = left * step, x1 = (right + 1) * step, y0 = top * step, y1 = (bottom + 1) * step;
  if (masks.some(m => x1 >= m.x - step && x0 <= m.x + m.w + step &&
                      y1 >= m.y - step && y0 <= m.y + m.h + step)) return null;
  const playerDx = Math.max(x0 - w / 2, w / 2 - x1, 0);
  const playerDy = Math.max(y0 - h / 2, h / 2 - y1, 0);
  if (Math.hypot(playerDx, playerDy) <= playerRadius + 2 * step) return null;

  const vertical = touches[2] || touches[3];
  const low = touches[0] || touches[2];
  const tangentSpan = vertical ? part.bw : part.bh;
  const normalSpan = vertical ? part.bh : part.bw;
  if (normalSpan < tangentSpan * .48 || normalSpan > tangentSpan * 1.05) return null;

  // Take the bounding silhouette of the actual connected component. Interior
  // names, highlights and small holes cannot contribute false rim points.
  const rowCount = bottom - top + 1, colCount = right - left + 1;
  const rowLeft = new Int32Array(rowCount).fill(cols), rowRight = new Int32Array(rowCount).fill(-1);
  const colTop = new Int32Array(colCount).fill(Math.ceil(h / step)), colBottom = new Int32Array(colCount).fill(-1);
  const colors = new Map();
  let dominant = 0, sampled = 0;
  const stride = Math.max(1, Math.floor(count / 256));
  for (let i = 0; i < count; i++) {
    const cell = queue[i], x = cell % cols, y = Math.floor(cell / cols);
    rowLeft[y - top] = Math.min(rowLeft[y - top], x);
    rowRight[y - top] = Math.max(rowRight[y - top], x);
    colTop[x - left] = Math.min(colTop[x - left], y);
    colBottom[x - left] = Math.max(colBottom[x - left], y);
    if (i % stride === 0) {
      const index = (y * step * w + x * step) * 4;
      const color = (rgb[index] << 16) | (rgb[index + 1] << 8) | rgb[index + 2];
      const hits = (colors.get(color) || 0) + 1;
      colors.set(color, hits);
      dominant = Math.max(dominant, hits);
      sampled++;
    }
  }
  if (dominant < sampled * .85) return null;

  const rim = [];
  function addCell(x, y) {
    if (x < left || x > right || y < top || y > bottom) return;
    const normalCell = vertical ? y : x;
    const last = vertical ? Math.ceil(h / step) - 1 : cols - 1;
    if ((low ? normalCell : last - normalCell) <= 1) return;
    rim.push([x * step, y * step]);
  }
  const rowStride = Math.max(1, Math.ceil(rowCount / 32));
  const colStride = Math.max(1, Math.ceil(colCount / 32));
  for (let i = 0; i < rowCount; i += rowStride) {
    addCell(rowLeft[i], top + i);
    addCell(rowRight[i], top + i);
  }
  for (let i = 0; i < colCount; i += colStride) {
    addCell(left + i, colTop[i]);
    addCell(left + i, colBottom[i]);
  }
  if (rim.length < 24) return null;
  // Least-squares circle fit, centred on the sample mean for conditioning.
  let mx = 0, my = 0;
  for (const [x, y] of rim) { mx += x; my += y; }
  mx /= rim.length; my /= rim.length;
  let xx = 0, yy = 0, xy = 0, xz = 0, yz = 0;
  for (const [x, y] of rim) {
    const dx = x - mx, dy = y - my, z = dx * dx + dy * dy;
    xx += dx * dx; yy += dy * dy; xy += dx * dy; xz += dx * z; yz += dy * z;
  }
  const det = xx * yy - xy * xy;
  if (det <= .05 * xx * yy || det <= 0) return null;
  const cx = mx + (xz * yy - yz * xy) / (2 * det);
  const cy = my + (yz * xx - xz * xy) / (2 * det);
  const distances = rim.map(([x, y]) => Math.hypot(x - cx, y - cy));
  const radius = distances.reduce((sum, d) => sum + d, 0) / distances.length;
  if (Math.abs(radius - tangentSpan / 2) > .08 * radius) return null;
  const errors = distances.map(d => Math.abs(d - radius)).sort((a, b) => a - b);
  if (errors[Math.floor(errors.length * .95)] > .055 * radius + step / 2 ||
      errors.at(-1) > .1 * radius + step) return null;
  const delta = vertical ? cy - part.y : cx - part.x;
  const tangentShift = vertical ? cx - part.x : cy - part.y;
  if ((low ? -delta : delta) < Math.max(2 * step, .06 * radius) ||
      Math.abs(delta) > .55 * radius || Math.abs(tangentShift) > .1 * radius) return null;
  return {x: vertical ? part.x : cx, y: vertical ? cy : part.y};
}
