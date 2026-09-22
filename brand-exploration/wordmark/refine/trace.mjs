// Real-pixel → real-vector tracer.
// Input: RGBA buffer (from a Playwright canvas/screenshot render of real, correctly-shaped
// browser text). Output: genuine SVG cubic-bezier path data whose anchor points are fit to
// the traced boundary of the real rendered glyph pixels. No glyph is hand-drawn; every anchor
// derives from measured ink boundaries of the actual browser-shaped rendering.
//
// Pipeline: threshold -> connected-component labelling -> Moore-neighbor boundary trace per
// component -> Douglas-Peucker simplify -> Catmull-Rom -> cubic-bezier smoothing -> SVG path.

function binarize(imageData, width, height, threshold, invert) {
  const bin = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const a = imageData[i * 4 + 3];
    const lum = imageData[i * 4] * 0.3 + imageData[i * 4 + 1] * 0.59 + imageData[i * 4 + 2] * 0.11;
    const ink = (a > 40 && lum < threshold) ? 1 : 0;
    bin[i] = invert ? (1 - ink) : ink;
  }
  return bin;
}

function labelComponents(bin, width, height) {
  const labels = new Int32Array(width * height).fill(-1);
  const components = [];
  const stack = new Int32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (bin[idx] !== 1 || labels[idx] !== -1) continue;
      let sp = 0;
      stack[sp++] = idx;
      labels[idx] = components.length;
      let minX = x, maxX = x, minY = y, maxY = y, area = 0, touchesEdge = false;
      while (sp > 0) {
        const cur = stack[--sp];
        const cx = cur % width, cy = (cur / width) | 0;
        area++;
        if (cx === 0 || cy === 0 || cx === width - 1 || cy === height - 1) touchesEdge = true;
        if (cx < minX) minX = cx; if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy; if (cy > maxY) maxY = cy;
        const nbrs = [[cx-1,cy],[cx+1,cy],[cx,cy-1],[cx,cy+1],[cx-1,cy-1],[cx+1,cy-1],[cx-1,cy+1],[cx+1,cy+1]];
        for (const [nx, ny] of nbrs) {
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const nIdx = ny * width + nx;
          if (bin[nIdx] === 1 && labels[nIdx] === -1) {
            labels[nIdx] = components.length;
            stack[sp++] = nIdx;
          }
        }
      }
      components.push({ minX, maxX, minY, maxY, area, touchesEdge });
    }
  }
  return { labels, components };
}

function traceComponentBoundary(labels, label, width, height, bbox) {
  const inComp = (x, y) => x >= 0 && y >= 0 && x < width && y < height && labels[y * width + x] === label;
  let startX = -1, startY = -1;
  outer:
  for (let y = bbox.minY; y <= bbox.maxY; y++) {
    for (let x = bbox.minX; x <= bbox.maxX; x++) {
      if (inComp(x, y)) { startX = x; startY = y; break outer; }
    }
  }
  if (startX === -1) return null;
  const dirs = [[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
  const pts = [];
  let cx = startX, cy = startY, backtrack = 6, steps = 0;
  const maxSteps = width * height * 4;
  do {
    pts.push({ x: cx + 0.5, y: cy + 0.5 });
    let found = false;
    for (let k = 0; k < 8; k++) {
      const dIdx = (backtrack + 1 + k) % 8;
      const [dx, dy] = dirs[dIdx];
      const nx = cx + dx, ny = cy + dy;
      if (inComp(nx, ny)) { cx = nx; cy = ny; backtrack = (dIdx + 4) % 8; found = true; break; }
    }
    if (!found) break;
    steps++;
  } while ((cx !== startX || cy !== startY) && steps < maxSteps);
  return pts;
}

function perpDist(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (len * len);
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function douglasPeucker(points, epsilon) {
  if (points.length < 3) return points;
  let maxDist = 0, index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDist(points[i], points[0], points[points.length - 1]);
    if (d > maxDist) { maxDist = d; index = i; }
  }
  if (maxDist > epsilon) {
    const left = douglasPeucker(points.slice(0, index + 1), epsilon);
    const right = douglasPeucker(points.slice(index), epsilon);
    return left.slice(0, -1).concat(right);
  }
  return [points[0], points[points.length - 1]];
}

function polyToPathD(poly, smooth) {
  if (!smooth || poly.length < 4) {
    return 'M ' + poly.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' L ') + ' Z';
  }
  const n = poly.length;
  const pt = (i) => poly[((i % n) + n) % n];
  let d = `M ${pt(0).x.toFixed(2)} ${pt(0).y.toFixed(2)} `;
  for (let i = 0; i < n; i++) {
    const p0 = pt(i - 1), p1 = pt(i), p2 = pt(i + 1), p3 = pt(i + 2);
    const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
    d += `C ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} `;
  }
  return d + 'Z';
}

// General-purpose region tracer. invert=true traces background instead of ink (for extracting
// enclosed counters/negative-space); excludeEdgeTouching=true drops any component touching the
// crop border, which is how a true enclosed counter is distinguished from open background.
export function traceRegion(imageData, { width, height, threshold = 128, epsilon = 1.4, minArea = 6, smooth = true, invert = false, excludeEdgeTouching = false, maxComponents = Infinity } = {}) {
  const bin = binarize(imageData, width, height, threshold, invert);
  const { labels, components } = labelComponents(bin, width, height);
  let candidates = [];
  for (let ci = 0; ci < components.length; ci++) {
    const c = components[ci];
    if (c.area < minArea) continue;
    if (excludeEdgeTouching && c.touchesEdge) continue;
    candidates.push({ ci, c });
  }
  candidates.sort((a, b) => b.c.area - a.c.area);
  if (candidates.length > maxComponents) candidates = candidates.slice(0, maxComponents);
  const subpaths = [];
  const kept = [];
  for (const { ci, c } of candidates) {
    const boundary = traceComponentBoundary(labels, ci, width, height, c);
    if (!boundary || boundary.length < 4) continue;
    subpaths.push(douglasPeucker(boundary, epsilon));
    kept.push(c);
  }
  const dList = subpaths.map((poly) => polyToPathD(poly, smooth));
  const d = dList.join(' ');
  return { d, dList, subpathCount: subpaths.length, componentCount: components.length, components: kept };
}

export function traceToPath(imageData, opts = {}) {
  return traceRegion(imageData, opts);
}
