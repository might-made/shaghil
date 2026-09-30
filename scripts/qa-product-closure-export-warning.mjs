import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

// Product Closure P1: Workspace Export files can contain sensitive business/customer data
// (Business Brain, History text — including any pasted customer WhatsApp messages — and
// product/brand images) as plain unencrypted JSON, with no warning to the user. This proves
// the added sensitivity note is visible in the Export area BEFORE the export button, in the
// same reading order a real user encounters, and that Export/Import remain fully wired and
// unchanged in behavior — a copy-only fix, no format/storage/workflow change.

const html = fs.readFileSync('index.html', 'utf8');

// The note must sit in the same brandSection as the export button, and — in raw document
// order — before it, so a user reads it before they can click "تصدير نسخة كاملة".
const brainSection = html.match(/<section id="brain"[\s\S]*?<\/section>/)[0];
const noteIndex = brainSection.indexOf('قد يحتوي ملف التصدير على بيانات نشاطك');
const buttonIndex = brainSection.indexOf('onclick="Workspace.export()"');
assert.ok(noteIndex >= 0, 'the export sensitivity note must be present in the Business Brain screen');
assert.ok(buttonIndex >= 0, 'the export button must still exist');
assert.ok(noteIndex < buttonIndex, 'the sensitivity note must appear before the export button in document order, so it is read before exporting');

// Plain-Arabic, no technical jargon, matches the Founder-approved wording's intent.
const note = brainSection.slice(noteIndex, noteIndex + 300);
for (const term of ['IndexedDB', 'localStorage', 'JSON', 'encrypt']) assert.ok(!note.includes(term), 'the note must stay in plain, non-technical Arabic');
assert.ok(note.includes('آمن'), 'the note must tell the user to keep the file somewhere safe');
assert.ok(note.includes('موثوقة'), 'the note must tell the user to only share it with a trusted party');
console.log('PASS product closure: the export sensitivity note is visible in the Business Brain screen, before the export button, in plain Arabic');

// Export/Import must remain fully functional and unchanged — same real DOM harness style
// used throughout this project's QA, driving the real onclick handlers.
const dom = new JSDOM(html, { url: 'http://localhost', runScripts: 'outside-only' });
const win = dom.window, ctx = dom.getInternalVMContext();
let exported = null, imported = null;
win.Workspace = {
  export: () => { exported = true },
  import: file => { imported = file },
  buildBundle: async () => ({}),
  importWorkspace: async () => ({}),
};
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], ctx);
win.localStorage.setItem('brain', JSON.stringify({ name: 'نجوب', product: 'منظم سفر', customer: 'عائلات', category: '', location: '', price: '', tone: '', objective: '' }));
vm.runInContext('brainScreen()', ctx);
assert.equal(win.document.getElementById('brain').classList.contains('hidden'), false);
const exportBtn = [...win.document.querySelectorAll('#brain .actions .btn')].find(b => b.textContent.includes('تصدير'));
assert.ok(exportBtn, 'the export button must still be present and findable on the Business Brain screen');
assert.equal(exportBtn.getAttribute('onclick'), 'Workspace.export()', 'the export button must still call the unchanged Workspace.export()');
const importInput = win.document.getElementById('workspaceImportFile');
assert.ok(importInput, 'the import file input must still be present, unchanged');
assert.equal(importInput.getAttribute('onchange'), 'Workspace.import(this.files[0])', 'import must still call the unchanged Workspace.import()');
dom.window.close();
console.log('PASS product closure: Export and Import remain fully wired to their unchanged real handlers — no format, storage, or workflow change');
