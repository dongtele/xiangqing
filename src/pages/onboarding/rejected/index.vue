<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getOnboardAudit, resubmitOnboard } from '@/services/api';
import { push, replace, toast } from '@/utils/nav';
import type { OnboardAudit } from '@/models';

/**
 * 28 · 审核驳回 · 修改重交。
 * 不让商家重填全部：逐项列出原因并直达对应修改处，已通过项保留。
 */
const data = ref<OnboardAudit | null>(null);

onLoad(async () => {
  data.value = await getOnboardAudit('rejected');
});

/** 资质类问题回 27，资料类问题回 14 */
function onFix(key: string): void {
  push(key === 'address' ? '/pages/onboarding/apply/index' : '/pages/onboarding/license/index');
}

async function onResubmit(): Promise<void> {
  const res = await resubmitOnboard();
  toast(res.message);
  if (res.ok) setTimeout(() => replace('/pages/onboarding/audit/index'), 700);
}
</script>

<template>
  <view v-if="data" class="or">
    <wf-nav-bar title="审核结果" />

    <scroll-view class="or__body" scroll-y>
      <view class="or__hero">
        <view class="or__icon">
          <wf-icon name="warn" :size="56" color="#D14343" :weight="2" />
        </view>
        <text class="or__title">{{ data.statusTitle }}</text>
        <text class="or__sub">{{ data.statusSub }}</text>
      </view>

      <view class="card">
        <text class="t-section">需要修改的问题（{{ data.rejects.length }} 项）</text>
        <view v-for="r in data.rejects" :key="r.key" class="or__item tap" @tap="onFix(r.key)">
          <text class="tag tag--danger or__kind">{{ r.kindText }}</text>
          <view class="flex1 col or__item-text">
            <text class="or__item-title">{{ r.title }}</text>
            <text class="or__item-desc">{{ r.desc }}</text>
          </view>
          <text class="or__fix">去修改 ›</text>
        </view>
      </view>

      <view class="or__note">{{ data.passedText }}</view>
    </scroll-view>

    <view class="or__foot">
      <view class="btn btn--ghost tap" @tap="push('/pages/customer/support/index')">联系客服</view>
      <view class="btn btn--primary tap" @tap="onResubmit">修改并重新提交</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.or {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.or__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx 0;
}

.card {
  margin-bottom: 20rpx;
}

.or__hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  padding: 40rpx 32rpx 48rpx;
}

.or__icon {
  width: 132rpx;
  height: 132rpx;
  border-radius: 50%;
  background: #fdecec;
  display: flex;
  align-items: center;
  justify-content: center;
}

.or__title {
  font-size: 38rpx;
  font-weight: 800;
  color: var(--c-danger);
}

.or__sub {
  font-size: 23rpx;
  color: var(--c-text-weak);
  text-align: center;
  line-height: 1.6;
}

.or__item {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
}

.or__kind {
  margin-top: 4rpx;
  flex-shrink: 0;
}

.or__item-text {
  gap: 8rpx;
}

.or__item-title {
  font-size: 26rpx;
  font-weight: 800;
}

.or__item-desc {
  font-size: 22rpx;
  color: var(--c-text-weaker);
  line-height: 1.6;
}

.or__fix {
  font-size: 23rpx;
  font-weight: 700;
  color: var(--c-primary);
  flex-shrink: 0;
  margin-top: 4rpx;
}

.or__note {
  background: var(--c-primary-bg);
  border: 1px solid var(--c-primary-line);
  border-radius: 28rpx;
  padding: 24rpx 28rpx;
  font-size: 23rpx;
  color: var(--c-warn-text-2);
  line-height: 1.7;
  margin-bottom: 20rpx;
}

.or__foot {
  flex-shrink: 0;
  display: flex;
  gap: 20rpx;
  padding: 20rpx 32rpx calc(24rpx + constant(safe-area-inset-bottom));
  padding: 20rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
}

.or__foot .btn {
  flex: 1;
}
</style>
