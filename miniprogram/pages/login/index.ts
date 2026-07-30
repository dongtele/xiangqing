import { login } from '../../services/api';
import { chrome } from '../../utils/chrome';
import { userStore } from '../../store/user';
import { relaunch, toast } from '../../utils/nav';

/** 13 · 微信授权登录 —— 支持「先逛后登」，下单时再触发授权 */
Page({
  data: {
    topPad: 170,
    permissions: [
      { title: '获取你的手机号', sub: '用于账户服务及订单联系' },
      { title: '获取你的昵称、头像', sub: '用于个人中心展示' },
    ],
    loading: false,
  },

  onLoad() {
    this.setData({ topPad: chrome().capsuleBottom + 90 });
    if (userStore.get().logged) {
      // 已登录：直接按角色分流，不再停留在授权页
      getApp<IAppOption>().gotoRoleHome(userStore.get().role);
    }
  },

  /** 真机上由 <button open-type="getPhoneNumber"> 触发；此处 mock 换取用户资料 */
  async onGetPhone(e: WechatMiniprogram.CustomEvent) {
    const detail = e.detail as { errMsg?: string };
    if (detail && detail.errMsg && detail.errMsg.indexOf('ok') < 0) {
      toast('已取消授权，可先逛逛再登录');
      return;
    }
    if (this.data.loading) return;
    this.setData({ loading: true });
    try {
      const profile = await login();
      userStore.login(profile, 'customer');
      getApp<IAppOption>().globalData.user = profile;
      getApp<IAppOption>().gotoRoleHome('customer');
    } finally {
      this.setData({ loading: false });
    }
  },

  onSkip() {
    relaunch('/pages/customer/menu/index');
  },

  onAgreement() {
    toast('协议详情见「关于美味坊」（78）');
  },
});
