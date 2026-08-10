<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getShopReviews } from '@/services/api';
import type { Review, ReviewSummary } from '@/models';

/** 82 · 店铺全部评价：评分分布、标签筛选、商家回复 */
const summary = ref<ReviewSummary | null>(null);
const list = ref<Review[]>([]);
const activeFilter = ref('all');

onLoad(() => {
  load();
});

async function load(): Promise<void> {
  const res = await getShopReviews(activeFilter.value);
  summary.value = res.summary;
  list.value = res.list;
}

function onFilter(key: string): void {
  if (key === activeFilter.value) return;
  activeFilter.value = key;
  load();
}

function stars(n: number): string {
  return '★★★★★☆☆☆☆☆'.slice(5 - n, 10 - n);
}
</script>

<template>
  <view v-if="summary" class="rv">
    <wf-nav-bar title="全部评价" />

    <scroll-view class="rv__body" scroll-y>
      <!-- 评分概览 -->
      <view class="card rv__summary">
        <view class="col rv__score">
          <text class="rv__score-num">{{ summary.score }}</text>
          <text class="rv__stars">★★★★★</text>
          <text class="rv__total">{{ summary.total.toLocaleString() }} 条</text>
        </view>
        <view class="flex1 col rv__dims">
          <view v-for="d in summary.dims" :key="d.label" class="rv__dim">
            <text class="rv__dim-label">{{ d.label }}</text>
            <view class="rv__dim-bar">
              <view class="rv__dim-fill" :style="{ width: d.percent + '%' }" />
            </view>
            <text class="rv__dim-value">{{ d.value }}</text>
          </view>
        </view>
      </view>

      <!-- 标签筛选 -->
      <view class="rv__filters">
        <text
          v-for="f in summary.filters"
          :key="f.key"
          class="rv__filter"
          :class="{ 'rv__filter--on': activeFilter === f.key }"
          @tap="onFilter(f.key)"
          >{{ f.label }} {{ f.count }}</text
        >
      </view>

      <!-- 评价列表 -->
      <view v-for="r in list" :key="r.id" class="card rv__item">
        <view class="rv__head">
          <view class="rv__avatar" :class="{ 'rv__avatar--anon': r.anonymous }">{{
            r.avatarText
          }}</view>
          <view class="flex1 col rv__who">
            <text class="rv__name">{{ r.name }}</text>
            <text class="rv__meta">{{ stars(r.stars) }} · {{ r.dateText }}</text>
          </view>
          <text v-if="r.repeatText" class="rv__repeat">{{ r.repeatText }}</text>
        </view>

        <text class="rv__text">{{ r.text }}</text>

        <view v-if="r.photos.length" class="rv__photos">
          <view v-for="(p, i) in r.photos" :key="i" class="rv__photo">
            <wf-thumb :src="p" :radius="20" />
          </view>
        </view>

        <view v-if="r.reply" class="rv__reply">
          <text class="rv__reply-label">商家回复：</text>{{ r.reply }}
        </view>
      </view>

      <view v-if="!list.length" class="empty">
        <text class="empty__text">该筛选下暂无评价</text>
      </view>

      <view class="rv__foot" />
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
  padding: 20rpx 32rpx 0;
}

.card {
  margin-bottom: 20rpx;
}

.rv__summary {
  flex-direction: row;
  align-items: center;
  gap: 36rpx;
}

.rv__score {
  align-items: center;
  gap: 4rpx;
}

.rv__score-num {
  font-size: 60rpx;
  font-weight: 800;
  color: var(--c-primary);
  letter-spacing: -2rpx;
}

.rv__stars {
  font-size: 22rpx;
  color: var(--c-warn);
}

.rv__total {
  font-size: 21rpx;
  color: var(--c-text-weaker);
}

.rv__dims {
  gap: 10rpx;
}

.rv__dim {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.rv__dim-label {
  font-size: 21rpx;
  color: var(--c-text-weaker);
  width: 52rpx;
}

.rv__dim-bar {
  flex: 1;
  height: 10rpx;
  border-radius: 6rpx;
  background: var(--c-fill-2);
  overflow: hidden;
}

.rv__dim-fill {
  height: 100%;
  border-radius: 6rpx;
  background: var(--c-warn);
}

.rv__dim-value {
  font-size: 21rpx;
  font-weight: 700;
}

.rv__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.rv__filter {
  background: #fff;
  color: #7a7168;
  font-size: 23rpx;
  font-weight: 600;
  padding: 12rpx 26rpx;
  border-radius: 28rpx;
}

.rv__filter--on {
  background: var(--c-primary);
  color: #fff;
  font-weight: 700;
}

.rv__head {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.rv__avatar {
  width: 68rpx;
  height: 68rpx;
  border-radius: 50%;
  background: var(--c-primary-bg);
  color: var(--c-primary);
  font-size: 26rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rv__avatar--anon {
  background: var(--c-fill-2);
  color: var(--c-text-weak);
}

.rv__who {
  gap: 2rpx;
}

.rv__name {
  font-size: 25rpx;
  font-weight: 700;
}

.rv__meta {
  font-size: 21rpx;
  color: var(--c-warn);
}

.rv__repeat {
  font-size: 21rpx;
  color: var(--c-text-placeholder);
}

.rv__text {
  font-size: 25rpx;
  color: var(--c-text-2);
  line-height: 1.65;
}

.rv__photos {
  display: flex;
  gap: 16rpx;
}

.rv__photo {
  width: 128rpx;
  height: 128rpx;
  border-radius: 20rpx;
  overflow: hidden;
  flex-shrink: 0;
}

.rv__reply {
  background: var(--c-fill);
  border-radius: 24rpx;
  padding: 20rpx 24rpx;
  font-size: 23rpx;
  color: var(--c-text-3);
  line-height: 1.6;
}

.rv__reply-label {
  font-weight: 800;
  color: var(--c-text);
}

.rv__foot {
  height: 32rpx;
}
</style>
