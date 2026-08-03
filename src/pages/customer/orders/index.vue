<script setup lang="ts">
import { computed, ref } from 'vue';
import { onHide, onLoad, onShow, onUnload } from '@dcloudio/uni-app';
import { getOrders } from '@/services/api';
import { chrome } from '@/utils/chrome';
import { fen2yuan } from '@/utils/money';
import { push, relaunch } from '@/utils/nav';
import { hasActiveOrder, startPoll } from '@/utils/poll';
import type { CustomerOrderTab, Order } from '@/models';

const TABS: { key: CustomerOrderTab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'ongoing', label: '进行中' },
  { key: 'toComment', label: '待评价' },
  { key: 'aftersale', label: '售后' },
];

/** 05 · 我的订单（含 42 空状态） */
const headPad = ref(96);
const activeTab = ref<CustomerOrderTab>('all');
const list = ref<Order[]>([]);
const loading = ref(true);
let stopPoll: (() => void) | null = null;

const rows = computed(() =>
  list.value.map((o) => ({
    ...o,
    payableText: fen2yuan(o.payable),
    thumbs: o.items.map((i) => i.image),
  }))
);

onLoad((options) => {
  const tab = ((options && options.tab) || 'all') as CustomerOrderTab;
  headPad.value = chrome().capsuleBottom + 16;
  activeTab.value = TABS.some((t) => t.key === tab) ? tab : 'all';
});

onShow(() => {
  load();
});

onHide(stop);
onUnload(stop);

async function load(): Promise<void> {
  loading.value = true;
  list.value = await getOrders(activeTab.value);
  loading.value = false;
  syncPoll();
}

/** 只有还有进行中的单才值得轮询，终态列表再拉也不会变 */
function syncPoll(): void {
  const active = hasActiveOrder(list.value.map((o) => o.status));
  if (active && !stopPoll) {
    stopPoll = startPoll(silentReload, 15000);
  } else if (!active) {
    stop();
  }
}

/** 轮询刷新不打骨架屏，避免列表每 15 秒闪一次 */
async function silentReload(): Promise<void> {
  list.value = await getOrders(activeTab.value);
  syncPoll();
}

function stop(): void {
  if (stopPoll) {
    stopPoll();
    stopPoll = null;
  }
}

function onSwitchTab(key: CustomerOrderTab): void {
  if (key === activeTab.value) return;
  activeTab.value = key;
  load();
}

function onTapOrder(id: string): void {
  push(`/pages/customer/order-detail/index?id=${id}`);
}

function onAction(key: string, id: string): void {
  switch (key) {
    case 'progress':
    case 'pay':
    case 'aftersale':
      push(`/pages/customer/order-detail/index?id=${id}`);
      break;
    case 'again':
      relaunch('/pages/customer/menu/index');
      break;
    case 'comment':
      push(`/pages/customer/comment/index?id=${id}`);
      break;
    default:
      break;
  }
}

function pillClass(style: string): string {
  if (style === 'primary') return 'pill--primary';
  if (style === 'outline-primary') return 'pill--outline-primary';
  return 'pill--outline';
}
</script>

<template>
  <view class="orders">
    <view class="orders__header" :style="{ paddingTop: headPad + 'px' }">
      <text class="orders__title">我的订单</text>
      <view class="orders__seg">
        <view
          v-for="t in TABS"
          :key="t.key"
          class="orders__seg-item"
          :class="{ 'orders__seg-item--on': activeTab === t.key }"
          @tap="onSwitchTab(t.key)"
          >{{ t.label }}</view
        >
      </view>
    </view>

    <scroll-view class="orders__body" scroll-y>
      <template v-if="loading">
        <view v-for="n in 2" :key="n" class="card card--lg orders__card">
          <view class="skeleton" style="width: 50%; height: 32rpx" />
          <view class="skeleton" style="width: 100%; height: 104rpx" />
          <view class="skeleton" style="width: 60%; height: 24rpx" />
        </view>
      </template>

      <template v-else-if="rows.length">
        <view v-for="row in rows" :key="row.id" class="card card--lg orders__card">
          <view class="orders__card-top" @tap="onTapOrder(row.id)">
            <text class="orders__shop">{{ row.shopName }} ›</text>
            <text class="orders__status" :class="`orders__status--${row.statusTone}`">{{
              row.statusText
            }}</text>
          </view>

          <view class="orders__goods" @tap="onTapOrder(row.id)">
            <view v-for="(thumb, i) in row.thumbs" :key="i" class="orders__thumb">
              <wf-thumb :src="thumb" :radius="20" />
            </view>
            <view class="flex1" />
            <view class="orders__amount">
              <text class="orders__amount-num">¥{{ row.payableText }}</text>
              <text class="orders__amount-cnt">共{{ row.count }}件</text>
            </view>
          </view>

          <text class="orders__meta">{{ row.metaText }}</text>

          <view class="orders__actions">
            <view
              v-for="act in row.actions"
              :key="act.key"
              class="pill tap"
              :class="pillClass(act.style)"
              @tap="onAction(act.key, row.id)"
              >{{ act.text }}</view
            >
          </view>
        </view>

        <text class="orders__foot">仅展示近90天订单</text>
      </template>

      <!-- 42 · 订单空状态 -->
      <view v-else class="orders__empty">
        <view class="orders__empty-art">
          <wf-icon name="order" :size="72" color="#C9BEB4" :weight="1.6" />
        </view>
        <text class="empty__text">还没有订单，先去点一份好吃的吧</text>
        <view class="btn btn--primary orders__empty-btn tap" @tap="relaunch('/pages/customer/menu/index')"
          >去点餐</view
        >
      </view>
    </scroll-view>

    <wf-tab-bar role="customer" active="orders" />
  </view>
</template>

<style lang="scss" scoped>
.orders {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.orders__header {
  background: #ffffff;
  padding-left: 32rpx;
  padding-right: 32rpx;
  padding-bottom: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 28rpx;
  flex-shrink: 0;
}

.orders__title {
  text-align: center;
  font-size: 34rpx;
  font-weight: 800;
}

.orders__seg {
  background: #f1eee9;
  border-radius: 26rpx;
  padding: 8rpx;
  display: flex;
}

.orders__seg-item {
  flex: 1;
  text-align: center;
  font-size: 25rpx;
  color: var(--c-text-weak);
  padding: 14rpx 0;
  border-radius: 20rpx;
}

.orders__seg-item--on {
  background: #ffffff;
  font-weight: 800;
  color: var(--c-text);
  box-shadow: 0 2rpx 8rpx rgba(32, 22, 15, 0.06);
}

.orders__body {
  flex: 1;
  min-height: 0;
  padding: 28rpx 32rpx calc(200rpx + constant(safe-area-inset-bottom));
  padding: 28rpx 32rpx calc(200rpx + env(safe-area-inset-bottom));
}

.orders__card {
  margin-bottom: 24rpx;
  gap: 24rpx;
}

.orders__card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.orders__shop {
  font-size: 28rpx;
  font-weight: 800;
}

.orders__status--primary {
  font-size: 25rpx;
  font-weight: 800;
  color: var(--c-primary);
}

.orders__status--weak {
  font-size: 25rpx;
  font-weight: 700;
  color: var(--c-text-weaker);
}

.orders__goods {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.orders__thumb {
  width: 104rpx;
  height: 104rpx;
  border-radius: 20rpx;
  overflow: hidden;
  flex-shrink: 0;
}

.orders__amount {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4rpx;
}

.orders__amount-num {
  font-size: 26rpx;
  font-weight: 800;
}

.orders__amount-cnt {
  font-size: 21rpx;
  color: var(--c-text-weaker);
}

.orders__meta {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.orders__actions {
  display: flex;
  justify-content: flex-end;
  gap: 20rpx;
}

.orders__foot {
  display: block;
  text-align: center;
  font-size: 22rpx;
  color: var(--c-text-placeholder);
  padding-top: 16rpx;
}

/* 42 · 空状态 */
.orders__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28rpx;
  padding: 160rpx 64rpx 0;
}

.orders__empty-art {
  width: 176rpx;
  height: 176rpx;
  border-radius: 50%;
  background: #f1ece5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.orders__empty-btn {
  width: 320rpx;
  margin-top: 8rpx;
}
</style>
