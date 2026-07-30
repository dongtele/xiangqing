/** 导航封装：统一收口，便于后续加埋点 / 登录拦截。 */

export function push(url: string): void {
  wx.navigateTo({ url });
}

export function replace(url: string): void {
  wx.redirectTo({ url });
}

/** tab 页之间切换 / 角色切换：清栈重入 */
export function relaunch(url: string): void {
  wx.reLaunch({ url });
}

export function back(delta = 1): void {
  const pages = getCurrentPages();
  if (pages.length <= 1) {
    relaunch('/pages/customer/menu/index');
    return;
  }
  wx.navigateBack({ delta });
}

export function toast(title: string, icon: 'none' | 'success' | 'error' = 'none'): void {
  wx.showToast({ title, icon, duration: 1600 });
}
