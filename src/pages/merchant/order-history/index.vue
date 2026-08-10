<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getHistoryOrders } from '@/services/api';
import { push, toast } from '@/utils/nav';
import type { HistoryFilter, HistoryOrder, HistorySummary } from '@/models';

/** 91 · 历史订单查询：按订单号 / 手机尾号 / 取餐码检索，可按时间、状态、渠道筛选 */
const keyword = ref('');
const list = ref<HistoryOrder[]>([]);
const filter = ref<HistoryFilter | null>(null);
const summary = ref<HistorySummary | null>(null);
const loading = ref(true);

onLoad(() => {
  load();
});

async function load(): Promise<void> {
  loading.value = true;
  const res = await getHistoryOrders(keyword.value);
  list.value = res.list;
  filter.value = res.filter;
  summary.value = res.summary;
  loading.value = false;
}

function onSearchInput(e: Event): void {
  keyword.value = (e as unknown as { detail: { value: string } }).detail.value;
  load();
}

function onFilter(name: string): void {
  toast(`${name}筛选接后端后开放`);
}

function onExport(): void {
  toast('导出的账单将发送到商家邮箱');
}
</script>

<template>
  <view class="oh">
    <view class="oh__header">
      <wf-nav-bar title="历史订单" right="导出" bg="#FFFFFF" @righttap="onExport" />

      <view class="oh__search">
        <wf-icon name="search" :size="32" color="#A39890" />
        <input
          class="oh__input"
          :value="keyword"
          placeholder="订单号 / 手机尾号 / 取餐码"
          placeholder-class="oh__ph"
          @input="onSearchInput"
        />
      </view>

      <view v-if="filter" class="oh__filters">
        <view class="oh__filter tap-sm" @tap="onFilter('日期')">{{ filter.dateText }} ▾</view>
        <view class="oh__filter tap-sm" @tap="onFilter('状态')">{{ filter.statusText }} ▾</view>
        <view class="oh__filter tap-sm" @tap="onFilter('渠道')">{{ filter.channelText }} ▾</view>
      </view>
    </view>

    <scroll-view class="oh__body" scroll-y>
      <view v-if="summary" class="oh__summary">
        <text class="oh__summary-main">{{ summary.countText }} · {{ summary.incomeText }}</text>
        <text class="oh__summary-sub">{{ summary.refundText }}</text>
      </view>

      <template v-if="loading">
        <view v-for="n in 3" :key="n" class="card oh__card">
          <view class="skeleton" style="width: 60%; height: 28rpx" />
          <view class="skeleton" style="width: 90%; height: 24rpx" />
        </view>
      </template>

      <template v-else-if="list.length">
        <view
          v-for="o in list"
          :key="o.id"
          class="card oh__card tap"
          @tap="push(`/pages/merchant/order-detail/index?id=${o.id}`)"
        >
          <view class="row--between">
            <text class="oh__no">{{ o.orderNo }}</text>
            <text class="oh__status" :class="`oh__status--${o.statusTone}`">{{ o.statusText }}</text>
          </view>
          <view class="row--between">
            <text class="oh__meta">{{ o.metaText }}</text>
            <view class="row oh__amount">
              <text class="oh__amount-num">￥{{ o.amountText }}</text>
              <text v-if="o.refundText" class="oh__refund">{{ o.refundText }}</text>
            </view>
          </view>
          <!-- 直接列出点了什么，一行文字挤在一起看不清 -->
          <view v-if="o.lines.length" class="oh__lines">
            <view v-for="(line, i) in o.lines" :key="i" class="oh__line">
              <text class="flex1 ellipsis">{{
                line.specText ? `${line.name}（${line.specText}）` : line.name
              }}</text>
              <text class="oh__line-qty">×{{ line.qty }}</text>
            </view>
          </view>
        </view>
      </template>

      <view v-else class="empty">
        <text class="empty__text">没有匹配的订单，换个关键词试试</text>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.oh {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.oh__header {
  background: #ffffff;
  padding-bottom: 24rpx;
  flex-shrink: 0;
  box-shadow: 0 4rpx 20rpx rgba(32, 22, 15, 0.04);
}

.oh__search {
  margin: 0 32rpx 20rpx;
  background: #f1eee9;
  border-radius: 26rpx;
  height: 68rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 0 24rpx;
}

.oh__input {
  flex: 1;
  font-size: 25rpx;
  height: 100%;
}

.oh__ph {
  color: var(--c-text-placeholder);
}

.oh__filters {
  display: flex;
  gap: 16rpx;
  padding: 0 32rpx;
}

.oh__filter {
  background: #f1eee9;
  color: var(--c-text-2);
  font-size: 23rpx;
  font-weight: 600;
  padding: 12rpx 24rpx;
  border-radius: 24rpx;
}

.oh__body {
  flex: 1;
  min-height: 0;
  padding: 24rpx 32rpx calc(40rpx + constant(safe-area-inset-bottom));
  padding: 24rpx 32rpx calc(40rpx + env(safe-area-inset-bottom));
}

.oh__summary {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 0 8rpx 20rpx;
}

.oh__summary-main {
  font-size: 26rpx;
  font-weight: 800;
}

.oh__summary-sub {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.oh__card {
  margin-bottom: 20rpx;
  gap: 14rpx;
}

.oh__no {
  font-size: 27rpx;
  font-weight: 800;
}

.oh__status {
  font-size: 23rpx;
  font-weight: 800;
}

.oh__status--done {
  color: var(--c-success-deep);
}

.oh__status--partial {
  color: var(--c-primary);
}

.oh__status--cancelled {
  color: var(--c-text-weaker);
}

.oh__meta {
  font-size: 23rpx;
  color: var(--c-text-weaker);
}

.oh__amount {
  gap: 12rpx;
}

.oh__amount-num {
  font-size: 27rpx;
  font-weight: 800;
}

.oh__refund {
  font-size: 22rpx;
  font-weight: 700;
  color: var(--c-primary);
}

.oh__lines {
  background: #faf7f2;
  border-radius: 20rpx;
  padding: 18rpx 22rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.oh__line {
  display: flex;
  align-items: center;
  gap: 20rpx;
  font-size: 23rpx;
  color: var(--c-text-2);
}

.oh__line-qty {
  font-size: 22rpx;
  color: var(--c-text-placeholder);
}
</style>
