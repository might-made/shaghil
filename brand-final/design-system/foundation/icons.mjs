// Representative neutral icon set for establishing SHAGHIL's iconography RULES only —
// not a proprietary icon library. Simple geometric outline strokes, 1.5px stroke weight,
// 20x20 viewBox, currentColor fill=none, matching brand-final/design-system/foundation/
// shaghil-ui-tokens.json's iconStrokeWeight/icon.default.
const S = 'stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"';
export const icons = {
  chevronStart: `<svg viewBox="0 0 20 20" ${S}><path d="M12.5 5l-5 5 5 5"/></svg>`, // points toward reading-start; mirrors with direction
  chevronEnd: `<svg viewBox="0 0 20 20" ${S}><path d="M7.5 5l5 5-5 5"/></svg>`,
  check: `<svg viewBox="0 0 20 20" ${S}><path d="M4 10.5l4 4 8-9"/></svg>`,
  close: `<svg viewBox="0 0 20 20" ${S}><path d="M5 5l10 10M15 5L5 15"/></svg>`,
  plus: `<svg viewBox="0 0 20 20" ${S}><path d="M10 4v12M4 10h12"/></svg>`,
  search: `<svg viewBox="0 0 20 20" ${S}><circle cx="8.5" cy="8.5" r="5"/><path d="M16 16l-3.5-3.5"/></svg>`,
  upload: `<svg viewBox="0 0 20 20" ${S}><path d="M10 13V4M6 8l4-4 4 4"/><path d="M4 15h12"/></svg>`,
  info: `<svg viewBox="0 0 20 20" ${S}><circle cx="10" cy="10" r="7"/><path d="M10 9v5M10 6.5v.01"/></svg>`,
  refresh: `<svg viewBox="0 0 20 20" ${S}><path d="M15.5 8a5.5 5.5 0 10-.6 4.5M15.5 4v4h-4"/></svg>`,
  save: `<svg viewBox="0 0 20 20" ${S}><path d="M4 4h9l3 3v9H4z"/><path d="M7 4v4h6V4M6.5 12h7v4h-7z"/></svg>`,
  spark: `<svg viewBox="0 0 20 20" ${S}><path d="M10 3v3M10 14v3M3 10h3M14 10h3M5.5 5.5l2 2M12.5 12.5l2 2M14.5 5.5l-2 2M7.5 12.5l-2 2"/></svg>`,
  clock: `<svg viewBox="0 0 20 20" ${S}><circle cx="10" cy="10" r="7"/><path d="M10 6.5V10l3 2"/></svg>`,
  alert: `<svg viewBox="0 0 20 20" ${S}><path d="M10 3l8 14H2z"/><path d="M10 8.5v3M10 14v.01"/></svg>`,
};
