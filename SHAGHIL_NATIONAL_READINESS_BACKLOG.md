# SHAGHIL — National Readiness Backlog

**Status: DAY 1A FOUNDATION — FOUNDER REVIEW REQUIRED**
**Mode: Documentation-only. Every item below is a hypothesis or a previously-disclosed non-blocker, not approved implementation work.**

This backlog operationalizes the six workstreams in `SHAGHIL_NATIONAL_PRODUCT_READINESS_MASTER.md` §04. It is a living document, re-prioritized by real pilot evidence (Master §07, §10) — not a fixed feature roadmap.

**Every item requires:** ID · Problem/opportunity · Evidence/source · Priority · Status · Dependency · Target readiness stage.

Priority levels (Master §10): **P0** prevents/breaks real usage · **P1** materially reduces user value · **P2** important improvement · **P3** future opportunity.

Status values: `Hypothesis` (not yet evidenced by real pilot use) · `Disclosed` (previously identified and Founder-reviewed, not yet actioned) · `In Review` · `Approved` · `In Progress` · `Resolved` · `Deferred`.

---

## PRODUCT

| ID | Problem/Opportunity | Evidence/Source | Priority | Status | Dependency | Target Readiness Stage |
|---|---|---|---|---|---|---|
| PROD-01 | Campaign-pack ZIP download receives a generic browser filename ("download") instead of the intended descriptive name | `SHAGHIL_PRODUCT_CLOSURE_RELEASE_READINESS_AUDIT.md` §6.1 (verified, cosmetic, no data loss) | P2 | Disclosed | None | Closed Pilot |
| PROD-02 | `api/generate.mjs`'s missing-API-key error surfaces raw English text inside an otherwise fully Arabic UI | `SHAGHIL_PRODUCT_CLOSURE_RELEASE_READINESS_AUDIT.md` §6.2 (verified; only surfaces if a deployment is missing its key) | P2 | Disclosed | None | Closed Pilot |
| PROD-03 | Which of the six engines deliver real recurring value vs. which go unused is currently unknown | No real usage exists yet | P1 | Hypothesis | Closed Pilot Wave 01 data | Closed Pilot |
| PROD-04 | Onboarding drop-off points beyond the 3-field quick-start are unknown | No real usage exists yet | P2 | Hypothesis | Closed Pilot Wave 01 data | Closed Pilot |

## SAUDI INTELLIGENCE

| ID | Problem/Opportunity | Evidence/Source | Priority | Status | Dependency | Target Readiness Stage |
|---|---|---|---|---|---|---|
| SI-01 | No dedicated Saudi-context evaluation dataset exists to measure output quality over time | Master §03/§04B — none built yet | P2 | Hypothesis | None yet defined | 100 users |
| SI-02 | Real examples of low Saudi Relevance Score and their specific failure modes (tone, occasion, local context) are not yet known | No pilot data exists yet | P1 | Hypothesis | Closed Pilot Wave 01 Saudi Relevance Scores | Closed Pilot |
| SI-03 | Cultural/commercial intelligence gaps must be tracked separately from any future regulatory/legal factual accuracy concern | Master §03 — explicit distinction; no current instance of either observed | P3 | Hypothesis | Real generated output review | Closed Pilot |

## PLATFORM & SCALE

| ID | Problem/Opportunity | Evidence/Source | Priority | Status | Dependency | Target Readiness Stage |
|---|---|---|---|---|---|---|
| PS-01 | Background isolation depends on a live third-party CDN (`esm.sh`) at runtime, a single point of failure for exact-fidelity product photos | `SHAGHIL_PRODUCT_CLOSURE_RELEASE_READINESS_AUDIT.md` §6.3 (verified; degrades gracefully today) | P2 | Disclosed | None | 100 users |
| PS-02 | No authentication or rate limiting on `/api/generate` / `/api/visual` — anyone with the URL can call them and incur real API cost | `SHAGHIL_PRODUCT_CLOSURE_RELEASE_READINESS_AUDIT.md` §6.4 (disclosed, accepted for supervised pilot scope) | P1 | Disclosed | Closed Pilot must stay access-limited (URL not public) | 100 users |
| PS-03 | All product data is browser-local only, with no server-side backup or cross-device sync | `SHAGHIL_PRODUCT_CLOSURE_RELEASE_READINESS_AUDIT.md` §6.5 (working as designed, disclosed in-app; mitigated by export/import) | P2 | Disclosed | Requires a full Trust/PDPL review (see TRUST section) before any change | 1,000 users |
| PS-04 | Real concurrency/load characteristics under multiple simultaneous pilot users are unknown | No load testing has been performed | P1 | Hypothesis | Closed Pilot Wave 01/02 real concurrent usage | Closed Pilot |
| PS-05 | `DEPLOY.md` is stale relative to the current Phase 3 / Workspace Transfer Fix baseline | `SHAGHIL_PRODUCT_CLOSURE_RELEASE_READINESS_AUDIT.md` §6.6 | P3 | Disclosed | None | Closed Pilot |

## TRUST

| ID | Problem/Opportunity | Evidence/Source | Priority | Status | Dependency | Target Readiness Stage |
|---|---|---|---|---|---|---|
| TR-01 | No formal Saudi PDPL gap assessment has been performed | Master §06 — not yet started | P2 | Hypothesis | None required at browser-local-only scale; required before any server-side persistence | 100 users |
| TR-02 | No incident-response process is documented | Master §06 | P2 | Hypothesis | None required at current scale; required before server-side user data exists | 100 users |
| TR-03 | Secrets/API-key hygiene is currently clean and should be re-verified at every future architecture change | `SHAGHIL_PRODUCT_CLOSURE_RELEASE_READINESS_AUDIT.md` §6.7 (currently clean — tracked to ensure it stays that way) | P3 | Disclosed | Re-verify on any architecture change | All stages |

## GROWTH

| ID | Problem/Opportunity | Evidence/Source | Priority | Status | Dependency | Target Readiness Stage |
|---|---|---|---|---|---|---|
| GR-01 | Zero real external users to date — all validation so far is synthetic/internal QA | Master §04E | P0 (for pilot readiness itself) | In Progress | Closed Pilot Plan Founder approval | Closed Pilot |
| GR-02 | No activation/retention/repeat-usage baseline exists | Master §07 | P1 | Hypothesis | Closed Pilot data | Closed Pilot |
| GR-03 | No verified testimonial or case study exists | Master §07 | P2 | Hypothesis | Explicit pilot participant permission | Closed Pilot |

## NATIONAL READINESS

| ID | Problem/Opportunity | Evidence/Source | Priority | Status | Dependency | Target Readiness Stage |
|---|---|---|---|---|---|---|
| NR-01 | No evidence package exists to support any enterprise/ecosystem/award/government-facing positioning | Master §11 | P3 | Hypothesis | All other workstreams reaching maturity | 10,000+ users |
| NR-02 | No documented instance yet of the USER→DATA→DECISION→BUILD→QA→FOUNDER APPROVAL→RELEASE loop operating on real pilot evidence | Master §10 — loop defined, not yet exercised on real data | P1 | Hypothesis | Closed Pilot Wave 01 evidence review (Days 6–7) | Closed Pilot |

---

## Governance

*(This Governance section applies to the full National Product Readiness document set: `SHAGHIL_NATIONAL_PRODUCT_READINESS_MASTER.md`, `SHAGHIL_CLOSED_PILOT_PLAN.md`, `SHAGHIL_PILOT_SCORECARD.md`, and this backlog.)*

- **Founder approval is required before implementation.** No backlog item, regardless of priority, may be built without explicit, separate Founder approval.
- **Pilot evidence drives priority.** Priorities above are initial estimates; real evidence from the Closed Pilot (and subsequent waves) supersedes them.
- **No runtime change from this task.** This entire document set is documentation-only; it changes no code, test, configuration, or deployment.
- **Existing Founder-approved locks remain immutable.** Phase 1/2/3 locks and the Post-Production Workspace Transfer Lock (`564377dea31c3c9688770209a161711a7ffbf1d4`) are unaffected and unchanged by this document set.
- **No historical branch modification.** `main`, `shaghil-v0.9`, `shaghil-product-closure`, `shaghil-brand-final`, `shaghil-design-system`, `shaghil-final-audit`, `shaghil-v0.7`, `shaghil-v0.8` are untouched.
- **No premature 10K scalability claims.** See Master §05 — 10,000+ users is a target requiring engineering validation, not a current capability.
- **No premature compliance claims.** See Master §06 — no PDPL, security, or certification compliance is claimed as achieved.
- **No government/award/market-leadership claims without evidence.** See Master §11 — such claims require their own dedicated, evidence-gated approval, never a byproduct of reaching a roadmap stage.
- **SHAGHIL must not drift into becoming merely a generic chatbot.** Every backlog item and workstream must trace back to the North Star's six-layer differentiation (Master §01); features that don't strengthen Saudi Context, Business/Brand/Product Memory, Specialized Workflows, or Continuous Evaluation are out of scope for National Product Readiness.
