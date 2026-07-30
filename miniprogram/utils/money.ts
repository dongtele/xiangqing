/**
 * 金额工具：内部一律用「分」，展示层转「元」。
 */

/** 68000 → "680"；6850 → "68.5"；6805 → "68.05" */
export function fen2yuan(fen: number): string {
  const yuan = fen / 100;
  if (Number.isInteger(yuan)) return String(yuan);
  return String(Math.round(yuan * 100) / 100);
}

/** 6800 → "68.00"（收银台等强调金额场景） */
export function fen2yuan2(fen: number): string {
  return (fen / 100).toFixed(2);
}

/** 428050 → "4,280.50" */
export function fen2yuanGrouped(fen: number): string {
  const [int, dec] = (fen / 100).toFixed(2).split('.');
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${dec}`;
}

/** "¥68" */
export function yuanLabel(fen: number): string {
  return `¥${fen2yuan(fen)}`;
}
