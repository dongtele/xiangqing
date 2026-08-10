<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getInvoiceTitles, removeInvoiceTitle, setDefaultInvoiceTitle } from '@/services/api';
import { toast } from '@/utils/nav';
import type { InvoiceTitle } from '@/models';

/** 58 · 发票抬头管理：抬头列表增删改 */
const list = ref<InvoiceTitle[]>([]);

onShow(() => {
  load();
});

async function load(): Promise<void> {
  list.value = await getInvoiceTitles();
}

async function onSetDefault(id: string): Promise<void> {
  await setDefaultInvoiceTitle(id);
  toast('已设为默认抬头');
  await load();
}

function onRemove(id: string): void {
  uni.showModal({
    title: '删除该抬头？',
    confirmText: '删除',
    confirmColor: '#D14343',
    success: async (res) => {
      if (!res.confirm) return;
      await removeInvoiceTitle(id);
      await load();
    },
  });
}

function onCreate(): void {
  if (list.value.length >= 10) {
    toast('最多保存 10 个抬头');
    return;
  }
  toast('新增抬头：填写名称与税号后保存');
}
</script>

<template>
  <view class="it">
    <wf-nav-bar title="发票抬头" right="＋ 新增" @righttap="onCreate" />

    <scroll-view class="it__body" scroll-y>
      <view v-for="t in list" :key="t.id" class="card it__item">
        <view class="row it__title">
          <text class="it__name">{{ t.name }}</text>
          <text class="it__type">{{ t.typeText }}</text>
          <text v-if="t.isDefault" class="it__default">默认</text>
        </view>
        <text class="it__tax">税号：{{ t.taxNo || '—' }}</text>
        <view class="it__actions">
          <text v-if="t.isDefault" class="it__flag">✓ 默认抬头</text>
          <text v-else class="it__set tap" @tap="onSetDefault(t.id)">设为默认</text>
          <view class="row it__ops">
            <text class="it__op tap" @tap="toast('编辑抬头：填写名称与税号后保存')">编辑</text>
            <text class="it__op-sep">·</text>
            <text class="it__op tap" @tap="onRemove(t.id)">删除</text>
          </view>
        </view>
      </view>

      <text class="it__hint">最多保存 10 个抬头</text>
      <view class="it__foot" />
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.it {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.it__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx 0;
}

.it__item {
  margin-bottom: 20rpx;
  gap: 12rpx;
}

.it__title {
  gap: 16rpx;
}

.it__name {
  font-size: 28rpx;
  font-weight: 800;
}

.it__type {
  font-size: 20rpx;
  font-weight: 700;
  color: var(--c-text-weak);
  background: var(--c-fill-2);
  padding: 4rpx 14rpx;
  border-radius: 10rpx;
}

.it__default {
  font-size: 20rpx;
  font-weight: 700;
  color: #fff;
  background: var(--c-primary);
  padding: 4rpx 14rpx;
  border-radius: 10rpx;
}

.it__tax {
  font-size: 23rpx;
  color: var(--c-text-weaker);
}

.it__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16rpx;
  border-top: 1px solid var(--c-line);
}

.it__flag,
.it__set {
  font-size: 23rpx;
  color: var(--c-text-weaker);
}

.it__ops {
  gap: 12rpx;
}

.it__op {
  font-size: 23rpx;
  color: var(--c-text-weak);
  font-weight: 700;
}

.it__op-sep {
  color: var(--c-text-placeholder-2);
  font-size: 23rpx;
}

.it__hint {
  display: block;
  text-align: center;
  font-size: 22rpx;
  color: var(--c-text-placeholder);
  padding-top: 12rpx;
}

.it__foot {
  height: 32rpx;
}
</style>
