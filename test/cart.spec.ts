import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useCartStore } from '@/stores/cart';
import { resetUniStorage } from './setup';
import type { Goods, SpecOption } from '@/models';

const SHOP = 'shop_1';

function goods(id: string, price: number, name = id): Goods {
  return {
    id,
    categoryId: 'c1',
    name,
    desc: '',
    image: '',
    price,
    monthSold: 0,
    praiseRate: 0,
    stock: 99,
    onSale: true,
    specGroups: [],
  };
}

const large: SpecOption = { id: 'o_large', name: '大份', priceDelta: 1700 };
const small: SpecOption = { id: 'o_small', name: '小份', priceDelta: 0 };
const spicy: SpecOption = { id: 'o_spicy', name: '微辣', priceDelta: 0 };

describe('stores/cart', () => {
  beforeEach(() => {
    resetUniStorage();
    setActivePinia(createPinia());
  });

  it('单价 = 基础价 + 规格加价', () => {
    const cart = useCartStore();
    cart.add(SHOP, goods('g1', 2800, '招牌红烧肉套餐'), [large]);
    expect(cart.items[0].unitPrice).toBe(4500);
    expect(cart.itemsTotal).toBe(4500);
  });

  it('同规格合并成一条并累加份数，不同规格各占一条', () => {
    const cart = useCartStore();
    const g = goods('g1', 2800);
    cart.add(SHOP, g, [large]);
    cart.add(SHOP, g, [large]);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].qty).toBe(2);

    cart.add(SHOP, g, [small]);
    expect(cart.items).toHaveLength(2);
    expect(cart.qtyOfGoods('g1')).toBe(3);
  });

  it('规格顺序不影响合并（key 排序后再拼）', () => {
    const cart = useCartStore();
    const g = goods('g1', 2800);
    cart.add(SHOP, g, [large, spicy]);
    cart.add(SHOP, g, [spicy, large]);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].qty).toBe(2);
  });

  it('减到 0 就移除该条', () => {
    const cart = useCartStore();
    cart.add(SHOP, goods('g1', 2800), [large]);
    cart.changeQty(cart.items[0].key, -1);
    expect(cart.items).toHaveLength(0);
    expect(cart.itemsTotal).toBe(0);
  });

  it('菜单页的「－」从该商品最后一条规格里减', () => {
    const cart = useCartStore();
    const g = goods('g1', 2800);
    cart.add(SHOP, g, [large]);
    cart.add(SHOP, g, [small]);
    cart.decreaseByGoods('g1');
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].specText).toBe('大份');
  });

  it('切店铺清空购物车', () => {
    const cart = useCartStore();
    cart.add(SHOP, goods('g1', 2800), [large]);
    cart.add('shop_2', goods('g9', 1000), [small]);
    expect(cart.shopId).toBe('shop_2');
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].goodsId).toBe('g9');
  });

  it('主链路的购物车合计 = 红烧肉大份 45 + 酸梅汤 12×2 = 69 元', () => {
    const cart = useCartStore();
    cart.add(SHOP, goods('g1', 2800, '招牌红烧肉套餐'), [large]);
    cart.add(SHOP, goods('g5', 1200, '冰镇酸梅汤'), [], 2);
    expect(cart.count).toBe(3);
    expect(cart.itemsTotal).toBe(6900);
  });

  it('clear 清空商品与备注，但保留店铺与配送方式', () => {
    const cart = useCartStore();
    cart.add(SHOP, goods('g1', 2800), [large]);
    cart.setRemark('不要葱');
    cart.setDeliveryType('pickup');
    cart.clear();
    expect(cart.items).toHaveLength(0);
    expect(cart.remark).toBe('');
    expect(cart.shopId).toBe(SHOP);
    expect(cart.deliveryType).toBe('pickup');
  });

  it('snapshot 返回脱离响应式的纯对象，改它不影响 store', () => {
    const cart = useCartStore();
    cart.add(SHOP, goods('g1', 2800), [large]);
    const snap = cart.snapshot();
    snap[0].qty = 99;
    expect(cart.items[0].qty).toBe(1);
  });
});
