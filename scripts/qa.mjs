import fs from "fs";

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
