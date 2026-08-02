<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getPromoGoods, savePromoGoods } from '@/services/api';
import { back } from '@/utils/nav';
import type { PromoGoods } from '@/models';

/** 66 · 选择适用商品：活动配置内层，按分类批量勾选或搜索单品 */
const all = ref<PromoGoods[]>([]);
const categories = ref<string[]>([]);
const activeCategory = ref('');
const keyword = ref('');

const shown = computed(() => {
  const kw = keyword.value.trim();
  if (kw) return all.value.filter((g) => g.name.indexOf(kw) >= 0);
  if (!activeCategory.value) return all.value;
  return all.value.filter((g) => g.categoryName === activeCategory.value);
});

const checkedCount = computed(() => all.value.filter((g) => g.checked).length);
const allChecked = computed(() => shown.value.length > 0 && shown.value.every((g) => g.checked));

onLoad(async () => {
  const res = await getPromoGoods();
  all.value = res.list;
  categories.value = res.categories;
  activeCategory.value = res.categories[0] || '';
});

function onSearchInput(e: Event): void {
  keyword.value = (e as unknown as { detail: { value: string } }).detail.value;
}

function onToggle(id: string): void {
  const g = all.value.find((x) => x.id === id);
  if (g) g.checked = !g.checked;
}

/** 全选只作用于当前可见的一批，符合「按分类批量勾选」的设计意图 */
function onToggleAll(): void {
  const next = !allChecked.value;
  const ids = new Set(shown.value.map((g) => g.id));
  all.value.forEach((g) => {
    if (ids.has(g.id)) g.checked = next;
  });
}

async function onConfirm(): Promise<void> {
  await savePromoGoods(all.value.filter((g) => g.checked).map((g) => g.id));
  back();
}
</script>

<template>
  <view class="pg">
    <view class="pg__header">
      <wf-nav-bar
        title="选择商品"
        :right="allChecked ? '取消全选' : '全选'"
        bg="#FFFFFF"
        @righttap="onToggleAll"
      />
      <view class="pg__search">
        <wf-icon name="search" :size="32" color="#A39890" />
        <input
          class="pg__input"
          :value="keyword"
          placeholder="搜索商品名称"
          placeholder-class="pg__ph"
          @input="onSearchInput"
        />
      </view>
    </view>

    <view v-if="!keyword" class="pg__cats">
      <view
        v-for="c in categories"
        :key="c"
        class="pg__cat tap-sm"
        :class="{ 'pg__cat--on': activeCategory === c }"
        @tap="activeCategory = c"
        >{{ c }}</view
      >
    </view>

    <scroll-view class="pg__body" scroll-y>
      <view v-if="shown.length" class="card card--flat">
        <view v-for="g in shown" :key="g.id" class="pg__row tap" @tap="onToggle(g.id)">
          <view class="pg__check" :class="{ 'pg__check--on': g.checked }">
            <wf-icon v-if="g.checked" name="check" :size="24" color="#FFFFFF" :weight="2.6" />
          </view>
          <text class="pg__name flex1">{{ g.name }}</text>
          <text class="pg__price">￥{{ g.priceText }}</text>
        </view>
      </view>

      <view v-else class="empty">
        <text class="empty__text">没有匹配的商品</text>
      </view>
    </scroll-view>

    <view class="pg__foot">
      <text class="pg__count">已选 <text class="pg__count-num">{{ checkedCount }}</text> 个商品</text>
      <view class="pg__confirm tap" @tap="onConfirm">确定</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.pg {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pg__header {
  background: #ffffff;
  padding-bottom: 20rpx;
  flex-shrink: 0;
}

.pg__search {
  margin: 0 32rpx;
  background: #f1eee9;
  border-radius: 26rpx;
  height: 68rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 0 24rpx;
}

.pg__input {
  flex: 1;
  font-size: 25rpx;
  height: 100%;
}

.pg__ph {
  color: var(--c-text-placeholder);
}

.pg__cats {
  display: flex;
  gap: 16rpx;
  padding: 20rpx 32rpx;
  flex-shrink: 0;
  overflow-x: auto;
  white-space: nowrap;
}

.pg__cat {
  background: #fff;
  color: var(--c-text-2);
  font-size: 23rpx;
  font-weight: 600;
  padding: 12rpx 26rpx;
  border-radius: 26rpx;
  flex-shrink: 0;
}

.pg__cat--on {
  background: var(--c-text);
  color: #fff;
  font-weight: 700;
}

.pg__body {
  flex: 1;
  min-height: 0;
  padding: 0 32rpx;
}

.pg__row {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 28rpx 32rpx;
}

.pg__row + .pg__row {
  border-top: 1px solid #f7f3ee;
}

.pg__check {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 3rpx solid var(--c-line-2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pg__check--on {
  background: var(--c-primary);
  border-color: var(--c-primary);
}

.pg__name {
  font-size: 27rpx;
  font-weight: 700;
}

.pg__price {
  font-size: 25rpx;
  color: var(--c-text-weak);
  font-weight: 600;
}

.pg__foot {
  flex-shrink: 0;
  background: #fff;
  box-shadow: var(--sh-bottom-bar);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  padding: 24rpx 32rpx calc(24rpx + constant(safe-area-inset-bottom));
  padding: 24rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
}

.pg__count {
  font-size: 25rpx;
  color: var(--c-text-2);
}

.pg__count-num {
  font-size: 30rpx;
  font-weight: 800;
  color: var(--c-primary);
}

.pg__confirm {
  background: var(--grad-main);
  color: #fff;
  font-size: 28rpx;
  font-weight: 800;
  padding: 24rpx 72rpx;
  border-radius: 48rpx;
  box-shadow: var(--sh-primary-btn);
}
</style>
