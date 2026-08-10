<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getHelpCenter } from '@/services/api';
import { push, toast } from '@/utils/nav';
import type { HelpCenterInfo } from '@/models';

/** 77 · 帮助中心：搜索 + 场景分类 + 高频问题 */
const info = ref<HelpCenterInfo | null>(null);
const openId = ref('');

onLoad(async () => {
  info.value = await getHelpCenter();
});

function toggle(id: string): void {
  openId.value = openId.value === id ? '' : id;
}
</script>

<template>
  <view v-if="info" class="hc">
    <wf-nav-bar title="帮助中心" />

    <scroll-view class="hc__body" scroll-y>
      <view class="hc__search" @tap="toast('搜索问题：输入关键词后回车')">
        <wf-icon name="search" :size="30" color="#A39890" :weight="2" />
        <text class="hc__search-ph">搜索问题，如「怎么退款」</text>
      </view>

      <view class="card">
        <text class="t-section">按场景查找</text>
        <view class="hc__scenes">
          <view
            v-for="s in info.scenes"
            :key="s.key"
            class="hc__scene tap"
            @tap="toast(`${s.label}相关问题已按场景筛选`)"
          >
            <view class="hc__scene-icon">
              <wf-icon :name="s.icon" :size="38" color="#FF4A17" :weight="2" />
            </view>
            <text class="hc__scene-label">{{ s.label }}</text>
          </view>
        </view>
      </view>

      <view class="card">
        <text class="t-section">大家都在问</text>
        <template v-for="(f, i) in info.faqs" :key="f.id">
          <view v-if="i > 0" class="hairline" />
          <view class="hc__faq" @tap="toggle(f.id)">
            <view class="row--between">
              <text class="hc__question">{{ f.question }}</text>
              <text class="chevron">{{ openId === f.id ? '⌄' : '›' }}</text>
            </view>
            <text v-if="openId === f.id" class="hc__answer">{{ f.answer }}</text>
          </view>
        </template>
      </view>

      <view class="hc__gap" />
    </scroll-view>

    <view class="hc__bar">
      <view class="btn btn--primary tap" @tap="push('/pages/customer/support/index')"
        >没解决，联系在线客服</view
      >
    </view>
  </view>
</template>

<style lang="scss" scoped>
.hc {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.hc__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx 0;
}

.card {
  margin-bottom: 20rpx;
}

.hc__search {
  height: 80rpx;
  border-radius: 40rpx;
  background: #fff;
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 0 28rpx;
  margin-bottom: 20rpx;
}

.hc__search-ph {
  font-size: 26rpx;
  color: var(--c-text-placeholder);
}

.hc__scenes {
  display: flex;
}

.hc__scene {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.hc__scene-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 26rpx;
  background: var(--c-primary-bg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.hc__scene-label {
  font-size: 21rpx;
  color: var(--c-text-3);
}

.hc__faq {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.hc__question {
  font-size: 26rpx;
  color: var(--c-text-2);
}

.hc__answer {
  font-size: 23rpx;
  color: var(--c-text-weak);
  line-height: 1.7;
  background: var(--c-fill);
  border-radius: 20rpx;
  padding: 20rpx 24rpx;
}

.hc__gap {
  height: 32rpx;
}

.hc__bar {
  flex-shrink: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(28rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(28rpx + env(safe-area-inset-bottom));
}
</style>
