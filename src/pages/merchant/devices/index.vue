<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { deviceAction, getDeviceSettings, updateDeviceSettings } from '@/services/api';
import { toast } from '@/utils/nav';
import type { DeviceSettings } from '@/models';

/** 97 · 打印机与设备：小票打印页上层，多设备状态、自动打印与语音播报 */
const settings = ref<DeviceSettings | null>(null);

onLoad(() => {
  load();
});

async function load(): Promise<void> {
  settings.value = await getDeviceSettings();
}

async function onDeviceAction(id: string): Promise<void> {
  const res = await deviceAction(id);
  toast(res.message);
  load();
}

async function onAutoPrint(on: boolean): Promise<void> {
  if (!settings.value) return;
  settings.value.autoPrint = on;
  await updateDeviceSettings({ autoPrint: on });
}

/** 打印份数 1–5 联，超出范围不提交 */
async function onCopies(delta: number): Promise<void> {
  if (!settings.value) return;
  const next = settings.value.copies + delta;
  if (next < 1 || next > 5) return;
  settings.value.copies = next;
  await updateDeviceSettings({ copies: next });
}

async function onVoice(on: boolean): Promise<void> {
  if (!settings.value) return;
  settings.value.voiceOn = on;
  await updateDeviceSettings({ voiceOn: on });
}

function onAdd(): void {
  toast('添加设备需在微信中连接蓝牙打印机');
}

function onRow(name: string): void {
  toast(`${name}接后端后开放`);
}
</script>

<template>
  <view v-if="settings" class="dv">
    <wf-nav-bar title="设备管理" right="＋ 添加" @righttap="onAdd" />

    <scroll-view class="dv__body" scroll-y>
      <view v-for="d in settings.devices" :key="d.id" class="card dv__device">
        <view class="row--between">
          <view class="flex1 col dv__device-text">
            <text class="dv__device-name">{{ d.name }}</text>
            <view class="row dv__device-status">
              <view class="dv__dot" :class="{ 'dv__dot--off': !d.online }" />
              <text class="dv__status-text" :class="{ 'dv__status-text--off': !d.online }">{{
                d.statusText
              }}</text>
            </view>
          </view>
          <view
            class="pill tap"
            :class="d.online ? 'pill--outline' : 'pill--outline-primary'"
            @tap="onDeviceAction(d.id)"
            >{{ d.actionText }}</view
          >
        </view>

        <!-- 自动打印与份数只挂在主打印机上 -->
        <template v-if="d.online && d.id === 'dev_1'">
          <view class="hairline" />
          <view class="dv__row">
            <view class="flex1 col dv__row-text">
              <text class="dv__row-name">新订单自动打印</text>
              <text class="dv__row-sub">接单后立即打印顾客单与厨房单</text>
            </view>
            <wf-toggle :on="settings.autoPrint" @change="onAutoPrint" />
          </view>
          <view class="hairline" />
          <view class="dv__row">
            <text class="dv__row-name flex1">打印份数</text>
            <wf-qty-stepper
              :qty="settings.copies"
              always-minus
              tone="soft"
              @plus="onCopies(1)"
              @minus="onCopies(-1)"
            />
          </view>
        </template>
      </view>

      <view class="card dv__other">
        <text class="t-section">其他设备</text>

        <view class="dv__row">
          <view class="flex1 col dv__row-text">
            <text class="dv__row-name">语音播报音箱</text>
            <text class="dv__row-sub">{{ settings.voiceText }}</text>
          </view>
          <wf-toggle :on="settings.voiceOn" @change="onVoice" />
        </view>
        <view class="hairline" />
        <view class="cell dv__cell tap" @tap="onRow('播报音量')">
          <text class="cell__label">播报音量</text>
          <view class="cell__value"
            ><text>{{ settings.volumeText }}</text
            ><text class="chevron">›</text></view
          >
        </view>
        <view class="hairline" />
        <view class="cell dv__cell tap" @tap="onRow('扫码枪接入')">
          <text class="cell__label">扫码枪</text>
          <view class="cell__value"
            ><text>{{ settings.scannerText }}</text
            ><text class="chevron">›</text></view
          >
        </view>
      </view>

      <text class="dv__note">{{ settings.noteText }}</text>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.dv {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dv__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx calc(40rpx + constant(safe-area-inset-bottom));
  padding: 20rpx 32rpx calc(40rpx + env(safe-area-inset-bottom));
}

.dv__device {
  margin-bottom: 20rpx;
}

.dv__device-text {
  gap: 8rpx;
}

.dv__device-name {
  font-size: 28rpx;
  font-weight: 800;
}

.dv__device-status {
  gap: 10rpx;
}

.dv__dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: var(--c-success);
}

.dv__dot--off {
  background: var(--c-danger);
}

.dv__status-text {
  font-size: 22rpx;
  color: var(--c-success-deep);
}

.dv__status-text--off {
  color: var(--c-danger);
}

.dv__other {
  margin-bottom: 20rpx;
}

.dv__row {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.dv__row-text {
  gap: 4rpx;
}

.dv__row-name {
  font-size: 27rpx;
  font-weight: 700;
}

.dv__row-sub {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.dv__cell {
  padding: 0;
}

.dv__note {
  display: block;
  font-size: 22rpx;
  color: var(--c-text-weaker);
  line-height: 1.7;
  padding: 4rpx 8rpx;
}
</style>
