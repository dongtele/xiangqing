<script setup lang="ts">
import { computed } from 'vue';
import { relaunch } from '@/utils/nav';
import { useUserStore } from '@/stores/user';
import type { Role } from '@/models';

interface TabDef {
  key: string;
  label: string;
  icon: string;
  url: string;
}

/**
 * 双角色 TabBar。
 * 顾客端 3 项、商家端 4 项，共 7 个 tab 页 —— 超过 pages.json tabBar.list 的 5 项上限，
 * 因此不使用原生 tabBar：每个 tab 页自行挂载本组件，切换用 reLaunch 清栈。
 *
 * 顾客端按设计稿是 3 项（点餐 / 订单 / 我的）：交付文档正文写的是 4 项，
 * 但 MiniTabBar 与全部顾客端原型屏都是 3 项，消息通知(37) 的入口写的是「从『我的』进入」。
 */
const TABS: Record<Role, TabDef[]> = {
  customer: [
    { key: 'menu', label: '点餐', icon: 'menu', url: '/pages/customer/menu/index' },
    { key: 'orders', label: '订单', icon: 'order', url: '/pages/customer/orders/index' },
    { key: 'profile', label: '我的', icon: 'user', url: '/pages/customer/profile/index' },
  ],
  merchant: [
    { key: 'dashboard', label: '工作台', icon: 'grid', url: '/pages/merchant/dashboard/index' },
    { key: 'orders', label: '订单', icon: 'order', url: '/pages/merchant/orders/index' },
    { key: 'goods', label: '商品', icon: 'box', url: '/pages/merchant/goods/index' },
    { key: 'shop', label: '店铺', icon: 'shop', url: '/pages/merchant/shop/index' },
  ],
};

const ACTIVE = '#FF4A17';
const IDLE = '#A39890';

const props = withDefaults(
  defineProps<{
    /** customer / merchant；不传则跟随登录角色 */
    role?: Role | '';
    active?: string;
  }>(),
  { role: '', active: '' }
);

const user = useUserStore();

const tabs = computed(() => {
  const role = (props.role || user.role) as Role;
  return TABS[role].map((t) => ({
    ...t,
    on: t.key === props.active,
    color: t.key === props.active ? ACTIVE : IDLE,
  }));
});

function onTap(url: string, on: boolean): void {
  if (on) return;
  relaunch(url);
}
</script>

<template>
  <view class="tabbar">
    <view
      v-for="t in tabs"
      :key="t.key"
      class="tabbar__item tap-sm"
      @tap="onTap(t.url, t.on)"
    >
      <wf-icon :name="t.icon" :size="46" :color="t.color" />
      <text class="tabbar__label" :style="{ color: t.color }">{{ t.label }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 20;
  padding: 16rpx 16rpx 0;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
  height: calc(100rpx + constant(safe-area-inset-bottom));
  height: calc(100rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.97);
  border-top: 1px solid #f0eae3;
  backdrop-filter: blur(10px);
  display: flex;
  align-items: stretch;
}

.tabbar__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
  padding-top: 8rpx;
}

.tabbar__label {
  font-size: 21rpx;
  font-weight: 600;
  line-height: 1;
}
</style>
