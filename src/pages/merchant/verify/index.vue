<script setup lang="ts">
import { ref, watch } from 'vue';
import { getVerifyPreview, verifyPickupCode } from '@/services/api';
import { back, toast } from '@/utils/nav';
import type { VerifyPreview } from '@/models';

/**
 * 21 · 核销取餐码。
 * 扫码 + 手输双通道；输入满 4 位就拉订单预览，让店员核对后再确认，防错核。
 * 取景框不引位图（交付文档 Assets 说明设计稿无位图素材），用深色底 + 四角框线 + 扫描线还原。
 */
const code = ref('');
const preview = ref<VerifyPreview | null>(null);

watch(code, async (val) => {
  if (val.length < 4) {
    preview.value = null;
    return;
  }
  preview.value = await getVerifyPreview(val);
  if (!preview.value) toast('取餐码不存在或已核销');
});

function onInput(e: Event): void {
  // uni-app 的 input 事件在类型上是 DOM Event，取值要走 detail
  const val = (e as unknown as { detail: { value: string } }).detail.value;
  code.value = val.toUpperCase().slice(0, 4);
}

function onScan(): void {
  uni.scanCode({
    success: (res) => {
      code.value = String(res.result || '').toUpperCase().slice(0, 4);
    },
    fail: () => toast('已取消扫码'),
  });
}

async function onConfirm(): Promise<void> {
  if (!preview.value) {
    toast('请先输入或扫描取餐码');
    return;
  }
  const res = await verifyPickupCode(code.value);
  toast(res.message);
  if (res.ok) setTimeout(() => back(), 700);
}
</script>

<template>
  <view class="vf">
    <wf-nav-bar title="核销取餐码" theme="dark" />

    <view class="vf__body">
      <!-- 扫码取景框 -->
      <view class="vf__scan tap" @tap="onScan">
        <view class="vf__corner vf__corner--tl" />
        <view class="vf__corner vf__corner--tr" />
        <view class="vf__corner vf__corner--bl" />
        <view class="vf__corner vf__corner--br" />
        <view class="vf__line" />
        <wf-icon name="scan" :size="96" color="rgba(255,255,255,.35)" :weight="1.6" />
      </view>
      <text class="vf__tip">对准顾客出示的取餐二维码</text>

      <view class="vf__divider">
        <view class="vf__divider-line" />
        <text class="vf__divider-text">或手动输入 4 位取餐码</text>
        <view class="vf__divider-line" />
      </view>

      <!-- 4 位方格：真实 input 透明覆盖在上面 -->
      <view class="vf__code">
        <view
          v-for="i in 4"
          :key="i"
          class="vf__cell"
          :class="{ 'vf__cell--on': code.length === i - 1 }"
          >{{ code[i - 1] || '' }}</view
        >
        <input
          class="vf__input"
          :value="code"
          maxlength="4"
          placeholder=""
          @input="onInput"
        />
      </view>

      <!-- 订单预览：输满 4 位才出现 -->
      <view v-if="preview" class="vf__preview">
        <text class="vf__preview-title">{{ preview.orderNo }} · {{ preview.customer }}</text>
        <text class="vf__preview-sub">{{ preview.itemsText }} · ¥{{ preview.amountText }}</text>
      </view>
    </view>

    <view class="vf__foot">
      <view
        class="btn btn--primary tap"
        :class="{ 'btn--disabled': !preview }"
        @tap="onConfirm"
        >确认核销</view
      >
    </view>
  </view>
</template>

<style lang="scss" scoped>
.vf {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #2a2019;
}

.vf__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 64rpx 0;
  gap: 48rpx;
}

.vf__scan {
  width: 500rpx;
  height: 500rpx;
  border-radius: 48rpx;
  background: rgba(255, 255, 255, 0.06);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.vf__corner {
  position: absolute;
  width: 72rpx;
  height: 72rpx;
}

.vf__corner--tl {
  top: 0;
  left: 0;
  border-top: 7rpx solid #ff7b1c;
  border-left: 7rpx solid #ff7b1c;
  border-radius: 28rpx 0 0 0;
}

.vf__corner--tr {
  top: 0;
  right: 0;
  border-top: 7rpx solid #ff7b1c;
  border-right: 7rpx solid #ff7b1c;
  border-radius: 0 28rpx 0 0;
}

.vf__corner--bl {
  bottom: 0;
  left: 0;
  border-bottom: 7rpx solid #ff7b1c;
  border-left: 7rpx solid #ff7b1c;
  border-radius: 0 0 0 28rpx;
}

.vf__corner--br {
  bottom: 0;
  right: 0;
  border-bottom: 7rpx solid #ff7b1c;
  border-right: 7rpx solid #ff7b1c;
  border-radius: 0 0 28rpx 0;
}

.vf__line {
  position: absolute;
  left: 32rpx;
  right: 32rpx;
  top: 236rpx;
  height: 5rpx;
  background: linear-gradient(90deg, transparent, #ff7b1c, transparent);
  box-shadow: 0 0 28rpx #ff7b1c;
}

.vf__tip {
  font-size: 25rpx;
  color: rgba(255, 255, 255, 0.65);
}

.vf__divider {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.vf__divider-line {
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.15);
}

.vf__divider-text {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.45);
}

.vf__code {
  display: flex;
  gap: 24rpx;
  position: relative;
}

.vf__cell {
  width: 104rpx;
  height: 124rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.1);
  border: 3rpx solid rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 48rpx;
  font-weight: 800;
}

.vf__cell--on {
  border-color: #ff7b1c;
}

.vf__input {
  position: absolute;
  inset: 0;
  opacity: 0;
  width: 100%;
  height: 100%;
}

.vf__preview {
  width: 100%;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 28rpx;
  padding: 28rpx 32rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.vf__preview-title {
  font-size: 28rpx;
  font-weight: 800;
  color: #fff;
}

.vf__preview-sub {
  font-size: 23rpx;
  color: rgba(255, 255, 255, 0.65);
}

.vf__foot {
  flex-shrink: 0;
  padding: 24rpx 64rpx calc(32rpx + constant(safe-area-inset-bottom));
  padding: 24rpx 64rpx calc(32rpx + env(safe-area-inset-bottom));
}
</style>
