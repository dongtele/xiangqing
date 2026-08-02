<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getMemberCenter, signIn } from '@/services/api';
import { push, relaunch, toast } from '@/utils/nav';
import type { MemberCenter } from '@/models';

/** 80 · 会员积分中心：等级卡 + 每日任务 + 兑换三段结构 */
const data = ref<MemberCenter | null>(null);

onShow(() => {
  load();
});

async function load(): Promise<void> {
  data.value = await getMemberCenter();
}

async function onTask(key: string): Promise<void> {
  if (key === 'signin') {
    const res = await signIn();
    toast(res.message);
    if (res.ok) load();
    return;
  }
  if (key === 'order') {
    relaunch('/pages/customer/menu/index');
    return;
  }
  if (key === 'comment') {
    push('/pages/customer/my-reviews/index');
  }
}

function onRow(key: string): void {
  if (key === 'mall') {
    push('/pages/customer/points-mall/index');
    return;
  }
  if (key === 'log') {
    toast('积分明细接后端后开放');
    return;
  }
  toast('7月31日前用掉即可，去积分兑换看看');
}

function onRights(): void {
  toast('等级权益说明接后端后开放');
}
</script>

<template>
  <view v-if="data" class="pt">
    <wf-nav-bar title="会员中心" />

    <scroll-view class="pt__body" scroll-y>
      <!-- 等级卡 -->
      <view class="pt__card">
        <view class="row--between">
          <view class="row pt__level">
            <text class="pt__level-name">{{ data.levelName }}</text>
            <text class="pt__level-tag">{{ data.levelText }}</text>
          </view>
          <text class="pt__rights tap-sm" @tap="onRights">权益说明 ›</text>
        </view>

        <view class="pt__points">
          <text class="pt__points-num">{{ data.pointsText }}</text>
          <text class="pt__points-label">可用积分</text>
        </view>

        <view class="col pt__progress">
          <view class="pt__bar">
            <view class="pt__bar-fill" :style="{ width: data.progress + '%' }" />
          </view>
          <text class="pt__upgrade">{{ data.upgradeText }}</text>
        </view>
      </view>

      <!-- 每日任务 -->
      <view class="card">
        <view class="row--between">
          <text class="t-section">每日任务</text>
          <text class="t-sub">{{ data.todayText }}</text>
        </view>
        <view v-for="(t, i) in data.tasks" :key="t.key" class="col">
          <view v-if="i" class="hairline pt__task-line" />
          <view class="pt__task">
            <view class="flex1 col pt__task-text">
              <text class="pt__task-name">{{ t.name }}</text>
              <text class="pt__task-sub">{{ t.sub }}</text>
            </view>
            <view
              class="pt__task-btn tap-sm"
              :class="{ 'pt__task-btn--done': t.done }"
              @tap="!t.done && onTask(t.key)"
              >{{ t.btnText }}</view
            >
          </view>
        </view>
      </view>

      <!-- 兑换 / 明细 / 过期 -->
      <view class="card card--flat">
        <view v-for="r in data.rows" :key="r.key" class="cell tap" @tap="onRow(r.key)">
          <text class="cell__label">{{ r.label }}</text>
          <view class="cell__value">
            <text :class="{ 'pt__row-primary': r.tone === 'primary' }">{{ r.value }}</text>
            <text v-if="r.key !== 'expiring'" class="chevron">›</text>
          </view>
        </view>
      </view>
    </scroll-view>
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
  padding: 20rpx 32rpx calc(40rpx + constant(safe-area-inset-bottom));
  padding: 20rpx 32rpx calc(40rpx + env(safe-area-inset-bottom));
}

.pt__body > .card {
  margin-bottom: 20rpx;
}

.pt__card {
  background: var(--grad-dark);
  border-radius: 40rpx;
  padding: 36rpx;
  display: flex;
  flex-direction: column;
  gap: 28rpx;
  color: #fff;
  margin-bottom: 20rpx;
}

.pt__level {
  gap: 16rpx;
}

.pt__level-name {
  font-size: 30rpx;
  font-weight: 800;
}

.pt__level-tag {
  font-size: 20rpx;
  font-weight: 800;
  background: rgba(255, 176, 32, 0.22);
  color: #ffc85c;
  padding: 4rpx 16rpx;
  border-radius: 12rpx;
}

.pt__rights {
  font-size: 23rpx;
  color: rgba(255, 255, 255, 0.72);
}

.pt__points {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
}

.pt__points-num {
  font-size: 68rpx;
  font-weight: 800;
  letter-spacing: -1rpx;
  line-height: 1;
}

.pt__points-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.72);
}

.pt__progress {
  gap: 12rpx;
}

.pt__bar {
  height: 12rpx;
  border-radius: 6rpx;
  background: rgba(255, 255, 255, 0.16);
  overflow: hidden;
}

.pt__bar-fill {
  height: 100%;
  border-radius: 6rpx;
  background: linear-gradient(90deg, #ffc85c, #ff7b1c);
}

.pt__upgrade {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.72);
}

.pt__task-line {
  margin-bottom: 20rpx;
}

.pt__task {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.pt__task-text {
  gap: 4rpx;
}

.pt__task-name {
  font-size: 26rpx;
  font-weight: 700;
}

.pt__task-sub {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.pt__task-btn {
  background: var(--c-primary);
  color: #fff;
  font-size: 23rpx;
  font-weight: 800;
  padding: 12rpx 28rpx;
  border-radius: 28rpx;
  flex-shrink: 0;
}

.pt__task-btn--done {
  background: var(--c-fill-3);
  color: var(--c-text-weaker);
}

.pt__row-primary {
  color: var(--c-primary);
  font-weight: 700;
}
</style>
