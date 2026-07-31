<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getStockGoods, restoreAllStock, toggleStock } from '@/services/api';
import { toast } from '@/utils/nav';
import type { StockGoods, StockTab } from '@/models';

/** 49 · 沽清与库存：今日库存、沽清、一键恢复 */
const TABS: { key: StockTab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'onSale', label: '在售' },
  { key: 'soldOut', label: '已沽清' },
];

const list = ref<StockGoods[]>([]);
const counts = ref<Record<StockTab, number>>({ all: 0, onSale: 0, soldOut: 0 });
const activeTab = ref<StockTab>('soldOut');

const rows = computed(() => {
  if (activeTab.value === 'onSale') return list.value.filter((g) => g.available);
  if (activeTab.value === 'soldOut') return list.value.filter((g) => !g.available);
  return list.value;
});

onShow(() => {
  load();
});

async function load(): Promise<void> {
  const res = await getStockGoods();
  list.value = res.list;
  counts.value = res.counts;
}

/** 沽清即时同步给顾客端（交付文档 State Management） */
async function onToggle(id: string): Promise<void> {
  await toggleStock(id);
  await load();
}

function onRestoreAll(): void {
  if (!counts.value.soldOut) {
    toast('当前没有沽清商品');
    return;
  }
  uni.showModal({
    title: '全部恢复？',
    content: `${counts.value.soldOut} 个沽清商品将重新上架销售`,
    confirmColor: '#FF4A17',
    success: async (res) => {
      if (!res.confirm) return;
      await restoreAllStock();
      toast('已全部恢复', 'success');
      await load();
    },
  });
}
</script>

<template>
  <view class="st">
    <wf-nav-bar title="沽清管理" right="全部恢复" @righttap="onRestoreAll" />

    <scroll-view class="st__body" scroll-y>
      <view class="st__tabs">
        <text
          v-for="t in TABS"
          :key="t.key"
          class="st__tab"
          :class="{ 'st__tab--on': activeTab === t.key }"
          @tap="activeTab = t.key"
          >{{ t.label }} {{ counts[t.key] }}</text
        >
      </view>

      <view
        v-for="g in rows"
        :key="g.id"
        class="st__row"
        :class="{ 'st__row--off': !g.available }"
      >
        <view class="st__img"><wf-thumb :src="g.image" :radius="20" /></view>
        <view class="flex1 col st__info">
          <text class="st__name">{{ g.name }}</text>
          <text class="st__meta">{{ g.categoryName }} · {{ g.soldTodayText }}</text>
          <text class="st__remain" :class="{ 'st__remain--off': !g.available }">{{
            g.available ? `剩 ${g.remain} 份` : '已沽清'
          }}</text>
        </view>
        <wf-toggle size="sm" :on="g.available" @change="onToggle(g.id)" />
      </view>

      <view v-if="!rows.length" class="empty">
        <text class="empty__text">该状态下暂无商品</text>
      </view>

      <view class="st__foot" />
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.st {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.st__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx 0;
}

.st__tabs {
  display: flex;
  gap: 16rpx;
  flex-wrap: wrap;
  margin-bottom: 20rpx;
}

.st__tab {
  font-size: 24rpx;
  font-weight: 600;
  color: var(--c-text-weak);
  background: #fff;
  border: 1px solid var(--c-line-3);
  padding: 12rpx 28rpx;
  border-radius: 30rpx;
}

.st__tab--on {
  font-weight: 800;
  color: #fff;
  background: var(--c-primary);
  border-color: var(--c-primary);
}

.st__row {
  background: #fff;
  border-radius: 28rpx;
  padding: 26rpx 28rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 20rpx;
}

.st__row--off {
  opacity: 0.72;
}

.st__img {
  width: 92rpx;
  height: 92rpx;
  border-radius: 20rpx;
  overflow: hidden;
  flex-shrink: 0;
}

.st__info {
  gap: 6rpx;
}

.st__name {
  font-size: 27rpx;
  font-weight: 800;
}

.st__meta {
  font-size: 21rpx;
  color: var(--c-text-weaker);
}

.st__remain {
  font-size: 22rpx;
  font-weight: 700;
  color: var(--c-text-3);
}

.st__remain--off {
  color: var(--c-danger);
}

.st__foot {
  height: 32rpx;
}
</style>
