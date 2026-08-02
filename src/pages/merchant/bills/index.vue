<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getBills, withdraw } from '@/services/api';
import { push, toast } from '@/utils/nav';
import type { BillTab, Bills } from '@/models';

/** 88 · 账单流水与提现：货款结算页下层，余额、提现与逐笔流水 */
const TABS: { key: BillTab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'income', label: '收入' },
  { key: 'expense', label: '支出' },
  { key: 'withdraw', label: '提现' },
];

const activeTab = ref<BillTab>('all');
const data = ref<Bills | null>(null);

onShow(() => {
  load();
});

async function load(): Promise<void> {
  data.value = await getBills(activeTab.value);
}

function onSwitchTab(key: BillTab): void {
  if (key === activeTab.value) return;
  activeTab.value = key;
  load();
}

function onWithdraw(): void {
  uni.showModal({
    title: '立即提现',
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
  <view v-if="data" class="bl">
    <wf-nav-bar title="账单流水" right="筛选" @righttap="toast('高级筛选接后端后开放')" />

    <scroll-view class="bl__body" scroll-y>
      <view class="bl__balance">
        <view class="row--between">
          <view class="col bl__balance-main">
            <text class="bl__balance-label">可提现余额（元）</text>
            <text class="bl__balance-value">{{ data.balanceText }}</text>
          </view>
          <view class="bl__withdraw tap" @tap="onWithdraw">立即提现</view>
        </view>
        <view class="bl__balance-sub">
          <view class="col bl__balance-item">
            <text class="bl__balance-item-label">在途结算</text>
            <text class="bl__balance-item-value">{{ data.onTheWayText }}</text>
          </view>
          <view class="col bl__balance-item">
            <text class="bl__balance-item-label">本月已提现</text>
            <text class="bl__balance-item-value">{{ data.monthWithdrawText }}</text>
          </view>
          <view class="col bl__balance-item tap" @tap="push('/pages/merchant/payout-account/index')">
            <text class="bl__balance-item-label">收款账户</text>
            <text class="bl__balance-item-value">管理 ›</text>
          </view>
        </view>
      </view>

      <view class="bl__tabs">
        <view
          v-for="t in TABS"
          :key="t.key"
          class="bl__tab tap-sm"
          :class="{ 'bl__tab--on': activeTab === t.key }"
          @tap="onSwitchTab(t.key)"
          >{{ t.label }}</view
        >
      </view>

      <view v-if="data.rows.length" class="card">
        <view v-for="(r, i) in data.rows" :key="r.id" class="col">
          <view v-if="i" class="hairline bl__line" />
          <view class="bl__row">
            <view class="flex1 col bl__row-text">
              <text class="bl__row-title">{{ r.title }}</text>
              <text class="bl__row-meta">{{ r.metaText }}</text>
            </view>
            <text class="bl__row-amount" :class="{ 'bl__row-amount--out': !r.income }"
              >{{ r.income ? '+' : '-' }}{{ r.amountText }}</text
            >
          </view>
        </view>
      </view>

      <view v-else class="empty">
        <text class="empty__text">这个分类下没有流水</text>
      </view>

      <text class="bl__note">{{ data.noteText }}</text>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.bl {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.bl__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx calc(40rpx + constant(safe-area-inset-bottom));
  padding: 20rpx 32rpx calc(40rpx + env(safe-area-inset-bottom));
}

.bl__balance {
  background: var(--grad-dark);
  border-radius: 40rpx;
  padding: 36rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  color: #fff;
  margin-bottom: 20rpx;
}

.bl__balance-main {
  gap: 8rpx;
}

.bl__balance-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.72);
}

.bl__balance-value {
  font-size: 60rpx;
  font-weight: 800;
  letter-spacing: -1rpx;
  line-height: 1.1;
}

.bl__withdraw {
  background: #fff;
  color: var(--c-primary-deep);
  font-size: 25rpx;
  font-weight: 800;
  padding: 18rpx 34rpx;
  border-radius: 34rpx;
  flex-shrink: 0;
}

.bl__balance-sub {
  display: flex;
  justify-content: space-between;
}

.bl__balance-item {
  gap: 6rpx;
}

.bl__balance-item-label {
  font-size: 21rpx;
  color: rgba(255, 255, 255, 0.6);
}

.bl__balance-item-value {
  font-size: 26rpx;
  font-weight: 800;
}

.bl__tabs {
  display: flex;
  gap: 16rpx;
  padding-bottom: 20rpx;
}

.bl__tab {
  background: #fff;
  color: var(--c-text-2);
  font-size: 23rpx;
  font-weight: 600;
  padding: 12rpx 28rpx;
  border-radius: 28rpx;
}

.bl__tab--on {
  background: var(--c-text);
  color: #fff;
  font-weight: 700;
}

.bl__line {
  margin-bottom: 20rpx;
}

.bl__row {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.bl__row-text {
  gap: 4rpx;
}

.bl__row-title {
  font-size: 26rpx;
  font-weight: 700;
}

.bl__row-meta {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.bl__row-amount {
  font-size: 28rpx;
  font-weight: 800;
  color: var(--c-success-deep);
  flex-shrink: 0;
}

.bl__row-amount--out {
  color: var(--c-text-2);
}

.bl__note {
  display: block;
  font-size: 22rpx;
  color: var(--c-text-weaker);
  line-height: 1.7;
  padding: 20rpx 8rpx 0;
}
</style>
