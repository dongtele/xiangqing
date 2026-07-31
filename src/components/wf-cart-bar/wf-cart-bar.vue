<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { fen2yuan } from '@/utils/money';

/** 菜单页底部购物车条（设计稿 01）。空车时不展示。 */
const props = withDefaults(
  defineProps<{
    count?: number;
    /** 商品合计，分 */
    total?: number;
    /** 凑单 / 已享优惠提示 */
    promoText?: string;
    /** 距底部距离，rpx（默认让位给 TabBar） */
    bottom?: number;
  }>(),
  { count: 0, total: 0, promoText: '', bottom: 128 }
);

const emit = defineEmits<{ (e: 'opencart'): void; (e: 'checkout'): void }>();

const totalText = computed(() => fen2yuan(props.total));

// 角标数字切换：160ms 上移淡入
const bump = ref(false);
watch(
  () => props.count,
  () => {
    bump.value = true;
    setTimeout(() => {
      bump.value = false;
    }, 160);
  }
);
</script>

<template>
  <view
    v-if="count > 0"
    class="cartbar"
    :style="{ bottom: `calc(${bottom}rpx + env(safe-area-inset-bottom))` }"
  >
    <view class="cartbar__icon tap-sm" @tap="emit('opencart')">
      <wf-icon name="cart" :size="42" color="#FFFFFF" />
      <text class="cartbar__badge" :class="{ 'cartbar__badge--bump': bump }">{{ count }}</text>
    </view>
    <view class="cartbar__mid tap" @tap="emit('opencart')">
      <text class="cartbar__total">¥{{ totalText }}</text>
      <text v-if="promoText" class="cartbar__promo">{{ promoText }}</text>
    </view>
    <view class="cartbar__btn tap" @tap="emit('checkout')">去结算</view>
  </view>
</template>

<style lang="scss" scoped>
.cartbar {
  position: fixed;
  left: 28rpx;
  right: 28rpx;
  z-index: 30;
  height: 108rpx;
  background: #20160f;
  border-radius: 54rpx;
  display: flex;
  align-items: center;
  padding: 0 12rpx 0 16rpx;
  box-shadow: 0 20rpx 52rpx rgba(32, 22, 15, 0.35);
}

.cartbar__icon {
  position: relative;
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: var(--grad-main);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cartbar__badge {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  background: #fff;
  color: var(--c-primary-deep);
  font-size: 20rpx;
  font-weight: 800;
  min-width: 34rpx;
  height: 34rpx;
  line-height: 30rpx;
  text-align: center;
  border-radius: 18rpx;
  border: 3rpx solid #ff3d00;
  transition: transform 0.16s ease, opacity 0.16s ease;
}

.cartbar__badge--bump {
  transform: translateY(-6rpx);
  opacity: 0.4;
}

.cartbar__mid {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2rpx;
  padding-left: 24rpx;
}

.cartbar__total {
  color: #fff;
  font-weight: 800;
  font-size: 34rpx;
}

.cartbar__promo {
  color: #ffb08f;
  font-size: 19rpx;
}

.cartbar__btn {
  background: var(--grad-main);
  color: #fff;
  font-size: 28rpx;
  font-weight: 800;
  padding: 20rpx 44rpx;
  border-radius: 44rpx;
}
</style>
