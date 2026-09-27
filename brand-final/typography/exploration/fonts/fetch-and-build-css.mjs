// Parses each raw Google Fonts CSS2 response, downloads every referenced WOFF2 file locally,
// and rewrites a local @font-face stylesheet pointing at the downloaded files — so the boards
// render with the actual real font files, self-hosted and reproducible, not a live Google Fonts
// dependency.
import fs from 'node:fs';
import path from 'node:path';

const jobs = [
  { raw: 'cairo.css.raw', out: 'cairo.css', prefix: 'cairo' },
  { raw: 'plexarabic.css.raw', out: 'plexarabic.css', prefix: 'plexarabic' },
  { raw: 'plexsans.css.raw', out: 'plexsans.css', prefix: 'plexsans' },
  { raw: 'elmessiri.css.raw', out: 'elmessiri.css', prefix: 'elmessiri' },
  { raw: 'readexpro.css.raw', out: 'readexpro.css', prefix: 'readexpro' },
  { raw: 'fraunces.css.raw', out: 'fraunces.css', prefix: 'fraunces' },
  { raw: 'worksans.css.raw', out: 'worksans.css', prefix: 'worksans' },
];

for (const job of jobs) {
  const css = fs.readFileSync(job.raw, 'utf8');
  const blocks = css.split('@font-face').slice(1).map((b) => '@font-face' + b);
  let outCss = '';
  let n = 0;
  for (const block of blocks) {
    const family = block.match(/font-family:\s*'([^']+)'/)?.[1] || 'unknown';
    const weight = block.match(/font-weight:\s*(\d+)/)?.[1] || '400';
    const style = block.match(/font-style:\s*(\w+)/)?.[1] || 'normal';
    const urlMatch = block.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/);
    const unicodeRange = block.match(/unicode-range:\s*([^;]+);/)?.[1] || '';
    if (!urlMatch) continue;
    n++;
    const fname = `${job.prefix}-${weight}-${n}.woff2`;
    outCss += `@font-face {\n  font-family: '${family}';\n  font-style: ${style};\n  font-weight: ${weight};\n  font-display: swap;\n  src: url('${fname}') format('woff2');\n  unicode-range: ${unicodeRange};\n}\n`;
    // Download synchronously via fetch
    const res = await fetch(urlMatch[1]);
    if (!res.ok) { console.error('FAILED', urlMatch[1]); continue; }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(fname, buf);
  }
  fs.writeFileSync(job.out, outCss);
  console.log(job.prefix, '->', n, 'font files downloaded');
}
