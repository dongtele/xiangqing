<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { applyAftersale, getAftersaleOptions, trialRefund } from '@/services/api';
import { useAftersaleStore } from '@/stores/aftersale';
import { fen2yuan2 } from '@/utils/money';
import { back, push, replace, toast } from '@/utils/nav';
import type { AftersaleOptions, AftersaleType } from '@/models';

/** 20 · 申请售后：类型 + 原因 + 说明 + 凭证图，退款金额透明 */
const draft = useAftersaleStore();

const options = ref<AftersaleOptions | null>(null);
const refundText = ref('0.00');
const submitting = ref(false);
let orderId = '';

const itemsText = computed(() => {
  const checked = draft.checkedItems.length;
  const all = draft.items.length;
  return !checked || checked === all ? '全部商品' : `${checked} 件商品`;
});

onLoad((o) => {
  orderId = (o && o.id) || '';
});

onShow(async () => {
  const res = await getAftersaleOptions(orderId);
  if (!res) {
    toast('订单不存在');
    return;
  }
  options.value = res;
  if (!draft.isFor(orderId)) {
    draft.start(orderId, res.items);
    draft.reason = res.reasons[0];
  }
  if (!draft.reason) draft.reason = res.reasons[0];
  await refreshTrial();
});

/** 退款金额由服务端按实付比例分摊后返回，前端不自己算 */
async function refreshTrial(): Promise<void> {
  const checked = draft.checkedItems;
  const trial = await trialRefund(orderId, checked.length ? checked : draft.items);
  refundText.value = fen2yuan2(trial.refundAmount);
}

function onDesc(e: Event): void {
  draft.desc = (e as unknown as { detail: { value: string } }).detail.value;
}

/** 相机 / 相册权限在触发点申请，拒绝后给手动开启引导 */
function onAddPhoto(): void {
  if (draft.photos.length >= 3) {
    toast('最多上传 3 张凭证');
    return;
  }
  uni.chooseImage({
    count: 3 - draft.photos.length,
    success: (res) => {
      const paths = res.tempFilePaths as string[];
      draft.photos = [...draft.photos, ...paths];
    },
    fail: () => toast('已取消，也可在设置里开启相册权限'),
  });
}

async function onSubmit(): Promise<void> {
  if (submitting.value) return;
  if (!draft.reason) {
    toast('请选择售后原因');
    return;
  }
  submitting.value = true;
  try {
    const checked = draft.checkedItems;
    const { refundId } = await applyAftersale({
      orderId,
      type: draft.type,
      reason: draft.reason,
      desc: draft.desc,
      photos: draft.photos,
      items: checked.length ? checked : draft.items,
    });
    draft.reset();
    if (!refundId) {
      back();
      return;
    }
    replace(`/pages/customer/refund-detail/index?id=${refundId}`);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <view v-if="options" class="as">
    <wf-nav-bar title="申请售后" />

    <scroll-view class="as__body" scroll-y>
      <!-- 订单摘要 -->
      <view class="card as__order">
        <view class="as__order-img"><wf-thumb :src="options.orderImage" :radius="20" /></view>
        <view class="flex1 col as__order-text">
          <text class="as__order-title">{{ options.orderTitle }}</text>
          <text class="as__order-meta">{{ options.orderMetaText }}</text>
        </view>
      </view>

      <!-- 售后类型 -->
      <view class="card">
        <text class="t-section">售后类型</text>
        <view class="as__types">
          <view
            v-for="t in options.types"
            :key="t.id"
            class="as__type"
            :class="{ 'as__type--on': draft.type === t.id }"
            @tap="draft.type = t.id as AftersaleType"
          >
            <text class="as__type-name">{{ t.name }}</text>
            <text class="as__type-sub">{{ t.sub }}</text>
          </view>
        </view>
      </view>

      <!-- 退款商品范围：进 56 勾选部分商品 -->
      <view
        class="card as__scope tap"
        @tap="push(`/pages/customer/refund-items/index?id=${orderId}`)"
      >
        <text class="cell__label">退款商品</text>
        <view class="cell__value">
          <text>{{ itemsText }}</text>
          <text class="chevron">›</text>
        </view>
      </view>

      <!-- 原因 + 描述 + 凭证 -->
      <view class="card">
        <text class="t-section">售后原因</text>
        <view class="as__reasons">
          <text
            v-for="r in options.reasons"
            :key="r"
            class="as__reason"
            :class="{ 'as__reason--on': draft.reason === r }"
            @tap="draft.reason = r"
            >{{ r }}</text
          >
        </view>

        <textarea
          class="as__desc"
          :value="draft.desc"
          placeholder="补充描述（选填），可上传照片凭证…"
          placeholder-class="as__desc-ph"
          maxlength="200"
          auto-height
          @input="onDesc"
        />

        <view class="as__photos">
          <view v-for="(p, index) in draft.photos" :key="index" class="as__photo">
            <image class="as__photo-img" :src="p" mode="aspectFill" />
            <text
              class="as__photo-del tap"
              @tap.stop="draft.photos = draft.photos.filter((_, i) => i !== index)"
              >✕</text
            >
          </view>
          <view v-if="draft.photos.length < 3" class="as__photo-add tap" @tap="onAddPhoto">
            <text class="as__photo-plus">＋</text>
            <text class="as__photo-hint">凭证</text>
          </view>
        </view>
      </view>

      <!-- 金额 -->
      <view class="card as__amount">
        <text class="as__amount-label">预计退款金额</text>
        <view class="as__amount-num">
          <text class="as__amount-sym">¥</text>
          <text class="as__amount-value">{{ refundText }}</text>
        </view>
      </view>

      <text class="as__tip">{{ options.tip }}</text>
      <view class="as__foot" />
    </scroll-view>

    <view class="as__bar">
      <view class="btn btn--primary tap" :class="{ 'btn--disabled': submitting }" @tap="onSubmit"
        >提交申请</view
      >
    </view>
  </view>
</template>

<style lang="scss" scoped>
.as {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.as__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx 0;
}

.as__body > .card {
  margin-bottom: 24rpx;
}

/* 订单摘要 */
.as__order {
  flex-direction: row;
  align-items: center;
  gap: 20rpx;
}

.as__order-img {
  width: 96rpx;
  height: 96rpx;
  border-radius: 20rpx;
  overflow: hidden;
  flex-shrink: 0;
}

.as__order-text {
  gap: 4rpx;
}

.as__order-title {
  font-size: 26rpx;
  font-weight: 700;
}

.as__order-meta {
  font-size: 21rpx;
  color: var(--c-text-weaker);
}

/* 类型 */
.as__types {
  display: flex;
  gap: 20rpx;
}

.as__type {
  flex: 1;
  border: 3rpx solid var(--c-line-2);
  border-radius: 28rpx;
  padding: 26rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
}

.as__type--on {
  border-color: var(--c-primary);
  background: var(--c-primary-bg-weak);
}

.as__type-name {
  font-size: 27rpx;
  font-weight: 700;
  color: var(--c-text-2);
}

.as__type--on .as__type-name {
  font-weight: 800;
  color: var(--c-primary);
}

.as__type-sub {
  font-size: 20rpx;
  color: var(--c-text-weaker);
}

/* 范围 */
.as__scope {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
}

/* 原因 */
.as__reasons {
  display: flex;
  gap: 16rpx;
  flex-wrap: wrap;
}

.as__reason {
  border: 3rpx solid var(--c-line-2);
  color: var(--c-text-weak);
  font-size: 23rpx;
  padding: 12rpx 26rpx;
  border-radius: 28rpx;
}

.as__reason--on {
  border-color: var(--c-primary);
  background: var(--c-primary-bg);
  color: var(--c-primary);
  font-weight: 700;
}

.as__desc {
  background: #faf7f2;
  border-radius: 24rpx;
  padding: 24rpx;
  font-size: 24rpx;
  min-height: 128rpx;
  width: 100%;
}

.as__desc-ph {
  color: var(--c-text-placeholder);
  font-size: 24rpx;
}

.as__photos {
  display: flex;
  gap: 16rpx;
  flex-wrap: wrap;
}

.as__photo {
  position: relative;
  width: 144rpx;
  height: 144rpx;
}

.as__photo-img {
  width: 100%;
  height: 100%;
  border-radius: 20rpx;
  background: var(--c-img-placeholder);
}

.as__photo-del {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background: rgba(32, 22, 15, 0.7);
  color: #fff;
  font-size: 20rpx;
  line-height: 36rpx;
  text-align: center;
}

.as__photo-add {
  width: 144rpx;
  height: 144rpx;
  border-radius: 20rpx;
  background: var(--c-img-placeholder);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
}

.as__photo-plus {
  font-size: 40rpx;
  color: var(--c-text-placeholder);
  line-height: 1;
}

.as__photo-hint {
  font-size: 20rpx;
  color: var(--c-text-placeholder);
}

/* 金额 */
.as__amount {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
}

.as__amount-label {
  font-size: 26rpx;
  color: var(--c-text-weak);
}

.as__amount-num {
  display: flex;
  align-items: baseline;
  color: var(--c-primary-deep);
  font-weight: 800;
}

.as__amount-sym {
  font-size: 24rpx;
}

.as__amount-value {
  font-size: 40rpx;
}

.as__tip {
  display: block;
  font-size: 21rpx;
  color: var(--c-text-placeholder);
  text-align: center;
  line-height: 1.6;
}

.as__foot {
  height: 32rpx;
}

.as__bar {
  flex-shrink: 0;
  background: #fff;
  border-top: 1px solid #f3eee8;
  padding: 24rpx 32rpx;
  padding-bottom: calc(28rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(28rpx + env(safe-area-inset-bottom));
}
</style>
