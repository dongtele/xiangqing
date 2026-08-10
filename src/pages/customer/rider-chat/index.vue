<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getRiderChat, sendRiderMessage } from '@/services/api';
import { toast } from '@/utils/nav';
import type { Rider, RiderMessage } from '@/models';

/** 84 · 联系骑手：虚拟号通话 + 快捷短语 IM */
const rider = ref<Rider | null>(null);
const messages = ref<RiderMessage[]>([]);
const quickReplies = ref<string[]>([]);
const draft = ref('');
const scrollInto = ref('');
let orderId = '';

onLoad((options) => {
  orderId = (options && options.id) || '';
});

onShow(async () => {
  const res = await getRiderChat(orderId);
  rider.value = res.rider;
  messages.value = res.messages;
  quickReplies.value = res.quickReplies;
  scrollToLast();
});

function scrollToLast(): void {
  scrollInto.value = messages.value.length
    ? `msg-${messages.value[messages.value.length - 1].id}`
    : '';
}

function onInput(e: Event): void {
  draft.value = (e as unknown as { detail: { value: string } }).detail.value;
}

async function send(text: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;
  const res = await sendRiderMessage(orderId, trimmed);
  messages.value = res.messages;
  draft.value = '';
  scrollToLast();
}

/** 虚拟号拨号，保护双方隐私 */
function onCall(): void {
  if (!rider.value) return;
  uni.makePhoneCall({
    phoneNumber: rider.value.virtualPhone,
    fail: () => toast('拨号已取消'),
  });
}
</script>

<template>
  <view v-if="rider" class="rc">
    <wf-nav-bar title="联系骑手" />

    <view class="rc__body">
      <view class="card rc__rider">
        <view class="rc__avatar">{{ rider.avatarText }}</view>
        <view class="flex1 col rc__rider-text">
          <text class="rc__rider-name">{{ rider.titleText }}</text>
          <text class="rc__rider-credit">{{ rider.creditText }}</text>
        </view>
        <view class="rc__call tap" @tap="onCall">
          <wf-icon name="phone" :size="36" color="#FFFFFF" :weight="2" />
        </view>
      </view>

      <view class="rc__notice">
        为保护双方隐私，通话将使用虚拟号码
        <text class="rc__notice-num">{{ rider.virtualPhone }}</text>
        转接，订单完成后失效。
      </view>

      <scroll-view class="rc__chat" scroll-y :scroll-into-view="scrollInto">
        <template v-for="msg in messages" :key="msg.id">
          <view v-if="msg.timeText" class="rc__time">
            <text class="rc__time-pill">{{ msg.timeText }}</text>
          </view>
          <view :id="`msg-${msg.id}`" class="rc__bubble" :class="`rc__bubble--${msg.from}`">{{
            msg.text
          }}</view>
        </template>
      </scroll-view>

      <view class="rc__quick">
        <text
          v-for="q in quickReplies"
          :key="q"
          class="rc__quick-item tap"
          @tap="send(q)"
          >{{ q }}</text
        >
      </view>

      <view class="rc__input">
        <input
          class="rc__input-field"
          :value="draft"
          placeholder="发消息给骑手…"
          placeholder-class="rc__input-ph"
          confirm-type="send"
          @input="onInput"
          @confirm="send(draft)"
        />
        <view class="rc__send tap" @tap="send(draft)">发送</view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.rc {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.rc__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx 32rpx;
  padding-bottom: calc(32rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.rc__rider {
  flex-direction: row;
  align-items: center;
  gap: 24rpx;
}

.rc__avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: var(--c-primary-bg);
  color: var(--c-primary);
  font-size: 34rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rc__rider-text {
  gap: 6rpx;
}

.rc__rider-name {
  font-size: 28rpx;
  font-weight: 800;
}

.rc__rider-credit {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.rc__call {
  width: 76rpx;
  height: 76rpx;
  border-radius: 50%;
  background: var(--c-success);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rc__notice {
  background: var(--c-primary-bg);
  border: 1px solid var(--c-primary-line);
  border-radius: 28rpx;
  padding: 24rpx 28rpx;
  font-size: 23rpx;
  color: var(--c-primary-text-deep);
  line-height: 1.7;
}

.rc__notice-num {
  font-weight: 800;
}

.rc__chat {
  flex: 1;
  min-height: 0;
}

.rc__time {
  display: flex;
  justify-content: center;
  padding: 12rpx 0;
}

.rc__time-pill {
  font-size: 21rpx;
  color: var(--c-text-placeholder);
  background: #efeae3;
  padding: 6rpx 20rpx;
  border-radius: 16rpx;
}

.rc__bubble {
  max-width: 78%;
  padding: 22rpx 26rpx;
  font-size: 25rpx;
  line-height: 1.6;
  margin-bottom: 20rpx;
}

.rc__bubble--rider {
  background: #fff;
  color: #3f372f;
  border-radius: 28rpx 28rpx 28rpx 8rpx;
  margin-right: auto;
}

.rc__bubble--me {
  background: var(--grad-main);
  color: #fff;
  border-radius: 28rpx 28rpx 8rpx 28rpx;
  margin-left: auto;
}

.rc__quick {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.rc__quick-item {
  background: #fff;
  border: 1px solid var(--c-line-2);
  color: var(--c-text-2);
  font-size: 23rpx;
  font-weight: 600;
  padding: 14rpx 26rpx;
  border-radius: 30rpx;
}

.rc__input {
  height: 88rpx;
  border-radius: 44rpx;
  background: #fff;
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 0 16rpx 0 32rpx;
}

.rc__input-field {
  flex: 1;
  min-width: 0;
  font-size: 26rpx;
  height: 88rpx;
}

.rc__input-ph {
  color: var(--c-text-placeholder);
  font-size: 26rpx;
}

.rc__send {
  width: 128rpx;
  height: 64rpx;
  border-radius: 32rpx;
  background: var(--grad-main);
  color: #fff;
  font-size: 25rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
</style>
