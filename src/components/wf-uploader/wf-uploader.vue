<script lang="ts">
export default { options: { virtualHost: true } };
</script>

<script setup lang="ts">
import type { UploadSlot } from '@/models';

/**
 * 资质图上传位，14 / 27 / 72 共用。三态：
 * 未上传（虚线 ＋）、已上传（显示图）、OCR 识别成功（绿色勾 + 识别结果）。
 * 交付文档 Assets 说明设计稿无位图素材，未上传时用灰块占位。
 */
withDefaults(
  defineProps<{
    item?: UploadSlot | null;
    /** 高度，rpx */
    height?: number;
  }>(),
  { item: null, height: 220 }
);

const emit = defineEmits<{ (e: 'pick'): void }>();
</script>

<template>
  <view v-if="item" class="up">
    <view v-if="item.label" class="up__head">
      <text class="up__label">{{ item.label }}</text>
      <text v-if="item.required" class="up__req">*</text>
      <text v-if="item.ocrText" class="up__ok">✓ 识别成功</text>
    </view>

    <view
      class="up__box tap"
      :class="{ 'up__box--filled': !!item.path }"
      :style="{ height: height + 'rpx' }"
      @tap="emit('pick')"
    >
      <template v-if="item.path">
        <image
          v-if="item.path !== 'ocr' && item.path !== 'uploaded'"
          class="up__img"
          :src="item.path"
          mode="aspectFill"
        />
        <view v-else class="up__filled">
          <wf-icon name="check" :size="44" color="#07C160" :weight="2.4" />
          <text class="up__filled-text">已上传</text>
        </view>
      </template>
      <template v-else>
        <text class="up__plus">＋</text>
        <text class="up__hint">{{ item.hint }}</text>
      </template>
    </view>

    <view v-if="item.ocrText" class="up__ocr">
      <text class="up__ocr-label">已自动识别：</text>
      <text class="up__ocr-text">{{ item.ocrText }}</text>
      <text class="up__ocr-hint">{{ item.hint }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.up {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  flex: 1;
  min-width: 0;
}

.up__head {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.up__label {
  font-size: 27rpx;
  font-weight: 700;
}

.up__req {
  color: var(--c-danger);
  font-size: 24rpx;
  font-weight: 800;
}

.up__ok {
  margin-left: auto;
  font-size: 22rpx;
  font-weight: 700;
  color: var(--c-success);
}

.up__box {
  border-radius: 24rpx;
  background: var(--c-img-placeholder);
  border: 3rpx dashed var(--c-line-2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  overflow: hidden;
}

.up__box--filled {
  border-style: solid;
  border-color: var(--c-success);
  background: var(--c-success-bg-2);
}

.up__img {
  width: 100%;
  height: 100%;
}

.up__filled {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.up__filled-text {
  font-size: 22rpx;
  font-weight: 700;
  color: var(--c-success-deep);
}

.up__plus {
  font-size: 48rpx;
  color: var(--c-text-placeholder-2);
  line-height: 1;
}

.up__hint {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.up__ocr {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.up__ocr-label {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.up__ocr-text {
  font-size: 24rpx;
  font-weight: 700;
  color: var(--c-text-2);
  line-height: 1.6;
}

.up__ocr-hint {
  font-size: 21rpx;
  color: var(--c-text-placeholder);
}
</style>
