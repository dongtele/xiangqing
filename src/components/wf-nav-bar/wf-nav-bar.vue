<script setup lang="ts">
import { chrome } from '@/utils/chrome';
import { back } from '@/utils/nav';

/**
 * 自定义标题栏：高 44px，标题 17px/800 居中，左侧返回圆钮 32×32。
 * theme=dark 用于渐变 / 大图头部（白字 + 半透明底钮）。
 *
 * 纵向位置跟随设计稿的两种处理：
 * - 常规（占位）标题栏落在胶囊按钮**下方**，整行宽度可用，右侧文字按钮不会被胶囊压住；
 * - fixed（浮在大图 / 渐变上）时只有返回钮，与胶囊按钮同一水平线。
 */
const props = withDefaults(
  defineProps<{
    title?: string;
    /** 右侧文字按钮 */
    right?: string;
    theme?: 'light' | 'dark';
    /** 背景色；transparent 时叠在页面头部之上 */
    bg?: string;
    showBack?: boolean;
    /** 是否浮在内容上层（不占位） */
    fixed?: boolean;
  }>(),
  { title: '', right: '', theme: 'light', bg: 'transparent', showBack: true, fixed: false }
);

const emit = defineEmits<{ (e: 'righttap'): void }>();

const { statusBarHeight, navBarHeight, capsuleBottom } = chrome();
const topSpacer = props.fixed ? statusBarHeight : capsuleBottom;
</script>

<template>
  <view
    class="nav"
    :class="{ 'nav--fixed': fixed, 'nav--dark': theme === 'dark' }"
    :style="{ background: bg }"
  >
    <view :style="{ height: topSpacer + 'px' }" />
    <view class="nav__row" :style="{ height: navBarHeight + 'px' }">
      <view v-if="showBack" class="nav__back tap" @tap="back()">
        <text class="nav__back-glyph">‹</text>
      </view>
      <text class="nav__title">{{ title }}</text>
      <text v-if="right" class="nav__right tap" @tap="emit('righttap')">{{ right }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.nav {
  position: relative;
  z-index: 40;
  flex-shrink: 0;
}

.nav--fixed {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
}

.nav__row {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 32rpx;
}

.nav__title {
  font-size: 34rpx;
  font-weight: 800;
  color: var(--c-text);
}

.nav__back {
  position: absolute;
  left: 32rpx;
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: var(--sh-round-btn);
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav__back-glyph {
  font-size: 38rpx;
  line-height: 1;
  color: var(--c-text);
  margin-top: -4rpx;
  margin-left: -2rpx;
}

.nav__right {
  position: absolute;
  right: 32rpx;
  font-size: 25rpx;
  font-weight: 800;
  color: var(--c-primary);
}

/* 深色（渐变 / 大图）头部 */
.nav--dark .nav__title {
  color: #ffffff;
}

.nav--dark .nav__back {
  background: rgba(0, 0, 0, 0.38);
  box-shadow: none;
}

.nav--dark .nav__back-glyph {
  color: #ffffff;
}

.nav--dark .nav__right {
  color: #ffffff;
}
</style>
