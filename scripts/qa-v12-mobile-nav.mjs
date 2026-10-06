// SHGHIL V3 Phase 3 — mobile nav drawer. The cramped horizontally-scrolling nav strip is
// replaced by an off-canvas drawer (hamburger toggle + scrim + Escape-to-close), while desktop
// keeps the plain inline nav row unchanged. This covers what qa-v08-history-nav.mjs's jsdom
// harness does not (real class/attribute state), using the same vm.runInContext harness style
// as qa-v11-theme-brand.mjs.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const componentsCss = fs.readFileSync(path.join(root, 'styles/components.css'), 'utf8');

// ---- 1. All five original destinations are preserved on the exact same real nav element.
// V4.1 adds one sixth destination ("كل الأدوات", opening the pre-existing six-engine grid) since
// "الرئيسية" itself now points at the new outcome-first Home — see the V4.1 report.
const navDestinations = html.match(/<nav id="mainNav" class="nav">([\s\S]*?)<\/nav>/)[1];
for (const label of ['الرئيسية', 'كل الأدوات', 'هوية النشاط', 'هوية العلامة', 'مكتبة المنتجات', 'السجل']) {
  assert.ok(navDestinations.includes(`>${label}<`), `the ${label} destination must still be present in the nav`);
}
assert.equal([...navDestinations.matchAll(/<button/g)].length, 6, 'exactly the five original destinations plus the one new V4.1 "كل الأدوات" entry, no more, no fewer');
console.log('PASS: all five existing navigation destinations plus the new V4.1 "كل الأدوات" entry are preserved on the same real <nav id="mainNav">');

// ---- 2. Build a harness with a *correct* classList (a real Set-backed implementation, unlike
// the minimal `{toggle(_,hidden){...}}` stub older qa-*.mjs files use, which this feature does
// not depend on for correctness — only for not crashing against it, checked in section 4).
const mainScript = html.match(/<script>([\s\S]*?)<\/script>/)[1];
function realClassList(node) {
  const classes = new Set((node.className || '').split(/\s+/).filter(Boolean));
  return {
    contains: c => classes.has(c),
    add: c => classes.add(c),
    remove: c => classes.delete(c),
    toggle: (c, force) => { const on = force === undefined ? !classes.has(c) : force; classes[on ? 'add' : 'delete'](c); return on },
    get value() { return [...classes].join(' ') }
  };
}
function appWithNav() {
  const attrs = new Map();
  const nodes = new Map();
  function node(id, className = '') {
    const n = { id, className, value: '', textContent: '', hidden: false, disabled: false, focus() {}, remove() {}, set innerHTML(v) { this.html = v }, get innerHTML() { return this.html || '' }, setAttribute(k, v) { attrs.set(id + ':' + k, v) }, getAttribute(k) { return attrs.get(id + ':' + k) } };
    n.classList = realClassList(n);
    return n;
  }
  for (const m of html.matchAll(/id="([^"]+)"/g)) if (!nodes.has(m[1])) nodes.set(m[1], node(m[1]));
  nodes.get('navScrim').classList.add('hidden');
  const keydownHandlers = [];
  const context = vm.createContext({
    document: {
      documentElement: { dataset: {} }, getElementById: id => nodes.get(id), createElement: () => node('toast'), body: { appendChild() {} },
      addEventListener: (type, fn) => { if (type === 'keydown') keydownHandlers.push(fn) }
    },
    localStorage: { getItem: () => null, setItem() {} }, navigator: { clipboard: { writeText: async () => {} } },
    setTimeout() {}, scrollTo() {}, crypto: { randomUUID: () => 'u' }, confirm: () => true,
    fetch: async () => ({ ok: true, status: 200, text: async () => '{"text":"x"}' })
  });
  vm.runInContext(mainScript, context);
  return { context, nodes, fireEscape: () => keydownHandlers.forEach(fn => fn({ key: 'Escape' })), run: code => vm.runInContext(code, context) };
}

assert.ok(html.includes('id="navToggle" class="btn navToggle" type="button" onclick="toggleNav()" aria-expanded="false"'), 'the hamburger button must start with aria-expanded="false" in the static markup, before any script runs');

let app = appWithNav();
assert.equal(app.nodes.get('mainNav').classList.contains('open'), false, 'the drawer must start closed');
assert.equal(app.nodes.get('navScrim').classList.contains('hidden'), true, 'the scrim must start hidden');

app.run('toggleNav()');
assert.equal(app.nodes.get('mainNav').classList.contains('open'), true, 'toggleNav() must open the drawer');
assert.equal(app.nodes.get('navScrim').classList.contains('hidden'), false, 'opening the drawer must reveal the scrim');
assert.equal(app.nodes.get('navToggle').getAttribute('aria-expanded'), 'true', 'the toggle must report aria-expanded=true while open');
console.log('PASS: toggleNav() opens the drawer, reveals the scrim, and sets aria-expanded=true on the hamburger button');

app.run('closeNav()');
assert.equal(app.nodes.get('mainNav').classList.contains('open'), false, 'closeNav() must close the drawer');
assert.equal(app.nodes.get('navScrim').classList.contains('hidden'), true, 'closing the drawer must hide the scrim again');
assert.equal(app.nodes.get('navToggle').getAttribute('aria-expanded'), 'false', 'the toggle must report aria-expanded=false again after closing');
console.log('PASS: closeNav() (as fired by the scrim tap or a destination click) closes the drawer and hides the scrim');

// ---- 3. Escape closes the drawer (registered via document.addEventListener, same delegated
// pattern already used elsewhere in this file for 'change'/'input').
app = appWithNav();
app.run('toggleNav()');
assert.equal(app.nodes.get('mainNav').classList.contains('open'), true);
app.fireEscape();
assert.equal(app.nodes.get('mainNav').classList.contains('open'), false, 'pressing Escape must close the open drawer');
console.log('PASS: pressing Escape closes the open nav drawer');

// ---- 4. Every one of the five destination buttons' onclick calls closeNav() after its real
// navigation function, and closeNav() is a safe no-op when nothing is open (desktop, or a
// second call) — verified against the ORIGINAL minimal mock every other qa-*.mjs script uses,
// so this feature can never reintroduce the crash class Phase 2 hit with the theme code.
for (const fn of ['home()', 'brainScreen()', 'brandBrainScreen()', 'productLibraryScreen()', 'historyScreen()']) {
  assert.ok(navDestinations.includes(`onclick="${fn};closeNav()"`), `${fn}'s button must also call closeNav() so choosing a destination dismisses the mobile drawer`);
}
{
  const nodes = new Map();
  function node(id) { return { id, value: '', textContent: '', hidden: false, disabled: false, classList: { toggle() {}, add() {}, remove() {} }, focus() {}, remove() {}, set innerHTML(v) { this.html = v }, get innerHTML() { return this.html || '' } } }
  for (const m of html.matchAll(/id="([^"]+)"/g)) if (!nodes.has(m[1])) nodes.set(m[1], node(m[1]));
  const context = vm.createContext({ document: { getElementById: id => nodes.get(id), createElement: () => node('toast'), body: { appendChild() {} }, addEventListener() {} }, localStorage: { getItem: () => null, setItem() {} }, navigator: { clipboard: { writeText: async () => {} } }, setTimeout() {}, scrollTo() {}, crypto: { randomUUID: () => 'u' }, confirm: () => true, fetch: async () => ({ ok: true, status: 200, text: async () => '{"text":"x"}' }) });
  assert.doesNotThrow(() => vm.runInContext(mainScript, context), 'the app script must not crash against the original minimal DOM mock (no documentElement, no classList.contains, no setAttribute on nodes)');
  assert.doesNotThrow(() => vm.runInContext("toggleNav();closeNav();closeNav()", context), 'toggleNav()/closeNav() must degrade safely (no throw) against a DOM mock lacking setAttribute/classList.contains');
  console.log('PASS: the nav drawer code never crashes against a minimal DOM mock lacking setAttribute, classList.contains or document.documentElement');
}

// ---- 5. Desktop is unaffected: the drawer/scrim/hamburger styles only apply under the
// existing max-width:700px breakpoint already used for every other mobile-only rule in this
// file; above it, .nav keeps its original plain inline-row declaration untouched.
assert.ok(componentsCss.includes('.nav{display:flex;gap:var(--space-xs);flex-wrap:wrap;justify-content:flex-end}'), 'the base (desktop) .nav rule must remain the original plain inline row');
assert.ok(componentsCss.includes('.navToggle{display:none}'), 'the hamburger button must be hidden by default (desktop)');
const mobileBlock = componentsCss.slice(componentsCss.indexOf('.navToggle{display:inline-flex}') - 400);
assert.ok(mobileBlock.startsWith('@media(max-width:700px)') || componentsCss.slice(0, componentsCss.indexOf('.navToggle{display:inline-flex}')).lastIndexOf('@media(max-width:700px)') > componentsCss.slice(0, componentsCss.indexOf('.navToggle{display:inline-flex}')).lastIndexOf('}\n\n'), 'the drawer/hamburger-visible rules must live inside the existing max-width:700px breakpoint, not affect desktop');
console.log('PASS: the drawer, scrim and visible hamburger are scoped to the existing max-width:700px breakpoint — desktop navigation is untouched');

console.log('\nPASS V3 PHASE 3: mobile nav drawer preserves all five destinations, opens/closes correctly (toggle, destination click, scrim, Escape), never crashes against the pre-existing minimal DOM mock, and leaves desktop navigation untouched');
