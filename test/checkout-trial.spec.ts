import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CartItem, CheckoutTrial, RefundTrial } from '@/models';

/**
 * 结算与退款的金额规则。
 *
 * 这些规则现在住在 mock 里，接真实后端后要由服务端实现——这组测例就是那份接口契约：
 * 后端返回对不上这里的期望，说明两边对优惠的理解不一致。
 *
 * mock 的 state 是模块级可变对象，所以每个测例前 resetModules + 动态 import 拿干净副本。
 */
type Resolve = <T>(key: string, payload: Record<string, unknown>) => Promise<T>;

let mockResolve: Resolve;

beforeEach(async () => {
  vi.resetModules();
  ({ mockResolve } = await import('@/services/mock'));
});

function item(unitPrice: number, qty: number): CartItem {
  return {
    key: `k_${unitPrice}_${qty}`,
    goodsId: 'g',
    name: 'g',
    image: '',
    unitPrice,
    qty,
    specText: '',
    specIds: [],
  };
}

const trial = (items: CartItem[], deliveryType: 'delivery' | 'pickup' = 'delivery') =>
  mockResolve<CheckoutTrial>('POST /checkout/trial', { items, deliveryType });

describe('POST /checkout/trial 结算试算', () => {
  it('主链路：红烧肉大份 45 + 酸梅汤 12×2 → 实付 ¥64', async () => {
    const t = await trial([item(4500, 1), item(1200, 2)]);
    expect(t.itemsTotal).toBe(6900);
    expect(t.packFee).toBe(200);
    expect(t.deliveryFee).toBe(300);
    expect(t.couponDiscount).toBe(1000);
    // 69 + 2 + 3 − 10 = 64
    expect(t.payable).toBe(6400);
    expect(t.count).toBe(3);
  });

  it('满 50 命中满减 10，未满则不减', async () => {
    const hit = await trial([item(5000, 1)]);
    expect(hit.couponId).toBe('cp_50_10');
    expect(hit.couponDiscount).toBe(1000);

    const miss = await trial([item(4999, 1)]);
    expect(miss.couponId).toBeNull();
    expect(miss.couponDiscount).toBe(0);
    expect(miss.couponName).toBe('暂无可用优惠券');
  });

  it('自提免配送费，打包费照收', async () => {
    const t = await trial([item(3000, 1)], 'pickup');
    expect(t.deliveryFee).toBe(0);
    expect(t.packFee).toBe(200);
    expect(t.payable).toBe(3200);
    expect(t.etaText).toContain('取餐');
  });

  it('空购物车不收打包费与配送费', async () => {
    const t = await trial([]);
    expect(t.itemsTotal).toBe(0);
    expect(t.packFee).toBe(0);
    expect(t.deliveryFee).toBe(0);
    expect(t.payable).toBe(0);
  });

  it('discountTotal 与 couponDiscount 一致，页面「已优惠」直接取它', async () => {
    const t = await trial([item(6000, 1)]);
    expect(t.discountTotal).toBe(t.couponDiscount);
  });
});

describe('POST /aftersale/trial 退款试算', () => {
  it('部分退款要按实付比例摊掉优惠，不能整额退回', async () => {
    const order = await mockResolve<{ id: string; itemsTotal: number; couponDiscount: number }>(
      'GET /order/detail',
      { id: 'ord_1024' }
    );
    const options = await mockResolve<{ items: { key: string; amount: number; checked: boolean }[] }>(
      'GET /aftersale/options',
      { orderId: 'ord_1024' }
    );

    const picked = options.items.map((i, idx) => ({ ...i, checked: idx === 0 }));
    const t = await mockResolve<RefundTrial>('POST /aftersale/trial', {
      orderId: 'ord_1024',
      items: picked,
    });

    const expectedShare = Math.round((order.couponDiscount * picked[0].amount) / order.itemsTotal);
    expect(t.itemsAmount).toBe(picked[0].amount);
    expect(t.couponShare).toBe(expectedShare);
    expect(t.refundAmount).toBe(picked[0].amount - expectedShare);
    expect(t.refundAmount).toBeLessThan(t.itemsAmount);
  });

  it('一件没选时退款为 0', async () => {
    const options = await mockResolve<{ items: { key: string; checked: boolean }[] }>(
      'GET /aftersale/options',
      { orderId: 'ord_1024' }
    );
    const t = await mockResolve<RefundTrial>('POST /aftersale/trial', {
      orderId: 'ord_1024',
      items: options.items.map((i) => ({ ...i, checked: false })),
    });
    expect(t.refundAmount).toBe(0);
  });
});
