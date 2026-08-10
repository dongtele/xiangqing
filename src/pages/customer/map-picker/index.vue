<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getPois } from '@/services/api';
import { HAS_MAP } from '@/config';
import { useCheckoutStore } from '@/stores/checkout';
import { chrome } from '@/utils/chrome';
import { back, toast } from '@/utils/nav';
import type { PoiItem } from '@/models';

/**
 * 52 · 地图选点：拖动选点、POI 搜索、门牌号补充。
 * 有腾讯位置服务 key 时用 <map> 组件与真实经纬度；无 key 时用设计稿的示意底图，
 * 候选 POI 与选中结果的数据结构完全一致，接入后页面不用改。
 */
const checkout = useCheckoutStore();

const searchTop = ref(96);
const pois = ref<PoiItem[]>([]);
const pickedId = ref('');

const picked = computed(() => pois.value.find((p) => p.id === pickedId.value) || null);

const routeBg = computed(() => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 375 300" fill="none">' +
    '<path d="M72 200 L72 140 L200 140 L200 80 L266 80" stroke="#FF4A17" stroke-width="4" ' +
    'stroke-linecap="round" stroke-dasharray="1 9"/></svg>';
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
});

onLoad(async () => {
  searchTop.value = chrome().capsuleBottom + 12;
  pois.value = await getPois();
  pickedId.value = pois.value.length ? pois.value[0].id : '';
});

function onConfirm(): void {
  if (!picked.value) {
    toast('请选择一个位置');
    return;
  }
  checkout.setPoi(picked.value);
  back();
}
</script>

<template>
  <view class="mp">
    <map
      v-if="HAS_MAP && picked"
      class="mp__map"
      :latitude="picked.latitude"
      :longitude="picked.longitude"
      :markers="[
        { id: 1, latitude: picked.latitude, longitude: picked.longitude, width: 26, height: 26 },
      ]"
      :scale="16"
    />
    <view v-else class="mp__map">
      <view class="mp__grid">
        <view class="mp__h" style="top: 18%" />
        <view class="mp__h" style="top: 38%" />
        <view class="mp__h" style="top: 58%" />
        <view class="mp__h" style="top: 78%" />
        <view class="mp__v" style="left: 22%" />
        <view class="mp__v" style="left: 52%" />
        <view class="mp__v" style="left: 80%" />
      </view>
      <view class="mp__route" :style="{ backgroundImage: routeBg }" />
      <view class="mp__me"><view class="mp__me-dot" /></view>
      <view class="mp__pin" />
    </view>

    <view class="mp__search" :style="{ top: searchTop + 'px' }">
      <wf-icon name="search" :size="30" color="#A39890" :weight="2" />
      <text class="mp__search-ph">搜索小区 / 写字楼 / 学校</text>
    </view>

    <view class="mp__panel">
      <text class="mp__label">附近地址</text>

      <view
        v-for="p in pois"
        :key="p.id"
        class="mp__poi"
        :class="{ 'mp__poi--on': pickedId === p.id }"
        @tap="pickedId = p.id"
      >
        <view class="mp__dot" :class="{ 'mp__dot--on': pickedId === p.id }" />
        <view class="flex1 col mp__poi-text">
          <text class="mp__poi-name" :class="{ 'mp__poi-name--on': pickedId === p.id }">{{
            p.name
          }}</text>
          <text class="mp__poi-meta">{{ p.districtText }} · {{ p.distanceText }}</text>
        </view>
        <text v-if="pickedId === p.id" class="mp__picked">已选</text>
      </view>

      <view class="btn btn--primary tap" @tap="onConfirm">确定并填写门牌号</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.mp {
  height: 100vh;
  position: relative;
  overflow: hidden;
}

.mp__map {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(150deg, #e9ede6, #dfe5dc);
  overflow: hidden;
}

.mp__grid {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  opacity: 0.55;
}

.mp__h {
  position: absolute;
  left: 0;
  right: 0;
  height: 4rpx;
  background: #fff;
}

.mp__v {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 4rpx;
  background: #fff;
}

.mp__route {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-repeat: no-repeat;
  background-size: 100% 100%;
}

.mp__me {
  position: absolute;
  left: 18%;
  top: 52%;
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: rgba(255, 74, 23, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mp__me-dot {
  width: 22rpx;
  height: 22rpx;
  border-radius: 50%;
  background: var(--c-primary);
  border: 4rpx solid #fff;
}

.mp__pin {
  position: absolute;
  left: 70%;
  top: 26%;
  width: 52rpx;
  height: 52rpx;
  border-radius: 50% 50% 50% 4rpx;
  transform: rotate(-45deg);
  background: var(--c-text);
  border: 4rpx solid #fff;
}

.mp__search {
  position: absolute;
  left: 32rpx;
  right: 32rpx;
  height: 80rpx;
  border-radius: 40rpx;
  background: #fff;
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 0 28rpx;
  box-shadow: 0 8rpx 28rpx rgba(32, 22, 15, 0.12);
  z-index: 5;
}

.mp__search-ph {
  font-size: 26rpx;
  color: var(--c-text-placeholder);
}

.mp__panel {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  border-radius: 40rpx 40rpx 0 0;
  padding: 32rpx;
  padding-bottom: calc(36rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(36rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  z-index: 6;
}

.mp__label {
  font-size: 23rpx;
  color: var(--c-text-weaker);
}

.mp__poi {
  display: flex;
  gap: 20rpx;
  align-items: flex-start;
  padding: 20rpx 24rpx;
  border-radius: 24rpx;
  border: 1px solid transparent;
}

.mp__poi--on {
  background: #fff6f1;
  border-color: var(--c-primary-line);
}

.mp__dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: var(--c-line-5);
  margin-top: 12rpx;
  flex-shrink: 0;
}

.mp__dot--on {
  background: var(--c-primary);
}

.mp__poi-text {
  gap: 4rpx;
}

.mp__poi-name {
  font-size: 27rpx;
  font-weight: 700;
}

.mp__poi-name--on {
  font-weight: 800;
}

.mp__poi-meta {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.mp__picked {
  font-size: 22rpx;
  font-weight: 800;
  color: var(--c-primary);
}
</style>
