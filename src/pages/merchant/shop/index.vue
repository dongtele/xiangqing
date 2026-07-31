<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getShopSettings, updateShopSettings } from '@/services/api';
import { chrome } from '@/utils/chrome';
import { gotoRoleHome, toast, todo } from '@/utils/nav';
import { useUserStore } from '@/stores/user';
import type { Shop } from '@/models';

/** 12 · 店铺中心：商家侧「我的」总入口，含营业开关与角色回切 */
const user = useUserStore();
const headPad = ref(100);
const shop = ref<Shop | null>(null);

onLoad(() => {
  headPad.value = chrome().capsuleBottom + 20;
});

onShow(async () => {
  shop.value = await getShopSettings();
});

async function onToggleOpen(on: boolean): Promise<void> {
  shop.value = await updateShopSettings({ open: on });
  toast(on ? '已开始营业' : '已暂停营业，顾客端将显示休息中');
}

async function onToggleAlert(on: boolean): Promise<void> {
  shop.value = await updateShopSettings({ newOrderAlert: on });
}

/** 切回顾客视角，完成角色闭环（07 →「商家管理」进来） */
function onSwitchToCustomer(): void {
  user.switchRole('customer');
  gotoRoleHome('customer');
}
</script>

<template>
  <view v-if="shop" class="ms">
    <view class="ms__header" :style="{ paddingTop: headPad + 'px' }">
      <view class="ms__logo"><wf-thumb :src="shop.logo" :radius="32" /></view>
      <view class="flex1 col ms__id">
        <text class="ms__name">{{ shop.name }}</text>
        <view class="ms__badges">
          <text class="ms__badge">★ {{ shop.score }}</text>
          <text v-if="shop.certified" class="ms__badge">✓ 企业资质已认证</text>
        </view>
      </view>
      <text class="ms__arrow" @tap="todo('71', '店铺信息编辑')">›</text>
    </view>

    <scroll-view class="ms__body" scroll-y>
      <view class="card card--lg card--flat ms__group">
        <view class="cell">
          <text class="cell__label">营业状态</text>
          <view class="cell__value">
            <text :class="{ ms__on: shop.open }">{{ shop.open ? '营业中' : '休息中' }}</text>
            <wf-toggle :on="shop.open" @change="onToggleOpen" />
          </view>
        </view>
        <view class="cell tap" @tap="todo('50', '营业设置')">
          <text class="cell__label">营业时间</text>
          <view class="cell__value">
            <text>{{ shop.businessHours }}</text>
            <text class="chevron">›</text>
          </view>
        </view>
        <view class="cell tap" @tap="todo('33', '配送范围与运费')">
          <text class="cell__label">配送范围与运费</text>
          <view class="cell__value">
            <text>{{ shop.deliveryText }}</text>
            <text class="chevron">›</text>
          </view>
        </view>
        <view class="cell tap" @tap="todo('23', '优惠活动设置')">
          <text class="cell__label">优惠活动</text>
          <view class="cell__value">
            <text class="ms__primary">{{ shop.activityText }}</text>
            <text class="chevron">›</text>
          </view>
        </view>
      </view>

      <view class="card card--lg card--flat ms__group">
        <view class="cell tap" @tap="todo('72', '资质更新与年审')">
          <text class="cell__label">资质证照</text>
          <view class="cell__value">
            <text class="ms__on">✓ 已认证</text>
            <text class="chevron">›</text>
          </view>
        </view>
        <view class="cell tap" @tap="todo('35', '员工账号')">
          <text class="cell__label">员工账号</text>
          <view class="cell__value">
            <text>{{ shop.staffCount }}人</text>
            <text class="chevron">›</text>
          </view>
        </view>
        <view class="cell">
          <text class="cell__label">新订单提醒</text>
          <wf-toggle :on="shop.newOrderAlert" @change="onToggleAlert" />
        </view>
      </view>

      <view class="ms__switch tap" @tap="onSwitchToCustomer">切换到顾客视角</view>
    </scroll-view>

    <wf-tab-bar role="merchant" active="shop" />
  </view>
</template>

<style lang="scss" scoped>
.ms {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ms__header {
  background: var(--grad-header);
  padding-left: 40rpx;
  padding-right: 40rpx;
  padding-bottom: 80rpx;
  display: flex;
  align-items: center;
  gap: 28rpx;
  flex-shrink: 0;
}

.ms__logo {
  width: 116rpx;
  height: 116rpx;
  border-radius: 32rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
  overflow: hidden;
}

.ms__id {
  gap: 10rpx;
}

.ms__name {
  color: #fff;
  font-size: 38rpx;
  font-weight: 800;
}

.ms__badges {
  display: flex;
  gap: 12rpx;
}

.ms__badge {
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
  font-size: 20rpx;
  font-weight: 700;
  padding: 5rpx 16rpx;
  border-radius: 18rpx;
}

.ms__arrow {
  color: rgba(255, 255, 255, 0.8);
  font-size: 32rpx;
}

.ms__body {
  flex: 1;
  min-height: 0;
  padding: 0 32rpx calc(200rpx + constant(safe-area-inset-bottom));
  padding: 0 32rpx calc(200rpx + env(safe-area-inset-bottom));
  margin-top: -44rpx;
}

.ms__group {
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 28rpx rgba(32, 22, 15, 0.06);
}

.ms__on {
  color: var(--c-success-deep);
  font-weight: 700;
}

.ms__primary {
  color: var(--c-primary);
  font-weight: 700;
}

.ms__switch {
  background: #ffffff;
  border-radius: 36rpx;
  padding: 30rpx 32rpx;
  text-align: center;
  font-size: 27rpx;
  font-weight: 800;
  color: var(--c-primary);
}
</style>
