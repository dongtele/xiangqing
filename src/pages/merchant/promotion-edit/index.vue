<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getPromotionDraft, savePromotion } from '@/services/api';
import { back, push, toast } from '@/utils/nav';
import type { PromotionDraft, PromotionType } from '@/models';

/** 65 · 新建满减活动：阶梯满减（最多 3 档）、生效时段与每日预算上限 */
const TYPES: { key: PromotionType; label: string }[] = [
  { key: 'full', label: '满减' },
  { key: 'discount', label: '折扣' },
  { key: 'second', label: '第二份半价' },
];

const MAX_TIERS = 3;
const draft = ref<PromotionDraft | null>(null);

onShow(() => {
  load();
});

async function load(): Promise<void> {
  // 从 66 选完商品返回时要拿到最新的「适用商品」文案
  draft.value = await getPromotionDraft();
}

function onType(key: PromotionType): void {
  if (draft.value) draft.value.type = key;
}

function onTierInput(id: string, field: 'threshold' | 'cut', e: Event): void {
  const val = (e as unknown as { detail: { value: string } }).detail.value;
  const tier = draft.value?.tiers.find((t) => t.id === id);
  if (tier) tier[field] = Math.max(0, Number(val) || 0) * 100;
}

function onAddTier(): void {
  if (!draft.value) return;
  if (draft.value.tiers.length >= MAX_TIERS) {
    toast(`最多 ${MAX_TIERS} 档`);
    return;
  }
  draft.value.tiers.push({ id: `t${Date.now()}`, threshold: 0, cut: 0 });
}

function onRemoveTier(id: string): void {
  if (!draft.value) return;
  if (draft.value.tiers.length <= 1) {
    toast('至少保留一档');
    return;
  }
  draft.value.tiers = draft.value.tiers.filter((t) => t.id !== id);
}

function onRow(key: string): void {
  if (key === 'goods') {
    push('/pages/merchant/promotion-goods/index');
    return;
  }
  toast('接后端后开放');
}

async function onSave(): Promise<void> {
  if (!draft.value) return;
  const bad = draft.value.tiers.find((t) => t.threshold <= 0 || t.cut <= 0 || t.cut >= t.threshold);
  if (bad) {
    toast('每档的门槛与减免都要大于 0，且减免小于门槛');
    return;
  }
  const res = await savePromotion(draft.value);
  toast(res.message);
  if (res.ok) setTimeout(() => back(), 700);
}
</script>

<template>
  <view v-if="draft" class="pe">
    <wf-nav-bar title="新建满减" right="保存" @righttap="onSave" />

    <scroll-view class="pe__body" scroll-y>
      <view class="card">
        <text class="t-section">活动类型</text>
        <view class="pe__types">
          <view
            v-for="t in TYPES"
            :key="t.key"
            class="pe__type tap-sm"
            :class="{ 'pe__type--on': draft.type === t.key }"
            @tap="onType(t.key)"
            >{{ t.label }}</view
          >
        </view>
      </view>

      <view class="card">
        <text class="t-section">优惠阶梯</text>
        <view v-for="t in draft.tiers" :key="t.id" class="pe__tier">
          <text class="pe__tier-label">满</text>
          <input
            class="pe__tier-input"
            type="number"
            :value="String(t.threshold / 100)"
            @input="onTierInput(t.id, 'threshold', $event)"
          />
          <text class="pe__tier-label">元，减</text>
          <input
            class="pe__tier-input"
            type="number"
            :value="String(t.cut / 100)"
            @input="onTierInput(t.id, 'cut', $event)"
          />
          <text class="pe__tier-label">元</text>
          <text class="pe__tier-del tap-sm" @tap="onRemoveTier(t.id)">✕</text>
        </view>
        <view class="pe__add tap-sm" @tap="onAddTier">＋ 添加阶梯（最多 {{ MAX_TIERS }} 档）</view>
      </view>

      <view class="card card--flat">
        <view class="cell tap" @tap="onRow('date')">
          <text class="cell__label">活动时间</text>
          <view class="cell__value"
            ><text>{{ draft.dateText }}</text
            ><text class="chevron">›</text></view
          >
        </view>
        <view class="cell tap" @tap="onRow('time')">
          <text class="cell__label">生效时段</text>
          <view class="cell__value"
            ><text>{{ draft.timeText }}</text
            ><text class="chevron">›</text></view
          >
        </view>
        <view class="cell tap" @tap="onRow('goods')">
          <view class="col pe__cell-text">
            <text class="cell__label">适用商品</text>
            <text class="pe__cell-sub">可指定分类或单品</text>
          </view>
          <view class="cell__value"
            ><text>{{ draft.goodsText }}</text
            ><text class="chevron">›</text></view
          >
        </view>
        <view class="cell tap" @tap="onRow('budget')">
          <view class="col pe__cell-text">
            <text class="cell__label">每日预算上限</text>
            <text class="pe__cell-sub">超出自动暂停</text>
          </view>
          <view class="cell__value"
            ><text>{{ draft.budgetText }}</text
            ><text class="chevron">›</text></view
          >
        </view>
      </view>

      <view class="pe__estimate">{{ draft.estimateText }}</view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.pe {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pe__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx calc(40rpx + constant(safe-area-inset-bottom));
  padding: 20rpx 32rpx calc(40rpx + env(safe-area-inset-bottom));
}

.card {
  margin-bottom: 20rpx;
}

.pe__types {
  display: flex;
  gap: 16rpx;
}

.pe__type {
  flex: 1;
  text-align: center;
  border: 3rpx solid var(--c-line-2);
  border-radius: 28rpx;
  padding: 18rpx 0;
  font-size: 25rpx;
  font-weight: 600;
  color: var(--c-text-2);
}

.pe__type--on {
  border-color: var(--c-primary);
  background: var(--c-primary-bg);
  color: var(--c-primary);
  font-weight: 800;
}

.pe__tier {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.pe__tier-label {
  font-size: 25rpx;
  color: var(--c-text-2);
  flex-shrink: 0;
}

.pe__tier-input {
  width: 120rpx;
  height: 68rpx;
  background: var(--c-fill-3);
  border-radius: 20rpx;
  text-align: center;
  font-size: 27rpx;
  font-weight: 800;
}

.pe__tier-del {
  margin-left: auto;
  font-size: 26rpx;
  color: var(--c-text-placeholder);
  padding: 0 8rpx;
}

.pe__add {
  border: 3rpx dashed var(--c-line-2);
  border-radius: 24rpx;
  padding: 22rpx;
  text-align: center;
  font-size: 24rpx;
  font-weight: 700;
  color: var(--c-text-weak);
}

.pe__cell-text {
  gap: 4rpx;
}

.pe__cell-sub {
  font-size: 21rpx;
  color: var(--c-text-weaker);
}

.pe__estimate {
  background: var(--c-primary-bg);
  border: 1px solid var(--c-primary-line);
  border-radius: 28rpx;
  padding: 24rpx 28rpx;
  font-size: 23rpx;
  color: var(--c-warn-text-2);
  line-height: 1.7;
}
</style>
