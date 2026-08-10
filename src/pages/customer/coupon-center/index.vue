<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getCouponCenter, takeCoupon, takeCouponPack } from '@/services/api';
import { toast } from '@/utils/nav';
import type { CouponCenterTab, CouponOffer, CouponPack } from '@/models';

/** 79 · 领券中心：新客礼包 + 三类券源，含「已领取 / 已领完」两种不可点态 */
const TABS: { key: CouponCenterTab; label: string }[] = [
  { key: 'shop', label: '本店可领' },
  { key: 'platform', label: '平台券' },
  { key: 'points', label: '积分兑' },
];

const activeTab = ref<CouponCenterTab>('shop');
const pack = ref<CouponPack | null>(null);
const list = ref<CouponOffer[]>([]);
const loading = ref(true);

onLoad(() => {
  load();
});

async function load(): Promise<void> {
  loading.value = true;
  const res = await getCouponCenter(activeTab.value);
  pack.value = res.pack;
  list.value = res.list;
  loading.value = false;
}

function onSwitchTab(key: CouponCenterTab): void {
  if (key === activeTab.value) return;
  activeTab.value = key;
  load();
}

async function onTakePack(): Promise<void> {
  const res = await takeCouponPack();
  toast(res.message);
  if (res.ok) load();
}

async function onTake(o: CouponOffer): Promise<void> {
  const res = await takeCoupon(o.id);
  toast(res.message);
  if (res.ok) load();
}

function btnText(state: CouponOffer['state']): string {
  if (state === 'taken') return '已领取';
  if (state === 'soldout') return '已领完';
  return '领取';
}
</script>

<template>
  <view class="cc">
    <wf-nav-bar title="领券中心" />

    <scroll-view class="cc__body" scroll-y>
      <view v-if="pack && activeTab === 'shop'" class="cc__pack">
        <view class="col cc__pack-text">
          <text class="cc__pack-title">{{ pack.title }}</text>
          <text class="cc__pack-sub">{{ pack.sub }}</text>
        </view>
        <view class="cc__pack-btn tap" @tap="onTakePack">一键领取</view>
      </view>

      <view class="cc__tabs">
        <view
          v-for="t in TABS"
          :key="t.key"
          class="cc__tab"
          :class="{ 'cc__tab--on': activeTab === t.key }"
          @tap="onSwitchTab(t.key)"
          >{{ t.label }}</view
        >
      </view>

      <template v-if="loading">
        <view v-for="n in 3" :key="n" class="skeleton cc__skeleton" />
      </template>

      <template v-else-if="list.length">
        <view
          v-for="o in list"
          :key="o.id"
          class="cc__card"
          :class="{ 'cc__card--off': o.state === 'soldout' }"
        >
          <view class="cc__face" :class="`cc__face--${o.tone}`">
            <text class="cc__amount"
              ><text v-if="o.amountText.indexOf('折') < 0" class="cc__yuan">￥</text
              >{{ o.amountText }}</text
            >
            <text class="cc__threshold">{{ o.thresholdText }}</text>
          </view>

          <view class="cc__meta">
            <view class="flex1 col cc__meta-text">
              <text class="cc__name">{{ o.name }}</text>
              <text class="cc__desc">{{ o.desc }}</text>
            </view>
            <view
              class="cc__btn tap-sm"
              :class="`cc__btn--${o.state}`"
              @tap="o.state === 'take' && onTake(o)"
              >{{ btnText(o.state) }}</view
            >
          </view>
        </view>
      </template>

      <view v-else class="empty">
        <text class="empty__text">这个分类暂时没有可领的券</text>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.cc {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.cc__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx calc(40rpx + constant(safe-area-inset-bottom));
  padding: 20rpx 32rpx calc(40rpx + env(safe-area-inset-bottom));
}

.cc__pack {
  background: var(--grad-main);
  border-radius: 36rpx;
  padding: 32rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  color: #fff;
}

.cc__pack-text {
  gap: 6rpx;
}

.cc__pack-title {
  font-size: 30rpx;
  font-weight: 800;
}

.cc__pack-sub {
  font-size: 23rpx;
  opacity: 0.88;
}

.cc__pack-btn {
  background: #fff;
  color: var(--c-primary-deep);
  font-size: 25rpx;
  font-weight: 800;
  padding: 16rpx 32rpx;
  border-radius: 32rpx;
  flex-shrink: 0;
}

.cc__tabs {
  display: flex;
  gap: 36rpx;
  padding: 24rpx 8rpx 20rpx;
}

.cc__tab {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--c-text-weaker);
  padding-bottom: 12rpx;
  position: relative;
}

.cc__tab--on {
  font-weight: 800;
  color: var(--c-text);
}

.cc__tab--on::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 40rpx;
  height: 6rpx;
  border-radius: 4rpx;
  background: var(--c-primary);
}

.cc__skeleton {
  height: 152rpx;
  border-radius: 32rpx;
  margin-bottom: 20rpx;
}

.cc__card {
  background: #fff;
  border-radius: 32rpx;
  overflow: hidden;
  display: flex;
  align-items: stretch;
  margin-bottom: 20rpx;
}

.cc__card--off {
  opacity: 0.6;
}

.cc__face {
  width: 192rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  color: #fff;
  flex-shrink: 0;
}

.cc__face--main {
  background: var(--grad-main);
}

.cc__face--gold {
  background: linear-gradient(135deg, #ffb020, #ff7b1c);
}

.cc__face--green {
  background: linear-gradient(135deg, #7bc96f, #3fa85f);
}

.cc__face--grey {
  background: #d8cfc5;
}

.cc__amount {
  font-size: 52rpx;
  font-weight: 800;
  line-height: 1.1;
}

.cc__yuan {
  font-size: 24rpx;
  font-weight: 700;
}

.cc__threshold {
  font-size: 21rpx;
  opacity: 0.92;
}

.cc__meta {
  flex: 1;
  min-width: 0;
  padding: 26rpx 28rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  border-left: 3rpx dashed #f0e8df;
}

.cc__meta-text {
  gap: 6rpx;
}

.cc__name {
  font-size: 27rpx;
  font-weight: 800;
}

.cc__desc {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.cc__btn {
  font-size: 24rpx;
  font-weight: 800;
  padding: 14rpx 30rpx;
  border-radius: 30rpx;
  flex-shrink: 0;
}

.cc__btn--take {
  background: var(--c-primary);
  color: #fff;
}

.cc__btn--taken {
  border: 3rpx solid var(--c-primary);
  color: var(--c-primary);
}

.cc__btn--soldout {
  border: 3rpx solid #d8cfc5;
  color: var(--c-text-weaker);
  font-weight: 700;
}
</style>
