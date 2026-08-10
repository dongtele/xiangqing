<script setup lang="ts">
import { computed, ref } from 'vue';
import { onHide, onLoad, onShow, onUnload } from '@dcloudio/uni-app';
import {
  acceptOrder,
  finishOrder,
  getMerchantOrder,
  printReceipt,
  rejectOrder,
} from '@/services/api';
import { fen2yuan2 } from '@/utils/money';
import { mmss } from '@/utils/time';
import { back, push, toast } from '@/utils/nav';
import type { MerchantOrder } from '@/models';

interface ActionVM {
  key: 'reject' | 'accept' | 'print' | 'finish';
  text: string;
  /** flex 权重，主操作更宽（设计稿 1 : 1.4） */
  weight: number;
  primary: boolean;
}

/** 按订单状态给出底部操作 */
function actionsOf(status: MerchantOrder['status']): ActionVM[] {
  if (status === 'pending') {
    return [
      { key: 'reject', text: '拒单', weight: 1, primary: false },
      { key: 'accept', text: '接单并打印', weight: 1.4, primary: true },
    ];
  }
  if (status === 'ongoing') {
    return [
      { key: 'print', text: '补打小票', weight: 1, primary: false },
      { key: 'finish', text: '出餐完成', weight: 1.4, primary: true },
    ];
  }
  return [{ key: 'print', text: '补打小票', weight: 1, primary: false }];
}

/** 62 · 商家订单详情：明细、顾客信息、操作、打印 */
const order = ref<MerchantOrder | null>(null);
const statusMeta = ref('');
let orderId = '';
let timer: ReturnType<typeof setInterval> | null = null;

const lines = computed(() =>
  order.value ? order.value.lines.map((l) => ({ ...l, amountText: fen2yuan2(l.amount) })) : []
);
const totalText = computed(() => (order.value ? fen2yuan2(order.value.total) : '0.00'));
const actions = computed(() => (order.value ? actionsOf(order.value.status) : []));

onLoad((options) => {
  orderId = (options && options.id) || '';
});

onShow(() => {
  load();
});

onHide(stopTick);
onUnload(stopTick);

async function load(): Promise<void> {
  const res = await getMerchantOrder(orderId);
  if (!res) {
    toast('订单不存在');
    return;
  }
  order.value = res.order;
  statusMeta.value = res.countdownText;
  if (res.order.countdown) startTick(res.order.countdown, res.order.placedAtText);
  else stopTick();
}

/** 待接单倒计时每秒刷新，超时提示自动拒单；离开页面必须停止 */
function startTick(seconds: number, placedAtText: string): void {
  stopTick();
  let left = seconds;
  timer = setInterval(() => {
    left -= 1;
    if (left <= 0) {
      stopTick();
      statusMeta.value = `${placedAtText} · 已超时自动拒单`;
      return;
    }
    statusMeta.value = `${placedAtText} · 剩 ${mmss(left)} 自动拒单`;
  }, 1000);
}

function stopTick(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function onAction(key: ActionVM['key']): void {
  if (key === 'accept') return void accept();
  if (key === 'reject') return reject();
  if (key === 'finish') return void finish();
  void print();
}

async function accept(): Promise<void> {
  const res = await acceptOrder(orderId);
  toast(res.autoPrinted ? '已接单，后厨联已自动打印' : '已接单，请手动打印后厨联', 'success');
  load();
}

function reject(): void {
  uni.showModal({
    title: '确认拒单？',
    content: '拒单后顾客将收到通知并自动退款',
    confirmText: '拒单',
    confirmColor: '#D14343',
    success: async (res) => {
      if (!res.confirm) return;
      await rejectOrder(orderId);
      toast('已拒单');
      back();
    },
  });
}

async function finish(): Promise<void> {
  await finishOrder(orderId);
  toast('已出餐', 'success');
  load();
}

async function print(): Promise<void> {
  const res = await printReceipt(orderId);
  toast(res.message || (res.ok ? '已发送到打印机' : '打印失败'), res.ok ? 'success' : 'none');
}
</script>

<template>
  <view v-if="order" class="mod">
    <wf-nav-bar
      :title="`订单 ${order.seq}`"
      right="打印"
      @righttap="push(`/pages/merchant/print/index?orderId=${orderId}`)"
    />

    <scroll-view class="mod__body" scroll-y>
      <!-- 状态 -->
      <view class="card">
        <view class="row--between">
          <text class="mod__status" :class="`mod__status--${order.status}`">{{
            order.statusText
          }}</text>
          <text class="mod__meta">{{ statusMeta }}</text>
        </view>
        <view class="mod__tags">
          <text class="mod__tag mod__tag--channel">{{ order.channel }}</text>
          <text class="mod__tag mod__tag--expect">{{ order.expectText }}</text>
          <text class="mod__tag mod__tag--seq">{{ order.customerSeqText }}</text>
        </view>
      </view>

      <!-- 菜品明细 -->
      <view class="card">
        <template v-for="(line, index) in lines" :key="line.name">
          <view v-if="index > 0" class="hairline" />
          <view class="mod__line">
            <view class="mod__line-img"><wf-thumb :src="line.image" :radius="20" /></view>
            <view class="flex1 col mod__line-info">
              <text class="mod__line-name">{{ line.name }}</text>
              <text class="mod__line-spec">{{ line.specText || '—' }}</text>
            </view>
            <text class="mod__line-qty">×{{ line.qty }}</text>
            <text class="mod__line-amount">￥{{ line.amountText }}</text>
          </view>
        </template>

        <view class="hairline" />

        <view v-if="order.remark" class="mod__remark">备注：{{ order.remark }}</view>

        <view class="row--between">
          <text class="cell__label">顾客实付</text>
          <text class="cell__value">￥{{ totalText }}</text>
        </view>
      </view>

      <!-- 顾客信息 -->
      <view class="card">
        <view class="row--between">
          <text class="cell__label">{{ order.channel === '自提' ? '取餐人' : '收货人' }}</text>
          <view class="cell__value">
            <text>{{ order.customerName }} {{ order.customerPhone }}</text>
            <text class="mod__call tap" @tap.stop="toast(`虚拟号拨号：${order.customerPhone}`)"
              >拨号</text
            >
          </view>
        </view>
        <view class="hairline" />
        <template v-if="order.channel === '自提'">
          <view class="row--between">
            <text class="cell__label">取餐码</text>
            <text class="mod__code">{{ order.pickupCode }}</text>
          </view>
        </template>
        <template v-else>
          <view class="row--between">
            <text class="cell__label">地址</text>
            <text class="cell__value mod__addr">{{ order.addressText }}</text>
          </view>
          <view class="hairline" />
          <view class="row--between">
            <text class="cell__label">距离</text>
            <text class="cell__value">{{ order.distanceEtaText }}</text>
          </view>
        </template>
      </view>

      <view class="mod__foot" />
    </scroll-view>

    <!-- 底部操作 -->
    <view class="mod__bar">
      <view
        v-for="act in actions"
        :key="act.key"
        class="mod__btn tap"
        :class="act.primary ? 'mod__btn--primary' : 'mod__btn--ghost'"
        :style="{ flex: act.weight }"
        @tap="onAction(act.key)"
        >{{ act.text }}</view
      >
    </view>
  </view>
</template>

<style lang="scss" scoped>
.mod {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.mod__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx 0;
}

.card {
  margin-bottom: 20rpx;
}

/* 状态 */
.mod__status {
  font-size: 32rpx;
  font-weight: 800;
  color: var(--c-primary);
}

.mod__status--done {
  color: var(--c-text-weak);
}

.mod__meta {
  font-size: 24rpx;
  color: var(--c-text-weak);
}

.mod__tags {
  display: flex;
  gap: 16rpx;
  flex-wrap: wrap;
}

.mod__tag {
  font-size: 22rpx;
  font-weight: 700;
  padding: 6rpx 18rpx;
  border-radius: 12rpx;
}

.mod__tag--channel {
  background: var(--c-text);
  color: #fff;
  font-weight: 800;
}

.mod__tag--expect {
  background: var(--c-primary-bg);
  color: var(--c-primary-text-deep);
}

.mod__tag--seq {
  background: var(--c-fill-2);
  color: var(--c-text-weak);
}

/* 菜品行 */
.mod__line {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.mod__line-img {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  overflow: hidden;
  flex-shrink: 0;
}

.mod__line-info {
  gap: 4rpx;
}

.mod__line-name {
  font-size: 26rpx;
  font-weight: 700;
}

.mod__line-spec {
  font-size: 21rpx;
  color: var(--c-text-weaker);
}

.mod__line-qty {
  font-size: 24rpx;
  color: var(--c-text-weak);
}

.mod__line-amount {
  font-size: 26rpx;
  font-weight: 800;
  min-width: 116rpx;
  text-align: right;
}

.mod__remark {
  background: #fff6f0;
  border-radius: 20rpx;
  padding: 18rpx 24rpx;
  font-size: 24rpx;
  color: var(--c-primary-text-deep);
  line-height: 1.6;
}

/* 顾客信息 */
.mod__addr {
  flex: 1;
  text-align: right;
  margin-left: 24rpx;
}

.mod__call {
  color: var(--c-primary);
  font-weight: 800;
  margin-left: 8rpx;
}

.mod__code {
  font-size: 34rpx;
  font-weight: 800;
  letter-spacing: 8rpx;
}

.mod__foot {
  height: 24rpx;
}

/* 底部操作 */
.mod__bar {
  flex-shrink: 0;
  background: #ffffff;
  border-top: 1px solid var(--c-img-placeholder);
  padding: 24rpx 32rpx;
  padding-bottom: calc(28rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(28rpx + env(safe-area-inset-bottom));
  display: flex;
  gap: 20rpx;
}

.mod__btn {
  height: 96rpx;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: 800;
}

.mod__btn--ghost {
  background: #fff;
  color: var(--c-text-2);
  border: 1px solid var(--c-border-btn);
}

.mod__btn--primary {
  background: var(--grad-main);
  color: #fff;
  box-shadow: var(--sh-primary-btn);
}
</style>
