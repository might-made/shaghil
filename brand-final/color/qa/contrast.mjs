// WCAG 2.1 contrast ratio calculator — real math, not visual judgment.
// Usage: import { ratio, aa } from './contrast.mjs'
export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = h.length === 3
    ? h.split('').map((c) => c + c).join('')
    : h;
  const int = parseInt(n, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

function channel(c) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function ratio(hex1, hex2) {
  const l1 = relLuminance(hex1), l2 = relLuminance(hex2);
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// AA thresholds: 4.5:1 normal text, 3:1 large text (>=18pt/24px or bold >=14pt/18.66px) and UI components/graphical objects.
export function aa(hex1, hex2, large = false) {
  const r = ratio(hex1, hex2);
  const threshold = large ? 3.0 : 4.5;
  return { ratio: Math.round(r * 100) / 100, pass: r >= threshold, threshold };
}

export function report(pairs) {
  return pairs.map(([label, fg, bg, large]) => {
    const { ratio: r, pass, threshold } = aa(fg, bg, large);
    return { label, fg, bg, large: !!large, ratio: r, threshold, verdict: pass ? 'PASS' : 'FAIL' };
  });
}

export function printReport(title, pairs) {
  console.log(`\n=== ${title} ===`);
  const rows = report(pairs);
  for (const row of rows) {
    console.log(`${row.verdict.padEnd(4)} ${row.ratio.toFixed(2)}:1 (need ${row.threshold}:1${row.large ? ', large/UI' : ''})  ${row.label}  [${row.fg} on ${row.bg}]`);
  }
  return rows;
}
