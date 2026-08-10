<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getDeliverySettings, saveDeliverySettings } from '@/services/api';
import { back, push, toast } from '@/utils/nav';
import type { DeliverySettings } from '@/models';

/**
 * 33 · 配送范围与运费。
 * 这里的规则直接约束顾客端 15 屏——超出范围的地址在结算页自动置灰，
 * 避免顾客下完单才被迫取消。
 */
const data = ref<DeliverySettings | null>(null);

/** 内圈固定 160rpx，外圈按半径放大并封顶，保证两圈始终分得开 */
const outerSize = computed(() => {
  const km = data.value ? data.value.radiusKm : 3;
  return `${Math.min(120 + km * 60, 340)}rpx`;
});

onShow(() => {
  load();
});

async function load(): Promise<void> {
  data.value = await getDeliverySettings();
}

function onRadius(km: number): void {
  if (data.value) data.value.radiusKm = km;
}

function onMoney(label: string): void {
  toast(`${label}接后端后开放`);
}

async function onSave(): Promise<void> {
  if (!data.value) return;
  const res = await saveDeliverySettings(data.value);
  toast(res.message);
  if (res.ok) setTimeout(() => back(), 700);
}
</script>

<template>
  <view v-if="data" class="dl">
    <wf-nav-bar title="配送设置" />

    <scroll-view class="dl__body" scroll-y>
      <view class="card">
        <view class="row--between">
          <text class="t-section">配送范围</text>
          <text class="dl__radius">{{ data.radiusKm }} km</text>
        </view>

        <!-- 范围示意：同心圆，点档位切换半径；进 70 可精细绘制 -->
        <view class="dl__map tap" @tap="push('/pages/merchant/delivery-area/index')">
          <view class="dl__grid" />
          <!-- 外圈随配送半径变化，但始终比内圈（160rpx）大一圈，否则两个圆会叠在一起 -->
          <view class="dl__ring dl__ring--outer" :style="{ width: outerSize, height: outerSize }" />
          <view class="dl__ring dl__ring--inner" />
          <view class="dl__pin" />
          <text class="dl__map-hint">点击精细绘制配送范围 ›</text>
        </view>

        <view class="dl__radios">
          <view
            v-for="km in data.radiusOptions"
            :key="km"
            class="dl__radio tap-sm"
            :class="{ 'dl__radio--on': data.radiusKm === km }"
            @tap="onRadius(km)"
            >{{ km }}km</view
          >
        </view>
      </view>

      <view class="card card--flat">
        <view class="cell tap" @tap="onMoney('起送价')">
          <text class="cell__label">起送价</text>
          <view class="cell__value"
            ><text>{{ data.minOrderText }}</text
            ><text class="chevron">›</text></view
          >
        </view>
        <view class="cell tap" @tap="onMoney('基础配送费')">
          <text class="cell__label">基础配送费</text>
          <view class="cell__value"
            ><text>{{ data.baseFeeText }}</text
            ><text class="chevron">›</text></view
          >
        </view>
        <view class="cell tap" @tap="onMoney('满额免配送费')">
          <text class="cell__label">满额免配送费</text>
          <view class="cell__value"
            ><text>{{ data.freeOverText }}</text
            ><text class="chevron">›</text></view
          >
        </view>
      </view>

      <view class="card">
        <view class="dl__switch">
          <view class="flex1 col dl__switch-text">
            <text class="dl__switch-name">自动接单</text>
            <text class="dl__switch-sub">新订单 3 分钟未处理自动接受</text>
          </view>
          <wf-toggle :on="data.autoAccept" @change="data.autoAccept = $event" />
        </view>
        <view class="hairline" />
        <view class="dl__switch">
          <view class="flex1 col dl__switch-text">
            <text class="dl__switch-name">支持到店自取</text>
            <text class="dl__switch-sub">顾客结算页显示「到店自取」选项</text>
          </view>
          <wf-toggle :on="data.pickupOn" @change="data.pickupOn = $event" />
        </view>
      </view>

      <text class="dl__note">{{ data.noteText }}</text>
    </scroll-view>

    <view class="dl__foot">
      <view class="btn btn--primary tap" @tap="onSave">保存设置</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.dl {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dl__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx 0;
}

.card {
  margin-bottom: 20rpx;
}

.dl__radius {
  font-size: 27rpx;
  font-weight: 800;
  color: var(--c-primary);
}

.dl__map {
  height: 360rpx;
  border-radius: 28rpx;
  background: linear-gradient(150deg, #e9ede6, #dfe5dc);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dl__grid {
  position: absolute;
  inset: 0;
  opacity: 0.55;
  background-image: linear-gradient(#fff 2rpx, transparent 2rpx),
    linear-gradient(90deg, #fff 2rpx, transparent 2rpx);
  background-size: 100% 84rpx, 108rpx 100%;
}

.dl__ring {
  position: absolute;
  border-radius: 50%;
}

.dl__ring--outer {
  background: rgba(255, 74, 23, 0.1);
  border: 4rpx dashed rgba(255, 74, 23, 0.55);
}

.dl__ring--inner {
  width: 160rpx;
  height: 160rpx;
  background: rgba(255, 74, 23, 0.18);
  border: 4rpx solid var(--c-primary);
}

.dl__pin {
  position: absolute;
  width: 26rpx;
  height: 26rpx;
  border-radius: 50%;
  background: var(--c-text);
  border: 6rpx solid #fff;
}

.dl__map-hint {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 20rpx;
  text-align: center;
  font-size: 22rpx;
  font-weight: 700;
  color: var(--c-primary);
}

.dl__radios {
  display: flex;
  gap: 16rpx;
}

.dl__radio {
  flex: 1;
  text-align: center;
  border: 3rpx solid var(--c-line-2);
  border-radius: 26rpx;
  padding: 16rpx 0;
  font-size: 24rpx;
  font-weight: 600;
  color: var(--c-text-2);
}

.dl__radio--on {
  border-color: var(--c-primary);
  background: var(--c-primary-bg);
  color: var(--c-primary);
  font-weight: 800;
}

.dl__switch {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.dl__switch-text {
  gap: 4rpx;
}

.dl__switch-name {
  font-size: 27rpx;
  font-weight: 700;
}

.dl__switch-sub {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.dl__note {
  display: block;
  font-size: 22rpx;
  color: var(--c-text-weaker);
  line-height: 1.7;
  padding: 4rpx 8rpx 20rpx;
}

.dl__foot {
  flex-shrink: 0;
  padding: 20rpx 32rpx calc(24rpx + constant(safe-area-inset-bottom));
  padding: 20rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
}
</style>
