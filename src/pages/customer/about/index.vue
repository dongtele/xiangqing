<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getAbout } from '@/services/api';
import { push, toast } from '@/utils/nav';
import type { AboutInfo } from '@/models';

/** 78 · 关于美味坊：合规所需的协议与清单齐备，从 44 设置进入 */
const info = ref<AboutInfo | null>(null);

onLoad(() => {
  load();
});

async function load(): Promise<void> {
  info.value = await getAbout();
}

const DOC_NAMES: Record<string, string> = {
  terms: '用户服务协议',
  privacy: '隐私政策',
  collect: '个人信息收集清单',
  share: '第三方信息共享清单',
};

function onDoc(key: string): void {
  toast(`${DOC_NAMES[key]}正文接后端后开放`);
}

function onLicense(key: string): void {
  if (key === 'license') {
    push('/pages/customer/license/index');
    return;
  }
  if (!info.value) return;
  const phone = info.value.license.find((l) => l.key === 'complaint');
  if (phone) uni.makePhoneCall({ phoneNumber: phone.value, fail: () => toast('拨号已取消') });
}
</script>

<template>
  <view v-if="info" class="ab">
    <wf-nav-bar title="关于" />

    <scroll-view class="ab__body" scroll-y>
      <view class="ab__brand">
        <view class="ab__logo">味</view>
        <text class="ab__name">{{ info.appName }}</text>
        <text class="ab__version">{{ info.versionText }}</text>
      </view>

      <view class="card card--flat">
        <view v-for="d in info.docs" :key="d.key" class="cell tap" @tap="onDoc(d.key)">
          <text class="cell__label">{{ d.label }}</text>
          <text class="chevron">›</text>
        </view>
      </view>

      <view class="card card--flat">
        <view v-for="l in info.license" :key="l.key" class="cell tap" @tap="onLicense(l.key)">
          <text class="cell__label">{{ l.label }}</text>
          <view class="cell__value">
            <text v-if="l.value">{{ l.value }}</text>
            <text v-else class="chevron">›</text>
          </view>
        </view>
      </view>

    </scroll-view>

    <!-- 设计稿用 flex:1 把公司名与 ICP 顶到屏底 -->
    <view class="ab__foot">
      <text class="ab__company">{{ info.company }}</text>
      <text class="ab__icp">{{ info.icp }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.ab {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ab__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx 0;
}

.card {
  margin-bottom: 20rpx;
}

.ab__brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  padding: 44rpx 0 36rpx;
}

.ab__logo {
  width: 144rpx;
  height: 144rpx;
  border-radius: 44rpx;
  background: var(--grad-main);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 52rpx;
  font-weight: 800;
  box-shadow: 0 20rpx 48rpx rgba(255, 74, 23, 0.26);
}

.ab__name {
  font-size: 34rpx;
  font-weight: 800;
}

.ab__version {
  font-size: 23rpx;
  color: var(--c-text-weaker);
}

.ab__foot {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 24rpx 32rpx calc(24rpx + constant(safe-area-inset-bottom));
  padding: 24rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
}

.ab__company {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.ab__icp {
  font-size: 22rpx;
  color: var(--c-text-placeholder-2);
}
</style>
