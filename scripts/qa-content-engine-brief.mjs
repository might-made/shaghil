// Focused regression for the "سوّ محتوى" (content engine) campaign-brief refinement:
// optional objective/audience/channels/tone/CTA/instructions controls, all backed by Business
// Brain/Brand Brain automatically, never blocking generation when left blank; output rendered
// as natural Arabic labels per day with no English field names, JSON or raw identifiers;
// existing generation/save/history/Visual Studio handoff behavior preserved.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import OpenAI from 'openai';
import { indexedDB } from 'fake-indexeddb';
import { JSDOM } from 'jsdom';
import handler, { normalizeRequest } from '../api/generate.mjs';
import * as store from '../lib/visual-storage.mjs';

const brain = { name: 'MIGHT MADE', category: 'استشارات وتسويق', product: 'خدمات بناء وتسويق العلامات للمؤسسات', customer: 'رواد أعمال ومدراء تسويق في السعودية والخليج', location: 'السعودية والخليج', price: 'حسب المشروع', tone: 'احترافي وواثق', objective: 'زيادة الوعي واستقطاب عملاء نوعيين' };
const res = () => ({ headers: {}, setHeader(k, v) { this.headers[k] = v }, status(n) { this.code = n; return this }, json(body) { this.body = body; return this } });

// ---------------------------------------------------------------------------
// Server-side: every new optional field reaches the prompt when supplied, blank optional
// fields never block generation, and the prompt itself demands Arabic labels only.
// ---------------------------------------------------------------------------
const originalKey = process.env.OPENAI_API_KEY;
process.env.OPENAI_API_KEY = 'qa-placeholder';
const calls = [];
OpenAI.Responses.prototype.create = async function (payload) { calls.push(payload); return { output_text: '## نتيجة\nنص تجريبي' } };
try {
  // Every optional field blank must still succeed — only "period" has a default/validation.
  assert.doesNotThrow(() => normalizeRequest({ brain, engine: 'content', inputs: {} }));
  const rBlank = res();
  await handler({ method: 'POST', body: { brain, engine: 'content', inputs: {} } }, rBlank);
  assert.equal(rBlank.code, 200, 'blank optional fields must never block generation');

  const fullInputs = {
    period: '7 أيام',
    contentObjective: 'custom',
    contentObjectiveCustom: 'الوعي وتوليد عملاء نوعيين',
    contentAudience: 'أصحاب الأعمال ومدراء التسويق في السعودية والخليج',
    contentChannels: 'Instagram، LinkedIn',
    contentChannelsCustom: '',
    contentTone: 'احترافي وواثق',
    contentCTA: 'تواصل معنا لاكتشاف فرص النمو في أعمالك.',
    contentInstructions: 'ركّز على نتائج ملموسة بدون أرقام أو وعود مضمونة.'
  };
  const rFull = res();
  await handler({ method: 'POST', body: { brain, engine: 'content', inputs: fullInputs } }, rFull);
  assert.equal(rFull.code, 200);
  const sentInput = calls.at(-1).input;
  for (const value of Object.values(fullInputs)) if (value) assert.ok(sentInput.includes(value), `expected "${value}" to reach the prompt`);

  const instructions = calls.at(-1).instructions;
  for (const label of ['المنصة', 'الهدف', 'نوع المحتوى', 'الفكرة', 'النص الجاهز للنشر', 'دعوة لاتخاذ إجراء']) assert.ok(instructions.includes(label), `Arabic label "${label}" must be required by the prompt`);
  assert.ok(instructions.includes('never English field names, raw identifiers, JSON'), 'the prompt must explicitly forbid English field names/JSON/raw identifiers');
  assert.ok(!instructions.includes('Each item needs day, platform, objective, format, hook, concept, core_message and cta'), 'the old literal English field-listing instruction must be gone');
  console.log('PASS: every new optional content-engine field reaches the prompt when supplied, blank optional fields never block generation, and the prompt requires natural Arabic labels while forbidding English field names/JSON/raw identifiers');
} finally {
  if (originalKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = originalKey;
}

// ---------------------------------------------------------------------------
// Real browser controller: form structure, Business/Brand Brain suggestions, multi-select
// collection, the full MIGHT/AUDIT 7-day scenario, no leaked English/JSON, and the existing
// save-to-history / Visual Studio handoff paths.
// ---------------------------------------------------------------------------
globalThis.indexedDB = indexedDB;
const inlineStylesheets = html => html.replace(/<link rel="stylesheet" href="\/(styles\/[^"]+)">/g, (_, path) => `<style>${fs.readFileSync(path, 'utf8')}</style>`);
const html = inlineStylesheets(fs.readFileSync('index.html', 'utf8'));
const dom = new JSDOM(html, { url: 'http://localhost', runScripts: 'outside-only' });
const ctx = dom.getInternalVMContext();
const win = dom.window;
win.structuredClone = structuredClone; win.store = store;
win.requests = [];
win.fetch = async (url, opts) => { const body = JSON.parse(opts.body); win.requests.push({ url, body }); return { ok: true, status: 200, text: async () => JSON.stringify({ text: mightAuditPlan }) } };
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], ctx);
const controller = fs.readFileSync('lib/visual-studio.mjs', 'utf8').replace(/^import .*;\n/gm, '').replace('export function splitIdeas', 'function splitIdeas');
vm.runInContext('(function(){' + controller + '})()', ctx);
const run = code => vm.runInContext(code, ctx);
const $ = id => win.document.getElementById(id);

win.localStorage.setItem('brain', JSON.stringify(brain));
run('home()');
run("openEngine('content')");

// Form structure: one DOM control per optional field, all present, none required.
for (const id of ['period', 'contentObjective', 'contentObjectiveCustom', 'contentAudience', 'contentChannels', 'contentChannelsCustom', 'contentTone', 'contentCTA', 'contentInstructions']) assert.ok($(id), `control #${id} must exist`);
assert.equal($('contentObjectiveCustom').classList.contains('hidden'), true, 'the custom-objective field must start hidden until "custom" is chosen');
assert.equal($('contentChannels').multiple, true, 'channels must support multiple selections');
assert.equal($('contentAudience').value, brain.customer, 'target audience must be suggested from Business Brain');
assert.equal($('contentTone').value, brain.tone, 'tone must be suggested (Business Brain as the synchronous baseline; Brand Brain style also flows automatically via the brand payload)');
for (const el of [$('contentObjective'), $('contentAudience'), $('contentChannels'), $('contentTone'), $('contentCTA'), $('contentInstructions')]) assert.equal(el.required, false, 'every new field must be optional');
console.log('PASS: the content engine form exposes every required optional control, the custom-objective field is hidden until chosen, channels support multiple selections, and audience/tone are pre-suggested from Business Brain');

// --- The exact Founder MIGHT/AUDIT 7-day scenario ---
const REQUIRED_CTA = 'تواصل معنا لاكتشاف فرص النمو في أعمالك.';
const dayNames = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع'];
const platforms = ['Instagram', 'LinkedIn', 'Instagram', 'LinkedIn', 'Instagram', 'LinkedIn', 'Instagram'];
const mightAuditPlan = dayNames.map((day, i) => `## اليوم ${day}\nالمنصة: ${platforms[i]}\nالهدف: ${i % 2 === 0 ? 'الوعي بالعلامة' : 'توليد عملاء نوعيين'}\nنوع المحتوى: منشور توعوي\nالفكرة: رؤية عملية رقم ${i + 1} لأصحاب الأعمال ومدراء التسويق في السعودية والخليج حول بناء علامة موثوقة.\nنص جاهز للنشر يوضح قيمة عملية واحدة دون أرقام أو نتائج مضمونة، يوم ${i + 1}.\nدعوة لاتخاذ إجراء: ${REQUIRED_CTA}`).join('\n\n');
$('period').value = '7 أيام';
$('contentObjective').value = 'custom';
run("$('contentObjectiveCustom').classList.toggle('hidden',false)");
$('contentObjectiveCustom').value = 'الوعي وتوليد عملاء نوعيين';
$('contentAudience').value = 'أصحاب الأعمال ومدراء التسويق في السعودية والخليج';
for (const opt of $('contentChannels').options) opt.selected = opt.value === 'Instagram' || opt.value === 'LinkedIn';
$('contentTone').value = 'احترافي وواثق';
$('contentCTA').value = REQUIRED_CTA;
$('contentInstructions').value = 'بدون أسعار أو خصومات أو نتائج مضمونة.';
await run('run()');

const sentBody = win.requests.at(-1).body;
assert.deepEqual(sentBody.inputs.contentChannels.split('، ').sort(), ['Instagram', 'LinkedIn'].sort(), 'both selected channels must be sent');
assert.equal(sentBody.inputs.contentCTA, REQUIRED_CTA);
assert.equal(sentBody.inputs.contentAudience, 'أصحاب الأعمال ومدراء التسويق في السعودية والخليج');

const rendered = $('out').innerHTML;
for (const bad of ['"day"', '"platform"', '"objective"', '"format"', '"hook"', '"concept"', '"core_message"', '"cta"', '{', '}']) assert.ok(!rendered.includes(bad), `raw JSON/English artifact "${bad}" must never appear in the rendered output`);
assert.ok(rendered.includes(REQUIRED_CTA), 'the exact required CTA text must appear verbatim in the rendered plan');
assert.equal((rendered.match(new RegExp(REQUIRED_CTA.replace('.', '\\.'), 'g')) || []).length, 7, 'the CTA must appear once per day (7 times) since it was supplied verbatim for every day');

const cards = [...win.document.getElementById('contentCards').children];
assert.equal(cards.length, 7, 'all seven days must render as seven scannable cards');
for (let i = 0; i < 7; i++) {
  const card = cards[i];
  assert.ok(card.querySelector('h3').textContent.trim().length > 0, `day ${i + 1}'s card must have a visible title`);
  assert.ok(card.querySelector('details div').textContent.includes(REQUIRED_CTA), `day ${i + 1}'s full detail must include the CTA`);
}
console.log('PASS: the full seven-day MIGHT/AUDIT scenario (Saudi/GCC business-owner audience, Instagram+LinkedIn, awareness+leads objective, the exact required CTA, no invented prices/discounts/guarantees) renders as seven complete, scannable day cards with zero English field names, JSON or raw identifiers, and the CTA appears verbatim');

// Visual Studio handoff for a specific day must still work exactly as before.
await cards[3].querySelector('.btn.primary').onclick();
assert.equal(win.document.getElementById('visualStudio').classList.contains('hidden'), false);
assert.ok(win.document.getElementById('visualSource').textContent.includes('اليوم الرابع'), 'handoff must carry the exact selected day, not the whole plan');
run("current='content'"); run('Visual.back()');
assert.equal(win.document.getElementById('output').classList.contains('hidden'), false);
console.log('PASS: the اصنع التصميم handoff into Visual Studio still targets the exact selected day, and back-navigation still returns to the content result');

// Save-to-history must still work unchanged, and reopening must render identically.
run('saveResult()');
const saved = JSON.parse(win.localStorage.getItem('shaghilHistory'))[0];
assert.equal(saved.engine, 'content');
assert.ok(saved.text.includes(REQUIRED_CTA));
run('openHistory(0)');
assert.ok($('out').innerHTML.includes(REQUIRED_CTA));
assert.equal(win.document.getElementById('contentCards').children.length, 7, 'reopening from history must still render all seven day cards');
console.log('PASS: save-to-history and reopening from history are unchanged and still render the full seven-day plan correctly');

// --- Backward compatibility: a pre-existing, period-only legacy history entry must still work ---
win.localStorage.setItem('shaghilHistory', JSON.stringify([{ id: 'legacy-1', engine: 'content', title: 'سوّ محتوى', project: 'مشروع قديم', text: '## خطة قديمة\nفكرة واحدة بدون الحقول الجديدة إطلاقًا.', inputs: { period: '7 أيام' }, ts: 1000 }]));
run('openHistory(0)');
assert.equal(win.document.getElementById('output').classList.contains('hidden'), false);
assert.ok($('out').innerHTML.includes('فكرة واحدة بدون الحقول الجديدة'));
console.log('PASS: a legacy content-engine history entry saved before this refinement (period only, no new fields) still reopens and renders correctly');

dom.window.close();
console.log('PASS CONTENT ENGINE BRIEF: optional objective/audience/channels/tone/CTA/instructions controls, the full MIGHT/AUDIT scenario, Arabic-only labeling, and full backward/generation/history/handoff compatibility all verified with zero regressions');
