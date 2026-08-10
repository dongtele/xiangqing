import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { AftersaleItem, AftersaleType } from '@/models';

/**
 * 售后申请的跨页草稿（20 申请售后 ⇄ 56 选择退款商品）。
 * 不做持久化：离开流程即失效。
 */
export const useAftersaleStore = defineStore('aftersale', () => {
  const orderId = ref('');
  const type = ref<AftersaleType>('refundOnly');
  const reason = ref('');
  const desc = ref('');
  const photos = ref<string[]>([]);
  const items = ref<AftersaleItem[]>([]);

  const checkedItems = computed(() => items.value.filter((i) => i.checked));

  function start(nextOrderId: string, nextItems: AftersaleItem[]): void {
    orderId.value = nextOrderId;
    items.value = nextItems;
    type.value = 'refundOnly';
    reason.value = '';
    desc.value = '';
    photos.value = [];
  }

  /** 只在同一订单内复用草稿 */
  function isFor(nextOrderId: string): boolean {
    return orderId.value === nextOrderId && items.value.length > 0;
  }

  function toggleItem(key: string): void {
    items.value = items.value.map((i) => (i.key === key ? { ...i, checked: !i.checked } : i));
  }

  function reset(): void {
    orderId.value = '';
    items.value = [];
    reason.value = '';
    desc.value = '';
    photos.value = [];
  }

  return { orderId, type, reason, desc, photos, items, checkedItems, start, isFor, toggleItem, reset };
});
