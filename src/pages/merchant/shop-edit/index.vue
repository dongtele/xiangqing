<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getShopProfileForm, saveShopProfileForm } from '@/services/api';
import { back, toast } from '@/utils/nav';
import type { ShopProfileForm } from '@/models';

/** 71 · 店铺信息编辑：门头照、名称电话地址、店铺公告（公告展示在顾客端菜单顶部） */
const data = ref<ShopProfileForm | null>(null);

onLoad(async () => {
  data.value = await getShopProfileForm();
});

function onCover(): void {
  uni.chooseImage({
    count: 1,
    success: (res) => {
      const files = res.tempFilePaths as string[];
      if (data.value && files.length) data.value.cover = files[0];
    },
    fail: () => toast('未选择图片'),
  });
}

function onRow(key: string, label: string): void {
  const row = data.value?.rows.find((r) => r.key === key);
  if (!row) return;
  uni.showModal({
    title: `修改${label}`,
    editable: true,
    placeholderText: row.value,
    confirmColor: '#FF4A17',
    success: (res) => {
      if (!res.confirm) return;
      const next = (res.content || '').trim();
      if (!next) {
        toast(`${label}不能为空`);
        return;
      }
      row.value = next;
    },
  });
}

function onNotice(e: Event): void {
  const val = (e as unknown as { detail: { value: string } }).detail.value;
  if (data.value) data.value.notice = val.slice(0, data.value.noticeMax);
}

async function onSave(): Promise<void> {
  if (!data.value) return;
  const res = await saveShopProfileForm(data.value);
  toast(res.message);
  if (res.ok) setTimeout(() => back(), 700);
}
</script>

<template>
  <view v-if="data" class="se">
    <wf-nav-bar title="店铺信息" right="保存" @righttap="onSave" />

    <scroll-view class="se__body" scroll-y>
      <view class="card">
        <text class="t-section">门头照</text>
        <view class="se__cover tap" @tap="onCover">
          <image v-if="data.cover" class="se__cover-img" :src="data.cover" mode="aspectFill" />
          <template v-else>
            <text class="se__cover-plus">＋</text>
            <text class="se__cover-hint">上传门店实景图（建议 16:9）</text>
          </template>
        </view>
      </view>

      <view class="card card--flat">
        <view v-for="r in data.rows" :key="r.key" class="cell tap" @tap="onRow(r.key, r.label)">
          <text class="cell__label">{{ r.label }}</text>
          <view class="cell__value"
            ><text class="ellipsis se__value">{{ r.value }}</text
            ><text class="chevron">›</text></view
          >
        </view>
      </view>

      <view class="card">
        <text class="t-section">店铺公告</text>
        <textarea
          class="se__notice"
          :value="data.notice"
          :maxlength="data.noticeMax"
          placeholder="写点什么，让顾客一眼记住你的店"
          placeholder-class="se__ph"
          @input="onNotice"
        />
        <view class="row--between">
          <text class="se__hint">{{ data.noticeHint }}</text>
          <text class="se__count">{{ data.notice.length }}/{{ data.noticeMax }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.se {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.se__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx calc(40rpx + constant(safe-area-inset-bottom));
  padding: 20rpx 32rpx calc(40rpx + env(safe-area-inset-bottom));
}

.card {
  margin-bottom: 20rpx;
}

.se__cover {
  height: 300rpx;
  border-radius: 28rpx;
  background: var(--c-img-placeholder);
  border: 3rpx dashed var(--c-line-2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  overflow: hidden;
}

.se__cover-img {
  width: 100%;
  height: 100%;
}

.se__cover-plus {
  font-size: 52rpx;
  color: var(--c-text-placeholder-2);
  line-height: 1;
}

.se__cover-hint {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.se__value {
  max-width: 380rpx;
}

.se__notice {
  width: 100%;
  height: 160rpx;
  font-size: 26rpx;
  line-height: 1.7;
}

.se__ph {
  color: var(--c-text-placeholder);
}

.se__hint {
  font-size: 21rpx;
  color: var(--c-text-weaker);
}

.se__count {
  font-size: 21rpx;
  color: var(--c-text-placeholder);
}
</style>
