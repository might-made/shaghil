import { checkPilotAuth } from '../lib/pilot-auth.mjs';
import { checkRateLimit } from '../lib/rate-limit.mjs';

// Dedicated, side-effect-free verification endpoint for the pilot access gate. It exists so the
// frontend can confirm a code is correct *before* storing it and hiding the gate — the bug this
// fixes is that submitPilotKey() previously accepted any non-empty input with no server round
// trip at all. This reuses the exact same checkPilotAuth() the AI endpoints call, so there is a
// single source of truth for what counts as a valid pilot key; nothing about how /api/generate or
// /api/visual authenticate changes.
//
// Rate-limited (separately from, and more strictly than, the AI endpoints) because unlike those,
// a wrong guess here costs nothing in OpenAI usage, which would otherwise make this endpoint a
// free way to brute-force the access code.
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  const limit = checkRateLimit(req, {
    bucketName: 'pilot-auth',
    perMinute: Number(process.env.RATE_LIMIT_PILOT_AUTH_PER_MIN) || 10,
    perDay: Number(process.env.RATE_LIMIT_PILOT_AUTH_PER_DAY) || 100
  });
  if (!limit.allowed) { res.setHeader('Retry-After', String(limit.retryAfterSeconds)); return res.status(429).json({ error: 'محاولات كثيرة، حاول بعد قليل' }); }
  const result = checkPilotAuth(req);
  if (!result.ok) return res.status(result.status).json({ error: result.error });
  return res.status(200).json({ ok: true });
}
