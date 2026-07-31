<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { cancelRefund, getRefund } from '@/services/api';
import { fen2yuan2 } from '@/utils/money';
import { toast, todo } from '@/utils/nav';
import type { Refund } from '@/models';

/** 40 · 退款进度：状态时间轴 + 金额与流水号 */
const refund = ref<Refund | null>(null);
let refundId = '';

const amountText = computed(() => (refund.value ? fen2yuan2(refund.value.amount) : '0.00'));
const canCancel = computed(() => !!refund.value && refund.value.status === 'reviewing');

onLoad((o) => {
  refundId = (o && o.id) || '';
});

onShow(() => {
  load();
});

async function load(): Promise<void> {
  const res = await getRefund(refundId);
  if (!res) {
    toast('退款单不存在');
    return;
  }
  refund.value = res;
}

function onCancel(): void {
  uni.showModal({
    title: '撤销退款申请？',
    content: '撤销后本单将恢复为正常订单',
    confirmColor: '#FF4A17',
    success: async (res) => {
      if (!res.confirm) return;
      await cancelRefund(refundId);
      toast('已撤销申请');
      load();
    },
  });
}
</script>

<template>
  <view v-if="refund" class="rd">
    <wf-nav-bar title="退款详情" />

    <scroll-view class="rd__body" scroll-y>
      <view class="card">
        <view class="rd__status">
          <text class="rd__status-text" :class="`rd__status-text--${refund.status}`">{{
            refund.statusText
          }}</text>
          <text class="rd__status-sub">{{ refund.statusSub }}</text>
        </view>
      </view>

      <view class="card">
        <wf-timeline :nodes="refund.timeline" />
      </view>

      <view class="card">
        <view class="row--between">
          <text class="cell__label">退款金额</text>
          <text class="cell__value">￥{{ amountText }}</text>
        </view>
        <view class="hairline" />
        <view class="row--between">
          <text class="cell__label">退款商品</text>
          <text class="cell__value">{{ refund.itemsText }}</text>
        </view>
        <view class="hairline" />
        <view class="row--between">
          <text class="cell__label">退款原因</text>
          <text class="cell__value">{{ refund.reasonText }}</text>
        </view>
        <template v-if="refund.desc">
          <view class="hairline" />
          <view class="row--between">
            <text class="cell__label">补充说明</text>
            <text class="cell__value rd__desc">{{ refund.desc }}</text>
          </view>
        </template>
        <view class="hairline" />
        <view class="row--between">
          <text class="cell__label">订单编号</text>
          <text class="cell__value">{{ refund.orderNo }}</text>
        </view>
      </view>

      <view class="rd__actions">
        <view class="rd__btn tap" @tap="todo('41', '在线客服')">联系商家</view>
        <view v-if="canCancel" class="rd__btn tap" @tap="onCancel">撤销申请</view>
      </view>

      <view class="rd__foot" />
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.rd {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.rd__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx 0;
}

.rd__body > .card {
  margin-bottom: 20rpx;
}

.rd__status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 0;
}

.rd__status-text {
  font-size: 38rpx;
  font-weight: 800;
  color: var(--c-primary);
}

.rd__status-text--agreed {
  color: var(--c-success-deep);
}

.rd__status-text--rejected {
  color: var(--c-danger);
}

.rd__status-text--cancelled {
  color: var(--c-text-weak);
}

.rd__status-sub {
  font-size: 24rpx;
  color: var(--c-text-weak);
  text-align: center;
  line-height: 1.6;
}

.rd__desc {
  flex: 1;
  text-align: right;
  margin-left: 24rpx;
}

.rd__actions {
  display: flex;
  gap: 20rpx;
  padding-top: 8rpx;
}

.rd__btn {
  flex: 1;
  height: 96rpx;
  border-radius: 48rpx;
  background: #fff;
  color: var(--c-text-2);
  border: 1px solid var(--c-border-btn);
  font-size: 30rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rd__foot {
  height: 40rpx;
}
</style>
