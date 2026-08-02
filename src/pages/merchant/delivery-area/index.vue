<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getDeliveryArea, saveDeliveryArea } from '@/services/api';
import { HAS_MAP } from '@/config';
import { chrome } from '@/utils/chrome';
import { back, toast } from '@/utils/nav';
import type { AreaShape, DeliveryArea } from '@/models';

/**
 * 70 · 配送范围绘制。
 * 与 52 / 53 / 83 走同一套地图降级：有腾讯位置服务 key 就用 <map> + circles 画真实范围，
 * 没有 key 时用设计稿的 CSS 示意底图，档位数据结构完全一致，接入后页面不用改。
 */
const SHAPES: { key: AreaShape; label: string }[] = [
  { key: 'circle', label: '圆形' },
  { key: 'custom', label: '自定义' },
];

const topPad = ref(96);
const data = ref<DeliveryArea | null>(null);

/** 有 key 时按档位画同心圆；半径从「0 - 2 km」这类文案里取上界 */
const circles = computed(() => {
  if (!data.value) return [];
  return data.value.tiers.map((t, i) => {
    const upper = Number((t.rangeText.match(/-\s*([\d.]+)/) || [])[1] || i + 2);
    return {
      latitude: data.value!.latitude,
      longitude: data.value!.longitude,
      radius: upper * 1000,
      strokeWidth: 2,
      color: '#FF4A1788',
      fillColor: '#FF4A171A',
    };
  });
});

onLoad(async () => {
  topPad.value = chrome().capsuleBottom + 12;
  data.value = await getDeliveryArea();
});

function onShape(key: AreaShape): void {
  if (!data.value) return;
  data.value.shape = key;
  if (key === 'custom') toast('拖动地图上的锚点即可调整边界');
}

function onEditTier(id: string): void {
  const tier = data.value?.tiers.find((t) => t.id === id);
  if (tier) toast(`修改「${tier.rangeText}」的起送与运费接后端后开放`);
}

function onAddTier(): void {
  if (!data.value) return;
  const n = data.value.tiers.length;
  data.value.tiers.push({
    id: `ti_${Date.now()}`,
    rangeText: `${n * 2} - ${(n + 1) * 2} km`,
    ruleText: '起送 ￥40 · 运费 ￥7',
  });
}

async function onSave(): Promise<void> {
  if (!data.value) return;
  const res = await saveDeliveryArea(data.value.shape);
  toast(res.message);
  if (res.ok) setTimeout(() => back(), 700);
}
</script>

<template>
  <view v-if="data" class="da">
    <view class="da__map">
      <map
        v-if="HAS_MAP"
        class="da__map-real"
        :latitude="data.latitude"
        :longitude="data.longitude"
        :circles="circles"
        :scale="13"
      />
      <view v-else class="da__map-mock">
        <view class="da__grid" />
        <view class="da__ring da__ring--outer" />
        <view class="da__ring da__ring--inner" />
        <view class="da__pin" />
      </view>

      <view class="da__back tap-sm" :style="{ top: topPad + 'px' }" @tap="back()">‹</view>
      <view class="da__shapes" :style="{ top: topPad + 'px' }">
        <view
          v-for="s in SHAPES"
          :key="s.key"
          class="da__shape tap-sm"
          :class="{ 'da__shape--on': data.shape === s.key }"
          @tap="onShape(s.key)"
          >{{ s.label }}</view
        >
      </view>
    </view>

    <view class="da__panel">
      <view v-for="t in data.tiers" :key="t.id" class="da__tier tap" @tap="onEditTier(t.id)">
        <view class="flex1 col da__tier-text">
          <text class="da__tier-range">{{ t.rangeText }}</text>
          <text class="da__tier-rule">{{ t.ruleText }}</text>
        </view>
        <text class="da__tier-edit">✎</text>
      </view>

      <text class="da__add tap-sm" @tap="onAddTier">＋ 添加距离档位</text>

      <view class="btn btn--primary tap" @tap="onSave">保存配送范围</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.da {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.da__map {
  flex: 1;
  min-height: 0;
  position: relative;
}

.da__map-real {
  width: 100%;
  height: 100%;
}

.da__map-mock {
  width: 100%;
  height: 100%;
  background: linear-gradient(150deg, #e9ede6, #dfe5dc);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.da__grid {
  position: absolute;
  inset: 0;
  opacity: 0.55;
  background-image: linear-gradient(#fff 3rpx, transparent 3rpx),
    linear-gradient(90deg, #fff 3rpx, transparent 3rpx);
  background-size: 100% 140rpx, 180rpx 100%;
}

.da__ring {
  position: absolute;
  border-radius: 50%;
}

.da__ring--outer {
  width: 460rpx;
  height: 460rpx;
  background: rgba(255, 74, 23, 0.1);
  border: 4rpx dashed rgba(255, 74, 23, 0.55);
}

.da__ring--inner {
  width: 280rpx;
  height: 280rpx;
  background: rgba(255, 74, 23, 0.18);
  border: 4rpx solid var(--c-primary);
}

.da__pin {
  position: absolute;
  width: 28rpx;
  height: 28rpx;
  border-radius: 50%;
  background: var(--c-text);
  border: 6rpx solid #fff;
}

.da__back {
  position: absolute;
  left: 32rpx;
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  box-shadow: 0 4rpx 16rpx rgba(32, 22, 15, 0.12);
}

.da__shapes {
  position: absolute;
  right: 32rpx;
  display: flex;
  gap: 16rpx;
}

.da__shape {
  background: #fff;
  color: var(--c-text-2);
  font-size: 24rpx;
  font-weight: 600;
  padding: 14rpx 26rpx;
  border-radius: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(32, 22, 15, 0.1);
}

.da__shape--on {
  background: var(--c-primary);
  color: #fff;
  font-weight: 800;
}

.da__panel {
  flex-shrink: 0;
  background: #fff;
  border-radius: 40rpx 40rpx 0 0;
  margin-top: -40rpx;
  position: relative;
  z-index: 2;
  padding: 32rpx 32rpx calc(32rpx + constant(safe-area-inset-bottom));
  padding: 32rpx 32rpx calc(32rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.da__tier {
  background: #f7f4ef;
  border-radius: 24rpx;
  padding: 24rpx 28rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.da__tier-text {
  gap: 6rpx;
}

.da__tier-range {
  font-size: 27rpx;
  font-weight: 800;
}

.da__tier-rule {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.da__tier-edit {
  font-size: 24rpx;
  color: var(--c-text-placeholder-2);
}

.da__add {
  font-size: 23rpx;
  font-weight: 700;
  color: var(--c-primary);
  text-align: center;
}
</style>
