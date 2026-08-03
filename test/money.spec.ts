import { describe, expect, it } from 'vitest';
import { fen2yuan, fen2yuan2, fen2yuanGrouped, yuanLabel } from '@/utils/money';

/** 金额一律以「分」存储，这几个函数是唯一的展示层出口，出错会影响每一屏的价格 */
describe('utils/money', () => {
  describe('fen2yuan：整数不补零，小数最多两位', () => {
        it.each([
      [68000, '680'],
      [6850, '68.5'],
      [6805, '68.05'],
      [0, '0'],
      [1, '0.01'],
    ])('%i 分 → %s', (fen, expected) => {
      expect(fen2yuan(fen)).toBe(expected);
    });
  });

  it('fen2yuan2 恒定两位小数（收银台等强调金额的场景）', () => {
    expect(fen2yuan2(6800)).toBe('68.00');
    expect(fen2yuan2(6805)).toBe('68.05');
    expect(fen2yuan2(0)).toBe('0.00');
  });

  describe('fen2yuanGrouped 千分位', () => {
    it.each([
      [428050, '4,280.50'],
      [1248620, '12,486.20'],
      [100, '1.00'],
      [123456789, '1,234,567.89'],
    ])('%i 分 → %s', (fen, expected) => {
      expect(fen2yuanGrouped(fen)).toBe(expected);
    });
  });

  it('yuanLabel 带货币符号', () => {
    expect(yuanLabel(6400)).toBe('¥64');
    expect(yuanLabel(6450)).toBe('¥64.5');
  });
});
