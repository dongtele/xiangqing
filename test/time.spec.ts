import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { countdown, mmss } from '@/utils/time';

describe('utils/time', () => {
  describe('mmss', () => {
    it.each([
      [0, '00:00'],
      [9, '00:09'],
      [65, '01:05'],
      [900, '15:00'],
      [3599, '59:59'],
    ])('%i 秒 → %s', (s, expected) => {
      expect(mmss(s)).toBe(expected);
    });

    it('负数钳制到 00:00，不出现 -01:-5 这种脏文案', () => {
      expect(mmss(-30)).toBe('00:00');
    });
  });

  describe('countdown', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('立即回调一次当前值，之后每秒递减', () => {
      const onTick = vi.fn();
      countdown(3, onTick);

      expect(onTick).toHaveBeenNthCalledWith(1, 3);
      vi.advanceTimersByTime(1000);
      expect(onTick).toHaveBeenNthCalledWith(2, 2);
      vi.advanceTimersByTime(1000);
      expect(onTick).toHaveBeenNthCalledWith(3, 1);
    });

    it('归零时回调 0 并触发 onEnd，之后不再 tick', () => {
      const onTick = vi.fn();
      const onEnd = vi.fn();
      countdown(2, onTick, onEnd);

      vi.advanceTimersByTime(2000);
      expect(onTick).toHaveBeenLastCalledWith(0);
      expect(onEnd).toHaveBeenCalledTimes(1);

      const calls = onTick.mock.calls.length;
      vi.advanceTimersByTime(5000);
      expect(onTick.mock.calls.length).toBe(calls);
    });

    it('返回的停止函数能中断计时（页面卸载时必须调用，否则后台空跑）', () => {
      const onTick = vi.fn();
      const stop = countdown(60, onTick);

      vi.advanceTimersByTime(2000);
      const calls = onTick.mock.calls.length;
      stop();
      vi.advanceTimersByTime(10000);
      expect(onTick.mock.calls.length).toBe(calls);
    });
  });
});
