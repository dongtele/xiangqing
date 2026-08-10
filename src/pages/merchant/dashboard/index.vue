<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getDashboard } from '@/services/api';
import { chrome } from '@/utils/chrome';
import { push, relaunch } from '@/utils/nav';
import type { Dashboard } from '@/models';

const RANK_COLORS = ['#FF3800', '#FF7B1C', '#FFB08F'];

/** 08 · 工作台：今日概览、待处理、近 7 天趋势、热销榜 */
const topPad = ref(96);
const dash = ref<Dashboard | null>(null);

const hotRows = computed(() =>
  dash.value
    ? dash.value.hot.map((h) => ({ ...h, color: RANK_COLORS[h.rank - 1] || '#FFB08F' }))
    : []
);

onLoad(() => {
  topPad.value = chrome().capsuleBottom + 16;
});

onShow(async () => {
  dash.value = await getDashboard();
});
</script>

<template>
  <view class="dash">
    <scroll-view class="dash__scroll" scroll-y>
      <view v-if="dash" class="dash__inner" :style="{ paddingTop: topPad + 'px' }">
        <!-- 店铺 + 营业状态 -->
        <view class="dash__top">
          <view class="col dash__shop">
            <text class="dash__shop-name">{{ dash.shopName }}</text>
            <text class="dash__shop-meta">{{ dash.scoreText }}</text>
          </view>
          <view class="row dash__top-ops">
            <view class="dash__open" :class="{ 'dash__open--off': !dash.open }">
              <view class="dash__open-dot" />
              <text>{{ dash.open ? '营业中' : '休息中' }}</text>
            </view>
            <!-- 45 商家消息中心：新单 / 退款 / 差评 / 结算提醒的收口 -->
            <view class="dash__bell tap-sm" @tap="push('/pages/merchant/messages/index')">
              <wf-icon name="chat" :size="34" color="#FF4A17" :weight="1.9" />
            </view>
          </view>
        </view>

        <!-- 待处理：置顶直达订单管理 -->
        <view class="dash__todo tap" @tap="relaunch('/pages/merchant/orders/index')">
          <template v-for="(t, index) in dash.todos" :key="t.label">
            <view v-if="index > 0" class="dash__todo-div" />
            <view class="dash__todo-item">
              <text class="dash__todo-num" :class="{ 'dash__todo-num--hot': t.highlight }">{{
                t.value
              }}</text>
              <text class="dash__todo-label">{{ t.label }}</text>
            </view>
          </template>
          <text class="dash__todo-arrow">›</text>
        </view>

        <!-- 今日实时 -->
        <view class="card card--lg">
          <view class="row--between">
            <text class="t-section">今日实时</text>
            <text class="dash__range tap" @tap="push('/pages/merchant/stats/index')">今日 ▾</text>
          </view>
          <view class="dash__metrics">
            <view v-for="m in dash.metrics" :key="m.label" class="dash__metric">
              <text class="dash__metric-label">{{ m.label }}</text>
              <text class="dash__metric-value">{{ m.value }}</text>
              <text class="dash__metric-delta" :class="`dash__metric-delta--${m.deltaTone}`">{{
                m.delta
              }}</text>
            </view>
          </view>
        </view>

        <!-- 近 7 天营业额 -->
        <view class="card card--lg">
          <text class="t-section">近7天营业额</text>
          <wf-bar-chart :bars="dash.trend" :height="184" />
        </view>

        <!-- 今日热销 -->
        <view class="card card--lg tap" @tap="push('/pages/merchant/stats-goods/index')">
          <text class="t-section">今日热销</text>
          <view v-for="h in hotRows" :key="h.rank" class="dash__hot">
            <text class="dash__hot-rank" :style="{ background: h.color }">{{ h.rank }}</text>
            <text class="dash__hot-name">{{ h.name }}</text>
            <text class="dash__hot-count">{{ h.countText }}</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <wf-tab-bar role="merchant" active="dashboard" />
  </view>
</template>

<style lang="scss" scoped>
.dash {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dash__scroll {
  flex: 1;
  min-height: 0;
}

.dash__inner {
  padding: 0 32rpx calc(200rpx + constant(safe-area-inset-bottom));
  padding: 0 32rpx calc(200rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 28rpx;
}

.dash__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dash__shop {
  gap: 6rpx;
}

.dash__shop-name {
  font-size: 40rpx;
  font-weight: 800;
}

.dash__shop-meta {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.dash__top-ops {
  gap: 20rpx;
}

.dash__bell {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: var(--c-primary-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dash__open {
  display: flex;
  align-items: center;
  gap: 12rpx;
  background: var(--c-success-bg-2);
  border: 1px solid #b7ebd3;
  padding: 12rpx 24rpx;
  border-radius: 32rpx;
  font-size: 24rpx;
  font-weight: 800;
  color: var(--c-success-deep);
}

.dash__open--off {
  background: var(--c-fill-2);
  border-color: var(--c-line-4);
  color: var(--c-text-weak);
}

.dash__open-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: var(--c-success-2);
}

.dash__open--off .dash__open-dot {
  background: var(--c-text-placeholder);
}

/* 待处理 */
.dash__todo {
  background: linear-gradient(120deg, #fff3ea, #ffe8d8);
  border: 1px solid var(--c-primary-line);
  border-radius: 36rpx;
  padding: 28rpx 32rpx;
  display: flex;
  align-items: center;
}

.dash__todo-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.dash__todo-num {
  font-size: 44rpx;
  font-weight: 800;
}

.dash__todo-num--hot {
  color: var(--c-primary-deep);
}

.dash__todo-label {
  font-size: 22rpx;
  color: var(--c-warn-text-2);
  font-weight: 600;
}

.dash__todo-div {
  width: 1px;
  height: 52rpx;
  background: #f0d9c4;
}

.dash__todo-arrow {
  color: var(--c-primary);
  font-size: 30rpx;
  font-weight: 700;
  padding-left: 8rpx;
}

/* 今日实时 */
.dash__range {
  font-size: 22rpx;
  color: var(--c-text-weaker);
  background: var(--c-fill-3);
  padding: 8rpx 20rpx;
  border-radius: 22rpx;
}

.dash__metrics {
  display: flex;
  flex-wrap: wrap;
}

.dash__metric {
  width: 50%;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  padding-bottom: 20rpx;
}

.dash__metric-label {
  font-size: 21rpx;
  color: var(--c-text-weaker);
}

.dash__metric-value {
  font-size: 42rpx;
  font-weight: 800;
  letter-spacing: -1rpx;
}

.dash__metric-delta {
  font-size: 20rpx;
}

.dash__metric-delta--up {
  color: var(--c-success-deep);
  font-weight: 700;
}

.dash__metric-delta--flat {
  color: var(--c-text-weaker);
}

/* 趋势柱 */
.dash__chart {
  display: flex;
  align-items: flex-end;
  gap: 20rpx;
  height: 184rpx;
  padding: 0 8rpx;
}

.dash__bar-col {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 10rpx;
}

.dash__bar {
  width: 100%;
  border-radius: 12rpx 12rpx 6rpx 6rpx;
  background: var(--c-primary-line);
}

.dash__bar--mid {
  background: #ffb08f;
}

.dash__bar--today {
  background: linear-gradient(180deg, #ff7b1c, #ff3d00);
}

.dash__bar-label {
  font-size: 18rpx;
  color: var(--c-text-placeholder);
}

.dash__bar-label--today {
  color: var(--c-primary);
  font-weight: 800;
}

/* 热销 */
.dash__hot {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.dash__hot-rank {
  width: 40rpx;
  height: 40rpx;
  border-radius: 12rpx;
  color: #fff;
  font-size: 22rpx;
  font-weight: 800;
  text-align: center;
  line-height: 40rpx;
  flex-shrink: 0;
}

.dash__hot-name {
  flex: 1;
  min-width: 0;
  font-size: 25rpx;
  font-weight: 700;
}

.dash__hot-count {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}
</style>
