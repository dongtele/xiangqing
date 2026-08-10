<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { applyInvoice, getInvoiceOptions, getInvoiceTitles } from '@/services/api';
import { fen2yuan2 } from '@/utils/money';
import { back, push, toast } from '@/utils/nav';
import type { InvoiceOptions, InvoiceTitle } from '@/models';

/** 57 · 申请发票：类型、抬头、金额、邮箱 */
const options = ref<InvoiceOptions | null>(null);
const titles = ref<InvoiceTitle[]>([]);
const titleType = ref<'company' | 'personal'>('company');
const pickedTitleId = ref('');
const email = ref('');
const remark = ref('');

const picked = computed(() => titles.value.find((t) => t.id === pickedTitleId.value) || null);
const amountText = computed(() => (options.value ? fen2yuan2(options.value.amount) : '0.00'));

onLoad(async () => {
  const res = await getInvoiceOptions();
  options.value = res;
  email.value = res.email;
});

onShow(async () => {
  titles.value = await getInvoiceTitles();
  const preset = titles.value.find((t) => t.isDefault) || titles.value[0];
  if (preset && !pickedTitleId.value) {
    pickedTitleId.value = preset.id;
    titleType.value = preset.type;
  }
});

function onSwitchType(type: 'company' | 'personal'): void {
  titleType.value = type;
  const hit = titles.value.find((t) => t.type === type);
  pickedTitleId.value = hit ? hit.id : '';
}

function editEmail(): void {
  uni.showModal({
    title: '接收邮箱',
    editable: true,
    placeholderText: email.value,
    confirmColor: '#FF4A17',
    success: (res) => {
      if (!res.confirm) return;
      email.value = (res.content || '').trim();
    },
  });
}

function editRemark(): void {
  uni.showModal({
    title: '备注（选填）',
    editable: true,
    placeholderText: remark.value || '选填',
    confirmColor: '#FF4A17',
    success: (res) => {
      if (!res.confirm) return;
      remark.value = (res.content || '').trim();
    },
  });
}

async function onSubmit(): Promise<void> {
  if (!picked.value) {
    toast('请选择发票抬头');
    return;
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value)) {
    toast('请填写正确的接收邮箱');
    return;
  }
  await applyInvoice({
    orderNo: options.value?.orderNo,
    titleId: picked.value.id,
    email: email.value,
    remark: remark.value,
  });
  toast('开票申请已提交', 'success');
  back();
}
</script>

<template>
  <view v-if="options" class="iv">
    <wf-nav-bar title="申请发票" />

    <scroll-view class="iv__body" scroll-y>
      <view class="card">
        <view class="row--between">
          <text class="cell__label">开票订单</text>
          <text class="cell__value">{{ options.orderNo }}</text>
        </view>
        <view class="hairline" />
        <view class="row--between">
          <text class="cell__label">开票金额</text>
          <text class="cell__value">￥{{ amountText }}</text>
        </view>
        <view class="hairline" />
        <view class="row--between">
          <text class="cell__label">发票类型</text>
          <text class="cell__value">{{ options.invoiceTypeText }}</text>
        </view>
      </view>

      <view class="card">
        <text class="t-section">抬头类型</text>
        <view class="iv__types">
          <view
            class="iv__type"
            :class="{ 'iv__type--on': titleType === 'company' }"
            @tap="onSwitchType('company')"
            >单位</view
          >
          <view
            class="iv__type"
            :class="{ 'iv__type--on': titleType === 'personal' }"
            @tap="onSwitchType('personal')"
            >个人</view
          >
        </view>
        <view class="hairline" />
        <view class="row--between tap" @tap="push('/pages/customer/invoice-titles/index')">
          <text class="cell__label">发票抬头</text>
          <text class="cell__value">{{ picked ? picked.name : '请选择' }} ›</text>
        </view>
        <view class="hairline" />
        <view class="row--between tap" @tap="push('/pages/customer/invoice-titles/index')">
          <text class="cell__label">税号</text>
          <text class="cell__value">{{ picked && picked.taxNo ? picked.taxNo : '—' }} ›</text>
        </view>
        <view class="hairline" />
        <view class="row--between tap" @tap="editEmail">
          <text class="cell__label">接收邮箱</text>
          <text class="cell__value">{{ email }} ›</text>
        </view>
      </view>

      <view class="card">
        <view class="row--between tap" @tap="editRemark">
          <text class="cell__label">备注</text>
          <text class="cell__value">{{ remark || '选填' }} ›</text>
        </view>
      </view>

      <text class="iv__tip">{{ options.tip }}</text>
      <view class="iv__foot" />
    </scroll-view>

    <view class="iv__bar">
      <view class="btn btn--primary tap" @tap="onSubmit">提交开票申请</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.iv {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.iv__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx 0;
}

.card {
  margin-bottom: 20rpx;
}

.iv__types {
  display: flex;
  gap: 20rpx;
}

.iv__type {
  flex: 1;
  height: 84rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 27rpx;
  font-weight: 600;
  background: var(--c-fill);
  color: var(--c-text-weak);
  border: 1px solid #ede6de;
}

.iv__type--on {
  background: var(--c-primary-bg);
  color: var(--c-primary);
  font-weight: 800;
  border: 3rpx solid var(--c-primary);
}

.iv__tip {
  display: block;
  font-size: 22rpx;
  color: var(--c-text-weaker);
  line-height: 1.7;
  padding: 0 8rpx;
}

.iv__foot {
  height: 32rpx;
}

.iv__bar {
  flex-shrink: 0;
  background: #fff;
  border-top: 1px solid var(--c-img-placeholder);
  padding: 24rpx 32rpx;
  padding-bottom: calc(28rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(28rpx + env(safe-area-inset-bottom));
}
</style>
