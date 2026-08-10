import type { SaleSlot, SaleTime } from '@/models';

/**
 * 售卖时段（交付文档 102）。
 *
 * 全是纯函数、不碰 `uni.*`，顾客端菜单、商品详情、下单校验与单测都直接调这里，
 * 免得「现在到底能不能买」这条判断在三处各写一遍。
 * `now` 参数只为测试注入，业务代码不用传。
 */

/** 'HH:mm' → 当天第几分钟 */
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':');
  return Number(h) * 60 + Number(m);
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** JS 的 getDay() 是 0=周日，模型用 1=周一…7=周日 */
function weekdayOf(date: Date): number {
  return date.getDay() === 0 ? 7 : date.getDay();
}

/**
 * 时间重叠自动合并（交付文档要求）。
 * 跨零点的段（如 22:00–02:00）单独留着不参与合并——把它拆成两段再合会把语义弄丢。
 */
export function mergeSlots(slots: SaleSlot[]): SaleSlot[] {
  const enabled = slots.filter((s) => s.enabled);
  const overnight = enabled.filter((s) => toMinutes(s.end) <= toMinutes(s.start));
  const normal = enabled
    .filter((s) => toMinutes(s.end) > toMinutes(s.start))
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));

  const out: SaleSlot[] = [];
  for (const slot of normal) {
    const last = out[out.length - 1];
    if (last && toMinutes(slot.start) <= toMinutes(last.end)) {
      // 有重叠：并成一段，标签用靠前那段的
      if (toMinutes(slot.end) > toMinutes(last.end)) last.end = slot.end;
    } else {
      out.push({ ...slot });
    }
  }
  return [...out, ...overnight];
}

/** 某一段此刻是否命中（支持 22:00–02:00 这种跨零点） */
function slotCovers(slot: SaleSlot, minutes: number): boolean {
  const start = toMinutes(slot.start);
  const end = toMinutes(slot.end);
  return end > start ? minutes >= start && minutes < end : minutes >= start || minutes < end;
}

export function isOnSaleNow(saleTime: SaleTime | undefined, now: Date = new Date()): boolean {
  if (!saleTime) return true;
  if (saleTime.weekdays.length && saleTime.weekdays.indexOf(weekdayOf(now)) < 0) return false;
  if (saleTime.mode === 'allday') return true;

  const minutes = now.getHours() * 60 + now.getMinutes();
  return mergeSlots(saleTime.slots).some((s) => slotCovers(s, minutes));
}

/**
 * 顾客端角标：「11:00 开售」。
 * 取今天还没到的最早一段；今天已经全部结束（或今天不售卖）则指向下一个售卖日的第一段。
 */
export function nextOpenText(saleTime: SaleTime | undefined, now: Date = new Date()): string {
  if (!saleTime || isOnSaleNow(saleTime, now)) return '';

  const slots = mergeSlots(saleTime.slots).sort(
    (a, b) => toMinutes(a.start) - toMinutes(b.start)
  );
  if (saleTime.mode === 'allday' || !slots.length) return '今日不可售';

  const minutes = now.getHours() * 60 + now.getMinutes();
  const today = saleTime.weekdays.indexOf(weekdayOf(now)) >= 0;
  const upcoming = today ? slots.find((s) => toMinutes(s.start) > minutes) : undefined;
  return `${(upcoming || slots[0]).start} 开售`;
}

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

/** 商家端卡片副标题：全天售卖 / 午市 11:00–14:00 / 工作日 · 午市 11:00–14:00 等 2 段 */
export function saleTimeText(saleTime: SaleTime | undefined): string {
  if (!saleTime || saleTime.mode === 'allday') {
    return weekdayText(saleTime) ? `${weekdayText(saleTime)} · 全天售卖` : '全天售卖';
  }
  const slots = mergeSlots(saleTime.slots);
  if (!slots.length) return '未设置时段';

  const first = `${slots[0].label ? slots[0].label + ' ' : ''}${slots[0].start}–${slots[0].end}`;
  const body = slots.length > 1 ? `${first} 等 ${slots.length} 段` : first;
  const days = weekdayText(saleTime);
  return days ? `${days} · ${body}` : body;
}

/** 重复日期文案；每天返回空串（不啰嗦） */
export function weekdayText(saleTime: SaleTime | undefined): string {
  const days = saleTime?.weekdays || [];
  if (!days.length || days.length === 7) return '';
  const sorted = [...days].sort((a, b) => a - b);
  if (sorted.join() === '1,2,3,4,5') return '工作日';
  if (sorted.join() === '6,7') return '周末';
  return sorted.map((d) => WEEKDAY_LABELS[d - 1]).join('');
}

/** 102 新增时段时给个不重叠的默认值 */
export function nextSlotDefaults(slots: SaleSlot[]): { start: string; end: string } {
  const last = mergeSlots(slots).sort((a, b) => toMinutes(a.end) - toMinutes(b.end)).pop();
  const startMin = last ? Math.min(toMinutes(last.end) + 60, 22 * 60) : 11 * 60;
  const endMin = Math.min(startMin + 180, 23 * 60 + 30);
  return {
    start: `${pad(Math.floor(startMin / 60))}:${pad(startMin % 60)}`,
    end: `${pad(Math.floor(endMin / 60))}:${pad(endMin % 60)}`,
  };
}
