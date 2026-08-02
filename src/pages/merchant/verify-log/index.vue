<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getVerifyLog, urgePickup } from '@/services/api';
import { push, toast } from '@/utils/nav';
import type { VerifyLogTab, VerifyRecord, VerifyStats } from '@/models';

/** 96 · 核销记录：核销页下层，含废码与超时未取的催单 */
const TABS: { key: VerifyLogTab; label: string }[] = [
  { key: 'today', label: '今日' },
  { key: 'yesterday', label: '昨日' },
  { key: 'week', label: '近 7 天' },
];

const activeTab = ref<VerifyLogTab>('today');
const stats = ref<VerifyStats | null>(null);
const list = ref<VerifyRecord[]>([]);
const loading = ref(true);

onShow(() => {
  load();
});

async function load(): Promise<void> {
  loading.value = true;
  const res = await getVerifyLog(activeTab.value);
  stats.value = res.stats;
  list.value = res.list;
  loading.value = false;
}

function onSwitchTab(key: VerifyLogTab): void {
  if (key === activeTab.value) return;
  activeTab.value = key;
  load();
}

async function onUrge(id: string): Promise<void> {
  const res = await urgePickup(id);
  toast(res.message);
}
</script>

<template>
  <view class="vl">
    <wf-nav-bar title="核销记录" />

    <scroll-view class="vl__body" scroll-y>
      <view v-if="stats" class="vl__stats">
        <view class="vl__stat">
          <text class="vl__stat-label">今日核销</text>
          <text class="vl__stat-value">{{ stats.countText }}</text>
        </view>
        <view class="vl__stat">
          <text class="vl__stat-label">核销金额</text>
          <text class="vl__stat-value">{{ stats.amountText }}</text>
        </view>
        <view class="vl__stat">
          <text class="vl__stat-label">待核销</text>
          <text class="vl__stat-value vl__stat-value--warn">{{ stats.pendingText }}</text>
        </view>
      </view>

      <view class="vl__filters">
        <view
          v-for="t in TABS"
          :key="t.key"
          class="vl__filter tap-sm"
          :class="{ 'vl__filter--on': activeTab === t.key }"
          @tap="onSwitchTab(t.key)"
          >{{ t.label }}</view
        >
      </view>

      <template v-if="loading">
        <view class="card">
          <view v-for="n in 3" :key="n" class="skeleton" style="width: 100%; height: 88rpx" />
        </view>
      </template>

      <view v-else-if="list.length" class="card vl__list">
        <view v-for="(r, i) in list" :key="r.id" class="col">
          <view v-if="i" class="hairline vl__line" />
          <view class="vl__row">
            <view class="vl__code" :class="`vl__code--${r.state}`">{{ r.code }}</view>
            <view class="flex1 col vl__text">
              <text class="vl__title">{{ r.title }}</text>
              <text class="vl__meta">{{ r.metaText }}</text>
            </view>
            <view v-if="r.state === 'pending'" class="pill pill--outline-primary tap" @tap="onUrge(r.id)"
              >催取餐</view
            >
            <text v-else class="vl__amount">￥{{ r.amountText }}</text>
          </view>
        </view>
      </view>

      <view v-else class="empty">
        <text class="empty__text">这个时间段还没有核销记录</text>
      </view>
    </scroll-view>

    <view class="vl__foot">
      <view class="btn btn--primary tap" @tap="push('/pages/merchant/verify/index')">扫码核销</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.vl {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.vl__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx 0;
}

.vl__stats {
  background: #fff;
  border-radius: 36rpx;
  padding: 32rpx;
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.vl__stat {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.vl__stat-label {
  font-size: 21rpx;
  color: var(--c-text-weaker);
}

.vl__stat-value {
  font-size: 44rpx;
  font-weight: 800;
}

.vl__stat-value--warn {
  color: var(--c-primary);
}

.vl__filters {
  display: flex;
  gap: 16rpx;
  padding-bottom: 20rpx;
}

.vl__filter {
  background: #fff;
  color: var(--c-text-2);
  font-size: 24rpx;
  font-weight: 600;
  padding: 12rpx 28rpx;
  border-radius: 30rpx;
}

.vl__filter--on {
  background: var(--c-text);
  color: #fff;
  font-weight: 700;
}

.vl__list {
  gap: 24rpx;
}

.vl__line {
  margin-bottom: 24rpx;
}

.vl__row {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.vl__code {
  width: 88rpx;
  height: 88rpx;
  border-radius: 24rpx;
  background: var(--c-primary-bg);
  color: var(--c-primary);
  font-size: 26rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.vl__code--void {
  background: var(--c-fill-3);
  color: var(--c-text-weaker);
}

.vl__code--pending {
  background: var(--c-warn-bg);
  color: var(--c-warn-text);
}

.vl__text {
  gap: 4rpx;
}

.vl__title {
  font-size: 26rpx;
  font-weight: 800;
}

.vl__meta {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.vl__amount {
  font-size: 26rpx;
  font-weight: 800;
  flex-shrink: 0;
}

.vl__foot {
  flex-shrink: 0;
  padding: 20rpx 32rpx calc(24rpx + constant(safe-area-inset-bottom));
  padding: 20rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
}
</style>
