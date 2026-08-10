<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getSupportChat, sendSupportMessage } from '@/services/api';
import type { SupportMessage } from '@/models';

/** 41 · 在线客服：IM 会话 + 快捷问题 + 订单卡片 */
const messages = ref<SupportMessage[]>([]);
const quickReplies = ref<string[]>([]);
const draft = ref('');
const scrollInto = ref('');

onShow(async () => {
  const res = await getSupportChat();
  messages.value = res.messages;
  quickReplies.value = res.quickReplies;
  scrollToLast();
});

function scrollToLast(): void {
  scrollInto.value = messages.value.length
    ? `sm-${messages.value[messages.value.length - 1].id}`
    : '';
}

function onInput(e: Event): void {
  draft.value = (e as unknown as { detail: { value: string } }).detail.value;
}

async function send(text: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;
  const res = await sendSupportMessage(trimmed);
  messages.value = res.messages;
  draft.value = '';
  scrollToLast();
}
</script>

<template>
  <view class="sp">
    <wf-nav-bar title="联系商家" />

    <scroll-view class="sp__chat" scroll-y :scroll-into-view="scrollInto">
      <template v-for="m in messages" :key="m.id">
        <view v-if="m.timeText" class="sp__time">
          <text class="sp__time-pill">{{ m.timeText }}</text>
        </view>

        <view v-if="m.kind === 'order' && m.order" :id="`sm-${m.id}`" class="sp__order">
          <view class="sp__order-img"><wf-thumb :src="m.order.image" :radius="20" /></view>
          <view class="col sp__order-text">
            <text class="sp__order-no">订单 {{ m.order.orderNo }}</text>
            <text class="sp__order-summary">{{ m.order.summary }}</text>
          </view>
        </view>

        <view
          v-else
          :id="`sm-${m.id}`"
          class="sp__bubble"
          :class="`sp__bubble--${m.from}`"
          >{{ m.text }}</view
        >
      </template>

      <view class="sp__quick">
        <text v-for="q in quickReplies" :key="q" class="sp__quick-item tap" @tap="send(q)">{{
          q
        }}</text>
      </view>
    </scroll-view>

    <view class="sp__input">
      <input
        class="sp__field"
        :value="draft"
        placeholder="发送消息…"
        placeholder-class="sp__ph"
        confirm-type="send"
        @input="onInput"
        @confirm="send(draft)"
      />
      <view class="sp__send tap" @tap="send(draft)"><text class="sp__send-glyph">↑</text></view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.sp {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f1ede7;
}

.sp__chat {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx;
}

.sp__time {
  display: flex;
  justify-content: center;
  padding: 12rpx 0;
}

.sp__time-pill {
  font-size: 21rpx;
  color: var(--c-text-placeholder);
}

.sp__bubble {
  max-width: 78%;
  padding: 22rpx 28rpx;
  font-size: 26rpx;
  line-height: 1.65;
  margin-bottom: 20rpx;
}

.sp__bubble--agent {
  background: #fff;
  color: var(--c-text);
  border-radius: 8rpx 32rpx 32rpx 32rpx;
  margin-right: auto;
}

.sp__bubble--me {
  background: var(--grad-main);
  color: #fff;
  border-radius: 32rpx 8rpx 32rpx 32rpx;
  margin-left: auto;
}

.sp__order {
  max-width: 80%;
  margin-left: auto;
  margin-bottom: 20rpx;
  background: #fff;
  border-radius: 32rpx;
  padding: 20rpx;
  display: flex;
  gap: 20rpx;
  box-shadow: 0 6rpx 20rpx rgba(32, 22, 15, 0.06);
}

.sp__order-img {
  width: 88rpx;
  height: 88rpx;
  border-radius: 20rpx;
  overflow: hidden;
  flex-shrink: 0;
}

.sp__order-text {
  gap: 6rpx;
  justify-content: center;
}

.sp__order-no {
  font-size: 25rpx;
  font-weight: 800;
}

.sp__order-summary {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.sp__quick {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  padding-top: 8rpx;
}

.sp__quick-item {
  font-size: 24rpx;
  font-weight: 600;
  color: var(--c-primary);
  background: #fff;
  border: 1px solid var(--c-primary-line);
  border-radius: 30rpx;
  padding: 12rpx 24rpx;
}

.sp__input {
  flex-shrink: 0;
  background: #fff;
  border-top: 1px solid var(--c-img-placeholder);
  padding: 20rpx 24rpx;
  padding-bottom: calc(28rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(28rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.sp__field {
  flex: 1;
  min-width: 0;
  height: 80rpx;
  border-radius: 40rpx;
  background: #f6f3ef;
  padding: 0 32rpx;
  font-size: 26rpx;
}

.sp__ph {
  color: var(--c-text-placeholder);
  font-size: 26rpx;
}

.sp__send {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: var(--grad-main);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sp__send-glyph {
  color: #fff;
  font-size: 32rpx;
  font-weight: 800;
  line-height: 1;
}
</style>
