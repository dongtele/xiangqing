<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getMessages } from '@/services/api';
import { chrome } from '@/utils/chrome';
import { gotoRoleHome, push, relaunch } from '@/utils/nav';
import { useUserStore } from '@/stores/user';

/** 07 · 我的（个人中心）—— 顾客端 → 商家端的角色分流入口在此 */
const user = useUserStore();
const headPad = ref(104);
/** 顾客端 TabBar 只有 3 项，消息(37) 的红点按设计稿从这里进入 */
const unread = ref(0);

const quick = [
  { key: 'unpaid', label: '待付款', icon: 'card', badge: 0, tab: 'ongoing' },
  { key: 'ongoing', label: '进行中', icon: 'clock', badge: 1, tab: 'ongoing' },
  { key: 'toComment', label: '待评价', icon: 'star', badge: 0, tab: 'toComment' },
  { key: 'aftersale', label: '退款售后', icon: 'headset', badge: 0, tab: 'aftersale' },
];

const cells = [
  { key: 'address', label: '地址管理', value: '', primary: false, url: '/pages/customer/addresses/index' },
  { key: 'coupon', label: '优惠券', value: '2张可用', primary: true, url: '/pages/customer/coupons/index' },
  { key: 'points', label: '会员积分', value: '1,280分', primary: true, url: '/pages/customer/points/index' },
  { key: 'contact', label: '联系商家', value: '', primary: false, url: '/pages/customer/support/index' },
  { key: 'about', label: '关于小店', value: '', primary: false, url: '/pages/customer/settings/index' },
];

const avatarText = computed(() =>
  user.profile ? user.profile.nickname.slice(-1) : '客'
);

onLoad(() => {
  headPad.value = chrome().capsuleBottom + 24;
});

onShow(async () => {
  const res = await getMessages('all');
  unread.value = res.unread;
});

function onCell(c: { url: string }): void {
  push(c.url);
}

function onTapOrders(tab: string): void {
  relaunch(`/pages/customer/orders/index?tab=${tab}`);
}

/** 商家管理：切到商家端工作台（12 有「切换到顾客视角」回来） */
function onEnterMerchant(): void {
  if (!user.isMerchant) {
    push('/pages/onboarding/intro/index');
    return;
  }
  user.switchRole('merchant');
  gotoRoleHome('merchant');
}
</script>

<template>
  <view class="profile">
    <view class="profile__header" :style="{ paddingTop: headPad + 'px' }">
      <view class="profile__me tap" @tap="push('/pages/customer/profile-edit/index')">
        <view class="profile__avatar">
          <image
            v-if="user.profile && user.profile.avatar"
            class="profile__avatar-img"
            :src="user.profile.avatar"
            mode="aspectFill"
          />
          <text v-else>{{ avatarText }}</text>
        </view>
        <view class="profile__id">
          <text class="profile__name">{{ user.profile ? user.profile.nickname : '未登录' }}</text>
          <text class="profile__phone">{{
            user.profile ? user.profile.phoneMask : '登录后可下单与查看订单'
          }}</text>
        </view>
      </view>

      <view class="profile__msg tap-sm" @tap="push('/pages/customer/messages/index')">
        <wf-icon name="chat" :size="40" color="#FFFFFF" :weight="1.9" />
        <view v-if="unread" class="profile__msg-dot" />
      </view>
    </view>

    <scroll-view class="profile__body" scroll-y>
      <!-- 订单快捷入口 -->
      <view class="card card--lg profile__orders">
        <view class="row--between">
          <text class="profile__card-title">我的订单</text>
          <text class="profile__card-more tap" @tap="onTapOrders('all')">全部 ›</text>
        </view>
        <view class="profile__quick">
          <view
            v-for="q in quick"
            :key="q.key"
            class="profile__quick-item tap-sm"
            @tap="onTapOrders(q.tab)"
          >
            <view class="profile__quick-icon">
              <wf-icon :name="q.icon" :size="36" color="#FF4A17" :weight="1.9" />
            </view>
            <text class="profile__quick-label">{{ q.label }}</text>
            <text v-if="q.badge" class="profile__quick-badge">{{ q.badge }}</text>
          </view>
        </view>
      </view>

      <!-- 角色分流 -->
      <view class="profile__merchant tap" @tap="onEnterMerchant">
        <view class="profile__merchant-icon">
          <wf-icon name="shop" :size="40" color="#FF4A17" />
        </view>
        <view class="flex1 col profile__merchant-text">
          <text class="profile__merchant-title">{{
            user.isMerchant ? '商家管理' : '成为商家 · 0元入驻'
          }}</text>
          <text class="profile__merchant-sub">{{
            user.isMerchant ? '已认证商家 · 进入工作台处理订单' : '提交资质，最快 1 个工作日开通'
          }}</text>
        </view>
        <text class="pill pill--primary">{{ user.isMerchant ? '进入' : '去入驻' }}</text>
      </view>

      <!-- 功能列表 -->
      <view class="card card--lg card--flat">
        <view
          v-for="c in cells"
          :key="c.key"
          class="cell tap"
          @tap="onCell(c)"
        >
          <text class="cell__label">{{ c.label }}</text>
          <view class="cell__value">
            <text v-if="c.value" :class="{ 'profile__cell-primary': c.primary }">{{
              c.value
            }}</text>
            <text class="chevron">›</text>
          </view>
        </view>
      </view>

      <text class="profile__foot">{{
        user.isMerchant
          ? '商家账号可随时在工作台与顾客视角间切换'
          : '入驻后此处变为「商家管理」入口'
      }}</text>
    </scroll-view>

    <wf-tab-bar role="customer" active="profile" />
  </view>
</template>

<style lang="scss" scoped>
.profile {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.profile__header {
  background: var(--grad-header);
  padding-left: 40rpx;
  padding-right: 40rpx;
  padding-bottom: 80rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28rpx;
  flex-shrink: 0;
}

.profile__me {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 28rpx;
}

.profile__msg {
  width: 76rpx;
  height: 76rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
}

.profile__msg-dot {
  position: absolute;
  top: 14rpx;
  right: 16rpx;
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #ff3800;
  border: 3rpx solid rgba(255, 255, 255, 0.9);
}

.profile__avatar {
  width: 116rpx;
  height: 116rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  border: 4rpx solid rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 44rpx;
  font-weight: 800;
  overflow: hidden;
  flex-shrink: 0;
}

.profile__avatar-img {
  width: 100%;
  height: 100%;
}

.profile__id {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.profile__name {
  color: #fff;
  font-size: 38rpx;
  font-weight: 800;
}

.profile__phone {
  color: rgba(255, 255, 255, 0.8);
  font-size: 24rpx;
}

.profile__body {
  flex: 1;
  min-height: 0;
  padding: 0 32rpx calc(200rpx + constant(safe-area-inset-bottom));
  padding: 0 32rpx calc(200rpx + env(safe-area-inset-bottom));
  margin-top: -44rpx;
}

.profile__orders {
  box-shadow: 0 8rpx 28rpx rgba(32, 22, 15, 0.06);
  gap: 28rpx;
  margin-bottom: 24rpx;
}

.profile__card-title {
  font-size: 29rpx;
  font-weight: 800;
}

.profile__card-more {
  font-size: 23rpx;
  color: var(--c-text-weaker);
}

.profile__quick {
  display: flex;
}

.profile__quick-item {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.profile__quick-icon {
  width: 76rpx;
  height: 76rpx;
  border-radius: 24rpx;
  background: var(--c-primary-bg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile__quick-label {
  font-size: 22rpx;
  color: var(--c-text-2);
}

.profile__quick-badge {
  position: absolute;
  top: -8rpx;
  right: 48rpx;
  background: var(--c-primary-deep);
  color: #fff;
  font-size: 18rpx;
  font-weight: 800;
  min-width: 30rpx;
  height: 30rpx;
  line-height: 30rpx;
  text-align: center;
  border-radius: 16rpx;
}

.profile__merchant {
  background: linear-gradient(120deg, #fff3ea, #ffe8d8);
  border: 1px solid var(--c-primary-line);
  border-radius: 36rpx;
  padding: 32rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 24rpx;
}

.profile__merchant-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 24rpx;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.profile__merchant-text {
  gap: 4rpx;
}

.profile__merchant-title {
  font-size: 28rpx;
  font-weight: 800;
}

.profile__merchant-sub {
  font-size: 22rpx;
  color: var(--c-warn-text-2);
}

.profile__cell-primary {
  color: var(--c-primary);
  font-weight: 700;
}

.profile__foot {
  display: block;
  font-size: 21rpx;
  color: var(--c-text-placeholder);
  text-align: center;
  padding-top: 20rpx;
}
</style>
