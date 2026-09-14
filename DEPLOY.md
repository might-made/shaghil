# SHAGHIL V0.3 — Vercel Deploy-Ready

## Environment variables
Set these in Vercel Project Settings → Environment Variables:

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (default recommendation for MVP: `gpt-5.6-luna`)

Never expose the API key in browser code.

## Deploy
1. Import this project into Vercel.
2. Add the two environment variables.
3. Deploy.
4. Open `/api/health` and verify:
   - `ok: true`
   - `api_key_configured: true`
5. Open the portal, select Demo, and test all six engines.

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
