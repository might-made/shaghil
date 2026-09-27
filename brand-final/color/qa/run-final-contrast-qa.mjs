import fs from 'node:fs';
import { printReport, ratio } from './contrast.mjs';

const t = JSON.parse(fs.readFileSync(new URL('../final/shaghil-color-tokens.json', import.meta.url), 'utf8'));

const allResults = {};

for (const mode of ['dark', 'light']) {
  const g = t[mode].graphite, s = t[mode].signal, i = t[mode].interactive, sem = t[mode].semantic;
  const pairs = [
    ['Primary text / background', g.textPrimary, g.bgPrimary],
    ['Secondary text / background', g.textSecondary, g.bgPrimary],
    ['Muted text / background', g.textMuted, g.bgPrimary],
    ['Primary text / surface', g.textPrimary, g.surface],
    ['Secondary text / surface', g.textSecondary, g.surface],
    ['Muted text / surface', g.textMuted, g.surface],
    ['CTA text / CTA background', i.ctaText, i.cta],
    ['CTA text / CTA hover background', i.ctaText, i.ctaHover],
    ['CTA text / CTA pressed background', i.ctaText, i.ctaPressed],
    ['Signal as link/text / background (signal.primary on own-mode surface)', s.primary, g.bgPrimary],
    ['Signal textOnLight / white chip (its documented use: on a light surface regardless of mode)', s.textOnLight, '#FFFFFF'],
    ['Focus ring / background (UI component, 3:1)', i.focus, g.bgPrimary, true],
    ['Signal border / background (UI component, 3:1)', s.border, g.bgPrimary, true],
    ['Strong border / background (UI component, 3:1)', g.borderStrong, g.bgPrimary, true],
    ['Success text / background', sem.success, g.bgPrimary],
    ['Warning text / background', sem.warning, g.bgPrimary],
    ['Error text / background', sem.error, g.bgPrimary],
    ['Info text / background', sem.info, g.bgPrimary],
  ];
  const rows = printReport(`FINAL C2 — ${mode.toUpperCase()} MODE`, pairs);
  allResults[mode] = rows;
}

fs.writeFileSync(new URL('./final-contrast-results.json', import.meta.url), JSON.stringify(allResults, null, 2));

let failCount = 0;
for (const mode of Object.keys(allResults)) for (const row of allResults[mode]) if (row.verdict === 'FAIL') failCount++;
console.log(`\n\nTOTAL ENFORCED FAILURES: ${failCount}`);
