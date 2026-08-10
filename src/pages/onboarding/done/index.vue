<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { activateShop, getOnboardDone } from '@/services/api';
import { chrome } from '@/utils/chrome';
import { gotoRoleHome, push, toast } from '@/utils/nav';
import { useUserStore } from '@/stores/user';
import type { OnboardDone } from '@/models';

/**
 * 29 · 开通成功。
 * 进页面就把账号标记为已认证商家并切到商家角色，07「我的」随即出现「商家管理」入口，
 * 完成 07 → 26 → 14 → 27 → 24 → 29 → 08 的闭环。
 */
const user = useUserStore();
const topPad = ref(120);
const data = ref<OnboardDone | null>(null);

const ROUTES: Record<string, string> = {
  goods: '/pages/merchant/goods-edit/index?id=new',
  shop: '/pages/merchant/business-hours/index',
  payout: '/pages/merchant/payout-account/index',
};

onLoad(async () => {
  topPad.value = chrome().statusBarHeight + 72;
  data.value = await getOnboardDone();
  await activateShop();
  user.updateProfile({ isMerchant: true });
  user.switchRole('merchant');
});

function onStep(key: string): void {
  const url = ROUTES[key];
  if (url) push(url);
}

function onGuide(): void {
  toast('新手开店指南接后端后开放');
}
</script>

<template>
  <view v-if="data" class="od">
    <view class="od__hero" :style="{ paddingTop: topPad + 'px' }">
      <view class="od__badge">
        <wf-icon name="check" :size="56" color="#07C160" :weight="2.6" />
      </view>
      <text class="od__title">{{ data.title }}</text>
      <text class="od__sub">{{ data.subText }}</text>
    </view>

    <scroll-view class="od__body" scroll-y>
      <view class="od__card">
        <text class="t-section">开张前 3 步</text>
        <view v-for="s in data.steps" :key="s.no" class="od__step">
          <view class="od__step-no">{{ s.no }}</view>
          <view class="flex1 col od__step-text">
            <text class="od__step-title">{{ s.title }}</text>
            <text class="od__step-desc">{{ s.desc }}</text>
          </view>
          <view
            class="pill tap"
            :class="s.primary ? 'pill--primary' : 'pill--outline-primary'"
            @tap="onStep(s.key)"
            >{{ s.btnText }}</view
          >
        </view>
      </view>

      <view class="card od__guide tap" @tap="onGuide">
        <view class="flex1 col od__guide-text">
          <text class="od__guide-title">{{ data.guideTitle }}</text>
          <text class="od__guide-sub">{{ data.guideSub }}</text>
        </view>
        <text class="chevron">›</text>
      </view>
    </scroll-view>

    <view class="od__foot">
      <view class="btn btn--primary tap" @tap="gotoRoleHome('merchant')">进入商家工作台</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.od {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--c-bg);
}

.od__hero {
  background: linear-gradient(180deg, #ff7b1c 0%, #ff3d00 100%);
  padding-left: 48rpx;
  padding-right: 48rpx;
  padding-bottom: 72rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  flex-shrink: 0;
}

.od__badge {
  width: 132rpx;
  height: 132rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16rpx 44rpx rgba(32, 22, 15, 0.18);
}

.od__title {
  color: #fff;
  font-size: 44rpx;
  font-weight: 800;
}

.od__sub {
  color: rgba(255, 255, 255, 0.85);
  font-size: 24rpx;
  text-align: center;
}

.od__body {
  flex: 1;
  min-height: 0;
  padding: 0 32rpx;
  margin-top: -40rpx;
}

.od__card {
  background: #fff;
  border-radius: 36rpx;
  padding: 36rpx 32rpx;
  display: flex;
  flex-direction: column;
  gap: 32rpx;
  box-shadow: 0 20rpx 56rpx rgba(32, 22, 15, 0.1);
  margin-bottom: 20rpx;
}

.od__step {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.od__step-no {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background: var(--c-primary-bg);
  color: var(--c-primary);
  font-size: 22rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.od__step-text {
  gap: 4rpx;
}

.od__step-title {
  font-size: 26rpx;
  font-weight: 800;
}

.od__step-desc {
  font-size: 21rpx;
  color: var(--c-text-weaker);
}

.od__guide {
  flex-direction: row;
  align-items: center;
  gap: 20rpx;
}

.od__guide-text {
  gap: 6rpx;
}

.od__guide-title {
  font-size: 27rpx;
  font-weight: 800;
}

.od__guide-sub {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.od__foot {
  flex-shrink: 0;
  padding: 20rpx 32rpx calc(24rpx + constant(safe-area-inset-bottom));
  padding: 20rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
}
</style>
