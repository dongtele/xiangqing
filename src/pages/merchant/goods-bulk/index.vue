<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { bulkAction, getBulkGoods } from '@/services/api';
import { back, toast } from '@/utils/nav';
import { chrome } from '@/utils/chrome';
import type { BulkGoods, BulkTab } from '@/models';

/** 93 · 商品批量管理：多选 + 批量上下架 / 改分类 / 删除 */
const TABS: { key: BulkTab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'hot', label: '热销' },
  { key: 'off', label: '已下架' },
  { key: 'soldOut', label: '沽清' },
];

const topPad = ref(96);
const list = ref<BulkGoods[]>([]);
const counts = ref<Record<BulkTab, number>>({ all: 0, hot: 0, off: 0, soldOut: 0 });
const activeTab = ref<BulkTab>('all');
const selected = ref<string[]>([]);

const allSelected = computed(
  () => list.value.length > 0 && selected.value.length === list.value.length
);

onShow(() => {
  topPad.value = chrome().capsuleBottom + 16;
  load();
});

async function load(): Promise<void> {
  const res = await getBulkGoods(activeTab.value);
  list.value = res.list;
  counts.value = res.counts;
  selected.value = selected.value.filter((id) => res.list.some((g) => g.id === id));
}

function onSwitchTab(tab: BulkTab): void {
  if (tab === activeTab.value) return;
  activeTab.value = tab;
  load();
}

function toggle(id: string): void {
  selected.value = selected.value.includes(id)
    ? selected.value.filter((x) => x !== id)
    : [...selected.value, id];
}

function onToggleAll(): void {
  selected.value = allSelected.value ? [] : list.value.map((g) => g.id);
}

function tabCount(tab: BulkTab): string {
  const n = counts.value[tab];
  return n ? ` ${n}` : '';
}

async function run(action: 'on' | 'off' | 'category' | 'delete'): Promise<void> {
  if (!selected.value.length) {
    toast('请先选择商品');
    return;
  }
  if (action === 'category') {
    toast('改分类：选择目标分类见 22 分类管理');
    return;
  }
  if (action === 'delete') {
    uni.showModal({
      title: `删除 ${selected.value.length} 个商品？`,
      content: '删除后顾客端立即不可见，历史订单不受影响',
      confirmText: '删除',
      confirmColor: '#D14343',
      success: async (res) => {
        if (!res.confirm) return;
        const r = await bulkAction(selected.value, 'delete');
        toast(`已删除 ${r.count} 个商品`);
        selected.value = [];
        await load();
      },
    });
    return;
  }
  const r = await bulkAction(selected.value, action);
  toast(`已${action === 'on' ? '上架' : '下架'} ${r.count} 个商品`, 'success');
  selected.value = [];
  await load();
}
</script>

<template>
  <view class="bk">
    <view class="bk__head" :style="{ paddingTop: topPad + 'px' }">
      <text class="bk__cancel tap" @tap="back()">取消</text>
      <text class="bk__title">批量管理</text>
      <text class="bk__all tap" @tap="onToggleAll">{{ allSelected ? '取消全选' : '全选' }}</text>
    </view>

    <scroll-view class="bk__body" scroll-y>
      <view class="bk__tabs">
        <text
          v-for="t in TABS"
          :key="t.key"
          class="bk__tab"
          :class="{ 'bk__tab--on': activeTab === t.key }"
          @tap="onSwitchTab(t.key)"
          >{{ t.label }}{{ tabCount(t.key) }}</text
        >
      </view>

      <view
        v-for="g in list"
        :key="g.id"
        class="bk__row tap"
        :class="{ 'bk__row--on': selected.includes(g.id), 'bk__row--off': g.offShelf }"
        @tap="toggle(g.id)"
      >
        <view class="bk__check" :class="{ 'bk__check--on': selected.includes(g.id) }">
          <wf-icon
            v-if="selected.includes(g.id)"
            name="check"
            :size="20"
            color="#FFFFFF"
            :weight="3.4"
          />
        </view>
        <view class="bk__img"><wf-thumb :src="g.image" :radius="20" /></view>
        <view class="flex1 col bk__info">
          <view class="row bk__name-row">
            <text class="bk__name">{{ g.name }}</text>
            <text v-if="g.offShelf" class="bk__tag">已下架</text>
          </view>
          <text class="bk__meta">{{ g.metaText }}</text>
        </view>
      </view>

      <view class="bk__foot" />
    </scroll-view>

    <view class="bk__bar">
      <text class="bk__count"
        >已选 <text class="bk__count-num">{{ selected.length }}</text> 个商品</text
      >
      <view class="bk__actions">
        <view class="bk__btn tap" @tap="run('on')">上架</view>
        <view class="bk__btn tap" @tap="run('off')">下架</view>
        <view class="bk__btn tap" @tap="run('category')">改分类</view>
        <view class="bk__btn bk__btn--danger tap" @tap="run('delete')">删除</view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.bk {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.bk__head {
  padding-left: 32rpx;
  padding-right: 32rpx;
  padding-bottom: 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.bk__cancel {
  font-size: 25rpx;
  color: var(--c-text-weak);
  font-weight: 600;
}

.bk__title {
  font-size: 34rpx;
  font-weight: 800;
}

.bk__all {
  font-size: 25rpx;
  font-weight: 800;
  color: var(--c-primary);
}

.bk__body {
  flex: 1;
  min-height: 0;
  padding: 0 32rpx;
}

.bk__tabs {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.bk__tab {
  background: #fff;
  color: #7a7168;
  font-size: 24rpx;
  font-weight: 600;
  padding: 12rpx 28rpx;
  border-radius: 30rpx;
}

.bk__tab--on {
  background: var(--c-text);
  color: #fff;
  font-weight: 700;
}

.bk__row {
  background: #fff;
  border-radius: 28rpx;
  padding: 24rpx 28rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 20rpx;
  border: 3rpx solid transparent;
}

.bk__row--on {
  border-color: var(--c-primary);
}

.bk__row--off {
  opacity: 0.7;
}

.bk__check {
  width: 40rpx;
  height: 40rpx;
  border-radius: 10rpx;
  border: 3rpx solid var(--c-line-5);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bk__check--on {
  background: var(--c-primary);
  border-color: var(--c-primary);
}

.bk__img {
  width: 88rpx;
  height: 88rpx;
  border-radius: 20rpx;
  overflow: hidden;
  flex-shrink: 0;
}

.bk__info {
  gap: 6rpx;
}

.bk__name-row {
  gap: 12rpx;
}

.bk__name {
  font-size: 27rpx;
  font-weight: 800;
}

.bk__tag {
  font-size: 20rpx;
  font-weight: 700;
  color: var(--c-text-weak);
  background: var(--c-fill-2);
  padding: 4rpx 12rpx;
  border-radius: 10rpx;
}

.bk__meta {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.bk__foot {
  height: 32rpx;
}

.bk__bar {
  flex-shrink: 0;
  background: #fff;
  border-radius: 36rpx 36rpx 0 0;
  padding: 28rpx 32rpx;
  padding-bottom: calc(32rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  box-shadow: 0 -12rpx 40rpx rgba(32, 22, 15, 0.06);
}

.bk__count {
  font-size: 24rpx;
  color: var(--c-text-weak);
}

.bk__count-num {
  font-weight: 800;
  color: var(--c-primary);
}

.bk__actions {
  display: flex;
  gap: 16rpx;
}

.bk__btn {
  flex: 1;
  height: 80rpx;
  border-radius: 40rpx;
  border: 3rpx solid var(--c-line-2);
  color: var(--c-text-2);
  font-size: 25rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bk__btn--danger {
  border-color: transparent;
  background: var(--c-danger-bg);
  color: var(--c-danger);
}
</style>
