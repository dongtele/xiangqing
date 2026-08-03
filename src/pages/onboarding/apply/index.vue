<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getOnboardForm, saveOnboardForm } from '@/services/api';
import { push, toast } from '@/utils/nav';
import type { OnboardForm, UploadSlot } from '@/models';

/** 14 · 商家入驻申请（第 1 步）：填写店铺资料，必填项齐了才能进第 2 步 */
const data = ref<OnboardForm | null>(null);

const canNext = computed(() => !!data.value && data.value.rows.every((r) => !!r.value));

onLoad(async () => {
  data.value = await getOnboardForm();
});

function onRow(key: string, label: string): void {
  const row = data.value?.rows.find((r) => r.key === key);
  if (!row) return;
  if (key === 'address') {
    // 门店定位复用顾客端 52 的地图选点
    push('/pages/customer/map-picker/index');
    row.value = '西湖区文三路 100 号 1 层';
    return;
  }
  uni.showModal({
    title: `填写${label}`,
    editable: true,
    placeholderText: row.placeholder,
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

function onPick(slot: UploadSlot): void {
  uni.chooseImage({
    count: 1,
    success: (res) => {
      const files = res.tempFilePaths as string[];
      if (files.length) slot.path = files[0];
    },
    fail: () => toast(`未选择${slot.label}照片`),
  });
}

async function onNext(): Promise<void> {
  if (!data.value) return;
  if (!canNext.value) {
    toast('请先补齐店铺资料');
    return;
  }
  const res = await saveOnboardForm(data.value.rows);
  if (!res.ok) {
    toast(res.message);
    return;
  }
  push('/pages/onboarding/license/index');
}
</script>

<template>
  <view v-if="data" class="oa">
    <wf-nav-bar title="商家入驻" />

    <view class="oa__steps"><wf-steps :steps="data.steps" /></view>

    <scroll-view class="oa__body" scroll-y>
      <view class="card card--flat">
        <view v-for="r in data.rows" :key="r.key" class="cell tap" @tap="onRow(r.key, r.label)">
          <text class="cell__label">{{ r.label }}</text>
          <view class="cell__value">
            <text v-if="r.value" class="ellipsis oa__value">{{ r.value }}</text>
            <text v-else class="oa__placeholder"
              ><text v-if="r.key === 'address'">📍 </text>{{ r.placeholder }}</text
            >
            <text class="chevron">›</text>
          </view>
        </view>
      </view>

      <view class="card">
        <text class="t-section">资质上传</text>
        <view class="oa__slots">
          <wf-uploader
            v-for="s in data.slots"
            :key="s.key"
            :item="s"
            :height="180"
            @pick="onPick(s)"
          />
        </view>
      </view>

      <text class="oa__note">{{ data.noteText }}</text>
    </scroll-view>

    <view class="oa__foot">
      <view class="btn btn--primary tap" :class="{ 'btn--disabled': !canNext }" @tap="onNext"
        >下一步：上传资质</view
      >
    </view>
  </view>
</template>

<style lang="scss" scoped>
.oa {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.oa__steps {
  padding: 8rpx 40rpx 24rpx;
  flex-shrink: 0;
}

.oa__body {
  flex: 1;
  min-height: 0;
  padding: 0 32rpx;
}

.card {
  margin-bottom: 20rpx;
}

.oa__value {
  max-width: 360rpx;
}

.oa__placeholder {
  color: var(--c-text-placeholder);
}

.oa__slots {
  display: flex;
  gap: 20rpx;
}

.oa__note {
  display: block;
  font-size: 22rpx;
  color: var(--c-text-weaker);
  line-height: 1.7;
  padding: 4rpx 8rpx 20rpx;
}

.oa__foot {
  flex-shrink: 0;
  padding: 20rpx 32rpx calc(24rpx + constant(safe-area-inset-bottom));
  padding: 20rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
}
</style>
