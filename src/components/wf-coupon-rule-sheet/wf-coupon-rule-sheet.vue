<script setup lang="ts">
import { ref, watch } from 'vue';
import { getCouponRule } from '@/services/api';
import type { Coupon, CouponRule } from '@/models';

/**
 * 59 · 优惠券使用规则。
 * 设计稿把它画成盖在 39 券列表上的半屏浮层（顶部仍能看到列表），
 * 所以做成组件挂在 coupons 页里，而不是独立路由 —— 独立页会丢掉这层关系。
 */
const props = defineProps<{ show: boolean; coupon: Coupon | null }>();
const emit = defineEmits<{ (e: 'close'): void; (e: 'use', coupon: Coupon): void }>();

const rule = ref<CouponRule | null>(null);

watch(
  () => [props.show, props.coupon && props.coupon.id],
  async () => {
    if (!props.show || !props.coupon) return;
    rule.value = await getCouponRule(props.coupon.id);
  },
  { immediate: true }
);

function onUse(): void {
  if (props.coupon) emit('use', props.coupon);
}
</script>

<template>
  <view v-if="show" class="crs">
    <view class="crs__mask" @tap="emit('close')" />

    <view class="crs__panel">
      <view class="crs__head">
        <text class="crs__title">使用规则</text>
        <text class="crs__close tap-sm" @tap="emit('close')">✕</text>
      </view>

      <scroll-view class="crs__body" scroll-y>
        <view v-if="coupon" class="crs__card">
          <view class="crs__face" :class="`crs__face--${coupon.tone}`">
            <text class="crs__amount"
              ><text class="crs__yuan">￥</text>{{ coupon.amountText }}</text
            >
            <text class="crs__threshold">{{ coupon.thresholdText }}</text>
          </view>
          <view class="crs__meta">
            <text class="crs__name">{{ coupon.name }}</text>
            <text class="crs__range">{{ rule ? rule.rangeText : coupon.validText }}</text>
          </view>
        </view>

        <view v-if="rule" class="card card--flat crs__rows">
          <view v-for="r in rule.rows" :key="r.label" class="cell">
            <text class="cell__label">{{ r.label }}</text>
            <text class="cell__value">{{ r.value }}</text>
          </view>
        </view>

        <view v-if="rule" class="crs__terms">
          <text v-for="(t, i) in rule.terms" :key="i" class="crs__term">{{ i + 1 }}. {{ t }}</text>
        </view>
      </scroll-view>

      <view class="crs__foot">
        <view class="btn btn--primary tap" @tap="onUse">去使用</view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.crs {
  position: fixed;
  inset: 0;
  z-index: 60;
}

.crs__mask {
  position: absolute;
  inset: 0;
  background: rgba(32, 22, 15, 0.45);
}

.crs__panel {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 70%;
  background: var(--c-bg);
  border-radius: 44rpx 44rpx 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.crs__head {
  padding: 32rpx 36rpx 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.crs__title {
  font-size: 32rpx;
  font-weight: 800;
}

.crs__close {
  font-size: 32rpx;
  color: var(--c-text-placeholder);
}

.crs__body {
  flex: 1;
  min-height: 0;
  padding: 0 32rpx;
}

.crs__card {
  background: #fff;
  border-radius: 32rpx;
  overflow: hidden;
  display: flex;
  margin-bottom: 20rpx;
}

.crs__face {
  width: 200rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  color: #fff;
  flex-shrink: 0;
}

.crs__face--main {
  background: var(--grad-main);
}

.crs__face--light {
  background: linear-gradient(135deg, #ffb08f, #ff8a5c);
}

.crs__face--green {
  background: linear-gradient(135deg, #7bc96f, #3fa85f);
}

.crs__face--grey {
  background: #d8cfc5;
}

.crs__amount {
  font-size: 56rpx;
  font-weight: 800;
  line-height: 1.1;
}

.crs__yuan {
  font-size: 24rpx;
  font-weight: 700;
}

.crs__threshold {
  font-size: 21rpx;
  opacity: 0.9;
}

.crs__meta {
  flex: 1;
  padding: 28rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8rpx;
}

.crs__name {
  font-size: 28rpx;
  font-weight: 800;
}

.crs__range {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.crs__rows {
  margin-bottom: 20rpx;
}

.crs__terms {
  background: #fff;
  border-radius: 28rpx;
  padding: 24rpx 28rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.crs__term {
  font-size: 23rpx;
  color: var(--c-text-weak);
  line-height: 1.8;
}

.crs__foot {
  padding: 20rpx 32rpx calc(24rpx + constant(safe-area-inset-bottom));
  padding: 20rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
  flex-shrink: 0;
}
</style>
