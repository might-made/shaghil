// SHGHIL V4 Batch 5 (P0-C.1) regression suite.
// Scope: lib/context-matrix.mjs is a pure policy/contract module — this suite tests the exported
// matrix/selection contract directly, not generated model output, and does not exercise any
// engine wiring (none exists yet: this batch deliberately does not wire the contract into
// api/generate.mjs or api/visual.mjs).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CONSUMERS, CONTEXT_GROUPS, CONTEXT_MATRIX, LIMITED_FIELDS, resolveContextFields, flatContextFields, isProductConditional } from '../lib/context-matrix.mjs';

const TEXT_CONSUMERS = ['content', 'copy', 'whatsapp', 'reel', 'offer', 'campaign'];
const ALWAYS_YES_GROUPS = ['businessFacts', 'audience', 'commercialGoal', 'positioning', 'valueProposition', 'differentiators'];

// --- 1. All seven consumers exist in the matrix. ---
assert.deepEqual([...CONSUMERS].sort(), ['campaign', 'content', 'copy', 'offer', 'reel', 'visual', 'whatsapp'], '1. exactly the seven approved consumers are declared');
for (const consumer of CONSUMERS) assert.ok(Object.hasOwn(CONTEXT_MATRIX, consumer), `1. ${consumer} has a policy entry in CONTEXT_MATRIX`);
assert.equal(Object.keys(CONTEXT_MATRIX).length, 7, '1. the matrix has exactly seven consumer entries, no more and no fewer');

console.log('PASS: all seven approved consumers (content, copy, whatsapp, reel, offer, campaign, visual) exist in the matrix, with no extra or missing entries');

// --- 2. Business Facts/Audience/Commercial Goal/Positioning/Value Proposition/Differentiators
// are available according to the approved matrix (YES for every consumer, including Visual). ---
for (const consumer of CONSUMERS) {
  for (const group of ALWAYS_YES_GROUPS) {
    assert.equal(CONTEXT_MATRIX[consumer][group], 'yes', `2. ${consumer}.${group} is 'yes' per the approved matrix`);
    assert.deepEqual(resolveContextFields(consumer)[group], [...CONTEXT_GROUPS[group]], `2. ${consumer}'s resolved ${group} fields match the full group exactly`);
  }
}

console.log('PASS: Business Facts, Audience, Commercial Goal, Positioning, Value Proposition and Differentiators are available to every consumer, including Visual, exactly as the approved matrix specifies');

// --- 3. Brand Voice uses toneOfVoice only (as the active voice field within the group). ---
assert.ok(CONTEXT_GROUPS.brandVoice.includes('toneOfVoice'), '3. the brandVoice group includes toneOfVoice');
for (const consumer of CONSUMERS) {
  const voiceFields = resolveContextFields(consumer).brandVoice;
  assert.ok(!voiceFields.includes('style'), `3. ${consumer}'s resolved brandVoice fields never include 'style'`);
  assert.ok(!voiceFields.includes('tone'), `3. ${consumer}'s resolved brandVoice fields never include 'tone'`);
}

console.log('PASS: Brand Voice is built on toneOfVoice as the sole active voice field for every consumer — never style or tone');

// --- 4 & 5. No active matrix entry references brand.style or brain.tone anywhere in the contract. ---
const allGroupFields = Object.values(CONTEXT_GROUPS).flat();
assert.ok(!allGroupFields.includes('style'), '4. no field named "style" exists anywhere in CONTEXT_GROUPS');
// Exact-match check (not substring): 'toneOfVoice' legitimately contains "tone" as a substring
// of its name, but must never be confused with the distinct, retired field literally named 'tone'.
assert.ok(!allGroupFields.includes('tone'), '5. no field named exactly "tone" exists anywhere in CONTEXT_GROUPS (toneOfVoice is a distinct, approved field)');
for (const consumer of CONSUMERS) {
  const flat = flatContextFields(consumer);
  assert.ok(!flat.includes('style'), `4. ${consumer}'s fully resolved field list never includes 'style'`);
  assert.ok(!flat.includes('tone'), `5. ${consumer}'s fully resolved field list never includes 'tone'`);
}

console.log('PASS: no matrix entry, group, or resolved consumer field list references brand.style or brain.tone anywhere in the contract');

// --- 6. Product Memory policy exists and supports later selected-product behavior without
// implementing selectors. ---
assert.ok(Object.hasOwn(CONTEXT_GROUPS, 'productMemory'), '6. a productMemory context group exists');
assert.ok(CONTEXT_GROUPS.productMemory.includes('offers'), '6. productMemory already includes "offers", ready for when Product Memory and a selector both exist');
for (const consumer of CONSUMERS) assert.ok(['yes', 'when'].includes(CONTEXT_MATRIX[consumer].productMemory), `6. ${consumer}.productMemory is a real policy value ('yes' or 'when'), never 'no'`);
assert.equal(isProductConditional('content', 'productMemory'), true, '6. isProductConditional correctly reports content.productMemory as selection-conditional ("when")');
assert.equal(isProductConditional('offer', 'productMemory'), false, '6. isProductConditional correctly reports offer.productMemory as unconditional ("yes")');
// No product-selector implementation exists in this module — it is policy only.
const matrixSource = fs.readFileSync('lib/context-matrix.mjs', 'utf8');
assert.ok(!/function\s+select\w*[Pp]roduct/.test(matrixSource) && !matrixSource.includes('document.getElementById'), '6. the module contains no product-selector implementation or DOM code — policy only, as scoped');

console.log('PASS: a Product Memory policy exists (including "offers" already in its field list) and correctly distinguishes selection-conditional ("when") from unconditional ("yes") consumers, with no product-selector implementation in this batch');

// --- 7 & 8. Visual's allowlist matches the approved specification exactly, and explicitly
// excludes preferred/prohibited vocabulary and textual do/don't lists. ---
const visualResolved = resolveContextFields('visual');
const visualFlat = flatContextFields('visual');
const expectedVisualFlat = [
  ...CONTEXT_GROUPS.businessFacts, ...CONTEXT_GROUPS.audience, ...CONTEXT_GROUPS.commercialGoal,
  ...CONTEXT_GROUPS.positioning, ...CONTEXT_GROUPS.valueProposition, ...CONTEXT_GROUPS.differentiators,
  ...CONTEXT_GROUPS.productMemory, 'personality', 'toneOfVoice',
  ...CONTEXT_GROUPS.visualIdentity, ...CONTEXT_GROUPS.visualDirection
];
assert.deepEqual([...visualFlat].sort(), [...new Set(expectedVisualFlat)].sort(), '7. Visual\'s fully resolved field list matches the founder-approved exact allowlist');
assert.deepEqual(visualResolved.brandVoice, ['personality', 'toneOfVoice'], '7. Visual\'s brandVoice slice is exactly {personality, toneOfVoice}');
assert.deepEqual(LIMITED_FIELDS.visual.brandVoice, ['personality', 'toneOfVoice'], '7. LIMITED_FIELDS.visual.brandVoice is exactly {personality, toneOfVoice}');
assert.deepEqual(visualResolved.visualIdentity, [...CONTEXT_GROUPS.visualIdentity], '7. Visual receives the full Visual Identity group');
assert.deepEqual(visualResolved.visualDirection, [...CONTEXT_GROUPS.visualDirection], '7. Visual receives the full Visual Direction group (visualDirectionNotes, visualDo, visualDont)');
assert.ok(visualResolved.productMemory.includes('offers'), '7. Visual\'s selected Product Memory includes offers, as the founder\'s exact allowlist specifies');

for (const excluded of ['preferredVocabulary', 'prohibitedVocabulary', 'doList', 'dontList']) {
  assert.ok(!visualFlat.includes(excluded), `8. Visual's resolved fields explicitly exclude ${excluded}`);
}

console.log('PASS: Visual\'s resolved context exactly matches the founder-approved allowlist (Business Facts, Audience, Commercial Goal, Positioning, Value Proposition, Differentiators, selected Product Memory incl. offers, personality, compact toneOfVoice, Visual Identity, visualDirectionNotes/visualDo/visualDont) and explicitly excludes preferredVocabulary, prohibitedVocabulary, and textual doList/dontList');

// --- 9. No consumer receives an unintended "all fields" wildcard. ---
const everyField = [...new Set(Object.values(CONTEXT_GROUPS).flat())];
for (const consumer of TEXT_CONSUMERS) {
  assert.deepEqual(resolveContextFields(consumer).visualIdentity, [], `9. ${consumer} never receives Visual Identity fields`);
  assert.deepEqual(resolveContextFields(consumer).visualDirection, [], `9. ${consumer} never receives Visual Direction fields`);
  assert.notDeepEqual([...flatContextFields(consumer)].sort(), [...everyField].sort(), `9. ${consumer}'s resolved fields are a strict subset of every possible field, never the full universe`);
}
assert.notDeepEqual([...visualFlat].sort(), [...everyField].sort(), '9. even Visual, the richest consumer, does not receive every possible field (vocabulary/do-dont lists are excluded)');

console.log('PASS: no consumer\'s resolved context is an unintended "all fields" wildcard — every consumer, including Visual, receives a strict, deliberately selective subset');

// --- 10. At the time this batch shipped, the contract was wired into neither API endpoint.
// Batch 6 authorized wiring it into api/generate.mjs (see
// scripts/qa-v21-batch6-text-context-wiring.mjs), and Batch 9 has since authorized wiring it
// into api/visual.mjs too (see scripts/qa-v24-batch9-visual-context-wiring.mjs for that wiring's
// own verification) — nothing in this historical file still depends on either being unwired;
// the matrix's own correctness is fully covered by tests 1-9 above, independent of who consumes it. ---
const visualApiSource = fs.readFileSync('api/visual.mjs', 'utf8');
assert.ok(visualApiSource.includes('context-assembly'), "10. api/visual.mjs now references context-assembly.mjs, exactly as Batch 9 authorized — see qa-v24-batch9-visual-context-wiring.mjs for that wiring's own verification");

console.log('PASS: api/visual.mjs now references context-assembly.mjs (Batch 9\'s authorized wiring, verified separately in qa-v24-batch9-visual-context-wiring.mjs) — both API endpoints are wired to this contract as of Batch 9');

console.log('\nPASS V4 BATCH 5 (P0-C.1): the shared context-selection contract (lib/context-matrix.mjs) declares exactly the seven approved consumers, makes Business Facts/Audience/Commercial Goal/Positioning/Value Proposition/Differentiators available everywhere, builds Brand Voice on toneOfVoice alone with no reference anywhere to brand.style or brain.tone, defines a Product Memory policy ready for a future selector without implementing one, gives Visual its exact founder-approved allowlist while excluding vocabulary/textual do-dont fields, and hands no consumer an unintended "all fields" wildcard (api/generate.mjs was wired to this contract in Batch 6; api/visual.mjs was wired to it in Batch 9)');
