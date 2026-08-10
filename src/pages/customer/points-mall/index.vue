<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getPointsGoods, redeemPointsGoods } from '@/services/api';
import { toast } from '@/utils/nav';
import type { PointsGoods, PointsGoodsTab } from '@/models';

/** 81 · 积分兑换：会员中心内层，含积分不足的置灰态 */
const TABS: { key: PointsGoodsTab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'coupon', label: '优惠券' },
  { key: 'dish', label: '菜品' },
  { key: 'gift', label: '周边' },
];

const activeTab = ref<PointsGoodsTab>('all');
const points = ref('');
const list = ref<PointsGoods[]>([]);
const loading = ref(true);

onLoad(() => {
  load();
});

async function load(): Promise<void> {
  loading.value = true;
  const res = await getPointsGoods(activeTab.value);
  points.value = res.points;
  list.value = res.list;
  loading.value = false;
}

function onSwitchTab(key: PointsGoodsTab): void {
  if (key === activeTab.value) return;
  activeTab.value = key;
  load();
}

async function onRedeem(g: PointsGoods): Promise<void> {
  if (!g.affordable) {
    toast(g.sub);
    return;
  }
  const res = await redeemPointsGoods(g.id);
  toast(res.message);
  if (res.ok) load();
}
</script>

<template>
  <view class="pm">
    <wf-nav-bar title="积分兑换" :right="points ? `${points} 分` : ''" />

    <scroll-view class="pm__body" scroll-y>
      <view class="pm__filters">
        <view
          v-for="t in TABS"
          :key="t.key"
          class="pm__filter tap-sm"
          :class="{ 'pm__filter--on': activeTab === t.key }"
          @tap="onSwitchTab(t.key)"
          >{{ t.label }}</view
        >
      </view>

      <view class="pm__grid">
        <template v-if="loading">
          <view v-for="n in 4" :key="n" class="skeleton pm__skeleton" />
        </template>

        <template v-else>
          <view
            v-for="g in list"
            :key="g.id"
            class="pm__card"
            :class="{ 'pm__card--off': !g.affordable }"
          >
            <view class="pm__thumb">
              <wf-thumb :src="g.image" :radius="0" />
            </view>
            <view class="col pm__info">
              <text class="pm__name">{{ g.name }}</text>
              <text class="pm__sub">{{ g.sub }}</text>
              <view class="row--between">
                <text class="pm__cost" :class="{ 'pm__cost--off': !g.affordable }">{{
                  g.costText
                }}</text>
                <view
                  class="pm__btn tap-sm"
                  :class="g.affordable ? 'pm__btn--on' : 'pm__btn--off'"
                  @tap="onRedeem(g)"
                  >{{ g.affordable ? '兑换' : g.shortText }}</view
                >
              </view>
            </view>
          </view>
        </template>
      </view>

      <view class="pm__note"
        >兑换成功的券即时到账「我的卡券」，实物类随下一单一起配送。</view
      >
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

.pm__filters {
  display: flex;
  gap: 16rpx;
  padding-bottom: 20rpx;
}

.pm__filter {
  background: #fff;
  color: var(--c-text-2);
  font-size: 24rpx;
  font-weight: 600;
  padding: 12rpx 28rpx;
  border-radius: 30rpx;
}

.pm__filter--on {
  background: var(--c-text);
  color: #fff;
  font-weight: 700;
}

.pm__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 24rpx;
}

.pm__skeleton {
  width: calc((100% - 24rpx) / 2);
  height: 320rpx;
  border-radius: 32rpx;
}

.pm__card {
  width: calc((100% - 24rpx) / 2);
  background: #fff;
  border-radius: 32rpx;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.pm__card--off {
  opacity: 0.62;
}

.pm__thumb {
  height: 192rpx;
  overflow: hidden;
}

.pm__info {
  padding: 22rpx 24rpx;
  gap: 12rpx;
}

.pm__name {
  font-size: 26rpx;
  font-weight: 800;
}

.pm__sub {
  font-size: 21rpx;
  color: var(--c-text-weaker);
}

.pm__cost {
  font-size: 26rpx;
  font-weight: 800;
  color: var(--c-primary);
}

.pm__cost--off {
  color: var(--c-text-weaker);
}

.pm__btn {
  font-size: 22rpx;
  font-weight: 800;
  padding: 10rpx 24rpx;
  border-radius: 26rpx;
  flex-shrink: 0;
}

.pm__btn--on {
  background: var(--c-primary);
  color: #fff;
}

.pm__btn--off {
  border: 3rpx solid #d8cfc5;
  color: var(--c-text-weaker);
  font-weight: 700;
}

.pm__note {
  margin-top: 24rpx;
  background: var(--c-primary-bg);
  border: 1px solid var(--c-primary-line);
  border-radius: 28rpx;
  padding: 24rpx 28rpx;
  font-size: 23rpx;
  color: var(--c-warn-text-2);
  line-height: 1.7;
}
</style>
