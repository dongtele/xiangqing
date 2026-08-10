<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getMessageDetail } from '@/services/api';
import { push, relaunch, toast } from '@/utils/nav';
import type { MessageDetail } from '@/models';

/** 86 · 通知详情：正文 + 关联订单 + 双按钮，从 37 列表点条目进入 */
const detail = ref<MessageDetail | null>(null);

onLoad(async (o) => {
  const res = await getMessageDetail((o && o.id) || '');
  if (!res) {
    toast('消息不存在或已过期');
    return;
  }
  detail.value = res;
});

function onOrder(): void {
  if (!detail.value || !detail.value.order) return;
  push(`/pages/customer/order-detail/index?id=${detail.value.order.id}`);
}

function onAction(key: string): void {
  const orderId = detail.value && detail.value.order ? detail.value.order.id : '';
  switch (key) {
    case 'support':
      push('/pages/customer/support/index');
      break;
    case 'refund':
      push('/pages/customer/refund-detail/index?id=rf_2001');
      break;
    case 'track':
      push(`/pages/customer/delivery-track/index?id=${orderId}`);
      break;
    case 'coupons':
      push('/pages/customer/coupons/index');
      break;
    case 'menu':
      relaunch('/pages/customer/menu/index');
      break;
    default:
      break;
  }
}
</script>

<template>
  <view v-if="detail" class="md">
    <wf-nav-bar title="消息详情" />

    <scroll-view class="md__body" scroll-y>
      <view class="card">
        <view class="col md__head">
          <text class="tag tag--primary md__cat">{{ detail.categoryText }}</text>
          <text class="md__title">{{ detail.title }}</text>
          <text class="md__time">{{ detail.timeText }}</text>
        </view>
        <view class="hairline" />
        <text v-for="(p, i) in detail.paragraphs" :key="i" class="md__p">{{ p }}</text>
      </view>

      <view v-if="detail.order" class="card md__order tap" @tap="onOrder">
        <view class="md__order-thumb">
          <wf-thumb :src="detail.order.image" :radius="20" />
        </view>
        <view class="flex1 col md__order-text">
          <text class="md__order-name">{{ detail.order.shopName }}</text>
          <text class="md__order-sub">{{ detail.order.summary }}</text>
        </view>
        <text class="chevron">›</text>
      </view>

      <view class="md__actions">
        <view
          v-for="a in detail.actions"
          :key="a.key"
          class="btn tap"
          :class="a.style === 'primary' ? 'btn--primary' : 'btn--ghost'"
          @tap="onAction(a.key)"
          >{{ a.text }}</view
        >
      </view>

      <text class="md__foot">{{ detail.footText }}</text>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.md {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.md__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx calc(40rpx + constant(safe-area-inset-bottom));
  padding: 20rpx 32rpx calc(40rpx + env(safe-area-inset-bottom));
}

.card {
  margin-bottom: 20rpx;
}

.md__head {
  gap: 12rpx;
}

.md__cat {
  align-self: flex-start;
}

.md__title {
  font-size: 36rpx;
  font-weight: 800;
  line-height: 1.45;
}

.md__time {
  font-size: 23rpx;
  color: var(--c-text-placeholder);
}

.md__p {
  font-size: 26rpx;
  color: var(--c-text-3);
  line-height: 1.85;
}

.md__order {
  flex-direction: row;
  align-items: center;
  gap: 24rpx;
}

.md__order-thumb {
  width: 92rpx;
  height: 92rpx;
  border-radius: 20rpx;
  overflow: hidden;
  flex-shrink: 0;
}

.md__order-text {
  gap: 6rpx;
}

.md__order-name {
  font-size: 27rpx;
  font-weight: 800;
}

.md__order-sub {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.md__actions {
  display: flex;
  gap: 20rpx;
}

.md__actions .btn {
  flex: 1;
}

.md__foot {
  display: block;
  text-align: center;
  font-size: 22rpx;
  color: var(--c-text-placeholder-2);
  padding-top: 32rpx;
}
</style>
