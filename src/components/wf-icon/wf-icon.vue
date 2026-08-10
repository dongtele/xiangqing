<script lang="ts">
export default { options: { virtualHost: true } };
</script>

<script setup lang="ts">
import { computed } from 'vue';
import { ICON_EXTRA, ICON_PATHS } from './icons';

/**
 * 线性图标。把 SVG 路径按 color 烘焙成 data URI 当 background-image 用，
 * 不引位图，任意尺寸清晰；新增图标写进 icons.ts 即可。
 */
const props = withDefaults(
  defineProps<{
    name: string;
    /** rpx */
    size?: number;
    color?: string;
    weight?: number;
  }>(),
  { size: 40, color: '#20160F', weight: 1.9 }
);

const bg = computed(() => {
  const inner = (ICON_EXTRA[props.name] || ICON_PATHS[props.name] || '').replace(
    /CURRENT/g,
    props.color
  );
  if (!inner) return '';
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${props.color}" ` +
    `stroke-width="${props.weight}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
});
</script>

<template>
  <view
    class="icon"
    :style="{ width: size + 'rpx', height: size + 'rpx', backgroundImage: bg }"
  />
</template>

<style lang="scss" scoped>
.icon {
  flex-shrink: 0;
  background-repeat: no-repeat;
  background-position: center;
  background-size: 100% 100%;
}
</style>
