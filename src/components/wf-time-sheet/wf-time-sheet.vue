<script setup lang="ts">
import { computed } from 'vue';

/**
 * 03 · 期望送达时间。
 *
 * 设计稿只画了 `确认订单` 上的这一行入口，没画选择器本身，
 * 所以按 15/31/59 同样的半屏浮层做法补上——盖在 03 之上，不进 pages.json。
 * 时段按半小时分档，从当前时间的下一个半点开始，共 8 档（约 4 小时）。
 */
const props = withDefaults(
  defineProps<{
    show: boolean;
    /** 已选时段；空串表示「立即送出 / 尽快取餐」 */
    value?: string;
    deliveryType?: 'delivery' | 'pickup';
    /** 试算返回的预计时间，用于「立即」那一档的副文案 */
    etaText?: string;
  }>(),
  { value: '', deliveryType: 'delivery', etaText: '' }
);

const emit = defineEmits<{ (e: 'close'): void; (e: 'pick', value: string): void }>();

const nowLabel = computed(() => (props.deliveryType === 'delivery' ? '立即送出' : '尽快取餐'));

/** 下一个半点起，每 30 分钟一档 */
const slots = computed(() => {
  const out: string[] = [];
  const now = new Date();
  let h = now.getHours();
  let m = now.getMinutes() < 30 ? 30 : 60;
  if (m === 60) {
    h += 1;
    m = 0;
  }
  for (let i = 0; i < 8; i += 1) {
    const hh = String(h % 24).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    const end = m === 30 ? `${String((h + 1) % 24).padStart(2, '0')}:00` : `${hh}:30`;
    out.push(`${hh}:${mm} - ${end}`);
    if (m === 30) {
      h += 1;
      m = 0;
    } else {
      m = 30;
    }
  }
  return out;
});
</script>

<template>
  <view v-if="show" class="ts">
    <view class="ts__mask" @tap="emit('close')" />

    <view class="ts__panel">
      <view class="ts__head">
        <text class="ts__title">{{ deliveryType === 'delivery' ? '选择送达时间' : '选择取餐时间' }}</text>
        <text class="ts__close tap-sm" @tap="emit('close')">✕</text>
      </view>

      <scroll-view class="ts__body" scroll-y>
        <view class="ts__row tap" :class="{ 'ts__row--on': !value }" @tap="emit('pick', '')">
          <view class="flex1 col ts__row-text">
            <text class="ts__row-label">{{ nowLabel }}</text>
            <text v-if="etaText" class="ts__row-sub">{{ etaText }}</text>
          </view>
          <text v-if="!value" class="ts__tick">✓</text>
        </view>

        <view
          v-for="s in slots"
          :key="s"
          class="ts__row tap"
          :class="{ 'ts__row--on': value === s }"
          @tap="emit('pick', s)"
        >
          <text class="ts__row-label flex1">{{ s }}</text>
          <text v-if="value === s" class="ts__tick">✓</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.ts {
  position: fixed;
  inset: 0;
  z-index: 60;
}

.ts__mask {
  position: absolute;
  inset: 0;
  background: rgba(32, 22, 15, 0.45);
}

.ts__panel {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  max-height: 68%;
  background: var(--c-card);
  border-radius: 44rpx 44rpx 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ts__head {
  padding: 32rpx 36rpx 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.ts__title {
  font-size: 32rpx;
  font-weight: 800;
}

.ts__close {
  font-size: 32rpx;
  color: var(--c-text-placeholder);
}

.ts__body {
  flex: 1;
  min-height: 0;
  padding: 0 32rpx calc(24rpx + constant(safe-area-inset-bottom));
  padding: 0 32rpx calc(24rpx + env(safe-area-inset-bottom));
}

.ts__row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 28rpx 8rpx;
}

.ts__row + .ts__row {
  border-top: 1px solid var(--c-line);
}

.ts__row-text {
  gap: 6rpx;
}

.ts__row-label {
  font-size: 28rpx;
  font-weight: 700;
}

.ts__row--on .ts__row-label {
  color: var(--c-primary);
  font-weight: 800;
}

.ts__row-sub {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.ts__tick {
  font-size: 30rpx;
  font-weight: 800;
  color: var(--c-primary);
}
</style>
