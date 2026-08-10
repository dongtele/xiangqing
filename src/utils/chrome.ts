/**
 * 顶部系统区域度量：状态栏 + 胶囊按钮，用于自定义导航栏 / 沉浸式头部占位。
 * 设计稿把这块写死成 96px，实际要按机型算，才能在任何设备上对齐胶囊按钮。
 */
export interface ChromeMetrics {
  statusBarHeight: number;
  /** 导航内容行高度，与胶囊按钮垂直居中对齐 */
  navBarHeight: number;
  /** 胶囊按钮下边界（px），沉浸式头部内容从这条线以下开始 */
  capsuleBottom: number;
  /** 胶囊按钮左边界（px），右侧操作区不能越过它 */
  menuLeft: number;
}

const fallback: ChromeMetrics = {
  statusBarHeight: 44,
  navBarHeight: 44,
  capsuleBottom: 80,
  menuLeft: 281,
};

let metrics: ChromeMetrics = { ...fallback };

export function initChrome(): ChromeMetrics {
  const win = uni.getWindowInfo();
  const statusBarHeight = win.statusBarHeight || fallback.statusBarHeight;
  let navBarHeight = fallback.navBarHeight;
  let menuLeft = fallback.menuLeft;
  let capsuleBottom = statusBarHeight + 36;

  // #ifdef MP-WEIXIN
  const menu = uni.getMenuButtonBoundingClientRect();
  if (menu && menu.height) {
    navBarHeight = menu.height + (menu.top - statusBarHeight) * 2;
    menuLeft = menu.left;
    capsuleBottom = menu.top + menu.height;
  }
  // #endif

  metrics = { statusBarHeight, navBarHeight, capsuleBottom, menuLeft };
  return metrics;
}

export function chrome(): ChromeMetrics {
  return metrics;
}
