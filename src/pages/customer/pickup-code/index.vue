<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getPickupCode } from '@/services/api';
import { chrome } from '@/utils/chrome';
import { back, push, toast } from '@/utils/nav';
import type { PickupCodeInfo } from '@/models';

/** 25 · 自提取餐码：取餐码 + 二维码 + 门店信息 */
const topPad = ref(96);
const info = ref<PickupCodeInfo | null>(null);
let orderId = '';

onLoad(async (o) => {
  orderId = (o && o.id) || '';
  topPad.value = chrome().capsuleBottom + 12;
  const res = await getPickupCode(orderId);
  if (!res) {
    toast('该订单没有取餐码');
    return;
  }
  info.value = res;
});
</script>

<template>
  <view v-if="info" class="pc">
    <view class="pc__head" :style="{ paddingTop: topPad + 'px' }">
      <view class="pc__back tap" @tap="back()"><text class="pc__back-glyph">‹</text></view>
      <text class="pc__title">取餐码</text>
    </view>

    <view class="pc__status">
      <text class="pc__status-title">{{ info.statusTitle }}</text>
      <text class="pc__status-sub">{{ info.statusSub }}</text>
    </view>

    <scroll-view class="pc__body" scroll-y>
      <view class="pc__card">
        <!-- 二维码：接真实数据后由服务端下发图；这里按取餐码画一个可辨识的占位码 -->
        <view class="pc__qr">
          <view v-for="n in 64" :key="n" class="pc__qr-cell" :class="{ 'pc__qr-cell--on': (n * info.code.length) % 3 !== 0 }" />
        </view>
        <view class="pc__code">
          <text class="pc__code-label">取餐码</text>
          <text class="pc__code-num">{{ info.code }}</text>
        </view>
        <view class="pc__meta">
          <view class="pc__meta-row">
            <text class="pc__meta-label">订单编号</text>
            <text class="pc__meta-value">{{ info.orderNo }}</text>
          </view>
          <view class="pc__meta-row">
            <text class="pc__meta-label">餐品</text>
            <text class="pc__meta-value">{{ info.itemsText }}</text>
          </view>
          <view class="pc__meta-row">
            <text class="pc__meta-label">取餐时间</text>
            <text class="pc__meta-value pc__meta-value--primary">{{ info.waitText }}</text>
          </view>
        </view>
      </view>

      <view class="card pc__shop">
        <view class="pc__shop-icon">
          <wf-icon name="pin" :size="34" color="#FF4A17" :weight="2" />
        </view>
        <view class="flex1 col pc__shop-text">
          <text class="pc__shop-name">{{ info.shopName }}</text>
          <text class="pc__shop-addr">{{ info.shopAddress }} · 距您 {{ info.shopDistance }}</text>
        </view>
        <text class="pill pill--outline-primary tap" @tap="toast(`门店导航：${info.shopAddress}`)"
          >导航</text
        >
      </view>

      <view class="pc__actions">
        <view class="pc__btn tap" @tap="push('/pages/customer/support/index')">联系商家</view>
        <view class="pc__btn tap" @tap="push(`/pages/customer/order-detail/index?id=${orderId}`)"
          >查看订单详情</view
        >
      </view>

      <view class="pc__foot" />
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.pc {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: linear-gradient(180deg, #ff7b1c 0%, #ff3d00 42%, #f6f5f2 42.01%);
}

.pc__head {
  padding-left: 32rpx;
  padding-right: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
  height: 88rpx;
}

.pc__back {
  position: absolute;
  left: 32rpx;
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.22);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pc__back-glyph {
  color: #fff;
  font-size: 36rpx;
  line-height: 1;
  margin-top: -4rpx;
}

.pc__title {
  font-size: 34rpx;
  font-weight: 800;
  color: #fff;
}

.pc__status {
  padding: 36rpx 48rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  flex-shrink: 0;
}

.pc__status-title {
  color: #fff;
  font-size: 28rpx;
  font-weight: 800;
}

.pc__status-sub {
  color: rgba(255, 255, 255, 0.82);
  font-size: 23rpx;
}

.pc__body {
  flex: 1;
  min-height: 0;
  padding: 40rpx 48rpx 0;
}

.pc__card {
  background: #fff;
  border-radius: 44rpx;
  padding: 48rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32rpx;
  box-shadow: 0 24rpx 64rpx rgba(32, 22, 15, 0.14);
  margin-bottom: 28rpx;
}

.pc__qr {
  width: 340rpx;
  height: 340rpx;
  display: flex;
  flex-wrap: wrap;
  background: #fff;
  border: 8rpx solid #20160f;
  padding: 12rpx;
}

.pc__qr-cell {
  width: 12.5%;
  height: 12.5%;
  background: transparent;
}

.pc__qr-cell--on {
  background: #20160f;
}

.pc__code {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.pc__code-label {
  font-size: 22rpx;
  color: var(--c-text-weaker);
  font-weight: 700;
}

.pc__code-num {
  font-size: 68rpx;
  font-weight: 800;
  letter-spacing: 20rpx;
  color: var(--c-primary-deep);
}

.pc__meta {
  width: 100%;
  border-top: 3rpx dashed #f0e8df;
  padding-top: 28rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.pc__meta-row {
  display: flex;
  justify-content: space-between;
  font-size: 23rpx;
  gap: 20rpx;
}

.pc__meta-label {
  color: var(--c-text-weaker);
  flex-shrink: 0;
}

.pc__meta-value {
  font-weight: 600;
  text-align: right;
}

.pc__meta-value--primary {
  font-weight: 800;
  color: var(--c-primary);
}

.pc__shop {
  flex-direction: row;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 28rpx;
}

.pc__shop-icon {
  width: 76rpx;
  height: 76rpx;
  border-radius: 24rpx;
  background: var(--c-primary-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pc__shop-text {
  gap: 4rpx;
}

.pc__shop-name {
  font-size: 26rpx;
  font-weight: 800;
}

.pc__shop-addr {
  font-size: 21rpx;
  color: var(--c-text-weaker);
}

.pc__actions {
  display: flex;
  gap: 24rpx;
}

.pc__btn {
  flex: 1;
  text-align: center;
  background: #fff;
  border: 3rpx solid var(--c-border-btn);
  color: var(--c-text-2);
  font-size: 26rpx;
  font-weight: 700;
  padding: 22rpx 0;
  border-radius: 46rpx;
}

.pc__foot {
  height: 40rpx;
}
</style>
