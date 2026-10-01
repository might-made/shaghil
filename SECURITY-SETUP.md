# Security hardening — setup steps required before this branch goes live

This branch (`shaghil-security-hardening`) adds server-side rate limiting, a request-size
ceiling, and a pilot access gate to `/api/generate` and `/api/visual`. **None of it works until
one new environment variable is set in Vercel.** This is intentional: the app fails closed (every
AI request returns a clear 503) rather than silently staying open if nobody configures it.

## 1. Required: set `PILOT_ACCESS_KEY` in Vercel

1. Generate a strong random value yourself (do not reuse a real password). A quick way:
   `openssl rand -base64 24` in any terminal, or any password manager's "generate" function.
2. In the Vercel dashboard: **Project → shaghil → Settings → Environment Variables**.
3. Add `PILOT_ACCESS_KEY` with that value, scoped to at least **Production**.
4. Redeploy (or wait for this branch's own deployment) so the function picks it up.
5. Give that exact value to the 5–10 pilot testers **out of band** — WhatsApp, a call, whatever
   channel you'd use to share a one-time code. **Never put it in a GitHub issue, commit, or any
   document in this repo.** The onboarding guide in `pilot/` deliberately does not contain it —
   there's a blank line for the team to fill in before sending it out.

Until this is set, every tester sees a working app shell, but any of the six engines or Visual
Studio will return "ميزة الوصول للنسخة التجريبية غير مُفعّلة بعد على الخادم" — a clear, honest
signal that setup isn't finished, not a silent failure.

**I did not set this value myself** — doing so from this session would mean the real key passes
through this conversation, and the task was explicit that credentials must stay server-side and
out of any documentation. Generating and entering it directly in the Vercel dashboard yourself is
the cleanest way to guarantee it never exists anywhere else.

## 2. Optional: tune rate limits

Defaults (no action needed unless you want to change them):

| Env var | Default | Applies to |
|---|---|---|
| `RATE_LIMIT_GENERATE_PER_MIN` | 10 | `/api/generate`, per client IP |
| `RATE_LIMIT_GENERATE_PER_DAY` | 150 | `/api/generate`, per client IP |
| `RATE_LIMIT_VISUAL_PER_MIN` | 5 | `/api/visual`, per client IP (stricter — image generation costs more per call) |
| `RATE_LIMIT_VISUAL_PER_DAY` | 40 | `/api/visual`, per client IP |

These are generous enough for 5–10 real testers doing real work over 24 hours, while still
stopping a runaway script or a single abusive caller. **Honest limitation:** this is in-memory,
per serverless-function-instance — Vercel can run more than one instance of the same function
concurrently, so this is not a mathematically exact global ceiling across every instance. It is a
real, meaningful second line of defense, not a substitute for #1 and #3.

## 3. Recommended: Vercel-level access protection

This is the authoritative gate — it blocks a request at the edge, before it ever reaches app
code, including every API route, and needs no code change. I checked the project directly:
`passwordProtection`, `ssoProtection`, and `trustedIps` are all currently **off**, and no Vercel
Firewall rules exist.

I have the Vercel permissions to turn Password Protection on directly, but it would take effect
**immediately on the live production URL** the moment I do it, so I'm asking first rather than
just doing it — see my message in this session. If you'd rather do it yourself:

1. Vercel dashboard → **Project → shaghil → Settings → Deployment Protection**.
2. Enable **Password Protection**, scope it to apply to Production (and ideally all deployments).
3. Set a password and share it with your 5 testers the same out-of-band way as the pilot code.

If your plan tier doesn't offer Password Protection, `trustedIps` (allow-listing the testers'
actual IP addresses) is the fallback, but it's brittle for mobile users on changing networks — not
recommended for this pilot.

## 4. Required (cannot be verified from this session): confirm an OpenAI spend cap/alert

I have no access to the OpenAI account's billing dashboard — only the server-side API key, which
cannot read account-level billing settings. **I have not claimed, and do not claim, that a spend
cap exists.** Before inviting testers, whoever holds the OpenAI account login should:

1. Go to platform.openai.com → **Settings → Billing → Limits**.
2. Confirm a monthly budget/usage limit is set, or set one now.
3. Confirm an email/usage alert threshold is configured.

This is an account setting, not a code or Vercel change, and costs nothing by itself — it only
caps exposure that already exists.
