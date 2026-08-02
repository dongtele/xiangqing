<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getOnboardIntro } from '@/services/api';
import { chrome } from '@/utils/chrome';
import { back, push } from '@/utils/nav';
import type { OnboardIntro } from '@/models';

/**
 * 26 · 入驻引导：从 07「成为商家 · 0元入驻」进入。
 * 先讲清收益与所需材料再开始填表，降低中途放弃率。
 */
const topPad = ref(100);
const data = ref<OnboardIntro | null>(null);

onLoad(async () => {
  topPad.value = chrome().statusBarHeight + 56;
  data.value = await getOnboardIntro();
});
</script>

<template>
  <view v-if="data" class="oi">
    <view class="oi__hero" :style="{ paddingTop: topPad + 'px' }">
      <view class="oi__back tap-sm" :style="{ top: topPad - 44 + 'px' }" @tap="back()">‹</view>
      <text v-for="l in data.titleLines" :key="l" class="oi__title">{{ l }}</text>
      <text class="oi__sub">{{ data.subText }}</text>
    </view>

    <scroll-view class="oi__body" scroll-y>
      <view class="oi__stats">
        <view v-for="s in data.stats" :key="s.label" class="oi__stat">
          <text class="oi__stat-value">{{ s.value }}</text>
          <text class="oi__stat-label">{{ s.label }}</text>
        </view>
      </view>

      <view class="oi__card">
        <text class="t-section">入驻流程</text>
        <view v-for="s in data.steps" :key="s.no" class="oi__step">
          <view class="oi__step-no">{{ s.no }}</view>
          <view class="flex1 col oi__step-text">
            <text class="oi__step-title">{{ s.title }}</text>
            <text class="oi__step-desc">{{ s.desc }}</text>
          </view>
        </view>
      </view>

      <view class="oi__card">
        <text class="t-section">需要准备</text>
        <view class="oi__prepare">
          <view v-for="p in data.prepare" :key="p" class="oi__prepare-item">
            <wf-icon name="check" :size="26" color="#07C160" :weight="2.6" />
            <text class="oi__prepare-text">{{ p }}</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="oi__foot">
      <view class="btn btn--primary tap" @tap="push('/pages/onboarding/apply/index')">立即入驻</view>
      <text class="oi__agreement">{{ data.agreementText }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.oi {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #ffffff;
}

.oi__hero {
  background: linear-gradient(165deg, #ff7b1c 0%, #ff3d00 90%);
  padding-left: 48rpx;
  padding-right: 48rpx;
  padding-bottom: 72rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  position: relative;
  flex-shrink: 0;
}

.oi__back {
  position: absolute;
  left: 32rpx;
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.2);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
}

.oi__title {
  color: #fff;
  font-size: 52rpx;
  font-weight: 800;
  line-height: 1.35;
}

.oi__sub {
  color: rgba(255, 255, 255, 0.85);
  font-size: 25rpx;
  padding-top: 12rpx;
}

.oi__body {
  flex: 1;
  min-height: 0;
  padding: 40rpx 40rpx 0;
}

.oi__stats {
  display: flex;
  gap: 20rpx;
  margin-bottom: 28rpx;
}

.oi__stat {
  flex: 1;
  background: #faf7f2;
  border-radius: 28rpx;
  padding: 28rpx 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.oi__stat-value {
  font-size: 38rpx;
  font-weight: 800;
  color: var(--c-primary);
}

.oi__stat-label {
  font-size: 21rpx;
  color: var(--c-text-weak);
}

.oi__card {
  border: 1px solid var(--c-img-placeholder);
  border-radius: 32rpx;
  padding: 32rpx;
  display: flex;
  flex-direction: column;
  gap: 28rpx;
  margin-bottom: 28rpx;
}

.oi__step {
  display: flex;
  align-items: flex-start;
  gap: 24rpx;
}

.oi__step-no {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background: var(--c-primary-bg);
  color: var(--c-primary);
  font-size: 22rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.oi__step-text {
  gap: 6rpx;
}

.oi__step-title {
  font-size: 26rpx;
  font-weight: 800;
}

.oi__step-desc {
  font-size: 22rpx;
  color: var(--c-text-weaker);
  line-height: 1.6;
}

.oi__prepare {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx 0;
}

.oi__prepare-item {
  width: 50%;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.oi__prepare-text {
  font-size: 24rpx;
  color: var(--c-text-2);
}

.oi__foot {
  flex-shrink: 0;
  padding: 24rpx 40rpx calc(24rpx + constant(safe-area-inset-bottom));
  padding: 24rpx 40rpx calc(24rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.oi__agreement {
  text-align: center;
  font-size: 21rpx;
  color: var(--c-text-placeholder);
}
</style>
