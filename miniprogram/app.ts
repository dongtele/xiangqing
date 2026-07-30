import { userStore } from './store/user';
import type { Role } from './models/index';

App<IAppOption>({
  globalData: {
    statusBarHeight: 44,
    navBarHeight: 44,
    menuLeft: 281,
    role: 'customer',
    user: null,
  },

  onLaunch() {
    const win = wx.getWindowInfo();
    const menu = wx.getMenuButtonBoundingClientRect();
    this.globalData.statusBarHeight = win.statusBarHeight || 44;
    // 自定义导航栏内容行：与胶囊按钮垂直居中对齐
    this.globalData.navBarHeight = menu.height
      ? menu.height + (menu.top - this.globalData.statusBarHeight) * 2
      : 44;
    this.globalData.menuLeft = menu.left || 281;

    const { role, profile } = userStore.get();
    this.globalData.role = role;
    this.globalData.user = profile;
  },

  /** 登录后按角色分流（顾客端 / 商家端各有独立 TabBar） */
  gotoRoleHome(role: Role) {
    this.globalData.role = role;
    wx.reLaunch({
      url:
        role === 'merchant'
          ? '/pages/merchant/dashboard/index'
          : '/pages/customer/menu/index',
    });
  },
});
