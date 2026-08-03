<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getSettlementDetail } from '@/services/api';
import { push, toast } from '@/utils/nav';
import type { SettlementDetail } from '@/models';

/** 67 · 结算单详情：交易构成、平台抽佣与到账状态，从 34 点某期账单进入 */
const data = ref<SettlementDetail | null>(null);

onLoad(async (o) => {
  data.value = await getSettlementDetail((o && o.id) || '');
});

function onRow(label: string): void {
  if (label === '收款账户') {
    push('/pages/merchant/payout-account/index');
    return;
  }
  push('/pages/merchant/order-history/index');
}
</script>

<template>
  <view v-if="data" class="sd">
    <wf-nav-bar :title="`结算单 · ${data.dateText}`" />

    <scroll-view class="sd__body" scroll-y>
      <view class="card sd__hero">
        <text class="sd__hero-label">本期结算金额</text>
        <text class="sd__hero-value">￥{{ data.amountText }}</text>
        <view class="row sd__hero-status">
          <view class="sd__dot" />
          <text class="sd__status-text">{{ data.statusText }}</text>
        </view>
      </view>

      <view class="card">
        <view v-for="b in data.breakdown" :key="b.label" class="row--between sd__break">
          <text class="sd__break-label">{{ b.label }}</text>
          <text class="sd__break-value" :class="{ 'sd__break-value--neg': b.negative }">{{
            b.value
          }}</text>
        </view>
        <view class="hairline" />
        <view class="row--between">
          <text class="sd__total-label">实际结算</text>
          <text class="sd__total-value">￥{{ data.amountText }}</text>
        </view>
      </view>

      <view class="card card--flat">
        <view
          v-for="r in data.rows"
          :key="r.label"
          class="cell"
          :class="{ tap: r.link }"
          @tap="r.link && onRow(r.label)"
        >
          <text class="cell__label">{{ r.label }}</text>
          <view class="cell__value"
            ><text>{{ r.value }}</text
            ><text v-if="r.link" class="chevron">›</text></view
          >
        </view>
      </view>

      <view class="sd__actions">
        <view class="btn btn--ghost tap" @tap="toast('账单已发送到商家邮箱')">导出账单</view>
        <view class="btn btn--ghost tap" @tap="push('/pages/merchant/bills/index')">对账明细</view>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.sd {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sd__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx calc(40rpx + constant(safe-area-inset-bottom));
  padding: 20rpx 32rpx calc(40rpx + env(safe-area-inset-bottom));
}

.card {
  margin-bottom: 20rpx;
}

.sd__hero {
  align-items: center;
  gap: 12rpx;
  padding: 40rpx 32rpx;
}

.sd__hero-label {
  font-size: 23rpx;
  color: var(--c-text-weak);
}

.sd__hero-value {
  font-size: 72rpx;
  font-weight: 800;
  color: var(--c-primary);
  line-height: 1.1;
}

.sd__hero-status {
  gap: 10rpx;
}

.sd__dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: var(--c-success);
}

.sd__status-text {
  font-size: 23rpx;
  color: var(--c-success-deep);
  font-weight: 700;
}

.sd__break-label {
  font-size: 25rpx;
  color: var(--c-text-weak);
}

.sd__break-value {
  font-size: 26rpx;
  font-weight: 700;
}

.sd__break-value--neg {
  color: var(--c-danger);
}

.sd__total-label {
  font-size: 27rpx;
  font-weight: 800;
}

.sd__total-value {
  font-size: 32rpx;
  font-weight: 800;
  color: var(--c-primary);
}

.sd__actions {
  display: flex;
  gap: 20rpx;
}

.sd__actions .btn {
  flex: 1;
}
</style>
