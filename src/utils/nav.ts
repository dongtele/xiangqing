import type { Role } from '@/models';

/** 导航封装：统一收口，便于后续加埋点 / 登录拦截。 */

export function push(url: string): void {
  uni.navigateTo({ url });
}

export function replace(url: string): void {
  uni.redirectTo({ url });
}

/** tab 页之间切换 / 角色切换：清栈重入（TabBar 是自定义的，不能用 switchTab） */
export function relaunch(url: string): void {
  uni.reLaunch({ url });
}

export function back(delta = 1): void {
  const pages = getCurrentPages();
  if (pages.length <= 1) {
    relaunch('/pages/customer/menu/index');
    return;
  }
  uni.navigateBack({ delta });
}

export function toast(title: string, icon: 'none' | 'success' | 'error' = 'none'): void {
  uni.showToast({ title, icon, duration: 1600 });
}

/** 登录后按角色分流（顾客端 / 商家端各有独立 TabBar） */
export function gotoRoleHome(role: Role): void {
  relaunch(
    role === 'merchant' ? '/pages/merchant/dashboard/index' : '/pages/customer/menu/index'
  );
}

/** 指向后续步骤的入口：不做无声失效，明确告知所属屏号 */
export function todo(screen: string, name: string): void {
  toast(`${name}（${screen}）属后续步骤`);
}
