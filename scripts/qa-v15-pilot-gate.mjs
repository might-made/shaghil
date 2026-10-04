// SHGHIL — hotfix for the pilot login gate. Confirmed defect: submitPilotKey() used to store
// whatever was typed and hide the gate with zero server verification — any non-empty string
// "worked". This covers the fix: a dedicated /api/pilot-auth endpoint (reusing the existing
// checkPilotAuth(), AI-endpoint authentication itself is untouched) that the frontend must await
// a real 200 from before ever storing the key or hiding the gate, for correct/incorrect/
// incomplete/missing keys — including genuine browser-level verification, not just the server
// handler in isolation.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import pilotAuthHandler from '../api/pilot-auth.mjs';
import { _resetForTests } from '../lib/rate-limit.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const mainScript = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const res = () => ({ headers: {}, setHeader(k, v) { this.headers[k] = v }, status(n) { this.code = n; return this }, json(body) { this.body = body; return this } });

// ---------------------------------------------------------------------------
// 1. /api/pilot-auth server handler, in isolation, using the real checkPilotAuth() — correct,
// incorrect, incomplete (empty string) and missing (no header at all) keys, plus the
// not-configured-at-all case, exactly mirroring what the AI endpoints already guarantee.
// ---------------------------------------------------------------------------
const originalKey = process.env.PILOT_ACCESS_KEY;
try {
  delete process.env.PILOT_ACCESS_KEY;
  _resetForTests();
  {
    const r = res();
    await pilotAuthHandler({ method: 'POST', headers: { 'x-pilot-key': 'anything' } }, r);
    assert.equal(r.code, 503, 'with no PILOT_ACCESS_KEY configured, verification must fail closed (503), never a false 200');
  }

  process.env.PILOT_ACCESS_KEY = 'the-real-code';
  _resetForTests();
  {
    const correct = res();
    await pilotAuthHandler({ method: 'POST', headers: { 'x-pilot-key': 'the-real-code' } }, correct);
    assert.equal(correct.code, 200, 'the correct key must verify successfully');
    assert.equal(correct.body.ok, true);
  }
  {
    const incorrect = res();
    await pilotAuthHandler({ method: 'POST', headers: { 'x-pilot-key': 'the-wrong-code' } }, incorrect);
    assert.equal(incorrect.code, 401, 'an incorrect key must be rejected with 401');
    assert.ok(incorrect.body.error, 'a rejection must include a human-readable error message');
  }
  {
    const incomplete = res();
    await pilotAuthHandler({ method: 'POST', headers: { 'x-pilot-key': '' } }, incomplete);
    assert.equal(incomplete.code, 401, 'an empty/incomplete key must be rejected with 401, not silently accepted');
  }
  {
    const missing = res();
    await pilotAuthHandler({ method: 'POST', headers: {} }, missing);
    assert.equal(missing.code, 401, 'a request with the header missing entirely must be rejected with 401');
  }
  {
    const nearMiss = res();
    await pilotAuthHandler({ method: 'POST', headers: { 'x-pilot-key': 'the-real-code-extra' } }, nearMiss);
    assert.equal(nearMiss.code, 401, 'a near-miss (right prefix, extra characters) key must still be rejected with 401');
  }
  console.log('PASS: /api/pilot-auth (reusing the existing checkPilotAuth()) accepts only the correct key and rejects incorrect, incomplete, missing and near-miss keys with 401, and fails closed with 503 when unconfigured');

  // ---- Rate limiting on the verification endpoint itself, so it cannot be used as a free
  // (no-OpenAI-cost) way to brute-force the access code.
  process.env.RATE_LIMIT_PILOT_AUTH_PER_MIN = '3';
  _resetForTests();
  const codes = [];
  for (let i = 0; i < 5; i++) {
    const r = res();
    await pilotAuthHandler({ method: 'POST', headers: { 'x-pilot-key': 'guess-' + i } }, r);
    codes.push(r.code);
  }
  assert.deepEqual(codes, [401, 401, 401, 429, 429], 'repeated guesses from the same client must be rate-limited independently of whether they are right or wrong');
  delete process.env.RATE_LIMIT_PILOT_AUTH_PER_MIN;
  console.log('PASS: /api/pilot-auth rate-limits repeated verification attempts, so it cannot be used to brute-force the access code for free');
} finally {
  if (originalKey === undefined) delete process.env.PILOT_ACCESS_KEY; else process.env.PILOT_ACCESS_KEY = originalKey;
  _resetForTests();
}

// ---------------------------------------------------------------------------
// 2. Browser-level verification: the REAL index.html script (submitPilotKey, showPilotGate,
// hidePilotGate, setPilotKey/getPilotKey) run in a vm context, with fetch('/api/pilot-auth')
// wired to the REAL api/pilot-auth.mjs handler (only the HTTP transport is stubbed — the actual
// frontend logic and the actual server auth logic both run for real). This is the regression
// test for the exact defect reported: the old code stored+hid on ANY non-empty input with zero
// network call; this proves the new code does neither without a genuine server 200.
// ---------------------------------------------------------------------------
function makeGateHarness(pilotKeyEnv) {
  const originalEnv = process.env.PILOT_ACCESS_KEY;
  process.env.PILOT_ACCESS_KEY = pilotKeyEnv;
  _resetForTests();
  const storage = new Map();
  const nodes = new Map();
  let fetchCallCount = 0;
  function node(id) {
    return {
      id, value: '', textContent: '', hidden: false, disabled: false,
      classList: { _set: new Set(), toggle(c, force) { const on = force === undefined ? !this._set.has(c) : force; this[on ? 'add' : 'remove'](c); return on }, add(c) { this._set.add(c) }, remove(c) { this._set.delete(c) }, contains(c) { return this._set.has(c) } },
      focus() {}, remove() {}, set innerHTML(v) { this.html = v }, get innerHTML() { return this.html || '' }
    };
  }
  for (const m of html.matchAll(/id="([^"]+)"/g)) if (!nodes.has(m[1])) nodes.set(m[1], node(m[1]));
  nodes.get('pilotGate').classList.add('hidden'); // starts hidden; tests open it explicitly like real boot would
  const context = vm.createContext({
    document: {
      documentElement: { dataset: {} }, getElementById: id => nodes.get(id), createElement: () => node('toast'), body: { appendChild() {} }, addEventListener() {}
    },
    localStorage: { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) },
    navigator: { clipboard: { writeText: async () => {} } }, setTimeout() {}, scrollTo() {}, crypto: { randomUUID: () => 'u' }, confirm: () => true,
    fetch: async (url, options) => {
      fetchCallCount++;
      if (url !== '/api/pilot-auth') return { ok: true, status: 200, json: async () => ({}), text: async () => '{}' };
      const headers = options?.headers || {};
      const fakeRes = { _status: 200, _body: {}, setHeader() {}, status(n) { this._status = n; return this }, json(b) { this._body = b; return this } };
      await pilotAuthHandler({ method: 'POST', headers: { 'x-pilot-key': headers['X-Pilot-Key'] } }, fakeRes);
      return { ok: fakeRes._status >= 200 && fakeRes._status < 300, status: fakeRes._status, json: async () => fakeRes._body, text: async () => JSON.stringify(fakeRes._body) };
    }
  });
  vm.runInContext(mainScript, context);
  return { context, nodes, run: code => vm.runInContext(code, context), getFetchCallCount: () => fetchCallCount, restoreEnv: () => { if (originalEnv === undefined) delete process.env.PILOT_ACCESS_KEY; else process.env.PILOT_ACCESS_KEY = originalEnv; _resetForTests() } };
}

// Correct key: stored, gate hidden, exactly one verification call made.
{
  const h = makeGateHarness('browser-test-code');
  h.nodes.get('pilotGate').classList.remove('hidden');
  h.nodes.get('pilotKeyInput').value = 'browser-test-code';
  await h.run('submitPilotKey()');
  assert.equal(h.nodes.get('pilotGate').classList.contains('hidden'), true, 'the gate must hide after a correct key is verified');
  assert.equal(h.context.getPilotKey(), 'browser-test-code', 'the correct key must be stored only after server verification succeeds');
  assert.equal(h.getFetchCallCount(), 1, 'exactly one verification request must be made');
  h.restoreEnv();
  console.log('PASS (browser-level): a correct key is verified against the real server handler before being stored, and the gate hides');
}

// Incorrect key: NOT stored, gate stays open, server's Arabic error message is shown.
{
  const h = makeGateHarness('browser-test-code');
  h.nodes.get('pilotGate').classList.remove('hidden');
  h.nodes.get('pilotKeyInput').value = 'totally-wrong-code';
  await h.run('submitPilotKey()');
  assert.equal(h.nodes.get('pilotGate').classList.contains('hidden'), false, 'the gate must stay open after an incorrect key');
  assert.equal(h.context.getPilotKey(), '', 'an incorrect key must never be stored — this is the exact regression being fixed');
  assert.equal(h.nodes.get('pilotGateError').textContent, 'رمز الدخول غير صحيح أو مفقود', 'the server\'s own Arabic error message must be shown to the user');
  h.restoreEnv();
  console.log('PASS (browser-level): an incorrect key is never stored and the gate never hides — the exact reported defect no longer reproduces');
}

// Incomplete (whitespace-only) key: rejected locally, no network call at all, gate stays open.
{
  const h = makeGateHarness('browser-test-code');
  h.nodes.get('pilotGate').classList.remove('hidden');
  h.nodes.get('pilotKeyInput').value = '   ';
  await h.run('submitPilotKey()');
  assert.equal(h.nodes.get('pilotGate').classList.contains('hidden'), false, 'the gate must stay open for a whitespace-only (incomplete) submission');
  assert.equal(h.context.getPilotKey(), '', 'an incomplete key must never be stored');
  assert.equal(h.getFetchCallCount(), 0, 'an empty/incomplete submission must be rejected locally, without even calling the server');
  assert.equal(h.nodes.get('pilotGateError').textContent, 'أدخل رمز الدخول أولًا', 'a clear Arabic message must explain the empty submission');
  h.restoreEnv();
  console.log('PASS (browser-level): an incomplete (empty/whitespace) submission is rejected locally with a clear Arabic message, with no network call and nothing stored');
}

// Missing key: the pilot access gate server-side feature is not configured at all (503) — the
// frontend must still show a clear Arabic message and must not store or hide.
{
  const h = makeGateHarness(''); // simulate PILOT_ACCESS_KEY unset by giving the harness an empty value
  delete process.env.PILOT_ACCESS_KEY;
  h.nodes.get('pilotGate').classList.remove('hidden');
  h.nodes.get('pilotKeyInput').value = 'any-code-at-all';
  await h.run('submitPilotKey()');
  assert.equal(h.nodes.get('pilotGate').classList.contains('hidden'), false, 'the gate must stay open when the server reports the pilot gate is not configured');
  assert.equal(h.context.getPilotKey(), '', 'nothing may be stored when the server cannot verify anything');
  assert.equal(h.nodes.get('pilotGateError').textContent, 'ميزة الوصول للنسخة التجريبية غير مُفعّلة بعد على الخادم', 'the server\'s own "not configured" Arabic message must be shown');
  h.restoreEnv();
  console.log('PASS (browser-level): when the server-side access key is not configured at all, the gate stays open with a clear Arabic message instead of silently letting anyone in');
}

console.log('\nPASS PILOT GATE HOTFIX: the login gate now awaits real server verification (via the existing checkPilotAuth(), AI-endpoint authentication unchanged) before ever storing a key or hiding the gate — correct, incorrect, incomplete and missing keys all verified at both the server-handler level and the real browser-script level, and the exact reported defect (any non-empty input was accepted) no longer reproduces');
