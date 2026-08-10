<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getSettlement, withdraw } from '@/services/api';
import { push, toast } from '@/utils/nav';
import type { Settlement } from '@/models';

/** 34 · 货款结算：工作台营业额数字的资金落点——余额、待结算、流水、提现一页看清 */
const data = ref<Settlement | null>(null);

onShow(() => {
  load();
});

async function load(): Promise<void> {
  data.value = await getSettlement();
}

function onWithdraw(): void {
  uni.showModal({
    title: '提现到银行卡',
    editable: true,
    placeholderText: '输入提现金额（最低 ￥100）',
    confirmColor: '#FF4A17',
    success: async (res) => {
      if (!res.confirm) return;
      const out = await withdraw(Number(res.content) || 0);
      toast(out.message);
      if (out.ok) load();
    },
  });
}
</script>

<template>
  <view v-if="data" class="st">
    <wf-nav-bar title="货款结算" />

    <scroll-view class="st__body" scroll-y>
      <view class="st__balance">
        <text class="st__balance-label">可提现余额（元）</text>
        <text class="st__balance-value">{{ data.balanceText }}</text>
        <view class="st__balance-sub">
          <view class="col st__balance-item">
            <text class="st__balance-item-label">待结算（T+1）</text>
            <text class="st__balance-item-value">{{ data.pendingText }}</text>
          </view>
          <view class="col st__balance-item">
            <text class="st__balance-item-label">本月累计入账</text>
            <text class="st__balance-item-value">{{ data.monthTotalText }}</text>
          </view>
        </view>
      </view>

      <view class="card card--flat">
        <view class="cell tap" @tap="push('/pages/merchant/payout-account/index')">
          <text class="cell__label">结算账户</text>
          <view class="cell__value"
            ><text>{{ data.accountText }}</text
            ><text class="chevron">›</text></view
          >
        </view>
      </view>

      <view class="card">
        <view class="row--between">
          <text class="t-section">结算记录</text>
          <text class="st__more tap-sm" @tap="push('/pages/merchant/bills/index')">全部 ›</text>
        </view>
        <view v-for="(r, i) in data.rows" :key="r.id" class="col">
          <view v-if="i" class="hairline st__line" />
          <view
            class="st__row tap"
            @tap="r.income && push('/pages/merchant/settlement-detail/index?id=' + r.id)"
          >
            <view class="flex1 col st__row-text">
              <text class="st__row-title">{{ r.title }}</text>
              <text class="st__row-meta">{{ r.metaText }}</text>
            </view>
            <text class="st__row-amount" :class="{ 'st__row-amount--out': !r.income }"
              >{{ r.income ? '+' : '-' }}¥{{ r.amountText }}</text
            >
          </view>
        </view>
      </view>

      <text class="st__note">{{ data.noteText }}</text>
    </scroll-view>

    <view class="st__foot">
      <view class="btn btn--primary tap" @tap="onWithdraw">提现到银行卡</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.st {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.st__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx 0;
}

.card {
  margin-bottom: 20rpx;
}

.st__balance {
  background: var(--grad-dark);
  border-radius: 40rpx;
  padding: 36rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  color: #fff;
  margin-bottom: 20rpx;
}

.st__balance-label {
  font-size: 23rpx;
  color: rgba(255, 255, 255, 0.72);
}

.st__balance-value {
  font-size: 72rpx;
  font-weight: 800;
  letter-spacing: -1rpx;
  line-height: 1.1;
}

.st__balance-sub {
  display: flex;
  gap: 60rpx;
  padding-top: 16rpx;
}

.st__balance-item {
  gap: 6rpx;
}

.st__balance-item-label {
  font-size: 21rpx;
  color: rgba(255, 255, 255, 0.6);
}

.st__balance-item-value {
  font-size: 28rpx;
  font-weight: 800;
}

.st__more {
  font-size: 23rpx;
  color: var(--c-text-weaker);
}

.st__line {
  margin-bottom: 20rpx;
}

.st__row {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.st__row-text {
  gap: 4rpx;
}

.st__row-title {
  font-size: 26rpx;
  font-weight: 700;
}

.st__row-meta {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.st__row-amount {
  font-size: 28rpx;
  font-weight: 800;
  color: var(--c-success-deep);
  flex-shrink: 0;
}

.st__row-amount--out {
  color: var(--c-text-2);
}

.st__note {
  display: block;
  font-size: 22rpx;
  color: var(--c-text-weaker);
  line-height: 1.7;
  padding: 4rpx 8rpx 20rpx;
}

.st__foot {
  flex-shrink: 0;
  padding: 20rpx 32rpx calc(24rpx + constant(safe-area-inset-bottom));
  padding: 20rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
}
</style>
