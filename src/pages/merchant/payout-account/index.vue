<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getPayoutAccount } from '@/services/api';
import { toast } from '@/utils/nav';
import type { PayoutAccount } from '@/models';

/** 68 · 收款账户管理：对公账户与结算周期，变更需重新验证 */
const data = ref<PayoutAccount | null>(null);

onLoad(async () => {
  data.value = await getPayoutAccount();
});

function onChange(): void {
  uni.showModal({
    title: '变更收款账户？',
    content: '需上传开户许可证并完成法人人脸核验，变更后 24 小时内暂停结算',
    confirmColor: '#FF4A17',
    success: (res) => {
      if (!res.confirm) return;
      toast('变更申请接后端后开放');
    },
  });
}
</script>

<template>
  <view v-if="data" class="pa">
    <wf-nav-bar title="收款账户" right="＋ 添加" @righttap="toast('多账户接后端后开放')" />

    <scroll-view class="pa__body" scroll-y>
      <view class="pa__card">
        <view class="row--between">
          <text class="pa__type">{{ data.typeText }}</text>
          <text v-if="data.verified" class="pa__verified">已验证</text>
        </view>
        <text class="pa__mask">{{ data.cardMask }}</text>
        <text class="pa__bank">{{ data.bankText }}</text>
        <text class="pa__holder">{{ data.holderText }}</text>
      </view>

      <view class="card card--flat">
        <view v-for="r in data.rows" :key="r.label" class="cell">
          <text class="cell__label">{{ r.label }}</text>
          <view class="cell__value"
            ><text>{{ r.value }}</text
            ><text v-if="r.label === '结算周期'" class="chevron">›</text></view
          >
        </view>
      </view>

      <view class="card pa__change tap" @tap="onChange">
        <text class="pa__change-title">{{ data.changeTitle }}</text>
        <text class="pa__change-text">{{ data.changeText }}</text>
      </view>

      <view class="pa__note">{{ data.noteText }}</view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.pa {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pa__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx calc(40rpx + constant(safe-area-inset-bottom));
  padding: 20rpx 32rpx calc(40rpx + env(safe-area-inset-bottom));
}

.card {
  margin-bottom: 20rpx;
}

.pa__card {
  background: var(--grad-dark);
  border-radius: 40rpx;
  padding: 36rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  color: #fff;
  margin-bottom: 20rpx;
}

.pa__type {
  font-size: 26rpx;
  font-weight: 800;
}

.pa__verified {
  font-size: 21rpx;
  font-weight: 800;
  background: rgba(7, 193, 96, 0.22);
  color: #6fe0a6;
  padding: 6rpx 18rpx;
  border-radius: 14rpx;
}

.pa__mask {
  font-size: 44rpx;
  font-weight: 800;
  letter-spacing: 4rpx;
  padding-top: 8rpx;
}

.pa__bank {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.72);
}

.pa__holder {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.6);
}

.pa__change {
  gap: 8rpx;
}

.pa__change-title {
  font-size: 27rpx;
  font-weight: 700;
}

.pa__change-text {
  font-size: 22rpx;
  color: var(--c-text-weaker);
  line-height: 1.6;
}

.pa__note {
  background: var(--c-primary-bg);
  border: 1px solid var(--c-primary-line);
  border-radius: 28rpx;
  padding: 24rpx 28rpx;
  font-size: 23rpx;
  color: var(--c-warn-text-2);
  line-height: 1.7;
}
</style>
