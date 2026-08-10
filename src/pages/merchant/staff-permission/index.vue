<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getStaffPermission, removeStaff, saveStaffPermission } from '@/services/api';
import { back, toast } from '@/utils/nav';
import type { StaffPermission, StaffRole } from '@/models';

/** 69 · 员工权限设置：角色模板 + 细分权限开关，从 35 点某个员工进入 */
const data = ref<StaffPermission | null>(null);
let staffId = '';

/** 选角色模板会把细分开关重置成该角色的默认组合 */
const ROLE_DEFAULTS: Record<StaffRole, string[]> = {
  owner: ['accept', 'stock', 'goods', 'promo', 'stats', 'settle'],
  cashier: ['accept', 'stock'],
  kitchen: ['accept'],
};

onLoad(async (o) => {
  staffId = (o && o.id) || '';
  const res = await getStaffPermission(staffId);
  if (!res) {
    toast('员工不存在');
    return;
  }
  data.value = res;
});

function onRole(key: StaffRole): void {
  if (!data.value) return;
  data.value.staff = { ...data.value.staff, role: key };
  const allowed = ROLE_DEFAULTS[key];
  data.value.permissions = data.value.permissions.map((p) => ({
    ...p,
    on: allowed.indexOf(p.key) >= 0,
  }));
}

function onPermission(key: string, on: boolean): void {
  const p = data.value?.permissions.find((x) => x.key === key);
  if (p) p.on = on;
}

async function onSave(): Promise<void> {
  if (!data.value) return;
  const res = await saveStaffPermission(staffId, data.value.staff.role, data.value.permissions);
  toast(res.message);
  if (res.ok) setTimeout(() => back(), 700);
}

function onRemove(): void {
  uni.showModal({
    title: '移除该员工？',
    content: '移除后该微信将无法再进入本店工作台',
    confirmColor: '#D14343',
    success: async (res) => {
      if (!res.confirm) return;
      const out = await removeStaff(staffId);
      toast(out.message);
      if (out.ok) setTimeout(() => back(), 700);
    },
  });
}
</script>

<template>
  <view v-if="data" class="sp">
    <wf-nav-bar title="员工权限" right="保存" @righttap="onSave" />

    <scroll-view class="sp__body" scroll-y>
      <view class="card sp__who">
        <view class="sp__avatar">{{ data.staff.name.slice(0, 1) }}</view>
        <view class="flex1 col sp__who-text">
          <text class="sp__name">{{ data.staff.name }}</text>
          <text class="sp__joined">{{ data.joinedText }}</text>
        </view>
        <text class="tag tag--grey">{{ data.staff.roleText }}</text>
      </view>

      <view class="card">
        <text class="t-section">角色模板</text>
        <view class="sp__roles">
          <view
            v-for="r in data.roles"
            :key="r.key"
            class="sp__role tap-sm"
            :class="{ 'sp__role--on': data.staff.role === r.key }"
            @tap="onRole(r.key)"
            >{{ r.label }}</view
          >
        </view>
      </view>

      <view class="card">
        <text class="t-section">功能权限</text>
        <view v-for="(p, i) in data.permissions" :key="p.key" class="col">
          <view v-if="i" class="hairline sp__line" />
          <view class="sp__perm">
            <text class="sp__perm-label flex1">{{ p.label }}</text>
            <wf-toggle :on="p.on" @change="onPermission(p.key, $event)" />
          </view>
        </view>
      </view>

      <view class="card sp__remove tap" @tap="onRemove">
        <text class="sp__remove-text">移除该员工</text>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.sp {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sp__body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx calc(40rpx + constant(safe-area-inset-bottom));
  padding: 20rpx 32rpx calc(40rpx + env(safe-area-inset-bottom));
}

.card {
  margin-bottom: 20rpx;
}

.sp__who {
  flex-direction: row;
  align-items: center;
  gap: 24rpx;
}

.sp__avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: var(--c-fill-3);
  color: var(--c-text-weak);
  font-size: 30rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sp__who-text {
  gap: 6rpx;
}

.sp__name {
  font-size: 28rpx;
  font-weight: 800;
}

.sp__joined {
  font-size: 22rpx;
  color: var(--c-text-weaker);
}

.sp__roles {
  display: flex;
  gap: 16rpx;
}

.sp__role {
  flex: 1;
  text-align: center;
  border: 3rpx solid var(--c-line-2);
  border-radius: 28rpx;
  padding: 18rpx 0;
  font-size: 25rpx;
  font-weight: 600;
  color: var(--c-text-2);
}

.sp__role--on {
  border-color: var(--c-primary);
  background: var(--c-primary-bg);
  color: var(--c-primary);
  font-weight: 800;
}

.sp__line {
  margin-bottom: 20rpx;
}

.sp__perm {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.sp__perm-label {
  font-size: 27rpx;
  font-weight: 700;
}

.sp__remove {
  align-items: center;
}

.sp__remove-text {
  font-size: 27rpx;
  font-weight: 800;
  color: var(--c-danger);
}
</style>
