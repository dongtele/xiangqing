<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getOnboardLicense, submitOnboard, uploadOnboardSlot } from '@/services/api';
import { back, replace, toast } from '@/utils/nav';
import type { OnboardLicense, UploadSlot } from '@/models';

/**
 * 27 · 上传资质（第 2 步）。
 * 营业执照走 OCR 自动识别，减少手填；必传项没齐时提交按钮置灰。
 */
const data = ref<OnboardLicense | null>(null);

const canSubmit = computed(
  () => !!data.value && data.value.slots.filter((s) => s.required).every((s) => !!s.path)
);

/** 身份证人像面 / 国徽面并排，其余单列 */
const singleSlots = computed(() =>
  data.value ? data.value.slots.filter((s) => s.key !== 'idFront' && s.key !== 'idBack') : []
);
const idSlots = computed(() =>
  data.value ? data.value.slots.filter((s) => s.key === 'idFront' || s.key === 'idBack') : []
);

onLoad(async () => {
  data.value = await getOnboardLicense();
});

function onPick(slot: UploadSlot): void {
  uni.chooseImage({
    count: 1,
    success: async (res) => {
      const files = res.tempFilePaths as string[];
      const out = await uploadOnboardSlot(slot.key, files[0] || 'uploaded');
      toast(out.message);
      if (out.ok) data.value = await getOnboardLicense();
    },
    fail: () => toast('未选择照片'),
  });
}

async function onSubmit(): Promise<void> {
  if (!canSubmit.value) {
    toast('还有必传资质未上传');
    return;
  }
  const res = await submitOnboard();
  toast(res.message);
  if (res.ok) setTimeout(() => replace('/pages/onboarding/audit/index'), 700);
}
</script>

<template>
  <view v-if="data" class="ol">
    <wf-nav-bar title="商家入驻" />

    <view class="ol__steps"><wf-steps :steps="data.steps" /></view>

    <scroll-view class="ol__body" scroll-y>
      <view v-for="s in singleSlots" :key="s.key" class="card">
        <wf-uploader :item="s" :height="220" @pick="onPick(s)" />
      </view>

      <view v-if="idSlots.length" class="card">
        <view class="ol__id-head">
          <text class="ol__id-label">法人身份证</text>
          <text class="ol__id-req">*</text>
        </view>
        <view class="ol__id-slots">
          <wf-uploader
            v-for="s in idSlots"
            :key="s.key"
            :item="s"
            :height="180"
            @pick="onPick(s)"
          />
        </view>
      </view>

      <text class="ol__note">{{ data.noteText }}</text>
    </scroll-view>

    <view class="ol__foot">
      <view class="btn btn--ghost tap" @tap="back()">上一步</view>
      <view
        class="btn btn--primary tap"
        :class="{ 'btn--disabled': !canSubmit }"
        @tap="onSubmit"
        >提交审核</view
      >
    </view>
  </view>
</template>

<style lang="scss" scoped>
.ol {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ol__steps {
  padding: 8rpx 40rpx 24rpx;
  flex-shrink: 0;
}

.ol__body {
  flex: 1;
  min-height: 0;
  padding: 0 32rpx;
}

.card {
  margin-bottom: 20rpx;
}

.ol__id-head {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.ol__id-label {
  font-size: 27rpx;
  font-weight: 700;
}

.ol__id-req {
  color: var(--c-danger);
  font-size: 24rpx;
  font-weight: 800;
}

.ol__id-slots {
  display: flex;
  gap: 20rpx;
}

.ol__note {
  display: block;
  font-size: 22rpx;
  color: var(--c-text-weaker);
  line-height: 1.7;
  padding: 4rpx 8rpx 20rpx;
}

.ol__foot {
  flex-shrink: 0;
  display: flex;
  gap: 20rpx;
  padding: 20rpx 32rpx calc(24rpx + constant(safe-area-inset-bottom));
  padding: 20rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
}

.ol__foot .btn {
  flex: 1;
}
</style>
