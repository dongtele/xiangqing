import { chrome } from '../../../utils/chrome';
import { relaunch, toast } from '../../../utils/nav';
import { userStore } from '../../../store/user';
import type { UserProfile } from '../../../models/index';

/** 07 · 我的（个人中心）—— 角色分流入口在此 */
Page({
  data: {
    headPad: 104,
    profile: null as UserProfile | null,
    avatarText: '客',
    isMerchant: false,
    quick: [
      { key: 'unpaid', label: '待付款', icon: 'card', badge: 0, tab: 'ongoing' },
      { key: 'ongoing', label: '进行中', icon: 'clock', badge: 1, tab: 'ongoing' },
      { key: 'toComment', label: '待评价', icon: 'star', badge: 0, tab: 'toComment' },
      { key: 'aftersale', label: '退款售后', icon: 'headset', badge: 0, tab: 'aftersale' },
    ],
    cells: [
      { key: 'address', label: '地址管理', value: '', primary: false },
      { key: 'coupon', label: '优惠券', value: '2张可用', primary: true },
      { key: 'contact', label: '联系商家', value: '', primary: false },
      { key: 'about', label: '关于小店', value: '', primary: false },
    ],
  },

  unsubscribe: null as null | (() => void),

  onLoad() {
    this.setData({ headPad: chrome().capsuleBottom + 24 });
    this.unsubscribe = userStore.subscribe((s) => {
      this.setData({
        profile: s.profile,
        avatarText: s.profile ? s.profile.nickname.slice(-1) : '客',
        isMerchant: !!(s.profile && s.profile.isMerchant),
      });
    });
  },

  onUnload() {
    this.unsubscribe && this.unsubscribe();
  },

  onTapOrders(e: WechatMiniprogram.TouchEvent) {
    const { tab } = e.currentTarget.dataset as { tab: string };
    relaunch(`/pages/customer/orders/index?tab=${tab}`);
  },

  onAllOrders() {
    relaunch('/pages/customer/orders/index?tab=all');
  },

  /** 商家管理：切到商家端工作台（12 有「切换到顾客视角」回来） */
  onEnterMerchant() {
    if (!this.data.isMerchant) {
      toast('入驻引导（26）在后续步骤实现');
      return;
    }
    userStore.switchRole('merchant');
    getApp<IAppOption>().gotoRoleHome('merchant');
  },

  onTapCell(e: WechatMiniprogram.TouchEvent) {
    const { key } = e.currentTarget.dataset as { key: string };
    const map: Record<string, string> = {
      address: '地址管理（38）',
      coupon: '我的卡券（39）',
      contact: '在线客服（41）',
      about: '关于美味坊（78）',
    };
    toast(`${map[key] || '该页面'}在后续步骤实现`);
  },
});
