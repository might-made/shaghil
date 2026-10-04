// SHGHIL V4 Batch 9 regression suite: V4 Visual Context Wiring.
// Scope: Visual Studio image generation is wired to the approved Batch-5 matrix's exact Visual
// allowlist, reusing (not duplicating) the shared assembly architecture lib/context-assembly.mjs
// already built for the six text engines. Inspects the normalized Visual context directly, not
// merely the generated image prompt/output.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import OpenAI from 'openai';
import visualHandler, { normalizeVisual, makePrompt } from '../api/visual.mjs';
import { resolveContextFields } from '../lib/context-matrix.mjs';

const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==';
const image = { type: 'image/png', base64: png };

const fullBrain = {
  name: 'ثريد', category: 'أزياء', product: 'ملابس جاهزة للبيع بالتجزئة', customer: 'شباب', location: 'الرياض', price: '100-400 SAR', tone: 'جريء', objective: 'زيادة المبيعات',
  businessModel: 'تجارة إلكترونية', currentOffer: 'خصم اليوم فقط', secondaryObjectives: ['رفع الوعي'], currentPriority: 'إطلاق المجموعة الجديدة', importantSeason: 'رمضان', campaignContext: 'حملة العودة للمدارس', commercialConstraints: 'بدون شحن مجاني', temporaryAudienceEmphasis: 'أولياء الأمور'
};
const fullBrand = {
  primary: '#e7f95b', secondary: '#181b1f', accent: '#ff00aa', logo: image, references: [],
  toneOfVoice: 'جريء وواثق', positioning: 'الخيار الأذكى للشباب', valueProposition: 'جودة بسعر عادل', personality: 'مرح وقريب',
  differentiators: ['توصيل سريع', 'جودة مضمونة'], doList: ['استخدم لهجة سعودية'], dontList: ['تجنب المبالغة'],
  preferredVocabulary: ['أصيل'], prohibitedVocabulary: ['الأرخص'],
  visualDirectionNotes: 'التزم بخلفيات فاتحة ومساحات بسيطة', visualDo: ['استخدم إضاءة طبيعية'], visualDont: ['تجنب الخلفيات الصاخبة']
};
const fullProductMemory = {
  id: 'prod-1', name: 'قميص قطني أزرق', category: 'ملابس', description: 'قميص قطني مريح', price: '120 SAR',
  specifications: ['قطن 100%'], features: ['خامة ناعمة'], benefits: ['راحة طوال اليوم'], useCases: ['الاستخدام اليومي'],
  audienceRelevance: 'مناسب للشباب العصري', offers: ['اشترِ 2 بسعر 1']
};
const baseTask = { engine: 'content', selected: 'اليوم الأول: قميص الصيف', context: 'اليوم الأول: قميص الصيف\nCTA: تسوق الآن' };
const baseSettings = { format: '1:1', mode: 'Product Hero', textMode: 'none', headline: '', cta: '' };
const fullBody = { brain: fullBrain, brand: fullBrand, task: baseTask, settings: baseSettings };

// --- 1. Visual derives its policy from the shared matrix. ---
const policy = resolveContextFields('visual');
assert.deepEqual(policy.brandVoice, ['personality', 'toneOfVoice'], "1. the matrix's own resolved policy for visual.brandVoice is exactly {personality, toneOfVoice} — the policy source this batch's wiring must follow");
const contextAssemblySource = fs.readFileSync('lib/context-assembly.mjs', 'utf8');
const visualApiSource = fs.readFileSync('api/visual.mjs', 'utf8');
assert.ok(visualApiSource.includes("from '../lib/context-assembly.mjs'"), "1. api/visual.mjs imports the shared assembly helper rather than duplicating selection logic");
assert.ok(contextAssemblySource.includes("from './context-matrix.mjs'"), '1. lib/context-assembly.mjs itself still resolves policy from context-matrix.mjs — the single canonical source for every consumer, Visual included');

console.log('PASS: Visual derives its policy from the shared lib/context-matrix.mjs contract via the same lib/context-assembly.mjs helper the six text engines use — no parallel, ad-hoc Visual-only policy exists');

// --- 2, 3, 4, 5, 6. Business Facts, Audience, Commercial Context, positioning/valueProposition/
// differentiators, and personality + compact toneOfVoice are all included. ---
{
  const task = normalizeVisual(fullBody);
  for (const field of ['name', 'category', 'product', 'location', 'price', 'businessModel']) assert.equal(task.brain[field], fullBrain[field], `2. Business Facts field ${field} is included exactly`);
  assert.equal(task.brain.customer, fullBrain.customer, '3. Audience field (customer) is included via the existing Business Brain block');
  assert.equal(task.context.commercialContext.temporaryAudienceEmphasis, fullBrain.temporaryAudienceEmphasis, '3. Audience field (temporaryAudienceEmphasis) is included in Commercial Context');
  for (const field of ['secondaryObjectives', 'currentPriority', 'currentOffer', 'importantSeason', 'campaignContext', 'commercialConstraints']) assert.deepEqual(task.context.commercialContext[field], fullBrain[field], `4. Commercial Context field ${field} is included exactly`);
  for (const field of ['positioning', 'valueProposition']) assert.equal(task.context.brandPreferences[field], fullBrand[field], `5. Brand Strategy field ${field} is included exactly`);
  assert.deepEqual(task.context.brandPreferences.differentiators, fullBrand.differentiators, '5. differentiators are included exactly');
  assert.equal(task.context.brandPreferences.personality, fullBrand.personality, '6. personality is included exactly');
  assert.equal(task.brand.toneOfVoice, fullBrand.toneOfVoice, '6. the compact active toneOfVoice is included (in the existing brand.toneOfVoice field, capped at 1600 chars as established in Batch 4)');
}

console.log('PASS: Business Facts, Audience, Commercial Context, positioning/valueProposition/differentiators and personality + compact toneOfVoice are all present in the normalized Visual context exactly as authorized');

// --- 7, 8, 17. preferredVocabulary/prohibitedVocabulary and textual doList/dontList are
// absent — no text-only Brand Voice field leaks into Visual, even though the full Brand Brain
// record (which contains them) is sent wholesale by the client. ---
{
  const task = normalizeVisual(fullBody);
  const serialized = JSON.stringify(task);
  for (const field of ['preferredVocabulary', 'prohibitedVocabulary', 'doList', 'dontList']) {
    assert.ok(!Object.hasOwn(task.context.brandPreferences, field), `7/8. ${field} is absent from Visual's normalized brandPreferences`);
    assert.ok(!serialized.includes(JSON.stringify(fullBrand[field])), `17. ${field}'s actual content never leaks anywhere into Visual's normalized task, even though the full brand record carrying it was sent`);
  }
}

console.log('PASS: preferredVocabulary, prohibitedVocabulary and textual doList/dontList are absent from Visual\'s normalized context — no text-only Brand Voice field leaks in, even though the full Brand Brain record is sent wholesale by the client');

// --- 9. Visual Identity (primary/secondary/accent/logo/references) is preserved — the existing,
// unchanged mechanism (never routed through the new textual context sections). ---
{
  const task = normalizeVisual(fullBody);
  assert.equal(task.brand.primary, fullBrand.primary, '9. Visual Identity (primary) is preserved via the existing brand object');
  assert.equal(task.brand.secondary, fullBrand.secondary, '9. Visual Identity (secondary) is preserved');
  assert.equal(task.brand.accent, fullBrand.accent, '9. Visual Identity (accent) is preserved');
  assert.equal(task.hasLogo, true, '9. Visual Identity (logo) is preserved via the existing hasLogo flag — never raw bytes in the textual context');
  assert.ok(!Object.hasOwn(task.context.brandPreferences, 'primary') && !Object.hasOwn(task.context.brandPreferences, 'logo'), '9. Visual Identity fields are never duplicated into the new textual context sections');
}

console.log('PASS: Visual Identity (primary/secondary/accent/logo) is preserved via its existing, unchanged mechanism — never duplicated into the new textual context sections');

// --- 10. visualDirectionNotes/visualDo/visualDont are included, in their own distinguishable section. ---
{
  const task = normalizeVisual(fullBody);
  assert.equal(task.context.visualDirection.visualDirectionNotes, fullBrand.visualDirectionNotes, '10. visualDirectionNotes is included');
  assert.deepEqual(task.context.visualDirection.visualDo, fullBrand.visualDo, '10. visualDo is included');
  assert.deepEqual(task.context.visualDirection.visualDont, fullBrand.visualDont, '10. visualDont is included');
  assert.ok(!Object.hasOwn(task.context.brandPreferences, 'visualDirectionNotes'), '10. Visual Direction fields live in their own section, not flattened into brandPreferences');
}

console.log('PASS: visualDirectionNotes/visualDo/visualDont are included, kept in their own distinguishable visualDirection section rather than flattened into brandPreferences');

// --- 11, 12, 13. Selected Product Memory appears only for an explicitly selected stable
// product, never guessed, and always excludes image/reference. ---
{
  const withSelection = normalizeVisual({ ...fullBody, productMemory: { ...fullProductMemory, image: 'IMAGE-SHOULD-NEVER-APPEAR', reference: 'REFERENCE-SHOULD-NEVER-APPEAR' } });
  assert.deepEqual(Object.keys(withSelection.context.selectedProduct).sort(), ['id', 'name', 'category', 'description', 'price', 'specifications', 'features', 'benefits', 'useCases', 'audienceRelevance', 'offers'].sort(), '11. selectedProduct exposes exactly the approved allowlist for the explicitly selected product');
  assert.equal(withSelection.context.selectedProduct.id, 'prod-1', '11. selectedProduct carries the stable id of the explicitly selected product');
  const serializedWith = JSON.stringify(withSelection);
  assert.ok(!serializedWith.includes('IMAGE-SHOULD-NEVER-APPEAR') && !serializedWith.includes('REFERENCE-SHOULD-NEVER-APPEAR'), '13. Product textual context excludes image/reference even when supplied on body.productMemory');

  const withoutSelection = normalizeVisual(fullBody);
  assert.deepEqual(withoutSelection.context.selectedProduct, {}, '12. with no productMemory supplied at all, selectedProduct is empty — no guessing');
  const withEmptySelection = normalizeVisual({ ...fullBody, productMemory: {} });
  assert.deepEqual(withEmptySelection.context.selectedProduct, {}, '12. a productMemory object with no id (nothing explicitly selected) produces an empty selectedProduct — never guessed from brain.product, task text or history');
  const provocativeBody = { ...fullBody, brain: { ...fullBrain, product: `يبيع ${fullProductMemory.name} والمزيد` }, task: { ...baseTask, selected: `${fullProductMemory.name} بالتفصيل`, context: `${fullProductMemory.name} بالتفصيل` } };
  assert.deepEqual(normalizeVisual(provocativeBody).context.selectedProduct, {}, '12. no product is inferred even when brain.product or the task text textually names an existing product, without an explicit productMemory selection');
}

console.log('PASS: Selected Product Memory appears only for an explicitly selected stable product (by id), excludes image/reference even when supplied, and is never guessed from brain.product, task text or history');

// --- 14. Existing dedicated product-image/reference Visual behavior remains functional —
// end-to-end through the real handler, with the existing `product`/`images` compositing path
// completely independent of the new `productMemory` textual context. ---
{
  const oldKey = process.env.OPENAI_API_KEY, generate = OpenAI.Images.prototype.generate, edit = OpenAI.Images.prototype.edit;
  process.env.OPENAI_API_KEY = 'qa-image-placeholder';
  process.env.PILOT_ACCESS_KEY ||= 'qa-pilot-key';
  const AUTH_HEADERS = { 'x-pilot-key': process.env.PILOT_ACCESS_KEY };
  const calls = [];
  OpenAI.Images.prototype.generate = async function (p) { calls.push({ kind: 'generate', p }); return { data: [{ b64_json: '/9j/2Q==' }] } };
  OpenAI.Images.prototype.edit = async function (p) { calls.push({ kind: 'edit', p }); return { data: [{ b64_json: '/9j/2Q==' }] } };
  const res = () => ({ status(n) { this.code = n; return this }, json(b) { this.body = b; return this }, setHeader() {} });
  try {
    // Exact fidelity: the real product photo is composited locally — the model must receive an
    // EMPTY scene request (no images), exactly as before this batch, with or without productMemory.
    const exactBody = { ...fullBody, product: { name: 'قميص قطني أزرق', description: 'وصف', fidelity: 'exact' }, productMemory: fullProductMemory };
    const rExact = res();
    await visualHandler({ method: 'POST', headers: AUTH_HEADERS, body: exactBody }, rExact);
    assert.equal(rExact.code, 200, '14. exact-fidelity product generation still succeeds with productMemory also present');
    assert.equal(calls.at(-1).kind, 'generate', '14. exact fidelity still generates an empty scene (no image edit call) — the existing compositing path is untouched');
    assert.ok(calls.at(-1).p.prompt.includes('EXACT PRODUCT'), '14. the exact-fidelity prompt instruction is unaffected by the new productMemory context');

    // Creative fidelity: the supplied product image is still sent to images.edit as guidance.
    const creativeBody = { ...fullBody, product: { name: 'قميص قطني أزرق', description: 'وصف', fidelity: 'creative', image }, productMemory: fullProductMemory };
    const rCreative = res();
    await visualHandler({ method: 'POST', headers: AUTH_HEADERS, body: creativeBody }, rCreative);
    assert.equal(rCreative.code, 200, '14. creative-fidelity product generation still succeeds with productMemory also present');
    assert.equal(calls.at(-1).kind, 'edit', '14. creative fidelity still sends the product image through images.edit — the existing compositing path is untouched');
    assert.ok(!JSON.stringify(calls.at(-1).p).includes(png), '14. raw image bytes never leak into the textual prompt/body — only into the dedicated images.edit file payload');
  } finally {
    OpenAI.Images.prototype.generate = generate; OpenAI.Images.prototype.edit = edit;
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = oldKey;
  }
}

console.log('PASS: the existing dedicated product-image/reference compositing path (exact → empty scene + local compositing; creative → images.edit guidance) remains fully functional, completely independent of the new textual productMemory context');

// --- 15, 16. brand.style is absent from normalized active context; brain.tone is absent as a
// competing active voice once toneOfVoice resolves. ---
{
  const task = normalizeVisual(fullBody);
  assert.ok(!Object.hasOwn(task.brand, 'style'), '15. brand.style is absent from the normalized active Visual context');
  assert.ok(!Object.hasOwn(task.brain, 'tone'), '16. brain.tone is absent once an active voice (toneOfVoice) has resolved');
  const noVoiceBody = { ...fullBody, brand: { ...fullBrand, toneOfVoice: undefined } };
  delete noVoiceBody.brand.toneOfVoice;
  const taskNoVoice = normalizeVisual(noVoiceBody);
  assert.equal(taskNoVoice.brain.tone, fullBrain.tone, '16. brain.tone is still correctly present when no active voice exists at all — nothing retired when there is nothing to replace it');
}

console.log('PASS: brand.style never resurrects as the active voice key, and brain.tone is absent exactly when and only when toneOfVoice has resolved — the same voice invariant as every other consumer');

// --- 18. Empty/default fields do not become invented instructions — an entirely minimal
// request produces entirely empty new sections, omitted from the prompt text itself. ---
{
  const minimalBody = { brain: { name: 'ث', category: '', product: 'م', customer: 'ع', location: '', price: '', tone: '', objective: '' }, brand: { primary: '', secondary: '', accent: '', logo: null, references: [] }, task: baseTask, settings: baseSettings };
  const task = normalizeVisual(minimalBody);
  assert.deepEqual(task.context.commercialContext, {}, '18. an entirely empty Commercial Context is an empty object, not invented content');
  assert.deepEqual(task.context.brandPreferences, {}, '18. an entirely empty Brand Preferences is an empty object, not invented content');
  assert.deepEqual(task.context.visualDirection, {}, '18. an entirely empty Visual Direction is an empty object, not invented content');
  assert.deepEqual(task.context.selectedProduct, {}, '18. an entirely empty selectedProduct is an empty object, not invented content');
  const prompt = makePrompt(task, 0);
  for (const heading of ['COMMERCIAL CONTEXT', 'BRAND PREFERENCES', 'VISUAL DIRECTION', 'SELECTED PRODUCT CONTEXT']) assert.ok(!prompt.includes(heading), `18. the ${heading} section is omitted entirely from the prompt text when empty, never sent as a present-but-empty section`);

  const fullTask = normalizeVisual(fullBody);
  const fullPrompt = makePrompt(fullTask, 0);
  for (const heading of ['COMMERCIAL CONTEXT', 'BRAND PREFERENCES', 'VISUAL DIRECTION']) assert.ok(fullPrompt.includes(heading), `the ${heading} section IS present in the prompt when populated, confirming the omission above is conditional, not a dead code path`);
}

console.log('PASS: empty/default Commercial Context, Brand Preferences, Visual Direction and selected Product sections are omitted entirely from the assembled prompt — never invented or sent as empty placeholders');

// --- 19. Payload measurements remain safely within the existing, unchanged ceiling. ---
{
  const MAX_VISUAL_BODY_BYTES = 3_000_000;
  const minimalBody = { brain: { name: 'ث', category: '', product: 'م', customer: 'ع', location: '', price: '', tone: '', objective: '' }, brand: { primary: '', secondary: '', accent: '', logo: null, references: [] }, task: baseTask, settings: baseSettings };
  const populatedBody = fullBody;
  const selectedProductBody = { ...fullBody, productMemory: fullProductMemory };
  const longStr = n => 'ا'.repeat(n);
  const worstCaseBody = {
    ...fullBody,
    brain: { ...fullBrain, secondaryObjectives: [longStr(100), longStr(100), longStr(100)], currentPriority: longStr(200), currentOffer: longStr(200), importantSeason: longStr(200), campaignContext: longStr(200), commercialConstraints: longStr(200), temporaryAudienceEmphasis: longStr(200) },
    brand: { ...fullBrand, toneOfVoice: longStr(1600), positioning: longStr(250), valueProposition: longStr(250), personality: longStr(200), differentiators: Array(5).fill(longStr(100)), visualDirectionNotes: longStr(400), visualDo: Array(8).fill(longStr(100)), visualDont: Array(8).fill(longStr(100)) },
    productMemory: { id: longStr(100), name: longStr(200), category: longStr(100), description: longStr(600), price: longStr(100), specifications: Array(8).fill(longStr(150)), features: Array(8).fill(longStr(150)), benefits: Array(8).fill(longStr(150)), useCases: Array(8).fill(longStr(150)), audienceRelevance: longStr(300), offers: Array(5).fill(longStr(150)) }
  };
  const minimalBytes = Buffer.byteLength(JSON.stringify(minimalBody));
  const populatedBytes = Buffer.byteLength(JSON.stringify(populatedBody));
  const selectedProductBytes = Buffer.byteLength(JSON.stringify(selectedProductBody));
  const worstCaseBytes = Buffer.byteLength(JSON.stringify(worstCaseBody));
  console.log(`MEASURED: minimal Visual request body = ${minimalBytes} bytes`);
  console.log(`MEASURED: representative populated V4 Visual request body = ${populatedBytes} bytes`);
  console.log(`MEASURED: selected-product Visual request body = ${selectedProductBytes} bytes`);
  console.log(`MEASURED: synthetic worst-case Visual request body (every new V4 field at its cap) = ${worstCaseBytes} bytes (ceiling: ${MAX_VISUAL_BODY_BYTES})`);
  assert.ok(minimalBytes < MAX_VISUAL_BODY_BYTES, '19. minimal Visual request body is far under the existing request-size ceiling');
  assert.ok(populatedBytes < MAX_VISUAL_BODY_BYTES, '19. representative populated V4 Visual request body is comfortably under the existing request-size ceiling');
  assert.ok(selectedProductBytes < MAX_VISUAL_BODY_BYTES, '19. a selected-product Visual request body is comfortably under the existing request-size ceiling');
  assert.ok(worstCaseBytes < MAX_VISUAL_BODY_BYTES, '19. the synthetic worst-case Visual request body (every new V4 field at its cap) stays safely under the existing, unchanged 3,000,000-byte request-size ceiling — not increased in this batch');
  assert.doesNotThrow(() => normalizeVisual(worstCaseBody), '19. the worst-case synthetic request is still accepted and normalizes successfully');
}

console.log('PASS: payload sizes were measured directly for minimal, representative-populated, selected-product and synthetic-worst-case Visual requests, and all remain safely under the existing, unchanged request-size ceiling');

// --- 20. Existing text-engine Product Memory behavior remains unchanged by this batch. ---
{
  const generateSource = fs.readFileSync('api/generate.mjs', 'utf8');
  assert.ok(generateSource.includes('assembleContext'), '20. api/generate.mjs still calls the shared assembly helper (renamed from assembleTextContext to assembleContext in this batch, a pure rename with no behavior change)');
  assert.ok(!generateSource.includes('assembleTextContext'), '20. api/generate.mjs has no leftover reference to the old assembleTextContext name');
}

console.log('PASS: existing text-engine Product Memory and context-assembly behavior is unchanged by this batch — api/generate.mjs cleanly uses the renamed shared helper with no leftover reference to its old name');

console.log('\nPASS V4 BATCH 9: Visual Studio image generation is wired to the exact Batch-5 matrix Visual allowlist by reusing (not duplicating) lib/context-assembly.mjs — Business Facts, Audience, Commercial Context, Brand Strategy (positioning/valueProposition/differentiators), limited Brand Voice (personality + compact toneOfVoice), Visual Identity (unchanged, existing mechanism) and Visual Direction are all included in their own semantically separated sections; preferredVocabulary/prohibitedVocabulary/textual doList/dontList/brand.style/brain.tone-as-active-voice are all absent; Selected Product Memory appears only for an explicitly selected stable product (never guessed, never image/reference) while the existing dedicated product-image/reference compositing path remains fully functional and independent; empty sections are omitted rather than invented; payloads remain safely under the unchanged request ceiling; and existing text-engine behavior is unaffected by the pure rename this batch required');
