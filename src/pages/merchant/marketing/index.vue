<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getMarketingCenter, toggleMarketingActivity } from '@/services/api';
import { push, toast } from '@/utils/nav';
import type { MarketingCenter } from '@/models';

/** 94 · 营销中心：店铺中心「营销」入口，工具宫格 + 进行中活动开关 */
const data = ref<MarketingCenter | null>(null);

onShow(() => {
  load();
});

async function load(): Promise<void> {
  data.value = await getMarketingCenter();
}

const TOOL_ROUTES: Record<string, string> = {
  full: '/pages/merchant/promotion-edit/index',
  coupon: '/pages/merchant/coupon-edit/index',
};

function onTool(key: string, label: string): void {
  const url = TOOL_ROUTES[key];
  if (url) {
    push(url);
    return;
  }
  toast(`${label}接后端后开放`);
}

async function onToggle(id: string, on: boolean): Promise<void> {
  if (!data.value) return;
  const act = data.value.activities.find((a) => a.id === id);
  if (act) act.on = on;
  await toggleMarketingActivity(id, on);
}
</script>

<template>
  <view v-if="data" class="mk">
    <wf-nav-bar title="营销中心" />

    <scroll-view class="mk__body" scroll-y>
      <view class="card">
        <view class="row--between">
          <text class="t-section">本月营销效果</text>
          <text class="t-sub">{{ data.rangeText }}</text>
        </view>
        <view class="mk__stats">
          <view v-for="s in data.stats" :key="s.label" class="mk__stat">
            <text class="mk__stat-value">{{ s.value }}</text>
            <text class="mk__stat-label">{{ s.label }}</text>
          </view>
        </view>
      </view>

      <view class="card">
        <text class="t-section">营销工具</text>
        <view class="mk__tools">
          <view
            v-for="t in data.tools"
            :key="t.key"
            class="mk__tool tap-sm"
            @tap="onTool(t.key, t.label)"
          >
            <view class="mk__tool-badge">{{ t.badge }}</view>
            <text class="mk__tool-label">{{ t.label }}</text>
          </view>
        </view>
      </view>

      <view class="card">
        <view class="row--between">
          <text class="t-section">进行中活动 {{ data.activities.length }}</text>
          <text class="mk__more tap-sm" @tap="push('/pages/merchant/promotions/index')">全部 ›</text>
        </view>
        <view v-for="(a, i) in data.activities" :key="a.id" class="col">
          <view v-if="i" class="hairline mk__line" />
          <view class="mk__act">
            <view class="flex1 col mk__act-text">
              <text class="mk__act-name">{{ a.name }}</text>
              <text class="mk__act-sub">{{ a.sub }}</text>
            </view>
            <wf-toggle :on="a.on" @change="onToggle(a.id, $event)" />
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.mk {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.mk__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx calc(40rpx + constant(safe-area-inset-bottom));
  padding: 20rpx 32rpx calc(40rpx + env(safe-area-inset-bottom));
}

.card {
  margin-bottom: 20rpx;
}

.mk__stats {
  display: flex;
  justify-content: space-between;
}

.mk__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.mk__stat-value {
  font-size: 42rpx;
  font-weight: 800;
}

.mk__stat-label {
  font-size: 21rpx;
  color: var(--c-text-weaker);
}

.mk__tools {
  display: flex;
  flex-wrap: wrap;
  gap: 24rpx 0;
}

.mk__tool {
  width: 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.mk__tool-badge {
  width: 84rpx;
  height: 84rpx;
  border-radius: 28rpx;
  background: var(--c-primary-bg);
  color: var(--c-primary);
  font-size: 30rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mk__tool-label {
  font-size: 22rpx;
  color: var(--c-text-2);
}

.mk__more {
  font-size: 23rpx;
  color: var(--c-text-weaker);
}

.mk__line {
  margin-bottom: 20rpx;
}

.mk__act {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.mk__act-text {
  gap: 4rpx;
}

.mk__act-name {
  font-size: 27rpx;
  font-weight: 700;
}

.mk__act-sub {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}
</style>
