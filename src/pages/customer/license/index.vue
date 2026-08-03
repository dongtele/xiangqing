<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getLicenseInfo } from '@/services/api';
import { toast } from '@/utils/nav';
import type { LicenseInfo } from '@/models';

/** 61 · 商家资质公示：营业执照 / 食品经营许可证 */
const info = ref<LicenseInfo | null>(null);

onLoad(async () => {
  info.value = await getLicenseInfo();
});

function onPreview(image: string): void {
  if (!image) {
    toast('证照图片待商家上传');
    return;
  }
  uni.previewImage({ urls: [image] });
}
</script>

<template>
  <view v-if="info" class="lc">
    <wf-nav-bar title="资质公示" />

    <scroll-view class="lc__body" scroll-y>
      <view class="card lc__shop">
        <view class="lc__logo"><wf-thumb :src="info.logo" :radius="24" /></view>
        <view class="flex1 col lc__shop-text">
          <text class="lc__shop-name">{{ info.shopName }}</text>
          <text class="lc__company">{{ info.companyName }}</text>
        </view>
      </view>

      <view v-for="doc in info.docs" :key="doc.title" class="card">
        <text class="t-section">{{ doc.title }}</text>
        <view class="lc__doc tap" @tap="onPreview(doc.image)">
          <text class="lc__doc-hint">证照图片（点击查看大图）</text>
        </view>
        <view class="row--between">
          <text class="cell__label">证件编号</text>
          <text class="cell__value">{{ doc.noLabel }} {{ doc.no }}</text>
        </view>
        <view class="hairline" />
        <view class="row--between">
          <text class="cell__label">有效期</text>
          <text class="cell__value">{{ doc.validText }}</text>
        </view>
      </view>

      <text class="lc__tip tap" @tap="toast('已记录，平台将核实证照信息')"
        >如发现证照过期或信息不符，可在此页面一键投诉。</text
      >
      <view class="lc__foot" />
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.lc {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.lc__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx 0;
}

.card {
  margin-bottom: 20rpx;
}

.lc__shop {
  flex-direction: row;
  align-items: center;
  gap: 24rpx;
}

.lc__logo {
  width: 96rpx;
  height: 96rpx;
  border-radius: 24rpx;
  overflow: hidden;
  flex-shrink: 0;
}

.lc__shop-text {
  gap: 4rpx;
}

.lc__shop-name {
  font-size: 29rpx;
  font-weight: 800;
}

.lc__company {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.lc__doc {
  height: 300rpx;
  border-radius: 24rpx;
  background: #f3efe9;
  border: 1px solid #ede6de;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lc__doc-hint {
  font-size: 23rpx;
  color: var(--c-text-placeholder);
}

.lc__tip {
  display: block;
  font-size: 22rpx;
  color: var(--c-text-weaker);
  line-height: 1.7;
  padding: 0 8rpx;
}

.lc__foot {
  height: 32rpx;
}
</style>
