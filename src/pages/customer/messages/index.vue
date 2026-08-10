<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getMessages, readAllMessages } from '@/services/api';
import { push, toast } from '@/utils/nav';
import type { MessageItem, MessageTab } from '@/models';

/** 37 · 消息通知：订单推送与优惠提醒集中一处，红点从 07「我的」进入 */
const TABS: { key: MessageTab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'order', label: '订单' },
  { key: 'promo', label: '优惠' },
];

const activeTab = ref<MessageTab>('all');
const list = ref<MessageItem[]>([]);
const unread = ref(0);
const loading = ref(true);

onShow(() => {
  load();
});

async function load(): Promise<void> {
  loading.value = true;
  const res = await getMessages(activeTab.value);
  list.value = res.list;
  unread.value = res.unread;
  loading.value = false;
}

function onSwitchTab(key: MessageTab): void {
  if (key === activeTab.value) return;
  activeTab.value = key;
  load();
}

async function onReadAll(): Promise<void> {
  if (!unread.value) {
    toast('没有未读消息');
    return;
  }
  await readAllMessages();
  toast('已全部标为已读');
  load();
}

function onTapMessage(id: string): void {
  push(`/pages/customer/message-detail/index?id=${id}`);
}
</script>

<template>
  <view class="msg">
    <wf-nav-bar title="消息" right="全部已读" @righttap="onReadAll" />

    <scroll-view class="msg__body" scroll-y>
      <view class="msg__tabs">
        <view
          v-for="t in TABS"
          :key="t.key"
          class="msg__tab"
          :class="{ 'msg__tab--on': activeTab === t.key }"
          @tap="onSwitchTab(t.key)"
          >{{ t.label }}</view
        >
      </view>

      <template v-if="loading">
        <view v-for="n in 3" :key="n" class="card msg__item">
          <view class="skeleton" style="width: 76rpx; height: 76rpx; border-radius: 24rpx" />
          <view class="flex1 col" style="gap: 12rpx">
            <view class="skeleton" style="width: 40%; height: 28rpx" />
            <view class="skeleton" style="width: 90%; height: 24rpx" />
          </view>
        </view>
      </template>

      <template v-else-if="list.length">
        <view
          v-for="m in list"
          :key="m.id"
          class="card msg__item tap"
          @tap="onTapMessage(m.id)"
        >
          <view class="msg__icon" :class="`msg__icon--${m.tone}`">
            <wf-icon
              :name="m.icon"
              :size="38"
              :color="m.tone === 'success' ? '#07C160' : '#FF4A17'"
              :weight="1.9"
            />
          </view>
          <view class="flex1 col msg__text">
            <view class="row--between">
              <text class="msg__title">{{ m.title }}</text>
              <text class="msg__time">{{ m.timeText }}</text>
            </view>
            <text class="msg__desc">{{ m.desc }}</text>
          </view>
          <view v-if="m.unread" class="msg__dot" />
        </view>

        <text class="msg__foot">仅保留最近 30 天消息</text>
      </template>

      <view v-else class="empty">
        <text class="empty__text">这个分类下暂无消息</text>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.msg {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.msg__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx calc(40rpx + constant(safe-area-inset-bottom));
  padding: 20rpx 32rpx calc(40rpx + env(safe-area-inset-bottom));
}

.msg__tabs {
  display: flex;
  gap: 36rpx;
  padding: 0 8rpx 20rpx;
}

.msg__tab {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--c-text-weaker);
  padding-bottom: 12rpx;
  position: relative;
}

.msg__tab--on {
  font-weight: 800;
  color: var(--c-text);
}

.msg__tab--on::after {
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

.msg__item {
  flex-direction: row;
  align-items: flex-start;
  gap: 24rpx;
  margin-bottom: 20rpx;
}

.msg__icon {
  width: 76rpx;
  height: 76rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.msg__icon--primary {
  background: var(--c-primary-bg);
}

.msg__icon--success {
  background: #f1f5f2;
}

.msg__text {
  gap: 6rpx;
}

.msg__title {
  font-size: 27rpx;
  font-weight: 800;
}

.msg__time {
  font-size: 21rpx;
  color: var(--c-text-placeholder);
  flex-shrink: 0;
  margin-left: 16rpx;
}

.msg__desc {
  font-size: 24rpx;
  color: var(--c-text-3);
  line-height: 1.6;
}

.msg__dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: var(--c-primary-deep);
  margin-top: 12rpx;
  flex-shrink: 0;
}

.msg__foot {
  display: block;
  text-align: center;
  font-size: 22rpx;
  color: var(--c-text-placeholder-2);
  padding-top: 12rpx;
}
</style>
