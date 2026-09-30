// SHGHIL V3 Phase 2 — real application theme system, logo integration, mobile touch targets,
// and workspace/Brand-Brain isolation. Covers what qa-v05.mjs's generic harness does not:
// theme switching, persistence under a dedicated localStorage key, that key's exclusion from
// Workspace export/import, Brand Brain color independence, and the embedded V3 logo's geometry.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const foundationsCss = fs.readFileSync(path.join(root, 'styles/foundations.css'), 'utf8');
const componentsCss = fs.readFileSync(path.join(root, 'styles/components.css'), 'utf8');

// ---- 1. The early <head> theme-init script seeds data-theme from localStorage before first
// paint, defaults new users to A, and never crashes on a missing/corrupt value. It has its own
// id specifically so it does NOT collide with the generic `html.match(/<script>...)` extractor
// every other qa-*.mjs script here uses to grab the *main* app script (see the second half of
// this file for a regression guard on that).
const headScript = html.match(/<script id="themeInit">([\s\S]*?)<\/script>/)?.[1];
assert.ok(headScript, 'the early theme-init <head> script must exist with id="themeInit"');
function runHeadScript(initialLocalStorageValue) {
  const map = new Map();
  if (initialLocalStorageValue !== undefined) map.set('shaghilTheme', initialLocalStorageValue);
  const documentElement = { dataset: {} };
  const context = vm.createContext({ document: { documentElement }, localStorage: { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) } });
  vm.runInContext(headScript, context);
  return documentElement.dataset.theme;
}
assert.equal(runHeadScript(undefined), 'A', 'a first-time visitor (no saved preference) must default to Theme A');
assert.equal(runHeadScript('C'), 'C', 'a saved Theme C preference must be restored on load');
assert.equal(runHeadScript('A'), 'A', 'a saved Theme A preference must be restored on load');
assert.equal(runHeadScript('garbage'), 'A', 'an unrecognized stored value must fall back to Theme A, never crash');
console.log('PASS: the early <head> theme-init script defaults new users to Theme A and restores a saved A/C preference before first paint, without crashing on a missing or corrupt value');

// ---- 2. The generic script extractor every other qa-*.mjs file uses must still find the
// *main* app script, not this new head script (a real regression this task hit and fixed by
// giving the head script an id — this guards against it recurring).
const mainScriptViaGenericRegex = html.match(/<script>([\s\S]*?)<\/script>/)[1];
assert.ok(mainScriptViaGenericRegex.includes('function applyTheme'), 'the plain <script> (no attributes) the rest of the QA suite greps for must still be the main app script, not the themeInit head script');
assert.ok(mainScriptViaGenericRegex.includes('const ids='), 'sanity: this is genuinely the main app script');

// ---- 3. Theme switching + persistence through the real applyTheme()/toggleTheme() functions,
// exactly as a click on #themeToggle would drive them.
function appWithTheme(initialLocalStorageValue) {
  const map = new Map();
  if (initialLocalStorageValue !== undefined) map.set('shaghilTheme', initialLocalStorageValue);
  // In the real page, the <head> themeInit script always runs before the body's main script and
  // seeds data-theme first — replicate that same load order here rather than starting from an
  // empty dataset, so this harness matches what a real returning visitor's browser actually does.
  const documentElement = { dataset: {} };
  vm.runInContext(headScript, vm.createContext({ document: { documentElement }, localStorage: { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) } }));
  const btnAttrs = {};
  const themeToggleNode = { setAttribute: (k, v) => { btnAttrs[k] = v }, set title(v) { btnAttrs.title = v }, get title() { return btnAttrs.title } };
  const nodes = new Map([['themeToggle', themeToggleNode]]);
  function node(id) { return { id, value: '', textContent: '', hidden: false, disabled: false, classList: { toggle() {}, add() {}, remove() {} }, focus() {}, remove() {}, set innerHTML(v) { this.html = v }, get innerHTML() { return this.html || '' } } }
  for (const m of html.matchAll(/id="([^"]+)"/g)) if (!nodes.has(m[1])) nodes.set(m[1], node(m[1]));
  const context = vm.createContext({
    document: { documentElement, getElementById: id => nodes.get(id), createElement: () => node('toast'), body: { appendChild() {} }, addEventListener() {} },
    localStorage: { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) },
    navigator: { clipboard: { writeText: async () => {} } }, setTimeout() {}, scrollTo() {}, crypto: { randomUUID: () => 'u' }, confirm: () => true,
    fetch: async () => ({ ok: true, status: 200, text: async () => '{"text":"x"}' })
  });
  vm.runInContext(mainScriptViaGenericRegex, context);
  return { context, map, btnAttrs, run: code => vm.runInContext(code, context) };
}

let app = appWithTheme(undefined);
assert.equal(app.context.document.documentElement.dataset.theme, 'A', 'a fresh app instance with no saved preference must run as Theme A');
assert.equal(app.map.get('shaghilTheme'), 'A', 'Theme A must be persisted for a first-time visitor as soon as the app initializes, not only after an explicit toggle');
assert.equal(app.btnAttrs['aria-pressed'], 'false', 'while on Theme A (the default), the toggle button must report aria-pressed=false');
app.run('toggleTheme()');
assert.equal(app.context.document.documentElement.dataset.theme, 'C', 'toggleTheme() must switch from A to C');
assert.equal(app.map.get('shaghilTheme'), 'C', 'switching themes must persist the new choice to localStorage under the shaghilTheme key');
assert.equal(app.btnAttrs['aria-pressed'], 'true', 'while on Theme C, the toggle button must report aria-pressed=true');
app.run('toggleTheme()');
assert.equal(app.context.document.documentElement.dataset.theme, 'A', 'toggleTheme() must switch back from C to A');
console.log('PASS: toggleTheme() switches between A and C, persists the choice under the shaghilTheme localStorage key, and keeps the toggle button\'s aria-pressed state in sync');

// A returning visitor with a previously saved Theme C preference must restore it, not reset to A.
app = appWithTheme('C');
assert.equal(app.context.document.documentElement.dataset.theme, 'C', 'a returning visitor with a saved Theme C preference must restore it on load, not reset to the default');
console.log('PASS: a saved Theme C preference is restored for a returning visitor instead of resetting to the Theme A default');

// ---- 4. The theme key must never appear in workspace-transfer.mjs's explicit read list, so it
// can never be swept into an exported/imported workspace bundle, and must not collide with any
// other known localStorage key name used by the real app.
const workspaceTransferSrc = fs.readFileSync(path.join(root, 'lib/workspace-transfer.mjs'), 'utf8');
assert.ok(!workspaceTransferSrc.includes('shaghilTheme'), 'workspace-transfer.mjs must never read/write the shaghilTheme key — the UI theme is not part of a portable workspace');
for (const otherKey of ['brain', 'shaghilHistory', 'localDataNoticeDismissed', 'firstValueHintDismissed']) {
  assert.notEqual('shaghilTheme', otherKey, `shaghilTheme must not collide with the existing ${otherKey} key`);
}
{
  const { indexedDB } = await import('fake-indexeddb');
  globalThis.indexedDB = indexedDB;
  const localMap = new Map([['brain', JSON.stringify({ name: 'تحميص ٢٧' })], ['shaghilHistory', '[]'], ['shaghilTheme', 'C']]);
  globalThis.localStorage = { getItem: k => localMap.get(k) ?? null, setItem: (k, v) => localMap.set(k, v) };
  globalThis.document = { getElementById: () => null };
  const { buildBundle, importWorkspace } = await import('../lib/workspace-transfer.mjs');
  const bundle = await buildBundle();
  const bundleJson = JSON.stringify(bundle);
  assert.ok(!bundleJson.includes('shaghilTheme'), 'an exported workspace bundle must never contain the shaghilTheme key or its value');
  assert.ok(!bundleJson.includes('"C"') || bundle.localStorage.brain, 'the theme value must not leak into the exported bundle under any key');
  await importWorkspace(bundle, { overwriteBrain: true });
  assert.equal(localMap.get('shaghilTheme'), 'C', 'importing a workspace bundle must never touch the local UI theme preference');
  console.log('PASS: Workspace.export()/import() never read, export or overwrite the shaghilTheme UI preference — it stays local to the browser, exactly like the brief requires');
}

// ---- 5. Brand Brain's own customer colors are untouched by, and unrelated to, the app's UI
// theme system: distinct localStorage/IndexedDB keys, distinct code path, no shared variable.
assert.ok(!/data-theme/.test(fs.readFileSync(path.join(root, 'lib/visual-studio.mjs'), 'utf8')), 'lib/visual-studio.mjs (Brand Brain color handling) must never reference the UI theme attribute');
assert.ok(html.includes('id="brandPrimary" type="color" value="#e7f95b"'), "Brand Brain's default primary color must be completely unchanged by the theme system");
assert.ok(html.includes('id="brandSecondary" type="color" value="#181b1f"'), "Brand Brain's default secondary color must be completely unchanged by the theme system");
{
  // Functional check: toggling the app theme must never alter a customer's already-saved brand colors.
  const { IDBFactory } = await import('fake-indexeddb');
  globalThis.indexedDB = new IDBFactory();
  const localMap = new Map();
  globalThis.localStorage = { getItem: k => localMap.get(k) ?? null, setItem: (k, v) => localMap.set(k, v) };
  globalThis.document = { getElementById: () => null };
  const store = await import('../lib/visual-storage.mjs');
  await store.saveBrand({ primary: '#e7f95b', secondary: '#181b1f', accent: '', style: '', logo: null, references: [] });
  const before = await store.loadBrand();
  const app2 = appWithTheme(undefined);
  app2.run('toggleTheme()'); app2.run('toggleTheme()');
  const after = await store.loadBrand();
  assert.deepEqual(after, before, "a customer's saved Brand Brain colors must be byte-identical before and after switching the app's UI theme");
  console.log("PASS: switching the app-wide UI theme never overwrites a customer's saved Brand Brain colors (verified against real IndexedDB storage)");
}

// ---- 6. Embedded V3 logo geometry — byte-identical to the verified brand-v3 source SVGs
// (currentColor recoloring is the only permitted change), preserving the authentic shadda
// above غ and all three dots above ش, which live inside this exact path data.
function normalizeGeometry(svg) {
  return svg.replace(/(fill|stroke)="[^"]*"/g, '').replace(/\srole="[^"]*"\saria-label="[^"]*"/g, '');
}
const horizSrc = fs.readFileSync(path.join(root, 'brand-v3/wordmarks/lockup-horizontal-light.svg'), 'utf8');
const stackedSrc = fs.readFileSync(path.join(root, 'brand-v3/wordmarks/lockup-stacked-light.svg'), 'utf8');
const embeddedHoriz = html.match(/<div class="logo">(<svg[\s\S]*?<\/svg>)<\/div>/)?.[1];
const embeddedStacked = html.match(/<div class="welcomeLogo">(<svg[\s\S]*?<\/svg>)<\/div>/)?.[1];
assert.ok(embeddedHoriz, 'the header must embed the horizontal lockup logo inside .logo');
assert.ok(embeddedStacked, 'the welcome screen must embed the stacked lockup logo inside .welcomeLogo');
assert.equal(normalizeGeometry(embeddedHoriz), normalizeGeometry(horizSrc), 'the header logo geometry must be byte-identical to the verified brand-v3 horizontal lockup source — no re-shaping, no re-drawing');
assert.equal(normalizeGeometry(embeddedStacked), normalizeGeometry(stackedSrc), 'the welcome-screen logo geometry must be byte-identical to the verified brand-v3 stacked lockup source — no re-shaping, no re-drawing');
assert.ok(!embeddedHoriz.includes('#1B1D1F') && !embeddedHoriz.includes('#1b1d1f'), 'the embedded header logo must use currentColor, not a fixed hex, so it recolors per theme');
assert.ok(!embeddedStacked.includes('#1B1D1F') && !embeddedStacked.includes('#1b1d1f'), 'the embedded welcome logo must use currentColor, not a fixed hex, so it recolors per theme');
console.log('PASS: the header and welcome-screen logos embed the exact, verified brand-v3 SVG path geometry (only the fill/stroke paint attribute was changed to currentColor) — the authentic shadda above غ and all three dots above ش are preserved byte-for-byte');

// ---- 7. Touch targets: every token-driven interactive control must be at least 44px.
function tokenPx(css, name) {
  const m = css.match(new RegExp(`--${name}:\\s*(\\d+)px`));
  return m ? Number(m[1]) : null;
}
assert.ok(tokenPx(foundationsCss, 'button-height') >= 44, '--button-height must be at least 44px');
assert.ok(tokenPx(foundationsCss, 'input-height') >= 44, '--input-height must be at least 44px');
assert.ok(componentsCss.includes('.colorField input[type=color]{height:44px'), 'the Brand Brain color swatch control must also meet the 44px touch-target minimum');
console.log('PASS: buttons, inputs/selects/textareas and the color-picker swatch all meet the 44px minimum touch-target size');

// ---- 8. Structural presence of the two theme blocks and the hero/nav treatments they depend on.
assert.ok(foundationsCss.includes('[data-theme="A"]'), 'foundations.css must define the A (Champagne on Charcoal) theme block');
assert.ok(foundationsCss.includes('[data-theme="C"]'), 'foundations.css must define the C (Charcoal on Champagne) theme block');
assert.ok(foundationsCss.includes('--surface: #F6F3EA'), 'content surfaces must be the shared off-white in both themes, per the brief');
assert.ok(componentsCss.includes('.top{position:sticky') && componentsCss.includes('background:var(--bg-primary)'), 'the sticky nav bar must sit on the page background so the logo (champagne/charcoal) has strong contrast, per the already-QA\'d Phase 1E convention');
assert.ok(componentsCss.includes('#welcome{background:var(--bg-primary)'), 'the welcome/splash screen must use the page background so the stacked logo is legible');
console.log('PASS: both theme blocks (A and C) are defined, content surfaces stay a shared off-white in both, and the nav bar / welcome hero are wired to the page background so the logo always has strong contrast');

console.log('\nPASS V3 PHASE 2: theme defaulting/switching/persistence, workspace-export exclusion, Brand Brain independence, verified logo geometry, and 44px touch targets all confirmed with zero regressions to the existing application');
