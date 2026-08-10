<script lang="ts">
export default { options: { virtualHost: true } };
</script>

<script setup lang="ts">
import { computed } from 'vue';
import { fen2yuan } from '@/utils/money';

/** 价格排版：¥ 小、数字大、后缀弱化（设计稿统一写法） */
const props = withDefaults(
  defineProps<{
    /** 分 */
    fen: number;
    /** 主数字字号，rpx */
    size?: number;
    color?: string;
    /** 是否展示「起」（只有存在加价选项的商品才显示） */
    from?: boolean;
    /** 后缀，如 /杯 */
    unit?: string;
  }>(),
  { size: 38, color: '#FF3800', from: false, unit: '' }
);

const text = computed(() => fen2yuan(props.fen));
const symSize = computed(() => Math.round(props.size * 0.58));
const suffixSize = computed(() => Math.round(props.size * 0.53));
</script>

<template>
  <view class="price" :style="{ color }">
    <text class="price__sym" :style="{ fontSize: symSize + 'rpx' }">¥</text>
    <text class="price__num" :style="{ fontSize: size + 'rpx' }">{{ text }}</text>
    <text v-if="unit" class="price__suffix" :style="{ fontSize: suffixSize + 'rpx' }">{{
      unit
    }}</text>
    <text v-if="from" class="price__suffix" :style="{ fontSize: suffixSize + 'rpx' }"> 起</text>
  </view>
</template>

<style lang="scss" scoped>
.price {
  display: flex;
  align-items: baseline;
  font-weight: 800;
}

.price__num {
  line-height: 1.1;
}

.price__suffix {
  color: var(--c-text-placeholder);
  font-weight: 500;
}
</style>
