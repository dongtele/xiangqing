<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getMerchantHelp } from '@/services/api';
import { toast } from '@/utils/nav';
import type { MerchantHelp } from '@/models';

/** 98 · 商家帮助与客服：自助 + 商家学院 + 人工 + 工单 */
const data = ref<MerchantHelp | null>(null);
const keyword = ref('');

onLoad(async () => {
  data.value = await getMerchantHelp();
});

function onSearchInput(e: Event): void {
  keyword.value = (e as unknown as { detail: { value: string } }).detail.value;
}

function onQuestion(title: string): void {
  toast(`「${title}」正文接后端后开放`);
}

function onContact(key: string, label: string): void {
  if (key === 'phone') {
    const phone = data.value?.contacts.find((c) => c.key === 'phone');
    const num = (phone?.value || '').split(' ')[0];
    uni.makePhoneCall({ phoneNumber: num, fail: () => toast('拨号已取消') });
    return;
  }
  toast(`${label}接后端后开放`);
}
</script>

<template>
  <view v-if="data" class="mh">
    <wf-nav-bar title="帮助与客服" />

    <scroll-view class="mh__body" scroll-y>
      <view class="mh__search">
        <wf-icon name="search" :size="32" color="#A39890" />
        <input
          class="mh__input"
          :value="keyword"
          placeholder="搜索：结算周期、被差评怎么办…"
          placeholder-class="mh__ph"
          @input="onSearchInput"
        />
      </view>

      <view class="card card--flat">
        <view class="mh__title-row"><text class="t-section">高频问题</text></view>
        <view
          v-for="q in data.questions"
          :key="q.id"
          class="cell tap"
          @tap="onQuestion(q.title)"
        >
          <text class="cell__label mh__q">{{ q.title }}</text>
          <text class="chevron">›</text>
        </view>
      </view>

      <view class="card">
        <view class="row--between">
          <text class="t-section">商家学院</text>
          <text class="mh__more tap-sm" @tap="toast('全部课程接后端后开放')">全部课程 ›</text>
        </view>
        <view v-for="c in data.courses" :key="c.id" class="mh__course tap" @tap="onQuestion(c.title)">
          <view class="mh__course-thumb">
            <wf-thumb src="" :radius="20" />
          </view>
          <view class="flex1 col mh__course-text">
            <text class="mh__course-title">{{ c.title }}</text>
            <text class="mh__course-meta">{{ c.metaText }}</text>
          </view>
          <text class="chevron">›</text>
        </view>
      </view>

      <view class="card card--flat">
        <view
          v-for="c in data.contacts"
          :key="c.key"
          class="cell tap"
          @tap="onContact(c.key, c.label)"
        >
          <text class="cell__label">{{ c.label }}</text>
          <view class="cell__value"
            ><text class="ellipsis mh__contact">{{ c.value }}</text
            ><text class="chevron">›</text></view
          >
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.mh {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.mh__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx calc(40rpx + constant(safe-area-inset-bottom));
  padding: 20rpx 32rpx calc(40rpx + env(safe-area-inset-bottom));
}

.mh__body > .card {
  margin-bottom: 20rpx;
}

.mh__search {
  background: #ffffff;
  border-radius: 32rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 0 28rpx;
  margin-bottom: 20rpx;
}

.mh__input {
  flex: 1;
  font-size: 25rpx;
  height: 100%;
}

.mh__ph {
  color: var(--c-text-placeholder);
}

.mh__title-row {
  padding: 28rpx 32rpx 0;
}

.mh__q {
  font-weight: 600;
}

.mh__more {
  font-size: 23rpx;
  color: var(--c-text-weaker);
}

.mh__course {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.mh__course-thumb {
  width: 108rpx;
  height: 76rpx;
  border-radius: 20rpx;
  overflow: hidden;
  flex-shrink: 0;
}

.mh__course-text {
  gap: 6rpx;
}

.mh__course-title {
  font-size: 26rpx;
  font-weight: 700;
}

.mh__course-meta {
  font-size: 21rpx;
  color: var(--c-text-weaker);
}

.mh__contact {
  max-width: 380rpx;
}
</style>
