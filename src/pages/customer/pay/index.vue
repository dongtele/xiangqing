<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { getOrder, payOrder } from '@/services/api';
import { PAY_TIMEOUT_SECONDS } from '@/config';
import { useCartStore } from '@/stores/cart';
import { fen2yuan2 } from '@/utils/money';
import { countdown, mmss } from '@/utils/time';
import { relaunch, toast } from '@/utils/nav';
import type { Order } from '@/models';

/** 43 · 收银台 / 支付失败：唤起支付、失败兜底与重试 */
const cart = useCartStore();

const order = ref<Order | null>(null);
const method = ref('wechat');
const leftText = ref('15:00');
const paying = ref(false);
const failed = ref(false);

let stop: (() => void) | null = null;

const payableText = computed(() => (order.value ? fen2yuan2(order.value.payable) : '0.00'));

onLoad(async (options) => {
  const detail = await getOrder((options && options.id) || '');
  if (!detail) {
    toast('订单不存在');
    return;
  }
  order.value = detail;
  method.value = (options && options.method) || 'wechat';
  stop = countdown(
    PAY_TIMEOUT_SECONDS,
    (left) => {
      leftText.value = mmss(left);
    },
    () => {
      failed.value = true;
    }
  );
  invokePay();
});

onUnload(() => {
  if (stop) stop();
});

/** 真机上此处调用 uni.requestPayment；mock 走服务端支付结果 */
async function invokePay(): Promise<void> {
  if (!order.value || paying.value) return;
  paying.value = true;
  failed.value = false;
  const res = await payOrder(order.value.id, method.value);
  paying.value = false;
  if (res.success) {
    cart.clear();
    relaunch(`/pages/customer/pay-result/index?id=${order.value.id}`);
    return;
  }
  failed.value = true;
}

function onAbandon(): void {
  failed.value = false;
  toast('订单已保留在「进行中」，可稍后支付');
  relaunch('/pages/customer/orders/index?tab=ongoing');
}
</script>

<template>
  <view class="pay">
    <wf-nav-bar title="订单支付" />

    <view class="pay__body">
      <view class="card">
        <view class="pay__amount">
          <text class="pay__amount-label">待支付</text>
          <text class="pay__amount-num">￥{{ payableText }}</text>
          <text class="pay__amount-left">剩余支付时间 {{ leftText }}</text>
        </view>
      </view>

      <view class="card">
        <view class="pay__method">
          <view class="col pay__method-text">
            <text class="pay__method-name">微信支付</text>
            <text class="pay__method-desc">零钱 / 银行卡</text>
          </view>
          <text class="pay__method-flag">● 推荐</text>
        </view>
        <view class="hairline" />
        <view class="pay__method">
          <view class="col pay__method-text">
            <text class="pay__method-name">余额支付</text>
            <text class="pay__method-desc">余额不足，需组合支付</text>
          </view>
          <text class="pay__method-value">￥12.40</text>
        </view>
      </view>

      <view v-if="paying" class="pay__loading">
        <text class="pay__loading-text">正在唤起微信支付…</text>
      </view>
    </view>

    <!-- 支付失败兜底：保留金额与重试按钮（交付文档「失败态」） -->
    <view class="pay__mask" :class="{ 'pay__mask--on': failed }" />
    <view class="pay__dialog" :class="{ 'pay__dialog--on': failed }">
      <view class="pay__dialog-icon">
        <wf-icon name="warn" :size="52" color="#FF3800" :weight="2" />
      </view>
      <text class="pay__dialog-title">支付未完成</text>
      <text class="pay__dialog-desc">订单已为你保留 15 分钟，超时后库存将释放</text>
      <view class="pay__dialog-actions">
        <view class="btn btn--primary tap" @tap="invokePay">重新支付</view>
        <view class="btn btn--ghost tap" @tap="onAbandon">放弃订单</view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.pay {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pay__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx 32rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.pay__amount {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 20rpx 0;
}

.pay__amount-label {
  font-size: 24rpx;
  color: var(--c-text-weak);
}

.pay__amount-num {
  font-size: 68rpx;
  font-weight: 800;
  color: var(--c-primary-deep);
  letter-spacing: -2rpx;
}

.pay__amount-left {
  font-size: 23rpx;
  color: var(--c-text-weaker);
}

.pay__method {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.pay__method-text {
  gap: 4rpx;
}

.pay__method-name {
  font-size: 27rpx;
  font-weight: 700;
}

.pay__method-desc {
  font-size: 21rpx;
  color: var(--c-text-weaker);
}

.pay__method-flag,
.pay__method-value {
  font-size: 25rpx;
  color: var(--c-text-weak);
  font-weight: 600;
}

.pay__loading {
  text-align: center;
  padding-top: 20rpx;
}

.pay__loading-text {
  font-size: 24rpx;
  color: var(--c-text-weaker);
}

/* 失败弹窗 */
.pay__mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(32, 22, 15, 0.45);
  z-index: 60;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.pay__mask--on {
  opacity: 1;
  pointer-events: auto;
}

.pay__dialog {
  position: fixed;
  left: 48rpx;
  right: 48rpx;
  top: 52%;
  transform: translateY(-50%) scale(0.94);
  z-index: 61;
  background: #fff;
  border-radius: 40rpx;
  padding: 52rpx 44rpx 36rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.pay__dialog--on {
  opacity: 1;
  transform: translateY(-50%) scale(1);
  pointer-events: auto;
}

.pay__dialog-icon {
  width: 104rpx;
  height: 104rpx;
  border-radius: 50%;
  background: var(--c-primary-bg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pay__dialog-title {
  font-size: 32rpx;
  font-weight: 800;
}

.pay__dialog-desc {
  font-size: 25rpx;
  color: var(--c-text-weak);
  text-align: center;
  line-height: 1.6;
}

.pay__dialog-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding-top: 16rpx;
}
</style>
