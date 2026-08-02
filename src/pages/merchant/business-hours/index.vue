<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getBusinessSettings, saveBusinessSettings } from '@/services/api';
import { back, toast } from '@/utils/nav';
import type { BusinessSettings } from '@/models';

/** 50 · 营业设置：营业时段、每周休息日、接单模式与紧急打烊 */
const WEEK = ['一', '二', '三', '四', '五', '六', '日'];
const data = ref<BusinessSettings | null>(null);

onLoad(async () => {
  data.value = await getBusinessSettings();
});

function onToggleOpen(on: boolean): void {
  if (!data.value) return;
  data.value.open = on;
  data.value.openText = on ? '当前状态 · 营业中' : '当前状态 · 休息中';
  data.value.openSub = on ? '顾客可正常下单' : '顾客端展示「今日休息」并关闭下单';
}

function onRestDay(i: number): void {
  if (!data.value) return;
  const days = data.value.restDays;
  data.value.restDays = days.indexOf(i) >= 0 ? days.filter((d) => d !== i) : [...days, i];
}

function onEditSlot(id: string): void {
  const slot = data.value?.slots.find((s) => s.id === id);
  if (slot) toast(`修改「${slot.name}」时段接后端后开放`);
}

function onAddSlot(): void {
  if (!data.value) return;
  data.value.slots.push({
    id: `sl_${Date.now()}`,
    name: `时段${data.value.slots.length + 1}`,
    start: '09:00',
    end: '21:00',
  });
}

/** 紧急打烊只停新单，已接订单照常出餐 */
function onEmergencyClose(): void {
  uni.showModal({
    title: '临时停止接单？',
    content: '已接订单不受影响，顾客端将无法下新单',
    confirmColor: '#D14343',
    success: (res) => {
      if (!res.confirm) return;
      onToggleOpen(false);
      toast('已临时停止接单');
    },
  });
}

async function onSave(): Promise<void> {
  if (!data.value) return;
  const res = await saveBusinessSettings(data.value);
  toast(res.message);
  if (res.ok) setTimeout(() => back(), 700);
}
</script>

<template>
  <view v-if="data" class="bh">
    <wf-nav-bar title="营业设置" right="保存" @righttap="onSave" />

    <scroll-view class="bh__body" scroll-y>
      <view class="card">
        <view class="bh__status">
          <view class="flex1 col bh__status-text">
            <text class="bh__status-title">{{ data.openText }}</text>
            <text class="bh__status-sub">{{ data.openSub }}</text>
          </view>
          <wf-toggle :on="data.open" @change="onToggleOpen" />
        </view>
      </view>

      <view class="card">
        <text class="t-section">营业时段</text>
        <view v-for="s in data.slots" :key="s.id" class="bh__slot tap" @tap="onEditSlot(s.id)">
          <text class="bh__slot-name">{{ s.name }}</text>
          <text class="bh__slot-time flex1">{{ s.start }} — {{ s.end }}</text>
          <text class="bh__slot-edit">✎</text>
        </view>
        <text class="bh__add tap-sm" @tap="onAddSlot">＋ 添加时段</text>
      </view>

      <view class="card">
        <text class="t-section">每周休息日</text>
        <view class="bh__week">
          <view
            v-for="(w, i) in WEEK"
            :key="w"
            class="bh__day tap-sm"
            :class="{ 'bh__day--on': data.restDays.indexOf(i) >= 0 }"
            @tap="onRestDay(i)"
            >{{ w }}</view
          >
        </view>
        <text class="bh__hint">{{ data.noteText }}</text>
      </view>

      <view class="card card--flat">
        <view class="cell tap" @tap="toast('接单模式接后端后开放')">
          <view class="col bh__cell-text">
            <text class="cell__label">接单模式</text>
            <text class="bh__cell-sub">超时未接自动转人工</text>
          </view>
          <view class="cell__value"
            ><text>{{ data.autoAcceptText }}</text
            ><text class="chevron">›</text></view
          >
        </view>
        <view class="cell tap" @tap="toast('出餐时长接后端后开放')">
          <text class="cell__label">预计出餐时长</text>
          <view class="cell__value"
            ><text>{{ data.cookMinutesText }}</text
            ><text class="chevron">›</text></view
          >
        </view>
        <view class="cell tap" @tap="onEmergencyClose">
          <view class="col bh__cell-text">
            <text class="cell__label bh__danger">紧急打烊</text>
            <text class="bh__cell-sub">已接订单不受影响</text>
          </view>
          <view class="cell__value"><text>临时停止接单</text><text class="chevron">›</text></view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.bh {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.bh__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx calc(40rpx + constant(safe-area-inset-bottom));
  padding: 20rpx 32rpx calc(40rpx + env(safe-area-inset-bottom));
}

.bh__body > .card {
  margin-bottom: 20rpx;
}

.bh__status {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.bh__status-text {
  gap: 6rpx;
}

.bh__status-title {
  font-size: 29rpx;
  font-weight: 800;
}

.bh__status-sub {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.bh__slot {
  background: #f7f4ef;
  border-radius: 24rpx;
  padding: 24rpx 28rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.bh__slot-name {
  font-size: 24rpx;
  color: var(--c-text-weak);
}

.bh__slot-time {
  font-size: 28rpx;
  font-weight: 800;
  text-align: center;
}

.bh__slot-edit {
  font-size: 24rpx;
  color: var(--c-text-placeholder-2);
}

.bh__add {
  font-size: 23rpx;
  font-weight: 700;
  color: var(--c-primary);
}

.bh__week {
  display: flex;
  gap: 16rpx;
}

.bh__day {
  flex: 1;
  height: 72rpx;
  border-radius: 24rpx;
  background: var(--c-fill-3);
  color: var(--c-text-2);
  font-size: 25rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bh__day--on {
  background: var(--c-primary);
  color: #fff;
}

.bh__hint {
  font-size: 22rpx;
  color: var(--c-text-weaker);
  line-height: 1.6;
}

.bh__cell-text {
  gap: 4rpx;
}

.bh__cell-sub {
  font-size: 21rpx;
  color: var(--c-text-weaker);
}

.bh__danger {
  color: var(--c-danger);
}
</style>
