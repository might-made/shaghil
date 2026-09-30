# SHAGHIL V0.6 — Founder Preview

## Environment variables
Set these in Vercel Project Settings → Environment Variables:

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (default recommendation for MVP: `gpt-5.6-luna`)

Never expose the API key in browser code.

## Branch preview only
V0.5 is locked at `35c118a`. All V0.6 development and commits belong on `shaghil-v0.6`, created from that checkpoint. Do not modify `shaghil-v0.5`. Do not modify or merge into `main`, change production configuration, or promote a deployment before founder approval.

1. Use the automatic Vercel preview for `shaghil-v0.6`, if configured.
2. Verify the required environment variables are available to that preview.
3. Open the preview `/api/health` and verify:
   - `ok: true`
   - `api_key_configured: true`
4. Save Business Brain, confirm Home opens, then test all six engines with optional fields blank. Reload and confirm Business Brain persists on the same browser and origin.
5. Check result copying, all four refinements, second version, new task and history. Confirm WhatsApp blocks an empty customer message.
6. Review live AI output quality before any production approval.

## QA businesses
Test these before connecting Salla:
1. Jeddah specialty coffee business
2. Saudi perfume e-commerce store
3. Freelance/professional service business

## Pass gate
Every engine should:
- use Business Brain context
- return usable Saudi-market output
- avoid fake claims/scarcity
- avoid discount-first behavior
- complete without exposing internal prompts or keys

## Not yet production-complete
Before paid users:
- login/auth
- persistent server-side Business Brain
- order/access verification from Salla
- rate limiting
- server-side usage events
- privacy / deletion flow


## V0.4
- Rendered Markdown results
- Refinement actions
- Last 10 outputs stored locally
- Improved loading/error/copy UX

## V0.5
- One persistent local Business Brain supplies all six engines.
- Content: period only; Copy: channel and optional instruction; Offer: optional constraint.
- WhatsApp: customer message only; Campaign: duration and optional occasion; Reel: duration and optional topic.
- Server accepts only named task fields and treats Business Brain as authoritative.
- New history entries preserve task inputs. Older entries remain readable and refinable; a second version asks for fresh task details because V0.4 did not store them.
- Local storage is scoped to the browser and origin; preview URLs do not share production data.

## Automated QA
Run `npm install` and `npm run qa` with Node 20 or newer. QA retains the existing structural checks and exercises the real server handler with a mocked OpenAI response, plus the inline browser application in a minimal DOM harness. It covers context forwarding, optional defaults, validation, refinements, history, copy, persistence, and request races. No live AI call or real API key is needed for QA. Live model quality and Vercel environment configuration require a separate preview review.

## V0.6 Visual Studio
See [V0.6 architecture, QA and Founder review guide](V0.6.md). `OPENAI_IMAGE_MODEL` is optional and defaults to `gpt-image-2.5-flare`; all image credentials stay server-side. Live image generation must be checked in Founder QA. No production deployment is authorized.
