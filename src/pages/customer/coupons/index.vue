<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getCoupons, redeemCouponCode } from '@/services/api';
import { push, relaunch, toast } from '@/utils/nav';
import type { Coupon, CouponTab } from '@/models';

/**
 * 17 / 39 · 我的优惠券。
 * 设计稿把同一个卡券包画了两遍（17「我的优惠券」用分段控件，39「我的卡券」用下划线 Tab
 * 并多了兑换码入口），这里合并成一个页面按并集实现：分段控件带数量、券卡保留 17 的
 * 补充说明行与配色变体、底部保留 39 的兑换码入口。规则浮层是 59。
 */
const TABS: { key: CouponTab; label: string }[] = [
  { key: 'usable', label: '可使用' },
  { key: 'used', label: '已使用' },
  { key: 'expired', label: '已过期' },
];

const activeTab = ref<CouponTab>('usable');
const list = ref<Coupon[]>([]);
const counts = ref<Record<CouponTab, number>>({ usable: 0, used: 0, expired: 0 });
const loading = ref(true);
const ruleShow = ref(false);
const ruleCoupon = ref<Coupon | null>(null);

onShow(() => {
  load();
});

async function load(): Promise<void> {
  loading.value = true;
  const res = await getCoupons(activeTab.value);
  list.value = res.list;
  counts.value = res.counts;
  loading.value = false;
}

function onSwitchTab(key: CouponTab): void {
  if (key === activeTab.value) return;
  activeTab.value = key;
  load();
}

function onRule(c: Coupon): void {
  ruleCoupon.value = c;
  ruleShow.value = true;
}

/** 「去使用」回菜单页，结算时由服务端自动选最优券 */
function onUse(): void {
  ruleShow.value = false;
  relaunch('/pages/customer/menu/index');
}

function onRedeem(): void {
  uni.showModal({
    title: '输入兑换码',
    editable: true,
    placeholderText: '请输入商家发放的兑换码',
    confirmColor: '#FF4A17',
    success: async (res) => {
      if (!res.confirm) return;
      const out = await redeemCouponCode(res.content || '');
      toast(out.message);
      if (out.ok) {
        activeTab.value = 'usable';
        load();
      }
    },
  });
}
</script>

<template>
  <view class="cp">
    <view class="cp__header">
      <wf-nav-bar title="优惠券" right="领券" bg="#FFFFFF" @righttap="push('/pages/customer/coupon-center/index')" />
      <view class="cp__seg">
        <view
          v-for="t in TABS"
          :key="t.key"
          class="cp__seg-item"
          :class="{ 'cp__seg-item--on': activeTab === t.key }"
          @tap="onSwitchTab(t.key)"
          >{{ t.label }} {{ counts[t.key] || '' }}</view
        >
      </view>
    </view>

    <scroll-view class="cp__body" scroll-y>
      <template v-if="loading">
        <view v-for="n in 2" :key="n" class="skeleton cp__skeleton" />
      </template>

      <template v-else-if="list.length">
        <view v-for="c in list" :key="c.id" class="cp__card">
          <view class="cp__face" :class="`cp__face--${c.tone}`">
            <text class="cp__amount"
              ><text v-if="c.kind === 'cash'" class="cp__yuan">￥</text>{{ c.amountText }}</text
            >
            <text class="cp__threshold">{{ c.thresholdText }}</text>
          </view>

          <view class="cp__meta">
            <text class="cp__name">{{ c.name }}</text>
            <text class="cp__valid">{{ c.validText }}</text>
            <text v-if="c.note" class="cp__note" :class="`cp__note--${c.noteTone}`">{{
              c.note
            }}</text>
          </view>

          <view class="cp__ops">
            <view v-if="activeTab === 'usable'" class="pill pill--primary tap" @tap="onUse"
              >去使用</view
            >
            <text class="cp__rule tap-sm" @tap="onRule(c)">规则</text>
          </view>
        </view>

        <view class="card cp__redeem tap" @tap="onRedeem">
          <text class="cell__label">兑换码</text>
          <view class="cell__value"><text>输入商家发放的兑换码</text><text class="chevron">›</text></view>
        </view>

        <text class="cp__foot">优惠券由商家发放，结算时自动选择最优组合</text>
      </template>

      <view v-else class="empty">
        <text class="empty__text">这里还没有券，去领券中心看看</text>
        <view class="btn btn--primary cp__empty-btn tap" @tap="push('/pages/customer/coupon-center/index')"
          >去领券</view
        >
      </view>
    </scroll-view>

    <!-- 59 使用规则：盖在本页上的半屏浮层 -->
    <wf-coupon-rule-sheet
      :show="ruleShow"
      :coupon="ruleCoupon"
      @close="ruleShow = false"
      @use="onUse"
    />
  </view>
</template>

<style lang="scss" scoped>
.cp {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.cp__header {
  background: #ffffff;
  padding-bottom: 24rpx;
  flex-shrink: 0;
}

.cp__seg {
  margin: 0 32rpx;
  background: #f1eee9;
  border-radius: 26rpx;
  padding: 8rpx;
  display: flex;
}

.cp__seg-item {
  flex: 1;
  text-align: center;
  font-size: 25rpx;
  color: var(--c-text-weak);
  padding: 14rpx 0;
  border-radius: 20rpx;
}

.cp__seg-item--on {
  background: #ffffff;
  font-weight: 800;
  color: var(--c-text);
  box-shadow: 0 2rpx 8rpx rgba(32, 22, 15, 0.06);
}

.cp__body {
  flex: 1;
  min-height: 0;
  padding: 28rpx 32rpx calc(40rpx + constant(safe-area-inset-bottom));
  padding: 28rpx 32rpx calc(40rpx + env(safe-area-inset-bottom));
}

.cp__skeleton {
  height: 176rpx;
  border-radius: 32rpx;
  margin-bottom: 24rpx;
}

.cp__card {
  background: #fff;
  border-radius: 32rpx;
  overflow: hidden;
  display: flex;
  align-items: stretch;
  box-shadow: 0 6rpx 20rpx rgba(32, 22, 15, 0.05);
  margin-bottom: 24rpx;
}

.cp__face {
  width: 208rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  color: #fff;
  flex-shrink: 0;
}

.cp__face--main {
  background: var(--grad-main);
}

.cp__face--light {
  background: linear-gradient(160deg, #ffb08f, #ff8a5c);
}

.cp__face--green {
  background: linear-gradient(135deg, #7bc96f, #3fa85f);
}

.cp__face--grey {
  background: #d8cfc5;
}

.cp__amount {
  font-size: 60rpx;
  font-weight: 800;
  line-height: 1.1;
}

.cp__yuan {
  font-size: 26rpx;
  font-weight: 700;
}

.cp__threshold {
  font-size: 20rpx;
  opacity: 0.9;
  font-weight: 700;
}

.cp__meta {
  flex: 1;
  min-width: 0;
  padding: 28rpx 24rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8rpx;
  border-left: 3rpx dashed #f0e8df;
}

.cp__name {
  font-size: 28rpx;
  font-weight: 800;
}

.cp__valid {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.cp__note {
  font-size: 21rpx;
  font-weight: 700;
}

.cp__note--primary {
  color: var(--c-primary);
}

.cp__note--warn {
  color: var(--c-warn-text-2);
}

.cp__note--danger {
  color: var(--c-primary-deep);
}

.cp__note--weak {
  color: var(--c-text-placeholder);
  font-weight: 600;
}

.cp__ops {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding-right: 24rpx;
  flex-shrink: 0;
}

.cp__rule {
  font-size: 21rpx;
  color: var(--c-text-placeholder);
}

.cp__redeem {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.cp__foot {
  display: block;
  text-align: center;
  font-size: 22rpx;
  color: var(--c-text-placeholder);
  padding-top: 12rpx;
}

.cp__empty-btn {
  width: 320rpx;
}
</style>
