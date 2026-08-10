<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getGoods } from '@/services/api';
import { chrome } from '@/utils/chrome';
import { back } from '@/utils/nav';

/** 54 · 菜品大图预览（L4 浮层）：全屏浏览 + 缩略图切换 */
const topPad = ref(96);
const title = ref('');
const photos = ref<string[]>([]);
const index = ref(0);

const counter = computed(() => `${index.value + 1} / ${photos.value.length || 1}`);

onLoad(async (o) => {
  topPad.value = chrome().capsuleBottom + 16;
  const id = (o && o.id) || '';
  index.value = Number((o && o.index) || 0);
  const goods = await getGoods(id);
  if (!goods) return;
  title.value = `${goods.name} · 商家实拍`;
  // 真实数据里一个商品会有多张实拍图；mock 只给了主图，其余按占位排布
  photos.value = [goods.image, '', '', '', '', ''];
});
</script>

<template>
  <view class="pv">
    <view class="pv__stage">
      <view class="pv__img"><wf-thumb :src="photos[index] || ''" :radius="0" mode="aspectFit" /></view>
    </view>

    <view class="pv__close tap" :style="{ top: topPad + 'px' }" @tap="back()">
      <text class="pv__close-glyph">✕</text>
    </view>
    <text class="pv__counter" :style="{ top: topPad + 4 + 'px' }">{{ counter }}</text>

    <view class="pv__foot">
      <text class="pv__title">{{ title }}</text>
      <view class="pv__thumbs">
        <view
          v-for="(p, i) in photos"
          :key="i"
          class="pv__thumb"
          :class="{ 'pv__thumb--on': i === index }"
          @tap="index = i"
        >
          <wf-thumb :src="p" :radius="16" />
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.pv {
  height: 100vh;
  background: #161009;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pv__stage {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pv__img {
  width: 100%;
  height: 750rpx;
  background: #2b211a;
}

.pv__close {
  position: absolute;
  left: 32rpx;
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pv__close-glyph {
  color: #fff;
  font-size: 30rpx;
  line-height: 1;
}

.pv__counter {
  position: absolute;
  right: 32rpx;
  font-size: 26rpx;
  font-weight: 700;
  color: #fff;
}

.pv__foot {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 40rpx 32rpx;
  padding-bottom: calc(40rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.65));
}

.pv__title {
  font-size: 28rpx;
  font-weight: 800;
  color: #fff;
}

.pv__thumbs {
  display: flex;
  gap: 16rpx;
}

.pv__thumb {
  width: 96rpx;
  height: 96rpx;
  border-radius: 16rpx;
  background: #3a2e25;
  border: 4rpx solid transparent;
  overflow: hidden;
  flex-shrink: 0;
}

.pv__thumb--on {
  border-color: var(--c-primary);
}
</style>
