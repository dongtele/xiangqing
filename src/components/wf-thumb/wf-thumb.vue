<script lang="ts">
export default { options: { virtualHost: true } };
</script>

<script setup lang="ts">
/**
 * 图片位。
 * 交付文档 Assets：设计稿里所有图片都是 `#F0EAE3` 灰块占位，真实图源待业务方提供。
 * 所以 src 为空就渲染灰块，有值才渲染 <image>——换 CDN 图只改 mock/images.ts。
 */
withDefaults(
  defineProps<{
    src?: string;
    /** 圆角，rpx */
    radius?: number;
    mode?: string;
  }>(),
  { src: '', radius: 20, mode: 'aspectFill' }
);
</script>

<template>
  <image
    v-if="src"
    class="thumb-img"
    :src="src"
    :mode="mode"
    :style="{ borderRadius: radius + 'rpx' }"
    lazy-load
  />
  <view v-else class="thumb-ph" :style="{ borderRadius: radius + 'rpx' }" />
</template>

<style lang="scss" scoped>
.thumb-img,
.thumb-ph {
  width: 100%;
  height: 100%;
  display: block;
  background: var(--c-img-placeholder);
}
</style>
