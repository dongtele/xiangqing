import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { AddressFull, PickupStore, PoiItem } from '@/models';

/**
 * 结算态：收货地址 / 自提门店 / 餐具份数。
 * 金额与优惠不放这里——那些每次都由 `/checkout/trial` 服务端试算返回，
 * 落 store 只会多一份会过期的副本。
 * 地图选点（52）选中的 POI 也暂存在这里，供 16 新增地址回填。
 */
export const useCheckoutStore = defineStore('checkout', () => {
  const address = ref<AddressFull | null>(null);
  const pickupStore = ref<PickupStore | null>(null);
  const tableware = ref(2);
  /** 52 选点后回填给 16 的 POI */
  const pickedPoi = ref<PoiItem | null>(null);

  function setAddress(next: AddressFull | null): void {
    address.value = next;
  }

  function setPickupStore(next: PickupStore | null): void {
    pickupStore.value = next;
  }

  function setPoi(next: PoiItem | null): void {
    pickedPoi.value = next;
  }

  return { address, pickupStore, tableware, pickedPoi, setAddress, setPickupStore, setPoi };
});
