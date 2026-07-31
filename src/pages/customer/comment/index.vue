<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getCommentOptions, submitComment } from '@/services/api';
import { back, toast } from '@/utils/nav';
import type { CommentOptions } from '@/models';

/** 19 · 订单评价：星级 + 标签 + 文字 + 图片 + 匿名 */
const options = ref<CommentOptions | null>(null);
const stars = ref(5);
const tags = ref<string[]>([]);
const text = ref('');
const photos = ref<string[]>([]);
const anonymous = ref(false);
let orderId = '';

const ratingLabel = computed(() =>
  options.value ? options.value.ratingLabels[stars.value - 1] || '' : ''
);
const lengthText = computed(
  () => `${text.value.length}/${options.value ? options.value.maxLength : 200}`
);

onLoad(async (o) => {
  orderId = (o && o.id) || '';
  const res = await getCommentOptions();
  options.value = res;
  tags.value = res.tags.slice(0, 2);
});

function toggleTag(t: string): void {
  tags.value = tags.value.includes(t) ? tags.value.filter((x) => x !== t) : [...tags.value, t];
}

function onInput(e: Event): void {
  text.value = (e as unknown as { detail: { value: string } }).detail.value;
}

function onAddPhoto(): void {
  const max = options.value ? options.value.maxPhotos : 9;
  if (photos.value.length >= max) {
    toast(`最多上传 ${max} 张`);
    return;
  }
  uni.chooseImage({
    count: max - photos.value.length,
    success: (res) => {
      photos.value = [...photos.value, ...(res.tempFilePaths as string[])];
    },
    fail: () => toast('已取消'),
  });
}

async function onSubmit(): Promise<void> {
  await submitComment({
    orderId,
    stars: stars.value,
    tags: tags.value,
    text: text.value,
    photos: photos.value,
    anonymous: anonymous.value,
  });
  toast('评价已提交，感谢反馈', 'success');
  back();
}
</script>

<template>
  <view v-if="options" class="cm">
    <wf-nav-bar title="评价订单" />

    <scroll-view class="cm__body" scroll-y>
      <view class="card cm__rating">
        <text class="cm__ask">本次用餐体验如何？</text>
        <view class="cm__stars">
          <text
            v-for="n in 5"
            :key="n"
            class="cm__star"
            :class="{ 'cm__star--off': n > stars }"
            @tap="stars = n"
            >★</text
          >
        </view>
        <text class="cm__label">{{ ratingLabel }}</text>
        <view class="cm__tags">
          <text
            v-for="t in options.tags"
            :key="t"
            class="cm__tag"
            :class="{ 'cm__tag--on': tags.includes(t) }"
            @tap="toggleTag(t)"
            >{{ t }}</text
          >
        </view>
      </view>

      <view class="card">
        <textarea
          class="cm__textarea"
          :value="text"
          placeholder="说说菜品口味、分量和配送体验…"
          placeholder-class="cm__ph"
          :maxlength="options.maxLength"
          auto-height
          @input="onInput"
        />
        <view class="cm__photos">
          <view v-for="(p, i) in photos" :key="i" class="cm__photo">
            <image class="cm__photo-img" :src="p" mode="aspectFill" />
          </view>
          <view class="cm__photo-add tap" @tap="onAddPhoto">
            <text class="cm__photo-plus">＋</text>
            <text class="cm__photo-hint">添加照片</text>
          </view>
        </view>
        <text class="cm__count">{{ lengthText }}</text>
      </view>

      <view class="card cm__anon">
        <view class="col cm__anon-text">
          <text class="cm__anon-title">匿名评价</text>
          <text class="cm__anon-sub">商家将看不到你的昵称头像</text>
        </view>
        <wf-toggle :on="anonymous" @change="anonymous = $event" />
      </view>

      <view class="cm__reward">{{ options.rewardText }}</view>
      <view class="cm__foot" />
    </scroll-view>

    <view class="cm__bar">
      <view class="btn btn--primary tap" @tap="onSubmit">提交评价</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.cm {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.cm__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx 0;
}

.cm__body > .card {
  margin-bottom: 24rpx;
}

.cm__rating {
  align-items: center;
  padding: 36rpx;
}

.cm__ask {
  font-size: 26rpx;
  color: var(--c-text-weak);
}

.cm__stars {
  display: flex;
  gap: 20rpx;
}

.cm__star {
  font-size: 60rpx;
  color: #ffaa00;
  line-height: 1;
}

.cm__star--off {
  color: var(--c-line-4);
}

.cm__label {
  font-size: 26rpx;
  font-weight: 800;
  color: var(--c-primary);
}

.cm__tags {
  display: flex;
  gap: 16rpx;
  flex-wrap: wrap;
  justify-content: center;
}

.cm__tag {
  border: 3rpx solid var(--c-line-2);
  color: var(--c-text-weak);
  font-size: 23rpx;
  padding: 12rpx 26rpx;
  border-radius: 28rpx;
}

.cm__tag--on {
  border-color: var(--c-primary);
  background: var(--c-primary-bg);
  color: var(--c-primary);
  font-weight: 700;
}

.cm__textarea {
  width: 100%;
  font-size: 24rpx;
  line-height: 1.7;
  min-height: 120rpx;
}

.cm__ph {
  color: var(--c-text-placeholder);
  font-size: 24rpx;
}

.cm__photos {
  display: flex;
  gap: 20rpx;
  flex-wrap: wrap;
}

.cm__photo {
  width: 140rpx;
  height: 140rpx;
  border-radius: 20rpx;
  overflow: hidden;
}

.cm__photo-img {
  width: 100%;
  height: 100%;
}

.cm__photo-add {
  width: 140rpx;
  height: 140rpx;
  border-radius: 20rpx;
  border: 3rpx dashed var(--c-line-5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
}

.cm__photo-plus {
  font-size: 36rpx;
  color: var(--c-text-placeholder);
  line-height: 1;
}

.cm__photo-hint {
  font-size: 18rpx;
  color: var(--c-text-placeholder);
}

.cm__count {
  font-size: 21rpx;
  color: var(--c-text-placeholder);
  text-align: right;
}

.cm__anon {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
}

.cm__anon-text {
  gap: 4rpx;
}

.cm__anon-title {
  font-size: 27rpx;
  font-weight: 700;
}

.cm__anon-sub {
  font-size: 21rpx;
  color: var(--c-text-weaker);
}

.cm__reward {
  background: var(--c-warn-bg);
  border: 1px solid #f5e3bc;
  border-radius: 24rpx;
  padding: 20rpx 28rpx;
  font-size: 22rpx;
  color: var(--c-warn-text-2);
}

.cm__foot {
  height: 32rpx;
}

.cm__bar {
  flex-shrink: 0;
  background: #fff;
  border-top: 1px solid #f3eee8;
  padding: 24rpx 32rpx;
  padding-bottom: calc(28rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(28rpx + env(safe-area-inset-bottom));
}
</style>
