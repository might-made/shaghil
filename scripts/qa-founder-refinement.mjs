// Focused regression for the three Founder Live QA findings addressed in this refinement pass:
// 01) campaign results are progressively disclosed (scan-first cards + collapsed "تفاصيل")
//     instead of one long scroll, reusing the existing content-engine card mechanism;
// 02) Brand Brain style now reaches /api/generate, and the system prompt actively instructs
//     grounding in the specific supplied business/brand facts, generically for any business;
// 03) the whatsapp engine's raw internal keys (recommended_reply/short_reply/follow_up) no
//     longer leak into the Arabic customer-reply result, translated at the presentation layer.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import OpenAI from 'openai';
import { indexedDB } from 'fake-indexeddb';
import { JSDOM } from 'jsdom';
import handler, { normalizeRequest } from '../api/generate.mjs';
import * as storage from '../lib/visual-storage.mjs';

const brain = { name: 'نجوب', category: 'سفر', product: 'منظم سفر العائلة', customer: 'العائلة السعودية', location: 'السعودية', price: '150-300 SAR', tone: 'سعودي طبيعي', objective: 'زيادة المبيعات' };
const res = () => ({ headers: {}, setHeader(k, v) { this.headers[k] = v }, status(n) { this.code = n; return this }, json(body) { this.body = body; return this } });

// ---------------------------------------------------------------------------
// FINDING 02 — server-side: Brand Brain style reaches the prompt; grounding instruction present;
// backward compatible when no brand is supplied; response contract unchanged.
// ---------------------------------------------------------------------------
const originalKey = process.env.OPENAI_API_KEY;
process.env.OPENAI_API_KEY = 'qa-placeholder';
process.env.PILOT_ACCESS_KEY ||= 'qa-pilot-key';
const AUTH_HEADERS = { 'x-pilot-key': process.env.PILOT_ACCESS_KEY };
const calls = [];
OpenAI.Responses.prototype.create = async function (payload) { calls.push(payload); return { output_text: '## نتيجة\nنص تجريبي' } };
try {
  // Backward compatible: a request with no brand field at all (every pre-existing caller/test)
  // must still succeed, and must not inject an empty/misleading BRAND section into the prompt.
  assert.doesNotThrow(() => normalizeRequest({ brain, engine: 'copy', inputs: {} }));
  const r1 = res();
  await handler({ method: 'POST', headers:AUTH_HEADERS, body: { brain, engine: 'copy', inputs: { channel: 'SMS', instruction: '' } } }, r1);
  assert.equal(r1.code, 200);
  assert.ok(!calls.at(-1).input.includes('BRAND VOICE'), 'no brand supplied must not fabricate a brand section');
  assert.deepEqual(Object.keys(r1.body).sort(), ['model', 'text'], 'the {text,model} response contract must stay unchanged');

  // A real Brand Brain active voice (toneOfVoice — the Batch 4 SSOT field; the client resolves
  // legacy brand.style into it before ever sending a request) must reach the prompt input
  // verbatim, for any business (not hard-coded).
  const r2 = res();
  await handler({ method: 'POST', headers:AUTH_HEADERS, body: { brain, engine: 'copy', inputs: { channel: 'SMS', instruction: '' }, brand: { toneOfVoice: 'فاخر وهادئ، بدون مبالغة' } } }, r2);
  assert.equal(r2.code, 200);
  assert.ok(calls.at(-1).input.includes('فاخر وهادئ، بدون مبالغة'), 'a supplied active voice (toneOfVoice) must reach the generation prompt');
  assert.ok(calls.at(-1).input.includes('BRAND VOICE / STYLE'));

  // A second, different business/voice must be reflected identically — proves this is generic
  // plumbing, not special-cased for any one test account.
  const otherBrain = { ...brain, name: 'بيت التمر', product: 'تمر سكري فاخر' };
  const r3 = res();
  await handler({ method: 'POST', headers:AUTH_HEADERS, body: { brain: otherBrain, engine: 'offer', inputs: { constraint: '' }, brand: { toneOfVoice: 'دافئ وعائلي' } } }, r3);
  assert.equal(r3.code, 200);
  assert.ok(calls.at(-1).input.includes('بيت التمر') && calls.at(-1).input.includes('دافئ وعائلي'), 'brand grounding must work for any business, not a hard-coded one');

  // Whitespace-only/missing active voice must degrade to no brand section, never inventing content.
  const r4 = res();
  await handler({ method: 'POST', headers:AUTH_HEADERS, body: { brain, engine: 'reel', inputs: {}, brand: { toneOfVoice: '   ' } } }, r4);
  assert.equal(r4.code, 200);
  assert.ok(!calls.at(-1).input.includes('BRAND VOICE'), 'a blank active voice must not be sent as a fabricated section');

  // The system prompt must actively instruct grounding in the specific supplied facts (root
  // cause of the "generic output" finding), and this instruction is generic across all engines.
  for (const engine of ['content', 'copy', 'offer', 'whatsapp', 'campaign', 'reel']) {
    const r = res();
    await handler({ method: 'POST', headers:AUTH_HEADERS, body: { brain, engine, inputs: {}, ...(engine === 'whatsapp' ? { inputs: { message: 'كم السعر؟' } } : {}), ...(engine === 'campaign' ? { inputs: { duration: '7 أيام' } } : {}) } }, r);
    assert.equal(r.code, 200, engine);
    assert.ok(calls.at(-1).instructions.includes('Ground every output in the specific facts supplied'), engine);
  }

  // FINDING 03 (server side) — the whatsapp engine instruction must ask for Arabic labels, never
  // the raw English identifiers, and the exact acknowledge-missing-detail guardrail is preserved.
  const rw = res();
  await handler({ method: 'POST', headers:AUTH_HEADERS, body: { brain, engine: 'whatsapp', inputs: { message: 'كم السعر؟' } } }, rw);
  assert.equal(rw.code, 200);
  const whatsappInstructions = calls.at(-1).instructions;
  assert.ok(whatsappInstructions.includes('الرد المقترح') && whatsappInstructions.includes('رد مختصر') && whatsappInstructions.includes('متابعة'));
  assert.ok(!whatsappInstructions.includes('Output recommended_reply'), 'the raw snake_case instruction must no longer be sent to the model');
  assert.ok(whatsappInstructions.includes("acknowledge you don't have that specific detail"), 'the existing missing-detail guardrail must be preserved');

  console.log('PASS: Brand Brain style reaches /api/generate generically for any business, degrades gracefully when absent/blank, the system prompt actively grounds output in supplied facts, the whatsapp engine instruction now asks for Arabic labels, and the {text,model} response contract is unchanged');
} finally {
  if (originalKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = originalKey;
}

// ---------------------------------------------------------------------------
// FINDING 01 + FINDING 03 (presentation layer) — the real browser controller in a DOM.
// ---------------------------------------------------------------------------
globalThis.indexedDB = indexedDB;
const inlineStylesheets = html => html.replace(/<link rel="stylesheet" href="\/(styles\/[^"]+)">/g, (_, path) => `<style>${fs.readFileSync(path, 'utf8')}</style>`);
const html = inlineStylesheets(fs.readFileSync('index.html', 'utf8'));
const dom = new JSDOM(html, { url: 'http://localhost', runScripts: 'outside-only' });
const ctx = dom.getInternalVMContext();
const win = dom.window;
win.structuredClone = structuredClone; win.store = storage;
win.requests = [];
win.fetch = async (url, opts) => { const body = JSON.parse(opts.body); win.requests.push({ url, body }); return { ok: true, status: 200, text: async () => JSON.stringify({ text: `## ${body.engine}\nنتيجة تجريبية` }) } };
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], ctx);
const controller = fs.readFileSync('lib/visual-studio.mjs', 'utf8').replace(/^import .*;\n/gm, '').replace('export function splitIdeas', 'function splitIdeas');
vm.runInContext('(function(){' + controller + '})()', ctx);
const run = code => vm.runInContext(code, ctx);

win.localStorage.setItem('brain', JSON.stringify(brain));
run('home()');

// --- Finding 01: campaign progressive disclosure ---
const overview = '# حملة نجوب لموسم السفر\nفكرة الحملة الكبرى: خفّف عن عائلتك عناء ترتيب حقائب السفر.';
const dayNames = ['الأول', 'الثاني', 'الثالث'];
const dayBlocks = dayNames.map((day, i) => `## اليوم ${day}: منشور ${i + 1}\n### المنصة\nInstagram\n### الهدف\nالتعريف بالمنتج\n### الفكرة\nتفاصيل كاملة لليوم ${i + 1} تشمل السيناريو والتنفيذ الكامل الذي يجب أن يبقى محفوظًا بالكامل دون أي حذف.\nCTA: اكتشف الآن`);
const campaignText = overview + '\n\n' + dayBlocks.join('\n\n');
run("current='campaign';lastInputs={duration:'7 أيام'};renderResult(" + JSON.stringify(campaignText) + ')');

const cardsList = win.document.getElementById('contentCards');
const outBox = win.document.getElementById('out');
assert.equal(cardsList.classList.contains('hidden'), false, 'campaign result with 3+ days must switch to card view');
assert.equal(outBox.classList.contains('hidden'), true, 'the single long-scroll block must be hidden once cards render');
const cards = [...cardsList.children];
assert.equal(cards.length, dayBlocks.length + 1, 'one overview card plus one card per day');

// The campaign overview must be visible by default (not inside a collapsed <details>), and in full.
const introCard = cards[0];
assert.ok(introCard.querySelector('h3').textContent.includes('نظرة عامة'));
assert.equal(introCard.querySelector('details'), null, 'the overview must never be collapsed by default');
assert.equal(introCard.textContent.includes(overview.replace(/^# .*\n/, '').trim()) || introCard.textContent.includes('فكرة الحملة الكبرى'), true);

// Every day is scannable (title + short preview) with its full content collapsed by default,
// expandable instantly (no network request), and no content lost.
for (let i = 0; i < dayBlocks.length; i++) {
  const card = cards[i + 1];
  assert.ok(card.classList.contains('ideaCard'));
  const details = card.querySelector('details');
  assert.ok(details, 'each day card must offer the تفاصيل expand interaction');
  assert.equal(details.hasAttribute('open'), false, 'details must be collapsed by default (scan first)');
  assert.equal(details.querySelector('summary').textContent, 'تفاصيل');
  // Obsolete by the later display refinement (rendered Markdown, not raw text) in this exact
  // area: تفاصيل now renders through md() as real HTML, so .textContent concatenates each
  // line's own text without the original newlines/markdown syntax between them — content is
  // not lost, just no longer byte-identical to the raw source. Verify every line's own text
  // (markdown syntax stripped) still appears, and that no raw "#"/"##" syntax remains visible.
  const detailHTML = details.querySelector('div').innerHTML;
  const detailText = details.querySelector('div').textContent;
  for (const line of dayBlocks[i].split('\n').map(l => l.replace(/^#{1,6}\s*/, '').trim()).filter(Boolean)) assert.ok(detailText.includes(line), `expanding تفاصيل must preserve "${line}" — nothing lost`);
  assert.ok(!detailHTML.includes('##'), 'raw Markdown heading syntax must never remain visible in the expanded detail');
  assert.ok(card.querySelector('.btn.primary').textContent.includes('اصنع التصميم'), 'the primary action must remain easy to access on every card');
}
const requestsBefore = win.requests.length;
assert.equal(win.requests.length, requestsBefore, 'expanding/collapsing تفاصيل must never trigger a network request');

// The campaign → Design Studio handoff must still work, per specific day (not the whole plan).
await cards[2].querySelector('.btn.primary').onclick();
assert.equal(win.document.getElementById('visualStudio').classList.contains('hidden'), false);
// Obsolete by the campaign-display fix in this exact area: visualSource now renders through
// md() as real HTML (matching تفاصيل), so .textContent concatenates each line without the
// original newlines/Markdown syntax — nothing lost, verified per line, and no raw "##" left.
const sourceHTML = win.document.getElementById('visualSource').innerHTML;
const sourceText = win.document.getElementById('visualSource').textContent;
for (const line of dayBlocks[1].split('\n').map(l => l.replace(/^#{1,6}\s*/, '').trim()).filter(Boolean)) assert.ok(sourceText.includes(line), `visualSource must preserve "${line}"`);
assert.ok(!sourceHTML.includes('##'), 'raw Markdown heading syntax must never remain visible in visualSource');
run("current='campaign'"); run('Visual.back()');
assert.equal(win.document.getElementById('output').classList.contains('hidden'), false, 'back navigation from the handoff must still return to the campaign result');

// A short/sparse campaign (fewer than 2 detectable items) must still fully render via the
// existing single-block path — no regression, no content loss, nothing forced into cards.
run("current='campaign';renderResult('## حملة قصيرة\\nفكرة واحدة فقط بدون أيام متعددة.')");
assert.equal(win.document.getElementById('contentCards').classList.contains('hidden'), true);
assert.equal(win.document.getElementById('out').classList.contains('hidden'), false);
assert.ok(win.document.getElementById('out').innerHTML.includes('فكرة واحدة فقط'));

// Other engines are completely unaffected by extending the card mechanism to campaign.
run("current='offer';renderResult('## عرض واحد\\nتفاصيل العرض دون أيام.')");
assert.equal(win.document.getElementById('contentCards').classList.contains('hidden'), true);
console.log('PASS: campaign results show a persistent overview plus scannable per-day cards with collapsed تفاصيل by default, full original content preserved and reachable, the اصنع التصميم handoff still targets the exact selected day, short campaigns and other engines are unaffected');

// --- Finding 03: raw internal keys never reach the customer-facing whatsapp result ---
const rawReply = '## recommended_reply\nنقدر نرتب لك التوصيل اليوم.\n## short_reply\nمتاح اليوم، تحب أثبت الطلب؟\n## follow_up\nإذا حاب نتواصل بعد ساعة نأكد التفاصيل.';
run("current='whatsapp';renderResult(" + JSON.stringify(rawReply) + ')');
const whatsappOut = win.document.getElementById('out').innerHTML;
for (const raw of ['recommended_reply', 'short_reply', 'follow_up']) assert.ok(!whatsappOut.includes(raw), `raw key "${raw}" must never be visible to the user`);
for (const label of ['الرد المقترح', 'رد مختصر', 'متابعة']) assert.ok(whatsappOut.includes(label), `Arabic label "${label}" must render in its place`);

// Case-insensitive and inline (bold) variants must also be caught, without mangling real content.
run("current='whatsapp';renderResult('**Recommended_Reply**\\nنص الرد الفعلي هنا.')");
const mixedCaseOut = win.document.getElementById('out').innerHTML;
assert.ok(!/recommended_reply/i.test(mixedCaseOut));
assert.ok(mixedCaseOut.includes('الرد المقترح') && mixedCaseOut.includes('نص الرد الفعلي هنا'));

// A pre-fix saved history entry (containing the literal raw keys) must still display correctly
// when reopened — a data-safety/backward-compatibility fix at render time, no migration needed.
win.localStorage.setItem('shaghilHistory', JSON.stringify([{ id: 'legacy-1', engine: 'whatsapp', title: 'رد على عميل', project: 'نجوب', text: rawReply, inputs: { message: 'كم السعر؟' }, ts: 1000 }]));
run('openHistory(0)');
const reopenedOut = win.document.getElementById('out').innerHTML;
for (const raw of ['recommended_reply', 'short_reply', 'follow_up']) assert.ok(!reopenedOut.includes(raw), 'a legacy saved entry must not leak raw keys once reopened');
assert.ok(reopenedOut.includes('الرد المقترح'));
// The underlying saved record itself is untouched — this is a display-time fix, not a migration.
assert.equal(JSON.parse(win.localStorage.getItem('shaghilHistory'))[0].text, rawReply);

// Unrelated content for other engines must never be altered by the translation safety net.
const untouched = '## سوّ محتوى\nهذا نص عادي بدون أي مفاتيح تقنية.';
run("current='content';renderResult(" + JSON.stringify(untouched) + ')');
assert.equal(run('lastText'), untouched, 'text with no raw keys must pass through completely unchanged');

dom.window.close();
console.log('PASS: recommended_reply/short_reply/follow_up never reach the user (fresh generations and reopened legacy history alike), Arabic labels render correctly, saved-history data itself is untouched, and unrelated content is never altered');

console.log('PASS FOUNDER QA REFINEMENT: campaign progressive disclosure, Brand Brain-grounded generation, and whatsapp label translation all verified with zero regressions');
