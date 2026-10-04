// SHGHIL V4 Batch 6 (P0-C.2) — the minimum shared helper that applies the lib/context-matrix.mjs
// policy to build the new, distinguishable context sections for a consumer: Commercial Context
// (time-bound priorities), Brand Preferences (strategic/voice guidance), selected Product Memory,
// and Visual Direction.
//
// This module does not validate or sanitize field values — that stays local to each API endpoint
// (api/generate.mjs, api/visual.mjs), exactly as the Batch 5 architecture rule requires. It only
// SELECTS which already-sanitized fields a given consumer is authorized to see, and OMITS empty
// ones so an unpopulated field never appears in the prompt as if it were a deliberate instruction.
//
// Business Facts and Visual Identity stay in each API file's own existing, dedicated handling
// (the unchanged "BUSINESS BRAIN" block; Visual's primary/secondary/accent/logo/references,
// which route through image compositing, never through this text-only module) — this module only
// covers the sections built from plain text/array fields, shared identically across consumers.
//
// V4 Batch 8 added selectedProduct rather than a parallel ad-hoc Product prompt path. V4 Batch 9
// renamed this export from assembleTextContext to assembleContext and added the visualDirection
// section, since this same function (parameterized purely by `consumer`) now serves Visual Studio
// as well as the six text engines — the Batch-5 matrix remains the single canonical policy
// source for every section this module builds, for every consumer.
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
// V4 Batch 8: the approved Product Memory allowlist for an explicitly selected product — never
// image/reference, and never any field outside lib/context-matrix.mjs's productMemory group.
const PRODUCT_MEMORY_FIELDS = ['id', 'name', 'category', 'description', 'price', 'specifications', 'features', 'benefits', 'useCases', 'audienceRelevance', 'offers'];
// V4 Batch 9: Visual Direction is its own group in the matrix, distinct from Brand
// Preferences/Voice — kept as its own output section rather than folded into brandPreferences,
// so Visual's context stays semantically separated instead of one flattened object. For every
// text engine, policy.visualDirection is always [] (matrix: 'no'), so this section is always {}
// there, exactly as before this batch — no behavior change for any text engine.
const VISUAL_DIRECTION_FIELDS = ['visualDirectionNotes', 'visualDo', 'visualDont'];

// Builds { commercialContext, brandPreferences, visualDirection, selectedProduct } for
// `consumer`, restricted to exactly what lib/context-matrix.mjs authorizes (never a universal
// "send everything" object — a consumer not authorized for a group simply never sees any of
// that group's fields, regardless of what the caller passes in). `commercialContextSource` and
// `brandPreferenceSource` are the already-sanitized raw values (e.g. { ...brain-derived fields },
// { ...brand-derived fields }); `brandPreferenceSource` also supplies the Visual Direction
// fields, since both live in the same stored Brand Brain record.
//
// `productSource` is the already-sanitized, already-selected product's raw fields — or
// undefined/empty when no product was selected for this task. Selection is explicit and
// client-driven; this function never infers, guesses, or auto-picks a product. Product Memory
// is included only when a product was actually selected (productSource.id is non-empty) — the
// matrix's 'yes' vs 'when' distinction for a given consumer does not change that: neither value
// means "include even when nothing was selected," only "may be included once something is."
export function assembleContext(consumer, commercialContextSource, brandPreferenceSource, productSource) {
  const policy = resolveContextFields(consumer);
  const allowed = new Set([
    ...policy.commercialGoal, ...policy.audience,
    ...policy.positioning, ...policy.valueProposition, ...policy.differentiators,
    ...policy.brandVoice
  ]);
  const productAllowed = new Set(policy.productMemory);
  const visualDirectionAllowed = new Set(policy.visualDirection);
  const selectedProduct = productSource?.id ? pick(productSource, PRODUCT_MEMORY_FIELDS, productAllowed) : {};
  return {
    commercialContext: pick(commercialContextSource, COMMERCIAL_CONTEXT_FIELDS, allowed),
    brandPreferences: pick(brandPreferenceSource, BRAND_PREFERENCE_FIELDS, allowed),
    visualDirection: pick(brandPreferenceSource, VISUAL_DIRECTION_FIELDS, visualDirectionAllowed),
    selectedProduct
  };
}
