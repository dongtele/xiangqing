<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getAftersaleOptions, trialRefund } from '@/services/api';
import { useAftersaleStore } from '@/stores/aftersale';
import { fen2yuan2 } from '@/utils/money';
import { back, toast } from '@/utils/nav';

/**
 * 56 · 选择退款商品：勾选部分商品，实时算退款额。
 *
 * 顺序说明：交付文档写的是 20 → 56，但设计稿 56 的主按钮是「下一步 · 填写原因」，
 * 说明 56 在 20 之前。实现折中为：06 →「申请售后」进 20，20 里「退款商品」一行可进 56
 * 勾选部分商品，选完回到 20，退款金额随之重算 —— 文档的顺序与设计稿的按钮语义都保住。
 */
const draft = useAftersaleStore();

const partialTip = ref('');
const itemsAmountText = ref('0.00');
const couponShareText = ref('0.00');
const refundText = ref('0.00');
let orderId = '';

const items = computed(() =>
  draft.items.map((i) => ({ ...i, amountText: fen2yuan2(i.amount) }))
);

onLoad((o) => {
  orderId = (o && o.id) || '';
});

onShow(async () => {
  const opts = await getAftersaleOptions(orderId);
  if (!opts) {
    toast('订单不存在');
    return;
  }
  partialTip.value = opts.partialTip;
  if (!draft.isFor(orderId)) draft.start(orderId, opts.items);
  await refreshTrial();
});

async function refreshTrial(): Promise<void> {
  const trial = await trialRefund(orderId, draft.items);
  itemsAmountText.value = fen2yuan2(trial.itemsAmount);
  couponShareText.value = fen2yuan2(trial.couponShare);
  refundText.value = fen2yuan2(trial.refundAmount);
}

function onToggle(key: string): void {
  draft.toggleItem(key);
  refreshTrial();
}

function onNext(): void {
  if (!draft.checkedItems.length) {
    toast('请至少选择一件商品');
    return;
  }
  back();
}
</script>

<template>
  <view class="ri">
    <wf-nav-bar title="选择退款商品" />

    <scroll-view class="ri__body" scroll-y>
      <view class="ri__tip">{{ partialTip }}</view>

      <view
        v-for="item in items"
        :key="item.key"
        class="ri__item tap"
        :class="{ 'ri__item--on': item.checked }"
        @tap="onToggle(item.key)"
      >
        <view class="ri__check" :class="{ 'ri__check--on': item.checked }">
          <wf-icon v-if="item.checked" name="check" :size="22" color="#FFFFFF" :weight="3.4" />
        </view>
        <view class="ri__img"><wf-thumb :src="item.image" :radius="20" /></view>
        <view class="flex1 col ri__info">
          <text class="ri__name">{{ item.name }}</text>
          <text class="ri__spec">{{ item.specText || `×${item.qty}` }}</text>
        </view>
        <text class="ri__amount">￥{{ item.amountText }}</text>
      </view>

      <view class="card">
        <view class="row--between">
          <text class="cell__label">商品金额</text>
          <text class="cell__value">￥{{ itemsAmountText }}</text>
        </view>
        <view class="hairline" />
        <view class="row--between">
          <text class="cell__label">优惠分摊</text>
          <text class="cell__value">-￥{{ couponShareText }}</text>
        </view>
        <view class="hairline" />
        <view class="row--between">
          <text class="ri__total-label">预计退款</text>
          <text class="ri__total">￥{{ refundText }}</text>
        </view>
      </view>

      <view class="ri__foot" />
    </scroll-view>

    <view class="ri__bar">
      <view class="btn btn--primary tap" @tap="onNext">下一步 · 填写原因</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.ri {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ri__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx 0;
}

.ri__tip {
  background: var(--c-primary-bg);
  border: 1px solid var(--c-primary-line);
  border-radius: 28rpx;
  padding: 22rpx 28rpx;
  font-size: 24rpx;
  color: var(--c-primary-text-deep);
  line-height: 1.6;
  margin-bottom: 20rpx;
}

.ri__item {
  background: #fff;
  border-radius: 28rpx;
  padding: 26rpx 28rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
  border: 3rpx solid transparent;
  margin-bottom: 20rpx;
}

.ri__item--on {
  border-color: var(--c-primary);
}

.ri__check {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 3rpx solid var(--c-line-5);
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ri__check--on {
  border-color: var(--c-primary);
  background: var(--c-primary);
}

.ri__img {
  width: 92rpx;
  height: 92rpx;
  border-radius: 20rpx;
  overflow: hidden;
  flex-shrink: 0;
}

.ri__info {
  gap: 6rpx;
}

.ri__name {
  font-size: 27rpx;
  font-weight: 800;
}

.ri__spec {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.ri__amount {
  font-size: 26rpx;
  font-weight: 800;
  color: var(--c-primary-deep);
}

.ri__total-label {
  font-size: 27rpx;
  font-weight: 800;
}

.ri__total {
  font-size: 38rpx;
  font-weight: 800;
  color: var(--c-primary-deep);
}

.ri__foot {
  height: 32rpx;
}

.ri__bar {
  flex-shrink: 0;
  background: #fff;
  border-top: 1px solid var(--c-img-placeholder);
  padding: 24rpx 32rpx;
  padding-bottom: calc(28rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(28rpx + env(safe-area-inset-bottom));
}
</style>
