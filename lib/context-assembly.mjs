// SHGHIL V4 Batch 6 (P0-C.2) — the minimum shared helper that applies the lib/context-matrix.mjs
// policy to build the two new, distinguishable context sections for a text-engine consumer:
// Commercial Context (time-bound priorities) and Brand Preferences (strategic/voice guidance).
//
// This module does not validate or sanitize field values — that stays local to each API endpoint
// (api/generate.mjs), exactly as the Batch 5 architecture rule requires. It only SELECTS which
// already-sanitized fields a given consumer is authorized to see, and OMITS empty ones so an
// unpopulated field never appears in the prompt as if it were a deliberate instruction.
//
// Business Facts stay in the existing, unchanged "BUSINESS BRAIN" block each API file already
// builds directly — this module only covers the two genuinely new sections, so a later batch
// wiring Visual Studio (or any other consumer) can reuse it without re-deriving this policy.
import { resolveContextFields } from './context-matrix.mjs';

function isEmpty(value) {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function pick(source, fields, allowed) {
  const out = {};
  for (const field of fields) {
    if (!allowed.has(field)) continue;
    const value = source?.[field];
    if (isEmpty(value)) continue;
    out[field] = value;
  }
  return out;
}

const COMMERCIAL_CONTEXT_FIELDS = ['secondaryObjectives', 'currentPriority', 'currentOffer', 'importantSeason', 'campaignContext', 'commercialConstraints', 'temporaryAudienceEmphasis'];
const BRAND_PREFERENCE_FIELDS = ['positioning', 'valueProposition', 'differentiators', 'personality', 'toneOfVoice', 'doList', 'dontList', 'preferredVocabulary', 'prohibitedVocabulary'];

// Builds { commercialContext, brandPreferences } for `consumer`, restricted to exactly what
// lib/context-matrix.mjs authorizes (never a universal "send everything" object — a consumer not
// authorized for a group simply never sees any of that group's fields, regardless of what the
// caller passes in). `commercialContextSource` and `brandPreferenceSource` are the already-
// sanitized raw values (e.g. { ...brain-derived fields }, { ...brand-derived fields }).
export function assembleTextContext(consumer, commercialContextSource, brandPreferenceSource) {
  const policy = resolveContextFields(consumer);
  const allowed = new Set([
    ...policy.commercialGoal, ...policy.audience,
    ...policy.positioning, ...policy.valueProposition, ...policy.differentiators,
    ...policy.brandVoice
  ]);
  return {
    commercialContext: pick(commercialContextSource, COMMERCIAL_CONTEXT_FIELDS, allowed),
    brandPreferences: pick(brandPreferenceSource, BRAND_PREFERENCE_FIELDS, allowed)
  };
}
