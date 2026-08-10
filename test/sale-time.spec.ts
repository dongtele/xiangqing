import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isOnSaleNow,
  mergeSlots,
  nextOpenText,
  saleTimeText,
  weekdayText,
} from '@/utils/sale-time';
import type { SaleSlot, SaleTime } from '@/models';

/**
 * 售卖时段（交付文档 102）。
 * 「现在能不能买」这条判断菜单、商品详情、下单校验三处都在用，算错就是少卖或超卖，所以逐条锁死。
 */
const slot = (start: string, end: string, label = '午市', enabled = true): SaleSlot => ({
  id: `${start}-${end}`,
  label,
  start,
  end,
  enabled,
});

const range = (slots: SaleSlot[], weekdays = [1, 2, 3, 4, 5, 6, 7]): SaleTime => ({
  mode: 'range',
  weekdays,
  slots,
});

/** 2026-08-10 是周一 */
function at(iso: string): Date {
  return new Date(iso);
}

afterEach(() => {
  vi.useRealTimers();
});

describe('isOnSaleNow', () => {
  it('没配时段按全天售卖', () => {
    expect(isOnSaleNow(undefined, at('2026-08-10T03:00:00'))).toBe(true);
  });

  it('allday 模式任何时刻都在售', () => {
    const t: SaleTime = { mode: 'allday', weekdays: [1, 2, 3, 4, 5, 6, 7], slots: [] };
    expect(isOnSaleNow(t, at('2026-08-10T03:00:00'))).toBe(true);
  });

  it.each([
    ['12:00 在午市内', '2026-08-10T12:00:00', true],
    ['11:00 是开始，算在内', '2026-08-10T11:00:00', true],
    ['14:00 是结束，不算在内', '2026-08-10T14:00:00', false],
    ['10:59 还没开', '2026-08-10T10:59:00', false],
  ])('%s', (_label, iso, expected) => {
    expect(isOnSaleNow(range([slot('11:00', '14:00')]), at(iso))).toBe(expected);
  });

  it('跨零点的夜宵档 22:00–02:00 两头都算在内', () => {
    const night = range([slot('22:00', '02:00', '夜宵')]);
    expect(isOnSaleNow(night, at('2026-08-10T23:30:00'))).toBe(true);
    expect(isOnSaleNow(night, at('2026-08-10T01:00:00'))).toBe(true);
    expect(isOnSaleNow(night, at('2026-08-10T12:00:00'))).toBe(false);
  });

  it('重复日期不含今天就不售（周一设成周末档）', () => {
    const weekend = range([slot('11:00', '14:00')], [6, 7]);
    expect(isOnSaleNow(weekend, at('2026-08-10T12:00:00'))).toBe(false);
  });

  it('关掉的时段不参与判断', () => {
    const off = range([slot('11:00', '14:00', '午市', false)]);
    expect(isOnSaleNow(off, at('2026-08-10T12:00:00'))).toBe(false);
  });
});

describe('mergeSlots：重叠自动合并', () => {
  it('相接与重叠的两段合成一段', () => {
    const merged = mergeSlots([slot('11:00', '14:00'), slot('13:00', '16:00', '晚市')]);
    expect(merged).toHaveLength(1);
    expect(merged[0].start).toBe('11:00');
    expect(merged[0].end).toBe('16:00');
  });

  it('不相交的两段各自保留', () => {
    expect(mergeSlots([slot('11:00', '14:00'), slot('17:00', '21:30', '晚市')])).toHaveLength(2);
  });

  it('跨零点的段不参与合并，避免把语义拆散', () => {
    const merged = mergeSlots([slot('11:00', '14:00'), slot('22:00', '02:00', '夜宵')]);
    expect(merged).toHaveLength(2);
    expect(merged.find((s) => s.label === '夜宵')?.end).toBe('02:00');
  });
});

describe('nextOpenText：顾客端角标', () => {
  it('在售时不出角标', () => {
    expect(nextOpenText(range([slot('11:00', '14:00')]), at('2026-08-10T12:00:00'))).toBe('');
  });

  it('还没开售指向今天的第一段', () => {
    expect(nextOpenText(range([slot('11:00', '14:00')]), at('2026-08-10T09:00:00'))).toBe(
      '11:00 开售'
    );
  });

  it('今天已收档就指向下一档的开始时间', () => {
    const t = range([slot('11:00', '14:00'), slot('17:00', '21:30', '晚市')]);
    expect(nextOpenText(t, at('2026-08-10T15:00:00'))).toBe('17:00 开售');
  });

  it('今天全部结束则回到第一段（次日）', () => {
    expect(nextOpenText(range([slot('11:00', '14:00')]), at('2026-08-10T22:00:00'))).toBe(
      '11:00 开售'
    );
  });
});

describe('saleTimeText / weekdayText：商家端副标题', () => {
  it('全天售卖', () => {
    expect(saleTimeText({ mode: 'allday', weekdays: [1, 2, 3, 4, 5, 6, 7], slots: [] })).toBe(
      '全天售卖'
    );
  });

  it('单段带标签', () => {
    expect(saleTimeText(range([slot('11:00', '14:00')]))).toBe('午市 11:00–14:00');
  });

  it('多段收口成「等 N 段」', () => {
    expect(saleTimeText(range([slot('11:00', '14:00'), slot('17:00', '21:30', '晚市')]))).toContain(
      '等 2 段'
    );
  });

  it('工作日 / 周末走快捷文案，每天不啰嗦', () => {
    expect(weekdayText({ mode: 'allday', weekdays: [1, 2, 3, 4, 5], slots: [] })).toBe('工作日');
    expect(weekdayText({ mode: 'allday', weekdays: [6, 7], slots: [] })).toBe('周末');
    expect(weekdayText({ mode: 'allday', weekdays: [1, 2, 3, 4, 5, 6, 7], slots: [] })).toBe('');
    expect(weekdayText({ mode: 'allday', weekdays: [1, 3], slots: [] })).toBe('一三');
  });
});
