/// <reference path="../node_modules/miniprogram-api-typings/index.d.ts" />

import type { Role, UserProfile } from '../miniprogram/models/index';

declare global {
  interface IAppOption {
    globalData: {
      /** 状态栏高度（px），用于自定义导航栏占位 */
      statusBarHeight: number;
      /** 自定义导航栏内容行高度（px） */
      navBarHeight: number;
      /** 胶囊按钮左边界（px），右侧操作区避让用 */
      menuLeft: number;
      role: Role;
      user: UserProfile | null;
    };
    /** 登录成功后按角色分流 */
    gotoRoleHome(role: Role): void;
  }
}
