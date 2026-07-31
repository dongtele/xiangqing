<script lang="ts">
export default { options: { virtualHost: true } };
</script>

<script setup lang="ts">
/** 数量步进器。qty 为 0 时只露「＋」（菜单页），>0 时展开「－ n ＋」。 */
withDefaults(
  defineProps<{
    qty?: number;
    /** ＋ 按钮直径，rpx */
    plusSize?: number;
    /** － 按钮直径，rpx */
    minusSize?: number;
    /** gradient：主渐变实心；soft：主色浅底 */
    tone?: 'gradient' | 'soft';
    /** 数字字号，rpx */
    fontSize?: number;
    /** 始终展示「－」（详情页 / 购物车明细） */
    alwaysMinus?: boolean;
  }>(),
  { qty: 0, plusSize: 52, minusSize: 48, tone: 'gradient', fontSize: 27, alwaysMinus: false }
);

const emit = defineEmits<{ (e: 'plus'): void; (e: 'minus'): void }>();
</script>

<template>
  <view class="stepper">
    <view
      v-if="qty > 0 || alwaysMinus"
      class="stepper__minus tap-sm"
      :style="{ width: minusSize + 'rpx', height: minusSize + 'rpx' }"
      @tap.stop="emit('minus')"
    >
      <text class="stepper__glyph">－</text>
    </view>
    <text
      v-if="qty > 0 || alwaysMinus"
      class="stepper__qty"
      :style="{ fontSize: fontSize + 'rpx' }"
      >{{ qty }}</text
    >
    <view
      class="stepper__plus"
      :class="`stepper__plus--${tone}`"
      :style="{ width: plusSize + 'rpx', height: plusSize + 'rpx' }"
      @tap.stop="emit('plus')"
    >
      <text class="stepper__glyph">＋</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.stepper {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.stepper__minus,
.stepper__plus {
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stepper__minus {
  border: 3rpx solid var(--c-border-btn);
  color: var(--c-text-weak);
}

.stepper__plus--gradient {
  background: var(--grad-main);
  color: #fff;
}

.stepper__plus--soft {
  background: var(--c-primary-bg);
  color: var(--c-primary);
}

.stepper__glyph {
  font-size: 30rpx;
  font-weight: 700;
  line-height: 1;
}

.stepper__qty {
  font-weight: 800;
  min-width: 28rpx;
  text-align: center;
}
</style>
