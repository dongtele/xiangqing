<script setup lang="ts">
import { computed, ref } from 'vue';
import { onHide, onLoad, onShow, onUnload } from '@dcloudio/uni-app';
import { approveRefund, getMerchantRefund, rejectRefund } from '@/services/api';
import { fen2yuan2 } from '@/utils/money';
import { back, toast } from '@/utils/nav';
import type { Refund } from '@/models';

const REJECT_REASONS = [
  '餐品出餐时已核对，无质量问题',
  '已按订单备注制作，无漏送',
  '配送已按时完成，可提供配送轨迹',
  '其他（联系顾客协商）',
];

/** 48 · 退款审核：同意 / 驳回 + 凭证，超时自动同意 */
const refund = ref<Refund | null>(null);
const autoAgreeText = ref('');
let refundId = '';
let timer: ReturnType<typeof setInterval> | null = null;

const amountText = computed(() => (refund.value ? fen2yuan2(refund.value.amount) : '0.00'));
const handled = computed(() => !!refund.value && refund.value.status !== 'reviewing');
const itemRows = computed(() =>
  refund.value
    ? refund.value.items.map((i) => ({
        key: i.key,
        name: i.name,
        specText: `${i.specText}${i.specText ? ' ' : ''}×${i.qty}`,
        amountText: fen2yuan2(i.amount),
        image: i.image,
      }))
    : []
);

onLoad((o) => {
  refundId = (o && o.id) || '';
});

onShow(() => {
  load();
});

onHide(stopTick);
onUnload(stopTick);

function stopTick(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

async function load(): Promise<void> {
  const res = await getMerchantRefund(refundId);
  if (!res) {
    toast('退款单不存在');
    return;
  }
  refund.value = res;
  if (res.status === 'reviewing') startTick(res.autoAgreeIn);
  else stopTick();
}

/** 超时自动同意的倒计时，每秒刷新 */
function startTick(seconds: number): void {
  stopTick();
  let left = seconds;
  const render = (): void => {
    const h = Math.floor(left / 3600);
    const m = Math.floor((left % 3600) / 60);
    autoAgreeText.value =
      left <= 0
        ? '已超时，系统将自动同意退款'
        : `剩余 ${h > 0 ? `${h} 小时 ` : ''}${m} 分未处理将自动同意退款`;
  };
  render();
  timer = setInterval(() => {
    left -= 1;
    if (left <= 0) stopTick();
    render();
  }, 1000);
}

function onApprove(): void {
  uni.showModal({
    title: '同意退款？',
    content: `将原路退回 ￥${amountText.value} 到顾客微信零钱`,
    confirmColor: '#FF4A17',
    success: async (res) => {
      if (!res.confirm) return;
      await approveRefund(refundId);
      toast('已同意退款', 'success');
      back();
    },
  });
}

/** 驳回必须给出说明，顾客侧可见 */
function onReject(): void {
  uni.showActionSheet({
    itemList: REJECT_REASONS,
    success: async (res) => {
      await rejectRefund(refundId, REJECT_REASONS[res.tapIndex]);
      toast('已驳回并通知顾客');
      back();
    },
  });
}
</script>

<template>
  <view v-if="refund" class="rr">
    <wf-nav-bar title="退款申请" />

    <scroll-view class="rr__body" scroll-y>
      <view v-if="!handled" class="rr__countdown">{{ autoAgreeText }}</view>
      <view v-else class="rr__handled">本单已处理：{{ refund.statusText }}</view>

      <view class="card">
        <view class="row--between">
          <text class="cell__label">订单编号</text>
          <text class="cell__value">{{ refund.orderNo }}</text>
        </view>
        <view class="hairline" />
        <view class="row--between">
          <text class="cell__label">下单时间</text>
          <text class="cell__value">{{ refund.placedAtText }}</text>
        </view>
        <view class="hairline" />
        <view class="row--between">
          <text class="cell__label">申请金额</text>
          <text class="cell__value">￥{{ amountText }}</text>
        </view>
        <view class="hairline" />
        <view class="row--between">
          <text class="cell__label">退款类型</text>
          <text class="cell__value">{{ refund.typeText }}</text>
        </view>
      </view>

      <view class="card">
        <text class="t-section">退款原因</text>
        <text class="rr__reason"
          >{{ refund.reasonText }}{{ refund.desc ? `：${refund.desc}` : '' }}</text
        >
        <view v-if="refund.photos.length" class="rr__photos">
          <view v-for="(p, i) in refund.photos" :key="i" class="rr__photo">
            <wf-thumb :src="p" :radius="20" />
          </view>
        </view>
      </view>

      <view class="card">
        <text class="t-section">退款商品</text>
        <view v-for="item in itemRows" :key="item.key" class="rr__item">
          <view class="rr__item-img"><wf-thumb :src="item.image" :radius="20" /></view>
          <view class="flex1 col rr__item-info">
            <text class="rr__item-name">{{ item.name }}</text>
            <text class="rr__item-spec">{{ item.specText }}</text>
          </view>
          <text class="rr__item-amount">￥{{ item.amountText }}</text>
        </view>
      </view>

      <view class="rr__foot" />
    </scroll-view>

    <view v-if="!handled" class="rr__bar">
      <view class="rr__btn rr__btn--ghost tap" @tap="onReject">拒绝并说明</view>
      <view class="rr__btn rr__btn--primary tap" @tap="onApprove">同意退款</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.rr {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.rr__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx 0;
}

.rr__body > .card {
  margin-bottom: 20rpx;
}

.rr__countdown {
  background: var(--c-primary-bg);
  border: 1px solid var(--c-primary-line);
  border-radius: 28rpx;
  padding: 24rpx 28rpx;
  font-size: 25rpx;
  color: var(--c-primary-text-deep);
  font-weight: 700;
  margin-bottom: 20rpx;
}

.rr__handled {
  background: var(--c-fill-2);
  border-radius: 28rpx;
  padding: 24rpx 28rpx;
  font-size: 25rpx;
  color: var(--c-text-weak);
  font-weight: 700;
  margin-bottom: 20rpx;
}

.rr__reason {
  font-size: 25rpx;
  color: var(--c-text-2);
  line-height: 1.65;
  margin-top: -8rpx;
}

.rr__photos {
  display: flex;
  gap: 16rpx;
}

.rr__photo {
  width: 144rpx;
  height: 144rpx;
  border-radius: 20rpx;
  overflow: hidden;
  flex-shrink: 0;
}

.rr__item {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.rr__item-img {
  width: 88rpx;
  height: 88rpx;
  border-radius: 20rpx;
  overflow: hidden;
  flex-shrink: 0;
}

.rr__item-info {
  gap: 4rpx;
}

.rr__item-name {
  font-size: 26rpx;
  font-weight: 700;
}

.rr__item-spec {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.rr__item-amount {
  font-size: 26rpx;
  font-weight: 800;
  color: var(--c-primary-deep);
}

.rr__foot {
  height: 32rpx;
}

.rr__bar {
  flex-shrink: 0;
  background: #fff;
  border-top: 1px solid var(--c-img-placeholder);
  padding: 24rpx 32rpx;
  padding-bottom: calc(28rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(28rpx + env(safe-area-inset-bottom));
  display: flex;
  gap: 20rpx;
}

.rr__btn {
  flex: 1;
  height: 96rpx;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: 800;
}

.rr__btn--ghost {
  background: #fff;
  color: var(--c-text-2);
  border: 1px solid var(--c-border-btn);
}

.rr__btn--primary {
  background: var(--grad-main);
  color: #fff;
  box-shadow: var(--sh-primary-btn);
}
</style>
