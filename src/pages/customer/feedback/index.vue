<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getFeedbackOptions, submitFeedback } from '@/services/api';
import { back, toast } from '@/utils/nav';
import type { FeedbackOptions } from '@/models';

/** 76 · 意见反馈：类型、描述、截图、关联订单 */
const options = ref<FeedbackOptions | null>(null);
const type = ref('');
const text = ref('');
const shots = ref<string[]>([]);

const lengthText = computed(
  () => `${text.value.length}/${options.value ? options.value.maxLength : 500}`
);

onLoad(async () => {
  const res = await getFeedbackOptions();
  options.value = res;
  type.value = res.types[0];
});

function onInput(e: Event): void {
  text.value = (e as unknown as { detail: { value: string } }).detail.value;
}

function onAddShot(): void {
  uni.chooseImage({
    count: 3 - shots.value.length,
    success: (res) => {
      shots.value = [...shots.value, ...(res.tempFilePaths as string[])];
    },
    fail: () => toast('已取消'),
  });
}

async function onSubmit(): Promise<void> {
  const min = options.value ? options.value.minLength : 10;
  if (text.value.trim().length < min) {
    toast(`描述不少于 ${min} 字`);
    return;
  }
  await submitFeedback({ type: type.value, text: text.value, shots: shots.value });
  toast('反馈已提交，感谢你的建议', 'success');
  back();
}
</script>

<template>
  <view v-if="options" class="fb">
    <wf-nav-bar title="意见反馈" right="记录" @righttap="toast('反馈记录：暂无历史提交')" />

    <scroll-view class="fb__body" scroll-y>
      <view class="card">
        <text class="t-section">问题类型</text>
        <view class="fb__types">
          <text
            v-for="t in options.types"
            :key="t"
            class="fb__type"
            :class="{ 'fb__type--on': type === t }"
            @tap="type = t"
            >{{ t }}</text
          >
        </view>
      </view>

      <view class="card">
        <textarea
          class="fb__textarea"
          :value="text"
          placeholder="请描述遇到的问题，如订单号、发生时间与具体现象（不少于 10 字）"
          placeholder-class="fb__ph"
          :maxlength="options.maxLength"
          @input="onInput"
        />
        <view class="row--between">
          <text />
          <text class="fb__count">{{ lengthText }}</text>
        </view>
        <view class="fb__shots">
          <view v-if="shots.length < 3" class="fb__shot-add tap" @tap="onAddShot">
            <text class="fb__shot-plus">＋</text>
            <text class="fb__shot-hint">截图</text>
          </view>
          <view v-for="(s, i) in shots" :key="i" class="fb__shot">
            <image class="fb__shot-img" :src="s" mode="aspectFill" />
          </view>
        </view>
      </view>

      <view class="card">
        <view class="row--between">
          <text class="cell__label">关联订单</text>
          <text class="cell__value">{{ options.orderNo }} ›</text>
        </view>
        <view class="hairline" />
        <view class="row--between">
          <text class="cell__label">联系方式</text>
          <text class="cell__value">{{ options.phoneMask }}</text>
        </view>
      </view>

      <view class="fb__gap" />
    </scroll-view>

    <view class="fb__bar">
      <view class="btn btn--primary tap" @tap="onSubmit">提交反馈</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.fb {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.fb__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx 0;
}

.card {
  margin-bottom: 20rpx;
}

.fb__types {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.fb__type {
  border: 3rpx solid var(--c-line-2);
  color: #7a7168;
  font-size: 23rpx;
  font-weight: 600;
  padding: 12rpx 26rpx;
  border-radius: 28rpx;
}

.fb__type--on {
  border-color: var(--c-primary);
  background: var(--c-primary-bg);
  color: var(--c-primary);
  font-weight: 700;
}

.fb__textarea {
  width: 100%;
  min-height: 220rpx;
  background: var(--c-fill);
  border-radius: 24rpx;
  padding: 24rpx;
  font-size: 25rpx;
  line-height: 1.7;
}

.fb__ph {
  color: var(--c-text-placeholder);
  font-size: 25rpx;
}

.fb__count {
  font-size: 22rpx;
  color: var(--c-text-placeholder-2);
}

.fb__shots {
  display: flex;
  gap: 20rpx;
}

.fb__shot-add {
  width: 140rpx;
  height: 140rpx;
  border-radius: 24rpx;
  background: var(--c-fill);
  border: 3rpx dashed #e2dad0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
}

.fb__shot-plus {
  font-size: 40rpx;
  color: var(--c-text-placeholder-2);
  line-height: 1;
}

.fb__shot-hint {
  font-size: 20rpx;
  color: var(--c-text-placeholder);
}

.fb__shot {
  width: 140rpx;
  height: 140rpx;
  border-radius: 24rpx;
  overflow: hidden;
  background: var(--c-img-placeholder);
}

.fb__shot-img {
  width: 100%;
  height: 100%;
}

.fb__gap {
  height: 32rpx;
}

.fb__bar {
  flex-shrink: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(28rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(28rpx + env(safe-area-inset-bottom));
}
</style>
