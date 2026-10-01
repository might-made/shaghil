// Server-side access gate for the pilot. This is deliberately independent of any frontend check
// (the brief is explicit: frontend-only protection is insufficient) — every AI endpoint calls
// this before doing anything else, and a request with no key, or the wrong key, is rejected here
// regardless of what the browser UI did or didn't enforce.
//
// Known, disclosed limitation: because this app ships as a public static page with no build/
// bundling step, the key the browser sends has to live in client-side JS at runtime, typed in by
// the user and held in localStorage — it is not a secret embedded in the repository, but a
// sufficiently motivated person who already has the page open could read it out of their own
// browser. This gate's real job is to stop anonymous/automated traffic and casual misuse by
// anyone who is not one of the invited testers; it is not cryptographic authentication. The
// authoritative access control for "only the invited 5-10 people can reach this at all" is the
// Vercel-level deployment protection recommended alongside this change.
export function checkPilotAuth(req) {
  const configuredKey = process.env.PILOT_ACCESS_KEY;
  if (!configuredKey) return { ok: false, status: 503, error: 'ميزة الوصول للنسخة التجريبية غير مُفعّلة بعد على الخادم' };
  const provided = req.headers?.['x-pilot-key'];
  if (typeof provided !== 'string' || provided.length === 0 || provided !== configuredKey) {
    return { ok: false, status: 401, error: 'رمز الدخول غير صحيح أو مفقود' };
  }
  return { ok: true };
}
