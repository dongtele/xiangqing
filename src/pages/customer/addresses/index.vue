<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getAddresses, removeAddress, setDefaultAddress } from '@/services/api';
import { push, toast } from '@/utils/nav';
import type { AddressFull } from '@/models';

/** 38 · 地址管理：增删改、设为默认 */
const list = ref<AddressFull[]>([]);

onShow(() => {
  load();
});

async function load(): Promise<void> {
  list.value = await getAddresses();
}

async function onSetDefault(id: string): Promise<void> {
  await setDefaultAddress(id);
  toast('已设为默认地址');
  await load();
}

function onRemove(id: string): void {
  uni.showModal({
    title: '删除该地址？',
    confirmText: '删除',
    confirmColor: '#D14343',
    success: async (res) => {
      if (!res.confirm) return;
      await removeAddress(id);
      await load();
    },
  });
}
</script>

<template>
  <view class="ad">
    <wf-nav-bar title="收货地址" />

    <scroll-view class="ad__body" scroll-y>
      <view v-for="a in list" :key="a.id" class="card ad__item">
        <view class="row ad__title">
          <text class="ad__tag">{{ a.tag }}</text>
          <text class="ad__who">{{ a.receiver }} {{ a.phoneMask }}</text>
          <text v-if="a.isDefault" class="ad__default">默认</text>
        </view>
        <text class="ad__detail">{{ a.detail }}</text>
        <view class="ad__actions">
          <text v-if="a.isDefault" class="ad__flag">✓ 默认地址</text>
          <text v-else class="ad__set tap" @tap="onSetDefault(a.id)">设为默认</text>
          <view class="row ad__ops">
            <text class="ad__op tap" @tap="push(`/pages/customer/address-edit/index?id=${a.id}`)"
              >编辑</text
            >
            <text class="ad__op-sep">·</text>
            <text class="ad__op tap" @tap="onRemove(a.id)">删除</text>
          </view>
        </view>
      </view>

      <view v-if="!list.length" class="empty">
        <text class="empty__text">还没有收货地址</text>
      </view>

      <view class="ad__foot" />
    </scroll-view>

    <view class="ad__bar">
      <view class="btn btn--primary tap" @tap="push('/pages/customer/address-edit/index')"
        >＋ 新增收货地址</view
      >
    </view>
  </view>
</template>

<style lang="scss" scoped>
.ad {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ad__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx 0;
}

.ad__item {
  margin-bottom: 20rpx;
  gap: 12rpx;
}

.ad__title {
  gap: 16rpx;
}

.ad__tag {
  font-size: 21rpx;
  font-weight: 800;
  color: var(--c-primary);
  background: var(--c-primary-bg);
  padding: 4rpx 14rpx;
  border-radius: 12rpx;
}

.ad__who {
  font-size: 28rpx;
  font-weight: 800;
}

.ad__default {
  font-size: 20rpx;
  font-weight: 700;
  color: #fff;
  background: var(--c-primary);
  padding: 4rpx 14rpx;
  border-radius: 12rpx;
}

.ad__detail {
  font-size: 25rpx;
  color: var(--c-text-3);
  line-height: 1.6;
}

.ad__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16rpx;
  border-top: 1px solid var(--c-line);
}

.ad__flag {
  font-size: 23rpx;
  color: var(--c-text-weaker);
}

.ad__set {
  font-size: 23rpx;
  color: var(--c-text-weaker);
}

.ad__ops {
  gap: 12rpx;
}

.ad__op {
  font-size: 23rpx;
  color: var(--c-text-weak);
  font-weight: 700;
}

.ad__op-sep {
  color: var(--c-text-placeholder-2);
  font-size: 23rpx;
}

.ad__foot {
  height: 32rpx;
}

.ad__bar {
  flex-shrink: 0;
  background: #fff;
  border-top: 1px solid var(--c-img-placeholder);
  padding: 24rpx 32rpx;
  padding-bottom: calc(28rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(28rpx + env(safe-area-inset-bottom));
}
</style>
