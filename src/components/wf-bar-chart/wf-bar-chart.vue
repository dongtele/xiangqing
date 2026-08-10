<script lang="ts">
export default { options: { virtualHost: true } };
</script>

<script setup lang="ts">
import type { ChartBar } from '@/models';

/**
 * 竖向柱状图。08 工作台近 7 天营业额、46 营业数据近 7 日、89 下单次数分布共用。
 * 柱高由 percent 决定（服务端算好，前端不做归一化），tone 决定配色：
 * normal 浅橙、today 主渐变（当天）、strong 深橙渐变（89 的分布）。
 */
withDefaults(
  defineProps<{
    bars?: ChartBar[];
    /** 绘图区高度，rpx */
    height?: number;
    /** 柱顶是否显示数值（89 用） */
    showValue?: boolean;
  }>(),
  { bars: () => [], height: 224, showValue: false }
);
</script>

<template>
  <view class="bc" :style="{ height: height + 'rpx' }">
    <view v-for="b in bars" :key="b.label" class="bc__col">
      <text v-if="showValue" class="bc__value">{{ b.valueText }}</text>
      <view class="bc__bar" :class="`bc__bar--${b.tone}`" :style="{ height: b.percent + '%' }" />
      <text class="bc__label" :class="{ 'bc__label--today': b.tone === 'today' }">{{ b.label }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.bc {
  display: flex;
  align-items: flex-end;
  gap: 20rpx;
  padding: 0 8rpx;
}

.bc__col {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 10rpx;
}

.bc__value {
  font-size: 20rpx;
  font-weight: 700;
  color: var(--c-text-weak);
}

.bc__bar {
  width: 100%;
  border-radius: 12rpx 12rpx 6rpx 6rpx;
  min-height: 8rpx;
}

.bc__bar--weak,
.bc__bar--normal {
  background: #ffe0ce;
}

.bc__bar--mid {
  background: #ffb08f;
}

.bc__bar--today {
  background: var(--grad-main);
}

.bc__bar--strong {
  background: linear-gradient(180deg, #ffa24d, #ff4a17);
}

.bc__label {
  font-size: 20rpx;
  color: var(--c-text-weaker);
}

.bc__label--today {
  color: var(--c-primary);
  font-weight: 800;
}
</style>
