# SHAGHIL — National Product Readiness: Master Foundation

**Status: DAY 1A FOUNDATION — FOUNDER REVIEW REQUIRED**
**Mode: Documentation-only. No runtime, product, API, library, CSS, HTML, test, configuration, or deployment change is authorized or made by this document.**

This document, and the three companion documents it introduces (`SHAGHIL_CLOSED_PILOT_PLAN.md`, `SHAGHIL_PILOT_SCORECARD.md`, `SHAGHIL_NATIONAL_READINESS_BACKLOG.md`), define the governing strategy for SHAGHIL's next phase: **National Product Readiness**. Nothing here authorizes implementation. Every workstream, roadmap stage, and backlog item requires separate, explicit Founder approval before any code is written.

Founder-approved runtime baseline as of this document: **`564377dea31c3c9688770209a161711a7ffbf1d4`** (SHAGHIL Post-Production Workspace Transfer Fix, locked). This baseline is immutable and unaffected by this document.

---

## 01. Product North Star

**SHAGHIL is the Saudi AI Operating Platform for Business Growth.**

It is explicitly **not**:
- a generic AI content generator,
- a chatbot,
- an Arabic-language wrapper around a general-purpose LLM.

The product thesis rests on six compounding layers, each building on the last:

**Saudi Context + Business Memory + Brand Memory + Product Memory + Specialized Workflows + Continuous Evaluation.**

A generic AI tool starts from zero on every request. SHAGHIL's differentiation is that it *remembers* a specific Saudi business (its identity, its brand, its products) and applies *specialized, evaluated workflows* — not a single chat box — to that memory, in a way that is measurably, continuously validated rather than assumed. Every workstream below exists to strengthen one of these six layers. Any future feature proposal should be traceable to at least one of them; if it isn't, it is out of scope for National Product Readiness.

---

## 02. Target Users

**Primary initial market: Saudi SMEs.**

Initial user profiles (not ranked, not exhaustive — refined by pilot evidence):
1. Founder / Business Owner
2. Marketing Manager
3. Brand / Communications professional
4. Content / Social specialist
5. E-commerce operator
6. Selected agency / freelance users (serving SME clients)

**Explicit non-claim:** SHAGHIL does not yet claim product-market fit with any of these profiles. That claim can only be made after the evidence described in §07 and the Closed Pilot (§08) exists. Until then, these are *target* profiles, not *validated* ones.

---

## 03. Saudi Intelligence Layer (Future Concept — Not Implemented)

This section defines the *scope and shape* of a future proprietary Saudi Intelligence Layer. **None of it is implemented by this document, and none of it is authorized for implementation by this document.**

Future scope areas:
- Arabic language quality (dialectal register, Saudi-specific phrasing, avoiding generic MSA-only output)
- Saudi business terminology (commercial, retail, service-sector vocabulary as actually used by Saudi SMEs)
- Tone and communication context (formality levels appropriate to audience/channel/occasion)
- Saudi cultural context (social norms, family/community framing, regional variation within the Kingdom)
- Local commercial context (pricing norms, payment culture, delivery/logistics expectations, marketplace behavior)
- Saudi occasions and campaign moments (national days, religious occasions, seasonal retail moments, school calendar, etc.)
- Local channels and customer behavior (platform usage patterns specific to Saudi consumers — e.g. WhatsApp-first commerce, Snapchat/TikTok/Instagram usage patterns)
- Sector-specific intelligence (retail, food & beverage, services, e-commerce, travel — each with distinct needs)
- Evaluation datasets (a held-out, Saudi-context-specific test set to measure output quality over time, not just at launch)
- Hallucination control (mechanisms to detect and reduce fabricated facts, prices, claims, or regulatory statements)
- Source-backed treatment of regulatory information (see the critical distinction below)

### Critical distinction: cultural/commercial intelligence vs. regulatory/legal factual knowledge

These are **two fundamentally different problem classes** and must never be conflated:

- **Cultural/commercial intelligence** (tone, occasions, channel behavior, market norms) is a *quality and relevance* problem. Getting it wrong produces a mediocre or tone-deaf output — undesirable, but not dangerous. This is the primary and appropriate focus of the Saudi Intelligence Layer.
- **Regulatory/legal factual knowledge** (e.g. tax rules, licensing requirements, advertising law, consumer protection regulations) is a *correctness and liability* problem. Getting it wrong can cause real harm to a user's business. SHAGHIL must never present unsourced or unverified regulatory/legal claims as fact. Any future capability touching regulatory or legal content requires explicit source attribution, conservative hedging, and Founder sign-off on the approach — it is not a simple extension of the cultural intelligence work and must be treated as its own, higher-scrutiny track if it is ever pursued.

---

## 04. National Product Readiness Workstreams

Six permanent workstreams. Each is evaluated and re-scoped continuously as pilot evidence arrives (§07–§09); none is a one-time project.

### A. Product
- **Objective:** Deliver specialized, high-value workflows (the six engines and beyond) that solve real, recurring SME marketing tasks better than a generic AI tool would.
- **Current state:** Six engines live (سوّ محتوى، اكتب لي، ابنِ عرض، رد على عميل، سوّ حملة، اكتب ريل), Business/Brand/Product memory, Visual Studio, campaign packs, workspace export/import — all Founder-approved and locked through Phase 3 and the Workspace Transfer Fix.
- **Target state:** Workflows validated against real pilot usage and iterated based on P0/P1 evidence (§10), not assumption.
- **Evidence required:** Pilot task-completion rates, Saudi Relevance Score (§07), qualitative feedback on which engines deliver real value vs. which are unused.
- **Major dependencies:** Closed Pilot (§08) must run before any Product workstream priority is set from real evidence rather than internal judgment.

### B. Saudi Intelligence
- **Objective:** Build the differentiation described in §03 — but only once there is evidence of *where* generic output actually fails Saudi users.
- **Current state:** Not started. Current engines rely on general-purpose model capability plus Business/Brand/Product Memory; no dedicated Saudi evaluation dataset or intelligence layer exists yet.
- **Target state:** A defined, evaluated set of Saudi-context improvements (see §03 scope), each justified by specific pilot-observed failures.
- **Evidence required:** Pilot transcripts/outputs where Saudi Relevance Score is low, with the specific failure mode documented (wrong tone, wrong occasion, missed local context, etc.).
- **Major dependencies:** Closed Pilot must surface real failure examples before this workstream can be scoped concretely; avoid building intelligence features against guessed problems.

### C. Platform & Scale
- **Objective:** Progress SHAGHIL's technical architecture toward supporting larger, more concurrent, more reliable usage — see the Scale Roadmap (§05).
- **Current state:** Static frontend, three Vercel serverless functions (`api/generate.mjs`, `api/health.mjs`, `api/visual.mjs`), zero authentication, zero server-side persistence, zero rate limiting — architecture unchanged since V0.6 and explicitly disclosed and accepted for the current pilot scale in prior audits.
- **Target state:** Progressive readiness through the levels defined in §05, each with its own validated architecture requirements — not a single "rewrite."
- **Evidence required:** Real concurrency and load data from each pilot wave; cost-per-user data from actual API usage.
- **Major dependencies:** No scale work above the Closed Pilot level should begin before Wave 01 (§08–§09) evidence exists.

### D. Trust, Privacy & Security
- **Objective:** Reach the privacy, security, and responsible-AI maturity appropriate to each stage of the Scale Roadmap — see §06.
- **Current state:** No `.env`/secrets in the repository or its history (verified); `OPENAI_API_KEY` never reachable from browser code (verified via persisted QA); all user business data is browser-local only, disclosed in-app; no formal PDPL assessment; no incident-response process; no access-control layer (none is needed yet, since there is no server-side user data).
- **Target state:** A staged trust framework matched to each scale level — see §06.
- **Evidence required:** A documented PDPL gap assessment before any server-side persistence is introduced; documented consent/retention design before any user data leaves the browser.
- **Major dependencies:** Any introduction of server-side persistence (required for scale beyond a browser-local pilot) triggers this workstream's requirements before that persistence work proceeds.

### E. Growth & Product-Market Validation
- **Objective:** Validate real demand, usage, and value — not accumulate features on assumption.
- **Current state:** Zero real external users to date; all prior QA has been synthetic/internal (Playwright-driven, mocked AI endpoints).
- **Target state:** Evidence-backed product-market signal from the Closed Pilot and subsequent waves (§08–§09).
- **Evidence required:** The full evidence set in §07.
- **Major dependencies:** Closed Pilot recruitment (§08) must complete before this workstream has any real data to work from.

### F. National Readiness & Impact
- **Objective:** Build the credible evidence package (§11) required before SHAGHIL can be positioned for Saudi enterprise, ecosystem, awards, or government-facing conversations.
- **Current state:** No such evidence package exists. No claims of this kind have been made or are authorized.
- **Target state:** A verified, evidence-backed readiness package — not a marketing narrative.
- **Evidence required:** Real usage at meaningful scale, documented case studies with permission, verified architecture/security maturity, verified responsible-AI approach.
- **Major dependencies:** Depends on mature output from all five other workstreams; this is necessarily the last workstream to reach readiness.

---

## 05. Scale Roadmap

Progressive readiness levels — each is a **distinct, evidence-gated stage**, not a milestone to rush through:

**Current (browser-local, zero external users) → Closed Pilot (≤10 users) → 100 users → 1,000 users → 10,000+ users**

**Explicit non-claim: SHAGHIL does not currently support 10,000 users.** This is a target readiness state requiring engineering validation at each intermediate stage — it is not a claim about the current system.

Future architecture requirements to evaluate progressively (not implement now, not implement all at once):

| Area | Why it matters at scale |
|---|---|
| Authentication | Required once workspace data must be tied to a verifiable identity rather than a single browser |
| Server-side / cloud persistence | Required once data must survive beyond one browser's local storage and sync across devices |
| Database | Required once server-side persistence exists |
| Object storage | Required for images/exports once they can no longer live only in browser IndexedDB |
| Background jobs / queues | Required once AI generation volume exceeds what synchronous request/response can handle reliably |
| Rate limiting | Required once the API routes are reachable by more than a small, trusted pilot group |
| API resilience | Required as OpenAI-dependent request volume grows (retries, circuit breaking, graceful degradation) |
| Observability | Required to detect and diagnose failures before users report them, at any scale beyond manual Founder monitoring |
| Backups | Required once any data lives server-side |
| Disaster recovery | Required once SHAGHIL is a dependency for real businesses' ongoing operations |
| Cost monitoring | Required to keep per-user OpenAI API cost sustainable as usage grows |
| Concurrency testing | Required before claiming any user-count milestone is actually supported |
| Load testing | Required before claiming any user-count milestone is actually supported |

Each stage transition (Closed Pilot → 100 → 1,000 → 10,000+) requires its own engineering validation, not an assumption that passing the prior stage implies readiness for the next.

---

## 06. Trust & Responsible AI (Future-Readiness Framework)

A staged framework — **no compliance claim is made by this document, and none may be made until independently verified**:

- **Privacy:** Formal data-flow mapping of what SHAGHIL collects/stores/transmits, and where, at each scale stage.
- **Saudi PDPL assessment:** A dedicated legal/compliance review before any server-side personal data processing is introduced — not before browser-local-only usage, which is materially different.
- **User consent:** Clear, specific consent language matched to whatever data handling actually exists at each stage (already partially present: the current in-app local-data notice).
- **Retention / deletion:** A defined retention policy and user-initiated deletion path, required once data exists outside the user's own browser.
- **Security:** Access control, secrets handling (already clean per current audit), and secure-by-default architecture as server-side components are introduced.
- **Access control:** Required once multiple identities/roles exist — not applicable to the current single-browser-workspace model.
- **Incident response:** A documented process for what happens if something goes wrong — required before any real user data exists outside the browser.
- **AI transparency:** Clear user-facing disclosure of what is AI-generated, what data feeds it, and its limitations (partially present already — the AI-generation nature of outputs is inherent to the product's UI).
- **Responsible AI:** Guardrails against harmful, misleading, or non-compliant generated content — to be defined based on real pilot output review, not assumption.
- **Hallucination management:** See §03's cultural-vs-regulatory distinction; regulatory/factual hallucination is the higher-priority risk class.
- **Data governance:** Ownership, access, and audit trail for any data that becomes server-side.

**Explicit non-claim:** No compliance (PDPL or otherwise), certification, or security maturity level is claimed as achieved. Every item above is a future-readiness target requiring independent verification before any external claim is made.

---

## 07. Product Evidence

Evidence SHAGHIL must begin collecting (starting with the Closed Pilot, §08):

- Activation (does a new user reach a first real, usable output?)
- Time to first value
- Successful generation/use rate
- Repeat usage
- Retention
- Task completion
- Time saved (self-reported, directionally — not a precision claim)
- Failure / confusion points (where users get stuck or produce a poor result)
- User feedback (qualitative)
- Testimonials with explicit permission (never assumed, never implied)
- Real case studies (built only from verified, permitted pilot data)

**SHAGHIL-specific metric — Saudi Relevance Score (1–5):**

> "To what degree did SHAGHIL understand your business and the Saudi market?"

This is the single metric that most directly tests the product's core differentiation claim (§01) and should be tracked per pilot participant, per session, over time.

---

## 08. Closed Pilot

**First wave: 10 carefully selected real users**, using real businesses and real tasks.

Target composition:
- 3 SME founders / business owners
- 2 e-commerce operators
- 2 marketing / brand professionals
- 2 content / social specialists
- 1 agency / freelancer

**Explicit constraints:**
- No paid subscriptions in this pilot.
- No public launch.
- No claims of product-market fit — evidence is being *gathered*, not *confirmed*, at this stage.

Full operating detail (recruitment, onboarding, real-task testing, feedback, support, escalation, Wave 02 entry criteria) is defined in the companion document `SHAGHIL_CLOSED_PILOT_PLAN.md`.

---

## 09. 14-Day Sprint

| Days | Focus |
|---|---|
| 1–2 | Foundation + Pilot readiness |
| 3–5 | Wave 01 — 10 users |
| 6–7 | Evidence review + P0/P1 release |
| 8–10 | Wave 02 — target 20–30 users |
| 11–12 | Scale + National Readiness Gap Analysis |
| 13–14 | SHAGHIL Pilot Report 01 + next-stage decision |

**Stretch target:** 30–50 genuine pilot users total, if and only if quality of support and evidence collection capacity permit — never at the expense of real engagement depth with the initial 10.

This document (Day 1A) constitutes the "Foundation" half of Days 1–2.

---

## 10. Prioritization System

| Level | Definition |
|---|---|
| P0 | Prevents or seriously breaks real usage |
| P1 | Materially reduces user value |
| P2 | Important improvement |
| P3 | Future opportunity |

**Product-development loop:**

```
USER → DATA → DECISION → BUILD → QA → FOUNDER APPROVAL → RELEASE → USER
```

Every cycle starts and ends with the user. No step in this loop may be skipped: a BUILD without preceding DATA/DECISION, or a RELEASE without QA and Founder approval, is out of process.

**Explicit rejection:** SHAGHIL explicitly rejects feature accumulation without evidence. A feature idea with no DATA behind it is a P3 hypothesis at best, and belongs in the backlog (`SHAGHIL_NATIONAL_READINESS_BACKLOG.md`), not in a build queue.

---

## 11. National Readiness Evidence

The future evidence package required before SHAGHIL can be positioned as a nationally credible Saudi AI product:

- Real usage (beyond internal/synthetic QA)
- Measurable impact (from §07's metrics, aggregated over real pilot waves)
- Case studies (built only from verified, permitted data)
- Saudi differentiation (concrete examples where the Saudi Intelligence Layer, §03/§04B, measurably outperformed generic AI output)
- Architecture maturity (validated against the Scale Roadmap, §05)
- Security/privacy maturity (validated against the Trust framework, §06)
- Responsible AI approach (documented and demonstrated, not merely asserted)
- Scale evidence (real concurrency/load data, not projections)
- Product evolution evidence (a demonstrated history of the USER→DATA→DECISION→BUILD loop, §10, actually operating)

**Explicit non-claims:** This document makes, and authorizes, **no** claims regarding government endorsement, awards, regulatory compliance, achieved scale, or market leadership. Any such claim in the future requires its own dedicated, evidence-gated approval — it is never a byproduct of reaching a roadmap stage.

---

## Governance

See the shared Governance section at the end of `SHAGHIL_NATIONAL_READINESS_BACKLOG.md` — it applies to this entire document set as one unit.
