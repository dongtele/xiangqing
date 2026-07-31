<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getShopProfile } from '@/services/api';
import { chrome } from '@/utils/chrome';
import { back, push, relaunch, toast } from '@/utils/nav';
import type { ShopProfile } from '@/models';

/** 32 · 店铺主页：头图、评分、公告、资质入口 */
const backTop = ref(56);
const profile = ref<ShopProfile | null>(null);

onLoad(async () => {
  backTop.value = chrome().statusBarHeight + 12;
  profile.value = await getShopProfile();
});

function onNavigate(): void {
  if (!profile.value) return;
  toast(`门店导航：${profile.value.addressText}`);
}

function onCall(): void {
  if (!profile.value) return;
  uni.makePhoneCall({ phoneNumber: profile.value.phone, fail: () => toast('拨号已取消') });
}
</script>

<template>
  <view v-if="profile" class="sh">
    <view class="sh__hero">
      <wf-thumb :src="profile.headerImage" :radius="0" />
      <view class="sh__mask" />
      <view class="sh__back tap" :style="{ top: backTop + 'px' }" @tap="back()">
        <text class="sh__back-glyph">‹</text>
      </view>
    </view>

    <scroll-view class="sh__body" scroll-y>
      <view class="card card--lg sh__card">
        <view class="sh__id">
          <view class="sh__logo"><wf-thumb :src="profile.logo" :radius="28" /></view>
          <view class="flex1 col sh__id-text">
            <text class="sh__name">{{ profile.name }}</text>
            <text class="sh__category">{{ profile.categoryText }}</text>
          </view>
          <view class="col sh__score">
            <text class="sh__score-num">{{ profile.score }}</text>
            <text class="sh__score-label">顾客评分</text>
          </view>
        </view>
        <view class="sh__badges">
          <text v-for="b in profile.badges" :key="b.text" class="sh__badge" :class="`sh__badge--${b.tone}`">{{
            b.text
          }}</text>
        </view>
      </view>

      <view class="card sh__notice">
        <text class="sh__notice-tag">公告</text>
        <text class="sh__notice-text">{{ profile.notice }}</text>
      </view>

      <view class="card card--flat">
        <view class="cell">
          <text class="sh__label">营业时间</text>
          <text class="sh__value"
            >{{ profile.hoursText }}
            <text class="sh__open">{{ profile.open ? '营业中' : '休息中' }}</text></text
          >
        </view>
        <view class="cell tap" @tap="onNavigate">
          <text class="sh__label">门店地址</text>
          <text class="sh__value sh__value--primary">{{ profile.addressText }} · 导航 ›</text>
        </view>
        <view class="cell tap" @tap="onCall">
          <text class="sh__label">联系电话</text>
          <text class="sh__value sh__value--primary">{{ profile.phone }} ›</text>
        </view>
        <view class="cell tap" @tap="push('/pages/customer/license/index')">
          <text class="sh__label">证照信息</text>
          <text class="sh__value">{{ profile.licenseText }} ›</text>
        </view>
      </view>

      <view class="card sh__reviews tap" @tap="push('/pages/customer/reviews/index')">
        <view class="col sh__reviews-text">
          <text class="sh__reviews-title">顾客评价（{{ profile.reviewCount }}）</text>
          <text class="sh__reviews-tag">{{ profile.reviewTagText }}</text>
        </view>
        <text class="chevron">›</text>
      </view>

      <view class="sh__foot" />
    </scroll-view>

    <view class="sh__bar">
      <view class="btn btn--primary tap" @tap="relaunch('/pages/customer/menu/index')">进入点餐</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.sh {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sh__hero {
  position: relative;
  height: 380rpx;
  flex-shrink: 0;
  background: var(--c-img-placeholder);
}

.sh__mask {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: linear-gradient(180deg, rgba(32, 22, 15, 0.25), rgba(32, 22, 15, 0.05));
}

.sh__back {
  position: absolute;
  left: 28rpx;
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sh__back-glyph {
  font-size: 36rpx;
  line-height: 1;
  margin-top: -4rpx;
  color: #fff;
}

.sh__body {
  flex: 1;
  min-height: 0;
  padding: 0 32rpx;
  margin-top: -68rpx;
}

.sh__body > .card {
  margin-bottom: 24rpx;
}

.sh__card {
  box-shadow: 0 12rpx 36rpx rgba(32, 22, 15, 0.08);
}

.sh__id {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.sh__logo {
  width: 108rpx;
  height: 108rpx;
  border-radius: 28rpx;
  overflow: hidden;
  flex-shrink: 0;
}

.sh__id-text {
  gap: 6rpx;
}

.sh__name {
  font-size: 34rpx;
  font-weight: 800;
}

.sh__category {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.sh__score {
  align-items: center;
  gap: 2rpx;
}

.sh__score-num {
  font-size: 38rpx;
  font-weight: 800;
  color: var(--c-primary);
}

.sh__score-label {
  font-size: 19rpx;
  color: var(--c-text-weaker);
}

.sh__badges {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
}

.sh__badge {
  font-size: 20rpx;
  font-weight: 700;
  padding: 6rpx 18rpx;
  border-radius: 14rpx;
}

.sh__badge--primary {
  background: var(--c-primary-bg);
  color: var(--c-primary);
}

.sh__badge--success {
  background: var(--c-success-bg-2);
  color: var(--c-success-deep);
}

.sh__badge--grey {
  background: var(--c-fill-3);
  color: #7a7168;
}

.sh__notice {
  flex-direction: row;
  gap: 20rpx;
  align-items: flex-start;
}

.sh__notice-tag {
  background: var(--c-primary-deep);
  color: #fff;
  font-size: 18rpx;
  font-weight: 800;
  padding: 4rpx 12rpx;
  border-radius: 10rpx;
  flex-shrink: 0;
  margin-top: 4rpx;
}

.sh__notice-text {
  flex: 1;
  font-size: 24rpx;
  color: var(--c-text-2);
  line-height: 1.7;
}

.sh__label {
  font-size: 26rpx;
  color: var(--c-text-weak);
}

.sh__value {
  font-size: 26rpx;
  font-weight: 700;
  text-align: right;
}

.sh__value--primary {
  color: var(--c-primary);
}

.sh__open {
  color: var(--c-success-deep);
  font-weight: 800;
}

.sh__reviews {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.sh__reviews-text {
  gap: 4rpx;
}

.sh__reviews-title {
  font-size: 27rpx;
  font-weight: 800;
}

.sh__reviews-tag {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.sh__foot {
  height: 32rpx;
}

.sh__bar {
  flex-shrink: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(28rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(28rpx + env(safe-area-inset-bottom));
}
</style>
