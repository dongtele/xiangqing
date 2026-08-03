<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getCustomerAnalysis } from '@/services/api';
import { push, toast } from '@/utils/nav';
import type { CustomerAnalysis } from '@/models';

/** 89 · 顾客与复购分析：四指标 + 下单次数分布 + 高价值顾客发券 */
const data = ref<CustomerAnalysis | null>(null);

onLoad(async () => {
  data.value = await getCustomerAnalysis();
});

/** 给回头客发券直接进 95 创建优惠券，带上「仅新客」关掉的意图 */
function onSendCoupon(name: string): void {
  toast(`为 ${name} 发券`);
  push('/pages/merchant/coupon-edit/index');
}
</script>

<template>
  <view v-if="data" class="ca">
    <wf-nav-bar title="顾客分析" />

    <scroll-view class="ca__body" scroll-y>
      <view class="card ca__metrics">
        <view v-for="m in data.metrics" :key="m.label" class="ca__metric">
          <text class="ca__metric-label">{{ m.label }}</text>
          <text class="ca__metric-value">{{ m.value }}</text>
          <text class="ca__metric-delta" :class="`ca__metric-delta--${m.deltaTone}`">{{
            m.delta
          }}</text>
        </view>
      </view>

      <view class="card">
        <text class="t-section">下单次数分布</text>
        <wf-bar-chart :bars="data.distribution" :height="192" show-value />
      </view>

      <view class="card">
        <text class="t-section">高价值顾客</text>
        <view v-for="(v, i) in data.vips" :key="v.id" class="col">
          <view v-if="i" class="hairline ca__line" />
          <view class="ca__vip">
            <view class="ca__vip-avatar">{{ v.name.slice(0, 1) }}</view>
            <view class="flex1 col ca__vip-text">
              <text class="ca__vip-name">{{ v.name }}</text>
              <text class="ca__vip-sub">{{ v.sub }}</text>
            </view>
            <view class="pill pill--outline-primary tap" @tap="onSendCoupon(v.name)">发券</view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.ca {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ca__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx calc(40rpx + constant(safe-area-inset-bottom));
  padding: 20rpx 32rpx calc(40rpx + env(safe-area-inset-bottom));
}

.card {
  margin-bottom: 20rpx;
}

.ca__metrics {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 32rpx 0;
}

.ca__metric {
  width: 50%;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.ca__metric-label {
  font-size: 21rpx;
  color: var(--c-text-weaker);
}

.ca__metric-value {
  font-size: 44rpx;
  font-weight: 800;
  line-height: 1.1;
}

.ca__metric-delta {
  font-size: 21rpx;
  font-weight: 700;
}

.ca__metric-delta--up {
  color: var(--c-success);
}

.ca__metric-delta--down {
  color: var(--c-danger);
}

.ca__metric-delta--flat {
  color: var(--c-text-weaker);
}

.ca__line {
  margin-bottom: 20rpx;
}

.ca__vip {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.ca__vip-avatar {
  width: 68rpx;
  height: 68rpx;
  border-radius: 50%;
  background: var(--c-primary-bg);
  color: var(--c-primary);
  font-size: 26rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ca__vip-text {
  gap: 4rpx;
}

.ca__vip-name {
  font-size: 26rpx;
  font-weight: 700;
}

.ca__vip-sub {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}
</style>
