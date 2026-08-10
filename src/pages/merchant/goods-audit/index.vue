<script setup lang="ts">
import { computed, ref } from 'vue';
import { onHide, onShow, onUnload } from '@dcloudio/uni-app';
import { getGoodsAudits, setGoodsOnSale } from '@/services/api';
import { push, toast } from '@/utils/nav';
import { startPoll } from '@/utils/poll';
import type { GoodsAuditRow } from '@/models';

/**
 * 100 · 商品审核进度。
 * 提交审核后的落地页：顶部是当前这单的时间轴，下面是近期审核记录（三态）。
 * 有单子还在审核中就轮询等结果，出完就停（与 05/06/09/53 同一套写法）。
 */
const rows = ref<GoodsAuditRow[]>([]);
const loading = ref(true);

/** 最近一条在审的，时间轴讲的就是它 */
const current = computed(
  () => rows.value.find((r) => r.state === 'pending') || rows.value[0] || null
);

const history = computed(() => rows.value.filter((r) => r.id !== current.value?.id));

/** 三节点时间轴：提交 → 审核中 → 通过后可上架 */
const nodes = computed(() => {
  const state = current.value?.state;
  return [
    { title: '提交成功', sub: '资料与规格价格已提交平台', done: true },
    {
      title: state === 'rejected' ? '审核未通过' : '平台审核中',
      sub:
        state === 'rejected'
          ? current.value?.reasonText || '请查看驳回原因后修改重提'
          : '核对名称、图片与价格合规性 · 预计 2 小时内出结果',
      done: state !== 'pending',
    },
    {
      title: '审核通过后可上架',
      sub: '通过后商品管理页开关自动可用，开启即对顾客可见',
      done: state === 'approved',
    },
  ];
});

let stopPoll: (() => void) | null = null;
onHide(() => sync(false));
onUnload(() => sync(false));

onShow(() => {
  load();
});

async function load(): Promise<void> {
  rows.value = await getGoodsAudits();
  loading.value = false;
  sync(true);
}

function sync(alive: boolean): void {
  const wanted = alive && rows.value.some((r) => r.state === 'pending');
  if (wanted && !stopPoll) {
    stopPoll = startPoll(async () => {
      rows.value = await getGoodsAudits();
      if (!rows.value.some((r) => r.state === 'pending')) sync(false);
    }, 5000);
  } else if (!wanted && stopPoll) {
    stopPoll();
    stopPoll = null;
  }
}

function stateClass(state: string): string {
  if (state === 'pending') return 'tag--warn';
  if (state === 'rejected') return 'tag--danger';
  if (state === 'approved') return 'tag--success';
  return 'tag--grey';
}

async function onShelf(row: GoodsAuditRow): Promise<void> {
  const res = await setGoodsOnSale(row.id, true);
  toast(res.ok ? '已上架' : res.message || '操作失败');
  load();
}
</script>

<template>
  <view class="ga">
    <wf-nav-bar title="商品审核" />

    <scroll-view class="ga__body" scroll-y>
      <!-- 当前这单：概要 + 时间轴 -->
      <view v-if="current" class="card">
        <view class="row ga__head">
          <view class="ga__thumb"><wf-thumb :src="current.image" :radius="20" /></view>
          <view class="flex1 col ga__head-text">
            <text class="ga__name">{{ current.name }}</text>
            <text class="ga__meta">{{ current.metaText }}</text>
          </view>
          <text class="tag" :class="stateClass(current.state)">{{ current.stateText }}</text>
        </view>

        <view class="hairline" />

        <wf-timeline :nodes="nodes" />

        <view
          v-if="current.state === 'rejected'"
          class="btn btn--ghost tap"
          @tap="push(`/pages/merchant/goods-reject/index?id=${current.id}`)"
          >查看驳回原因</view
        >
      </view>

      <view v-else-if="!loading" class="empty">
        <text class="empty__text">还没有提交过审核的商品</text>
      </view>

      <!-- 近期审核记录 -->
      <view v-if="history.length" class="card">
        <view class="row--between">
          <text class="t-section">近期审核记录</text>
          <text class="ga__range">近 30 天</text>
        </view>

        <view v-for="row in history" :key="row.id" class="ga__row">
          <view class="ga__thumb"><wf-thumb :src="row.image" :radius="20" /></view>
          <view class="flex1 col ga__row-text">
            <view class="row ga__row-top">
              <text class="flex1 ellipsis ga__name">{{ row.name }}</text>
              <text class="tag" :class="stateClass(row.state)">{{ row.stateText }}</text>
            </view>
            <text class="ga__meta">{{ row.reasonText || row.metaText }}</text>
          </view>
          <view class="col ga__row-right">
            <wf-price :fen="row.price" :size="30" :from="row.priceFrom" />
            <view
              v-if="row.state === 'rejected'"
              class="pill pill--outline tap"
              @tap="push(`/pages/merchant/goods-reject/index?id=${row.id}`)"
              >查看原因</view
            >
            <view
              v-else-if="row.state === 'approved'"
              class="pill pill--outline-primary tap"
              @tap="onShelf(row)"
              >去上架</view
            >
          </view>
        </view>
      </view>

      <text class="ga__note">审核期间商品对顾客不可见；驳回后修改重提，无需重新填写已通过的内容。</text>

      <view class="ga__foot" />
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.ga {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ga__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx 0;
}

.card {
  margin-bottom: 24rpx;
}

.ga__head {
  gap: 24rpx;
}

.ga__head-text {
  gap: 8rpx;
  min-width: 0;
}

.ga__thumb {
  width: 104rpx;
  height: 104rpx;
  border-radius: 20rpx;
  overflow: hidden;
  flex-shrink: 0;
}

.ga__name {
  font-size: 28rpx;
  font-weight: 800;
}

.ga__meta {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.ga__range {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.ga__row {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding-top: 24rpx;
  border-top: 1px solid var(--c-line);
}

.ga__row-text {
  gap: 8rpx;
  min-width: 0;
}

.ga__row-top {
  gap: 16rpx;
}

.ga__row-right {
  align-items: flex-end;
  gap: 12rpx;
  flex-shrink: 0;
}

.ga__note {
  font-size: 22rpx;
  color: var(--c-text-weaker);
  line-height: 1.6;
}

.ga__foot {
  height: 32rpx;
}
</style>
