<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getMyReviews, getOrders, removeMyReview } from '@/services/api';
import { push, toast } from '@/utils/nav';
import type { MyReview, MyReviewTab, Order } from '@/models';

/** 60 · 我的评价：待评价 / 已评价，含商家回复与追评 */
const list = ref<MyReview[]>([]);
const todoOrders = ref<Order[]>([]);
const counts = ref<Record<MyReviewTab, number>>({ todo: 0, done: 0 });
const activeTab = ref<MyReviewTab>('done');

const stars = (n: number): string => '★★★★★☆☆☆☆☆'.slice(5 - n, 10 - n);

const showTodo = computed(() => activeTab.value === 'todo');

onShow(() => {
  load();
});

async function load(): Promise<void> {
  const [mine, orders] = await Promise.all([getMyReviews(), getOrders('toComment')]);
  list.value = mine.list;
  counts.value = mine.counts;
  todoOrders.value = orders;
}

function onRemove(id: string): void {
  uni.showModal({
    title: '删除这条评价？',
    confirmText: '删除',
    confirmColor: '#D14343',
    success: async (res) => {
      if (!res.confirm) return;
      await removeMyReview(id);
      await load();
    },
  });
}
</script>

<template>
  <view class="mr">
    <wf-nav-bar title="我的评价" />

    <scroll-view class="mr__body" scroll-y>
      <view class="mr__tabs">
        <text
          class="mr__tab"
          :class="{ 'mr__tab--on': activeTab === 'todo' }"
          @tap="activeTab = 'todo'"
          >待评价 {{ counts.todo }}</text
        >
        <text
          class="mr__tab"
          :class="{ 'mr__tab--on': activeTab === 'done' }"
          @tap="activeTab = 'done'"
          >已评价 {{ counts.done }}</text
        >
      </view>

      <template v-if="showTodo">
        <view v-for="o in todoOrders" :key="o.id" class="card mr__todo">
          <view class="col mr__todo-text">
            <text class="mr__todo-title">{{ o.shopName }}</text>
            <text class="mr__todo-meta">{{ o.metaText }}</text>
          </view>
          <view
            class="pill pill--outline-primary tap"
            @tap="push(`/pages/customer/comment/index?id=${o.id}`)"
            >去评价</view
          >
        </view>
        <view v-if="!todoOrders.length" class="empty">
          <text class="empty__text">没有待评价的订单</text>
        </view>
      </template>

      <template v-else>
        <view v-for="r in list" :key="r.id" class="card mr__item">
          <view class="row--between">
            <text class="mr__stars">{{ stars(r.stars) }}</text>
            <text class="mr__date">{{ r.dateText }}</text>
          </view>
          <text class="mr__text">{{ r.text }}</text>
          <view v-if="r.photos.length" class="mr__photos">
            <view v-for="(p, i) in r.photos" :key="i" class="mr__photo">
              <wf-thumb :src="p" :radius="20" />
            </view>
          </view>
          <view v-if="r.reply" class="mr__reply">
            <text class="mr__reply-label">商家回复：</text>{{ r.reply }}
          </view>
          <view class="mr__ops">
            <text v-if="r.canAppend" class="mr__op tap" @tap="toast('追评功能待接入')">追评</text>
            <text class="mr__op tap" @tap="onRemove(r.id)">删除</text>
          </view>
        </view>
        <view v-if="!list.length" class="empty">
          <text class="empty__text">还没有发布过评价</text>
        </view>
      </template>

      <view class="mr__foot" />
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.mr {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.mr__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx 0;
}

.mr__tabs {
  display: flex;
  gap: 36rpx;
  padding: 0 8rpx 20rpx;
}

.mr__tab {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--c-text-weaker);
  position: relative;
  padding-bottom: 12rpx;
}

.mr__tab--on {
  font-weight: 800;
  color: var(--c-text);
  border-bottom: 6rpx solid var(--c-primary);
}

.mr__todo {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.mr__todo-text {
  gap: 6rpx;
}

.mr__todo-title {
  font-size: 27rpx;
  font-weight: 800;
}

.mr__todo-meta {
  font-size: 21rpx;
  color: var(--c-text-weaker);
}

.mr__item {
  margin-bottom: 20rpx;
}

.mr__stars {
  font-size: 24rpx;
  color: var(--c-warn);
}

.mr__date {
  font-size: 21rpx;
  color: var(--c-text-placeholder);
}

.mr__text {
  font-size: 25rpx;
  color: var(--c-text-2);
  line-height: 1.65;
}

.mr__photos {
  display: flex;
  gap: 16rpx;
}

.mr__photo {
  width: 120rpx;
  height: 120rpx;
  border-radius: 20rpx;
  overflow: hidden;
  flex-shrink: 0;
}

.mr__reply {
  background: var(--c-fill);
  border-radius: 24rpx;
  padding: 20rpx 24rpx;
  font-size: 23rpx;
  color: var(--c-text-3);
  line-height: 1.6;
}

.mr__reply-label {
  font-weight: 800;
  color: var(--c-text);
}

.mr__ops {
  display: flex;
  gap: 16rpx;
}

.mr__op {
  font-size: 23rpx;
  font-weight: 700;
  color: var(--c-text-weak);
  background: #f6f3ef;
  padding: 12rpx 28rpx;
  border-radius: 28rpx;
}

.mr__foot {
  height: 32rpx;
}
</style>
