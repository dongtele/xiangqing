<script lang="ts">
export default { options: { virtualHost: true } };
</script>

<script setup lang="ts">
export interface TimelineItem {
  title: string;
  sub: string;
  done: boolean;
}

/** 竖向时间轴：订单详情（06）状态轴，后续退款进度（40）、入驻审核（24 / 28）共用 */
withDefaults(defineProps<{ nodes?: TimelineItem[] }>(), { nodes: () => [] });
</script>

<template>
  <view class="vt">
    <view v-for="(node, index) in nodes" :key="node.title" class="vt__row">
      <view class="vt__rail">
        <view class="vt__dot" :class="{ 'vt__dot--on': node.done }" />
        <view
          v-if="index < nodes.length - 1"
          class="vt__line"
          :class="{ 'vt__line--on': node.done && nodes[index + 1].done }"
        />
      </view>
      <view class="vt__text" :class="{ 'vt__text--gap': index < nodes.length - 1 }">
        <text class="vt__title" :class="{ 'vt__title--todo': !node.done }">{{ node.title }}</text>
        <text class="vt__sub">{{ node.sub }}</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.vt {
  display: flex;
  flex-direction: column;
}

.vt__row {
  display: flex;
  gap: 24rpx;
}

.vt__rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.vt__dot {
  width: 22rpx;
  height: 22rpx;
  border-radius: 50%;
  background: var(--c-border-btn);
  margin-top: 8rpx;
}

.vt__dot--on {
  background: var(--c-primary);
}

.vt__line {
  width: 4rpx;
  flex: 1;
  min-height: 68rpx;
  background: #efe8e0;
}

.vt__line--on {
  background: var(--c-primary);
}

.vt__text {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.vt__text--gap {
  padding-bottom: 16rpx;
}

.vt__title {
  font-size: 27rpx;
  font-weight: 800;
  color: var(--c-text);
}

.vt__title--todo {
  font-weight: 600;
  color: var(--c-text-weaker);
}

.vt__sub {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}
</style>
