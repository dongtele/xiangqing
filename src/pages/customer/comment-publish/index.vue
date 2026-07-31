<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getCommentOptions, submitComment } from '@/services/api';
import { back, toast } from '@/utils/nav';
import type { CommentOptions } from '@/models';

/** 55 · 发布评价（评价晒单）：星级、标签、图片、匿名，右上角提交 */
const options = ref<CommentOptions | null>(null);
const stars = ref(5);
const tags = ref<string[]>([]);
const text = ref('');
const photos = ref<string[]>(['', '']);
const anonymous = ref(true);
let orderId = '';

const ratingLabel = computed(() => {
  if (!options.value) return '';
  return stars.value === 5 ? '超赞' : options.value.ratingLabels[stars.value - 1] || '';
});

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
    photos: photos.value.filter(Boolean),
    anonymous: anonymous.value,
  });
  toast('已发布，感谢晒单', 'success');
  back();
}
</script>

<template>
  <view v-if="options" class="cp">
    <wf-nav-bar title="评价晒单" right="提交" @righttap="onSubmit" />

    <scroll-view class="cp__body" scroll-y>
      <view class="card">
        <view class="cp__shop">
          <view class="cp__logo"><wf-thumb :src="options.shopLogo" :radius="20" /></view>
          <view class="flex1 col cp__shop-text">
            <text class="cp__shop-name">{{ options.shopName }}</text>
            <text class="cp__shop-meta">{{ options.orderMetaText }}</text>
          </view>
        </view>
        <view class="hairline" />
        <view class="cp__rating">
          <text class="cp__rating-label">总体评分</text>
          <view class="cp__stars">
            <text
              v-for="n in 5"
              :key="n"
              class="cp__star"
              :class="{ 'cp__star--off': n > stars }"
              @tap="stars = n"
              >★</text
            >
          </view>
          <text class="cp__rating-word">{{ ratingLabel }}</text>
        </view>
      </view>

      <view class="card">
        <text class="t-section">大家都在夸</text>
        <view class="cp__tags">
          <text
            v-for="t in options.tags"
            :key="t"
            class="cp__tag"
            :class="{ 'cp__tag--on': tags.includes(t) }"
            @tap="toggleTag(t)"
            >{{ t }}</text
          >
        </view>
      </view>

      <view class="card">
        <textarea
          class="cp__textarea"
          :value="text"
          placeholder="说说菜品口味、分量和配送体验…（可获 5 积分）"
          placeholder-class="cp__ph"
          :maxlength="options.maxLength"
          @input="onInput"
        />
        <view class="cp__photos">
          <view v-for="(p, i) in photos" :key="i" class="cp__photo">
            <wf-thumb :src="p" :radius="20" />
          </view>
          <view class="cp__photo-add tap" @tap="onAddPhoto">
            <text class="cp__photo-plus">＋</text>
            <text class="cp__photo-hint">{{ photos.length }}/{{ options.maxPhotos }}</text>
          </view>
        </view>
      </view>

      <view class="card cp__anon">
        <view class="col cp__anon-text">
          <text class="cp__anon-title">匿名评价</text>
          <text class="cp__anon-sub">仅显示为「匿名用户」</text>
        </view>
        <wf-toggle :on="anonymous" @change="anonymous = $event" />
      </view>

      <view class="cp__foot" />
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.cp {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.cp__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx 0;
}

.cp__body > .card {
  margin-bottom: 20rpx;
}

.cp__shop {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.cp__logo {
  width: 88rpx;
  height: 88rpx;
  border-radius: 20rpx;
  overflow: hidden;
  flex-shrink: 0;
}

.cp__shop-text {
  gap: 4rpx;
}

.cp__shop-name {
  font-size: 27rpx;
  font-weight: 800;
}

.cp__shop-meta {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.cp__rating {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.cp__rating-label {
  font-size: 26rpx;
  font-weight: 700;
}

.cp__stars {
  display: flex;
  gap: 6rpx;
}

.cp__star {
  font-size: 44rpx;
  color: var(--c-warn);
  line-height: 1;
}

.cp__star--off {
  color: var(--c-line-4);
}

.cp__rating-word {
  font-size: 24rpx;
  font-weight: 800;
  color: var(--c-warn);
}

.cp__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.cp__tag {
  font-size: 24rpx;
  font-weight: 600;
  padding: 12rpx 26rpx;
  border-radius: 30rpx;
  color: var(--c-text-weak);
  background: #f6f3ef;
  border: 1px solid #ede6de;
}

.cp__tag--on {
  color: #fff;
  background: var(--c-primary);
  border-color: var(--c-primary);
}

.cp__textarea {
  width: 100%;
  min-height: 140rpx;
  font-size: 25rpx;
  line-height: 1.7;
}

.cp__ph {
  color: var(--c-text-placeholder);
  font-size: 25rpx;
}

.cp__photos {
  display: flex;
  gap: 16rpx;
  flex-wrap: wrap;
}

.cp__photo {
  width: 128rpx;
  height: 128rpx;
  border-radius: 20rpx;
  overflow: hidden;
  flex-shrink: 0;
}

.cp__photo-add {
  width: 128rpx;
  height: 128rpx;
  border-radius: 20rpx;
  border: 1px dashed var(--c-line-5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  flex-shrink: 0;
}

.cp__photo-plus {
  font-size: 36rpx;
  color: var(--c-text-placeholder);
  line-height: 1;
}

.cp__photo-hint {
  font-size: 19rpx;
  color: var(--c-text-placeholder);
}

.cp__anon {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
}

.cp__anon-text {
  gap: 4rpx;
}

.cp__anon-title {
  font-size: 27rpx;
  font-weight: 700;
}

.cp__anon-sub {
  font-size: 21rpx;
  color: var(--c-text-weaker);
}

.cp__foot {
  height: 32rpx;
}
</style>
