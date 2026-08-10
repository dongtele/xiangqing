<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { appealReview, getMerchantReviews } from '@/services/api';
import { push, toast } from '@/utils/nav';
import type { MerchantReview, MerchantReviewSummary } from '@/models';

/** 47 · 评价管理：低分置顶提醒，与顾客端 19 评价页对应 */
const filter = ref<'all' | 'low'>('all');
const summary = ref<MerchantReviewSummary | null>(null);
const list = ref<MerchantReview[]>([]);
const loading = ref(true);

onShow(() => {
  load();
});

async function load(): Promise<void> {
  loading.value = true;
  const res = await getMerchantReviews(filter.value);
  summary.value = res.summary;
  list.value = res.list;
  loading.value = false;
}

function onFilter(): void {
  filter.value = filter.value === 'all' ? 'low' : 'all';
  load();
}

function onReply(id: string): void {
  push(`/pages/merchant/review-reply/index?id=${id}`);
}

async function onAppeal(id: string): Promise<void> {
  uni.showModal({
    title: '申诉这条评价？',
    content: '平台将核实是否为恶意评价，24 小时内给出结果',
    confirmColor: '#FF4A17',
    success: async (res) => {
      if (!res.confirm) return;
      const out = await appealReview(id);
      toast(out.message);
    },
  });
}

function stars(n: number): string {
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}
</script>

<template>
  <view class="rv">
    <wf-nav-bar :title="'顾客评价'" :right="filter === 'all' ? '筛选' : '看全部'" @righttap="onFilter" />

    <scroll-view class="rv__body" scroll-y>
      <view v-if="summary" class="card rv__summary">
        <view class="rv__score">
          <text class="rv__score-num">{{ summary.score }}</text>
          <text class="rv__score-label">综合评分</text>
        </view>
        <view class="flex1 col rv__dist">
          <view v-for="d in summary.dist" :key="d.label" class="rv__dist-row">
            <text class="rv__dist-label">{{ d.label }}</text>
            <view class="rv__bar">
              <view class="rv__bar-fill" :style="{ width: d.percent + '%' }" />
            </view>
            <text class="rv__dist-pct">{{ d.percent }}%</text>
          </view>
        </view>
      </view>

      <template v-if="loading">
        <view v-for="n in 2" :key="n" class="card rv__card">
          <view class="skeleton" style="width: 40%; height: 28rpx" />
          <view class="skeleton" style="width: 100%; height: 48rpx" />
        </view>
      </template>

      <template v-else-if="list.length">
        <view v-for="r in list" :key="r.id" class="card rv__card">
          <view class="row--between">
            <view class="row rv__head">
              <text class="rv__user">{{ r.user }}</text>
              <text class="rv__stars">{{ stars(r.stars) }}</text>
            </view>
            <text class="rv__time">{{ r.timeText }}</text>
          </view>

          <text class="rv__content">{{ r.content }}</text>
          <text class="rv__goods">{{ r.goodsText }}</text>

          <view v-if="r.reply" class="rv__reply">
            <text class="rv__reply-label">商家回复：</text>
            <text class="rv__reply-text">{{ r.reply }}</text>
          </view>

          <template v-else>
            <text v-if="r.lowScore" class="rv__warn">低分评价建议 24 小时内回复</text>
            <view class="rv__actions">
              <view class="pill pill--outline tap" @tap="onAppeal(r.id)">申诉</view>
              <view class="pill pill--primary tap" @tap="onReply(r.id)">回复</view>
            </view>
          </template>
        </view>
      </template>

      <view v-else class="empty">
        <text class="empty__text">还没有顾客评价</text>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.rv {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.rv__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx calc(40rpx + constant(safe-area-inset-bottom));
  padding: 20rpx 32rpx calc(40rpx + env(safe-area-inset-bottom));
}

.rv__summary {
  flex-direction: row;
  align-items: center;
  gap: 40rpx;
  margin-bottom: 20rpx;
}

.rv__score {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
  flex-shrink: 0;
}

.rv__score-num {
  font-size: 62rpx;
  font-weight: 800;
  color: var(--c-primary);
  line-height: 1;
}

.rv__score-label {
  font-size: 21rpx;
  color: var(--c-text-weaker);
}

.rv__dist {
  gap: 12rpx;
}

.rv__dist-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.rv__dist-label {
  font-size: 21rpx;
  color: var(--c-text-weaker);
  width: 70rpx;
  flex-shrink: 0;
}

.rv__bar {
  flex: 1;
  height: 12rpx;
  border-radius: 6rpx;
  background: var(--c-fill-3);
  overflow: hidden;
}

.rv__bar-fill {
  height: 100%;
  border-radius: 6rpx;
  background: var(--c-gold);
}

.rv__dist-pct {
  font-size: 21rpx;
  color: var(--c-text-weaker);
  width: 60rpx;
  text-align: right;
  flex-shrink: 0;
}

.rv__card {
  margin-bottom: 20rpx;
  gap: 16rpx;
}

.rv__head {
  gap: 16rpx;
}

.rv__user {
  font-size: 26rpx;
  font-weight: 800;
}

.rv__stars {
  font-size: 24rpx;
  color: var(--c-gold);
  letter-spacing: 2rpx;
}

.rv__time {
  font-size: 21rpx;
  color: var(--c-text-placeholder);
}

.rv__content {
  font-size: 26rpx;
  color: var(--c-text-2);
  line-height: 1.7;
}

.rv__goods {
  font-size: 22rpx;
  color: var(--c-text-placeholder);
}

.rv__reply {
  background: var(--c-fill-3);
  border-radius: 20rpx;
  padding: 20rpx 24rpx;
}

.rv__reply-label {
  font-size: 23rpx;
  font-weight: 800;
}

.rv__reply-text {
  font-size: 23rpx;
  color: var(--c-text-2);
}

.rv__warn {
  font-size: 22rpx;
  font-weight: 700;
  color: var(--c-primary);
}

.rv__actions {
  display: flex;
  justify-content: flex-end;
  gap: 20rpx;
}
</style>
