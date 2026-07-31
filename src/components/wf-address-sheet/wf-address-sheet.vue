<script setup lang="ts">
import { ref, watch } from 'vue';
import { getAddresses } from '@/services/api';
import { push, toast } from '@/utils/nav';
import type { AddressFull } from '@/models';

/**
 * 15 · 选择收货地址（半屏浮层）。
 * 与 31 一样，设计稿把它画成盖在「确认订单(03)」上的 sheet，所以做成组件。
 * 「超出配送范围」的地址不可选，与 33 配送范围规则一致。
 */
const props = withDefaults(defineProps<{ show?: boolean; selectedId?: string }>(), {
  show: false,
  selectedId: '',
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm', address: AddressFull): void;
}>();

const list = ref<AddressFull[]>([]);
const pickedId = ref(props.selectedId);

watch(
  () => props.show,
  async (show) => {
    if (!show) return;
    list.value = await getAddresses();
    pickedId.value =
      props.selectedId || (list.value.find((a) => a.isDefault && !a.outOfRange)?.id ?? '');
  },
  { immediate: true }
);

function onPick(a: AddressFull): void {
  if (a.outOfRange) {
    toast('该地址超出配送范围，可改为到店自取');
    return;
  }
  pickedId.value = a.id;
}

function onConfirm(): void {
  const hit = list.value.find((a) => a.id === pickedId.value);
  if (!hit) {
    toast('请选择收货地址');
    return;
  }
  emit('confirm', hit);
}
</script>

<template>
  <view class="mask" :class="{ 'mask--on': show }" @tap="emit('close')" @touchmove.stop.prevent />

  <view class="as" :class="{ 'as--on': show }" @touchmove.stop.prevent>
    <view class="as__head">
      <text class="as__title">选择收货地址</text>
      <view class="as__close tap" @tap="emit('close')"><text>✕</text></view>
    </view>

    <scroll-view class="as__list" scroll-y>
      <view
        v-for="a in list"
        :key="a.id"
        class="as__item"
        :class="{ 'as__item--on': pickedId === a.id }"
        @tap="onPick(a)"
      >
        <view class="flex1 col as__item-text">
          <view class="row as__item-title">
            <text class="as__detail">{{ a.detail }}</text>
            <text v-if="a.isDefault" class="as__default">默认</text>
          </view>
          <text class="as__meta"
            >{{ a.receiver }}（{{ a.gender }}）{{ a.phoneMask }} · {{ a.distanceText }}</text
          >
        </view>
        <view v-if="pickedId === a.id" class="as__check"><text>✓</text></view>
        <text v-else-if="a.outOfRange" class="as__out">超出配送范围</text>
        <text
          v-else
          class="as__edit tap"
          @tap.stop="push(`/pages/customer/address-edit/index?id=${a.id}`)"
          >✎</text
        >
      </view>
    </scroll-view>

    <view class="as__foot">
      <view class="as__add tap" @tap="push('/pages/customer/address-edit/index')"
        >＋ 新增收货地址</view
      >
      <view class="btn btn--primary tap" @tap="onConfirm">确认，返回结算</view>
    </view>
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

.as {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 61;
  max-height: 70vh;
  background: #fff;
  border-radius: 48rpx 48rpx 0 0;
  display: flex;
  flex-direction: column;
  transform: translateY(110%);
  transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1);
}

.as--on {
  transform: translateY(0);
}

.as__head {
  padding: 36rpx 40rpx 12rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.as__title {
  font-size: 33rpx;
  font-weight: 800;
}

.as__close {
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

.as__list {
  flex: 1;
  min-height: 200rpx;
  max-height: 44vh;
  padding: 20rpx 40rpx;
}

.as__item {
  border: 3rpx solid var(--c-line-2);
  border-radius: 32rpx;
  padding: 28rpx 32rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 20rpx;
}

.as__item--on {
  border-color: var(--c-primary);
  background: var(--c-primary-bg-weak);
}

.as__item-text {
  gap: 6rpx;
}

.as__item-title {
  gap: 12rpx;
}

.as__detail {
  font-size: 29rpx;
  font-weight: 800;
}

.as__default {
  background: var(--c-primary);
  color: #fff;
  font-size: 18rpx;
  font-weight: 800;
  padding: 3rpx 12rpx;
  border-radius: 10rpx;
}

.as__meta {
  font-size: 23rpx;
  color: var(--c-text-weaker);
}

.as__check {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: var(--c-primary);
  color: #fff;
  font-size: 22rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.as__out {
  font-size: 21rpx;
  color: var(--c-danger);
  font-weight: 700;
  background: var(--c-danger-bg);
  padding: 6rpx 16rpx;
  border-radius: 14rpx;
  flex-shrink: 0;
}

.as__edit {
  color: var(--c-text-placeholder-2);
  font-size: 28rpx;
}

.as__foot {
  flex-shrink: 0;
  padding: 16rpx 40rpx;
  padding-bottom: calc(40rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.as__add {
  text-align: center;
  border: 3rpx dashed #ffb08f;
  color: var(--c-primary);
  font-size: 27rpx;
  font-weight: 800;
  padding: 24rpx 0;
  border-radius: 46rpx;
}
</style>
