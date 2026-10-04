// SHGHIL V4 Batch 5 (P0-C.1) — the shared Business Memory context-selection contract.
//
// This module is policy only: it declares which Business Memory fields each of the seven
// consumers (six text engines + Visual Studio) is allowed to receive. It is NOT wired into
// api/generate.mjs or api/visual.mjs in this batch — each endpoint still performs its own local
// validation/normalization exactly as before (see each file's own normalizeRequest()/
// normalizeVisual()). Wiring this contract into actual engine requests/prompts is later-batch
// work. Nothing in this file changes any runtime behavior by itself.
//
// Design principle: selective context slices, never "send everything everywhere" — there is no
// single universal context object here that gets blindly handed to every consumer. Each consumer
// gets exactly the field list resolveContextFields() computes for it, and nothing else.
//
// Field names match the actual storage keys established in Batches 1-4 exactly (brain.*,
// brand.*, product.*) — this module introduces no new fields of its own.

export const CONSUMERS = Object.freeze(['content', 'copy', 'whatsapp', 'reel', 'offer', 'campaign', 'visual']);

// Context groups: the approved conceptual categories, each mapped to the literal field names it
// owns. A field appears in exactly one group (no duplication across groups), even where a field
// conceptually serves more than one idea (e.g. brain.customer is the Audience signal, not
// separately duplicated into Business Facts).
//
// Voice invariant (binding): brandVoice lists only toneOfVoice for the active voice text — it
// never lists brand.style or brain.tone. Those two remain retired from active context assembly
// as of the Batch 4 SSOT correction, and this contract must not reintroduce either of them
// anywhere, in any group.
export const CONTEXT_GROUPS = Object.freeze({
  businessFacts: Object.freeze(['name', 'category', 'product', 'location', 'price', 'businessModel']),
  audience: Object.freeze(['customer', 'temporaryAudienceEmphasis']),
  commercialGoal: Object.freeze(['objective', 'secondaryObjectives', 'currentPriority', 'currentOffer', 'importantSeason', 'campaignContext', 'commercialConstraints']),
  positioning: Object.freeze(['positioning']),
  valueProposition: Object.freeze(['valueProposition']),
  differentiators: Object.freeze(['differentiators']),
  brandVoice: Object.freeze(['personality', 'toneOfVoice', 'doList', 'dontList', 'preferredVocabulary', 'prohibitedVocabulary']),
  // product.* fields (per selected Product Memory item). V4 Batch 8 extends this group with
  // `id` — the stable identifier a product selector must transmit and the assembled context
  // must carry, so a selected product's facts are traceable to one unambiguous record even
  // across a later rename. Batch 5 omitted it only because no selector existed yet to need it.
  productMemory: Object.freeze(['id', 'name', 'category', 'description', 'price', 'specifications', 'features', 'benefits', 'useCases', 'audienceRelevance', 'offers']),
  visualIdentity: Object.freeze(['primary', 'secondary', 'accent', 'logo', 'references']),
  visualDirection: Object.freeze(['visualDirectionNotes', 'visualDo', 'visualDont'])
});

// Per-consumer, per-group visibility.
//   'yes'     — the full group's field list is visible to this consumer.
//   'no'      — the group is entirely excluded for this consumer.
//   'when'    — visible only when a specific product has been selected for this task (no product
//               selector exists yet — Batch 5 only reserves this policy for when one does).
//   'limited' — only the fields named in LIMITED_FIELDS[consumer][group] are visible, not the
//               group's full list (used solely for Visual's narrower Brand Voice slice below).
export const CONTEXT_MATRIX = Object.freeze({
  content:  Object.freeze({ businessFacts: 'yes', audience: 'yes', commercialGoal: 'yes', positioning: 'yes', valueProposition: 'yes', differentiators: 'yes', brandVoice: 'yes', productMemory: 'when', visualIdentity: 'no',  visualDirection: 'no' }),
  copy:     Object.freeze({ businessFacts: 'yes', audience: 'yes', commercialGoal: 'yes', positioning: 'yes', valueProposition: 'yes', differentiators: 'yes', brandVoice: 'yes', productMemory: 'when', visualIdentity: 'no',  visualDirection: 'no' }),
  whatsapp: Object.freeze({ businessFacts: 'yes', audience: 'yes', commercialGoal: 'yes', positioning: 'yes', valueProposition: 'yes', differentiators: 'yes', brandVoice: 'yes', productMemory: 'when', visualIdentity: 'no',  visualDirection: 'no' }),
  reel:     Object.freeze({ businessFacts: 'yes', audience: 'yes', commercialGoal: 'yes', positioning: 'yes', valueProposition: 'yes', differentiators: 'yes', brandVoice: 'yes', productMemory: 'when', visualIdentity: 'no',  visualDirection: 'no' }),
  offer:    Object.freeze({ businessFacts: 'yes', audience: 'yes', commercialGoal: 'yes', positioning: 'yes', valueProposition: 'yes', differentiators: 'yes', brandVoice: 'yes', productMemory: 'yes',  visualIdentity: 'no',  visualDirection: 'no' }),
  campaign: Object.freeze({ businessFacts: 'yes', audience: 'yes', commercialGoal: 'yes', positioning: 'yes', valueProposition: 'yes', differentiators: 'yes', brandVoice: 'yes', productMemory: 'yes',  visualIdentity: 'no',  visualDirection: 'no' }),
  // Visual's Brand Voice is 'limited': personality and toneOfVoice only (see LIMITED_FIELDS
  // below) — doList/dontList/preferredVocabulary/prohibitedVocabulary are textual writing rules
  // that have no function in an image-generation prompt and are explicitly excluded.
  visual:   Object.freeze({ businessFacts: 'yes', audience: 'yes', commercialGoal: 'yes', positioning: 'yes', valueProposition: 'yes', differentiators: 'yes', brandVoice: 'limited', productMemory: 'yes', visualIdentity: 'yes', visualDirection: 'yes' })
});

// Field-level overrides for a 'limited' group entry. Only Visual uses this today, and only for
// brandVoice — this is what keeps the exclusion of preferredVocabulary/prohibitedVocabulary/
// doList/dontList exact and explicit rather than implicit.
export const LIMITED_FIELDS = Object.freeze({
  visual: Object.freeze({ brandVoice: Object.freeze(['personality', 'toneOfVoice']) })
});

// Resolves the exact field list each context group contributes for a given consumer, honoring
// 'yes'/'no'/'when'/'limited'. Returns a plain object keyed by group name -> array of field
// names (never a single flattened "send everything" blob). 'when' groups are still resolved to
// their full field list here — the caller is expected to gate actual inclusion on whether a
// product was selected for that specific task; no product-selector logic exists in this batch.
export function resolveContextFields(consumer) {
  if (!CONSUMERS.includes(consumer)) throw new Error(`Unknown V4 context consumer: ${consumer}`);
  const policy = CONTEXT_MATRIX[consumer];
  const resolved = {};
  for (const group of Object.keys(CONTEXT_GROUPS)) {
    const visibility = policy[group];
    if (visibility === 'no') { resolved[group] = []; continue; }
    if (visibility === 'yes' || visibility === 'when') { resolved[group] = [...CONTEXT_GROUPS[group]]; continue; }
    if (visibility === 'limited') { resolved[group] = [...(LIMITED_FIELDS[consumer]?.[group] ?? [])]; continue; }
    throw new Error(`Unknown V4 context visibility "${visibility}" for ${consumer}.${group}`);
  }
  return resolved;
}

// Flat convenience form of resolveContextFields(): every visible field name for a consumer,
// across all groups, as a single deduplicated array — still only what that consumer is allowed,
// never a universal "every field" list.
export function flatContextFields(consumer) {
  const resolved = resolveContextFields(consumer);
  return [...new Set(Object.values(resolved).flat())];
}

// Whether a given group is reachable for a consumer only when a product has been selected for
// the current task (no selector implemented yet — see module header).
export function isProductConditional(consumer, group) {
  if (!CONSUMERS.includes(consumer)) throw new Error(`Unknown V4 context consumer: ${consumer}`);
  return CONTEXT_MATRIX[consumer][group] === 'when';
}
