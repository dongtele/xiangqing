<script lang="ts">
export default { options: { virtualHost: true } };
</script>

<script setup lang="ts">
import type { OnboardStep } from '@/models';

/** 入驻流程顶部的三步步骤条，14 / 27 / 24 共用。已完成的步打勾，当前步高亮。 */
withDefaults(defineProps<{ steps?: OnboardStep[] }>(), { steps: () => [] });
</script>

<template>
  <view class="steps">
    <template v-for="(s, i) in steps" :key="s.no">
      <view v-if="i" class="steps__line" :class="{ 'steps__line--done': s.state !== 'todo' }" />
      <view class="steps__item">
        <view class="steps__dot" :class="`steps__dot--${s.state}`">{{
          s.state === 'done' ? '✓' : s.no
        }}</view>
        <text class="steps__label" :class="{ 'steps__label--on': s.state !== 'todo' }">{{
          s.label
        }}</text>
      </view>
    </template>
  </view>
</template>

<style lang="scss" scoped>
.steps {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.steps__item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-shrink: 0;
}

.steps__dot {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  font-size: 22rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--c-fill-3);
  color: var(--c-text-weaker);
}

.steps__dot--done {
  background: var(--c-success);
  color: #fff;
}

.steps__dot--active {
  background: var(--c-primary);
  color: #fff;
}

.steps__label {
  font-size: 23rpx;
  color: var(--c-text-weaker);
}

.steps__label--on {
  color: var(--c-text);
  font-weight: 800;
}

.steps__line {
  flex: 1;
  height: 3rpx;
  background: var(--c-line-2);
}

.steps__line--done {
  background: var(--c-primary-line-deep);
}
</style>
