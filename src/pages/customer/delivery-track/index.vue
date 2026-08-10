<script setup lang="ts">
import { computed, ref } from 'vue';
import { onHide, onLoad, onShow, onUnload } from '@dcloudio/uni-app';
import { getDeliveryTrack } from '@/services/api';
import { HAS_MAP } from '@/config';
import { chrome } from '@/utils/chrome';
import { startPoll } from '@/utils/poll';
import { back, push, toast } from '@/utils/nav';
import type { DeliveryTrack } from '@/models';

/**
 * 53 · 配送实时追踪：地图 + 骑手位置 + ETA + 进度。
 * 有腾讯位置服务 key（config.MAP_KEY）时用 <map> 组件渲染真实坐标；
 * 没有 key 时降级为设计稿那套 CSS 示意底图，数据结构与交互完全一致。
 */
const backTop = ref(92);
const track = ref<DeliveryTrack | null>(null);
let orderId = '';
let stopPoll: (() => void) | null = null;

/** 骑手轨迹：虚线折线，用 SVG data URI 画（小程序不支持内联 SVG 标签） */
const routeBg = computed(() => {
  if (!track.value) return '';
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 375 300" fill="none">' +
    `<path d="${track.value.routePath}" stroke="#FF4A17" stroke-width="4" stroke-linecap="round" ` +
    'stroke-dasharray="1 9"/></svg>';
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
});

/** <map> 的标记点：店铺 + 我 */
const markers = computed(() => {
  if (!track.value) return [];
  return [
    {
      id: 1,
      latitude: track.value.shopPoint.latitude,
      longitude: track.value.shopPoint.longitude,
      width: 26,
      height: 26,
      callout: { content: '美味坊', display: 'ALWAYS', padding: 6, borderRadius: 6 },
    },
    {
      id: 2,
      latitude: track.value.userPoint.latitude,
      longitude: track.value.userPoint.longitude,
      width: 26,
      height: 26,
      callout: { content: '我的位置', display: 'ALWAYS', padding: 6, borderRadius: 6 },
    },
  ];
});

const polyline = computed(() => {
  if (!track.value) return [];
  return [
    {
      points: [
        { latitude: track.value.shopPoint.latitude, longitude: track.value.shopPoint.longitude },
        { latitude: track.value.userPoint.latitude, longitude: track.value.userPoint.longitude },
      ],
      color: '#FF4A17',
      width: 5,
      dottedLine: true,
    },
  ];
});

onLoad((options) => {
  orderId = (options && options.id) || '';
  backTop.value = chrome().capsuleBottom + 12;
});

onShow(() => {
  load();
  // 追踪页开启 8s 轮询（交付文档 State Management：5–10s），离开页面必须停止
  stopPoll = startPoll(load, 8000);
});

onHide(stop);
onUnload(stop);

function stop(): void {
  if (stopPoll) {
    stopPoll();
    stopPoll = null;
  }
}

async function load(): Promise<void> {
  const res = await getDeliveryTrack(orderId);
  if (!res) {
    toast('该订单暂无配送信息');
    return;
  }
  track.value = res;
}
</script>

<template>
  <view v-if="track" class="dt">
    <!-- 有 key 走真实地图，无 key 用设计稿的示意底图 -->
    <map
      v-if="HAS_MAP"
      class="dt__map"
      :latitude="track.userPoint.latitude"
      :longitude="track.userPoint.longitude"
      :markers="markers"
      :polyline="polyline"
      :scale="14"
    />
    <view v-else class="dt__map">
      <view class="dt__grid">
        <view class="dt__h" style="top: 18%" />
        <view class="dt__h" style="top: 38%" />
        <view class="dt__h" style="top: 58%" />
        <view class="dt__h" style="top: 78%" />
        <view class="dt__v" style="left: 22%" />
        <view class="dt__v" style="left: 52%" />
        <view class="dt__v" style="left: 80%" />
      </view>

      <view class="dt__route" :style="{ backgroundImage: routeBg }" />

      <view
        class="dt__me"
        :style="{ left: track.userPoint.left + '%', top: track.userPoint.top + '%' }"
      >
        <view class="dt__me-dot" />
      </view>
      <view
        class="dt__shop"
        :style="{ left: track.shopPoint.left + '%', top: track.shopPoint.top + '%' }"
      />
    </view>

    <view class="dt__back tap" :style="{ top: backTop + 'px' }" @tap="back()">
      <text class="dt__back-glyph">‹</text>
    </view>

    <!-- 底部信息卡 -->
    <view class="dt__panel">
      <view class="col dt__eta">
        <text class="dt__eta-title">{{ track.etaText }}</text>
        <text class="dt__eta-sub">{{ track.subText }}</text>
      </view>

      <view class="dt__bar">
        <view class="dt__bar-fill" :style="{ width: track.percent + '%' }" />
      </view>
      <view class="dt__stages">
        <text
          v-for="(stage, index) in track.stages"
          :key="stage"
          class="dt__stage"
          :class="{ 'dt__stage--on': index === track.activeStage }"
          >{{ stage }}</text
        >
      </view>

      <view class="dt__rider">
        <view class="dt__rider-avatar">{{ track.rider.avatarText }}</view>
        <view class="flex1 col dt__rider-text">
          <text class="dt__rider-name">{{ track.rider.titleText }}</text>
          <text class="dt__rider-credit">{{ track.rider.creditText }}</text>
        </view>
        <view class="dt__call tap" @tap="push(`/pages/customer/rider-chat/index?id=${orderId}`)">
          <wf-icon name="phone" :size="34" color="#FFFFFF" :weight="2" />
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.dt {
  height: 100vh;
  position: relative;
  overflow: hidden;
}

/* 地图 / 示意底图 */
.dt__map {
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

.dt__grid {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  opacity: 0.55;
}

.dt__h {
  position: absolute;
  left: 0;
  right: 0;
  height: 4rpx;
  background: #fff;
}

.dt__v {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 4rpx;
  background: #fff;
}

.dt__route {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-repeat: no-repeat;
  background-size: 100% 100%;
}

.dt__me {
  position: absolute;
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: rgba(255, 74, 23, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dt__me-dot {
  width: 22rpx;
  height: 22rpx;
  border-radius: 50%;
  background: var(--c-primary);
  border: 4rpx solid #fff;
}

.dt__shop {
  position: absolute;
  width: 52rpx;
  height: 52rpx;
  border-radius: 50% 50% 50% 4rpx;
  transform: rotate(-45deg);
  background: var(--c-text);
  border: 4rpx solid #fff;
}

.dt__back {
  position: absolute;
  left: 32rpx;
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(32, 22, 15, 0.12);
  z-index: 5;
}

.dt__back-glyph {
  font-size: 38rpx;
  line-height: 1;
  margin-top: -4rpx;
  margin-left: -2rpx;
}

/* 底部面板 */
.dt__panel {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  border-radius: 40rpx 40rpx 0 0;
  padding: 36rpx 32rpx;
  padding-bottom: calc(36rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(36rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 28rpx;
  z-index: 6;
}

.dt__eta {
  gap: 8rpx;
}

.dt__eta-title {
  font-size: 40rpx;
  font-weight: 800;
}

.dt__eta-sub {
  font-size: 25rpx;
  color: var(--c-text-weak);
}

.dt__bar {
  height: 10rpx;
  border-radius: 6rpx;
  background: var(--c-fill-2);
  overflow: hidden;
}

.dt__bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff7b1c, #ff3d00);
  border-radius: 6rpx;
  transition: width 0.4s ease;
}

.dt__stages {
  display: flex;
  justify-content: space-between;
  font-size: 21rpx;
  color: var(--c-text-weaker);
}

.dt__stage--on {
  color: var(--c-primary);
  font-weight: 800;
}

.dt__rider {
  display: flex;
  align-items: center;
  gap: 24rpx;
  background: var(--c-fill);
  border-radius: 28rpx;
  padding: 24rpx 28rpx;
}

.dt__rider-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: var(--c-primary-bg);
  color: var(--c-primary);
  font-size: 30rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dt__rider-text {
  gap: 4rpx;
}

.dt__rider-name {
  font-size: 27rpx;
  font-weight: 800;
}

.dt__rider-credit {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.dt__call {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: var(--c-success);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
</style>
