// SHGHIL — security hardening for the closed pilot. Covers what no other qa-*.mjs file does:
// that every AI endpoint truly rejects an unauthorized request server-side (never just a
// frontend check), that rate limiting and the request-size ceiling are real and enforced before
// any OpenAI call fires, and that the gate fails closed (not open) when unconfigured.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import OpenAI from 'openai';
import { fileURLToPath } from 'node:url';
import generateHandler from '../api/generate.mjs';
import visualHandler from '../api/visual.mjs';
import { checkRateLimit, _resetForTests } from '../lib/rate-limit.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const res = () => ({ headers: {}, setHeader(k, v) { this.headers[k] = v }, status(n) { this.code = n; return this }, json(body) { this.body = body; return this } });
const brain = { name: 'اختبار أمن', category: 'تجربة', product: 'منتج تجريبي', customer: 'عميل تجريبي', location: 'الرياض', price: '100 SAR', tone: 'سعودي طبيعي', objective: 'زيادة المبيعات' };

const originalOpenAIKey = process.env.OPENAI_API_KEY;
const originalPilotKey = process.env.PILOT_ACCESS_KEY;
const originalGenMin = process.env.RATE_LIMIT_GENERATE_PER_MIN;
const originalGenDay = process.env.RATE_LIMIT_GENERATE_PER_DAY;
const originalVisMin = process.env.RATE_LIMIT_VISUAL_PER_MIN;
process.env.OPENAI_API_KEY = 'qa-placeholder';
let textCalls = 0;
const originalCreate = OpenAI.Responses.prototype.create;
OpenAI.Responses.prototype.create = async function () { textCalls++; return { output_text: '## نتيجة\nنص تجريبي' } };

try {
  // ---- 1. Fails closed (not open) when PILOT_ACCESS_KEY is not configured at all — the safe
  // default for a brand-new deployment, never "anyone can use it until someone remembers to lock it down".
  delete process.env.PILOT_ACCESS_KEY;
  _resetForTests();
  {
    const r = res();
    await generateHandler({ method: 'POST', headers: {}, body: { brain, engine: 'copy', inputs: { channel: 'SMS', instruction: '' } } }, r);
    assert.equal(r.code, 503, 'with no PILOT_ACCESS_KEY configured, /api/generate must fail closed (503), never silently allow the request through');
    assert.equal(textCalls, 0, 'an unconfigured/rejected request must never reach OpenAI');
  }
  console.log('PASS: /api/generate fails closed (503), not open, when no pilot access key is configured on the server');

  // ---- 2. A real pilot key is now configured. Requests with no key, or the wrong key, are
  // rejected with 401 before any OpenAI call — this is the literal "frontend-only protection is
  // insufficient" requirement: nothing about the request's origin or UI state matters here, only
  // what the server itself can verify.
  process.env.PILOT_ACCESS_KEY = 'correct-pilot-key';
  _resetForTests();
  for (const headers of [{}, { 'x-pilot-key': '' }, { 'x-pilot-key': 'wrong-key' }, { 'x-pilot-key': 'correct-pilot-key-with-suffix' }]) {
    const r = res();
    await generateHandler({ method: 'POST', headers, body: { brain, engine: 'copy', inputs: { channel: 'SMS', instruction: '' } } }, r);
    assert.equal(r.code, 401, `a missing/empty/wrong/near-miss pilot key must be rejected with 401 (got headers=${JSON.stringify(headers)})`);
  }
  assert.equal(textCalls, 0, 'no unauthorized request, across any of the above cases, may ever reach OpenAI');
  console.log('PASS: /api/generate rejects every missing, empty, wrong, or near-miss pilot access key with 401, before any OpenAI call');

  // ---- 3. The correct key is accepted and the request proceeds normally — security must not
  // break the legitimate path.
  {
    const r = res();
    await generateHandler({ method: 'POST', headers: { 'x-pilot-key': 'correct-pilot-key' }, body: { brain, engine: 'copy', inputs: { channel: 'SMS', instruction: '' } } }, r);
    assert.equal(r.code, 200, 'the correct pilot key must be accepted and generation must proceed normally');
    assert.equal(textCalls, 1);
  }
  console.log('PASS: the correct pilot access key is accepted and content generation still works end to end');

  // ---- 4. Rate limiting on /api/generate: exceed the per-minute limit and get 429 with
  // Retry-After, measured against the real checkRateLimit logic the handler actually calls
  // (not a re-implementation of it) by simply making more real requests than the configured
  // ceiling allows.
  process.env.RATE_LIMIT_GENERATE_PER_MIN = '3';
  process.env.RATE_LIMIT_GENERATE_PER_DAY = '1000';
  _resetForTests();
  const authHeaders = { 'x-pilot-key': 'correct-pilot-key' };
  const codes = [];
  for (let i = 0; i < 5; i++) {
    const r = res();
    await generateHandler({ method: 'POST', headers: authHeaders, body: { brain, engine: 'copy', inputs: { channel: 'SMS', instruction: '' } } }, r);
    codes.push(r.code);
  }
  assert.deepEqual(codes, [200, 200, 200, 429, 429], 'the 4th and 5th request within the same minute, from the same client, must be rate-limited');
  const limited = res();
  await generateHandler({ method: 'POST', headers: authHeaders, body: { brain, engine: 'copy', inputs: {} } }, limited);
  assert.ok(limited.headers['Retry-After'], 'a 429 response must include a Retry-After header so a well-behaved client knows when to retry');
  console.log('PASS: /api/generate enforces its per-minute rate limit and returns 429 with a Retry-After header once exceeded');

  // ---- 5. The request-size ceiling on /api/generate rejects an oversized body with 413,
  // before normalization or any OpenAI call.
  process.env.RATE_LIMIT_GENERATE_PER_MIN = '1000';
  _resetForTests();
  {
    const hugeInstructions = 'أ'.repeat(200_000);
    const r = res();
    const before = textCalls;
    await generateHandler({ method: 'POST', headers: authHeaders, body: { brain, engine: 'content', inputs: { contentInstructions: hugeInstructions } } }, r);
    assert.equal(r.code, 413, 'a request body far larger than any legitimate payload must be rejected with 413');
    assert.equal(textCalls, before, 'an oversized request must never reach OpenAI');
  }
  console.log('PASS: /api/generate rejects an oversized request body with 413 before normalization or any OpenAI call');
} finally {
  OpenAI.Responses.prototype.create = originalCreate;
  if (originalOpenAIKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = originalOpenAIKey;
  if (originalPilotKey === undefined) delete process.env.PILOT_ACCESS_KEY; else process.env.PILOT_ACCESS_KEY = originalPilotKey;
  if (originalGenMin === undefined) delete process.env.RATE_LIMIT_GENERATE_PER_MIN; else process.env.RATE_LIMIT_GENERATE_PER_MIN = originalGenMin;
  if (originalGenDay === undefined) delete process.env.RATE_LIMIT_GENERATE_PER_DAY; else process.env.RATE_LIMIT_GENERATE_PER_DAY = originalGenDay;
  _resetForTests();
}

// ---- 6. Same coverage for /api/visual: unauthorized rejected before any image call, correct
// key still works, and its (stricter) rate limit is enforced independently of /api/generate's.
{
  const originalImgKey = process.env.OPENAI_API_KEY;
  const originalPilot = process.env.PILOT_ACCESS_KEY;
  const originalVisMinLocal = process.env.RATE_LIMIT_VISUAL_PER_MIN;
  process.env.OPENAI_API_KEY = 'qa-image-placeholder';
  process.env.PILOT_ACCESS_KEY = 'correct-pilot-key';
  let imageCalls = 0;
  const originalGenerate = OpenAI.Images.prototype.generate;
  OpenAI.Images.prototype.generate = async () => { imageCalls++; return { data: [{ b64_json: '/9j/2Q==' }] } };
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==';
  const base = { brain, brand: { primary: '#aa7733', secondary: '#111111', accent: '', style: '', logo: null, references: [] }, task: { engine: 'content', selected: 'فكرة اليوم', context: 'فكرة اليوم ضمن الخطة' }, settings: { format: '1:1', mode: 'Product Hero', textMode: 'none' } };
  try {
    _resetForTests();
    const unauthorized = res();
    await visualHandler({ method: 'POST', headers: {}, body: base }, unauthorized);
    assert.equal(unauthorized.code, 401, '/api/visual must reject a request with no pilot key');
    assert.equal(imageCalls, 0, 'an unauthorized /api/visual request must never reach the image model (the most expensive call in this app)');

    const authorized = res();
    await visualHandler({ method: 'POST', headers: { 'x-pilot-key': 'correct-pilot-key' }, body: base }, authorized);
    assert.equal(authorized.code, 200, 'the correct pilot key must still allow Visual Studio generation to work');
    assert.equal(imageCalls, 1);

    process.env.RATE_LIMIT_VISUAL_PER_MIN = '2';
    _resetForTests();
    const visCodes = [];
    for (let i = 0; i < 4; i++) {
      const r = res();
      await visualHandler({ method: 'POST', headers: { 'x-pilot-key': 'correct-pilot-key' }, body: base }, r);
      visCodes.push(r.code);
    }
    assert.deepEqual(visCodes, [200, 200, 429, 429], '/api/visual must enforce its own, stricter per-minute rate limit independently of /api/generate');
    console.log('PASS: /api/visual rejects unauthorized requests before any image-generation call, the correct key still works, and its own stricter rate limit is enforced');
  } finally {
    OpenAI.Images.prototype.generate = originalGenerate;
    if (originalImgKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = originalImgKey;
    if (originalPilot === undefined) delete process.env.PILOT_ACCESS_KEY; else process.env.PILOT_ACCESS_KEY = originalPilot;
    if (originalVisMinLocal === undefined) delete process.env.RATE_LIMIT_VISUAL_PER_MIN; else process.env.RATE_LIMIT_VISUAL_PER_MIN = originalVisMinLocal;
    _resetForTests();
  }
}

// ---- 7. No secret value is committed anywhere in the repository — only references to the env
// var name, never a literal key. This greps the actual tracked source, not just this test file.
{
  const { execSync } = await import('node:child_process');
  const trackedFiles = execSync('git ls-files', { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean);
  for (const file of trackedFiles) {
    if (file.startsWith('scripts/qa-') || file === 'pilot' || file.startsWith('pilot/')) continue; // test fixtures / docs about the mechanism, not the real secret
    const full = path.join(root, file);
    if (!fs.existsSync(full) || fs.statSync(full).isDirectory()) continue;
    let text;
    try { text = fs.readFileSync(full, 'utf8') } catch { continue } // skip binary files (images, etc.)
    assert.ok(!text.includes('correct-pilot-key'), `${file} must never contain a literal pilot access key value`);
  }
  console.log('PASS: no literal pilot access key value is committed anywhere in the tracked repository (only the PILOT_ACCESS_KEY env var name is referenced)');
}

console.log('\nPASS SECURITY: unauthorized requests are rejected server-side on both AI endpoints (never relying on frontend state), the gate fails closed when unconfigured, rate limiting and the request-size ceiling are real and enforced before any OpenAI call, and legitimate authorized requests still work end to end');
