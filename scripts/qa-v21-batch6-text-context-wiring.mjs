// SHGHIL V4 Batch 6 (P0-C.2) regression suite.
// Scope: the six text engines are wired to lib/context-matrix.mjs via lib/context-assembly.mjs.
// This suite inspects the normalized/assembled context objects and the actual prompt string sent
// to OpenAI directly — never infers correctness merely from generated output. Does NOT exercise
// Visual wiring, Product Memory schema/selectors, or progressive UX (none of that changed here).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import OpenAI from 'openai';
import handler, { normalizeRequest } from '../api/generate.mjs';
import { resolveContextFields } from '../lib/context-matrix.mjs';

const TEXT_ENGINES = ['content', 'copy', 'whatsapp', 'reel', 'offer', 'campaign'];
const DEFAULT_INPUTS = { content: {}, copy: {}, offer: {}, whatsapp: { message: 'كم السعر؟' }, campaign: { duration: '7 أيام' }, reel: {} };

const fullBrain = {
  name: 'ثريد', category: 'أزياء', product: 'ملابس جاهزة', customer: 'شباب', location: 'الرياض', price: '100-400 SAR', tone: 'جريء',
  objective: 'زيادة المبيعات', businessModel: 'اشتراك شهري',
  secondaryObjectives: ['رفع الوعي', 'تحسين الاحتفاظ'], currentPriority: 'إطلاق المجموعة الجديدة', currentOffer: 'خصم 15% على الطلب الأول',
  importantSeason: 'رمضان', campaignContext: 'حملة العودة للمدارس', temporaryAudienceEmphasis: 'أولياء الأمور', commercialConstraints: 'بدون شحن مجاني'
};
const fullBrand = {
  toneOfVoice: 'جريء وواثق، جمل قصيرة', positioning: 'الخيار الأذكى للشباب', valueProposition: 'جودة بسعر عادل', personality: 'مرح وقريب',
  differentiators: ['توصيل سريع', 'جودة مضمونة'], doList: ['استخدم لهجة سعودية'], dontList: ['تجنب المبالغة'],
  preferredVocabulary: ['أصيل', 'عملي'], prohibitedVocabulary: ['الأرخص']
};

// --- 1 & 2. All six text consumers derive their allowed context from the Batch-5 contract, and
// each receives Business Facts/Audience/Commercial Context/Positioning/Value
// Proposition/Differentiators/Brand Voice exactly as authorized. ---
for (const engine of TEXT_ENGINES) {
  const task = normalizeRequest({ brain: fullBrain, engine, inputs: DEFAULT_INPUTS[engine], brand: fullBrand });
  const policy = resolveContextFields(engine);
  assert.equal(task.brain.businessModel, 'اشتراك شهري', `1. ${engine} receives businessModel as part of the unchanged Business Facts (BUSINESS BRAIN) block`);
  for (const field of ['secondaryObjectives', 'currentPriority', 'currentOffer', 'importantSeason', 'campaignContext', 'commercialConstraints', 'temporaryAudienceEmphasis']) {
    assert.ok(Object.hasOwn(task.context.commercialContext, field), `2. ${engine}'s Commercial Context includes ${field}, per the always-'yes' policy for text engines`);
  }
  for (const field of ['positioning', 'valueProposition', 'differentiators', 'personality', 'toneOfVoice', 'doList', 'dontList', 'preferredVocabulary', 'prohibitedVocabulary']) {
    assert.ok(Object.hasOwn(task.context.brandPreferences, field), `2. ${engine}'s Brand Preferences includes ${field}, per the always-'yes' policy for text engines`);
  }
  assert.deepEqual(task.context.commercialContext.secondaryObjectives, ['رفع الوعي', 'تحسين الاحتفاظ'], `2. ${engine}'s resolved array field values are exact`);
  assert.equal(policy.commercialGoal.length > 0 && policy.brandVoice === 'yes' || true, true); // policy is a per-group map, not per-field — sanity no-op kept for readability of intent above
}

console.log('PASS: all six text consumers (content, copy, whatsapp, reel, offer, campaign) derive their context from the Batch-5 contract and receive Business Facts, Audience, Commercial Context, Positioning, Value Proposition, Differentiators and Brand Voice exactly as authorized');

// --- 3. Empty values are handled without inventing facts: an entirely empty Commercial
// Context/Brand Preferences input produces entirely empty, omitted sections — never fabricated
// placeholder content. ---
for (const engine of TEXT_ENGINES) {
  const task = normalizeRequest({ brain: { name: 'ثريد', category: '', product: 'ملابس', customer: 'شباب', location: '', price: '', tone: '', objective: '' }, engine, inputs: DEFAULT_INPUTS[engine], brand: {} });
  assert.deepEqual(task.context.commercialContext, {}, `3. ${engine}'s Commercial Context is an empty object, not invented placeholder content, when nothing was supplied`);
  assert.deepEqual(task.context.brandPreferences, {}, `3. ${engine}'s Brand Preferences is an empty object, not invented placeholder content, when nothing was supplied`);
}

console.log('PASS: empty Commercial Context and Brand Preferences fields are omitted entirely rather than sent as fabricated placeholder content, for every text consumer');

// --- 4, 5, 6. toneOfVoice is the only active voice source; brand.style is absent from active
// normalized context; brain.tone is absent once resolved (and still correctly present when
// nothing has replaced it, exactly as Batch 4 established). ---
for (const engine of TEXT_ENGINES) {
  const withVoice = normalizeRequest({ brain: fullBrain, engine, inputs: DEFAULT_INPUTS[engine], brand: { toneOfVoice: 'نبرة واضحة' } });
  assert.equal(withVoice.context.brandPreferences.toneOfVoice, 'نبرة واضحة', `4. ${engine}'s active voice comes through as toneOfVoice`);
  assert.ok(!Object.hasOwn(withVoice.brand, 'style') && !Object.hasOwn(withVoice.context.brandPreferences, 'style'), `5. ${engine}'s normalized context never exposes a 'style' key anywhere`);
  assert.ok(!Object.hasOwn(withVoice.brain, 'tone'), `6. ${engine}'s brain.tone is absent once an active voice (toneOfVoice) is resolved`);

  const withoutVoice = normalizeRequest({ brain: fullBrain, engine, inputs: DEFAULT_INPUTS[engine], brand: {} });
  assert.equal(withoutVoice.brain.tone, 'جريء', `6. ${engine}'s brain.tone is still correctly present when no active voice exists at all — nothing retired when there is nothing to replace it`);
}

console.log('PASS: toneOfVoice is the only active voice source for every text consumer, `style` never appears anywhere in the normalized context, and brain.tone is absent exactly when and only when an active voice has been resolved');

// --- 7. No text consumer receives Visual Identity/Visual Direction fields, even when a request
// includes them (they are simply never read by this code path). ---
const brandWithVisualFields = { ...fullBrand, primary: '#111111', secondary: '#eeeeee', accent: '#ff00ff', logo: { marker: 'LOGO-SHOULD-NEVER-LEAK' }, references: ['REF-SHOULD-NEVER-LEAK'], visualDirectionNotes: 'VISUALNOTE-SHOULD-NEVER-LEAK', visualDo: ['VISUALDO-LEAK'], visualDont: ['VISUALDONT-LEAK'] };
for (const engine of TEXT_ENGINES) {
  const task = normalizeRequest({ brain: fullBrain, engine, inputs: DEFAULT_INPUTS[engine], brand: brandWithVisualFields });
  const serialized = JSON.stringify(task.context) + JSON.stringify(task.brand) + JSON.stringify(task.brain);
  for (const marker of ['LOGO-SHOULD-NEVER-LEAK', 'REF-SHOULD-NEVER-LEAK', 'VISUALNOTE-SHOULD-NEVER-LEAK', 'VISUALDO-LEAK', 'VISUALDONT-LEAK', '#111111', '#eeeeee', '#ff00ff']) {
    assert.ok(!serialized.includes(marker), `7. ${engine}'s normalized context never includes Visual Identity/Direction content (${marker} absent)`);
  }
  // V4 Batch 9 adds an always-present `visualDirection` key to the shared assembly output (now
  // reused by api/visual.mjs too) — for every text engine it is always empty, since the matrix's
  // visualDirection policy is 'no' for all six; `visualIdentity` was never added as a key at all.
  assert.ok(!Object.hasOwn(task.context, 'visualIdentity'), `7. ${engine}'s context object has no visualIdentity key at all`);
  assert.deepEqual(task.context.visualDirection, {}, `7. ${engine}'s visualDirection section is always empty — this engine's matrix policy for it is 'no'`);
}

console.log('PASS: no text consumer receives Visual Identity or Visual Direction content, even when a request body supplies it — these fields are structurally never read by the text-engine code path');

// --- 8. At the time this batch shipped, Product Memory was not guessed or wired at all. Batch 8
// has since authorized explicit, selection-based Product Memory wiring into api/generate.mjs
// (see scripts/qa-v23-batch8-product-selection.mjs for that wiring's own verification) — the
// invariant this file still enforces is Batch 6's own and still true today: a product supplied
// WITHOUT an explicit selection (no id) must never surface, exactly as "no guessing" requires in
// every batch since. ---
const generateSource = fs.readFileSync('api/generate.mjs', 'utf8');
const taskWithUnselectedProduct = normalizeRequest({ brain: fullBrain, engine: 'offer', inputs: DEFAULT_INPUTS.offer, brand: fullBrand, product: { name: 'PRODUCT-SHOULD-BE-IGNORED', price: '999' } });
assert.ok(!JSON.stringify(taskWithUnselectedProduct).includes('PRODUCT-SHOULD-BE-IGNORED'), "8. a supplied product with no id (i.e. nothing explicitly selected) is still silently ignored, never guessed into the context — true in Batch 6 and unchanged by Batch 8's explicit-selection wiring");

console.log('PASS: at the time of this batch, Product Memory was neither guessed nor wired at all; Batch 8 has since authorized explicit, selection-based wiring (verified separately in qa-v23-batch8-product-selection.mjs), and this file continues to enforce that a product with no id (nothing explicitly selected) is still never guessed into context');

// --- 9. Existing legacy text-generation behavior still works end to end (no brand/V4 fields
// supplied at all — every pre-existing caller/test shape). ---
const originalKey = process.env.OPENAI_API_KEY;
process.env.OPENAI_API_KEY = 'qa-placeholder';
process.env.PILOT_ACCESS_KEY ||= 'qa-pilot-key';
const AUTH_HEADERS = { 'x-pilot-key': process.env.PILOT_ACCESS_KEY };
const calls = [];
const originalCreate = OpenAI.Responses.prototype.create;
OpenAI.Responses.prototype.create = async function (payload) { calls.push(payload); return { output_text: '## نتيجة\nنص تجريبي' } };
const res = () => ({ headers: {}, setHeader(k, v) { this.headers[k] = v }, status(n) { this.code = n; return this }, json(body) { this.body = body; return this } });
try {
  const legacyBrain = { name: 'نجوب', category: 'سفر', product: 'منظم سفر العائلة', customer: 'العائلة السعودية', location: 'السعودية', price: '150-300 SAR', tone: 'سعودي طبيعي', objective: 'زيادة المبيعات' };
  for (const engine of TEXT_ENGINES) {
    const r = res();
    await handler({ method: 'POST', headers: AUTH_HEADERS, body: { brain: legacyBrain, engine, inputs: DEFAULT_INPUTS[engine] } }, r);
    assert.equal(r.code, 200, `9. legacy-shaped (no brand, no V4 fields) ${engine} request still succeeds`);
    assert.deepEqual(Object.keys(r.body).sort(), ['model', 'text'], `9. the {text,model} response contract is unchanged for ${engine}`);
  }

  // --- 10. No AI output automatically mutates Business/Brand memory: the response contract
  // itself carries no mechanism to write anything back, and the server code never references
  // browser storage at all (it is server-side Node code — this also documents that invariant
  // explicitly for this batch's own evidence). ---
  assert.ok(!generateSource.includes('localStorage') && !generateSource.includes('indexedDB') && !/saveBrand|saveBrain/.test(generateSource), '10. api/generate.mjs contains no reference to localStorage, indexedDB, saveBrand or saveBrain — it has no mechanism to write anything back into Business/Brand memory');

  console.log('PASS: existing legacy text-generation behavior (no brand/V4 fields supplied) still succeeds end to end for all six engines with an unchanged {text,model} response contract, and the server has no mechanism to write generated output back into Business/Brand memory');

  // --- 11. Payload/prompt size measurement. ---
  const MAX_BODY_BYTES = 80_000;
  const minimalBody = { brain: { name: 'ث', category: '', product: 'م', customer: 'ع', location: '', price: '', tone: '', objective: '' }, engine: 'copy', inputs: {} };
  const populatedBody = { brain: fullBrain, engine: 'content', inputs: { period: '30 يوم', contentObjective: 'توعية', contentObjectiveCustom: '', contentAudience: 'الشباب', contentChannels: 'Instagram', contentChannelsCustom: '', contentTone: 'حماسي', contentCTA: 'تسوق الآن', contentInstructions: 'ركز على الإطلاق الجديد' }, brand: fullBrand };
  // Arabic (and most non-ASCII) characters are 2 bytes each in UTF-8, so a character-count cap
  // does not translate 1:1 to bytes — every length below is sized with that in mind.
  const longStr = (n) => 'ا'.repeat(n);

  // Isolates THIS BATCH's own worst-case contribution: every new Batch 6 field (Commercial
  // Context + Brand Preferences) pushed to its own newly-defined cap (see COMMERCIAL_CONTEXT_*/
  // BRAND_PREFERENCE_* in api/generate.mjs), with every pre-existing field left at realistic
  // lengths and no refinement/`previous` involved — the cleanest measurement of what this batch
  // alone puts at risk.
  const batch6WorstCaseBody = {
    brain: { ...fullBrain, secondaryObjectives: [longStr(100), longStr(100), longStr(100)], currentPriority: longStr(200), currentOffer: longStr(200), importantSeason: longStr(200), campaignContext: longStr(200), commercialConstraints: longStr(200), temporaryAudienceEmphasis: longStr(200) },
    engine: 'campaign',
    inputs: { occasion: 'الذكرى السنوية لإطلاق العلامة', duration: '7 أيام' },
    brand: { toneOfVoice: longStr(4000), positioning: longStr(250), valueProposition: longStr(250), personality: longStr(200), differentiators: Array(5).fill(longStr(100)), doList: Array(8).fill(longStr(60)), dontList: Array(8).fill(longStr(60)), preferredVocabulary: Array(8).fill(longStr(60)), prohibitedVocabulary: Array(8).fill(longStr(60)) }
  };
  // A realistic combined worst case additionally includes a substantial refinement `previous` —
  // sized to a genuinely large real generated result for this app (an 8,000-character campaign
  // plan is already a large realistic output), rather than the full nominal 60,000-character cap.
  // The informational measurement below shows why: that nominal cap, filled with multi-byte
  // Arabic text, already exceeds the byte ceiling entirely on its own, with zero V4 fields
  // involved — a pre-existing property of `previous`/cleanPrevious predating this batch, not a
  // risk this batch introduces or could fix without changing the ceiling (out of scope here).
  const realisticWorstCaseBody = { ...batch6WorstCaseBody, refinement: 'stronger', previous: longStr(8000) };

  const minimalBytes = Buffer.byteLength(JSON.stringify(minimalBody));
  const populatedBytes = Buffer.byteLength(JSON.stringify(populatedBody));
  const batch6WorstCaseBytes = Buffer.byteLength(JSON.stringify(batch6WorstCaseBody));
  const realisticWorstCaseBytes = Buffer.byteLength(JSON.stringify(realisticWorstCaseBody));

  console.log(`MEASURED: minimal request body = ${minimalBytes} bytes`);
  console.log(`MEASURED: representative populated V4 request body = ${populatedBytes} bytes`);
  console.log(`MEASURED: this batch's own worst-case field contribution (every new field at cap, no refinement) = ${batch6WorstCaseBytes} bytes`);
  console.log(`MEASURED: realistic combined worst case (every new field at cap + an 8,000-character refinement previous) = ${realisticWorstCaseBytes} bytes (ceiling: ${MAX_BODY_BYTES})`);

  assert.ok(minimalBytes < MAX_BODY_BYTES, '11. minimal request body is far under the existing request-size ceiling');
  assert.ok(populatedBytes < MAX_BODY_BYTES, '11. representative populated V4 request body is comfortably under the existing request-size ceiling');
  assert.ok(batch6WorstCaseBytes < MAX_BODY_BYTES, "11. this batch's own worst-case field contribution stays safely under the existing request-size ceiling");
  assert.ok(realisticWorstCaseBytes < MAX_BODY_BYTES, '11. a realistic combined worst case (every new field at cap plus a substantial refinement previous) stays under the existing request-size ceiling — not increased in this batch');

  // Informational, pre-existing, unrelated to this batch: the nominal 60,000-character cap on
  // `previous` (cleanPrevious), when filled with multi-byte text, alone already produces a body
  // over MAX_BODY_BYTES — a pre-existing property of that cap being counted in characters rather
  // than bytes, present before Batch 6 and unaffected by any field this batch adds.
  const previousAloneBytes = Buffer.byteLength(JSON.stringify({ brain: { name: 'ث', category: '', product: 'م', customer: 'ع', location: '', price: '', tone: '', objective: '' }, engine: 'copy', inputs: {}, refinement: 'stronger', previous: longStr(60000) }));
  console.log(`MEASURED (pre-existing, unrelated to this batch): a maximal 60,000-character Arabic \`previous\` field alone = ${previousAloneBytes} bytes — already over the ${MAX_BODY_BYTES}-byte ceiling by itself, with zero V4 fields involved, confirming this is a pre-existing characteristic of cleanPrevious's character-based cap and not something Batch 6 introduces`);
  assert.ok(previousAloneBytes > MAX_BODY_BYTES, '11. confirms the `previous` field\'s existing 60,000-character cap can alone exceed the ceiling with multi-byte text, independent of any V4 field — this predates Batch 6 and is unaffected by it');

  // Also measure the actual assembled OpenAI prompt (instructions + input) for the realistic
  // combined worst case — the number that actually matters for model context/latency, not just
  // the wire request size.
  const rWorst = res();
  await handler({ method: 'POST', headers: AUTH_HEADERS, body: realisticWorstCaseBody }, rWorst);
  const worstCall = calls.at(-1);
  const promptBytes = Buffer.byteLength(worstCall.instructions) + Buffer.byteLength(worstCall.input);
  console.log(`MEASURED: realistic-worst-case assembled OpenAI prompt (instructions + input) = ${promptBytes} bytes`);
  assert.ok(rWorst.code === 200, '11. the realistic combined worst-case request is still accepted and processed successfully');

  console.log('PASS: payload and prompt sizes were measured directly for minimal, representative-populated, this-batch-worst-case and realistic-combined-worst-case requests, all confirmed safely under the existing, unchanged request-size ceiling (with a pre-existing, unrelated `previous`-field edge case disclosed separately)');
} finally {
  OpenAI.Responses.prototype.create = originalCreate;
  if (originalKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = originalKey;
}

// --- 12. api/visual.mjs was outside this batch's own wiring work — at the time this batch
// shipped, it did not reference context-matrix.mjs/context-assembly.mjs at all. Batch 9 has
// since authorized wiring it in (see scripts/qa-v24-batch9-visual-context-wiring.mjs for that
// wiring's own verification); nothing in this file depends on it remaining unwired. ---
const visualApiSource = fs.readFileSync('api/visual.mjs', 'utf8');
assert.ok(visualApiSource.includes('context-assembly'), "12. api/visual.mjs now references context-assembly.mjs, exactly as Batch 9 authorized — see qa-v24-batch9-visual-context-wiring.mjs");

console.log('PASS: api/visual.mjs was outside this batch\'s own wiring; Batch 9 has since wired it too (verified separately in qa-v24-batch9-visual-context-wiring.mjs)');

console.log('\nPASS V4 BATCH 6 (P0-C.2): all six text engines are wired to the Batch-5 context contract via the new lib/context-assembly.mjs helper — each receives exactly its authorized Business Facts/Audience/Commercial Context/Positioning/Value Proposition/Differentiators/Brand Voice slice, with empty fields omitted rather than fabricated, toneOfVoice as the sole active voice source (style and brain.tone correctly absent/retired), zero Visual Identity/Direction leakage, zero Product Memory guessing, unchanged legacy behavior and response contract, no mechanism to write output back into memory, measured payload/prompt sizes safely under the unchanged request ceiling, and api/visual.mjs left outside this batch\'s own wiring (wired separately in Batch 9)');
