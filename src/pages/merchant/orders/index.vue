<script setup lang="ts">
import { computed, ref } from 'vue';
import { onHide, onLoad, onShow, onUnload } from '@dcloudio/uni-app';
import {
  acceptOrder,
  finishOrder,
  getMerchantOrders,
  printReceipt,
  rejectOrder,
} from '@/services/api';
import { chrome } from '@/utils/chrome';
import { fen2yuan2 } from '@/utils/money';
import { mmss } from '@/utils/time';
import { push, toast, todo } from '@/utils/nav';
import type { MerchantOrder, MerchantOrderTab } from '@/models';

const TABS: { key: MerchantOrderTab; label: string }[] = [
  { key: 'pending', label: '待接单' },
  { key: 'ongoing', label: '进行中' },
  { key: 'done', label: '已完成' },
  { key: 'aftersale', label: '售后' },
];

/**
 * 09 · 订单管理：按状态分流，新单高亮 + 超时倒计时。
 * 列表内可直接接单 / 拒单 / 出餐 / 补打，点卡片进商家订单详情（62）。
 *
 * 注：倒计时文案在设计稿里两处不一致——09 写「剩 3:42 未接自动提醒」，
 * 62 写「剩 2:38 自动拒单」。同一个倒计时，一处是提醒、一处是自动拒单，
 * 目前两屏各自照稿实现，**超时到底是提醒还是自动拒单需要业务确认**。
 */
const headPad = ref(96);
const activeTab = ref<MerchantOrderTab>('pending');
const list = ref<MerchantOrder[]>([]);
const counts = ref<Record<MerchantOrderTab, number>>({
  pending: 0,
  ongoing: 0,
  done: 0,
  aftersale: 0,
});
const loading = ref(true);

let timer: ReturnType<typeof setInterval> | null = null;

const rows = computed(() =>
  list.value.map((o) => ({
    ...o,
    totalText: fen2yuan2(o.total),
    refundAmountText: fen2yuan2(o.refundAmount || 0),
    lineRows: o.lines.map((l) => ({
      text: l.specText ? `${l.name}（${l.specText}）` : l.name,
      qty: l.qty,
    })),
  }))
);

onLoad(() => {
  headPad.value = chrome().capsuleBottom + 16;
});

onShow(() => {
  load();
  startTick();
});

onHide(stopTick);
onUnload(stopTick);

async function load(): Promise<void> {
  const res = await getMerchantOrders(activeTab.value);
  counts.value = res.counts;
  list.value = res.list.map((o) => ({
    ...o,
    countdownText: o.countdown ? `剩 ${mmss(o.countdown)} 未接自动提醒` : undefined,
  }));
  loading.value = false;
}

/** 倒计时每秒刷新；离开页面必须停止 */
function startTick(): void {
  stopTick();
  timer = setInterval(() => {
    list.value = list.value.map((o) => {
      if (typeof o.countdown !== 'number' || o.countdown <= 0) return o;
      const left = o.countdown - 1;
      return {
        ...o,
        countdown: left,
        countdownText: left > 0 ? `剩 ${mmss(left)} 未接自动提醒` : '已超时未接单',
      };
    });
  }, 1000);
}

function stopTick(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function onSwitchTab(key: MerchantOrderTab): void {
  if (key === activeTab.value) return;
  activeTab.value = key;
  loading.value = true;
  load();
}

async function onAccept(id: string): Promise<void> {
  const res = await acceptOrder(id);
  toast(res.autoPrinted ? '已接单，后厨联已自动打印' : '已接单，进入备餐', 'success');
  load();
}

function onReject(id: string): void {
  uni.showModal({
    title: '确认拒单？',
    content: '拒单后顾客将收到通知并自动退款',
    confirmText: '拒单',
    confirmColor: '#D14343',
    success: async (res) => {
      if (!res.confirm) return;
      await rejectOrder(id);
      toast('已拒单');
      load();
    },
  });
}

async function onFinish(id: string): Promise<void> {
  await finishOrder(id);
  toast('已出餐', 'success');
  load();
}

/** 列表内直接补打，不必进详情 */
async function onPrint(id: string): Promise<void> {
  const res = await printReceipt(id);
  toast(res.message || (res.ok ? '已发送到打印机' : '打印失败'), res.ok ? 'success' : 'none');
}
</script>

<template>
  <view class="mo">
    <view class="mo__header" :style="{ paddingTop: headPad + 'px' }">
      <view class="row--between">
        <text class="mo__title">订单管理</text>
        <view class="mo__scan tap" @tap="todo('21', '核销取餐码')">
          <wf-icon name="scan" :size="28" color="#FF4A17" :weight="2" />
          <text>核销取餐码</text>
        </view>
      </view>
      <scroll-view class="mo__tabs" scroll-x>
        <view
          v-for="t in TABS"
          :key="t.key"
          class="mo__tab"
          :class="{ 'mo__tab--on': activeTab === t.key }"
          @tap="onSwitchTab(t.key)"
          >{{ t.label }}{{ counts[t.key] ? ' ' + counts[t.key] : '' }}</view
        >
      </scroll-view>
    </view>

    <scroll-view class="mo__body" scroll-y>
      <view v-if="loading" class="card card--lg">
        <view class="skeleton" style="width: 40%; height: 32rpx" />
        <view class="skeleton" style="width: 100%; height: 120rpx" />
      </view>

      <template v-else-if="rows.length">
        <view
          v-for="row in rows"
          :key="row.id"
          class="mo__card"
          :class="{ 'mo__card--new': row.status === 'pending' }"
        >
          <view class="row--between" @tap="push(`/pages/merchant/order-detail/index?id=${row.id}`)">
            <view class="row mo__seq">
              <text
                class="mo__channel"
                :class="row.channel === '自提' ? 'mo__channel--pickup' : 'mo__channel--delivery'"
                >{{ row.channel }}</text
              >
              <text class="mo__no">{{ row.seq }}</text>
            </view>
            <text v-if="row.countdownText" class="mo__countdown">{{ row.countdownText }}</text>
            <text v-else class="mo__status">{{ row.statusText }}</text>
          </view>

          <!-- 自提：取餐码 -->
          <view v-if="row.pickupCode" class="mo__code">
            <text class="mo__code-label">取餐码</text>
            <text class="mo__code-num">{{ row.pickupCode }}</text>
          </view>

          <!-- 外送：顾客与地址 -->
          <view v-if="row.addressText" class="mo__customer">
            <text>{{ row.customerName }} {{ row.customerPhone }}</text>
            <text class="mo__customer-addr">{{ row.addressText }} · {{ row.distanceText }}</text>
          </view>
          <text v-else-if="row.summaryText" class="mo__summary">{{ row.summaryText }}</text>

          <!-- 明细（待接单单据展开） -->
          <view v-if="row.status === 'pending'" class="mo__items">
            <view v-for="line in row.lineRows" :key="line.text" class="mo__item">
              <text class="flex1">{{ line.text }}</text>
              <text class="mo__item-qty">x{{ line.qty }}</text>
            </view>
            <view class="mo__item mo__item--total">
              <text class="flex1">共{{ row.count }}件</text>
              <text>¥{{ row.totalText }}</text>
            </view>
          </view>

          <!-- 售后单：退款摘要 -->
          <view v-if="row.status === 'aftersale'" class="mo__refund">
            <view class="row--between">
              <text class="mo__refund-label">申请退款</text>
              <text class="mo__refund-amount">￥{{ row.refundAmountText }}</text>
            </view>
            <text class="mo__refund-reason">原因：{{ row.refundReason }}</text>
          </view>

          <!-- 操作 -->
          <view v-if="row.status === 'aftersale'" class="mo__actions">
            <view class="mo__btn mo__btn--primary tap" @tap="todo('48', '退款审核')"
              >处理退款申请</view
            >
          </view>
          <view v-else-if="row.status === 'pending'" class="mo__actions">
            <view class="mo__btn mo__btn--ghost tap" @tap="onReject(row.id)">拒单</view>
            <view class="mo__btn mo__btn--primary tap" @tap="onAccept(row.id)">立即接单</view>
          </view>
          <view v-else-if="row.status === 'ongoing'" class="mo__actions">
            <view class="mo__btn mo__btn--ghost mo__btn--half tap" @tap="onPrint(row.id)"
              >打印小票</view
            >
            <view
              class="mo__btn mo__btn--outline-primary mo__btn--half tap"
              @tap="onFinish(row.id)"
              >出餐完成</view
            >
          </view>
        </view>
      </template>

      <view v-else class="mo__empty">
        <text class="empty__text">该状态下暂无订单</text>
      </view>
    </scroll-view>

    <wf-tab-bar role="merchant" active="orders" />
  </view>
</template>

<style lang="scss" scoped>
.mo {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.mo__header {
  background: #ffffff;
  padding-left: 32rpx;
  padding-right: 32rpx;
  padding-bottom: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 28rpx;
  flex-shrink: 0;
  box-shadow: 0 4rpx 20rpx rgba(32, 22, 15, 0.04);
}

.mo__title {
  font-size: 40rpx;
  font-weight: 800;
}

.mo__scan {
  display: flex;
  align-items: center;
  gap: 12rpx;
  background: var(--c-primary-bg);
  padding: 14rpx 28rpx;
  border-radius: 32rpx;
  font-size: 24rpx;
  font-weight: 800;
  color: var(--c-primary);
}

.mo__tabs {
  white-space: nowrap;
}

.mo__tab {
  display: inline-block;
  background: var(--c-fill-3);
  color: #7a7168;
  font-size: 25rpx;
  font-weight: 600;
  padding: 16rpx 30rpx;
  border-radius: 34rpx;
  margin-right: 16rpx;
}

.mo__tab--on {
  background: var(--grad-main);
  color: #fff;
  font-weight: 800;
}

.mo__body {
  flex: 1;
  min-height: 0;
  padding: 28rpx 32rpx calc(200rpx + constant(safe-area-inset-bottom));
  padding: 28rpx 32rpx calc(200rpx + env(safe-area-inset-bottom));
}

.mo__card {
  background: #ffffff;
  border-radius: 36rpx;
  padding: 32rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  margin-bottom: 24rpx;
}

.mo__card--new {
  border: 3rpx solid var(--c-primary);
  box-shadow: 0 12rpx 36rpx rgba(255, 74, 23, 0.1);
}

.mo__seq {
  gap: 16rpx;
}

.mo__channel {
  font-size: 21rpx;
  font-weight: 800;
  padding: 6rpx 16rpx;
  border-radius: 12rpx;
}

.mo__channel--delivery {
  background: var(--c-primary-bg);
  color: var(--c-primary);
}

.mo__channel--pickup {
  background: #efeaf9;
  color: #7048c6;
}

.mo__no {
  font-size: 26rpx;
  font-weight: 800;
}

.mo__countdown {
  font-size: 22rpx;
  font-weight: 800;
  color: var(--c-primary-deep);
}

.mo__status {
  font-size: 23rpx;
  font-weight: 700;
  color: var(--c-primary);
}

.mo__customer {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  font-size: 24rpx;
  color: var(--c-text-2);
  line-height: 1.6;
}

.mo__summary {
  font-size: 24rpx;
  color: var(--c-text-2);
}

.mo__code {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--c-warn-bg);
  border: 1px dashed #f0d9a8;
  border-radius: 24rpx;
  padding: 20rpx 28rpx;
}

.mo__code-label {
  font-size: 24rpx;
  color: var(--c-warn-text-2);
  font-weight: 700;
}

.mo__code-num {
  font-size: 38rpx;
  font-weight: 800;
  letter-spacing: 10rpx;
}

.mo__items {
  background: #faf7f2;
  border-radius: 24rpx;
  padding: 20rpx 24rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.mo__item {
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
}

.mo__item-qty {
  color: var(--c-text-weaker);
}

.mo__item--total {
  font-weight: 800;
  border-top: 1px dashed var(--c-border-btn);
  padding-top: 12rpx;
}

.mo__actions {
  display: flex;
  gap: 20rpx;
}

.mo__btn {
  text-align: center;
  padding: 20rpx 0;
  border-radius: 42rpx;
  font-size: 26rpx;
  font-weight: 700;
}

.mo__btn--ghost {
  flex: 1;
  border: 3rpx solid var(--c-border-btn);
  color: var(--c-text-weak);
}

.mo__btn--primary {
  flex: 2;
  background: var(--grad-main);
  color: #fff;
  font-size: 27rpx;
  font-weight: 800;
  box-shadow: 0 10rpx 28rpx rgba(255, 61, 0, 0.28);
}

.mo__btn--outline-primary {
  border: 3rpx solid var(--c-primary);
  color: var(--c-primary);
  font-weight: 800;
}

.mo__btn--half {
  flex: 1;
}

.mo__empty {
  padding: 160rpx 0;
  text-align: center;
}

/* 售后单摘要 */
.mo__refund {
  background: #fdf1f1;
  border: 1px dashed #f0c9c9;
  border-radius: 24rpx;
  padding: 20rpx 24rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.mo__refund-label {
  font-size: 24rpx;
  font-weight: 700;
  color: var(--c-danger);
}

.mo__refund-amount {
  font-size: 28rpx;
  font-weight: 800;
  color: var(--c-danger);
}

.mo__refund-reason {
  font-size: 22rpx;
  color: var(--c-text-weak);
}
</style>
