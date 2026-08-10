<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getNotifySwitches, setNotifySwitch } from '@/services/api';
import type { NotifySwitch } from '@/models';

/** 75 · 通知设置：区分订单类与营销类通知，从 44 设置与 37 消息共用入口进入 */
const items = ref<NotifySwitch[]>([]);

const pushGroup = computed(() => items.value.filter((i) => i.group === 'push'));
const quietGroup = computed(() => items.value.filter((i) => i.group === 'quiet'));

onLoad(() => {
  load();
});

async function load(): Promise<void> {
  items.value = await getNotifySwitches();
}

async function onChange(key: string, on: boolean): Promise<void> {
  const item = items.value.find((i) => i.key === key);
  if (item) item.on = on;
  await setNotifySwitch(key, on);
}
</script>

<template>
  <view class="ns">
    <wf-nav-bar title="通知设置" />

    <scroll-view class="ns__body" scroll-y>
      <view class="card ns__group">
        <view v-for="(n, i) in pushGroup" :key="n.key" class="col">
          <view v-if="i" class="hairline ns__line" />
          <view class="ns__row">
            <view class="flex1 col ns__text">
              <text class="ns__name">{{ n.name }}</text>
              <text class="ns__sub">{{ n.sub }}</text>
            </view>
            <wf-toggle :on="n.on" @change="onChange(n.key, $event)" />
          </view>
        </view>
      </view>

      <view class="card ns__group">
        <view v-for="(n, i) in quietGroup" :key="n.key" class="col">
          <view v-if="i" class="hairline ns__line" />
          <view class="ns__row">
            <view class="flex1 col ns__text">
              <text class="ns__name">{{ n.name }}</text>
              <text class="ns__sub">{{ n.sub }}</text>
            </view>
            <wf-toggle :on="n.on" @change="onChange(n.key, $event)" />
          </view>
        </view>
      </view>

      <text class="ns__note"
        >微信订阅消息需在每次下单时确认授权，关闭后将只在小程序内提示。</text
      >
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.ns {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ns__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx calc(40rpx + constant(safe-area-inset-bottom));
  padding: 20rpx 32rpx calc(40rpx + env(safe-area-inset-bottom));
}

.ns__group {
  gap: 28rpx;
  margin-bottom: 20rpx;
}

.ns__line {
  margin-bottom: 28rpx;
}

.ns__row {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.ns__text {
  gap: 4rpx;
}

.ns__name {
  font-size: 27rpx;
  font-weight: 700;
}

.ns__sub {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.ns__note {
  display: block;
  font-size: 23rpx;
  color: var(--c-text-weaker);
  line-height: 1.7;
  padding: 4rpx 8rpx;
}
</style>
