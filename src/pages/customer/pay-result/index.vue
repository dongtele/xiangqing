<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getOrder } from '@/services/api';
import { chrome } from '@/utils/chrome';
import { fen2yuan } from '@/utils/money';
import { push, relaunch, toast, todo } from '@/utils/nav';
import type { Order } from '@/models';

/** 04 · 支付成功：结果页 + 后续引导 */
const topPad = ref(170);
const order = ref<Order | null>(null);

const payableText = computed(() => (order.value ? fen2yuan(order.value.payable) : '0'));

onLoad(async (options) => {
  topPad.value = chrome().capsuleBottom + 90;
  const detail = await getOrder((options && options.id) || '');
  if (!detail) return;
  order.value = detail;
});

function onCopyNo(): void {
  if (!order.value) return;
  uni.setClipboardData({ data: order.value.orderNo });
  toast('订单编号已复制');
}
</script>

<template>
  <view class="pr">
    <view v-if="order" class="pr__main" :style="{ paddingTop: topPad + 'px' }">
      <view class="pr__check">
        <wf-icon name="check" :size="72" color="#00B578" :weight="2.6" />
      </view>
      <text class="pr__title">支付成功</text>
      <text class="pr__sub">商家已接单，正在为您备餐</text>

      <view class="card card--lg pr__card">
        <view class="row--between">
          <text class="pr__label">{{
            order.deliveryType === 'delivery' ? '预计送达' : '预计取餐'
          }}</text>
          <text class="pr__eta">{{ order.etaTimeText }}</text>
        </view>
        <view class="hairline" />
        <view class="row--between">
          <text class="pr__label">{{
            order.deliveryType === 'delivery' ? '配送地址' : '自取门店'
          }}</text>
          <text class="pr__value">{{
            order.deliveryType === 'delivery' && order.address
              ? order.address.detail
              : order.shopName
          }}</text>
        </view>
        <view class="row--between">
          <text class="pr__label">订单编号</text>
          <view class="pr__no">
            <text class="pr__value">{{ order.orderNo }}</text>
            <text class="pr__copy tap" @tap="onCopyNo">复制</text>
          </view>
        </view>
        <view class="row--between">
          <text class="pr__label">实付金额</text>
          <text class="pr__amount">¥{{ payableText }}</text>
        </view>
      </view>

      <!-- 自提单：取餐码 + 门店导航 -->
      <view v-if="order.pickupCode" class="pr__pickup">
        <view class="col pr__pickup-left">
          <text class="pr__pickup-label">取餐码</text>
          <text class="pr__pickup-code">{{ order.pickupCode }}</text>
        </view>
        <view class="pill pill--outline-primary tap" @tap="todo('83', '门店导航')">门店导航</view>
      </view>

      <view class="pr__actions">
        <view class="pr__btn pr__btn--ghost tap" @tap="relaunch('/pages/customer/menu/index')"
          >返回首页</view
        >
        <view
          class="pr__btn pr__btn--primary tap"
          @tap="push(`/pages/customer/order-detail/index?id=${order.id}`)"
          >查看订单详情</view
        >
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.pr {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.pr__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28rpx;
  padding-left: 56rpx;
  padding-right: 56rpx;
  padding-bottom: calc(48rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(48rpx + env(safe-area-inset-bottom));
}

.pr__check {
  width: 148rpx;
  height: 148rpx;
  border-radius: 50%;
  background: var(--c-success-bg-2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pr__title {
  font-size: 44rpx;
  font-weight: 800;
}

.pr__sub {
  font-size: 25rpx;
  color: var(--c-text-weak);
}

.pr__card {
  width: 100%;
  padding: 36rpx;
  gap: 24rpx;
  margin-top: 20rpx;
}

.pr__label {
  font-size: 25rpx;
  color: var(--c-text-weak);
}

.pr__value {
  font-size: 25rpx;
  font-weight: 700;
}

.pr__eta {
  font-size: 32rpx;
  font-weight: 800;
  color: var(--c-primary);
}

.pr__no {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.pr__copy {
  color: var(--c-primary);
  font-weight: 700;
  font-size: 24rpx;
}

.pr__amount {
  font-size: 26rpx;
  font-weight: 800;
}

.pr__pickup {
  width: 100%;
  background: var(--c-warn-bg);
  border: 1px solid #f5e3bc;
  border-radius: 24rpx;
  padding: 24rpx 28rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pr__pickup-left {
  gap: 4rpx;
}

.pr__pickup-label {
  font-size: 22rpx;
  color: var(--c-warn-text-2);
  font-weight: 700;
}

.pr__pickup-code {
  font-size: 42rpx;
  font-weight: 800;
  letter-spacing: 8rpx;
}

.pr__actions {
  display: flex;
  gap: 24rpx;
  width: 100%;
  margin-top: 12rpx;
}

.pr__btn {
  flex: 1;
  text-align: center;
  font-size: 28rpx;
  padding: 26rpx 0;
  border-radius: 50rpx;
}

.pr__btn--ghost {
  border: 3rpx solid var(--c-border-btn);
  color: var(--c-text-2);
  font-weight: 700;
  background: #fff;
}

.pr__btn--primary {
  background: var(--grad-main);
  color: #fff;
  font-weight: 800;
  box-shadow: 0 12rpx 32rpx rgba(255, 61, 0, 0.28);
}
</style>
