<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getOnboardAudit, withdrawOnboard } from '@/services/api';
import { push, relaunch, toast } from '@/utils/nav';
import type { OnboardAudit } from '@/models';

/**
 * 24 · 入驻审核状态：14/27 提交后的落地页。
 * 三段时间轴可追踪；被驳回时跳 28 逐项修改。
 */
const data = ref<OnboardAudit | null>(null);

onLoad(async () => {
  const res = await getOnboardAudit();
  if (res.state === 'rejected') {
    push('/pages/onboarding/rejected/index');
    return;
  }
  data.value = res;
});

function onWithdraw(): void {
  uni.showModal({
    title: '撤回修改？',
    content: '撤回后需重新提交，审核时间重新计算',
    confirmColor: '#FF4A17',
    success: async (res) => {
      if (!res.confirm) return;
      const out = await withdrawOnboard();
      toast(out.message);
      if (out.ok) push('/pages/onboarding/apply/index');
    },
  });
}
</script>

<template>
  <view v-if="data" class="oa">
    <wf-nav-bar title="审核进度" />

    <scroll-view class="oa__body" scroll-y>
      <view class="oa__hero">
        <view class="oa__spinner">
          <wf-icon name="clock" :size="56" color="#FF4A17" :weight="1.9" />
        </view>
        <text class="oa__title">{{ data.statusTitle }}</text>
        <text class="oa__sub"
          >{{ data.statusSub }} <text class="oa__eta">{{ data.etaText }}</text> 完成审核</text
        >
        <text class="oa__note">{{ data.noteText }}</text>
      </view>

      <view class="card">
        <view v-for="(n, i) in data.nodes" :key="n.title" class="oa__node">
          <view class="oa__rail">
            <view class="oa__dot" :class="`oa__dot--${n.state}`">
              <text v-if="n.state === 'done'" class="oa__dot-tick">✓</text>
            </view>
            <view v-if="i < data.nodes.length - 1" class="oa__line" />
          </view>
          <view class="flex1 col oa__node-text">
            <text class="oa__node-title" :class="{ 'oa__node-title--on': n.state !== 'todo' }">{{
              n.title
            }}</text>
            <text class="oa__node-desc">{{ n.desc }}</text>
          </view>
        </view>
      </view>

      <view class="card card--flat">
        <view class="cell tap" @tap="onWithdraw">
          <text class="cell__label">提交的资料</text>
          <view class="cell__value"><text>查看 / 撤回修改</text><text class="chevron">›</text></view>
        </view>
      </view>
    </scroll-view>

    <view class="oa__foot">
      <view class="btn btn--ghost tap" @tap="relaunch('/pages/customer/menu/index')"
        >先去逛逛，等通知</view
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

.oa__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx 0;
}

.oa__body > .card {
  margin-bottom: 20rpx;
}

.oa__hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  padding: 40rpx 32rpx 48rpx;
}

.oa__spinner {
  width: 132rpx;
  height: 132rpx;
  border-radius: 50%;
  background: var(--c-primary-bg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.oa__title {
  font-size: 38rpx;
  font-weight: 800;
}

.oa__sub {
  font-size: 24rpx;
  color: var(--c-text-weak);
}

.oa__eta {
  color: var(--c-primary);
  font-weight: 800;
}

.oa__note {
  font-size: 22rpx;
  color: var(--c-text-placeholder);
}

.oa__node {
  display: flex;
  gap: 24rpx;
}

.oa__rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.oa__dot {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background: var(--c-fill-3);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.oa__dot--done {
  background: var(--c-success);
}

.oa__dot--active {
  background: var(--c-primary);
  box-shadow: 0 0 0 8rpx var(--c-primary-bg);
}

.oa__dot-tick {
  color: #fff;
  font-size: 22rpx;
  font-weight: 800;
}

.oa__line {
  flex: 1;
  width: 3rpx;
  background: var(--c-line-2);
  margin: 8rpx 0;
  min-height: 40rpx;
}

.oa__node-text {
  gap: 6rpx;
  padding-bottom: 28rpx;
}

.oa__node-title {
  font-size: 27rpx;
  font-weight: 700;
  color: var(--c-text-weaker);
}

.oa__node-title--on {
  color: var(--c-text);
  font-weight: 800;
}

.oa__node-desc {
  font-size: 22rpx;
  color: var(--c-text-weaker);
  line-height: 1.6;
}

.oa__foot {
  flex-shrink: 0;
  padding: 20rpx 32rpx calc(24rpx + constant(safe-area-inset-bottom));
  padding: 20rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
}
</style>
