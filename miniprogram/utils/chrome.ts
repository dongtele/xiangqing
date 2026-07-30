/** 顶部系统区域度量：状态栏 + 胶囊按钮，用于自定义导航栏 / 沉浸式头部占位。 */
export interface ChromeMetrics {
  statusBarHeight: number;
  navBarHeight: number;
  /** 胶囊按钮下边界（px），沉浸式头部内容从这条线以下开始 */
  capsuleBottom: number;
}

export function chrome(): ChromeMetrics {
  const app = getApp<IAppOption>();
  const statusBarHeight = app ? app.globalData.statusBarHeight : 44;
  const navBarHeight = app ? app.globalData.navBarHeight : 44;
  return {
    statusBarHeight,
    navBarHeight,
    capsuleBottom: statusBarHeight + 36,
  };
}
