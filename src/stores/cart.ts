import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { specUnitPrice } from '@/models';
import type { CartItem, CartState, DeliveryType, Goods, SpecOption } from '@/models';

const STORAGE_KEY = 'wwf_cart';

function specKey(goodsId: string, specIds: string[]): string {
  return `${goodsId}#${[...specIds].sort().join(',')}`;
}

/**
 * 购物车。交付文档 State Management 要求本地持久化、跨页保活、切店铺清空。
 * 这里只算原价合计，优惠一律由 `/checkout/trial` 服务端试算返回。
 */
export const useCartStore = defineStore('cart', () => {
  const shopId = ref('');
  const items = ref<CartItem[]>([]);
  const remark = ref('');
  const deliveryType = ref<DeliveryType>('delivery');

  const cached = uni.getStorageSync(STORAGE_KEY) as CartState | '';
  if (cached && cached.items) {
    shopId.value = cached.shopId;
    items.value = cached.items;
    remark.value = cached.remark;
    deliveryType.value = cached.deliveryType;
  }

  watch(
    [shopId, items, remark, deliveryType],
    () => {
      uni.setStorageSync(STORAGE_KEY, {
        shopId: shopId.value,
        items: JSON.parse(JSON.stringify(items.value)),
        remark: remark.value,
        deliveryType: deliveryType.value,
      } as CartState);
    },
    { deep: true }
  );

  const count = computed(() => items.value.reduce((n, i) => n + i.qty, 0));

  /** 商品小计（分）；优惠不在这里算 */
  const itemsTotal = computed(() => items.value.reduce((n, i) => n + i.unitPrice * i.qty, 0));

  /** 某商品在购物车中的总份数，用于菜单页显示步进器 */
  function qtyOfGoods(goodsId: string): number {
    return items.value.filter((i) => i.goodsId === goodsId).reduce((n, i) => n + i.qty, 0);
  }

  function add(nextShopId: string, goods: Goods, options: SpecOption[], qty = 1): void {
    if (shopId.value && shopId.value !== nextShopId) {
      // 切店铺清空购物车（真实场景需二次确认，见交付文档 State Management）
      items.value = [];
    }
    shopId.value = nextShopId;
    const specIds = options.map((o) => o.id);
    const key = specKey(goods.id, specIds);
    const hit = items.value.find((i) => i.key === key);
    if (hit) {
      hit.qty += qty;
      return;
    }
    items.value.push({
      key,
      goodsId: goods.id,
      name: goods.name,
      image: goods.image,
      unitPrice: specUnitPrice(goods.price, options),
      qty,
      specText: options.map((o) => o.name).join(' / '),
      specIds,
      unit: goods.unit,
    });
  }

  /** 菜单页「－」：从该商品最后一条规格里减 */
  function decreaseByGoods(goodsId: string): void {
    for (let i = items.value.length - 1; i >= 0; i -= 1) {
      if (items.value[i].goodsId === goodsId) {
        items.value[i].qty -= 1;
        if (items.value[i].qty <= 0) items.value.splice(i, 1);
        return;
      }
    }
  }

  function changeQty(key: string, delta: number): void {
    const idx = items.value.findIndex((i) => i.key === key);
    if (idx < 0) return;
    items.value[idx].qty += delta;
    if (items.value[idx].qty <= 0) items.value.splice(idx, 1);
  }

  function setDeliveryType(next: DeliveryType): void {
    deliveryType.value = next;
  }

  function setRemark(next: string): void {
    remark.value = next;
  }

  function clear(): void {
    items.value = [];
    remark.value = '';
  }

  /** 提交给接口的纯对象快照（脱离响应式代理） */
  function snapshot(): CartItem[] {
    return JSON.parse(JSON.stringify(items.value)) as CartItem[];
  }

  return {
    shopId,
    items,
    remark,
    deliveryType,
    count,
    itemsTotal,
    qtyOfGoods,
    add,
    decreaseByGoods,
    changeQty,
    setDeliveryType,
    setRemark,
    clear,
    snapshot,
  };
});
