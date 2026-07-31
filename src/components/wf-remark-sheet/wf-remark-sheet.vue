<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { getRemarkOptions } from '@/services/api';
import type { RemarkOptions } from '@/models';

/**
 * 31 · 订单备注与餐具（半屏浮层）。
 * 设计稿把它画成盖在「确认订单(03)」上的 sheet，所以做成组件挂在 03 里，
 * 而不是单独一屏——这样遮罩下面能真实看到 03 的内容，动效也与 30 购物车明细一致。
 */
const props = withDefaults(
  defineProps<{ show?: boolean; remark?: string; tableware?: number }>(),
  { show: false, remark: '', tableware: 2 }
);

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm', payload: { remark: string; tableware: number }): void;
}>();

const options = ref<RemarkOptions | null>(null);
const text = ref(props.remark);
const count = ref(props.tableware);

const lengthText = computed(() => `${text.value.length}/${options.value?.maxLength ?? 50}`);

watch(
  () => props.show,
  async (show) => {
    if (!show) return;
    text.value = props.remark;
    count.value = props.tableware;
    if (!options.value) options.value = await getRemarkOptions();
  },
  { immediate: true }
);

function toggleQuick(word: string): void {
  const parts = text.value
    .split('，')
    .map((s) => s.trim())
    .filter(Boolean);
  const idx = parts.indexOf(word);
  if (idx >= 0) parts.splice(idx, 1);
  else parts.push(word);
  text.value = parts.join('，');
}

function picked(word: string): boolean {
  return text.value.indexOf(word) >= 0;
}

function onInput(e: Event): void {
  text.value = (e as unknown as { detail: { value: string } }).detail.value;
}
</script>

<template>
  <view class="mask" :class="{ 'mask--on': show }" @tap="emit('close')" @touchmove.stop.prevent />

  <view class="rs" :class="{ 'rs--on': show }" @touchmove.stop.prevent>
    <view class="rs__head">
      <text class="rs__title">备注与餐具</text>
      <view class="rs__close tap" @tap="emit('close')"><text>✕</text></view>
    </view>

    <view v-if="options" class="rs__section">
      <text class="rs__label">快捷备注</text>
      <view class="rs__quick">
        <text
          v-for="w in options.quick"
          :key="w"
          class="rs__chip"
          :class="{ 'rs__chip--on': picked(w) }"
          @tap="toggleQuick(w)"
          >{{ w }}</text
        >
      </view>
    </view>

    <view class="rs__editor">
      <textarea
        class="rs__textarea"
        :value="text"
        placeholder="口味偏好、配送要求…"
        placeholder-class="rs__ph"
        :maxlength="options ? options.maxLength : 50"
        @input="onInput"
      />
      <text class="rs__count">{{ lengthText }}</text>
    </view>

    <view class="rs__tableware">
      <view class="col rs__tableware-text">
        <text class="rs__tableware-title">餐具份数</text>
        <text class="rs__tableware-sub">按需提供，减少浪费</text>
      </view>
      <wf-qty-stepper
        :qty="count"
        always-minus
        :plus-size="54"
        :minus-size="54"
        :font-size="29"
        tone="soft"
        @plus="count += 1"
        @minus="count > 0 && (count -= 1)"
      />
    </view>

    <view class="btn btn--primary tap" @tap="emit('confirm', { remark: text, tableware: count })"
      >确定</view
    >
  </view>
</template>

<style lang="scss" scoped>
.mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(32, 22, 15, 0.5);
  z-index: 60;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.mask--on {
  opacity: 1;
  pointer-events: auto;
}

.rs {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 61;
  background: #fff;
  border-radius: 48rpx 48rpx 0 0;
  padding: 36rpx 40rpx;
  padding-bottom: calc(40rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 28rpx;
  transform: translateY(110%);
  transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1);
}

.rs--on {
  transform: translateY(0);
}

.rs__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.rs__title {
  font-size: 33rpx;
  font-weight: 800;
}

.rs__close {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: var(--c-fill-3);
  color: var(--c-text-weak);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
}

.rs__section {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.rs__label {
  font-size: 25rpx;
  font-weight: 800;
  color: var(--c-text-2);
}

.rs__quick {
  display: flex;
  gap: 16rpx;
  flex-wrap: wrap;
}

.rs__chip {
  border: 3rpx solid var(--c-line-2);
  color: var(--c-text-2);
  font-size: 24rpx;
  padding: 14rpx 28rpx;
  border-radius: 30rpx;
}

.rs__chip--on {
  border-color: var(--c-primary);
  background: var(--c-primary-bg);
  color: var(--c-primary);
  font-weight: 700;
}

.rs__editor {
  background: #faf7f2;
  border-radius: 28rpx;
  padding: 26rpx 28rpx;
  min-height: 156rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.rs__textarea {
  width: 100%;
  font-size: 25rpx;
  line-height: 1.6;
  min-height: 76rpx;
}

.rs__ph {
  color: var(--c-text-placeholder);
  font-size: 25rpx;
}

.rs__count {
  font-size: 20rpx;
  color: var(--c-text-placeholder);
  text-align: right;
}

.rs__tableware {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8rpx 0;
}

.rs__tableware-text {
  gap: 4rpx;
}

.rs__tableware-title {
  font-size: 27rpx;
  font-weight: 800;
}

.rs__tableware-sub {
  font-size: 21rpx;
  color: var(--c-text-weaker);
}
</style>
