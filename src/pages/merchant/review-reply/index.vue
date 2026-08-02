<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { appealReview, getReviewReply, submitReviewReply } from '@/services/api';
import { back, toast } from '@/utils/nav';
import type { ReviewReplyInfo } from '@/models';

/** 90 · 评价回复：快捷模板 + 补偿券 + 申诉，回复后顾客可见且不可修改 */
const MAX = 200;
const info = ref<ReviewReplyInfo | null>(null);
const text = ref('');
const withCoupon = ref(true);
let reviewId = '';

const stars = computed(() => {
  if (!info.value) return '';
  const n = info.value.review.stars;
  return '★'.repeat(n) + '☆'.repeat(5 - n);
});

onLoad(async (o) => {
  reviewId = (o && o.id) || '';
  const res = await getReviewReply(reviewId);
  if (!res) {
    toast('评价不存在');
    return;
  }
  info.value = res;
});

function onInput(e: Event): void {
  text.value = (e as unknown as { detail: { value: string } }).detail.value.slice(0, MAX);
}

function onTemplate(key: string): void {
  const tpl = info.value?.templates.find((t) => t.key === key);
  if (tpl) text.value = tpl.text.slice(0, MAX);
}

async function onSubmit(): Promise<void> {
  if (!text.value.trim()) {
    toast('请填写回复内容');
    return;
  }
  const res = await submitReviewReply(reviewId, text.value, withCoupon.value);
  toast(res.message);
  if (res.ok) setTimeout(() => back(), 700);
}

async function onAppeal(): Promise<void> {
  const res = await appealReview(reviewId);
  toast(res.message);
}
</script>

<template>
  <view v-if="info" class="rr">
    <wf-nav-bar title="回复评价" />

    <scroll-view class="rr__body" scroll-y>
      <!-- 评价原文 -->
      <view class="card">
        <view class="rr__who">
          <view class="rr__avatar">{{ info.review.user.slice(0, 1) }}</view>
          <view class="flex1 col rr__who-text">
            <text class="rr__user">{{ info.review.user }} · 订单 {{ info.orderNo }}</text>
            <text class="rr__stars">{{ stars }} · {{ info.review.timeText }}</text>
          </view>
        </view>
        <text class="rr__content">{{ info.review.content }}</text>
        <view v-if="info.tags.length" class="rr__tags">
          <text v-for="t in info.tags" :key="t" class="tag tag--warn">{{ t }}</text>
        </view>
      </view>

      <!-- 快捷模板 -->
      <view class="card">
        <text class="t-section">快捷模板</text>
        <view class="rr__templates">
          <view
            v-for="t in info.templates"
            :key="t.key"
            class="rr__template tap-sm"
            @tap="onTemplate(t.key)"
            >{{ t.label }}</view
          >
        </view>
      </view>

      <!-- 回复输入 -->
      <view class="card">
        <textarea
          class="rr__textarea"
          :value="text"
          :maxlength="MAX"
          placeholder="写下你的回复，顾客会收到通知"
          placeholder-class="rr__ph"
          @input="onInput"
        />
        <view class="row--between">
          <text class="rr__hint">回复后顾客可见，不可修改</text>
          <text class="rr__count">{{ text.length }}/{{ MAX }}</text>
        </view>
      </view>

      <view class="card">
        <view class="rr__coupon">
          <view class="flex1 col rr__coupon-text">
            <text class="rr__coupon-name">附赠补偿券</text>
            <text class="rr__coupon-sub">{{ info.couponText }}</text>
          </view>
          <wf-toggle :on="withCoupon" @change="withCoupon = $event" />
        </view>
      </view>

      <text class="rr__appeal tap-sm" @tap="onAppeal">申诉恶意评价</text>
    </scroll-view>

    <view class="rr__foot">
      <view class="btn btn--primary tap" @tap="onSubmit">提交回复</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.rr {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.rr__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx 0;
}

.rr__body > .card {
  margin-bottom: 20rpx;
}

.rr__who {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.rr__avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: var(--c-fill-3);
  color: var(--c-text-weak);
  font-size: 26rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rr__who-text {
  gap: 6rpx;
}

.rr__user {
  font-size: 26rpx;
  font-weight: 800;
}

.rr__stars {
  font-size: 22rpx;
  color: var(--c-gold);
}

.rr__content {
  font-size: 26rpx;
  color: var(--c-text-2);
  line-height: 1.7;
}

.rr__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.rr__templates {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.rr__template {
  border: 3rpx solid var(--c-primary-line-deep);
  color: var(--c-primary);
  font-size: 23rpx;
  font-weight: 700;
  padding: 12rpx 26rpx;
  border-radius: 28rpx;
}

.rr__textarea {
  width: 100%;
  height: 240rpx;
  font-size: 26rpx;
  line-height: 1.7;
}

.rr__ph {
  color: var(--c-text-placeholder);
}

.rr__hint {
  font-size: 21rpx;
  color: var(--c-text-weaker);
}

.rr__count {
  font-size: 21rpx;
  color: var(--c-text-placeholder);
}

.rr__coupon {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.rr__coupon-text {
  gap: 4rpx;
}

.rr__coupon-name {
  font-size: 27rpx;
  font-weight: 700;
}

.rr__coupon-sub {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.rr__appeal {
  display: block;
  text-align: center;
  font-size: 23rpx;
  color: var(--c-text-weaker);
  padding: 12rpx 0 24rpx;
}

.rr__foot {
  flex-shrink: 0;
  padding: 20rpx 32rpx calc(24rpx + constant(safe-area-inset-bottom));
  padding: 20rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
}
</style>
