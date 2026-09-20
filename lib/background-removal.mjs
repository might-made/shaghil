// Exact-fidelity compositing must preserve the supplied product photo's real pixels while
// removing its original background. A chroma-key/near-white-pixel deletion pass would delete
// real pixels from a light-colored product (e.g. Wash Me), so this isolates the product with a
// purpose-built semantic segmentation model that only edits the alpha channel of pixels it
// identifies as background — it never repaints or regenerates the product itself. The model
// runs entirely in the browser (no server call, no per-image API cost, no new backend); it is
// loaded lazily, only the first time exact-fidelity compositing actually needs it.
let loaderPromise = null;
let loaderOverride = null; // Test-only seam. Production never calls __setLoaderForTests.
export function __setLoaderForTests(fn) { loaderOverride = fn; loaderPromise = null; }
function loadRemover() {
  if (loaderOverride) return loaderOverride();
  if (!loaderPromise) loaderPromise = import('https://esm.sh/@imgly/background-removal@1.5.8');
  return loaderPromise;
}

async function hasRealTransparency(blob) {
  // Only PNG/WebP can carry real alpha; treat everything else (JPEG, etc.) as opaque.
  if (!['image/png', 'image/webp'].includes(blob.type)) return false;
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width; canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0);
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  // Sampling every ~97th pixel's alpha channel is enough to detect a real transparent
  // background without decoding every pixel of a large photo.
  for (let i = 3; i < data.length; i += 4 * 97) if (data[i] < 250) return true;
  return false;
}

const cache = new Map();
export async function isolateProduct(blob, cacheKey) {
  if (cacheKey && cache.has(cacheKey)) return cache.get(cacheKey);
  // A product photo that already has a real transparent background (a PNG/WebP the
  // Founder saved with the background already removed) must pass through unchanged —
  // running segmentation again on it is unnecessary and could only make it worse.
  if (await hasRealTransparency(blob)) return blob;
  const { removeBackground } = await loadRemover();
  const isolated = await removeBackground(blob, { model: 'isnet_quint8' });
  if (cacheKey) cache.set(cacheKey, isolated);
  return isolated;
}
