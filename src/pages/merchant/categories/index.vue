<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getCategoryRows, moveCategory, saveCategory } from '@/services/api';
import { toast } from '@/utils/nav';
import type { CategoryRow } from '@/models';

/** 22 · 分类管理：排序、增删改，顾客端菜单实时同步 */
const rows = ref<CategoryRow[]>([]);

onShow(async () => {
  rows.value = await getCategoryRows();
});

async function move(index: number, delta: number): Promise<void> {
  const to = index + delta;
  if (to < 0 || to >= rows.value.length) return;
  const res = await moveCategory(index, to);
  if (!res.ok) {
    toast('「热销推荐」是自动聚合分类，位置固定');
    return;
  }
  rows.value = await getCategoryRows();
}

function onEdit(row: CategoryRow): void {
  if (row.pinned) {
    toast('自动聚合分类不可改名');
    return;
  }
  uni.showModal({
    title: '分类名称',
    editable: true,
    placeholderText: row.name,
    confirmColor: '#FF4A17',
    success: async (res) => {
      if (!res.confirm) return;
      const name = (res.content || '').trim();
      if (!name) return;
      await saveCategory(row.id, name);
      rows.value = await getCategoryRows();
    },
  });
}

function onCreate(): void {
  uni.showModal({
    title: '新建分类',
    editable: true,
    placeholderText: '分类名称',
    confirmColor: '#FF4A17',
    success: async (res) => {
      if (!res.confirm) return;
      const name = (res.content || '').trim();
      if (!name) return;
      await saveCategory('', name);
      rows.value = await getCategoryRows();
    },
  });
}
</script>

<template>
  <view class="cm">
    <wf-nav-bar title="分类管理" right="＋ 新建" @righttap="onCreate" />

    <scroll-view class="cm__body" scroll-y>
      <text class="cm__hint">用 ↑↓ 调整顺序，顾客端菜单实时同步</text>

      <view
        v-for="(row, index) in rows"
        :key="row.id"
        class="cm__row"
        :class="{ 'cm__row--pinned': row.pinned, 'cm__row--hidden': row.hidden }"
      >
        <view class="cm__sort">
          <text class="cm__sort-btn tap" @tap="move(index, -1)">↑</text>
          <text class="cm__sort-btn tap" @tap="move(index, 1)">↓</text>
        </view>
        <view class="flex1 col cm__info">
          <text class="cm__name">{{ row.name }}</text>
          <text class="cm__sub" :class="{ 'cm__sub--warn': row.hidden }">{{ row.sub }}</text>
        </view>
        <text v-if="row.pinned" class="cm__badge">置顶</text>
        <text v-else class="cm__edit tap" @tap="onEdit(row)">✎</text>
      </view>

      <view class="cm__foot" />
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.cm {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.cm__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx 0;
}

.cm__hint {
  display: block;
  font-size: 22rpx;
  color: var(--c-text-weaker);
  padding: 0 8rpx 20rpx;
}

.cm__row {
  background: #ffffff;
  border-radius: 28rpx;
  padding: 30rpx 32rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 20rpx;
  border: 3rpx solid transparent;
}

.cm__row--pinned {
  border-color: var(--c-primary);
  box-shadow: 0 10rpx 28rpx rgba(255, 74, 23, 0.1);
}

.cm__row--hidden {
  opacity: 0.6;
}

.cm__sort {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  flex-shrink: 0;
}

.cm__sort-btn {
  width: 40rpx;
  height: 36rpx;
  text-align: center;
  line-height: 36rpx;
  font-size: 24rpx;
  color: var(--c-text-placeholder-2);
  background: var(--c-fill);
  border-radius: 8rpx;
}

.cm__info {
  gap: 4rpx;
}

.cm__name {
  font-size: 28rpx;
  font-weight: 800;
}

.cm__sub {
  font-size: 21rpx;
  color: var(--c-text-weaker);
}

.cm__sub--warn {
  color: var(--c-danger);
  font-weight: 700;
}

.cm__badge {
  font-size: 21rpx;
  color: var(--c-primary);
  font-weight: 700;
  background: var(--c-primary-bg);
  padding: 6rpx 16rpx;
  border-radius: 14rpx;
}

.cm__edit {
  color: var(--c-text-placeholder-2);
  font-size: 28rpx;
}

.cm__foot {
  height: 32rpx;
}
</style>
