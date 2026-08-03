<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getSettings } from '@/services/api';
import { push, toast } from '@/utils/nav';
import { useUserStore } from '@/stores/user';
import type { SettingsInfo } from '@/models';

/** 44 · 设置与关于：退出登录、隐私与授权管理的收口页，从 07「关于小店」进入 */
const user = useUserStore();
const info = ref<SettingsInfo | null>(null);

onLoad(() => {
  load();
});

async function load(): Promise<void> {
  info.value = await getSettings();
}

const ROUTES: Record<string, string> = {
  phone: '/pages/customer/account/index',
  wechat: '/pages/customer/account/index',
  push: '/pages/customer/notify-settings/index',
  feedback: '/pages/customer/feedback/index',
};

function onRow(key: string): void {
  const url = ROUTES[key];
  if (url) {
    push(url);
    return;
  }
  if (key === 'privacy' || key === 'terms') {
    push('/pages/customer/about/index');
    return;
  }
  if (key === 'version') toast('已是最新版本');
}

function onLogout(): void {
  uni.showModal({
    title: '退出登录？',
    content: '退出后需重新授权才能下单',
    confirmColor: '#D14343',
    success: (res) => {
      if (!res.confirm) return;
      user.logout();
      uni.reLaunch({ url: '/pages/login/index' });
    },
  });
}
</script>

<template>
  <view v-if="info" class="st">
    <wf-nav-bar title="设置" />

    <scroll-view class="st__body" scroll-y>
      <view v-for="(group, gi) in info.rows" :key="gi" class="card card--flat">
        <view v-for="r in group" :key="r.key" class="cell tap" @tap="onRow(r.key)">
          <text class="cell__label">{{ r.label }}</text>
          <view class="cell__value">
            <text v-if="r.value">{{ r.value }}</text>
            <text v-if="r.key !== 'version'" class="chevron">›</text>
          </view>
        </view>
      </view>

    </scroll-view>

    <!-- 设计稿用 flex:1 把退出登录与公司名顶到屏底 -->
    <view class="st__foot">
      <view class="st__logout tap" @tap="onLogout">退出登录</view>
      <text class="st__company">{{ info.company }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.st {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.st__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx 0;
}

.card {
  margin-bottom: 20rpx;
}

.st__foot {
  flex-shrink: 0;
  padding: 20rpx 32rpx calc(24rpx + constant(safe-area-inset-bottom));
  padding: 20rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
}

.st__logout {
  background: #fff;
  border-radius: 32rpx;
  padding: 30rpx;
  text-align: center;
  font-size: 28rpx;
  font-weight: 800;
  color: var(--c-danger);
}

.st__company {
  display: block;
  text-align: center;
  font-size: 21rpx;
  color: var(--c-text-placeholder-2);
  padding-top: 24rpx;
}
</style>
