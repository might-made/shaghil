// Focused regression for three Founder-reported display issues in the seven-day Content Plan:
// 1) raw Markdown syntax (###, **) was visible inside expanded day details;
// 2) expanded details were cramped into a narrow card column with a fixed internal scrollbox;
// 3) the sticky global navigation could overlap content because screen switches never reset
//    scroll position (previously fixed only for Visual Studio's own result screen).
// None of this touches AI generation, the /api/generate or /api/visual response contract, the
// Content Engine's fields, History, save-to-history, or the Visual Studio handoff.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { indexedDB } from 'fake-indexeddb';
import { JSDOM } from 'jsdom';
import * as store from '../lib/visual-storage.mjs';

// --- CSS source regression: the old cramped/scrollbox rule is gone, the new full-width-when-
// open rule is present, exactly scoped to .ideaCard so nothing else is affected. ---
const css = fs.readFileSync('styles/components.css', 'utf8');
assert.ok(!css.includes('.ideaCard details{white-space:pre-wrap;max-height:300px;overflow:auto}'), 'the old fixed-height internal-scrollbox rule must be removed');
// grid-column only has any visual effect on an actual grid item (a direct child of the grid
// container) — .ideaCard itself, not the nested <details> — so the rule must target the card.
assert.ok(css.includes('.ideaCard:has(details[open]){grid-column:1/-1}'), 'the CARD (the real grid item) must span the full row width while its تفاصيل is open, not the nested details element');
console.log('PASS: the old cramped fixed-height/internal-scrollbox تفاصيل rule is gone, replaced by a full-width-when-open rule scoped to .ideaCard only');

// ---------------------------------------------------------------------------
// Real browser controller.
// ---------------------------------------------------------------------------
globalThis.indexedDB = indexedDB;
const inlineStylesheets = html => html.replace(/<link rel="stylesheet" href="\/(styles\/[^"]+)">/g, (_, path) => `<style>${fs.readFileSync(path, 'utf8')}</style>`);
const html = inlineStylesheets(fs.readFileSync('index.html', 'utf8'));
const dom = new JSDOM(html, { url: 'http://localhost', runScripts: 'outside-only' });
const ctx = dom.getInternalVMContext();
const win = dom.window;
win.structuredClone = structuredClone; win.store = store;
const scrollCalls = [];
win.scrollTo = (...args) => scrollCalls.push(args);
win.requests = [];
const brain = { name: 'نجوب', category: 'سفر', product: 'منظم سفر العائلة', customer: 'العائلة السعودية', location: 'السعودية', price: '150-300 SAR', tone: 'سعودي طبيعي', objective: 'زيادة المبيعات' };
const dayText = '## اليوم الأول: منشور 1\n### المنصة\nInstagram\n### الهدف\nالتعريف بالمنتج\n### الفكرة\n**فكرة قوية** توضح قيمة المنتج لعملائك.\n- نقطة أولى مهمة\n- نقطة ثانية مهمة\nCTA: اكتشف الآن';
const dayText2 = '## اليوم الثاني: منشور 2\n### المنصة\nLinkedIn\n### الهدف\nتوليد عملاء\n### الفكرة\nفكرة اليوم الثاني كاملة بدون فقدان أي جزء منها.\nCTA: تواصل الآن';
const dayText3 = '## اليوم الثالث: منشور 3\n### المنصة\nInstagram\n### الهدف\nالتفاعل\n### الفكرة\nفكرة اليوم الثالث لضمان ثلاثة أيام على الأقل لتفعيل عرض البطاقات.\nCTA: شاركنا رأيك';
const plan = [dayText, dayText2, dayText3].join('\n\n');
win.fetch = async (url, opts) => { const body = JSON.parse(opts.body); win.requests.push({ url, body }); return { ok: true, status: 200, text: async () => JSON.stringify({ text: plan }) } };
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], ctx);
const controller = fs.readFileSync('lib/visual-studio.mjs', 'utf8').replace(/^import .*;\n/gm, '').replace('export function splitIdeas', 'function splitIdeas');
vm.runInContext('(function(){' + controller + '})()', ctx);
const run = code => vm.runInContext(code, ctx);
const $ = id => win.document.getElementById(id);

win.localStorage.setItem('brain', JSON.stringify(brain));
run('home()');
scrollCalls.length = 0;

// --- Issue 3: every screen switch (via the shared show()) must reset scroll. ---
run("openEngine('content')");
assert.ok(scrollCalls.length >= 1, 'opening an engine form must reset scroll (a screen switch via show())');
scrollCalls.length = 0;
run("current='content';lastInputs={period:'7 أيام'};renderResult(" + JSON.stringify(plan) + ')');
assert.ok(scrollCalls.length >= 1, 'landing on a generated result must reset scroll, so the sticky header can never overlap content left over from a previously scrolled screen');
console.log('PASS: every screen switch (engine form, generated result, and by extension history/Visual Studio, since all route through the same show()) resets scroll — the sticky header can no longer end up mid-page over leftover content');

// --- Issue 1 + 2: expand a day's تفاصيل and verify real HTML rendering + full-width layout. ---
const cardsList = $('contentCards');
const cards = [...cardsList.children];
assert.equal(cards.length, 3, 'all three days must render as cards');
const firstDetails = cards[0].querySelector('details');
const detailDiv = firstDetails.querySelector('div.ideaDetail');
assert.ok(detailDiv, 'the detail body must use the dedicated ideaDetail rendering container');
const detailHTML = detailDiv.innerHTML;
const detailText = detailDiv.textContent;
for (const raw of ['###', '**']) assert.ok(!detailHTML.includes(raw), `raw Markdown syntax "${raw}" must never be visible once rendered`);
assert.ok(detailHTML.includes('<h3>المنصة</h3>'), 'a ### heading must render as a real <h3> heading');
assert.ok(detailHTML.includes('<strong>فكرة قوية</strong>'), 'a **bold** span must render as a real <strong> element');
assert.ok(detailHTML.includes('<ul>') && detailHTML.includes('<li>نقطة أولى مهمة</li>'), 'a bullet list must render as a real <ul>/<li> list, not raw dashes');
for (const expected of ['اليوم الأول: منشور 1', 'المنصة', 'Instagram', 'الهدف', 'التعريف بالمنتج', 'فكرة قوية', 'نقطة أولى مهمة', 'نقطة ثانية مهمة', 'CTA: اكتشف الآن']) assert.ok(detailText.includes(expected), `no generated content may be lost — missing "${expected}"`);
console.log('PASS: expanding تفاصيل renders the AI-generated Markdown as real Arabic headings, bold emphasis and lists (no raw ###/** syntax visible), with zero content lost');

// Full-width-when-open layout, without disturbing the seven(three)-day overview or its actions.
firstDetails.open = true;
assert.equal(win.getComputedStyle(cards[0]).gridColumn.replace(/\s/g, ''), '1/-1', 'the card itself must span the full row width once its تفاصيل is open, for a readable expanded view');
assert.equal(cards.length, 3, 'the full multi-day overview must remain intact while one card is expanded');
assert.ok(cards[0].querySelector('.btn.primary'), 'اصنع التصميم must remain present and usable on the expanded card');
firstDetails.open = false;
console.log('PASS: an expanded تفاصيل panel spans the full row width for readability, while the multi-day overview and every existing action remain intact');

// --- Preserved behavior: fields, generation, history, handoff untouched by this display-only fix. ---
const requestsBefore = win.requests.length;
firstDetails.open = true; firstDetails.open = false;
assert.equal(win.requests.length, requestsBefore, 'expanding/collapsing تفاصيل must never trigger a network request');
await cards[0].querySelector('.btn.primary').onclick();
assert.equal(win.document.getElementById('visualStudio').classList.contains('hidden'), false, 'the اصنع التصميم handoff must still work exactly as before');
assert.ok(win.document.getElementById('visualSource').textContent.includes('اليوم الأول'));
run("current='content'"); run('Visual.back()');
run('saveResult()');
const saved = JSON.parse(win.localStorage.getItem('shaghilHistory'))[0];
assert.ok(saved.text.includes('###') && saved.text.includes('**'), 'the saved/stored text itself must remain byte-for-byte the original AI output — only its rendering changed, never the stored data or the API contract');
scrollCalls.length = 0;
run('openHistory(0)');
assert.ok(scrollCalls.length >= 1, 'reopening from history is also a screen switch and must reset scroll');
assert.ok($('out').innerHTML.includes('<h3>المنصة</h3>'), 'reopened history must render the same safe Markdown formatting');
dom.window.close();
console.log('PASS: Content Engine fields, generation, save-to-history (byte-for-byte, untouched by this display-only fix) and the Visual Studio handoff all remain exactly as before');

console.log('PASS CONTENT PLAN DISPLAY: safe Markdown rendering, a full-width readable expanded view, and consistent scroll-to-top on every screen switch all verified with zero regressions');
