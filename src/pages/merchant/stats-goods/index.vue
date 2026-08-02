<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getGoodsRank } from '@/services/api';
import { toast } from '@/utils/nav';
import type { GoodsRank, RankRange } from '@/models';

/** 87 · 商品销售排行：营业数据「商品排行」进入，排行 + 经营建议 */
const RANGES: { key: RankRange; label: string }[] = [
  { key: 'today', label: '今日' },
  { key: 'week', label: '近 7 天' },
  { key: 'month', label: '近 30 天' },
  { key: 'custom', label: '自定义' },
];

const range = ref<RankRange>('week');
const data = ref<GoodsRank | null>(null);

onLoad(() => {
  load();
});

async function load(): Promise<void> {
  data.value = await getGoodsRank(range.value);
}

function onRange(key: RankRange): void {
  if (key === range.value) return;
  if (key === 'custom') {
    toast('自定义区间接后端后开放');
    return;
  }
  range.value = key;
  load();
}
</script>

<template>
  <view class="gr">
    <wf-nav-bar title="商品销售排行" right="导出" @righttap="toast('导出的报表将发送到商家邮箱')" />

    <scroll-view class="gr__body" scroll-y>
      <view class="gr__ranges">
        <view
          v-for="r in RANGES"
          :key="r.key"
          class="gr__range tap-sm"
          :class="{ 'gr__range--on': range === r.key }"
          @tap="onRange(r.key)"
          >{{ r.label }}</view
        >
      </view>

      <view v-if="data" class="card">
        <view class="row--between">
          <text class="t-section">销量 TOP 商品</text>
          <text class="t-sub">{{ data.totalText }}</text>
        </view>

        <view v-for="row in data.rows" :key="row.rank" class="gr__row">
          <text class="gr__rank" :class="`gr__rank--${row.rank}`">{{ row.rank }}</text>
          <view class="flex1 col gr__info">
            <view class="row--between">
              <text class="gr__name">{{ row.name }}</text>
              <text class="gr__count">{{ row.countText }}</text>
            </view>
            <view class="gr__bar">
              <view class="gr__bar-fill" :style="{ width: row.percent + '%' }" />
            </view>
          </view>
          <text class="gr__amount">{{ row.amountText }}</text>
        </view>
      </view>

      <view v-if="data && data.tips.length" class="card">
        <text class="t-section">需要关注</text>
        <view v-for="(t, i) in data.tips" :key="i" class="gr__tip">
          <view class="gr__tip-dot" />
          <text class="gr__tip-text flex1">{{ t }}</text>
        </view>
      </view>

      <view v-if="data && !data.rows.length" class="empty">
        <text class="empty__text">{{ data.totalText }}</text>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.gr {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.gr__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx calc(40rpx + constant(safe-area-inset-bottom));
  padding: 20rpx 32rpx calc(40rpx + env(safe-area-inset-bottom));
}

.gr__body > .card {
  margin-bottom: 20rpx;
}

.gr__ranges {
  display: flex;
  gap: 16rpx;
  padding-bottom: 20rpx;
}

.gr__range {
  background: #fff;
  color: var(--c-text-2);
  font-size: 23rpx;
  font-weight: 600;
  padding: 12rpx 26rpx;
  border-radius: 28rpx;
}

.gr__range--on {
  background: var(--c-text);
  color: #fff;
  font-weight: 700;
}

.gr__row {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.gr__rank {
  width: 44rpx;
  height: 44rpx;
  border-radius: 14rpx;
  background: var(--c-fill-3);
  color: var(--c-text-weak);
  font-size: 24rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.gr__rank--1 {
  background: #ff3800;
  color: #fff;
}

.gr__rank--2 {
  background: #ff7b1c;
  color: #fff;
}

.gr__rank--3 {
  background: #ffb08f;
  color: #fff;
}

.gr__info {
  gap: 10rpx;
}

.gr__name {
  font-size: 26rpx;
  font-weight: 700;
}

.gr__count {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.gr__bar {
  height: 12rpx;
  border-radius: 6rpx;
  background: var(--c-fill-3);
  overflow: hidden;
}

.gr__bar-fill {
  height: 100%;
  border-radius: 6rpx;
  background: var(--grad-main);
}

.gr__amount {
  font-size: 25rpx;
  font-weight: 800;
  width: 130rpx;
  text-align: right;
  flex-shrink: 0;
}

.gr__tip {
  display: flex;
  gap: 16rpx;
}

.gr__tip-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: var(--c-primary);
  margin-top: 14rpx;
  flex-shrink: 0;
}

.gr__tip-text {
  font-size: 24rpx;
  color: var(--c-text-3);
  line-height: 1.7;
}
</style>
