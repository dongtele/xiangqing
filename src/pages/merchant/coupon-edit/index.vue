<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getShopCouponDraft, saveShopCoupon } from '@/services/api';
import { back, toast } from '@/utils/nav';
import { fen2yuan2 } from '@/utils/money';
import type { ShopCouponDraft, ShopCouponKind } from '@/models';

/** 95 · 创建店铺优惠券：顶部实时预览券样式，改金额门槛立刻能看到效果 */
const KINDS: { key: ShopCouponKind; label: string; sub: string }[] = [
  { key: 'cash', label: '满减券', sub: '最常用' },
  { key: 'discount', label: '折扣券', sub: '按比例' },
  { key: 'delivery', label: '配送费券', sub: '减运费' },
];

const draft = ref<ShopCouponDraft | null>(null);

const amountText = computed(() => (draft.value ? fen2yuan2(draft.value.amount) : '0.00'));
const thresholdText = computed(() =>
  draft.value ? fen2yuan2(draft.value.threshold) : '0.00'
);
/** 预览券面：无门槛时不显示「满 X 可用」 */
const previewThreshold = computed(() => {
  if (!draft.value) return '';
  if (draft.value.kind === 'delivery') return '仅抵扣配送费';
  return draft.value.threshold > 0 ? `满 ${draft.value.threshold / 100} 可用` : '无门槛';
});

onLoad(async () => {
  draft.value = await getShopCouponDraft();
});

function onKind(key: ShopCouponKind): void {
  if (draft.value) draft.value.kind = key;
}

function onMoneyInput(field: 'amount' | 'threshold', e: Event): void {
  const val = (e as unknown as { detail: { value: string } }).detail.value;
  if (draft.value) draft.value[field] = Math.max(0, Math.round((Number(val) || 0) * 100));
}

function onRow(name: string): void {
  toast(`${name}接后端后开放`);
}

async function onSave(): Promise<void> {
  if (!draft.value) return;
  const res = await saveShopCoupon(draft.value);
  toast(res.message);
  if (res.ok) setTimeout(() => back(), 700);
}
</script>

<template>
  <view v-if="draft" class="ce">
    <wf-nav-bar title="创建优惠券" />

    <scroll-view class="ce__body" scroll-y>
      <!-- 实时预览 -->
      <view class="ce__preview">
        <view class="ce__face">
          <text class="ce__face-amount"
            ><text class="ce__face-yuan">￥</text>{{ draft.amount / 100 }}</text
          >
          <text class="ce__face-threshold">{{ previewThreshold }}</text>
        </view>
        <view class="ce__preview-meta">
          <text class="ce__preview-name">店铺通用券</text>
          <text class="ce__preview-sub">{{ draft.validText }}内有效 · 预览效果</text>
        </view>
      </view>

      <view class="card">
        <text class="t-section">券类型</text>
        <view class="ce__kinds">
          <view
            v-for="k in KINDS"
            :key="k.key"
            class="ce__kind tap-sm"
            :class="{ 'ce__kind--on': draft.kind === k.key }"
            @tap="onKind(k.key)"
          >
            <text class="ce__kind-label">{{ k.label }}</text>
            <text class="ce__kind-sub">{{ k.sub }}</text>
          </view>
        </view>
      </view>

      <view class="card card--flat">
        <view class="cell">
          <text class="cell__label">优惠金额</text>
          <view class="row ce__money">
            <text class="ce__money-yuan">￥</text>
            <input
              class="ce__money-input"
              type="digit"
              :value="amountText"
              @input="onMoneyInput('amount', $event)"
            />
          </view>
        </view>
        <view class="cell">
          <text class="cell__label">使用门槛</text>
          <view class="row ce__money">
            <text class="ce__money-yuan">满 ￥</text>
            <input
              class="ce__money-input"
              type="digit"
              :value="thresholdText"
              @input="onMoneyInput('threshold', $event)"
            />
          </view>
        </view>
        <view class="cell tap" @tap="onRow('发放总量')">
          <text class="cell__label">发放总量</text>
          <view class="cell__value"
            ><text>{{ draft.totalText }}</text
            ><text class="chevron">›</text></view
          >
        </view>
        <view class="cell tap" @tap="onRow('每人限领')">
          <text class="cell__label">每人限领</text>
          <view class="cell__value"
            ><text>{{ draft.perUserText }}</text
            ><text class="chevron">›</text></view
          >
        </view>
        <view class="cell tap" @tap="onRow('有效期')">
          <text class="cell__label">有效期</text>
          <view class="cell__value"
            ><text>{{ draft.validText }}</text
            ><text class="chevron">›</text></view
          >
        </view>
      </view>

      <view class="card">
        <view class="ce__switch">
          <view class="flex1 col ce__switch-text">
            <text class="ce__switch-name">仅新客可领</text>
            <text class="ce__switch-sub">从未在本店下单的顾客</text>
          </view>
          <wf-toggle :on="draft.newOnly" @change="draft.newOnly = $event" />
        </view>
        <view class="hairline" />
        <view class="ce__switch">
          <view class="flex1 col ce__switch-text">
            <text class="ce__switch-name">可与满减同享</text>
            <text class="ce__switch-sub">关闭后只能取其一</text>
          </view>
          <wf-toggle :on="draft.stackable" @change="draft.stackable = $event" />
        </view>
      </view>
    </scroll-view>

    <view class="ce__foot">
      <view class="btn btn--primary tap" @tap="onSave">保存并开始发放</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.ce {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ce__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx 0;
}

.card {
  margin-bottom: 20rpx;
}

.ce__preview {
  background: #fff;
  border-radius: 32rpx;
  overflow: hidden;
  display: flex;
  margin-bottom: 20rpx;
  box-shadow: 0 6rpx 20rpx rgba(32, 22, 15, 0.05);
}

.ce__face {
  width: 208rpx;
  background: var(--grad-main);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  flex-shrink: 0;
}

.ce__face-amount {
  font-size: 60rpx;
  font-weight: 800;
  line-height: 1.1;
}

.ce__face-yuan {
  font-size: 26rpx;
  font-weight: 700;
}

.ce__face-threshold {
  font-size: 20rpx;
  font-weight: 700;
  opacity: 0.9;
}

.ce__preview-meta {
  flex: 1;
  padding: 28rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8rpx;
  border-left: 3rpx dashed #f0e8df;
}

.ce__preview-name {
  font-size: 28rpx;
  font-weight: 800;
}

.ce__preview-sub {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.ce__kinds {
  display: flex;
  gap: 16rpx;
}

.ce__kind {
  flex: 1;
  border: 3rpx solid var(--c-line-2);
  border-radius: 28rpx;
  padding: 20rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.ce__kind--on {
  border-color: var(--c-primary);
  background: var(--c-primary-bg);
}

.ce__kind-label {
  font-size: 25rpx;
  font-weight: 800;
}

.ce__kind-sub {
  font-size: 20rpx;
  color: var(--c-text-weaker);
}

.ce__money {
  gap: 6rpx;
}

.ce__money-yuan {
  font-size: 25rpx;
  color: var(--c-text-weak);
  font-weight: 600;
}

.ce__money-input {
  width: 160rpx;
  text-align: right;
  font-size: 28rpx;
  font-weight: 800;
}

.ce__switch {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.ce__switch-text {
  gap: 4rpx;
}

.ce__switch-name {
  font-size: 27rpx;
  font-weight: 700;
}

.ce__switch-sub {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.ce__foot {
  flex-shrink: 0;
  padding: 20rpx 32rpx calc(24rpx + constant(safe-area-inset-bottom));
  padding: 20rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
}
</style>
