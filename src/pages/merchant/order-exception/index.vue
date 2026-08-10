<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getExceptionOrders, resolveException } from '@/services/api';
import { push, toast } from '@/utils/nav';
import type { ExceptionOrder, ExceptionTab } from '@/models';

/**
 * 92 · 异常与取消订单。
 * 未出餐的取消申请有倒计时（超时自动同意）；已出餐的可拒绝，但拒绝要上传出餐凭证走平台仲裁。
 */
const TABS: { key: ExceptionTab; label: string }[] = [
  { key: 'cancel', label: '取消申请' },
  { key: 'timeout', label: '出餐超时' },
  { key: 'delivery', label: '配送异常' },
];

const activeTab = ref<ExceptionTab>('cancel');
const list = ref<ExceptionOrder[]>([]);
const counts = ref<Record<ExceptionTab, number>>({ cancel: 0, timeout: 0, delivery: 0 });
const loading = ref(true);

onLoad(() => {
  load();
});

async function load(): Promise<void> {
  loading.value = true;
  const res = await getExceptionOrders(activeTab.value);
  list.value = res.list;
  counts.value = res.counts;
  loading.value = false;
}

function onSwitchTab(key: ExceptionTab): void {
  if (key === activeTab.value) return;
  activeTab.value = key;
  load();
}

async function onAgree(o: ExceptionOrder): Promise<void> {
  uni.showModal({
    title: '同意取消？',
    content: `将全额退款 ￥${o.amountText} 给顾客`,
    confirmColor: '#FF4A17',
    success: async (res) => {
      if (!res.confirm) return;
      const out = await resolveException(activeTab.value, o.id, 'agree');
      toast(out.message);
      load();
    },
  });
}

/** 已出餐的单拒绝前必须先拍出餐凭证 */
async function onReject(o: ExceptionOrder): Promise<void> {
  if (o.needProof) {
    uni.chooseImage({
      count: 1,
      success: async () => {
        const out = await resolveException(activeTab.value, o.id, 'reject');
        toast(out.message);
        load();
      },
      fail: () => toast('未上传凭证，无法拒绝'),
    });
    return;
  }
  const out = await resolveException(activeTab.value, o.id, 'reject');
  toast(out.message);
  load();
}
</script>

<template>
  <view class="ex">
    <wf-nav-bar title="异常订单" />

    <view class="ex__tabs">
      <view
        v-for="t in TABS"
        :key="t.key"
        class="ex__tab"
        :class="{ 'ex__tab--on': activeTab === t.key }"
        @tap="onSwitchTab(t.key)"
        >{{ t.label }} {{ counts[t.key] || '' }}</view
      >
    </view>

    <scroll-view class="ex__body" scroll-y>
      <template v-if="loading">
        <view v-for="n in 2" :key="n" class="card ex__card">
          <view class="skeleton" style="width: 60%; height: 28rpx" />
          <view class="skeleton" style="width: 100%; height: 48rpx" />
        </view>
      </template>

      <template v-else-if="list.length">
        <view v-for="o in list" :key="o.id" class="card ex__card">
          <view
            class="row--between tap"
            @tap="push(`/pages/merchant/order-detail/index?id=${o.id}`)"
          >
            <text class="ex__no">{{ o.orderNo }} ›</text>
            <text class="ex__stage" :class="`ex__stage--${o.stageTone}`">{{ o.stageText }}</text>
          </view>

          <!-- 直接列出点了什么，不用点进详情才知道 -->
          <view v-if="o.lines.length" class="ex__lines">
            <view v-for="(line, i) in o.lines" :key="i" class="ex__line">
              <text class="flex1 ellipsis">{{
                line.specText ? `${line.name}（${line.specText}）` : line.name
              }}</text>
              <text class="ex__line-qty">×{{ line.qty }}</text>
            </view>
          </view>

          <!-- 已处理的只留结论 -->
          <text v-if="o.resolved" class="ex__resolved">{{ o.resolveText }}</text>

          <template v-else>
            <text v-if="o.countdownText" class="ex__countdown">{{ o.countdownText }}</text>

            <view v-if="o.reasonQuote" class="ex__reason">
              <text class="ex__reason-label">顾客申请取消：</text>
              <text class="ex__reason-text">「{{ o.reasonQuote }}」</text>
            </view>

            <view class="row--between">
              <text class="ex__items">{{ o.itemsText }}</text>
              <text class="ex__amount">￥{{ o.amountText }}</text>
            </view>

            <view v-if="o.noteText" class="ex__note">{{ o.noteText }}</view>

            <view class="ex__actions">
              <view class="pill pill--outline tap" @tap="onReject(o)">{{
                o.needProof ? '上传凭证拒绝' : '拒绝并说明'
              }}</view>
              <view class="pill pill--primary tap" @tap="onAgree(o)">同意取消</view>
            </view>
          </template>
        </view>
      </template>

      <view v-else class="empty">
        <text class="empty__text">这个分类下没有待处理的异常单</text>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.ex {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ex__tabs {
  display: flex;
  gap: 36rpx;
  padding: 8rpx 40rpx 20rpx;
  flex-shrink: 0;
}

.ex__tab {
  font-size: 27rpx;
  font-weight: 600;
  color: var(--c-text-weaker);
  padding-bottom: 12rpx;
  position: relative;
}

.ex__tab--on {
  font-weight: 800;
  color: var(--c-text);
}

.ex__tab--on::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 40rpx;
  height: 6rpx;
  border-radius: 4rpx;
  background: var(--c-primary);
}

.ex__body {
  flex: 1;
  min-height: 0;
  padding: 0 32rpx calc(40rpx + constant(safe-area-inset-bottom));
  padding: 0 32rpx calc(40rpx + env(safe-area-inset-bottom));
}

.ex__card {
  margin-bottom: 20rpx;
  gap: 16rpx;
}

.ex__no {
  font-size: 27rpx;
  font-weight: 800;
}

.ex__stage {
  font-size: 22rpx;
  font-weight: 800;
  padding: 4rpx 16rpx;
  border-radius: 12rpx;
}

.ex__stage--pending {
  background: var(--c-primary-bg);
  color: var(--c-primary);
}

.ex__stage--cooked {
  background: var(--c-warn-bg);
  color: var(--c-warn-text);
}

.ex__stage--done {
  background: var(--c-fill-3);
  color: var(--c-text-weaker);
}

.ex__countdown {
  font-size: 23rpx;
  font-weight: 700;
  color: var(--c-primary-deep);
}

.ex__resolved {
  font-size: 23rpx;
  color: var(--c-text-weaker);
}

.ex__reason {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.ex__reason-label {
  font-size: 23rpx;
  color: var(--c-text-weaker);
}

.ex__reason-text {
  font-size: 26rpx;
  color: var(--c-text-2);
  line-height: 1.6;
}

.ex__lines {
  background: #faf7f2;
  border-radius: 20rpx;
  padding: 18rpx 22rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.ex__line {
  display: flex;
  align-items: center;
  gap: 20rpx;
  font-size: 23rpx;
  color: var(--c-text-2);
}

.ex__line-qty {
  font-size: 22rpx;
  color: var(--c-text-placeholder);
}

.ex__items {
  font-size: 23rpx;
  color: var(--c-text-weaker);
  flex: 1;
  min-width: 0;
}

.ex__amount {
  font-size: 28rpx;
  font-weight: 800;
}

.ex__note {
  background: var(--c-warn-bg);
  border-radius: 20rpx;
  padding: 18rpx 24rpx;
  font-size: 22rpx;
  color: var(--c-warn-text-2);
  line-height: 1.7;
}

.ex__actions {
  display: flex;
  justify-content: flex-end;
  gap: 20rpx;
}
</style>
