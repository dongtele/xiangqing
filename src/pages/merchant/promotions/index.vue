<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getPromotions, togglePromotion } from '@/services/api';
import { push, toast } from '@/utils/nav';
import type { PromotionItem } from '@/models';

/**
 * 23 · 优惠活动设置。
 * 同一订单只有一个活动生效，顾客端结算自动选最优——这里是那条规则的商家侧源头。
 * 效果数据直接摆在卡片上，避免商家「开了活动不知道有没有用」。
 */
const list = ref<PromotionItem[]>([]);
const loading = ref(true);

onShow(() => {
  load();
});

async function load(): Promise<void> {
  loading.value = true;
  list.value = await getPromotions();
  loading.value = false;
}

async function onToggle(id: string): Promise<void> {
  const res = await togglePromotion(id);
  toast(res.message);
  load();
}
</script>

<template>
  <view class="pm">
    <wf-nav-bar title="优惠活动" />

    <scroll-view class="pm__body" scroll-y>
      <template v-if="loading">
        <view v-for="n in 2" :key="n" class="card pm__card">
          <view class="skeleton" style="width: 50%; height: 32rpx" />
          <view class="skeleton" style="width: 100%; height: 80rpx" />
        </view>
      </template>

      <template v-else>
        <view v-for="p in list" :key="p.id" class="card pm__card">
          <view class="row--between">
            <view class="row pm__head">
              <text class="tag tag--grey">{{ p.kindText }}</text>
              <text class="pm__name">{{ p.name }}</text>
            </view>
            <text
              class="pm__status tap-sm"
              :class="`pm__status--${p.status}`"
              @tap="onToggle(p.id)"
              >{{ p.statusText }}</text
            >
          </view>

          <view v-if="p.stats.length" class="pm__stats">
            <view v-for="s in p.stats" :key="s.label" class="pm__stat">
              <text class="pm__stat-label">{{ s.label }}</text>
              <text class="pm__stat-value">{{ s.value }}</text>
            </view>
          </view>

          <text v-if="p.sub" class="pm__sub">{{ p.sub }}</text>

          <view v-if="p.rangeText" class="row--between pm__range">
            <text class="pm__range-text">{{ p.rangeText }}</text>
            <text class="pm__edit tap-sm" @tap="push('/pages/merchant/promotion-edit/index')"
              >编辑规则 ›</text
            >
          </view>
        </view>

        <view class="pm__add tap" @tap="push('/pages/merchant/promotion-edit/index')"
          >＋ 新建活动（满减 / 折扣 / 返券）</view
        >

        <text class="pm__note"
          >同一订单仅一个活动生效，顾客端结算自动选最优；改动实时同步菜单公告栏。</text
        >
      </template>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.pm {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pm__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx calc(40rpx + constant(safe-area-inset-bottom));
  padding: 20rpx 32rpx calc(40rpx + env(safe-area-inset-bottom));
}

.pm__card {
  margin-bottom: 20rpx;
}

.pm__head {
  gap: 16rpx;
}

.pm__name {
  font-size: 28rpx;
  font-weight: 800;
}

.pm__status {
  font-size: 23rpx;
  font-weight: 800;
}

.pm__status--running {
  color: var(--c-success-deep);
}

.pm__status--paused {
  color: var(--c-text-weaker);
}

.pm__stats {
  display: flex;
  justify-content: space-between;
  background: var(--c-fill-3);
  border-radius: 24rpx;
  padding: 24rpx 28rpx;
}

.pm__stat {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.pm__stat-label {
  font-size: 21rpx;
  color: var(--c-text-weaker);
}

.pm__stat-value {
  font-size: 30rpx;
  font-weight: 800;
}

.pm__sub {
  font-size: 23rpx;
  color: var(--c-text-weaker);
  line-height: 1.6;
}

.pm__range {
  padding-top: 4rpx;
}

.pm__range-text {
  font-size: 22rpx;
  color: var(--c-text-placeholder);
}

.pm__edit {
  font-size: 23rpx;
  font-weight: 700;
  color: var(--c-primary);
}

.pm__add {
  border: 3rpx dashed var(--c-primary-line-deep);
  border-radius: 32rpx;
  padding: 32rpx;
  text-align: center;
  font-size: 27rpx;
  font-weight: 800;
  color: var(--c-primary);
  margin-bottom: 20rpx;
}

.pm__note {
  display: block;
  font-size: 22rpx;
  color: var(--c-text-weaker);
  line-height: 1.7;
  padding: 4rpx 8rpx;
}
</style>
