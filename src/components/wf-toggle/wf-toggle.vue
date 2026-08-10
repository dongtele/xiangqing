<script lang="ts">
export default { options: { virtualHost: true } };
</script>

<script setup lang="ts">
/** 开关：44×25（md）/ 40×23（sm），开 #00B578，关 #D9D2C9，滑块白色。 */
const props = withDefaults(
  defineProps<{
    on?: boolean;
    size?: 'md' | 'sm';
    disabled?: boolean;
  }>(),
  { on: false, size: 'md', disabled: false }
);

const emit = defineEmits<{ (e: 'change', on: boolean): void }>();

function onTap(): void {
  if (props.disabled) return;
  emit('change', !props.on);
}
</script>

<template>
  <view
    class="tg"
    :class="[`tg--${size}`, { 'tg--on': on, 'tg--disabled': disabled }]"
    @tap.stop="onTap"
  >
    <view class="tg__knob" />
  </view>
</template>

<style lang="scss" scoped>
.tg {
  border-radius: 999rpx;
  background: #d9d2c9;
  padding: 4rpx;
  display: flex;
  justify-content: flex-start;
  flex-shrink: 0;
  transition: background 0.18s ease;
}

.tg--md {
  width: 88rpx;
  height: 50rpx;
}

.tg--sm {
  width: 80rpx;
  height: 46rpx;
}

.tg--on {
  background: var(--c-success-2);
  justify-content: flex-end;
}

.tg--disabled {
  opacity: 0.5;
}

.tg__knob {
  width: 42rpx;
  height: 42rpx;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.15);
  transition: transform 0.18s ease;
}

.tg--sm .tg__knob {
  width: 38rpx;
  height: 38rpx;
}
</style>
