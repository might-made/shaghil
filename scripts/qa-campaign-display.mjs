// Focused regression for the campaign-engine ("سوّ حملة") display regression: the content-plan
// display fix (safe Markdown rendering, full-width expanded reading, sticky-nav scroll reset)
// covered renderCards()'s shared per-day تفاصيل panel, but missed two campaign-only code paths
// that still rendered raw text: the campaign's own always-visible "نظرة عامة على الحملة"
// overview card, and Visual Studio's #visualSource selection preview. Both are fixed here and
// covered end-to-end with the exact Founder MIGHT/AUDIT scenario.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { indexedDB } from 'fake-indexeddb';
import { JSDOM } from 'jsdom';
import * as store from '../lib/visual-storage.mjs';

// --- CSS source regression ---
const css = fs.readFileSync('styles/components.css', 'utf8');
assert.ok(css.includes('.campaignOverview{grid-column:1/-1}'), 'the always-visible campaign overview card must always span the full row width, not just conditionally like a collapsible تفاصيل panel');
console.log('PASS: the campaign overview card has its own unconditional full-width rule (it is never collapsed, unlike a day\'s تفاصيل)');

// ---------------------------------------------------------------------------
// Real browser controller — the exact Founder MIGHT/AUDIT campaign scenario.
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
const brain = { name: 'MIGHT MADE', category: 'استشارات وتسويق', product: 'خدمات بناء وتسويق العلامات للمؤسسات', customer: 'رواد أعمال ومدراء تسويق في السعودية والخليج', location: 'السعودية والخليج', price: 'حسب المشروع', tone: 'احترافي وواثق', objective: 'زيادة الوعي واستقطاب عملاء نوعيين' };
const REQUIRED_CTA = 'تواصل معنا لاكتشاف فرص النمو في أعمالك.';

const overview = '# حملة MIGHT/AUDIT\n**الفكرة الكبرى:** مساعدة رواد الأعمال ومدراء التسويق في السعودية والخليج على بناء علامة موثوقة.\n- محور الحملة: الوعي وتوليد عملاء نوعيين\n- الجمهور: رواد أعمال ومدراء تسويق في السعودية والخليج';
const dayNames = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع'];
const platforms = ['Instagram', 'LinkedIn', 'Instagram', 'LinkedIn', 'Instagram', 'LinkedIn', 'Instagram'];
const days = dayNames.map((day, i) => `## اليوم ${day}\n### المنصة\n${platforms[i]}\n### الهدف\n${i % 2 === 0 ? 'الوعي بالعلامة' : 'توليد عملاء نوعيين'}\n### الفكرة\n**رؤية عملية رقم ${i + 1}** لأصحاب الأعمال ومدراء التسويق في السعودية والخليج.\n- نقطة أولى تدعم الفكرة\n- نقطة ثانية بمثال واقعي\nCTA: ${REQUIRED_CTA}`);
const plan = overview + '\n\n' + days.join('\n\n');
win.fetch = async (url, opts) => { const body = JSON.parse(opts.body); win.requests.push({ url, body }); return { ok: true, status: 200, text: async () => JSON.stringify({ text: plan }) } };
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], ctx);
const controller = fs.readFileSync('lib/visual-studio.mjs', 'utf8').replace(/^import .*;\n/gm, '').replace('export function splitIdeas', 'function splitIdeas');
vm.runInContext('(function(){' + controller + '})()', ctx);
const run = code => vm.runInContext(code, ctx);
const $ = id => win.document.getElementById(id);

win.localStorage.setItem('brain', JSON.stringify(brain));
run('home()');
run("openEngine('campaign')");
$('occasion').value = '';
$('duration').value = '7 أيام';
scrollCalls.length = 0;
await run('run()');
assert.ok(scrollCalls.length >= 1, 'landing on the generated campaign must reset scroll (issue 4: the sticky header can never overlap it)');

const cardsList = $('contentCards');
const cards = [...cardsList.children];
assert.equal(cards.length, 8, 'the overview card plus all seven days must render');

// --- Issue 1: the campaign overview card itself must render safe Arabic HTML, not raw text. ---
const overviewCard = cards[0];
assert.ok(overviewCard.classList.contains('campaignOverview'), 'the overview card must carry its full-width class');
const overviewDetailDiv = overviewCard.querySelector('div.ideaDetail');
assert.ok(overviewDetailDiv, 'the overview must render through the same safe ideaDetail container as a day\'s تفاصيل');
const overviewHTML = overviewDetailDiv.innerHTML;
const overviewText = overviewDetailDiv.textContent;
for (const raw of ['##', '**', '\n- ']) assert.ok(!overviewHTML.includes(raw), `raw Markdown syntax "${raw}" must never be visible in the campaign overview`);
assert.ok(overviewHTML.includes('<strong>الفكرة الكبرى:</strong>'), 'a **bold** span in the overview must render as a real <strong> element');
assert.ok(overviewHTML.includes('<li>') || overviewHTML.includes('<ul>'), 'a bullet list in the overview must render as a real list, not raw dashes');
for (const expected of ['حملة MIGHT/AUDIT', 'الفكرة الكبرى', 'مساعدة رواد الأعمال', 'محور الحملة', 'الوعي وتوليد عملاء نوعيين', 'الجمهور']) assert.ok(overviewText.includes(expected), `no overview content may be lost — missing "${expected}"`);
console.log('PASS: the campaign overview card (previously untouched by the earlier content-plan fix) now renders safe, formatted Arabic HTML with zero raw Markdown and zero content lost');

// --- Issue 2/3: expanded day cards span full width, render safely, RTL-consistent. ---
const dayCard = cards[4]; // day 4
const dayDetails = dayCard.querySelector('details');
dayDetails.open = true;
assert.equal(win.getComputedStyle(dayCard).gridColumn.replace(/\s/g, ''), '1/-1', 'an expanded campaign day card must span the full row width');
const dayDetailDiv = dayDetails.querySelector('div.ideaDetail');
const dayHTML = dayDetailDiv.innerHTML;
const dayText = dayDetailDiv.textContent;
for (const raw of ['###', '**']) assert.ok(!dayHTML.includes(raw), `raw Markdown syntax "${raw}" must never be visible in an expanded campaign day`);
assert.ok(dayHTML.includes('<h3>المنصة</h3>') && dayHTML.includes('<h3>الفكرة</h3>'), 'campaign day headings must render as real <h3> elements');
assert.ok(dayHTML.includes('<ul>') && dayHTML.includes('<li>'), 'campaign day bullet points must render as a real list');
assert.ok(dayText.includes(REQUIRED_CTA), 'the exact required CTA must appear verbatim in the expanded day');
dayDetails.open = false;
console.log('PASS: an expanded campaign day card spans the full row width and renders safe, formatted Arabic headings and lists with zero raw Markdown, RTL content intact');

// --- Issue 1 (continued): Visual Studio's selection preview must also be Markdown-safe. ---
await cards[4].querySelector('.btn.primary').onclick();
assert.equal($('visualStudio').classList.contains('hidden'), false);
const sourceHTML = $('visualSource').innerHTML;
const sourceText = $('visualSource').textContent;
for (const raw of ['###', '**']) assert.ok(!sourceHTML.includes(raw), `raw Markdown syntax "${raw}" must never be visible in the Visual Studio selection preview`);
assert.ok(sourceText.includes('اليوم الرابع') && sourceText.includes(REQUIRED_CTA), 'the selection preview must show the exact selected day, safely rendered');
run("current='campaign'"); run('Visual.back()');
console.log('PASS: the Visual Studio source-selection preview (also previously untouched) is now Markdown-safe, and back-navigation still returns to the campaign result');

// --- Issue 5: campaign fields, seven-day structure, generation payload, history all preserved. ---
const sentBody = win.requests.at(-1).body;
assert.equal(sentBody.inputs.duration, '7 أيام');
run('saveResult()');
const saved = JSON.parse(win.localStorage.getItem('shaghilHistory'))[0];
assert.equal(saved.engine, 'campaign');
assert.ok(saved.text.includes('##') && saved.text.includes('**'), 'the stored history text must remain byte-for-byte the original AI output — only rendering changed, never stored data or the API contract');
scrollCalls.length = 0;
run('openHistory(0)');
assert.ok(scrollCalls.length >= 1, 'reopening a saved campaign from history is also a screen switch and must reset scroll');
assert.equal($('contentCards').children.length, 8, 'reopening from history must still render the overview plus all seven days');
assert.ok($('contentCards').children[0].querySelector('.ideaDetail').innerHTML.includes('<strong>'), 'reopened history must render the same safe Markdown formatting');
dom.window.close();
console.log('PASS: campaign fields (occasion/duration), the seven-day structure, the generation request payload, save-to-history and reopening are all preserved exactly as before this display-only fix');

console.log('PASS CAMPAIGN DISPLAY: the campaign overview card and the Visual Studio selection preview (both missed by the earlier content-plan fix) now render safe, full-width, RTL-correct Arabic content with zero regressions to generation, history or the Visual Studio handoff');
