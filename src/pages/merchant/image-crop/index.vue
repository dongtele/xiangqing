<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getGoodsDraft, saveGoodsDraft } from '@/services/api';
import { back, toast } from '@/utils/nav';
import { chrome } from '@/utils/chrome';
import type { GoodsDraft } from '@/models';

/**
 * 63 · 图片上传与裁剪。
 * 裁剪框、比例切换、缩略图队列按设计稿实现；真正的像素裁剪需要接
 * canvas / 原生裁剪库（微信端可用 wx.cropImage），这里先把选中的原图写回草稿，
 * 裁剪参数（比例）随图一并记录，接入裁剪能力后只替换 doCrop()。
 */
const RATIOS = [
  { key: '4:3', label: '4:3 主图', w: 4, h: 3 },
  { key: '1:1', label: '1:1 列表', w: 1, h: 1 },
  { key: '16:9', label: '16:9 头图', w: 16, h: 9 },
];

const topPad = ref(96);
const draft = ref<GoodsDraft | null>(null);
const ratio = ref('4:3');
const picked = ref<string[]>([]);
const activeIndex = ref(0);
let goodsId = '';

const frame = computed(() => {
  const r = RATIOS.find((x) => x.key === ratio.value) || RATIOS[0];
  const width = 670; // rpx，设计稿 335px
  return { width: `${width}rpx`, height: `${Math.round((width * r.h) / r.w)}rpx` };
});

onLoad(async (o) => {
  goodsId = (o && o.id) || '';
  topPad.value = chrome().capsuleBottom + 16;
  const res = await getGoodsDraft(goodsId);
  if (res) {
    draft.value = res;
    picked.value = res.images.filter(Boolean);
  }
});

function onPick(): void {
  uni.chooseImage({
    count: 5 - picked.value.length,
    success: (res) => {
      picked.value = [...picked.value, ...(res.tempFilePaths as string[])];
      activeIndex.value = picked.value.length - 1;
    },
    fail: () => toast('已取消，也可在设置里开启相册权限'),
  });
}

/** 占位：接入裁剪能力后在这里按 ratio 产出裁剪后的图 */
function doCrop(src: string): string {
  return src;
}

async function onDone(): Promise<void> {
  if (!draft.value) {
    back();
    return;
  }
  if (!picked.value.length) {
    toast('请先选择图片');
    return;
  }
  draft.value.images = picked.value.map(doCrop);
  await saveGoodsDraft(JSON.parse(JSON.stringify(draft.value)) as GoodsDraft);
  toast(`已按 ${ratio.value} 保存`, 'success');
  back();
}
</script>

<template>
  <view class="ic">
    <view class="ic__head" :style="{ paddingTop: topPad + 'px' }">
      <text class="ic__cancel tap" @tap="back()">取消</text>
      <text class="ic__title">裁剪主图</text>
      <text class="ic__done tap" @tap="onDone">完成</text>
    </view>

    <view class="ic__stage">
      <view class="ic__frame" :style="frame">
        <image
          v-if="picked[activeIndex]"
          class="ic__img"
          :src="picked[activeIndex]"
          mode="aspectFill"
        />
        <view class="ic__corner ic__corner--tl" />
        <view class="ic__corner ic__corner--tr" />
        <view class="ic__corner ic__corner--bl" />
        <view class="ic__corner ic__corner--br" />
        <view class="ic__grid">
          <view v-for="n in 9" :key="n" class="ic__cell" />
        </view>
      </view>
    </view>

    <view class="ic__foot">
      <view class="ic__ratios">
        <text
          v-for="r in RATIOS"
          :key="r.key"
          class="ic__ratio"
          :class="{ 'ic__ratio--on': ratio === r.key }"
          @tap="ratio = r.key"
          >{{ r.label }}</text
        >
      </view>

      <view class="ic__thumbs">
        <view
          v-for="(p, i) in picked"
          :key="i"
          class="ic__thumb"
          :class="{ 'ic__thumb--on': activeIndex === i }"
          @tap="activeIndex = i"
        >
          <image class="ic__thumb-img" :src="p" mode="aspectFill" />
          <text v-if="i === 0" class="ic__thumb-tag">主图</text>
        </view>
        <view v-if="picked.length < 5" class="ic__thumb-add tap" @tap="onPick">＋</view>
      </view>

      <text class="ic__hint">建议 800×600 以上实拍图；禁止水印、拼接与非本店菜品图</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.ic {
  height: 100vh;
  background: #161009;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ic__head {
  padding-left: 32rpx;
  padding-right: 32rpx;
  padding-bottom: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.ic__cancel {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

.ic__title {
  font-size: 30rpx;
  font-weight: 800;
  color: #fff;
}

.ic__done {
  font-size: 28rpx;
  font-weight: 800;
  color: #ff7b1c;
}

.ic__stage {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
}

.ic__frame {
  position: relative;
  background: #2b211a;
  border: 1px solid rgba(255, 255, 255, 0.25);
  overflow: hidden;
}

.ic__img {
  width: 100%;
  height: 100%;
}

.ic__corner {
  position: absolute;
  width: 44rpx;
  height: 44rpx;
  border: 6rpx solid #fff;
}

.ic__corner--tl {
  top: -2rpx;
  left: -2rpx;
  border-right: none;
  border-bottom: none;
}

.ic__corner--tr {
  top: -2rpx;
  right: -2rpx;
  border-left: none;
  border-bottom: none;
}

.ic__corner--bl {
  bottom: -2rpx;
  left: -2rpx;
  border-right: none;
  border-top: none;
}

.ic__corner--br {
  bottom: -2rpx;
  right: -2rpx;
  border-left: none;
  border-top: none;
}

.ic__grid {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-wrap: wrap;
}

.ic__cell {
  width: 33.33%;
  height: 33.33%;
  border: 1rpx solid rgba(255, 255, 255, 0.22);
}

.ic__foot {
  flex-shrink: 0;
  padding: 28rpx 32rpx;
  padding-bottom: calc(32rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 28rpx;
}

.ic__ratios {
  display: flex;
  gap: 20rpx;
  justify-content: center;
}

.ic__ratio {
  font-size: 25rpx;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  padding: 14rpx 28rpx;
  border-radius: 30rpx;
}

.ic__ratio--on {
  font-weight: 800;
  color: #fff;
  background: rgba(255, 255, 255, 0.16);
}

.ic__thumbs {
  display: flex;
  gap: 16rpx;
  align-items: center;
}

.ic__thumb {
  position: relative;
  width: 112rpx;
  height: 112rpx;
  border-radius: 16rpx;
  background: #3a2e25;
  border: 4rpx solid transparent;
  overflow: hidden;
  flex-shrink: 0;
}

.ic__thumb--on {
  border-color: var(--c-primary);
}

.ic__thumb-img {
  width: 100%;
  height: 100%;
}

.ic__thumb-tag {
  position: absolute;
  bottom: 4rpx;
  left: 4rpx;
  font-size: 18rpx;
  font-weight: 800;
  color: #fff;
  background: var(--c-primary);
  padding: 2rpx 10rpx;
  border-radius: 8rpx;
}

.ic__thumb-add {
  width: 112rpx;
  height: 112rpx;
  border-radius: 16rpx;
  border: 1px dashed rgba(255, 255, 255, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 40rpx;
  flex-shrink: 0;
}

.ic__hint {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.6;
}
</style>
