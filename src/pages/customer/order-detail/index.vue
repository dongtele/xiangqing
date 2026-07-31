<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getOrder } from '@/services/api';
import { chrome } from '@/utils/chrome';
import { fen2yuan } from '@/utils/money';
import { toast, todo } from '@/utils/nav';
import type { Order } from '@/models';

/** 06 · 订单详情：状态时间轴、骑手、商品、金额、操作 */
const headPad = ref(100);
const order = ref<Order | null>(null);
let orderId = '';

const goods = computed(() =>
  order.value ? order.value.items.map((i) => ({ ...i, amountText: fen2yuan(i.amount) })) : []
);
const feeText = computed(() =>
  order.value ? fen2yuan(order.value.packFee + order.value.deliveryFee) : '0'
);
const couponText = computed(() => (order.value ? fen2yuan(order.value.couponDiscount) : '0'));

onLoad((options) => {
  orderId = (options && options.id) || '';
  headPad.value = chrome().capsuleBottom + 20;
});

onShow(async () => {
  const detail = await getOrder(orderId);
  if (!detail) {
    toast('订单不存在');
    return;
  }
  order.value = detail;
});

function onCopyNo(): void {
  if (!order.value) return;
  uni.setClipboardData({ data: order.value.orderNo });
  toast('订单编号已复制');
}

function onAftersale(): void {
  if (order.value && order.value.status === 'refunding') {
    toast('本单退款进行中，可在「我的订单 · 售后」查看进度');
    return;
  }
  todo('20', '申请售后');
}
</script>

<template>
  <view v-if="order" class="od">
    <!-- 状态头部 + 时间轴 -->
    <view class="od__header" :style="{ paddingTop: headPad + 'px' }">
      <wf-nav-bar theme="dark" fixed title="" />
      <view class="col od__status">
        <text class="od__status-text">{{ order.statusText }}</text>
        <text class="od__status-eta">{{ order.etaText }}</text>
      </view>

      <view class="od__timeline">
        <template v-for="(node, index) in order.timeline" :key="node.label">
          <view
            v-if="index > 0"
            class="od__line"
            :class="{ 'od__line--on': node.done || node.current }"
          />
          <view class="od__node">
            <view v-if="node.done" class="od__dot od__dot--done">
              <text class="od__dot-check">✓</text>
            </view>
            <view v-else-if="node.current" class="od__dot od__dot--current" />
            <view v-else class="od__dot od__dot--todo" />
            <text
              class="od__node-label"
              :class="{
                'od__node-label--current': node.current,
                'od__node-label--todo': !node.done && !node.current,
              }"
              >{{ node.label }}</text
            >
          </view>
        </template>
      </view>
    </view>

    <scroll-view class="od__body" scroll-y>
      <!-- 骑手 -->
      <view v-if="order.rider" class="card od__rider">
        <view class="od__rider-avatar">{{ order.rider.avatarText }}</view>
        <view class="flex1 col od__rider-text">
          <text class="od__rider-name">{{ order.rider.name }} · {{ order.rider.role }}</text>
          <text class="od__rider-status">{{ order.rider.statusText }}</text>
        </view>
        <view class="pill pill--outline-primary tap" @tap="todo('84', '联系骑手')">拨打电话</view>
      </view>

      <!-- 自提取餐码 -->
      <view v-if="order.pickupCode" class="card od__code">
        <text class="od__code-label">取餐码</text>
        <text class="od__code-num">{{ order.pickupCode }}</text>
      </view>

      <!-- 商品与金额 -->
      <view class="card">
        <view v-for="(item, i) in goods" :key="i" class="od__goods">
          <view class="od__goods-img"><wf-thumb :src="item.image" :radius="20" /></view>
          <view class="flex1 col od__goods-info">
            <text class="od__goods-name">{{ item.name }}</text>
            <text class="od__goods-spec"
              >{{ item.specText ? item.specText + ' · ' : '' }}x{{ item.qty }}</text
            >
          </view>
          <text class="od__goods-amount">¥{{ item.amountText }}</text>
        </view>

        <view class="hairline" />

        <view class="od__fee">
          <text class="od__fee-label">打包费 + 配送费</text>
          <text class="od__fee-label">¥{{ feeText }}</text>
        </view>
        <view v-if="order.couponDiscount" class="od__fee">
          <text class="od__fee-label">优惠券</text>
          <text class="od__fee-cut">-¥{{ couponText }}</text>
        </view>
        <view class="od__paid">
          <text class="od__paid-label">实付</text>
          <wf-price :fen="order.payable" :size="36" color="#20160F" />
        </view>
      </view>

      <!-- 订单信息 -->
      <view class="card od__info">
        <view class="od__info-row">
          <text class="od__info-label">订单编号</text>
          <view class="od__no">
            <text class="od__info-value">{{ order.orderNo }}</text>
            <text class="od__copy tap" @tap="onCopyNo">复制</text>
          </view>
        </view>
        <view class="od__info-row">
          <text class="od__info-label">下单时间</text>
          <text class="od__info-value">{{ order.createdAtText }}</text>
        </view>
        <view class="od__info-row">
          <text class="od__info-label">支付方式</text>
          <text class="od__info-value">{{ order.payMethodText }}</text>
        </view>
        <view v-if="order.address" class="od__info-row">
          <text class="od__info-label">配送地址</text>
          <text class="od__info-value">{{ order.address.detail }}</text>
        </view>
        <view v-if="order.remark" class="od__info-row">
          <text class="od__info-label">备注</text>
          <text class="od__info-value">{{ order.remark }}</text>
        </view>
      </view>

      <view class="od__foot" />
    </scroll-view>

    <!-- 底部操作 -->
    <view class="od__bar">
      <view
        v-if="order.status === 'delivering'"
        class="od__btn tap"
        @tap="todo('53', '配送实时追踪')"
        >查看配送</view
      >
      <view class="od__btn tap" @tap="todo('41', '在线客服')">联系商家</view>
      <view class="od__btn tap" @tap="onAftersale">申请售后</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.od {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.od__header {
  background: var(--grad-header);
  padding-left: 40rpx;
  padding-right: 40rpx;
  padding-bottom: 68rpx;
  display: flex;
  flex-direction: column;
  gap: 36rpx;
  flex-shrink: 0;
}

.od__status {
  gap: 8rpx;
}

.od__status-text {
  color: #fff;
  font-size: 42rpx;
  font-weight: 800;
}

.od__status-eta {
  color: rgba(255, 255, 255, 0.85);
  font-size: 24rpx;
}

/* 状态轴 */
.od__timeline {
  display: flex;
  align-items: center;
}

.od__node {
  width: 104rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
}

.od__line {
  flex: 1;
  height: 4rpx;
  background: rgba(255, 255, 255, 0.35);
  margin: 0 4rpx 32rpx;
}

.od__line--on {
  background: rgba(255, 255, 255, 0.85);
}

.od__dot {
  width: 28rpx;
  height: 28rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.od__dot--done {
  background: #fff;
}

.od__dot-check {
  font-size: 18rpx;
  color: var(--c-primary);
  font-weight: 800;
  line-height: 1;
}

.od__dot--current {
  width: 32rpx;
  height: 32rpx;
  background: #fff;
  box-shadow: 0 0 0 8rpx rgba(255, 255, 255, 0.3);
}

.od__dot--todo {
  border: 4rpx solid rgba(255, 255, 255, 0.5);
}

.od__node-label {
  font-size: 19rpx;
  color: rgba(255, 255, 255, 0.9);
}

.od__node-label--current {
  color: #fff;
  font-weight: 800;
}

.od__node-label--todo {
  color: rgba(255, 255, 255, 0.6);
}

/* 内容 */
.od__body {
  flex: 1;
  min-height: 0;
  padding: 0 32rpx;
  margin-top: -36rpx;
}

.od__body > .card {
  margin-bottom: 24rpx;
}

.od__rider {
  flex-direction: row;
  align-items: center;
  gap: 24rpx;
  box-shadow: 0 8rpx 28rpx rgba(32, 22, 15, 0.06);
}

.od__rider-avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: var(--c-primary-bg);
  color: var(--c-primary);
  font-size: 34rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.od__rider-text {
  gap: 4rpx;
}

.od__rider-name {
  font-size: 28rpx;
  font-weight: 800;
}

.od__rider-status {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.od__code {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background: var(--c-warn-bg);
  border: 1px dashed #f0d9a8;
}

.od__code-label {
  font-size: 24rpx;
  color: var(--c-warn-text-2);
  font-weight: 700;
}

.od__code-num {
  font-size: 42rpx;
  font-weight: 800;
  letter-spacing: 10rpx;
}

/* 商品 */
.od__goods {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.od__goods-img {
  width: 88rpx;
  height: 88rpx;
  border-radius: 20rpx;
  overflow: hidden;
  flex-shrink: 0;
}

.od__goods-info {
  gap: 2rpx;
}

.od__goods-name {
  font-size: 25rpx;
  font-weight: 700;
}

.od__goods-spec {
  font-size: 20rpx;
  color: var(--c-text-weaker);
}

.od__goods-amount {
  font-size: 25rpx;
  font-weight: 800;
}

.od__fee {
  display: flex;
  justify-content: space-between;
  font-size: 23rpx;
}

.od__fee-label {
  color: #7a7168;
}

.od__fee-cut {
  color: var(--c-primary-deep);
  font-weight: 700;
}

.od__paid {
  display: flex;
  justify-content: flex-end;
  align-items: baseline;
  gap: 12rpx;
}

.od__paid-label {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

/* 订单信息 */
.od__info {
  gap: 20rpx;
}

.od__info-row {
  display: flex;
  justify-content: space-between;
  gap: 24rpx;
  font-size: 23rpx;
}

.od__info-label {
  color: var(--c-text-weaker);
  flex-shrink: 0;
}

.od__info-value {
  font-weight: 600;
  text-align: right;
}

.od__no {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.od__copy {
  color: var(--c-primary);
  font-weight: 700;
}

.od__foot {
  height: 40rpx;
}

/* 底部操作 */
.od__bar {
  flex-shrink: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(28rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(28rpx + env(safe-area-inset-bottom));
  display: flex;
  gap: 24rpx;
}

.od__btn {
  flex: 1;
  text-align: center;
  border: 3rpx solid var(--c-border-btn);
  color: var(--c-text-2);
  font-size: 26rpx;
  font-weight: 700;
  padding: 22rpx 0;
  border-radius: 46rpx;
  background: #ffffff;
}
</style>
