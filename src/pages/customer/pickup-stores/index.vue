<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getPickupStores } from '@/services/api';
import { HAS_MAP } from '@/config';
import { useCheckoutStore } from '@/stores/checkout';
import { back, toast } from '@/utils/nav';
import type { PickupStore } from '@/models';

/** 83 · 选择自提门店：门店列表 + 距离 + 营业状态（休息中不可选） */
const checkout = useCheckoutStore();

const stores = ref<PickupStore[]>([]);
const pickedId = ref('');

onLoad(async () => {
  stores.value = await getPickupStores();
  const preset = checkout.pickupStore || stores.value.find((s) => s.open);
  pickedId.value = preset ? preset.id : '';
});

function onPick(s: PickupStore): void {
  if (!s.open) {
    toast('该门店休息中，暂不可选');
    return;
  }
  pickedId.value = s.id;
}

function onConfirm(): void {
  const hit = stores.value.find((s) => s.id === pickedId.value);
  if (!hit) {
    toast('请选择自提门店');
    return;
  }
  checkout.setPickupStore(hit);
  back();
}
</script>

<template>
  <view class="ps">
    <wf-nav-bar title="选择自提门店" />

    <scroll-view class="ps__body" scroll-y>
      <map
        v-if="HAS_MAP && stores.length"
        class="ps__map"
        :latitude="stores[0].latitude"
        :longitude="stores[0].longitude"
        :markers="
          stores.map((s, i) => ({
            id: i + 1,
            latitude: s.latitude,
            longitude: s.longitude,
            width: 24,
            height: 24,
          }))
        "
        :scale="12"
      />
      <view v-else class="ps__map">
        <view class="ps__grid">
          <view class="ps__h" style="top: 32%" />
          <view class="ps__h" style="top: 68%" />
          <view class="ps__v" style="left: 38%" />
          <view class="ps__v" style="left: 72%" />
        </view>
        <view class="ps__pin ps__pin--me" />
        <view class="ps__pin ps__pin--shop" />
      </view>

      <view class="ps__search">
        <wf-icon name="search" :size="30" color="#A39890" :weight="2" />
        <text class="ps__search-ph">搜索门店名或地址</text>
      </view>

      <view
        v-for="s in stores"
        :key="s.id"
        class="card ps__store"
        :class="{ 'ps__store--on': pickedId === s.id, 'ps__store--off': !s.open }"
        @tap="onPick(s)"
      >
        <view class="row ps__store-head">
          <text class="ps__name">{{ s.name }}</text>
          <text class="ps__state" :class="s.open ? 'ps__state--open' : 'ps__state--closed'">{{
            s.open ? '营业中' : '休息中'
          }}</text>
          <text v-if="pickedId === s.id" class="ps__picked">已选</text>
        </view>
        <text class="ps__addr">{{ s.addressText }}</text>
        <view class="ps__foot-row">
          <text class="ps__eta">{{ s.open ? `${s.etaText} · ${s.hoursText}` : s.etaText }}</text>
          <text v-if="s.open" class="ps__nav tap" @tap.stop="toast(`门店导航：${s.name}`)"
            >导航 ›</text
          >
          <text v-else class="ps__disabled">不可选</text>
        </view>
      </view>

      <view class="ps__gap" />
    </scroll-view>

    <view class="ps__bar">
      <view class="btn btn--primary tap" @tap="onConfirm">确定，去点餐</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.ps {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ps__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx 0;
}

.ps__map {
  height: 264rpx;
  width: 100%;
  border-radius: 32rpx;
  background: linear-gradient(150deg, #e9ede6, #dfe5dc);
  position: relative;
  overflow: hidden;
  margin-bottom: 20rpx;
}

.ps__grid {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  opacity: 0.55;
}

.ps__h {
  position: absolute;
  left: 0;
  right: 0;
  height: 4rpx;
  background: #fff;
}

.ps__v {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 4rpx;
  background: #fff;
}

.ps__pin {
  position: absolute;
  border-radius: 50% 50% 50% 4rpx;
  transform: rotate(-45deg);
  border: 4rpx solid #fff;
}

.ps__pin--me {
  left: 34%;
  top: 52%;
  width: 48rpx;
  height: 48rpx;
  background: var(--c-primary);
}

.ps__pin--shop {
  left: 66%;
  top: 28%;
  width: 40rpx;
  height: 40rpx;
  background: var(--c-text);
}

.ps__search {
  height: 80rpx;
  border-radius: 40rpx;
  background: #fff;
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 0 28rpx;
  margin-bottom: 20rpx;
}

.ps__search-ph {
  font-size: 26rpx;
  color: var(--c-text-placeholder);
}

.ps__store {
  margin-bottom: 20rpx;
  border: 3rpx solid transparent;
  gap: 16rpx;
}

.ps__store--on {
  border-color: var(--c-primary);
}

.ps__store--off {
  opacity: 0.66;
}

.ps__store-head {
  gap: 16rpx;
}

.ps__name {
  font-size: 28rpx;
  font-weight: 800;
}

.ps__state {
  font-size: 20rpx;
  font-weight: 700;
  padding: 4rpx 14rpx;
  border-radius: 10rpx;
}

.ps__state--open {
  color: var(--c-success);
  background: var(--c-success-bg);
}

.ps__state--closed {
  color: var(--c-text-weak);
  background: var(--c-fill-2);
}

.ps__picked {
  font-size: 22rpx;
  font-weight: 800;
  color: var(--c-primary);
  margin-left: auto;
}

.ps__addr {
  font-size: 23rpx;
  color: var(--c-text-weaker);
}

.ps__foot-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16rpx;
  border-top: 1px solid var(--c-line);
}

.ps__eta {
  font-size: 23rpx;
  color: var(--c-text-3);
}

.ps__nav {
  font-size: 23rpx;
  font-weight: 800;
  color: var(--c-primary);
}

.ps__disabled {
  font-size: 23rpx;
  font-weight: 700;
  color: var(--c-text-placeholder);
}

.ps__gap {
  height: 32rpx;
}

.ps__bar {
  flex-shrink: 0;
  background: #fff;
  border-top: 1px solid var(--c-img-placeholder);
  padding: 24rpx 32rpx;
  padding-bottom: calc(28rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(28rpx + env(safe-area-inset-bottom));
}
</style>
