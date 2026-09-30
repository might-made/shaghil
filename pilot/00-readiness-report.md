# SHGHIL V3 — Closed Pilot Readiness Report

**Scope of this task:** audit-only. No production code, environment variables, domains, deployment
protection, or database/user data were changed while preparing this report.

**Audited target:** `main` @ `b12198a68ee9b7c226809df81dbfc0d1f3e62c92` (the exact commit the
production deployment `shaghil.vercel.app` is currently serving — verified via the Vercel API in
the prior verification pass).

---

## 1. Readiness audit

### 1.1 Authentication / user accounts — **none exist**

Confirmed by code search (no `session`, `cookie`, `jwt`, `login`, `oauth`, `passport`, or
`bcrypt` anywhere in the app) and by the product's own prior documentation, which already states
this explicitly: *"SHGHIL has no sign-in or authentication screen."*

- There are no user accounts. There is no way to identify, separate, or log in as a specific
  person.
- "Isolation" between users is entirely incidental: it comes from each visitor's **browser**
  storing its own `localStorage`/`IndexedDB` on their own device, scoped to the app's origin
  (`shaghil.vercel.app`). Two different people on two different devices/browsers automatically
  get separate data — not because the app manages accounts, but because browser storage is
  per-browser by default.
- One consequence pilot testers must understand up front: **the same person switching devices,
  browsers, or using private/incognito mode is, as far as the app is concerned, a brand-new,
  empty user.** There is no "log back in and see your stuff" on another device. This is the
  single most important expectation to set before the pilot starts (see the onboarding guide and
  data-storage warning).

### 1.2 Data persistence — client-side only, already has real limits

Everything lives in the visitor's own browser, nowhere else:

| Data | Storage | Known limit |
|---|---|---|
| Business Brain (project profile) | `localStorage` key `brain` | 1 record (overwritten on save) |
| Result history | `localStorage` key `shaghilHistory` | capped at **30** most recent entries |
| Brand Brain (logo, colors, style) | IndexedDB `shaghil-visual-v1` | 1 record |
| Product Library | IndexedDB | capped at **12** products |
| Saved visual designs | IndexedDB | most recent **10** kept per save |
| Campaign packs | IndexedDB | capped at **6** packs, **12** designs per pack |
| UI theme (A/C) | `localStorage` key `shaghilTheme` | 1 value, independent of the above |

This is a reasonable, already-defensive design for a client-only app — the caps prevent
unbounded storage growth, and every write is wrapped in `try/catch` with an honest Arabic error
message on failure (`QuotaExceededError`, Safari Private Browsing's documented Blob-storage
restriction, etc.). **No code change is needed here for the pilot.** What pilot users need is not
a code fix but the expectation set correctly (see Phase 2 materials): this data does not sync,
does not back up automatically, and a cleared browser/cache/site-data action deletes it
permanently with no recovery path.

### 1.3 Workspace export/import — the pilot's only backup mechanism, and it works

`lib/workspace-transfer.mjs` already provides a complete, tested export/import path (Business
Brain, Brand Brain, Product Library, saved visuals, campaign packs, and history) as a single
downloadable JSON file, verified in the existing QA suite (`qa-v08-workspace-transfer.mjs`,
`qa-preview-persistence.mjs`, `qa-v10-workspace-portability.mjs`) to move data byte-for-byte
between browser origins with an honest restored/skipped summary, and to be idempotent on
re-import. This is good enough to be the pilot's **entire backup and recovery story** — it just
needs to be surfaced to testers as a required habit, not an optional feature (see the backup
guide). Two things worth calling out to testers rather than fixing in code:
- The exported file can contain real product photos and design images (as base64) — a
  meaningful file, not a tiny settings dump. Testers should be told to keep it somewhere they
  control (not forward it casually) and that very large exports may not attach cleanly to email.
- Import always asks before overwriting an existing Business Brain on the destination, so
  re-importing onto a browser that already has data is safe, not silently destructive.

### 1.4 API reliability — solid input handling, but no cost or abuse controls

`api/generate.mjs` and `api/visual.mjs`:
- Both validate their input thoroughly (field whitelisting, length caps, image magic-byte checks,
  a hard 700 KB per reference image / 3 MB total request ceiling on the visual endpoint) before
  ever calling OpenAI.
- Both deliberately disable SDK retries (`maxRetries: 0`) with a documented reason (avoid the
  platform's hard function timeout killing the request before a controlled JSON error can be
  returned) and surface a generic, non-leaking Arabic error message on any failure.
- Neither endpoint stores anything with OpenAI (`store: false` on the text endpoint).
- **Neither endpoint requires any authentication, session, or per-user identifier.** They are
  plain public POST endpoints. Nothing in the app or in `vercel.json` limits how often, or by
  whom, they can be called.

### 1.5 Usage costs — the real open risk, and it is a platform/account setting, not a code bug

Two paid model calls exist: a text model (`OPENAI_MODEL`, default `gpt-5.6-luna`) for the six
engines, and an image model (`OPENAI_IMAGE_MODEL`, default `gpt-image-2.5-flare`) for Visual
Studio — image generation is the more expensive of the two per call. Because of 1.4, **cost
exposure is not bounded by the app at all**: it is bounded only by whatever spend limits or
alerts exist on the OpenAI account itself, which this session cannot see or change. For 5–10
invited testers over 14 days this is a manageable, predictable volume *if* the pilot URL is only
ever used by those testers — but nothing currently prevents anyone else who finds the URL from
using it too (see 1.6).

**Recommended founder action (not performed):** confirm a usage cap/alert is set on the OpenAI
account's billing dashboard before the pilot starts. This is an OpenAI-account setting, not a
SHGHIL code or Vercel change, and is unaffected by "do not incur new service costs" — it caps
existing exposure, it doesn't add a new paid service.

### 1.6 Privacy and access — production is fully public

Checked directly against the live Vercel project:

- `passwordProtection.enabled: false`, `ssoProtection.enabled: false`, `trustedIps.enabled: false`
  — **`shaghil.vercel.app` has no access gate of any kind.** It is reachable by anyone with the
  URL, not only the 5–10 people the founder intends to invite.
- No Vercel Firewall/WAF rules are configured for this project (checked; none exist).
- `/api/health` is public and currently reveals `api_key_configured: true/false` and the active
  model name to any anonymous visitor. Low severity (no secret is exposed), but it is
  unauthenticated reconnaissance information and costs nothing to quietly drop from the response.
- On the product-privacy side (not new — already disclosed in-app, restated here for the pilot
  record): Business Brain text and any product/reference photos a tester uploads for Visual
  Studio are sent to OpenAI at generation time only, on explicit button press, never
  automatically or in the background. This matches the in-app copy testers already see
  ("ترسل صورك المرجعية إلى مزوّد التوليد عند الضغط فقط") — testers should still be told this
  plainly in onboarding since a pilot is the first time real (not demo) business and product data
  will flow through the app.

**This is the readiness audit's headline finding:** a "controlled pilot for 5–10 real users" is
not currently controlled at the access layer — it is a fully public production URL. The gap is
one of *access control*, not of application correctness.

### 1.7 A pilot-specific URL trap, unrelated to the above, worth its own line

Vercel gives every individual deployment its own unique, changing hostname (e.g.
`shaghil-j4pxno108-madagibrahim-7836.vercel.app`) in addition to the **stable** alias
`shaghil.vercel.app`, which always points at whatever the latest production deployment is. A
tester who bookmarks or is given a deployment-specific URL instead of the stable alias will find
their data "gone" the moment the team ships any update during the 14-day window, because that's a
different browser origin. **Every tester must be given, and must consistently use, only
`https://shaghil.vercel.app`.** This is stated plainly in the onboarding guide.

---

## 2. Automated QA (Phase 3)

`npm run qa` run against the exact production commit (`b12198a6`):

```
102 automated checks — 102 PASS, 0 FAIL, exit code 0
```

Covers: structural QA, all six engines' server-side contract and validation, the full inline
client script exercised against a simulated DOM (save → all six engines → generate → copy →
refine → second version → history, malformed/legacy storage, navigation races), founder-reported
regression fixes, content/campaign display safety, Visual Studio background-isolation
correctness, cross-origin workspace export/import (byte-for-byte, idempotent), V3 theme
switching/persistence and Brand-Brain independence, the mobile nav drawer, and the Option B app
icon. **No critical or blocking defect found.** This suite does not (and cannot, from this
sandbox) exercise a live network call to OpenAI — that path is validated with a mocked client
only; a real end-to-end generation should be spot-checked once on the live URL before or during
onboarding.

---

## 3. Prioritized findings

| # | Finding | Severity | Type | Suggested owner action |
|---|---|---|---|---|
| 1 | Production has no access gate — public to anyone, not just invited testers | **High** | Vercel project setting | Enable Vercel **Password Protection** (or Vercel Deployment Protection / a trusted-IP allowlist if the plan supports it) for the pilot window, and share one pilot password out-of-band with the 5–10 testers. No app code change required. **Needs founder approval before enabling**, per this task's own constraints. |
| 2 | No spend cap/alert confirmed on the OpenAI account behind `OPENAI_API_KEY` | **High** | Account setting (outside this repo) | Founder/account owner sets a usage limit or billing alert directly on the OpenAI dashboard before inviting testers. Not a code or Vercel change. |
| 3 | Testers could be given/bookmark a non-stable deployment URL and "lose" their data on the next deploy | **Medium** | Process/communication | Onboarding materials (below) specify the one stable URL to use; the team should avoid sharing any other link. |
| 4 | No rate limiting on `/api/generate` or `/api/visual` | **Medium** | App code (future hardening) | Acceptable for a password-gated 5–10-person pilot (finding #1 closes most of the exposure); worth a lightweight per-IP/per-session throttle before any wider release. Not required to start this pilot once #1 is in place. |
| 5 | `/api/health` exposes `api_key_configured` and the model name publicly | **Low** | App code (trivial) | Optional cleanup — drop those two fields from the public response whenever the team next touches this file. Not pilot-blocking. |
| 6 | No real end-to-end (non-mocked) OpenAI call verified from this session | **Low** | Verification gap | One manual test run of each of the six engines and one Visual Studio generation on the live URL, before testers arrive. |

**Nothing here blocks preparing the onboarding materials.** Findings #1 and #2 are the two the
founder should decide on before *inviting* testers; neither requires touching application code,
and both are explicitly flagged for approval rather than acted on, per this task's instructions.

---

## 4. What was verified and is safe to rely on for the pilot

- Both approved themes (A: champagne on charcoal, C: charcoal on champagne) and their
  localStorage persistence — unaffected by anything in this audit, already re-verified in the
  prior production-verification pass on this exact commit.
- The full bilingual شغّيل / SHGHIL logo and the approved Option B app icon (غ with the authentic
  shadda at 180px+, the simplified variant at 16/32px) — unchanged, unaffected.
- Mobile navigation (drawer, scrim, Escape/back-navigation-safe) at 360/390/430px — unaffected.
- All six engines, Visual Studio, Business Brain, Brand Brain, Product Library, History, and
  Workspace export/import — exercised by the automated suite above with zero regressions.

No fixes are required to *start* the pilot from a product-correctness standpoint. The two
high-severity items are both access/cost-control decisions for the founder, not defects in the
software.
