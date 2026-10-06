import fs from "fs";

// Security hardening: rate limits on /api/generate and /api/visual are real, and tested
// explicitly and precisely in qa-v14-security.mjs with their own tight values and a freshly
// reset limiter. Every other QA file below fires many legitimate requests in quick succession
// (from the same unidentified test "IP") to test application behavior, not the limiter itself —
// give them headroom far above anything a single file could plausibly need, so the limiter
// never incidentally throttles a functional-correctness test.
process.env.RATE_LIMIT_GENERATE_PER_MIN ||= "1000";
process.env.RATE_LIMIT_GENERATE_PER_DAY ||= "100000";
process.env.RATE_LIMIT_VISUAL_PER_MIN ||= "1000";
process.env.RATE_LIMIT_VISUAL_PER_DAY ||= "100000";

const mustExist = [
  "index.html",
  "api/generate.mjs",
  "api/health.mjs",
  "package.json",
  "vercel.json"
];

let failed = false;
for (const f of mustExist) {
  if (!fs.existsSync(f)) {
    console.error("MISSING:", f);
    failed = true;
  } else {
    console.log("PASS:", f);
  }
}

const html = fs.readFileSync("index.html", "utf8");
const checks = [
  ["6 engines", ["content","copy","offer","whatsapp","campaign","reel"].every(x => html.includes(`openEngine('${x}')`))],
  ["API endpoint", html.includes("/api/generate")],
  ["Business Brain persistence", html.includes("localStorage.setItem('brain'")],
  ["No API key in browser", !html.includes("OPENAI_API_KEY")]
];

for (const [name, ok] of checks) {
  console.log(ok ? "PASS:" : "FAIL:", name);
  if (!ok) failed = true;
}

if (failed) process.exit(1);
console.log("\nSHAGHIL V0.7 structural QA PASS");

await import("./qa-v05.mjs");

await import("./qa-v06.mjs");

await import('./qa-v07.mjs');

await import('./qa-v07-upload-ux.mjs');

const {execFileSync}=await import('node:child_process');
// Runs in its own process (fresh IndexedDB) since it counts saved products by name/id,
// which would collide with the products earlier suites in this same process already saved.
execFileSync(process.execPath,['scripts/qa-v07-product-persistence.mjs'],{stdio:'inherit'});
execFileSync(process.execPath,['scripts/qa-v07-migration.mjs'],{stdio:'inherit'});
// Orchestrates its own two child processes (two separate simulated browser origins).
execFileSync(process.execPath,['scripts/qa-v08-workspace-transfer.mjs'],{stdio:'inherit'});
execFileSync(process.execPath,['scripts/qa-v08-import-recovery-ui.mjs'],{stdio:'inherit'});
execFileSync(process.execPath,['scripts/qa-v08-history-nav.mjs'],{stdio:'inherit'});
execFileSync(process.execPath,['scripts/qa-v08-history-render.mjs'],{stdio:'inherit'});

await import('./qa-v09-pilot-readiness.mjs');
await import('./qa-v09-background-isolation.mjs');
await import('./qa-product-closure-export-warning.mjs');

// Orchestrates its own two child processes (two separate simulated browser origins), like qa-v08-workspace-transfer.mjs.
execFileSync(process.execPath,['scripts/qa-v10-workspace-portability.mjs'],{stdio:'inherit'});

await import('./qa-founder-refinement.mjs');

// Runs in its own process (fresh IndexedDB): it counts exact product-store lengths, which
// would collide with products earlier suites in this same process already saved.
execFileSync(process.execPath,['scripts/qa-closed-pilot-ux.mjs'],{stdio:'inherit'});

await import('./qa-content-engine-brief.mjs');

await import('./qa-content-plan-display.mjs');

await import('./qa-campaign-display.mjs');

// Orchestrates its own three child processes (three separate simulated browser origins), like qa-v08-workspace-transfer.mjs.
execFileSync(process.execPath,['scripts/qa-preview-persistence.mjs'],{stdio:'inherit'});

await import('./qa-v11-theme-brand.mjs');

await import('./qa-v12-mobile-nav.mjs');

await import('./qa-v13-app-icon.mjs');

await import('./qa-v14-security.mjs');

await import('./qa-v15-pilot-gate.mjs');

await import('./qa-v16-batch1-business-ids.mjs');

await import('./qa-v17-batch2-campaign-pack-ids.mjs');

await import('./qa-v18-batch3-business-memory-schema.mjs');

await import('./qa-v19-batch4-voice-ssot.mjs');

await import('./qa-v20-batch5-context-matrix.mjs');

await import('./qa-v21-batch6-text-context-wiring.mjs');

await import('./qa-v22-batch7-product-memory-schema.mjs');

// Runs in its own process (fresh IndexedDB), like qa-v07-product-persistence.mjs: its
// zero/one/multiple-product assertions require an empty Product Library to start, which the
// shared in-process store no longer is by this point (qa-v17/qa-v22 above both leave products in it).
execFileSync(process.execPath,['scripts/qa-v23-batch8-product-selection.mjs'],{stdio:'inherit'});

await import('./qa-v24-batch9-visual-context-wiring.mjs');

// Orchestrates its own two child processes (a fresh IndexedDB for the import phase), like
// qa-v08-workspace-transfer.mjs — it is itself the top-level entry point for both phases.
execFileSync(process.execPath,['scripts/qa-v25-batch10-progressive-hardening.mjs'],{stdio:'inherit'});

// Founder QA follow-up: real persistence -> real engine selector -> real request -> real
// normalized-context proof for the product selector, on a brand-new product (not a pre-seeded
// one). Runs in its own process (fresh IndexedDB), like qa-v07-product-persistence.mjs, since it
// requires a genuinely empty Product Library to start.
execFileSync(process.execPath,['scripts/qa-v26-product-selector-e2e.mjs'],{stdio:'inherit'});

// SHGHIL V4.1 — Outcome Experience / Sales Growth Mission (requirements A-T). Runs in its own
// process (fresh IndexedDB), like qa-v23/qa-v26, since several of its blocks need a genuinely
// empty Product Library to prove the zero/one/multiple-product paths deterministically.
execFileSync(process.execPath,['scripts/qa-v27-outcome-mission-regression.mjs'],{stdio:'inherit'});
