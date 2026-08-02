<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getMerchantMessages, ignoreMerchantMessage } from '@/services/api';
import { push, toast } from '@/utils/nav';
import type { MerchantMessage } from '@/models';

/** 45 · 商家消息中心：新单、退款、差评、结算到账等经营提醒，待处理置顶 */
const list = ref<MerchantMessage[]>([]);
const summary = ref('');
const loading = ref(true);

onShow(() => {
  load();
});

async function load(): Promise<void> {
  loading.value = true;
  const res = await getMerchantMessages();
  list.value = res.list;
  summary.value = res.summary;
  loading.value = false;
}

/** 每类消息各自跳到对应的处理页 */
function onHandle(m: MerchantMessage): void {
  switch (m.kind) {
    case 'order':
      push('/pages/merchant/orders/index');
      break;
    case 'refund':
      push('/pages/merchant/refund-review/index?id=rf_2001');
      break;
    case 'review':
      push('/pages/merchant/reviews/index');
      break;
    case 'settle':
      toast('货款结算（34）属后续步骤');
      break;
    default:
      break;
  }
}

async function onIgnore(id: string): Promise<void> {
  await ignoreMerchantMessage(id);
  load();
}
</script>

<template>
  <view class="mm">
    <wf-nav-bar title="通知" right="设置" @righttap="push('/pages/merchant/devices/index')" />

    <scroll-view class="mm__body" scroll-y>
      <view v-if="summary" class="mm__summary">{{ summary }}</view>

      <template v-if="loading">
        <view v-for="n in 3" :key="n" class="card mm__item">
          <view class="skeleton" style="width: 76rpx; height: 76rpx; border-radius: 24rpx" />
          <view class="flex1 col" style="gap: 12rpx">
            <view class="skeleton" style="width: 40%; height: 28rpx" />
            <view class="skeleton" style="width: 90%; height: 24rpx" />
          </view>
        </view>
      </template>

      <template v-else-if="list.length">
        <view v-for="m in list" :key="m.id" class="card mm__item">
          <view class="mm__row">
            <view class="mm__icon" :class="{ 'mm__icon--urgent': m.urgent }">
              <wf-icon
                :name="m.icon"
                :size="38"
                :color="m.urgent ? '#FF4A17' : '#8A8078'"
                :weight="1.9"
              />
            </view>
            <view class="flex1 col mm__text">
              <view class="row--between">
                <text class="mm__title">{{ m.title }}</text>
                <text class="mm__time">{{ m.timeText }}</text>
              </view>
              <text class="mm__desc">{{ m.desc }}</text>
            </view>
          </view>

          <view v-if="m.actionable" class="mm__actions">
            <view class="pill pill--outline tap" @tap="onIgnore(m.id)">忽略</view>
            <view class="pill pill--primary tap" @tap="onHandle(m)">去处理</view>
          </view>
        </view>
      </template>

      <view v-else class="empty">
        <text class="empty__text">暂时没有新通知</text>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.mm {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.mm__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx calc(40rpx + constant(safe-area-inset-bottom));
  padding: 20rpx 32rpx calc(40rpx + env(safe-area-inset-bottom));
}

.mm__summary {
  background: var(--c-primary-bg);
  border: 1px solid var(--c-primary-line);
  border-radius: 24rpx;
  padding: 20rpx 28rpx;
  font-size: 24rpx;
  font-weight: 700;
  color: var(--c-warn-text-2);
  margin-bottom: 20rpx;
}

.mm__item {
  margin-bottom: 20rpx;
}

.mm__row {
  display: flex;
  gap: 24rpx;
}

.mm__icon {
  width: 76rpx;
  height: 76rpx;
  border-radius: 24rpx;
  background: var(--c-fill-3);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mm__icon--urgent {
  background: var(--c-primary-bg);
}

.mm__text {
  gap: 6rpx;
}

.mm__title {
  font-size: 27rpx;
  font-weight: 800;
}

.mm__time {
  font-size: 21rpx;
  color: var(--c-text-placeholder);
  flex-shrink: 0;
  margin-left: 16rpx;
}

.mm__desc {
  font-size: 24rpx;
  color: var(--c-text-3);
  line-height: 1.6;
}

.mm__actions {
  display: flex;
  justify-content: flex-end;
  gap: 20rpx;
}
</style>
