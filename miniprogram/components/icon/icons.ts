/**
 * 线性图标库（沿用设计稿内联 SVG：viewBox 24、stroke-linecap round、线性风格）。
 * 不混用面性图标。新增图标请保持 stroke-width 1.9–2.4 的观感。
 */
export const ICON_PATHS: Record<string, string> = {
  /* TabBar */
  menu: '<path d="M4 11h16"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M9 7c0-2.2 6-2.2 6 0"/>',
  order: '<rect x="5" y="4" width="14" height="16" rx="2"/><path d="M9 9.5h6M9 13.5h6"/>',
  user: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c1.5-3.6 12.5-3.6 14 0"/>',
  grid:
    '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/>' +
    '<rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  box: '<path d="M4 8l8-4 8 4v8l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v8"/>',
  shop: '<path d="M4 11l8-7 8 7"/><path d="M6 10v9h12v-9"/>',

  /* 通用 */
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  cart: '<path d="M5 8h14l-1.5 11h-11z"/><path d="M9 8a3 3 0 0 1 6 0"/>',
  pin: '<path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
  star: '<path d="M12 4l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z"/>',
  headset:
    '<path d="M4 13a8 8 0 0 1 16 0"/><rect x="3" y="13" width="4" height="6" rx="1.5"/>' +
    '<rect x="17" y="13" width="4" height="6" rx="1.5"/>',
  card: '<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M4 10h16"/>',
  trash: '<path d="M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13"/>',
  scan:
    '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>' +
    '<path d="M13 4h7v7M4 13v7h7"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  phone:
    '<path d="M6 4h3l2 5-2.5 1.5a10 10 0 0 0 5 5L15 13l5 2v3a2 2 0 0 1-2 2A15 15 0 0 1 4 6a2 2 0 0 1 2-2z"/>',
  printer:
    '<path d="M7 9V4h10v5"/><rect x="4" y="9" width="16" height="7" rx="2"/><path d="M7 16h10v4H7z"/>',

  /* 支付 */
  'pay-wechat': '<path d="M4 8h16v10H4z"/><path d="M8 12h5"/>',
  'pay-balance': '<circle cx="12" cy="12" r="8"/><path d="M9 12h6"/>',
  'pay-friend':
    '<circle cx="9" cy="8.5" r="3"/><path d="M3 19c1.2-3 3.4-4.4 6-4.4S13.8 16 15 19"/>' +
    '<path d="M17 9v6M14 12h6"/>',
};

/** 需要填充的图标（感叹号的点） */
export const ICON_EXTRA: Record<string, string> = {
  warn: '<path d="M12 7v6"/><circle cx="12" cy="17" r="0.7" fill="CURRENT" stroke="none"/>',
};
