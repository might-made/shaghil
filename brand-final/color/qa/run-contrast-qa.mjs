import fs from 'node:fs';
import { printReport, ratio } from './contrast.mjs';

const concepts = ['C1-signal-indigo', 'C2-graphite-pulse', 'C3-dusk-oud'].map((f) =>
  JSON.parse(fs.readFileSync(new URL(`../concepts/${f}.json`, import.meta.url), 'utf8'))
);

const allResults = {};

for (const c of concepts) {
  allResults[c.id] = {};
  for (const mode of ['light', 'dark']) {
    const t = c[mode];
    if (!t) continue;
    const pairs = [
      ['Body text / background', t.textPrimary, t.background],
      ['Secondary text / background', t.textSecondary, t.background],
      ['Body text / surface', t.textPrimary, t.surface],
      ['Secondary text / surface', t.textSecondary, t.surface],
      ['CTA text / CTA background', t.interactiveCtaText, t.interactiveCta],
      ['Nav text / background (nav = elevatedSurface)', t.textPrimary, t.elevatedSurface],
      ['Input text / input background (input = surface)', t.textPrimary, t.surface],
      ['Placeholder-ish secondary text / input bg', t.textSecondary, t.surface],
      ['Success text / background', t.success, t.background],
      ['Warning text / background', t.warning, t.background],
      ['Error text / background', t.error, t.background],
      ['Info text / background', t.info, t.background],
      ['Primary (link/icon use) / background', t.primary, t.background, true],
      ['Focus ring / background (UI component, 3:1)', t.focus, t.background, true],
    ];
    const rows = printReport(`${c.name} (${c.id}) — ${mode.toUpperCase()} MODE`, pairs);
    allResults[c.id][mode] = rows;

    // Reported for transparency only, not enforced as pass/fail: WCAG 1.4.11 exempts purely
    // decorative dividers (cards/inputs here are already distinguishable by background-color
    // contrast, so the border is never the sole cue), and WCAG 1.4.3/1.4.11 explicitly exempt
    // disabled/inactive UI component text.
    const borderRatio = ratio(t.border, t.background);
    const disabledRatio = ratio(t.disabledText, t.disabledBg);
    console.log(`INFO ${borderRatio.toFixed(2)}:1  Border / background (decorative divider, WCAG-exempt)  [${t.border} on ${t.background}]`);
    console.log(`INFO ${disabledRatio.toFixed(2)}:1  Disabled text / disabled background (WCAG-exempt)  [${t.disabledText} on ${t.disabledBg}]`);
  }
}

fs.writeFileSync(new URL('./contrast-results.json', import.meta.url), JSON.stringify(allResults, null, 2));

let failCount = 0;
for (const id of Object.keys(allResults)) {
  for (const mode of Object.keys(allResults[id])) {
    for (const row of allResults[id][mode]) {
      if (row.verdict === 'FAIL') failCount++;
    }
  }
}
console.log(`\n\nTOTAL ENFORCED FAILURES: ${failCount}`);
