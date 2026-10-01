// In-memory, per-function-instance rate limiting for the AI generation endpoints.
//
// Honest limitation, stated up front: Vercel can run multiple concurrent instances of the same
// function, each with its own memory, so this is NOT a perfectly precise global cap across every
// possible instance. It resets on cold start. For a small closed pilot gated by PILOT_ACCESS_KEY
// (and ideally Vercel Password Protection on top), this is a real, meaningful second line of
// defense against a runaway client or script — not a substitute for the access gate, and not a
// claim of a hard, globally-exact ceiling.
const buckets = new Map();
const DAY_MS = 86400000;
const MINUTE_MS = 60000;

function clientKey(req) {
  const fwd = req.headers?.['x-forwarded-for'];
  const ip = (typeof fwd === 'string' && fwd.split(',')[0].trim()) || req.socket?.remoteAddress || 'unknown';
  return ip;
}

// Bound memory even if many distinct IPs hit a long-lived warm instance: drop any bucket whose
// day window has already elapsed before it grows without limit.
function prune(now) {
  for (const [key, entry] of buckets) if (now - entry.dayStart > DAY_MS) buckets.delete(key);
}

export function checkRateLimit(req, { bucketName, perMinute, perDay }) {
  const now = Date.now();
  if (buckets.size > 5000) prune(now);
  const key = `${bucketName}:${clientKey(req)}`;
  let entry = buckets.get(key);
  if (!entry || now - entry.dayStart > DAY_MS) entry = { dayStart: now, dayCount: 0, minuteStart: now, minuteCount: 0 };
  if (now - entry.minuteStart > MINUTE_MS) { entry.minuteStart = now; entry.minuteCount = 0 }
  entry.minuteCount += 1;
  entry.dayCount += 1;
  buckets.set(key, entry);
  if (entry.minuteCount > perMinute) return { allowed: false, retryAfterSeconds: Math.ceil((entry.minuteStart + MINUTE_MS - now) / 1000) };
  if (entry.dayCount > perDay) return { allowed: false, retryAfterSeconds: Math.ceil((entry.dayStart + DAY_MS - now) / 1000) };
  return { allowed: true };
}

// Exposed only for tests: resets module state between otherwise-isolated test cases that share
// one Node process.
export function _resetForTests() { buckets.clear() }
