<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getLicenseCenter, uploadLicense } from '@/services/api';
import { toast } from '@/utils/nav';
import type { LicenseCenter } from '@/models';

/** 72 · 资质更新与年审：证照到期提醒与重新上传，逾期会被强制下线 */
const data = ref<LicenseCenter | null>(null);

onLoad(() => {
  load();
});

async function load(): Promise<void> {
  data.value = await getLicenseCenter();
}

function onUpload(id: string, name: string): void {
  uni.chooseImage({
    count: 1,
    success: async () => {
      const res = await uploadLicense(id);
      toast(res.message);
      if (res.ok) load();
    },
    fail: () => toast(`未选择${name}照片`),
  });
}
</script>

<template>
  <view v-if="data" class="lc">
    <wf-nav-bar title="经营资质" />

    <scroll-view class="lc__body" scroll-y>
      <view v-if="data.warnText" class="lc__warn">
        <wf-icon name="warn" :size="32" color="#C08A2D" :weight="2" />
        <text class="lc__warn-text flex1">{{ data.warnText }}</text>
      </view>

      <view v-for="d in data.docs" :key="d.id" class="card lc__doc">
        <view class="row--between">
          <text class="lc__doc-name">{{ d.name }}</text>
          <view class="row lc__doc-status">
            <view class="lc__dot" :class="`lc__dot--${d.status}`" />
            <text class="lc__status-text" :class="`lc__status-text--${d.status}`">{{
              d.statusText
            }}</text>
          </view>
        </view>
        <view class="row--between">
          <text class="lc__valid">{{ d.validText }}</text>
          <text class="lc__upload tap-sm" @tap="onUpload(d.id, d.name)">重新上传 ›</text>
        </view>
      </view>

      <view class="lc__note">{{ data.noteText }}</view>
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
  padding: 20rpx 32rpx calc(40rpx + constant(safe-area-inset-bottom));
  padding: 20rpx 32rpx calc(40rpx + env(safe-area-inset-bottom));
}

.lc__warn {
  background: var(--c-warn-bg);
  border-radius: 28rpx;
  padding: 24rpx 28rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.lc__warn-text {
  font-size: 24rpx;
  font-weight: 700;
  color: var(--c-warn-text-2);
  line-height: 1.6;
}

.lc__doc {
  margin-bottom: 20rpx;
  gap: 16rpx;
}

.lc__doc-name {
  font-size: 28rpx;
  font-weight: 800;
}

.lc__doc-status {
  gap: 10rpx;
}

.lc__dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: var(--c-success);
}

.lc__dot--soon {
  background: var(--c-warn);
}

.lc__dot--expired {
  background: var(--c-danger);
}

.lc__status-text {
  font-size: 22rpx;
  font-weight: 700;
  color: var(--c-success-deep);
}

.lc__status-text--soon {
  color: var(--c-warn-text);
}

.lc__status-text--expired {
  color: var(--c-danger);
}

.lc__valid {
  font-size: 23rpx;
  color: var(--c-text-weaker);
}

.lc__upload {
  font-size: 23rpx;
  font-weight: 700;
  color: var(--c-primary);
}

.lc__note {
  background: var(--c-primary-bg);
  border: 1px solid var(--c-primary-line);
  border-radius: 28rpx;
  padding: 24rpx 28rpx;
  font-size: 23rpx;
  color: var(--c-warn-text-2);
  line-height: 1.7;
}
</style>
