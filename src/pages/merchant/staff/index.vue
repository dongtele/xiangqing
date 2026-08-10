<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getStaff, inviteStaff } from '@/services/api';
import { push, toast } from '@/utils/nav';
import type { Staff, StaffRoleDoc } from '@/models';

/**
 * 35 · 员工账号。
 * 三档角色权限逐级收窄：收银与后厨都碰不到资金与价格，避免小店把老板账号直接给店员用。
 */
const list = ref<Staff[]>([]);
const roleDocs = ref<StaffRoleDoc[]>([]);

onShow(() => {
  load();
});

async function load(): Promise<void> {
  const res = await getStaff();
  list.value = res.list;
  roleDocs.value = res.roleDocs;
}

function onStaff(s: Staff): void {
  if (s.self) {
    toast('店长本人的权限不可修改');
    return;
  }
  push(`/pages/merchant/staff-permission/index?id=${s.id}`);
}

async function onInvite(): Promise<void> {
  const res = await inviteStaff();
  toast(res.message);
}
</script>

<template>
  <view class="sf">
    <wf-nav-bar title="员工账号" />

    <scroll-view class="sf__body" scroll-y>
      <view class="card card--flat">
        <view v-for="s in list" :key="s.id" class="sf__row tap" @tap="onStaff(s)">
          <view class="sf__avatar" :class="`sf__avatar--${s.role}`">{{ s.name.slice(0, 1) }}</view>
          <view class="flex1 col sf__text">
            <view class="row sf__name-row">
              <text class="sf__name">{{ s.name }}</text>
              <text class="tag tag--grey">{{ s.roleText }}</text>
            </view>
            <text class="sf__meta">{{ s.metaText }}</text>
          </view>
          <text v-if="!s.self" class="chevron">›</text>
        </view>
      </view>

      <view class="card">
        <text class="t-section">角色权限说明</text>
        <view v-for="d in roleDocs" :key="d.role" class="sf__doc">
          <text class="sf__doc-label">{{ d.label }}</text>
          <text class="sf__doc-desc flex1">{{ d.desc }}</text>
        </view>
      </view>

      <text class="sf__note"
        >通过微信邀请加入：员工用自己微信登录本小程序即进入对应权限的工作台。</text
      >
    </scroll-view>

    <view class="sf__foot">
      <view class="btn btn--primary tap" @tap="onInvite">＋ 微信邀请新员工</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.sf {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sf__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx 0;
}

.card {
  margin-bottom: 20rpx;
}

.sf__row {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 28rpx 32rpx;
}

.sf__row + .sf__row {
  border-top: 1px solid #f7f3ee;
}

.sf__avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: var(--c-primary-bg);
  color: var(--c-primary);
  font-size: 30rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sf__avatar--cashier {
  background: var(--c-success-bg-2);
  color: var(--c-success-deep);
}

.sf__avatar--kitchen {
  background: var(--c-fill-3);
  color: var(--c-text-weak);
}

.sf__text {
  gap: 8rpx;
}

.sf__name-row {
  gap: 16rpx;
}

.sf__name {
  font-size: 28rpx;
  font-weight: 800;
}

.sf__meta {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.sf__doc {
  display: flex;
  gap: 20rpx;
}

.sf__doc-label {
  font-size: 25rpx;
  font-weight: 800;
  width: 80rpx;
  flex-shrink: 0;
}

.sf__doc-desc {
  font-size: 23rpx;
  color: var(--c-text-weak);
  line-height: 1.7;
}

.sf__note {
  display: block;
  font-size: 22rpx;
  color: var(--c-text-weaker);
  line-height: 1.7;
  padding: 4rpx 8rpx 20rpx;
}

.sf__foot {
  flex-shrink: 0;
  padding: 20rpx 32rpx calc(24rpx + constant(safe-area-inset-bottom));
  padding: 20rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
}
</style>
