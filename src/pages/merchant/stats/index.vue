<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getBusinessStats } from '@/services/api';
import { push, toast } from '@/utils/nav';
import type { BusinessStats } from '@/models';

/** 46 · 营业数据：今日概览 + 近 7 日趋势 + 热销 TOP 3，从 08 工作台的时间范围进入 */
const data = ref<BusinessStats | null>(null);

onLoad(() => {
  load();
});

async function load(): Promise<void> {
  data.value = await getBusinessStats();
}
</script>

<template>
  <view v-if="data" class="bs">
    <wf-nav-bar title="营业数据" :right="data.monthText" @righttap="toast('选择月份接后端后开放')" />

    <scroll-view class="bs__body" scroll-y>
      <view class="card">
        <view class="bs__today">
          <view class="col bs__today-main">
            <text class="bs__today-label">今日营业额</text>
            <text class="bs__today-value">￥{{ data.todayAmountText }}</text>
          </view>
          <text class="bs__today-delta">{{ data.todayDeltaText }}</text>
        </view>
        <view class="bs__metrics">
          <view v-for="m in data.metrics" :key="m.label" class="bs__metric">
            <text class="bs__metric-value">{{ m.value }}</text>
            <text class="bs__metric-label">{{ m.label }}</text>
          </view>
        </view>
      </view>

      <view class="card">
        <text class="t-section">近 7 日营业额</text>
        <wf-bar-chart :bars="data.trend" :height="224" />
      </view>

      <view class="card">
        <view class="row--between">
          <text class="t-section">热销 TOP 3</text>
          <text class="bs__more tap-sm" @tap="push('/pages/merchant/stats-goods/index')">按销量 ›</text>
        </view>
        <view v-for="h in data.hot" :key="h.rank" class="bs__hot">
          <text class="bs__hot-rank" :class="`bs__hot-rank--${h.rank}`">{{ h.rank }}</text>
          <text class="bs__hot-name flex1">{{ h.name }}</text>
          <text class="bs__hot-count">{{ h.countText }}</text>
          <text class="bs__hot-amount">{{ h.amountText }}</text>
        </view>
      </view>

      <view class="card card--flat">
        <view class="cell tap" @tap="push('/pages/merchant/stats-customer/index')">
          <text class="cell__label">顾客与复购分析</text>
          <view class="cell__value"><text>复购率 38.6%</text><text class="chevron">›</text></view>
        </view>
        <view class="cell tap" @tap="push('/pages/merchant/settlement/index')">
          <text class="cell__label">货款结算</text>
          <view class="cell__value"><text>查看余额与流水</text><text class="chevron">›</text></view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.bs {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.bs__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx calc(40rpx + constant(safe-area-inset-bottom));
  padding: 20rpx 32rpx calc(40rpx + env(safe-area-inset-bottom));
}

.bs__body > .card {
  margin-bottom: 20rpx;
}

.bs__today {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.bs__today-main {
  gap: 8rpx;
}

.bs__today-label {
  font-size: 23rpx;
  color: var(--c-text-weak);
}

.bs__today-value {
  font-size: 64rpx;
  font-weight: 800;
  color: var(--c-primary);
  line-height: 1;
}

.bs__today-delta {
  font-size: 23rpx;
  font-weight: 700;
  color: var(--c-success);
}

.bs__metrics {
  display: flex;
  padding-top: 12rpx;
}

.bs__metric {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
}

.bs__metric-value {
  font-size: 34rpx;
  font-weight: 800;
}

.bs__metric-label {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.bs__more {
  font-size: 23rpx;
  color: var(--c-text-weaker);
}

.bs__hot {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.bs__hot-rank {
  width: 40rpx;
  height: 40rpx;
  border-radius: 12rpx;
  color: #fff;
  font-size: 22rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffb08f;
  flex-shrink: 0;
}

.bs__hot-rank--1 {
  background: #ff3800;
}

.bs__hot-rank--2 {
  background: #ff7b1c;
}

.bs__hot-name {
  font-size: 26rpx;
  font-weight: 700;
}

.bs__hot-count {
  font-size: 23rpx;
  color: var(--c-text-weaker);
}

.bs__hot-amount {
  font-size: 25rpx;
  font-weight: 800;
  width: 130rpx;
  text-align: right;
}
</style>
