<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import {
  getPrintSettings,
  getReceipt,
  printReceipt,
  updatePrintSettings,
} from '@/services/api';
import { push, toast } from '@/utils/nav';
import type { PrintSettings, ReceiptPreview, ReceiptType } from '@/models';

const COPY_OPTIONS = [
  { copies: 1, label: '1 联（仅后厨联）' },
  { copies: 2, label: '2 联（后厨联 + 顾客联）' },
  { copies: 3, label: '3 联（加打配送联）' },
];

const WIDTH_OPTIONS = ['58mm', '80mm'];

/**
 * 51 · 小票打印。
 * 设计稿画的是「打印设置 + 后厨联预览」，交付文档写的是「顾客单 / 厨房单预览与补打」，
 * 这里保留设计稿版式，预览区加「后厨联 / 顾客联」切换，底部加「补打小票（N 联）」。
 */
const TABS: { key: ReceiptType; label: string }[] = [
  { key: 'kitchen', label: '后厨联' },
  { key: 'customer', label: '顾客联' },
];

const settings = ref<PrintSettings | null>(null);
const receipt = ref<ReceiptPreview | null>(null);
const activeTab = ref<ReceiptType>('kitchen');
/** 无订单时只做打印设置，不展示补打 */
const hasOrder = ref(false);
let orderId = '';

onLoad((options) => {
  orderId = (options && options.orderId) || '';
  hasOrder.value = !!orderId;
});

onShow(async () => {
  settings.value = await getPrintSettings();
  await loadReceipt();
});

async function loadReceipt(): Promise<void> {
  if (!orderId) return;
  receipt.value = await getReceipt(orderId, activeTab.value);
}

function onSwitchTab(key: ReceiptType): void {
  if (key === activeTab.value) return;
  activeTab.value = key;
  loadReceipt();
}

async function onToggleAuto(on: boolean): Promise<void> {
  settings.value = await updatePrintSettings({ autoPrint: on });
  toast(on ? '接单后将自动打印后厨联' : '已关闭自动打印，注意手动补打');
}

async function onToggleRemark(on: boolean): Promise<void> {
  settings.value = await updatePrintSettings({ printRemark: on });
  await loadReceipt();
}

function onPickCopies(): void {
  uni.showActionSheet({
    itemList: COPY_OPTIONS.map((o) => o.label),
    success: async (res) => {
      settings.value = await updatePrintSettings({ copies: COPY_OPTIONS[res.tapIndex].copies });
    },
  });
}

function onPickWidth(): void {
  uni.showActionSheet({
    itemList: WIDTH_OPTIONS,
    success: async (res) => {
      settings.value = await updatePrintSettings({ width: WIDTH_OPTIONS[res.tapIndex] });
    },
  });
}

/** 右上角「测试打印」：不依赖订单，走设备自检 */
async function onTestPrint(): Promise<void> {
  if (!settings.value) return;
  if (!settings.value.device.online) {
    toast('打印机离线，请检查蓝牙连接');
    return;
  }
  if (!orderId) {
    toast(`已向${settings.value.device.name}发送测试页`);
    return;
  }
  const res = await printReceipt(orderId, activeTab.value);
  toast(res.message || '已发送测试页', res.ok ? 'success' : 'none');
}

/** 按「打印联数」一次性补打 */
async function onReprint(): Promise<void> {
  const res = await printReceipt(orderId);
  toast(res.message || (res.ok ? '已补打' : '补打失败'), res.ok ? 'success' : 'none');
}
</script>

<template>
  <view v-if="settings" class="pt">
    <wf-nav-bar title="打印设置" right="测试打印" @righttap="onTestPrint" />

    <scroll-view class="pt__body" scroll-y>
      <!-- 设备 -->
      <view class="card">
        <view class="pt__device tap" @tap="push('/pages/merchant/devices/index')">
          <view class="pt__device-icon">
            <wf-icon name="printer" :size="40" color="#FF4A17" />
          </view>
          <view class="flex1 col pt__device-text">
            <text class="pt__device-name">{{ settings.device.name }}</text>
            <text
              class="pt__device-status"
              :class="
                settings.device.online ? 'pt__device-status--on' : 'pt__device-status--off'
              "
              >● {{ settings.device.statusText }}</text
            >
          </view>
          <text class="pt__manage">管理 ›</text>
        </view>
      </view>

      <!-- 打印设置 -->
      <view class="card">
        <view class="pt__row">
          <view class="col pt__row-text">
            <text class="cell__label">自动打印</text>
            <text class="pt__row-sub">接单后立即打印后厨联</text>
          </view>
          <wf-toggle :on="settings.autoPrint" @change="onToggleAuto" />
        </view>
        <view class="hairline" />
        <view class="pt__row tap" @tap="onPickCopies">
          <view class="col pt__row-text">
            <text class="cell__label">打印联数</text>
            <text class="pt__row-sub">{{
              settings.copies > 1 ? '后厨联 + 顾客联' : '仅后厨联'
            }}</text>
          </view>
          <view class="cell__value">
            <text>{{ settings.copiesText }}</text>
            <text class="chevron">›</text>
          </view>
        </view>
        <view class="hairline" />
        <view class="pt__row tap" @tap="onPickWidth">
          <text class="cell__label">小票宽度</text>
          <view class="cell__value">
            <text>{{ settings.width }}</text>
            <text class="chevron">›</text>
          </view>
        </view>
        <view class="hairline" />
        <view class="pt__row">
          <text class="cell__label">打印菜品备注</text>
          <wf-toggle :on="settings.printRemark" @change="onToggleRemark" />
        </view>
      </view>

      <!-- 小票预览 -->
      <view v-if="hasOrder && receipt" class="card">
        <view class="row--between">
          <text class="t-section">小票预览</text>
          <view class="pt__tabs">
            <view
              v-for="t in TABS"
              :key="t.key"
              class="pt__tab"
              :class="{ 'pt__tab--on': activeTab === t.key }"
              @tap="onSwitchTab(t.key)"
              >{{ t.label }}</view
            >
          </view>
        </view>

        <view class="pt__paper">
          <text class="pt__paper-title">{{ receipt.title }}</text>
          <text class="pt__paper-meta">{{ receipt.meta }}</text>
          <view class="pt__dash" />
          <view v-for="(line, i) in receipt.lines" :key="i" class="pt__paper-line">
            <text class="flex1">{{ line.text }}</text>
            <text>{{ line.qty }}</text>
          </view>
          <template v-if="receipt.amounts.length">
            <view class="pt__dash" />
            <view v-for="a in receipt.amounts" :key="a.label" class="pt__paper-line">
              <text class="flex1">{{ a.label }}</text>
              <text>{{ a.value }}</text>
            </view>
          </template>
          <template v-if="receipt.remark">
            <view class="pt__dash" />
            <text class="pt__paper-remark">{{ receipt.remark }}</text>
          </template>
          <template v-if="receipt.footer">
            <view class="pt__dash" />
            <text class="pt__paper-footer">{{ receipt.footer }}</text>
          </template>
        </view>
      </view>

      <view v-else-if="!hasOrder" class="card pt__hint">
        <text class="empty__text">从订单详情进入可预览并补打该单小票</text>
      </view>

      <view class="pt__foot" />
    </scroll-view>

    <view v-if="hasOrder" class="pt__bar">
      <view class="btn btn--primary tap" @tap="onReprint"
        >补打小票（{{ settings.copiesText }}）</view
      >
    </view>
  </view>
</template>

<style lang="scss" scoped>
.pt {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pt__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx 0;
}

.card {
  margin-bottom: 20rpx;
}

/* 设备 */
.pt__device {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.pt__device-icon {
  width: 84rpx;
  height: 84rpx;
  border-radius: 24rpx;
  background: var(--c-primary-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pt__device-text {
  gap: 4rpx;
}

.pt__device-name {
  font-size: 28rpx;
  font-weight: 800;
}

.pt__device-status {
  font-size: 22rpx;
  font-weight: 700;
}

.pt__device-status--on {
  color: var(--c-success);
}

.pt__device-status--off {
  color: var(--c-danger);
}

.pt__manage {
  font-size: 23rpx;
  color: var(--c-text-weak);
  font-weight: 700;
}

/* 设置行 */
.pt__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.pt__row-text {
  gap: 4rpx;
}

.pt__row-sub {
  font-size: 21rpx;
  color: var(--c-text-weaker);
}

/* 预览切换 */
.pt__tabs {
  display: flex;
  background: var(--c-fill-3);
  border-radius: 20rpx;
  padding: 4rpx;
}

.pt__tab {
  font-size: 22rpx;
  color: #7a7168;
  padding: 10rpx 22rpx;
  border-radius: 16rpx;
}

.pt__tab--on {
  background: #ffffff;
  color: var(--c-text);
  font-weight: 800;
  box-shadow: 0 2rpx 8rpx rgba(32, 22, 15, 0.06);
}

/* 纸样 */
.pt__paper {
  background: #fbf9f6;
  border: 1px dashed #ddd3c8;
  border-radius: 20rpx;
  padding: 28rpx;
  font-family: ui-monospace, Menlo, monospace;
  font-size: 22rpx;
  color: #3d342c;
  line-height: 1.9;
  display: flex;
  flex-direction: column;
}

.pt__paper-title {
  text-align: center;
  font-weight: 800;
  font-size: 26rpx;
}

.pt__paper-meta {
  text-align: center;
}

.pt__dash {
  border-top: 1px dashed #ddd3c8;
  margin: 16rpx 0;
}

.pt__paper-line {
  display: flex;
  justify-content: space-between;
  gap: 16rpx;
}

.pt__paper-remark,
.pt__paper-footer {
  white-space: pre-line;
}

.pt__paper-footer {
  text-align: center;
}

.pt__hint {
  align-items: center;
}

.pt__foot {
  height: 24rpx;
}

/* 底部补打 */
.pt__bar {
  flex-shrink: 0;
  background: #ffffff;
  border-top: 1px solid var(--c-img-placeholder);
  padding: 24rpx 32rpx;
  padding-bottom: calc(28rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(28rpx + env(safe-area-inset-bottom));
}
</style>
