# SHAGHIL — Controlled Pilot Deployment Readiness

**Type:** Read-only assessment. No runtime, product, CSS, JavaScript, `lib/`, `api/`, config, or test-harness file was modified to produce this report.

**Baseline assessed:** `e8b0d8fcf08bb9a9d5319af28684859f7d8dc533` (product closure audit commit, on top of the Founder-approved, locked Phase 3 runtime `dac09fa41ca182548fdfedaf731ae0c267bdcd15`), branch `shaghil-product-implementation`. HEAD confirmed at this SHA with a clean tree before and after this assessment.

## 1. Deployment configuration

| Item | Status | Notes |
|---|---|---|
| Build configuration | **PRESENT** | `package.json` declares `"type":"module"`, Node `>=20`, one production dependency (`openai`). No bundler/build step — this is a zero-build static+serverless-functions project by design; `vercel.json` needs no `buildCommand`/`outputDirectory` for that model. |
| Framework/runtime assumptions | **PRESENT — correctly zero-config** | No framework declared or needed. Vercel auto-serves `index.html` and every static file (`/lib`, `/styles`, `/fonts`, `/brand`) from the repo root, and auto-converts every file under `/api` into a Node serverless function — standard, well-supported Vercel convention. |
| API routes | **PRESENT** | `api/generate.mjs`, `api/visual.mjs`, `api/health.mjs`, each exporting a default Node-style `(req,res)` handler. `vercel.json` sets `maxDuration` for each (60s / 180s / 30s) — appropriate given `api/visual.mjs`'s image-generation calls are the slowest. |
| Environment variables required | **MISSING (must be set before pilot)** | `OPENAI_API_KEY` (required — both `api/generate.mjs` and `api/visual.mjs` fail gracefully without it, see §1a). `OPENAI_MODEL` and `OPENAI_IMAGE_MODEL` are optional (both have working code-level defaults: `gpt-5.6-luna`, `gpt-image-2.5-flare`). |
| `OPENAI_API_KEY` configuration expectations | **NOT REQUIRED for import/deploy, REQUIRED for functioning** | Confirmed by direct test: all three `api/*.mjs` modules import cleanly with zero environment variables set (no crash at deploy/build time). The key is read only inside each request handler, so an unset key does not break the deployment — it only breaks generation at the moment a user tries to use it (§1a). |
| Image-generation endpoint | **PRESENT** | `api/visual.mjs`; confirmed importable, confirmed its request validation (`normalizeVisual`) runs correctly with no key/environment dependency. |
| Content-generation endpoint | **PRESENT** | `api/generate.mjs`; same confirmation. |
| Static assets | **PRESENT** | `index.html` references only root-absolute paths (`/styles/...`, `/fonts/...`, `/brand/...`, `/lib/visual-studio.mjs`); every referenced file exists on disk and was confirmed to load with zero 404s when served (§2). |
| Fonts | **PRESENT** | 8 self-hosted `.woff2` files (`IBM Plex Sans Arabic` + `IBM Plex Sans`, weights 400/500/600/700) under `/fonts`, loaded via standard `@font-face` — no external font CDN dependency. |
| CDN dependencies | **PRESENT — one, at runtime, client-side only** | `lib/background-removal.mjs` performs a live `import('https://esm.sh/@imgly/background-removal@1.5.8')` at the moment a user needs exact-fidelity background isolation. This is the one genuine external CDN dependency in the whole product; it degrades gracefully (existing regression: `qa-v09-background-isolation.mjs`) if unreachable. Already documented in the product closure audit as an Important Non-Blocker. |
| Browser storage requirements | **PRESENT — required, by design** | `localStorage` (Business/Brand Identity, History index) + IndexedDB (`shaghil-visual-v1`: brand assets, products, visuals, campaign packs). No server-side database exists or is expected. |
| Export/import behavior | **PRESENT and verified** | `Workspace.export()`/`Workspace.import()` produce/consume a single JSON bundle (confirmed working, byte-for-byte round trip, in both the Phase 2/3 regression suite and this session's own closure audit). |
| Production URL assumptions | **NOT REQUIRED (none hardcoded)** | No absolute production domain, hardcoded origin, or CORS allowlist was found anywhere in `index.html`, `lib/*.mjs`, or `api/*.mjs` — the app is origin-relative throughout, so it will work correctly on whatever Vercel preview/production URL it is deployed to. |

### 1a. Missing-`OPENAI_API_KEY` behavior (both endpoints, confirmed by reading the actual handler code)

- `api/visual.mjs`: returns HTTP 503 with a friendly Arabic message (`'توليد الصور غير مفعّل حاليًا'`).
- `api/generate.mjs`: returns HTTP 500 with a raw, untranslated English string (`"OPENAI_API_KEY is not configured"`), which the client renders directly inside its Arabic error UI. This inconsistency was already flagged in the product closure audit (§6.2 there) as an Important Non-Blocker — it only surfaces if the key is missing, which is exactly the failure mode a pilot deployment must avoid by checking `/api/health` before onboarding any pilot business (see §6, MUST DO).

No secret VALUES were read, displayed, or logged anywhere in producing this table.

## 2. Clean production-equivalent build/start verification

Performed on a fresh copy of the repository (not the working tree used for git operations, to avoid any risk to the tracked state):

- `npm install` (no cache reuse forced): **exit 0**, 41 packages installed, one harmless deprecation warning from a transitive dev-only dependency (`whatwg-encoding`, used by `jsdom`/`fake-indexeddb` — devDependencies only, never shipped to the deployed API functions or the browser).
- Each of the three `api/*.mjs` files was imported directly in Node with **zero environment variables set**: all three imported cleanly with no error, confirming a missing `OPENAI_API_KEY` cannot break the deployment itself (only request-time generation, as designed).
- The static site was served and driven with a real browser: Home/welcome loads; Home, هوية النشاط, هوية العلامة, مكتبة المنتجات, السجل, and an engine screen were each reached. **Zero failed network requests** (no 404s on any font, stylesheet, brand asset, or `.mjs` module) and **zero console/page errors** were observed.

No code was changed to obtain these results.

## 3. Pilot security review

| Finding (from the closure audit) | Classification for a small, controlled Founder pilot |
|---|---|
| No authentication on `/api/generate` / `/api/visual` | **PILOT RISK — ACCEPTABLE WITH RESTRICTION.** Restriction: do not publish the pilot URL publicly; share it only with the specific pilot businesses under Founder supervision, and use Vercel's own Deployment Protection (password or SSO, no code change) on the deployment for the pilot window. |
| No rate limiting on the two AI-backed routes | **PILOT RISK — ACCEPTABLE WITH RESTRICTION.** Restriction: monitor the OpenAI usage dashboard during the pilot window; the existing per-request payload bounds already cap the worst case for a single request (input length limits, max 2 reference images, `maxDuration` caps), and a small, known set of pilot users limits realistic call volume. This does not eliminate the exposure — it makes it manageable for a short, supervised pilot; see §4. |
| Browser-local-only data (no server-side backup) | **SAFE FOR CONTROLLED PILOT.** This is a data-durability characteristic, not a security exposure — pilot business data never leaves the pilot user's own device unless they export it. Disclosed to the user in-app; mitigated by a working, verified export/import feature (§5). |
| Third-party CDN dependency (`esm.sh`) for background isolation | **PILOT RISK — ACCEPTABLE WITH RESTRICTION.** Restriction: verify this specific feature once per pilot business at onboarding (it degrades gracefully with a clear Arabic warning if unreachable — confirmed by regression and by direct reproduction in this session's own sandboxed environment — so a failure here is visible and recoverable, never silent or data-losing). |

**No item in this table blocks a controlled pilot** on its own; each has a concrete, zero-code restriction available.

## 4. Cost / API exposure check

- **Could an unknown visitor trigger paid API calls?** Yes, technically — both `/api/generate` and `/api/visual` accept any POST request that passes their input-validation shape, with no session, token, or origin check. Anyone who obtains the deployed URL (not just the app's own UI) could call these endpoints directly.
- **Could repeated calls create uncontrolled cost?** There is no application-level rate limit, so a scripted client could call either endpoint repeatedly. Mitigating factors already present in code: `maxDuration` (60s/180s) bounds each individual call's runtime; `normalizeRequest`/`normalizeVisual` bound input size (text length caps, max 2 reference images, max request body size for `/api/visual`); Vercel's own serverless concurrency limits (plan-tier-dependent) provide a coarse, infrastructure-level ceiling on simultaneous executions. None of this is a substitute for real rate limiting or auth — it only bounds the worst case per call and per concurrent burst, not sustained/distributed abuse over time.
- **Do API keys remain server-side?** Confirmed yes. `OPENAI_API_KEY` is referenced only inside `api/generate.mjs`/`api/visual.mjs` (`process.env.OPENAI_API_KEY`), which execute exclusively as server-side Vercel functions. The existing `qa.mjs` structural check independently confirms `index.html` never contains the string `OPENAI_API_KEY`. No client-side file (`index.html`, any `lib/*.mjs`) references it.
- **Can secrets appear in client code or network responses?** No. Every response body was traced for both success and failure paths on both endpoints: success responses return only `{text, model}` or `{base64, mime, model, direction, format, conceptual}`; failure responses on the actual OpenAI-call path always return a fixed, hand-written, safe message (never the raw SDK exception) — the only place a raw `.message` reaches the client is from the app's own hand-authored validation errors (e.g. "أكمل اسم المشروع..."), never from an external library or environment value.
- **Is there an obvious abuse path?** Yes — the combination of "no auth" + "no rate limit" + "publicly-reachable-if-the-URL-leaks" is a real, generic API-cost-abuse pattern common to any unprotected serverless AI endpoint. It is not specific to a coding defect in this product; it is the direct, known consequence of the explicit, Founder-directed scope decision (repeated across every phase to date) to defer authentication, billing, and rate limiting. **This is the one section of this assessment capable of overriding release readiness, and the recommendation is: it does not, for a genuinely controlled pilot, provided the MUST DO items in §6 are followed** — specifically, do not treat the raw deployment URL as safe to share widely, and gate it with Vercel Deployment Protection rather than relying on obscurity alone.

## 5. Pilot data model

| Data | Where stored | Survives reload? | Moves across devices? |
|---|---|---|---|
| Business Identity (هوية النشاط) | `localStorage` key `brain`, this browser + origin only | Yes — confirmed | No — device/browser-local only |
| Brand Identity (هوية العلامة) | IndexedDB (`shaghil-visual-v1`, `brand` store), this browser + origin only | Yes — confirmed | No |
| Product Library | IndexedDB (`products` store, includes the real image Blob), this browser + origin only | Yes — confirmed | No |
| History (text results) | `localStorage` key `shaghilHistory` (last 30), this browser + origin only | Yes — confirmed | No |
| Generated images (Visual History) | IndexedDB (`visuals` store, includes the rendered image Blob), this browser + origin only | Yes — confirmed, verified this session | No |
| Campaign packs | IndexedDB (`packs` store), this browser + origin only | Yes | No |

- **What is lost if browser storage is cleared?** Everything above, entirely and permanently, for that browser/device — there is no server-side copy anywhere. This is disclosed to the user in-app (the local-data notice shown before first setup) and is unchanged, working-as-designed behavior verified in this session's own audits.
- **Does data move across devices?** No, not automatically — each browser+origin combination is an island (a standard, unchangeable browser-platform rule, not something this app's code controls).
- **Is export/import sufficient for manual backup?** Yes, for a controlled pilot: `Workspace.export()` produces one downloadable JSON file containing Business Identity, Brand Identity, all products (with images), all visuals (with images), all campaign packs, and History; `Workspace.import()` restores all of it, verified byte-for-byte in the existing regression suite and independently re-verified in this session's own testing. It requires the pilot user (or the Founder, on their behalf) to remember to run it — it is not automatic or scheduled.

## 6. Deployment checklist

### MUST DO before pilot
1. Set `OPENAI_API_KEY` in the Vercel project's environment variables for the deployment.
2. After deploying, open `/api/health` on the actual deployment URL and confirm `ok: true` and `api_key_configured: true` before sharing the URL with any pilot business.
3. Enable Vercel Deployment Protection (password or SSO) on the pilot deployment, and share access only with the intended pilot businesses — do not post the raw URL anywhere public.
4. Walk through the full clean-user journey once on the actual live deployment (not just this local audit) — create a business identity, run one engine, add a real product, generate one design, download it, reload, and confirm persistence — before onboarding the first real pilot business.

### RECOMMENDED during pilot
1. Monitor the OpenAI usage/cost dashboard daily for the duration of the pilot window, given there is no automated rate limiting.
2. Ask each pilot business to export their workspace periodically (or do it on their behalf) as their only backup, since there is no server-side copy of their data.
3. At onboarding, confirm background-isolation (the "المنتج الأصلي" exact-fidelity path) actually completes for each pilot business's own network/browser, given its one external CDN dependency — it will warn clearly and still complete the design if it fails, but it's worth knowing up front per business.
4. Keep the pilot to a small, known, Founder-supervised set of businesses for the duration — this is the condition under which every "acceptable with restriction" item in §3 holds.

### NOT REQUIRED for pilot
1. Authentication/login system.
2. Application-level rate limiting.
3. A server-side database or backend persistence layer.
4. Multi-device sync.
5. Billing/payment integration.

## 7. Final decision

**READY FOR CONTROLLED PILOT DEPLOYMENT**, conditional only on completing the four MUST DO items in §6 (none of which require any code change — they are deployment/configuration/account-level actions).

No blockers were found in the code, build, or runtime that would prevent a controlled pilot deployment.
