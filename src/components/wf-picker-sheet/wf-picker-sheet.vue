<script setup lang="ts">
/**
 * 通用单选半屏浮层（遮罩 + 圆角面板 + 打勾），与 15/30/31/59/03 的 sheet 同一套语言。
 *
 * 不用 `uni.showActionSheet`：微信端有 6 项上限，而这里最主要的用途是选商品分类，
 * 分类是商家在 22 分类管理里自己加的，超过 6 个很正常。
 *
 * 目前两处在用：11 编辑商品的「所属分类」、36 规格与价格的「规格组类型」。
 */
export interface PickerOption {
  value: string;
  label: string;
  /** 副文案，如分类下的商品数、组类型的说明 */
  sub?: string;
}

withDefaults(
  defineProps<{
    show: boolean;
    title?: string;
    options: PickerOption[];
    /** 已选值 */
    value?: string;
    /** 底部动作文案，如「去分类管理 ›」；留空则不出 */
    footerText?: string;
  }>(),
  { title: '请选择', value: '', footerText: '' }
);

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'pick', value: string): void;
  (e: 'footer'): void;
}>();
</script>

<template>
  <view v-if="show" class="ps">
    <view class="ps__mask" @tap="emit('close')" />

    <view class="ps__panel">
      <view class="ps__head">
        <text class="ps__title">{{ title }}</text>
        <text class="ps__close tap-sm" @tap="emit('close')">✕</text>
      </view>

      <scroll-view class="ps__body" scroll-y>
        <view
          v-for="o in options"
          :key="o.value"
          class="ps__row tap"
          :class="{ 'ps__row--on': o.value === value }"
          @tap="emit('pick', o.value)"
        >
          <view class="flex1 col ps__row-text">
            <text class="ps__row-label">{{ o.label }}</text>
            <text v-if="o.sub" class="ps__row-sub">{{ o.sub }}</text>
          </view>
          <text v-if="o.value === value" class="ps__tick">✓</text>
        </view>

        <view v-if="!options.length" class="ps__empty">还没有可选项</view>
      </scroll-view>

      <view v-if="footerText" class="ps__footer tap" @tap="emit('footer')">{{ footerText }}</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.ps {
  position: fixed;
  inset: 0;
  z-index: 60;
}

.ps__mask {
  position: absolute;
  inset: 0;
  background: rgba(32, 22, 15, 0.45);
}

.ps__panel {
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

.ps__head {
  padding: 32rpx 36rpx 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.ps__title {
  font-size: 32rpx;
  font-weight: 800;
}

.ps__close {
  font-size: 32rpx;
  color: var(--c-text-placeholder);
}

.ps__body {
  flex: 1;
  min-height: 0;
  padding: 0 32rpx;
}

.ps__row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 28rpx 8rpx;
}

.ps__row + .ps__row {
  border-top: 1px solid var(--c-line);
}

.ps__row-text {
  gap: 6rpx;
}

.ps__row-label {
  font-size: 28rpx;
  font-weight: 700;
}

.ps__row--on .ps__row-label {
  color: var(--c-primary);
  font-weight: 800;
}

.ps__row-sub {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.ps__tick {
  font-size: 30rpx;
  font-weight: 800;
  color: var(--c-primary);
}

.ps__empty {
  padding: 60rpx 0;
  text-align: center;
  font-size: 24rpx;
  color: var(--c-text-weak);
}

.ps__footer {
  flex-shrink: 0;
  text-align: center;
  font-size: 26rpx;
  font-weight: 700;
  color: var(--c-primary);
  border-top: 1px solid var(--c-line);
  padding: 28rpx 0;
  padding-bottom: calc(28rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(28rpx + env(safe-area-inset-bottom));
}
</style>
