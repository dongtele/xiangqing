import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * 假后端里的校验规则。
 * 同样当接口契约用：接真实后端后这些拦截必须还在，否则前端只是「看起来」拦住了。
 */
type Resolve = <T>(key: string, payload: Record<string, unknown>) => Promise<T>;
type Result = { ok: boolean; message: string };

let mockResolve: Resolve;

beforeEach(async () => {
  vi.resetModules();
  ({ mockResolve } = await import('@/services/mock'));
});

describe('提现校验（34 / 88）', () => {
  it('低于 100 元不放行', async () => {
    const r = await mockResolve<Result>('POST /merchant/settlement/withdraw', { amount: 99 });
    expect(r.ok).toBe(false);
    expect(r.message).toContain('100');
  });

  it('超过可提现余额不放行', async () => {
    const r = await mockResolve<Result>('POST /merchant/settlement/withdraw', { amount: 999999 });
    expect(r.ok).toBe(false);
    expect(r.message).toContain('余额');
  });

  it('正常提现后余额减少并新增一条流水', async () => {
    const num = (s: string) => Number(s.replace(/,/g, ''));
    // mock 直接返回 state 上的对象，前后两次拿到的是同一个引用，
    // 所以要在提现前先把标量取出来快照，不能留着对象比对。
    const snap = await mockResolve<{ balanceText: string; rows: unknown[] }>(
      'GET /merchant/settlement',
      {}
    );
    const balanceBefore = num(snap.balanceText);
    const rowsBefore = snap.rows.length;

    const r = await mockResolve<Result>('POST /merchant/settlement/withdraw', { amount: 1000 });
    expect(r.ok).toBe(true);

    const after = await mockResolve<{ balanceText: string; rows: unknown[] }>(
      'GET /merchant/settlement',
      {}
    );
    expect(num(after.balanceText)).toBeCloseTo(balanceBefore - 1000, 2);
    expect(after.rows.length).toBe(rowsBefore + 1);
  });
});

describe('创建店铺优惠券（95）', () => {
  it('优惠金额不小于门槛时拒绝——否则等于白送', async () => {
    const r = await mockResolve<Result>('POST /merchant/coupon/save', {
      kind: 'cash',
      amount: 4000,
      threshold: 4000,
    });
    expect(r.ok).toBe(false);
    expect(r.message).toContain('门槛');
  });

  it('优惠金额小于门槛时放行', async () => {
    const r = await mockResolve<Result>('POST /merchant/coupon/save', {
      kind: 'cash',
      amount: 800,
      threshold: 4000,
    });
    expect(r.ok).toBe(true);
  });

  it('无门槛券（threshold 0）不受该校验限制', async () => {
    const r = await mockResolve<Result>('POST /merchant/coupon/save', {
      kind: 'cash',
      amount: 300,
      threshold: 0,
    });
    expect(r.ok).toBe(true);
  });
});

describe('核销取餐码（21）', () => {
  it('不存在的码要拒绝，防错核', async () => {
    const r = await mockResolve<Result>('POST /merchant/verify', { code: '0000' });
    expect(r.ok).toBe(false);
  });

  it('有效码核销成功并写进核销记录', async () => {
    const r = await mockResolve<Result>('POST /merchant/verify', { code: '8823' });
    expect(r.ok).toBe(true);

    const log = await mockResolve<{ list: { code: string }[] }>('GET /merchant/verify/log', {
      tab: 'today',
    });
    expect(log.list[0].code).toBe('8823');
  });

  it('码大小写不敏感', async () => {
    const r = await mockResolve<Result>('POST /merchant/verify', { code: '8q4k' });
    expect(r.ok).toBe(true);
  });
});

describe('入驻提交（27）', () => {
  it('必传资质没齐时不允许提交', async () => {
    const r = await mockResolve<Result>('POST /onboard/submit', {});
    expect(r.ok).toBe(false);
    expect(r.message).toContain('必传');
  });

  it('补齐必传项后可以提交', async () => {
    const license = await mockResolve<{ slots: { key: string; required: boolean; path: string }[] }>(
      'GET /onboard/license',
      {}
    );
    for (const slot of license.slots.filter((s) => s.required && !s.path)) {
      await mockResolve('POST /onboard/license/upload', { key: slot.key, path: 'uploaded' });
    }
    const r = await mockResolve<Result>('POST /onboard/submit', {});
    expect(r.ok).toBe(true);
  });

  it('营业执照上传后回填 OCR 识别结果', async () => {
    const r = await mockResolve<Result>('POST /onboard/license/upload', {
      key: 'license',
      path: 'uploaded',
    });
    expect(r.message).toContain('识别');

    const after = await mockResolve<{ slots: { key: string; ocrText: string }[] }>(
      'GET /onboard/license',
      {}
    );
    const license = after.slots.find((s) => s.key === 'license');
    expect(license?.ocrText).toContain('91440300');
  });
});

describe('异常订单处理（92）', () => {
  it('同意取消后转为已处理并记下结论', async () => {
    const before = await mockResolve<{ list: { id: string; resolved: boolean }[] }>(
      'GET /merchant/orders/exception',
      { tab: 'cancel' }
    );
    const target = before.list.find((o) => !o.resolved);
    expect(target).toBeDefined();

    const r = await mockResolve<Result>('POST /merchant/orders/exception/resolve', {
      tab: 'cancel',
      id: target!.id,
      action: 'agree',
    });
    expect(r.ok).toBe(true);

    const after = await mockResolve<{
      list: { id: string; resolved: boolean; resolveText: string }[];
    }>('GET /merchant/orders/exception', { tab: 'cancel' });
    const done = after.list.find((o) => o.id === target!.id);
    expect(done?.resolved).toBe(true);
    expect(done?.resolveText).toContain('同意取消');
  });

  it('待处理计数随处理递减', async () => {
    const before = await mockResolve<{ counts: { cancel: number } }>(
      'GET /merchant/orders/exception',
      { tab: 'cancel' }
    );
    const list = await mockResolve<{ list: { id: string; resolved: boolean }[] }>(
      'GET /merchant/orders/exception',
      { tab: 'cancel' }
    );
    const target = list.list.find((o) => !o.resolved)!;
    await mockResolve('POST /merchant/orders/exception/resolve', {
      tab: 'cancel',
      id: target.id,
      action: 'agree',
    });

    const after = await mockResolve<{ counts: { cancel: number } }>(
      'GET /merchant/orders/exception',
      { tab: 'cancel' }
    );
    expect(after.counts.cancel).toBe(before.counts.cancel - 1);
  });
});

describe('兑换码（17）', () => {
  it('空码与错码都要拒绝', async () => {
    expect((await mockResolve<Result>('POST /customer/coupons/redeem', { code: '' })).ok).toBe(
      false
    );
    expect((await mockResolve<Result>('POST /customer/coupons/redeem', { code: 'XXXX' })).ok).toBe(
      false
    );
  });

  it('正确兑换码入账到可用券', async () => {
    const before = await mockResolve<{ list: unknown[] }>('GET /customer/coupons', {
      tab: 'usable',
    });
    const r = await mockResolve<Result>('POST /customer/coupons/redeem', { code: 'mwf2026' });
    expect(r.ok).toBe(true);

    const after = await mockResolve<{ list: unknown[] }>('GET /customer/coupons', {
      tab: 'usable',
    });
    expect(after.list.length).toBe(before.list.length + 1);
  });
});
