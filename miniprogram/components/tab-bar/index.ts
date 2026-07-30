import { relaunch } from '../../utils/nav';
import { userStore } from '../../store/user';
import type { Role } from '../../models/index';

interface TabDef {
  key: string;
  label: string;
  icon: string;
  url: string;
}

/**
 * 双角色 TabBar。
 * 顾客端 3 项、商家端 4 项，共 7 个 tab 页 —— 超过 app.json tabBar.list 的 5 项上限，
 * 因此不使用原生 tabBar：每个 tab 页自行挂载本组件，切换用 reLaunch 清栈。
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

Component({
  properties: {
    /** customer / merchant；不传则跟随登录角色 */
    role: { type: String, value: '' },
    active: { type: String, value: '' },
  },

  data: {
    tabs: [] as (TabDef & { color: string; on: boolean })[],
  },

  observers: {
    'role, active': function build() {
      const role = (this.properties.role || userStore.get().role) as Role;
      const active = this.properties.active;
      this.setData({
        tabs: TABS[role].map((t) => ({
          ...t,
          on: t.key === active,
          color: t.key === active ? ACTIVE : IDLE,
        })),
      });
    },
  },

  methods: {
    onTap(e: WechatMiniprogram.TouchEvent) {
      const { url, on } = e.currentTarget.dataset as { url: string; on: boolean };
      if (on) return;
      relaunch(url);
    },
  },
});
